import { Global, Module } from '@nestjs/common';
import { OzonApiService } from './ozon-api.service';
import { OzonProductApi } from './ozon-product.api';
import { OzonPromotionApi } from './ozon-promotion.api';
import { OzonCategoryApi } from './ozon-category.api';
import { OzonOrderApi } from './ozon-order.api';
import { OzonFinanceApi } from './ozon-finance.api';

@Global()
@Module({
  providers: [OzonApiService, OzonProductApi, OzonPromotionApi, OzonCategoryApi, OzonOrderApi, OzonFinanceApi],
  exports: [OzonApiService, OzonProductApi, OzonPromotionApi, OzonCategoryApi, OzonOrderApi, OzonFinanceApi],
})
export class OzonApiModule {}
