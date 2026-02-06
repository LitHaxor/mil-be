import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChatDto } from './dto/create-chat.dto';
import { UpdateChatDto } from './dto/update-chat.dto';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private chatRepository: Repository<ChatMessage>,
  ) {}

  async create(createChatDto: CreateChatDto): Promise<ChatMessage> {
    const message = this.chatRepository.create(createChatDto);
    return await this.chatRepository.save(message);
  }

  async findAll(userUnitId?: string): Promise<ChatMessage[]> {
    const where: any = {};
    if (userUnitId) where.user_unit_id = userUnitId;

    return await this.chatRepository.find({
      where,
      relations: ['sender', 'user_unit'],
      order: { created_at: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ChatMessage> {
    const message = await this.chatRepository.findOne({
      where: { id },
      relations: ['sender', 'user_unit'],
    });

    if (!message) {
      throw new NotFoundException(`Chat message with ID ${id} not found`);
    }

    return message;
  }

  async update(id: string, updateChatDto: UpdateChatDto): Promise<ChatMessage> {
    const message = await this.findOne(id);
    Object.assign(message, updateChatDto);
    return await this.chatRepository.save(message);
  }

  async markAsRead(id: string): Promise<ChatMessage> {
    const message = await this.findOne(id);
    message.is_read = true;
    return await this.chatRepository.save(message);
  }

  async remove(id: string): Promise<void> {
    await this.chatRepository.delete(id);
  }

  async getUnreadCount(userUnitId: string): Promise<number> {
    return await this.chatRepository.count({
      where: { user_unit_id: userUnitId, is_read: false },
    });
  }
}
