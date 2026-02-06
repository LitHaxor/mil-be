import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from '../decorators/get-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login', description: 'Authenticate user and return access token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout', description: 'Logout user and invalidate access token' })
  @ApiBody({ schema: { properties: { accessToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body('accessToken') accessToken: string) {
    return this.authService.logout(accessToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user', description: 'Get the authenticated user information' })
  @ApiResponse({ status: 200, description: 'Returns user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@GetUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      workshop_id: user.workshop_id,
      avatar_url: user.avatar_url,
    };
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user permissions', description: 'Get permissions for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns user permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPermissions(@GetUser() user: User) {
    return this.authService.getUserPermissions(user.role);
  }
}
