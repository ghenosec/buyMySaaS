import { CategoriesController } from './categories.controller';

describe('CategoriesController', () => {
  const category = {
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };
  const controller = new CategoriesController({ category } as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('conta somente SaaS publicados nas categorias', () => {
    void controller.list();

    expect(category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            saas: { where: { saas: { status: 'PUBLISHED' } } },
          },
        },
      },
    });
  });

  it('conta somente SaaS publicados no detalhe da categoria', () => {
    void controller.get('produtividade');

    expect(category.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { slug: 'produtividade' },
      include: {
        _count: {
          select: {
            saas: { where: { saas: { status: 'PUBLISHED' } } },
          },
        },
      },
    });
  });
});
