import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Termos de uso',
  description: 'Regras de uso, publicação e moderação do Buy My SaaS.',
};

export default function Terms() {
  return (
    <article className="container" style={{ maxWidth: 860 }}>
      <header className="page-head">
        <span className="eyebrow">Termos</span>
        <h1>Termos de uso.</h1>
        <p className="muted">Última atualização: 21 de agosto de 2026</p>
      </header>
      <div className="card stack" style={{ padding: 28 }}>
        <section className="stack">
          <h2>1. Sobre o Buy My SaaS</h2>
          <p>
            O <strong>Buy My SaaS</strong> é um marketplace/diretório
            independente para descoberta, avaliação e divulgação de produtos
            SaaS. A plataforma ajuda makers a apresentarem seus produtos e ajuda
            visitantes a encontrarem soluções.
          </p>
          <p>
            O Buy My SaaS não é o fornecedor dos produtos anunciados. Compras,
            assinaturas, trials, suporte, garantias, licenças e entrega do
            serviço são responsabilidade do SaaS divulgado e de seu respectivo
            responsável.
          </p>
        </section>

        <section className="stack">
          <h2>2. Conta e autenticação</h2>
          <p>
            Para publicar, favoritar, impulsionar, avaliar ou administrar
            produtos, o usuário precisa entrar com uma conta Google. Não
            oferecemos login por senha local.
          </p>
          <p>
            Ao usar a autenticação Google, você declara que as informações da
            conta são verdadeiras e que tem autorização para usá-la.
          </p>
        </section>

        <section className="stack">
          <h2>3. Publicação de SaaS</h2>
          <p>
            Produtos enviados podem passar por revisão antes de aparecerem
            publicamente. Podemos aprovar, rejeitar, remover ou arquivar
            anúncios que:
          </p>
          <ul>
            <li>tenham informações enganosas, incompletas ou ilegais;</li>
            <li>usem marcas, imagens ou conteúdo sem autorização;</li>
            <li>contenham malware, phishing, spam ou links inseguros;</li>
            <li>ocultem cobrança, risco ou limitação relevante;</li>
            <li>
              sejam +18 sem a devida marcação ou apresentem conteúdo proibido.
            </li>
          </ul>
          <p>
            O maker é responsável pelas descrições, preços, imagens, links e
            materiais enviados.
          </p>
        </section>

        <section className="stack">
          <h2>4. Conteúdo +18</h2>
          <p>
            Produtos destinados a maiores de 18 anos devem ser marcados como +18
            no cadastro e, quando fizer sentido, vinculados à categoria Adulto
            +18. Imagens desses produtos podem ser exibidas com blur e
            confirmação de idade.
          </p>
        </section>

        <section className="stack">
          <h2>5. Avaliações, favoritos e impulsionamentos</h2>
          <p>
            Avaliações devem refletir experiência real e respeitosa. Podemos
            remover avaliações ofensivas, fraudulentas, duplicadas, abusivas ou
            fora de contexto.
          </p>
          <p>
            Favoritos e impulsionamentos podem ser usados para personalização,
            métricas e composição do ranking “Em alta”.
          </p>
        </section>

        <section className="stack">
          <h2>6. Pagamentos e links externos</h2>
          <p>
            Quando houver pagamento para publicação, boost ou outro recurso, o
            processamento poderá ser realizado por provedor externo, como
            Mercado Pago. Links de compra, trial e contratação levam para sites
            externos, sujeitos aos termos e políticas de cada fornecedor.
          </p>
        </section>

        <section className="stack">
          <h2>7. Cookies e privacidade</h2>
          <p>
            Usamos cookies necessários para autenticação, segurança e registro
            da escolha de cookies. Mais detalhes estão na{' '}
            <Link href="/privacy">Política de Privacidade</Link>.
          </p>
        </section>

        <section className="stack">
          <h2>8. Alterações e disponibilidade</h2>
          <p>
            Podemos alterar funcionalidades, regras, preços, critérios de
            moderação e estes termos para melhorar a plataforma, cumprir
            obrigações legais ou reduzir abuso.
          </p>
        </section>
      </div>
    </article>
  );
}
