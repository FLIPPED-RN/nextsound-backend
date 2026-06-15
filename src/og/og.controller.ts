import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TracksService } from '../tracks/tracks.service';

const SITE = 'https://24nextsound.ru';

function esc(s?: string | null): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

@Controller('og')
export class OgController {
  constructor(private readonly tracksService: TracksService) { }

  @Get('track/:id')
  async ogTrack(@Param('id') id: number, @Res() res: Response) {
    let track;
    try {
      track = await this.tracksService.findOne(id);
    } catch {
      res.redirect(SITE);
      return;
    }

    const artist =
      track.user?.nickname ||
      [track.user?.firstName, track.user?.lastName].filter(Boolean).join(' ') ||
      'NextSound';
    const title = esc(`${track.title} — ${artist}`);
    const desc = esc((track.description || '').slice(0, 180) || `Слушай «${track.title}» от ${artist} на NextSound`);
    const cover = esc(track.cover_path || `${SITE}/NextSoundLogo.png`);
    const audio = esc(track.file_path || '');
    const url = `${SITE}/track/${track.id}`;

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="music.song">
<meta property="og:site_name" content="NextSound">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${cover}">
<meta property="og:image:width" content="600">
<meta property="og:image:height" content="600">
<meta property="og:url" content="${url}">
<meta property="og:audio" content="${audio}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${cover}">
<meta http-equiv="refresh" content="0; url=${url}">
<link rel="canonical" href="${url}">
</head>
<body>Открываю <a href="${url}">${title}</a> на NextSound…</body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(html);
  }
}
