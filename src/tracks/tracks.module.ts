import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { Track } from './entities/track.entity';
import { Play } from './entities/play.entity';
import { Repost } from './entities/repost.entity';
import { User } from '../users/entities/user.entity';
import { Follow } from '../users/entities/follow.entity';
import { Album } from '../albums/entities/album.entity';
import { TracksController } from './tracks.controller';
import { TracksService } from './tracks.service';
import { LikesModule } from '../likes/likes.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Track, Play, Repost, User, Follow, Album]),
    NotificationsModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ok = file.fieldname === 'cover'
          ? file.mimetype.startsWith('image/')
          : file.mimetype.startsWith('audio/');
        cb(ok ? null : new BadRequestException('Недопустимый тип файла'), ok);
      },
    }),
    LikesModule
  ],
  controllers: [TracksController],
  providers: [TracksService],
  exports: [TracksService],
})
export class TracksModule { }