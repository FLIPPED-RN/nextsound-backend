import { Module } from '@nestjs/common';
import { TracksModule } from '../tracks/tracks.module';
import { OgController } from './og.controller';

@Module({
  imports: [TracksModule],
  controllers: [OgController],
})
export class OgModule { }
