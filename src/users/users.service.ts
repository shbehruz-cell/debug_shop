import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {id:true,fullName: true,email: true,role: true,createdAt: true},orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id },select: {id:true,fullName: true,email: true,role: true,createdAt: true} });
    if (!user) {
      throw new NotFoundException(`${id} idli foydalanuvchi topilmadi`);
    }
    return user;
  }
}
