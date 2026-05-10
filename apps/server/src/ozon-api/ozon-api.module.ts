import { Global, Module } from '@nestjs/common';
import { OzonApiService } from './ozon-api.service';
import { OzonProductApi } from './ozon-product.api';
import { OzonPromotionApi } from './ozon-promotion.api';

@Global()
@Module({
  providers: [OzonApiService, OzonProductApi, OzonPromotionApi],
  exports: [OzonApiService, OzonProductApi, OzonPromotionApi],
})
export class OzonApiModule {}
