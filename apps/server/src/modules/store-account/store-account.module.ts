import { Module } from '@nestjs/common';
import { StoreAccountController } from './store-account.controller';
import { StoreAccountService } from './store-account.service';

@Module({
  controllers: [StoreAccountController],
  providers: [StoreAccountService],
  exports: [StoreAccountService],
})
export class StoreAccountModule {}
