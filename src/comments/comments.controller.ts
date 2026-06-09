import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('tracks')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/comments')
  async create(
    @Param('id') trackId: number,
    @Request() req,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(req.user.id, trackId, dto);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id/comments')
  async findByTrack(@Param('id') trackId: number, @Request() req) {
    return this.commentsService.findByTrack(trackId, req.user?.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':trackId/comments/:commentId/like')
  async like(@Param('commentId') commentId: number, @Request() req) {
    return this.commentsService.toggleLike(req.user.id, commentId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':trackId/comments/:commentId')
  async remove(@Param('commentId') id: number, @Request() req) {
    await this.commentsService.remove(id, req.user.id);
    return { message: 'Комментарий удалён' };
  }
}
