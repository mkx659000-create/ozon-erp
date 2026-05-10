import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OzonApiService } from '../../ozon-api/ozon-api.service';
import { OzonCategoryApi } from '../../ozon-api/ozon-category.api';
import { PublishProductDto } from './dto/publish-product.dto';

@Injectable()
export class ProductPublishService {
  private readonly logger = new Logger(ProductPublishService.name);

  constructor(
    private prisma: PrismaService,
    private ozonApiService: OzonApiService,
    private ozonCategoryApi: OzonCategoryApi,
  ) {}

  /**
   * Publish (create/import) a product to Ozon.
   */
  async publishProduct(dto: PublishProductDto) {
    const store = await this.prisma.storeAccount.findUnique({
      where: { id: dto.storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    // Build Ozon import item
    const importItem: any = {
      description_category_id: dto.descriptionCategoryId,
      name: dto.name,
      offer_id: dto.offerId,
      barcode: dto.barcode || undefined,
      price: String(dto.price),
      old_price: dto.oldPrice ? String(dto.oldPrice) : '0',
      premium_price: dto.premiumPrice ? String(dto.premiumPrice) : '0',
      currency_code: dto.currencyCode || 'RUB',
      vat: dto.vat ? String(dto.vat) : '0',
      dimension_unit: 'mm',
      weight_unit: 'g',
      weight: dto.weightGross || 0,
      depth: dto.dimensionLength || 0,
      width: dto.dimensionWidth || 0,
      height: dto.dimensionHeight || 0,
      images: dto.images || [],
      primary_image: dto.primaryImage || '',
      attributes: (dto.attributes || []).map((attr) => ({
        complex_id: 0,
        id: attr.attributeId,
        values: attr.values,
      })),
    };

    // Call Ozon import API
    const client = this.ozonApiService.createClient(credentials);
    const response = await client.post('/v3/product/import', {
      items: [importItem],
    });

    const result = response.data.result;
    const taskId = result?.task_id;

    this.logger.log(`Product import task created: ${taskId}`);

    return {
      taskId,
      message: '产品刊登任务已提交，请等待 Ozon 审核',
    };
  }

  /**
   * Check import task status.
   */
  async checkImportStatus(storeAccountId: string, taskId: number) {
    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };
    const client = this.ozonApiService.createClient(credentials);

    const response = await client.post('/v1/product/import/info', {
      task_id: taskId,
    });

    return response.data.result;
  }

  /**
   * Get category attributes for building the publish form.
   */
  async getCategoryAttributes(storeAccountId: string, categoryId: number) {
    const store = await this.prisma.storeAccount.findUnique({
      where: { id: storeAccountId },
    });
    if (!store) throw new NotFoundException('店铺不存在');

    const credentials = { clientId: store.ozonClientId, apiKey: store.ozonApiKey };

    return this.ozonCategoryApi.getCategoryAttributes(
      credentials,
      categoryId,
    );
  }
}
