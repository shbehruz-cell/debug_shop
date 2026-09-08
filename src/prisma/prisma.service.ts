import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { env } from '../config';
import { hash } from 'bcryptjs';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
      // Query loglari yoqilgan - konsolda nechta SQL so'rov ketayotganini ko'rasiz.
      log: ['query', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    const email = env.ADMIN.EMAIL
    const hashedPassword = await hash(env.ADMIN.PASSWORD,10)
    const existsAdmin = await this.user.findFirst({where: {email: email}})
    if(!existsAdmin){
      await this.user.create({data: {
        email: email,
        password: hashedPassword,
        fullName: "SUPERADMIN",
        role: "ADMIN"
      }})
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
