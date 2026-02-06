import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { LogBookService } from './log-book.service';
import { CreateLogBookDto } from './dto/create-log-book.dto';
import { UpdateLogBookDto } from './dto/update-log-book.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('log-book')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogBookController {
  constructor(private readonly logBookService: LogBookService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  create(@Body() createLogBookDto: CreateLogBookDto) {
    return this.logBookService.create(createLogBookDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findAll(@Query('userUnitId') userUnitId?: string) {
    return this.logBookService.findAll(userUnitId);
  }

  @Get('user-unit/:userUnitId')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  getLogsByUserUnit(@Param('userUnitId') userUnitId: string) {
    return this.logBookService.getLogsByUserUnit(userUnitId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OC, UserRole.INSPECTOR)
  findOne(@Param('id') id: string) {
    return this.logBookService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OC, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateLogBookDto: UpdateLogBookDto) {
    return this.logBookService.update(id, updateLogBookDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.logBookService.remove(id);
  }
}
