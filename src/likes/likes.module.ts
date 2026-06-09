import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { Track } from '../tracks/entities/track.entity';
import { LikesService } from './likes.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Track]), NotificationsModule],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
