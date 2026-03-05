import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
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
    // prevent double creation due to concurrent requests by repeating checks
    // inside a transaction later

    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if BA number already exists
    const existingBaUser = await this.userRepository.findOne({
      where: { user_ba_no: createUserDto.user_ba_no },
    });
    if (existingBaUser) {
      throw new ConflictException('User with this BA Number already exists');
    }

    // Verify workshop exists
    const workshop = await this.workshopRepository.findOne({
      where: { id: createUserDto.workshop_id },
    });

    if (!workshop) {
      throw new NotFoundException('Workshop not found');
    }

    // initial validation before hitting external service
    this.validateWorkshopRoleAssignment(createUserDto.role, workshop);

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

    // Create user in our database and assign workshop role within a transaction
    // so that we avoid races and can roll back if another request inserts the
    // same role at the same time. If anything fails after this point we also
    // remove the Supabase user to keep systems in sync.
    let savedUser: User;
    try {
      savedUser = await this.userRepository.manager.transaction(
        async (manager) => {
          // save user first
          const newUser = manager.create(User, {
            id: authData.user.id,
            email: createUserDto.email,
            user_ba_no: createUserDto.user_ba_no,
            full_name: createUserDto.full_name,
            avatar_url: createUserDto.avatar_url,
            role: createUserDto.role,
            workshop_id: createUserDto.workshop_id,
            is_active: createUserDto.is_active ?? true,
          });

          const inserted = await manager.save(newUser);

          // refresh workshop row under the same transaction to re-check
          const freshWorkshop = await manager.findOne(Workshop, {
            where: { id: workshop.id },
          });
          // re-validate in case another request assigned the role concurrently
          this.validateWorkshopRoleAssignment(createUserDto.role, freshWorkshop!);

          // perform the assignment using the transactional manager
          await this.assignUserToWorkshopRole(inserted, freshWorkshop!, manager);

          return inserted;
        },
      );
    } catch (err) {
      // rollback supabase user if we created one successfully
      try {
        await this.supabaseService.deleteUser(authData.user.id);
      } catch (e) {
        // log but don't swallow original error
        console.error('failed to clean up supabase user', e);
      }
      throw err;
    }

    return savedUser;
  }

  private validateWorkshopRoleAssignment(role: UserRole, workshop: Workshop): void {
    switch (role) {
      case UserRole.INSPECTOR_RI_AND_I:
        if (workshop.inspector_id) {
          throw new BadRequestException(
            'Workshop already has an inspector assigned',
          );
        }
        break;

      case UserRole.STORE_MAN:
        if (workshop.store_man_id) {
          throw new BadRequestException(
            'Workshop already has a store man assigned',
          );
        }
        break;

      case UserRole.CME:
        // CME role can be assigned to multiple users
        break;

      case UserRole.CAPTAIN:
        if (workshop.captain_id) {
          throw new BadRequestException(
            'Workshop already has a captain assigned',
          );
        }
        break;

      case UserRole.OC:
        if (workshop.oc_id) {
          throw new BadRequestException('Workshop already has an OC assigned');
        }
        break;

      case UserRole.ADMIN:
        // Admin doesn't need to be assigned to a workshop role
        break;
    }
  }

  /**
   * Assigns a user to the corresponding workshop role.  A `manager` can be
   * supplied to perform the update inside a transaction; if omitted the
   * standard repository is used.
   */
  private async assignUserToWorkshopRole(
    user: User,
    workshop: Workshop,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Workshop) : this.workshopRepository;
    let roleFieldUpdated = false;

    switch (user.role) {
      case UserRole.INSPECTOR_RI_AND_I:
        workshop.inspector_id = user.id;
        roleFieldUpdated = true;
        break;

      case UserRole.STORE_MAN:
        workshop.store_man_id = user.id;
        roleFieldUpdated = true;
        break;

      case UserRole.CME:
        workshop.cme_id = user.id;
        roleFieldUpdated = true;
        break;

      case UserRole.CAPTAIN:
        workshop.captain_id = user.id;
        roleFieldUpdated = true;
        break;

      case UserRole.OC:
        workshop.oc_id = user.id;
        roleFieldUpdated = true;
        break;

      case UserRole.ADMIN:
        // Admin doesn't need to be assigned to a workshop role
        break;
    }

    if (roleFieldUpdated) {
      // reload the workshop row just before saving to ensure we don't
      // overwrite a recently assigned role from another request
      const fresh = await repo.findOne({ where: { id: workshop.id } });
      if (fresh) {
        switch (user.role) {
          case UserRole.INSPECTOR_RI_AND_I:
            if (fresh.inspector_id && fresh.inspector_id !== user.id) {
              throw new BadRequestException(
                'Workshop already has an inspector assigned',
              );
            }
            break;
          case UserRole.STORE_MAN:
            if (fresh.store_man_id && fresh.store_man_id !== user.id) {
              throw new BadRequestException(
                'Workshop already has a store man assigned',
              );
            }
            break;
          case UserRole.CME:
            // CME role can be assigned to multiple users
            break;
          case UserRole.CAPTAIN:
            if (fresh.captain_id && fresh.captain_id !== user.id) {
              throw new BadRequestException(
                'Workshop already has a captain assigned',
              );
            }
            break;
          case UserRole.OC:
            if (fresh.oc_id && fresh.oc_id !== user.id) {
              throw new BadRequestException(
                'Workshop already has an OC assigned',
              );
            }
            break;
        }
      }

      await repo.save(workshop);
    }
  }

  async findAll(): Promise<any[]> {
    const users = await this.userRepository.find({
      select: [
        'id',
        'email',
        'user_ba_no',
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
