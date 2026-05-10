import { Module } from '@nestjs/common';
import { ProductPublishController } from './product-publish.controller';
import { ProductPublishService } from './product-publish.service';

@Module({
  controllers: [ProductPublishController],
  providers: [ProductPublishService],
  exports: [ProductPublishService],
})
export class ProductPublishModule {}
