import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { Track } from '../tracks/entities/track.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reports: Repository<Report>,
    @InjectRepository(Track) private tracks: Repository<Track>,
  ) { }

  async create(userId: number, trackId: number, reason: string) {
    const text = (reason || '').trim();
    if (!text) throw new BadRequestException('Укажите причину жалобы');
    const track = await this.tracks.findOne({ where: { id: trackId } });
    if (!track) throw new NotFoundException('Трек не найден');
    await this.reports.save(this.reports.create({ userId, trackId, reason: text.slice(0, 500) }));
    return { ok: true };
  }
}
