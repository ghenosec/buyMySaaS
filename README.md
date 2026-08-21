<p align="center">
  <img src="apps/web/public/logo.png" width="120" alt="Logo Buy My SaaS" />
</p>

<h1 align="center">Buy My SaaS</h1>

Buy My SaaS é um marketplace brasileiro para descobrir, publicar e acompanhar produtos SaaS independentes.

A ideia do projeto é simples: dar visibilidade para makers, indie hackers, pequenos times e empresas que criam soluções digitais, reunindo esses produtos em um catálogo organizado, pesquisável e com fluxo de publicação moderado.

No lado público, visitantes podem explorar SaaS por categorias, preço, país, avaliações e popularidade. No lado do maker, cada usuário pode cadastrar seu produto, enviar logo, revisar as informações, acompanhar analytics e submeter para publicação. Já a administração consegue revisar, aprovar, rejeitar e remover produtos quando necessário.

O MVP inclui:

- Catálogo público de SaaS
- Busca, filtros e páginas por categoria
- Página individual de produto
- Cadastro e login com sessão segura
- Área do maker para criar e editar produtos
- Upload de logos/imagens
- Sistema de favoritos e avaliações
- Fluxo de publicação gratuita ou paga
- Fila administrativa de moderação
- Analytics básicos de visualizações e cliques
- Suporte a armazenamento local ou S3-compatible
- Suporte a pagamento mock ou Mercado Pago

## Visão geral

O projeto foi pensado como uma base realista para um marketplace de SaaS: público o suficiente para descoberta, controlado o suficiente para evitar spam e com separação clara entre visitante, maker e administrador.

Produtos cadastrados não aparecem automaticamente no catálogo público. Eles passam por estados como rascunho, pagamento pendente, análise, publicado, rejeitado ou arquivado. Isso permite manter a vitrine limpa e dá ao administrador controle sobre o que entra no marketplace.

Também há cuidados de segurança já aplicados no backend, incluindo validação de entrada, cookies HTTP-only, proteção contra URLs perigosas, validação real de arquivos enviados e uso de Prisma ORM para acesso ao banco.

## Funcionalidades por área

### Público

- Home com apresentação do marketplace
- Exploração de produtos publicados
- Filtros por categoria, preço, origem, trial e ordenação
- Página detalhada de cada SaaS
- Avaliações públicas
- CTAs rastreados para site, trial ou checkout do produto
- SEO com metadata, Open Graph, sitemap e robots

### Maker

- Cadastro e login
- Sessão persistente por cookie seguro
- Cadastro de SaaS com nome, descrição, preço, categorias, tecnologias e links
- Upload de logo
- Revisão antes do envio
- Publicação gratuita ou via checkout
- Dashboard com produtos, favoritos e analytics

### Administração

- Dashboard administrativo
- Fila de submissões
- Visualização detalhada de cada produto
- Aprovação ou rejeição com motivo
- Exclusão de SaaS aprovado quando necessário
- Registro de auditoria para ações administrativas

## Stack técnica

- Web: Next.js, React, TypeScript, Tailwind CSS e TanStack Query
- API: NestJS, REST, Swagger, class-validator, cookies HTTP-only e rate limiting
- Banco: PostgreSQL com Prisma ORM e migrations versionadas
- Monorepo: npm workspaces
- Infra local: Docker Compose
- Testes: Jest, Supertest e Playwright
- Storage: S3-compatible
- Pagamentos: Mercado Pago

## Arquitetura

```text
apps/web (porta 3000)
  └─ páginas públicas, dashboard maker e admin
       │ REST /api/v1 + cookie de sessão
       ▼
apps/api (porta 3001)
  ├─ auth, catálogo, avaliações, analytics, pagamentos e uploads
  ├─ Swagger em /api/docs
  └─ Prisma ──► PostgreSQL (host 5433 → container 5432)
```

O navegador conversa diretamente com a API. A autenticação usa cookie assinado, `httpOnly` e `sameSite=lax`. Senhas são protegidas com Argon2. Mutações de produtos verificam ownership no servidor, e ações administrativas exigem usuário com papel de admin.

## Segurança implementada

- Validação global de DTOs com `whitelist`, `transform` e `forbidNonWhitelisted`
- Rate limiting global e limites específicos para login/cadastro
- Senhas com Argon2
- Sessão em cookie HTTP-only
- Helmet ativo na API
- CORS restrito ao `WEB_URL`
- Proteção básica contra CSRF por validação de `Origin`/`Referer`
- URLs externas normalizadas e validadas antes de salvar ou redirecionar
- Bloqueio de protocolos perigosos, credenciais em URL e hosts privados em produção
- Upload de imagens validado por assinatura real do arquivo, não apenas por MIME informado
- Upload limitado a JPEG, PNG e WebP de até 5 MB
- Arquivos enviados recebem nomes aleatórios e extensão inferida com segurança
- Headers `nosniff` nos arquivos servidos localmente
- Prisma ORM para reduzir risco de SQL injection
- JSON-LD serializado com escape contra XSS

## API

Todos os endpoints usam o prefixo `/api/v1`.

Grupos principais:

- `/auth`: cadastro, login, logout, sessão e estrutura de recuperação de senha
- `/saas` e `/categories`: catálogo público
- `/me/saas`, `/me/favorites` e `/me/dashboard`: operações autenticadas do maker
- `/saas/:id/reviews` e `/reviews/:id`: avaliações
- `/analytics/event` e `/saas/:slug/out`: eventos e redirects rastreados
- `/webhooks/mercado-pago`: webhook de pagamento
- `/admin`: dashboard, fila, moderação e exclusão administrativa
- `/uploads`: envio autenticado de imagens

## Testes e qualidade

A API possui testes cobrindo contratos HTTP, autenticação, ownership, transições de estado, validação de URLs, categorias e helpers de segurança.

O Playwright cobre páginas públicas, responsividade e o fluxo maker → submissão → aprovação admin → página pública.

Antes de publicar uma alteração, rode:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Limitações conhecidas do MVP

- Recuperação de senha tem contrato preparado, mas ainda exige provedor de e-mail e emissão de token.
- Avaliações podem ser ocultadas no modelo, porém ainda não há tela dedicada de moderação.
- Busca usa filtros PostgreSQL; ranking full-text pode ser adicionado quando houver mais volume.
- Analytics é agregado na leitura, adequado ao volume inicial.
- Edições de produtos já publicados permanecem visíveis e são auditadas
- Mercado Pago real depende de credenciais, webhook HTTPS e validação no sandbox do projeto.
- Algumas correções de dependências podem exigir upgrades maiores, como Next, Prisma ou SDKs externos.
