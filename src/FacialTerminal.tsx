import type { ReactNode, RefObject } from 'react'
import { SystemIcon } from './AdminShell'
import './FacialTerminal.css'

type Props = {
  state: 'aguardando' | 'reconhecendo' | 'sucesso' | 'erro'
  cameraActive: boolean
  videoRef: RefObject<HTMLVideoElement | null>
  clock: string
  date: string
  recordDate: string
  recordTime: string
  employee: string
  recordType: string
  error: string
  onStart: () => void
  onReset: () => void
  onExit: () => void
  notification: ReactNode
}

export default function FacialTerminal(props: Props) {
  const scanning = props.state === 'reconhecendo'
  const success = props.state === 'sucesso'
  const failed = props.state === 'erro'
  const showingCamera = !success && !failed
  const status = scanning ? 'Identificando' : success ? 'Registro concluído' : failed ? 'Tente novamente' : props.cameraActive ? 'Câmera ativa' : 'Câmera desligada'
  return <div className="facial-terminal">
    {props.notification}
    <header className="facial-header">
      <div className="facial-brand"><img src="/logo-sindicato.png" alt="Logo do Sindicato"/><div><strong>Gestão Sindical</strong><span>TERMINAL DE PRESENÇA</span></div></div>
      <div className="facial-header-right"><div className="facial-clock"><strong>{props.clock}</strong><span>{props.date}</span></div><button className="facial-exit" onClick={props.onExit}><SystemIcon name="exit"/><span>Sair do terminal</span></button></div>
    </header>
    <main className="facial-main">
      <div className="facial-heading"><div><span className="facial-eyebrow">RECONHECIMENTO FACIAL</span><h1>Seu ponto começa aqui.</h1><p>Identifique-se para registrar sua entrada ou saída.</p></div><span className="facial-location"><SystemIcon name="users"/> DHL Mogi Mirim</span></div>
      <div className="facial-layout">
        <section className={`facial-capture facial-state-${props.state}`} aria-label="Registro facial">
          <div className="facial-capture-heading"><span><SystemIcon name="face"/><strong>Registro de presença</strong></span><span className="facial-status" role="status"><i/>{status}</span></div>
          {showingCamera ? <>
            <div className="facial-viewport" aria-label="Prévia da câmera">
              <video ref={props.videoRef} muted playsInline autoPlay className={props.cameraActive ? 'facial-video is-visible' : 'facial-video'} aria-label="Imagem da câmera para reconhecimento facial"/>
              <div className="facial-view-label"><span/>{props.cameraActive ? 'CÂMERA ATIVA' : 'PRÉVIA DA CÂMERA'}</div>
              <div className="facial-face-guide" aria-hidden="true">
                {!props.cameraActive && <svg className="facial-silhouette" width="150" height="190" viewBox="0 0 150 190" fill="none"><path d="M39 74c0-28 13-43 36-43s36 15 36 43v21c0 28-17 48-36 48s-36-20-36-48V74Z"/><path d="M14 185c3-21 24-30 42-33v-18m38 0v18c18 3 39 12 42 33M54 83h5m32 0h5m-24 2-3 22h9m-16 13c8 5 17 5 25 0"/></svg>}
                {scanning && <span className="facial-scan-line"/>}
              </div>
              <div className="facial-view-caption"><SystemIcon name="face"/><span>{props.cameraActive ? 'Mantenha seu rosto dentro da marcação' : 'A imagem aparecerá ao iniciar o registro'}</span></div>
            </div>
            <div className="facial-capture-actions" aria-busy={scanning}>
              <h2>{scanning ? 'Reconhecendo seu rosto…' : 'Tudo pronto para começar?'}</h2>
              <p>{scanning ? 'Olhe para a câmera e permaneça parado. Aguarde a confirmação.' : 'Fique de frente para a câmera e toque no botão abaixo.'}</p>
              <button className="facial-primary" onClick={props.onStart} disabled={scanning}>{scanning ? <span className="facial-spinner"/> : <SystemIcon name="face"/>}{scanning ? 'Identificando, aguarde…' : 'Abrir câmera e registrar ponto'}{!scanning && <span aria-hidden="true">→</span>}</button>
              <span className="facial-action-note">{scanning ? 'O resultado aparecerá nesta tela.' : 'Permita o uso da câmera se o navegador solicitar.'}</span>
            </div>
          </> : <div className="facial-result" role={failed ? 'alert' : 'status'}>
            <span className="facial-result-icon"><SystemIcon name={success ? 'check' : 'face'}/></span>
            <span className="facial-eyebrow">{success ? 'IDENTIDADE CONFIRMADA' : 'REGISTRO NÃO CONCLUÍDO'}</span>
            <h2>{success ? 'Ponto registrado!' : 'Não foi possível concluir'}</h2>
            <p>{success ? (props.recordType ? `${props.recordType} registrada com sucesso.` : 'Registro concluído com sucesso.') : props.error}</p>
            {success && <div className="facial-receipt"><span>FUNCIONÁRIO</span><strong>{props.employee}</strong><dl><div><dt>Data</dt><dd>{props.recordDate}</dd></div><div><dt>Horário</dt><dd>{props.recordTime}</dd></div></dl></div>}
            <button className="facial-primary" onClick={props.onReset}>{success ? 'Finalizar registro' : 'Tentar novamente'}<span aria-hidden="true">→</span></button>
            <span className="facial-action-note">{success ? 'O terminal voltará ao início automaticamente.' : 'Se precisar, peça ajuda ao responsável pela operação.'}</span>
          </div>}
        </section>
        <aside className="facial-guidance" aria-label="Orientações para registro">
          <section className="facial-steps"><span className="facial-eyebrow">É SIMPLES E RÁPIDO</span><h2>Como registrar seu ponto</h2><ol><li><span>01</span><div><strong>Posicione seu rosto</strong><p>Olhe de frente e mantenha o rosto inteiro dentro da marcação.</p></div></li><li><span>02</span><div><strong>Facilite a identificação</strong><p>Procure um local iluminado e deixe olhos e rosto visíveis.</p></div></li><li><span>03</span><div><strong>Aguarde a confirmação</strong><p>Permaneça parado até aparecer o resultado do registro.</p></div></li></ol></section>
          <section className="facial-tip"><SystemIcon name="face"/><div><h3>Uma pessoa por vez</h3><p>Mantenha apenas seu rosto na câmera durante a identificação.</p></div></section>
          <section className="facial-help"><SystemIcon name="shield"/><div><h3>Seu registro, com privacidade</h3><p>Este terminal mostra somente as informações necessárias para confirmar sua presença.</p></div></section>
          <div className="facial-support"><strong>Precisa de ajuda?</strong><p>Procure o responsável pela operação.</p></div>
        </aside>
      </div>
    </main>
    <footer className="facial-footer"><span>Gestão Sindical · DHL Mogi Mirim</span><span>Terminal de registro de entrada e saída</span></footer>
  </div>
}
