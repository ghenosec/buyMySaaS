import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() async list() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            saas: {
              where: { saas: { status: 'PUBLISHED', isAdult: false } },
            },
          },
        },
      },
    });
    const adultCount = await this.prisma.saas.count({
      where: { status: 'PUBLISHED', isAdult: true },
    });
    return categories.map((category) =>
      category.slug === 'adulto-18'
        ? { ...category, _count: { ...category._count, saas: adultCount } }
        : category,
    );
  }
  @Get(':slug') get(@Param('slug') slug: string) {
    return this.prisma.category.findUniqueOrThrow({
      where: { slug },
      include: {
        _count: {
          select: {
            saas: {
              where: {
                saas: {
                  status: 'PUBLISHED',
                  isAdult: slug === 'adulto-18',
                },
              },
            },
          },
        },
      },
    });
  }
}
