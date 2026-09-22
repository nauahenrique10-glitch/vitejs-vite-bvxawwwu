import './AccessHome.css'

type Props = { onAdmin: () => void; onAccess: () => void; onTerminal: () => void }

function AccessIcon({ facial = false }: { facial?: boolean }) {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {facial ? <><path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m8 0h4a1 1 0 0 0 1-1v-4"/><path d="M8 10v1m8-1v1m-7 5c2 1.5 4 1.5 6 0M12 9v4h-1"/></> : <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>}
  </svg>
}

export default function AccessHome({ onAdmin, onAccess, onTerminal }: Props) {
  return <div className="access-home">
    <header className="access-header">
      <div className="access-brand"><img src="/logo-sindicato.png" alt="Logo do Sindicato" /><span><strong>Gestão Sindical</strong><small>PLATAFORMA DE OPERAÇÕES</small></span></div>
      <span className="access-location">DHL · Mogi Mirim</span>
    </header>
    <main className="access-main">
      <section className="access-intro">
        <span className="access-eyebrow">PESSOAS · GESTÃO · ACESSO</span>
        <h1>Uma plataforma completa.<br /><em>O ambiente certo para você.</em></h1>
        <p>Gestão de diaristas e controle de acesso em espaços próprios. Escolha a área da sua atividade para continuar.</p>
      </section>
      <section aria-labelledby="access-options-title">
        <div className="access-section-heading"><h2 id="access-options-title">Como você deseja acessar?</h2><span>Selecione uma opção</span></div>
        <div className="access-card-grid">
          <button className="access-card access-card-admin" onClick={onAdmin}>
            <span className="access-card-top"><span className="access-icon"><AccessIcon /></span><span className="access-tag">GESTORES E SUPERVISORES</span></span>
            <h3>Gestão de diaristas</h3><p>Organize equipes e escalas. Acompanhe diárias, fechamentos e pagamentos.</p>
            <span className="access-card-features">Funcionários · Escalas · Relatórios</span>
            <span className="access-card-action">Entrar no painel <span aria-hidden="true">↗</span></span>
          </button>
          <button className="access-card access-card-terminal" onClick={onAccess}>
            <span className="access-card-top"><span className="access-icon"><AccessIcon facial /></span><span className="access-tag">CONTROLE E MONITORAMENTO</span></span>
            <h3>Controle de acesso</h3><p>Acompanhe a movimentação de pessoas e consulte os registros de entrada e saída.</p>
            <span className="access-card-features">Presenças · Registros · Acompanhamento</span>
            <span className="access-card-action">Acessar controle <span aria-hidden="true">↗</span></span>
          </button>
        </div>
        <div className="access-terminal-strip"><span className="access-icon"><AccessIcon facial /></span><div><strong>Veio registrar sua presença?</strong><p>O totem facial é exclusivo para registrar entrada e saída.</p></div><button onClick={onTerminal}>Abrir totem facial <span aria-hidden="true">↗</span></button></div>
        <p className="access-note"><AccessIcon /> Os ambientes de gestão e controle exigem identificação do usuário.</p>
      </section>
    </main>
    <footer className="access-footer"><span>Sindicato dos Trabalhadores na Movimentação de Mercadorias</span><span>Limeira e região</span></footer>
  </div>
}
