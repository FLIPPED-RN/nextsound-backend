import { Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  list(@Request() req) {
    return this.notificationsService.list(req.user.id);
  }

  @Get('unread-count')
  unread(@Request() req) {
    return this.notificationsService.unreadCount(req.user.id);
  }

  @Patch('read')
  markRead(@Request() req) {
    return this.notificationsService.markAllRead(req.user.id);
  }
}
