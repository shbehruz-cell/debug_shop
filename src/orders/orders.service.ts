import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FindOrdersDto } from './dto/find-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Role } from '../generated/prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number) {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('Savat bo‘sh, buyurtma berib bo‘lmaydi');
    }

    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `"${item.product.title}" mahsulotidan zaxirada yetarli emas`,
        );
      }
    }

    let total = 0;
    for (const item of cartItems) {
      total += item.product.price * item.quantity;
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { items: true },
      });

      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    return order;
  }

  async findAll(userId: number, query: FindOrdersDto) {
    const where: any = { userId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const dayStart = new Date(query.date);
      const dayEnd = new Date(query.date);
      dayEnd.setDate(dayEnd.getDate() + 1);
      where.createdAt = { gte: dayStart, lt: dayEnd };
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { id: 'desc' },
    });

    return orders;
  }

  async findOne(id: number, currentUser: { id: number; role: Role }) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException(`${id} idli buyurtma topilmadi`);
    }

    if (order.userId !== currentUser.id && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Bu buyurtma sizga tegishli emas');
    }

    return order;
  }

  async updateStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`${id} idli buyurtma topilmadi`);
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
