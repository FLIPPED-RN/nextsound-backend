import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';
import { Track } from '../tracks/entities/track.entity';
import { Play } from '../tracks/entities/play.entity';
import { Like } from '../likes/entities/like.entity';
import { Comment } from '../comments/entities/comment.entity';
import { Playlist } from '../playlists/entities/playlist.entity';
import { PlaylistTrack } from '../playlists/entities/playlist-track.entity';
import { TracksModule } from '../tracks/tracks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Track, Play, Like, Comment, Playlist, PlaylistTrack]),
    TracksModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }
