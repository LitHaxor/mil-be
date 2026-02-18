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
      navigation: [] as Array<{
        label: string;
        path: string;
        icon?: string;
        group?: string;
      }>,
    };

    switch (role) {
      case UserRole.ADMIN:
        permissions.pages = [
          'dashboard',
          'workshops',
          'users',
          'units',
          'inventory',
          'entries',
          'entry-logs',
        ];
        permissions.features = {
          workshops: {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canView: true,
          },
          users: {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canView: true,
          },
          units: {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canView: true,
          },
          inventory: {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canView: true,
            canAdjust: true,
          },
          spareParts: {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canView: true,
          },
          entries: { canCreate: false, canView: true, canDelete: false },
          exits: { canCreate: true, canView: true, canDelete: true },
          jobCarts: { canCreate: true, canView: true, canDelete: true },
          consumeRequests: {
            canCreate: true,
            canApprove: true,
            canReject: true,
            canView: true,
            canDelete: true,
          },
          sourceRequests: {
            canCreate: true,
            canApprove: true,
            canMarkSourced: true,
            canView: true,
            canDelete: true,
          },
          logBook: {
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canView: true,
          },
          chat: { canCreate: true, canView: true, canDelete: true },
        };
        permissions.navigation = [
          { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
          { label: 'Units', path: '/dashboard/units', icon: 'Truck' },
          { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package' },
          { label: 'Job Carts', path: '/dashboard/job-carts', icon: 'Wrench' },
          {
            label: 'Entry Logs',
            path: '/dashboard/entry-logs',
            icon: 'ClipboardList',
          },
          {
            label: 'Workshops',
            path: '/dashboard/workshops',
            icon: 'Building',
            group: 'administration',
          },
          {
            label: 'Users',
            path: '/dashboard/users',
            icon: 'Users',
            group: 'administration',
          },
        ];
        break;

      case UserRole.OC:
        permissions.pages = ['dashboard', 'units', 'inventory'];
        permissions.features = {
          units: {
            canCreate: true,
            canEdit: true,
            canDelete: false,
            canView: true,
          },
          inventory: {
            canCreate: true,
            canEdit: true,
            canDelete: false,
            canView: true,
            canAdjust: true,
          },
          spareParts: {
            canCreate: true,
            canEdit: true,
            canDelete: false,
            canView: true,
          },
          exits: { canCreate: true, canView: true },
          jobCarts: { canCreate: true, canView: true },
          consumeRequests: {
            canCreate: true,
            canApprove: true,
            canReject: true,
            canView: true,
            canDelete: false,
          },
          sourceRequests: {
            canCreate: true,
            canApprove: true,
            canMarkSourced: true,
            canView: true,
            canDelete: false,
          },
          logBook: {
            canCreate: true,
            canEdit: true,
            canDelete: false,
            canView: true,
          },
          chat: { canCreate: true, canView: true, canDelete: false },
        };
        permissions.navigation = [
          { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
          { label: 'Units', path: '/dashboard/units', icon: 'Truck' },
          { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package' },
          { label: 'Job Carts', path: '/dashboard/job-carts', icon: 'Wrench' },
        ];
        break;

      case UserRole.INSPECTOR_RI_AND_I:
        permissions.pages = ['dashboard', 'units', 'inventory', 'entries'];
        permissions.features = {
          units: {
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canView: true,
          },
          inventory: {
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canView: true,
            canAdjust: false,
          },
          entries: { canCreate: true, canView: true },
          exits: { canCreate: true, canView: true },
          jobCarts: { canCreate: true, canView: true },
          consumeRequests: {
            canCreate: true,
            canApprove: true,
            canReject: true,
            canView: true,
            canDelete: false,
          },
          logBook: {
            canCreate: true,
            canEdit: false,
            canDelete: false,
            canView: true,
          },
          chat: { canCreate: true, canView: true, canDelete: false },
        };
        permissions.navigation = [
          { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
          { label: 'Entry', path: '/dashboard/entries', icon: 'ClipboardList' },
          { label: 'Units', path: '/dashboard/units', icon: 'Truck' },
          { label: 'Inventory', path: '/dashboard/inventory', icon: 'Package' },
          { label: 'Job Carts', path: '/dashboard/job-carts', icon: 'Wrench' },
        ];
        break;

      case UserRole.STORE_MAN:
        permissions.pages = [
          'dashboard',
          'store-man',
          'job-carts',
          'inventory',
        ];
        permissions.features = {
          units: {
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canView: true,
          },
          inventory: {
            canCreate: false,
            canEdit: false,
            canDelete: false,
            canView: true,
            canAdjust: false,
          },
          jobCarts: {
            canCreate: false,
            canView: true,
            canComplete: true,
            canDelete: false,
          },
          consumeRequests: {
            canCreate: true,
            canApprove: false,
            canReject: false,
            canView: true,
            canDelete: false,
          },
          logBook: {
            canCreate: true,
            canEdit: false,
            canDelete: false,
            canView: true,
          },
          chat: { canCreate: true, canView: true, canDelete: false },
        };
        permissions.navigation = [
          { label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard' },
          {
            label: 'Job Cart',
            path: '/dashboard/store-man',
            icon: 'ShoppingCart',
          },
        ];
        break;
    }

    return permissions;
  }
}
