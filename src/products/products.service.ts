import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FindProductsDto } from './dto/find-products.dto';
import { count } from 'console';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FindProductsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;

    const where: any = { deletedAt: null };

    if (query.search) {
      where.title = { contains: query.search,mode: 'insensitive' };
    }

    if (query.categoryId) {
      where.categoryId = Number(query.categoryId);
    }
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total/limit)

      },
    };
  }

  async findOne(id: number) {
    const numberId = Number(id)
    if(isNaN(numberId)){
      throw new BadRequestException("Raqam kiritilishi kerak")
    }
    const product = await this.prisma.product.findUnique({
      where: { id },include:{category: true},
    });
    if(!product || product.deletedAt){
      throw new NotFoundException('Mahsulot Topilmadi')
    }

    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`${id} idli mahsulot topilmadi`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { ...dto },
    });

    return updated;
  }

  async remove(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`${id} idli mahsulot topilmadi`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: `"${product.title}" o‘chirildi` };
  }
}
