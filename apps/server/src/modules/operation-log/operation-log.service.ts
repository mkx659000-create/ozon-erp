import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class OperationLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Record an operation log.
   */
  async log(params: {
    userId: string;
    action: string;
    targetType: string;
    targetId: string;
    details?: any;
  }) {
    return this.prisma.operationLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: params.details || {},
      },
    });
  }

  /**
   * Get operation logs with pagination and filters.
   */
  async findAll(params: {
    page?: number;
    pageSize?: number;
    userId?: string;
    action?: string;
    targetType?: string;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = { contains: params.action, mode: 'insensitive' };
    if (params.targetType) where.targetType = params.targetType;

    const [items, total] = await Promise.all([
      this.prisma.operationLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, username: true, nickname: true } },
        },
      }),
      this.prisma.operationLog.count({ where }),
    ]);

    return new PaginatedResult(items, total, page, pageSize);
  }
}
