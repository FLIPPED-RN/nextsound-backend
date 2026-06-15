import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { extname } from 'path';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket = process.env.S3_BUCKET || '';
  private readonly endpoint = (process.env.S3_ENDPOINT || '').replace(/\/$/, '');
  private readonly publicUrl =
    (process.env.S3_PUBLIC_URL || `${this.endpoint}/${this.bucket}`).replace(/\/$/, '');

  constructor() {
    this.client = new S3Client({
      region: process.env.S3_REGION || 'ru-1',
      endpoint: this.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || '',
        secretAccessKey: process.env.S3_SECRET_KEY || '',
      },
    });
  }

  private keyFor(folder: string, originalName: string): string {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    return `${folder}/${unique}${extname(originalName)}`;
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const key = this.keyFor(folder, file.originalname);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      }),
    );
    return `${this.publicUrl}/${key}`;
  }

  private keyFromUrl(url?: string | null): string | null {
    if (!url) return null;
    if (!url.startsWith('http')) return null;
    const prefix = `${this.publicUrl}/`;
    if (url.startsWith(prefix)) return url.slice(prefix.length);
    const marker = `/${this.bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) return url.slice(idx + marker.length);
    return null;
  }

  async deleteByUrl(url?: string | null): Promise<void> {
    const key = this.keyFromUrl(url);
    if (!key) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (e) {
      this.logger.warn(`Не удалось удалить ${key}: ${(e as Error).message}`);
    }
  }

  async folderSize(prefix: string): Promise<number> {
    let total = 0;
    let token: string | undefined;
    do {
      const res = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: `${prefix}/`,
          ContinuationToken: token,
        }),
      );
      for (const obj of res.Contents || []) total += obj.Size || 0;
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return total;
  }
}
