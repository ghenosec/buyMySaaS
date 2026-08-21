<p align="center">
  <img src="apps/web/public/logo.png" width="120" alt="Logo Buy My SaaS" />
</p> 

<h2 align="center">Buy My SaaS</h2>

Buy My SaaS nasceu para dar vitrine a produtos digitais criados por makers, indie hackers, pequenos times e empresas que estão construindo soluções SaaS.

A plataforma reúne descoberta, publicação, moderação, analytics e pagamentos em uma experiência simples: quem procura ferramentas encontra bons produtos; quem cria SaaS ganha um espaço organizado para apresentar, validar e divulgar sua solução.

## O que é o Buy My SaaS?

Buy My SaaS é um marketplace de SaaS com foco em curadoria e descoberta.

Visitantes podem explorar produtos por categoria, preço, origem, avaliação e popularidade. Makers podem cadastrar seus SaaS, adicionar informações comerciais, enviar logo, revisar o anúncio e acompanhar métricas. Administradores mantêm a qualidade da vitrine aprovando, rejeitando ou removendo publicações quando necessário.

## Para quem é

- Makers lançando um novo SaaS
- Indie hackers buscando visibilidade
- Pequenas empresas com produtos digitais
- Usuários procurando ferramentas úteis
- Comunidades que querem descobrir soluções brasileiras e independentes

## Funcionalidades principais

### Descoberta de produtos

- Catálogo público de SaaS publicados
- Página inicial com chamada clara para descoberta e publicação
- Exploração por categorias
- Busca e filtros
- Página individual para cada produto
- Informações de preço, país, tecnologias, categorias e descrição completa
- Links rastreados para site, trial ou checkout do SaaS

### Perfil do produto

Cada SaaS pode ter:

- Nome e tagline
- Descrição curta e completa
- Logo
- Categorias
- Tags
- Tecnologias usadas
- Modelo de preço
- Link do site
- Link de trial
- Link de checkout
- Avaliações públicas

### Área do maker

O criador do produto pode:

- Criar conta
- Fazer login
- Cadastrar um SaaS
- Editar informações do produto
- Enviar logo
- Revisar antes de publicar
- Enviar para análise
- Acompanhar favoritos e analytics
- Ver produtos cadastrados no painel

### Moderação administrativa

Administradores podem:

- Ver o painel administrativo
- Acompanhar submissões
- Aprovar produtos
- Rejeitar produtos com motivo
- Remover produtos publicados quando necessário
- Gerenciar permissões de usuários
- Promover usuários comuns para administradores
- Rebaixar administradores quando necessário

### Analytics e engajamento

A plataforma registra interações importantes, como:

- Visualizações de página
- Cliques no site do SaaS
- Cliques em trial
- Cliques em compra
- Favoritos
- Avaliações

Com isso, o maker consegue entender melhor o interesse gerado pelo produto.

### Pagamentos e publicação

O Buy My SaaS já possui fluxo preparado para publicação gratuita ou paga.

O sistema pode operar com pagamento mock em ambiente local e com Mercado Pago em produção, permitindo cobrar uma taxa de publicação quando essa regra de negócio estiver ativa.

## Segurança e qualidade

O projeto foi pensado para evitar depender do frontend como barreira de segurança.

As ações sensíveis são validadas no backend, incluindo:

- Autenticação
- Permissões administrativas
- Ownership de produtos
- Upload seguro de imagens
- Proteção contra URLs perigosas
- Validação de dados enviados pelo usuário
- Auditoria de ações administrativas

Uploads de imagem são validados pelo tipo real do arquivo, não apenas pela extensão ou pelo tipo informado pelo navegador.

## Experiência pública

O visitante consegue navegar pelo marketplace sem precisar criar conta.

Ele pode:

- Explorar produtos
- Abrir detalhes de um SaaS
- Ver avaliações
- Filtrar por categoria
- Acessar o site oficial do produto
- Descobrir ferramentas brasileiras e independentes

## Experiência do maker

O maker tem uma jornada guiada:

1. Cria uma conta
2. Cadastra o SaaS
3. Preenche descrição, preço, categorias e links
4. Envia a logo
5. Revisa o anúncio
6. Envia para análise
7. Acompanha métricas após a publicação

Esse fluxo ajuda a manter o catálogo organizado e evita publicações incompletas.

## Experiência administrativa

A administração mantém a vitrine limpa e confiável.

O painel permite revisar produtos enviados, aprovar o que está pronto, rejeitar o que precisa de ajustes e controlar quais contas têm permissão administrativa.

## O que já foi construído

- Marketplace público
- Área do maker
- Painel administrativo
- Fluxo de login e cadastro
- Criação e edição de SaaS
- Upload de logo
- Moderação de publicações
- Exclusão administrativa de produtos
- Gestão de permissões de administradores
- Categorias com contagem apenas de produtos publicados
- Favoritos
- Avaliações
- Analytics
- Integração preparada para Mercado Pago
- Storage local ou S3-compatible
- README público com apresentação do produto

## Tecnologias usadas

O produto foi construído com tecnologias modernas para web, API, banco de dados, testes e deploy.

Entre elas:

- Next.js
- React
- TypeScript
- NestJS
- PostgreSQL
- Prisma
- Docker
- Mercado Pago
- S3-compatible storage
- Playwright
- Jest

## Status do projeto

Buy My SaaS está em fase de MVP funcional.

O produto já cobre a jornada principal: descoberta pública, cadastro de produto, envio para análise, aprovação administrativa e publicação no catálogo.

Próximas evoluções naturais incluem:

- Recuperação de senha com e-mail transacional
- Moderação dedicada de avaliações
- Busca full-text mais avançada
- Reaprovação para edições sensíveis
- Deploy final com domínio público, storage externo e Mercado Pago em produção

## Desenvolvido por

Desenvolvido por [ghenosec](https://github.com/ghenosec).
