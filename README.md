# Buy My SaaS

Marketplace brasileiro para descobrir, publicar e acompanhar produtos SaaS independentes. O MVP inclui catálogo público, busca e filtros, ofertas, avaliações, favoritos, área do maker, moderação administrativa, analytics e publicação gratuita ou paga.

## Stack

- **Web:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 e TanStack Query
- **API:** NestJS 11, REST, Swagger, class-validator, cookies HTTP-only e rate limiting
- **Dados:** PostgreSQL 16, Prisma ORM e migrations versionadas
- **Infra local:** npm workspaces e Docker Compose
- **Testes:** Jest/Supertest e Playwright
- **Integrações:** armazenamento local ou S3-compatible; pagamentos mock ou Mercado Pago

## Arquitetura

```text
apps/web (porta 3000)
  └─ páginas públicas, dashboard maker e admin
       │ REST /api/v1 + cookie de sessão
       ▼
apps/api (porta 3001)
  ├─ auth, catálogo, avaliações, ofertas, analytics e pagamentos
  ├─ Swagger em /api/docs
  └─ Prisma ──► PostgreSQL (host 5433 → container 5432)
```

O navegador fala diretamente com a API. A autenticação usa um cookie assinado, `httpOnly` e `sameSite=lax`; senhas são protegidas com Argon2. URLs externas são normalizadas e validadas antes de redirects, e as mutações de maker verificam ownership no servidor.

### Público

- Home com destaques, lançamentos, categorias e CTA para makers
- Explorar com busca, categoria, preço e ordenação
- Páginas de categoria, ofertas e detalhes do produto
- Avaliações, favoritos e saída rastreada para o site do SaaS
- SEO com metadata, Open Graph, sitemap e robots

### Maker

- Cadastro, login e sessão persistente
- Criação e edição de SaaS com logo, screenshots, preço, tags e links
- Validação visual antes do envio
- Publicação gratuita ou checkout configurável
- Gestão de oferta, favoritos e painel de analytics
- Estados `DRAFT`, `PENDING_PAYMENT`, `PENDING_REVIEW`, `PUBLISHED`, `REJECTED` e `ARCHIVED`

### Administração

- Fila paginada de submissões
- Inspeção de detalhes e histórico
- Aprovação ou rejeição com motivo
- Auditoria das ações administrativas


## API

Todos os endpoints usam o prefixo `/api/v1`. Os grupos principais são:

- `/auth`: cadastro, login, logout, sessão e estrutura de recuperação de senha
- `/saas`, `/categories`, `/deals`: catálogo público
- `/me/saas`, `/me/favorites`, `/me/dashboard`: operações autenticadas do maker
- `/saas/:id/reviews` e `/reviews/:id`: avaliações
- `/analytics/event` e `/saas/:slug/out`: eventos e redirects rastreados
- `/payments`, `/webhooks/mercado-pago`: publicação paga
- `/admin`: fila e moderação
- `/uploads`: imagens autenticadas

Consulte o Swagger local para contratos, payloads e respostas atualizados.

## Testes e qualidade

Os testes de API cobrem autenticação, ownership, transições de estado, validação de URLs e contratos HTTP. O Playwright cobre páginas públicas, responsividade e o fluxo completo maker → submissão → aprovação admin → página pública em Chromium desktop e mobile.

## Limitações conhecidas do MVP

- Recuperação de senha tem contrato preparado, mas ainda exige provedor de e-mail e emissão de token.
- Avaliações podem ser ocultadas no modelo, porém não há uma tela dedicada de moderação.
- Busca usa filtros PostgreSQL; ranking full-text pode ser adicionado quando houver volume.
- Analytics é agregado na leitura, adequado ao volume inicial.
- Edições de produtos já publicados permanecem visíveis e são auditadas; um fluxo de reaprovação pode ser incluído depois.
- Mercado Pago real depende de credenciais, webhook HTTPS e validação no sandbox do projeto.
