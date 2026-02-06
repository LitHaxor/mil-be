import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from '../supabase/supabase.service';
import { User, UserRole } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async login(loginDto: LoginDto) {
    // Authenticate with Supabase
    const { data, error } = await this.supabaseService.signIn(
      loginDto.email,
      loginDto.password,
    );

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Sync or update user in our database
    let user = await this.userRepository.findOne({
      where: { id: data.user.id },
    });

    if (!user) {
      user = this.userRepository.create({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || null,
        avatar_url: data.user.user_metadata?.avatar_url || null,
      });
      await this.userRepository.save(user);
    }

    // Generate our own JWT token
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        workshop_id: user.workshop_id,
      },
    };
  }

  async logout(accessToken: string) {
    const { error } = await this.supabaseService.signOut(accessToken);

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return { message: 'Logged out successfully' };
  }

  async validateUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, is_active: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  getUserPermissions(role: UserRole) {
    const permissions = {
      pages: [] as string[],
      features: {} as Record<string, any>,
      navigation: [] as Array<{ label: string; path: string; icon?: string }>,
    };

    switch (role) {
      case UserRole.ADMIN:
        permissions.pages = [
          'dashboard',
          'workshops',
          'users',
          'units',
          'inventory',
          'spare-parts',
          'consume-requests',
          'source-requests',
        ];
        permissions.features = {
          workshops: { canCreate: true, canEdit: true, canDelete: true, canView: true },
          users: { canCreate: true, canEdit: true, canDelete: true, canView: true },
          units: { canCreate: true, canEdit: true, canDelete: true, canView: true },
          inventory: { canCreate: true, canEdit: true, canDelete: true, canView: true, canAdjust: true },
          spareParts: { canCreate: true, canEdit: true, canDelete: true, canView: true },
          consumeRequests: { canCreate: true, canApprove: true, canReject: true, canView: true, canDelete: true },
          sourceRequests: { canCreate: true, canApprove: true, canMarkSourced: true, canView: true, canDelete: true },
          logBook: { canCreate: true, canEdit: true, canDelete: true, canView: true },
          chat: { canCreate: true, canView: true, canDelete: true },
        };
        permissions.navigation = [
          { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
          { label: 'Workshops', path: '/dashboard/workshops', icon: 'Building' },
          { label: 'Users', path: '/dashboard/users', icon: 'Users' },
          { label: 'Units', path: '/dashboard/units', icon: 'Truck' },
          { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package' },
          { label: 'Spare Parts', path: '/dashboard/spare-parts', icon: 'Wrench' },
          { label: 'Consume Requests', path: '/dashboard/consume-requests', icon: 'FileText' },
          { label: 'Source Requests', path: '/dashboard/source-requests', icon: 'ShoppingCart' },
        ];
        break;

      case UserRole.OC:
        permissions.pages = [
          'dashboard',
          'units',
          'inventory',
          'spare-parts',
          'consume-requests',
          'source-requests',
        ];
        permissions.features = {
          units: { canCreate: true, canEdit: true, canDelete: false, canView: true },
          inventory: { canCreate: true, canEdit: true, canDelete: false, canView: true, canAdjust: true },
          spareParts: { canCreate: true, canEdit: true, canDelete: false, canView: true },
          consumeRequests: { canCreate: true, canApprove: true, canReject: true, canView: true, canDelete: false },
          sourceRequests: { canCreate: true, canApprove: true, canMarkSourced: true, canView: true, canDelete: false },
          logBook: { canCreate: true, canEdit: true, canDelete: false, canView: true },
          chat: { canCreate: true, canView: true, canDelete: false },
        };
        permissions.navigation = [
          { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
          { label: 'Units', path: '/dashboard/units', icon: 'Truck' },
          { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package' },
          { label: 'Spare Parts', path: '/dashboard/spare-parts', icon: 'Wrench' },
          { label: 'Consume Requests', path: '/dashboard/consume-requests', icon: 'FileText' },
          { label: 'Source Requests', path: '/dashboard/source-requests', icon: 'ShoppingCart' },
        ];
        break;

      case UserRole.INSPECTOR:
        permissions.pages = [
          'dashboard',
          'units',
          'inventory',
          'consume-requests',
        ];
        permissions.features = {
          units: { canCreate: true, canEdit: false, canDelete: false, canView: true },
          inventory: { canCreate: false, canEdit: false, canDelete: false, canView: true, canAdjust: false },
          consumeRequests: { canCreate: true, canApprove: false, canReject: false, canView: true, canDelete: false },
          logBook: { canCreate: true, canEdit: false, canDelete: false, canView: true },
          chat: { canCreate: true, canView: true, canDelete: false },
        };
        permissions.navigation = [
          { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
          { label: 'Units', path: '/dashboard/units', icon: 'Truck' },
          { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package' },
          { label: 'Consume Requests', path: '/dashboard/consume-requests', icon: 'FileText' },
        ];
        break;
    }

    return permissions;
  }
}
