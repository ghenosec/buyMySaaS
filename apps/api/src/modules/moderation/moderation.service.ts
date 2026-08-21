import { BadRequestException, Injectable } from '@nestjs/common';

const defaultBlockedTerms = [
  'viagra',
  'casino online',
  'cassino online',
  'free money',
  'dinheiro facil',
  'ganhe dinheiro rapido',
  'clique aqui agora',
];

@Injectable()
export class ModerationService {
  private readonly blockedTerms = this.loadBlockedTerms();

  scan(values: Array<string | string[] | null | undefined>) {
    const haystack = this.normalize(
      values.flatMap((value) => value ?? []).join(' '),
    );
    const terms = this.blockedTerms.filter((term) =>
      haystack.includes(this.normalize(term)),
    );
    return { blocked: terms.length > 0, terms: [...new Set(terms)] };
  }

  assertAllowed(values: Array<string | string[] | null | undefined>) {
    const result = this.scan(values);
    if (!result.blocked) return;
    throw new BadRequestException(
      'O conteúdo contém termos bloqueados. Revise título, descrição, tags e links antes de continuar.',
    );
  }

  private loadBlockedTerms() {
    const configured = process.env.MODERATION_BLOCKED_TERMS?.split(',')
      .map((term) => term.trim())
      .filter(Boolean);
    return configured?.length ? configured : defaultBlockedTerms;
  }

  private normalize(value: string) {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }
}
