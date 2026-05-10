import { Global, Module } from '@nestjs/common';
import { OzonApiService } from './ozon-api.service';
import { OzonProductApi } from './ozon-product.api';
import { OzonPromotionApi } from './ozon-promotion.api';
import { OzonCategoryApi } from './ozon-category.api';
import { OzonOrderApi } from './ozon-order.api';

@Global()
@Module({
  providers: [OzonApiService, OzonProductApi, OzonPromotionApi, OzonCategoryApi, OzonOrderApi],
  exports: [OzonApiService, OzonProductApi, OzonPromotionApi, OzonCategoryApi, OzonOrderApi],
})
export class OzonApiModule {}
