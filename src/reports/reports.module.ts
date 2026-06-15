import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './entities/report.entity';
import { Track } from '../tracks/entities/track.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Track])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule { }
