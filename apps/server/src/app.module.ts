import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { OzonApiModule } from './ozon-api/ozon-api.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { StoreAccountModule } from './modules/store-account/store-account.module';
import { ProductModule } from './modules/product/product.module';
import { PromotionModule } from './modules/promotion/promotion.module';
import { OrderModule } from './modules/order/order.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductPublishModule } from './modules/product-publish/product-publish.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { FinanceModule } from './modules/finance/finance.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { ReturnsModule } from './modules/returns/returns.module';
import { ReportModule } from './modules/report/report.module';
import { RatingModule } from './modules/rating/rating.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { JobsModule } from './jobs/jobs.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    OzonApiModule,
    AuthModule,
    UserModule,
    StoreAccountModule,
    ProductModule,
    PromotionModule,
    OrderModule,
    CategoryModule,
    ProductPublishModule,
    DashboardModule,
    OperationLogModule,
    FinanceModule,
    WarehouseModule,
    ReturnsModule,
    ReportModule,
    RatingModule,
    PricingModule,
    JobsModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
