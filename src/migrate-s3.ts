import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as mysql from 'mysql2/promise';
import { existsSync, readFileSync } from 'fs';
import { extname, basename } from 'path';

const endpoint = (process.env.S3_ENDPOINT || '').replace(/\/$/, '');
const bucket = process.env.S3_BUCKET || '';
const publicUrl = (process.env.S3_PUBLIC_URL || `${endpoint}/${bucket}`).replace(/\/$/, '');

const s3 = new S3Client({
  region: process.env.S3_REGION || 'ru-1',
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || '',
    secretAccessKey: process.env.S3_SECRET_KEY || '',
  },
});

const MIME: Record<string, string> = {
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.flac': 'audio/flac',
  '.m4a': 'audio/mp4', '.ogg': 'audio/ogg',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.gif': 'image/gif',
};

async function uploadLocal(localPath: string, folder: string): Promise<string | null> {
  if (!localPath || localPath.startsWith('http')) return null;
  const rel = localPath.replace(/^\.?\//, '');
  if (!existsSync(rel)) {
    console.warn(`  пропуск (нет файла): ${rel}`);
    return null;
  }
  const ext = extname(rel).toLowerCase();
  const key = `${folder}/${basename(rel)}`;
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: readFileSync(rel),
    ContentType: MIME[ext] || 'application/octet-stream',
    ACL: 'public-read',
  }));
  return `${publicUrl}/${key}`;
}

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  let migrated = 0;

  const [tracks] = (await db.query('SELECT id, file_path, cover_path FROM track')) as any;
  for (const t of tracks) {
    const audio = await uploadLocal(t.file_path, 'audio');
    const cover = await uploadLocal(t.cover_path, 'covers');
    if (audio || cover) {
      await db.execute('UPDATE track SET file_path = ?, cover_path = ? WHERE id = ?', [
        audio || t.file_path,
        cover || t.cover_path,
        t.id,
      ]);
      migrated++;
      console.log(`трек #${t.id} → S3`);
    }
  }

  const [users] = (await db.query('SELECT id, avatar FROM user')) as any;
  for (const u of users) {
    const avatar = await uploadLocal(u.avatar, 'avatars');
    if (avatar) {
      await db.execute('UPDATE user SET avatar = ? WHERE id = ?', [avatar, u.id]);
      migrated++;
      console.log(`аватар #${u.id} → S3`);
    }
  }

  console.log(`\nГотово. Перенесено записей: ${migrated}`);
  await db.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
