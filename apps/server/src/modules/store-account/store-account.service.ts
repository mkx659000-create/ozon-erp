import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoreAccountDto } from './dto/create-store-account.dto';
import { UpdateStoreAccountDto } from './dto/update-store-account.dto';

const OZON_API_BASE = 'https://api-seller.ozon.ru';

@Injectable()
export class StoreAccountService {
  constructor(private prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    const userStores = await this.prisma.userStoreAccount.findMany({
      where: { userId },
      include: {
        storeAccount: {
          select: {
            id: true,
            storeName: true,
            ozonClientId: true,
            status: true,
            lastSyncAt: true,
            syncEnabled: true,
            createdAt: true,
          },
        },
      },
    });
    return userStores.map((us) => us.storeAccount);
  }

  async create(userId: string, dto: CreateStoreAccountDto) {
    const store = await this.prisma.storeAccount.create({
      data: {
        storeName: dto.storeName,
        ozonClientId: dto.ozonClientId,
        ozonApiKey: dto.ozonApiKey,
        users: { create: { userId } },
      },
    });
    return { id: store.id, storeName: store.storeName, status: store.status };
  }

  async update(id: string, dto: UpdateStoreAccountDto) {
    const store = await this.prisma.storeAccount.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('店铺不存在');

    return this.prisma.storeAccount.update({
      where: { id },
      data: {
        ...(dto.storeName && { storeName: dto.storeName }),
        ...(dto.ozonClientId && { ozonClientId: dto.ozonClientId }),
        ...(dto.ozonApiKey && { ozonApiKey: dto.ozonApiKey }),
        ...(dto.syncEnabled !== undefined && { syncEnabled: dto.syncEnabled }),
      },
      select: {
        id: true,
        storeName: true,
        ozonClientId: true,
        status: true,
        syncEnabled: true,
      },
    });
  }

  async delete(id: string) {
    const store = await this.prisma.storeAccount.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('店铺不存在');

    await this.prisma.userStoreAccount.deleteMany({
      where: { storeAccountId: id },
    });
    await this.prisma.storeAccount.delete({ where: { id } });
    return { success: true };
  }

  async testConnection(id: string) {
    const store = await this.prisma.storeAccount.findUnique({ where: { id } });
    if (!store) throw new NotFoundException('店铺不存在');

    try {
      const response = await axios.post(
        `${OZON_API_BASE}/v3/product/list`,
        { filter: {}, limit: 1 },
        {
          headers: {
            'Client-Id': store.ozonClientId,
            'Api-Key': store.ozonApiKey,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      if (response.status === 200) {
        await this.prisma.storeAccount.update({
          where: { id },
          data: { status: 'ACTIVE' },
        });
        return { success: true, message: '连接成功' };
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      if (error.response?.status === 403) {
        await this.prisma.storeAccount.update({
          where: { id },
          data: { status: 'AUTH_EXPIRED' },
        });
      }
      throw new BadRequestException(`连接失败: ${msg}`);
    }
  }
}
