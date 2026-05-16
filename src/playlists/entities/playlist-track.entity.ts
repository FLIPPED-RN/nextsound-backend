import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Playlist } from './playlist.entity';
import { Track } from '../../tracks/entities/track.entity';

@Entity()
export class PlaylistTrack {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Playlist)
  playlist!: Playlist;

  @Column()
  playlistId!: number;

  @ManyToOne(() => Track)
  track!: Track;

  @Column()
  trackId!: number;
}