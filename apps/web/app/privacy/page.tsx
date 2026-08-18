export default function Privacy() {
  return (
    <article className="container" style={{ maxWidth: 760 }}>
      <header className="page-head">
        <h1>Privacidade.</h1>
      </header>
      <div className="card stack" style={{ padding: 28 }}>
        <p>
          Coletamos apenas os dados necessários para operar contas, anúncios,
          favoritos, avaliações e métricas agregadas.
        </p>
        <h2>Analytics</h2>
        <p>
          Eventos de visualização e clique podem usar um identificador derivado
          para reduzir duplicações. IPs puros não são mantidos como
          identificadores de analytics.
        </p>
        <h2>Seus dados</h2>
        <p>
          Você pode solicitar correção ou exclusão dos dados da sua conta pelos
          canais de suporte informados na plataforma.
        </p>
      </div>
    </article>
  );
}
