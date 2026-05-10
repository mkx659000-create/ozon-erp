import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StoreAccountService } from './store-account.service';
import { CreateStoreAccountDto } from './dto/create-store-account.dto';
import { UpdateStoreAccountDto } from './dto/update-store-account.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('store-accounts')
@UseGuards(AuthGuard('jwt'))
export class StoreAccountController {
  constructor(private storeAccountService: StoreAccountService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.storeAccountService.findAllByUser(userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStoreAccountDto,
  ) {
    return this.storeAccountService.create(userId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStoreAccountDto) {
    return this.storeAccountService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storeAccountService.delete(id);
  }

  @Post(':id/test-connection')
  testConnection(@Param('id') id: string) {
    return this.storeAccountService.testConnection(id);
  }
}
