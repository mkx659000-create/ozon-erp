import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/guards/roles.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN')
  findAll(@Query() pagination: PaginationDto) {
    return this.userService.findAll(pagination);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }
}
