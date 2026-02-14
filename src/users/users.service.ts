import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Workshop } from '../workshop/entities/workshop.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Workshop)
    private workshopRepository: Repository<Workshop>,
    private supabaseService: SupabaseService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Verify workshop exists
    const workshop = await this.workshopRepository.findOne({
      where: { id: createUserDto.workshop_id },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await this.supabaseService.signUp(
        createUserDto.email,
        createUserDto.password,
        {
          full_name: createUserDto.full_name,
          avatar_url: createUserDto.avatar_url,
        },
      );

    if (authError) {
      throw new ConflictException(authError.message);
    }

    if (!authData.user) {
      throw new ConflictException('Failed to create user in Supabase');
    }

    // Create user in our database
    const user = this.userRepository.create({
      id: authData.user.id,
      email: createUserDto.email,
      full_name: createUserDto.full_name,
      avatar_url: createUserDto.avatar_url,
      role: createUserDto.role,
      workshop_id: createUserDto.workshop_id,
      is_active: createUserDto.is_active ?? true,
    });

    const savedUser = await this.userRepository.save(user);

    // Automatically assign user to their role in the workshop
    await this.assignUserToWorkshopRole(savedUser, workshop);

    return savedUser;
  }

  private async assignUserToWorkshopRole(
    user: User,
    workshop: Workshop,
  ): Promise<void> {
    let roleFieldUpdated = false;

    switch (user.role) {
      case UserRole.INSPECTOR_RI_AND_I:
        if (workshop.inspector_id && workshop.inspector_id !== user.id) {
          throw new BadRequestException(
            'Workshop already has an inspector assigned',
          );
        }
        workshop.inspector_id = user.id;
        roleFieldUpdated = true;
        break;

      case UserRole.STORE_MAN:
        if (workshop.store_man_id && workshop.store_man_id !== user.id) {
          throw new BadRequestException(
            'Workshop already has a store man assigned',
          );
        }
        workshop.store_man_id = user.id;
        roleFieldUpdated = true;
        break;

      case UserRole.CAPTAIN:
        if (workshop.captain_id && workshop.captain_id !== user.id) {
          throw new BadRequestException(
            'Workshop already has a captain assigned',
          );
        }
        workshop.captain_id = user.id;
        roleFieldUpdated = true;
        break;

      case UserRole.OC:
        if (workshop.oc_id && workshop.oc_id !== user.id) {
          throw new BadRequestException('Workshop already has an OC assigned');
        }
        workshop.oc_id = user.id;
        roleFieldUpdated = true;
        break;

      case UserRole.ADMIN:
        // Admin doesn't need to be assigned to a workshop role
        break;
    }

    if (roleFieldUpdated) {
      await this.workshopRepository.save(workshop);
    }
  }

  async findAll(): Promise<any[]> {
    const users = await this.userRepository.find({
      select: [
        'id',
        'email',
        'full_name',
        'role',
        'workshop_id',
        'is_active',
        'created_at',
      ],
      where: { is_active: true },
    });

    return users;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, is_active: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.is_active = false;
    await this.userRepository.save(user);
  }
}
