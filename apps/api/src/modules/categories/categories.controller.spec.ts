import { CategoriesController } from './categories.controller';

describe('CategoriesController', () => {
  const category = {
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  const saas = { count: jest.fn() };
  const controller = new CategoriesController({ category, saas } as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('conta somente SaaS publicados e não adultos nas categorias comuns', async () => {
    category.findMany.mockResolvedValue([
      { slug: 'produtividade', _count: { saas: 1 } },
      { slug: 'adulto-18', _count: { saas: 0 } },
    ]);
    saas.count.mockResolvedValue(2);

    await expect(controller.list()).resolves.toEqual([
      { slug: 'produtividade', _count: { saas: 1 } },
      { slug: 'adulto-18', _count: { saas: 2 } },
    ]);

    expect(category.findMany).toHaveBeenCalledWith({
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
    expect(saas.count).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED', isAdult: true },
    });
  });

  it('conta somente SaaS publicados não adultos no detalhe de categoria comum', () => {
    void controller.get('produtividade');

    expect(category.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { slug: 'produtividade' },
      include: {
        _count: {
          select: {
            saas: {
              where: {
                saas: { status: 'PUBLISHED', isAdult: false },
              },
            },
          },
        },
      },
    });
  });

  it('conta somente SaaS publicados adultos na categoria +18', () => {
    void controller.get('adulto-18');

    expect(category.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { slug: 'adulto-18' },
      include: {
        _count: {
          select: {
            saas: {
              where: {
                saas: { status: 'PUBLISHED', isAdult: true },
              },
            },
          },
        },
      },
    });
  });
});
