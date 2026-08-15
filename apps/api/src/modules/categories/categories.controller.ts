import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { saas: true } } },
    });
  }
  @Get(':slug') get(@Param('slug') slug: string) {
    return this.prisma.category.findUniqueOrThrow({
      where: { slug },
      include: { _count: { select: { saas: true } } },
    });
  }
}
