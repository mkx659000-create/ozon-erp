import { Global, Module } from '@nestjs/common';
import { OzonApiService } from './ozon-api.service';
import { OzonProductApi } from './ozon-product.api';
import { OzonPromotionApi } from './ozon-promotion.api';
import { OzonCategoryApi } from './ozon-category.api';
import { OzonOrderApi } from './ozon-order.api';
import { OzonFinanceApi } from './ozon-finance.api';
import { OzonWarehouseApi } from './ozon-warehouse.api';
import { OzonReturnsApi } from './ozon-returns.api';
import { OzonReportApi } from './ozon-report.api';

@Global()
@Module({
  providers: [OzonApiService, OzonProductApi, OzonPromotionApi, OzonCategoryApi, OzonOrderApi, OzonFinanceApi, OzonWarehouseApi, OzonReturnsApi, OzonReportApi],
  exports: [OzonApiService, OzonProductApi, OzonPromotionApi, OzonCategoryApi, OzonOrderApi, OzonFinanceApi, OzonWarehouseApi, OzonReturnsApi, OzonReportApi],
})
export class OzonApiModule {}
