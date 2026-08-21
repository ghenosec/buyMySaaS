import { BadRequestException } from '@nestjs/common';
import { ModerationService } from './moderation.service';

describe('ModerationService', () => {
  const originalTerms = process.env.MODERATION_BLOCKED_TERMS;

  afterEach(() => {
    process.env.MODERATION_BLOCKED_TERMS = originalTerms;
  });

  it('detecta termos configurados ignorando acentos e maiúsculas', () => {
    process.env.MODERATION_BLOCKED_TERMS = 'dinheiro facil';
    const service = new ModerationService();

    expect(service.scan(['Ganhe DINHEIRO fácil hoje']).blocked).toBe(true);
  });

  it('bloqueia conteúdo proibido com erro genérico', () => {
    process.env.MODERATION_BLOCKED_TERMS = 'spam proibido';
    const service = new ModerationService();

    expect(() => service.assertAllowed(['texto com spam proibido'])).toThrow(
      BadRequestException,
    );
  });
});
