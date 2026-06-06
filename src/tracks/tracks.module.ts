import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Track } from './entities/track.entity';
import { Play } from './entities/play.entity';
import { TracksController } from './tracks.controller';
import { TracksService } from './tracks.service';
import { LikesModule } from '../likes/likes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Track, Play]),
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (file.fieldname === 'cover') {
            cb(null, './uploads/covers');
          } else {
            cb(null, './uploads/audio');
          }
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