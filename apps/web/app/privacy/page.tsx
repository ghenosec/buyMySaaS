import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Como o Buy My SaaS coleta, usa e protege dados pessoais na plataforma.',
};

export default function Privacy() {
  return (
    <article className="container" style={{ maxWidth: 860 }}>
      <header className="page-head">
        <span className="eyebrow">LGPD</span>
        <h1>Política de Privacidade.</h1>
        <p className="muted">Última atualização: 21 de agosto de 2026</p>
      </header>
      <div className="card stack" style={{ padding: 28 }}>
        <section className="stack">
          <h2>1. Quem somos</h2>
          <p>
            O <strong>Buy My SaaS</strong> é um marketplace para descoberta,
            curadoria e avaliação de produtos SaaS independentes. Esta política
            explica como coletamos, usamos e protegemos dados pessoais em
            conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD —
            Lei nº 13.709/2018).
          </p>
        </section>

        <section className="stack">
          <h2>2. Dados coletados e finalidades</h2>
          <h3>2.1 Login com Google OAuth</h3>
          <p>Ao entrar com Google, coletamos:</p>
          <ul>
            <li>
              <strong>Nome</strong> — exibição no perfil, produtos cadastrados e
              avaliações.
            </li>
            <li>
              <strong>E-mail</strong> — identificação única da conta e
              comunicações operacionais.
            </li>
            <li>
              <strong>ID da conta Google</strong> — vinculação segura entre sua
              conta Google e sua conta local.
            </li>
            <li>
              <strong>Avatar</strong>, quando disponível — exibição visual do
              perfil.
            </li>
          </ul>
          <p>
            Não armazenamos senha local. A autenticação é feita por Google OAuth
            e a sessão da plataforma é mantida por cookie HTTP-only.
          </p>
          <p>
            <strong>Base legal:</strong> execução de contrato e procedimentos
            preliminares relacionados ao uso da plataforma.
          </p>

          <h3>2.2 Produtos, avaliações, favoritos e impulsionamentos</h3>
          <p>Registramos interações necessárias para operar o marketplace:</p>
          <ul>
            <li>Produtos SaaS cadastrados e associados à conta criadora.</li>
            <li>Avaliações publicadas, vinculadas à conta do usuário.</li>
            <li>
              Favoritos, para manter sua lista pessoal de produtos salvos.
            </li>
            <li>
              Impulsionamentos/boosts, para garantir o limite de um boost por
              usuário em cada produto e compor o ranking “Em alta”.
            </li>
            <li>
              Marcação de produto +18, quando o maker informa que o conteúdo é
              destinado a maiores de idade.
            </li>
          </ul>
          <p>
            <strong>Base legal:</strong> execução de contrato e legítimo
            interesse na curadoria, integridade e prevenção de abuso do ranking.
          </p>

          <h3>2.3 Métricas de navegação e cliques</h3>
          <p>
            Registramos eventos como visualizações de página, cliques no site,
            trial, compra, favoritos e boosts para métricas do produto,
            prevenção de abuso e cálculo do ranking “Em alta”.
          </p>
          <p>
            Para reduzir duplicações, o endereço IP pode ser transformado em um
            identificador derivado por hash. O Buy My SaaS não usa esse hash
            para exibir identidade pública do visitante.
          </p>
          <p>
            <strong>Base legal:</strong> legítimo interesse na segurança,
            análise de alcance e melhoria da plataforma.
          </p>

          <h3>2.4 Uploads</h3>
          <p>
            Ao cadastrar um produto, você pode enviar imagens como logo e
            screenshots. Esses arquivos são usados para exibição pública do SaaS
            após aprovação.
          </p>
          <p>
            O sistema valida tipo e tamanho de imagem para reduzir riscos de
            arquivos maliciosos.
          </p>
        </section>

        <section className="stack">
          <h2>3. Cookies</h2>
          <p>
            Usamos cookies necessários para autenticação, segurança e registro
            da sua escolha no aviso de cookies. No primeiro acesso, exibimos um
            banner para informar essa utilização.
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={cellStyle}>Cookie</th>
                  <th style={cellStyle}>Finalidade</th>
                  <th style={cellStyle}>Duração</th>
                  <th style={cellStyle}>Tipo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cellStyle}>bms_session</td>
                  <td style={cellStyle}>Autenticação da sessão</td>
                  <td style={cellStyle}>Até 7 dias</td>
                  <td style={cellStyle}>Necessário</td>
                </tr>
                <tr>
                  <td style={cellStyle}>bms_google_oauth_state</td>
                  <td style={cellStyle}>
                    Proteção do fluxo de login Google contra abuso/CSRF
                  </td>
                  <td style={cellStyle}>Até 10 minutos</td>
                  <td style={cellStyle}>Necessário</td>
                </tr>
                <tr>
                  <td style={cellStyle}>bms_cookie_consent</td>
                  <td style={cellStyle}>
                    Registro do aceite do aviso de cookies
                  </td>
                  <td style={cellStyle}>Até 1 ano</td>
                  <td style={cellStyle}>Necessário</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Se ferramentas analíticas opcionais forem adicionadas no futuro,
            esta política deverá ser atualizada e, quando aplicável, o
            consentimento será solicitado.
          </p>
        </section>

        <section className="stack">
          <h2>4. Terceiros que podem receber dados</h2>
          <ul>
            <li>
              <strong>Google LLC</strong> — autenticação OAuth e dados básicos
              de perfil necessários para login. Veja a{' '}
              <Link href="https://policies.google.com/privacy">
                política do Google
              </Link>
              .
            </li>
            <li>
              <strong>Mercado Pago</strong> — processamento de pagamentos quando
              publicações pagas estiverem habilitadas.
            </li>
            <li>
              <strong>Provedor de banco de dados PostgreSQL</strong> —
              armazenamento dos dados da aplicação.
            </li>
            <li>
              <strong>Storage S3-compatible/CDN</strong> — armazenamento e
              entrega de logos e screenshots em produção.
            </li>
            <li>
              <strong>Vercel ou provedor de hospedagem</strong> — entrega do
              frontend e infraestrutura técnica.
            </li>
          </ul>
          <p>Não vendemos dados pessoais.</p>
        </section>

        <section className="stack">
          <h2>5. Retenção de dados</h2>
          <ul>
            <li>Dados da conta: enquanto a conta existir.</li>
            <li>
              Produtos, avaliações, favoritos e boosts: enquanto forem
              necessários para operar a conta e a plataforma.
            </li>
            <li>
              Eventos analíticos: pelo período necessário para métricas,
              prevenção de abuso e histórico do produto.
            </li>
            <li>
              Logs técnicos: pelo período necessário para segurança, diagnóstico
              e auditoria operacional.
            </li>
          </ul>
        </section>

        <section className="stack">
          <h2>6. Seus direitos</h2>
          <p>
            Nos termos da LGPD, você pode solicitar confirmação de tratamento,
            acesso, correção, anonimização, eliminação, portabilidade,
            informação sobre compartilhamento e revogação de consentimento
            quando aplicável.
          </p>
          <p>
            Para exercer seus direitos, entre em contato pelos canais oficiais
            do projeto ou pelo GitHub do desenvolvedor:{' '}
            <Link href="https://github.com/ghenosec">ghenosec</Link>.
          </p>
        </section>

        <section className="stack">
          <h2>7. Exclusão de conta</h2>
          <p>
            A exclusão de conta poderá remover ou anonimizar dados associados ao
            perfil, conforme viabilidade técnica e obrigações legais. Produtos,
            avaliações, favoritos e boosts vinculados à conta podem ser
            removidos em cascata quando a conta for excluída.
          </p>
        </section>

        <section className="stack">
          <h2>8. Segurança</h2>
          <p>Adotamos medidas técnicas como:</p>
          <ul>
            <li>
              Cookies de sessão com HttpOnly, Secure em produção e SameSite.
            </li>
            <li>Login exclusivo via Google OAuth; não usamos senha local.</li>
            <li>Controle de origem para reduzir risco de CSRF.</li>
            <li>Rate limiting em rotas sensíveis.</li>
            <li>Validação de URLs externas.</li>
            <li>Validação de tipo real e tamanho de imagens enviadas.</li>
            <li>Permissões administrativas verificadas no backend.</li>
          </ul>
        </section>

        <section className="stack">
          <h2>9. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. A data no topo
            indica a versão mais recente. Alterações relevantes poderão ser
            comunicadas dentro da plataforma.
          </p>
        </section>
      </div>
    </article>
  );
}

const cellStyle = {
  border: '1px solid var(--line)',
  padding: 10,
  textAlign: 'left',
  verticalAlign: 'top',
} as const;
