import { BadRequestException, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { memoryStorage } from 'multer';
import { Playlist } from './entities/playlist.entity';
import { PlaylistTrack } from './entities/playlist-track.entity';
import { User } from '../users/entities/user.entity';
import { PlaylistsController } from './playlists.controller';
import { PlaylistsService } from './playlists.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Playlist, PlaylistTrack, User]),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const ok = file.mimetype.startsWith('image/');
        cb(ok ? null : new BadRequestException('Обложка должна быть изображением'), ok);
      },
    }),
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
})
export class PlaylistsModule { }