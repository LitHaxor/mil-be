import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { GetUser } from '../decorators/get-user.decorator';
import { UserRole, User } from '../entities/user.entity';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Roles(UserRole.INSPECTOR_RI_AND_I, UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create chat message', description: 'Send a new chat message for a user unit' })
  @ApiResponse({ status: 201, description: 'Chat message created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatService.create(createChatDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({ summary: 'Get all chat messages', description: 'Retrieve all chat messages, optionally filtered by user unit' })
  @ApiQuery({ name: 'userUnitId', required: false, description: 'Filter by user unit ID' })
  @ApiResponse({ status: 200, description: 'Returns list of chat messages' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Query('userUnitId') userUnitId?: string) {
    return this.chatService.findAll(userUnitId);
  }

  @Get('unread/:userUnitId')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({ summary: 'Get unread message count', description: 'Get count of unread messages for a user unit' })
  @ApiParam({ name: 'userUnitId', description: 'User unit ID' })
  @ApiResponse({ status: 200, description: 'Returns unread message count' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getUnreadCount(@Param('userUnitId') userUnitId: string) {
    return this.chatService.getUnreadCount(userUnitId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({ summary: 'Get chat message by ID', description: 'Retrieve a specific chat message by ID' })
  @ApiParam({ name: 'id', description: 'Chat message ID' })
  @ApiResponse({ status: 200, description: 'Returns the chat message' })
  @ApiResponse({ status: 404, description: 'Chat message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Param('id') id: string) {
    return this.chatService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update chat message', description: 'Update a chat message by ID' })
  @ApiParam({ name: 'id', description: 'Chat message ID' })
  @ApiResponse({ status: 200, description: 'Chat message updated successfully' })
  @ApiResponse({ status: 404, description: 'Chat message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto) {
    return this.chatService.update(id, updateChatDto);
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR_RI_AND_I)
  @ApiOperation({ summary: 'Mark message as seen', description: 'Add current user to seen_by array' })
  @ApiParam({ name: 'id', description: 'Chat message ID' })
  @ApiResponse({ status: 200, description: 'User added to seen_by' })
  @ApiResponse({ status: 404, description: 'Chat message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  markAsRead(@Param('id') id: string, @GetUser() user: User) {
    return this.chatService.markAsRead(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete chat message', description: 'Delete a chat message by ID' })
  @ApiParam({ name: 'id', description: 'Chat message ID' })
  @ApiResponse({ status: 200, description: 'Chat message deleted successfully' })
  @ApiResponse({ status: 404, description: 'Chat message not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  remove(@Param('id') id: string) {
    return this.chatService.remove(id);
  }
}
