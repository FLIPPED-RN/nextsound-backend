import { Body, Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { AdminService } from './admin.service';

@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('stats')
  stats() {
    return this.adminService.getStats();
  }

  @Get('tracks')
  tracks() {
    return this.adminService.listTracks();
  }

  @Delete('tracks/:id')
  deleteTrack(@Param('id') id: number) {
    return this.adminService.deleteTrack(id);
  }

  @Patch('tracks/:id/featured')
  setFeatured(@Param('id') id: number, @Body('featured') featured: boolean) {
    return this.adminService.setFeatured(id, featured);
  }

  @Get('users')
  users() {
    return this.adminService.listUsers();
  }

  @Patch('users/:id/role')
  setRole(@Param('id') id: number, @Body('role') role: string) {
    return this.adminService.setRole(id, role);
  }

  @Patch('users/:id/artist-verified')
  setArtistVerified(@Param('id') id: number, @Body('verified') verified: boolean) {
    return this.adminService.setArtistVerified(id, verified);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: number) {
    return this.adminService.deleteUser(id);
  }

  @Get('comments')
  comments() {
    return this.adminService.listComments();
  }

  @Delete('comments/:id')
  deleteComment(@Param('id') id: number) {
    return this.adminService.deleteComment(id);
  }
}
