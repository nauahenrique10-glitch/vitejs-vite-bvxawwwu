import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './AdminShell.css'

const groups = [
  { label: 'OPERAÇÃO', items: [['dashboard', 'Visão geral', 'dashboard'], ['operacao', 'Operação do dia', 'activity'], ['listaDiaristas', 'Lista do dia', 'list'], ['ponto', 'Controle de ponto', 'clock'], ['historicoOperacional', 'Histórico operacional', 'history']] },
  { label: 'PESSOAS E FINANCEIRO', items: [['funcionarios', 'Funcionários', 'users'], ['diarias', 'Diárias', 'wallet'], ['fechamentos', 'Fechamentos', 'check'], ['pagamentos', 'Pagamentos', 'wallet'], ['documentos', 'Documentos', 'file']] },
  { label: 'GESTÃO', items: [['relatorios', 'Relatórios', 'chart'], ['calendario', 'Calendário', 'calendar'], ['usuarios', 'Usuários e acessos', 'users'], ['auditoria', 'Auditoria', 'shield'], ['configuracoes', 'Configurações', 'settings']] },
]

const paths: Record<string, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  activity: <path d="M3 12h4l3-8 4 16 3-8h4"/>,
  list: <path d="M9 5h12M9 12h12M9 19h12M3 5h1M3 12h1M3 19h1"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  history: <><path d="M3 10a9 9 0 1 1 1 7M3 4v6h6M12 7v5l3 2"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5"/></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M16 11h5v5h-5zM3 8V5l13-3v3"/></>,
  check: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/></>,
  file: <><path d="M14 2H5v20h14V7zM14 2v5h5M8 12h8M8 16h6"/></>,
  chart: <path d="M3 3v18h18M7 16v-5m5 5V6m5 10V9"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18M7 14h2m4 0h2m-8 3h2"/></>,
  shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/></>,
  settings: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3"/><circle cx="15" cy="17" r="3"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  close: <path d="m6 6 12 12M6 18 18 6"/>,
  exit: <><path d="M9 3H4v18h5m5-5 4-4-4-4m-5 4h12"/></>,
  search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
  face: <><path d="M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5M8 10v1m8-1v1m-7 5c2 1 4 1 6 0"/></>,
}
export function SystemIcon({ name }: { name: string }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.dashboard}</svg>
}

type Props = {
  children: ReactNode; current: string; userName: string; role: string;
  canAccess: (screen: string) => boolean; onNavigate: (screen: string) => void;
  onSignOut: () => void; onPassword: () => void; onTerminal: () => void;
  canEdit: boolean; savedAt: string; readOnly: boolean;
  workspace: 'gestao' | 'acesso'; onWorkspace: (workspace: 'gestao' | 'acesso') => void;
}

export default function AdminShell(props: Props) {
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const currentLabel = groups.flatMap(group => group.items).find(item => item[0] === props.current)?.[1] || 'Painel'
  useEffect(() => {
    const element = dialog.current
    if (open) { element?.showModal(); const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = overflow; element?.close() } }
    element?.close()
  }, [open])
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 901px)')
    const onResize = () => { if (desktop.matches) setOpen(false) }
    desktop.addEventListener('change', onResize)
    return () => desktop.removeEventListener('change', onResize)
  }, [])
  function close() { setOpen(false); trigger.current?.focus() }
  function navigate(screen: string) { props.onNavigate(screen); close() }
  const accessScreens = ['dashboard', 'ponto', 'auditoria']
  const workspaceGroups = props.workspace === 'acesso'
    ? [{ label: 'CONTROLE DE ACESSO', items: [['dashboard', 'Visão geral dos acessos', 'shield'], ['ponto', 'Entradas e saídas', 'clock'], ['auditoria', 'Auditoria', 'shield']] }]
    : groups.map(group => ({ ...group, items: group.items.filter(([screen]) => screen === 'dashboard' || !accessScreens.includes(screen)) }))
  const visibleGroups = workspaceGroups.map(group => ({ ...group, items: group.items.filter(([screen]) => props.canAccess(screen)) })).filter(group => group.items.length)
  function navigation(mobile = false) {
    return <>
      <div className="system-brand"><img src="/logo-sindicato.png" alt=""/><div><strong>Gestão Sindical</strong><span>PLATAFORMA DE OPERAÇÕES</span></div>{mobile && <button className="system-icon-button" onClick={close} aria-label="Fechar menu"><SystemIcon name="close"/></button>}</div>
      <label className="system-workspace-picker"><span>AMBIENTE DE TRABALHO</span><select value={props.workspace} onChange={event => { props.onWorkspace(event.target.value as 'gestao' | 'acesso'); close() }} aria-label="Ambiente de trabalho"><option value="gestao">Gestão de diaristas</option><option value="acesso">Controle de acesso</option></select><small>DHL Mogi Mirim</small></label>
      <nav aria-label="Menu principal" className="system-nav">{visibleGroups.map(group => <section key={group.label}><h2>{group.label}</h2>{group.items.map(([screen, label, icon]) => <button key={screen} aria-current={props.current === screen ? 'page' : undefined} className={props.current === screen ? 'is-active' : ''} onClick={() => navigate(screen)}><SystemIcon name={icon}/><span>{label}</span>{props.current === screen && <i/>}</button>)}</section>)}{!visibleGroups.length && <p className="system-no-results">Nenhum módulo encontrado.</p>}</nav>
      <div className="system-sidebar-footer">{props.canEdit && props.workspace === 'acesso' && <button className="system-terminal" onClick={() => { close(); props.onTerminal() }}><SystemIcon name="face"/>Abrir terminal facial<span>↗</span></button>}<small>{props.savedAt ? `Salvo neste navegador: ${props.savedAt}` : 'Gestão de pessoas e operações'}</small><button className="system-signout" onClick={() => { close(); props.onSignOut() }}><SystemIcon name="exit"/>Sair da conta</button></div>
    </>
  }
  return <div className={`app system-app ${props.readOnly ? 'modo-consulta' : ''}`}>
    <a className="system-skip" href="#system-content">Pular para o conteúdo</a>
    <aside className="system-sidebar">{navigation()}</aside>
    <dialog className="system-mobile-menu" ref={dialog} onCancel={event => { event.preventDefault(); close() }} onClick={event => { if (event.target === event.currentTarget) close() }} aria-label="Navegação do sistema"><div className="system-mobile-menu-inner">{navigation(true)}</div></dialog>
    <div className="system-workarea">
      <header className="system-topbar"><div className="system-breadcrumb"><button ref={trigger} className="system-icon-button system-menu-toggle" aria-label="Abrir menu de navegação" aria-expanded={open} onClick={() => setOpen(true)}><SystemIcon name="menu"/></button><span>Meu espaço</span><span className="system-breadcrumb-divider">/</span><strong>{currentLabel}</strong></div><button className="system-user" onClick={props.onPassword} title="Alterar minha senha"><span className="system-user-avatar">{props.userName.split(' ').filter(Boolean).slice(0, 2).map(name => name[0]).join('')}</span><span><strong>{props.userName}</strong><small>{props.role}</small></span><SystemIcon name="settings"/></button></header>
      <div id="system-content" tabIndex={-1}>{props.children}</div>
      <footer className="system-footer"><span>Gestão Sindical · DHL Mogi Mirim</span><span>Controle de acesso e gestão de diaristas</span></footer>
    </div>
  </div>
}
