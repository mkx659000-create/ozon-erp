import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(pagination: PaginationDto) {
    const { page, pageSize } = pagination;
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          nickname: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return new PaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        storeAccounts: {
          select: {
            storeAccount: {
              select: { id: true, storeName: true, status: true },
            },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }
}
