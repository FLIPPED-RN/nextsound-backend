import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { Track } from './entities/track.entity';
import { Play } from './entities/play.entity';
import { Repost } from './entities/repost.entity';
import { User } from '../users/entities/user.entity';
import { TracksController } from './tracks.controller';
import { TracksService } from './tracks.service';
import { LikesModule } from '../likes/likes.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Track, Play, Repost, User]),
    NotificationsModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = file.fieldname === 'cover' ? './uploads/covers' : './uploads/audio';
          mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
    LikesModule
  ],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule { }