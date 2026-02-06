import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Roles(UserRole.INSPECTOR, UserRole.OC, UserRole.ADMIN)
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatService.create(createChatDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findAll(@Query('userUnitId') userUnitId?: string) {
    return this.chatService.findAll(userUnitId);
  }

  @Get('unread/:userUnitId')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  getUnreadCount(@Param('userUnitId') userUnitId: string) {
    return this.chatService.getUnreadCount(userUnitId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findOne(@Param('id') id: string) {
    return this.chatService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    return this.chatService.update(id, updateChatDto);
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  markAsRead(@Param('id') id: string) {
    return this.chatService.markAsRead(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.chatService.remove(id);
  }
}
