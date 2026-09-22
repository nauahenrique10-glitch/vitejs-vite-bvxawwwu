import { useState } from 'react'
import type { LivePixItem } from './livePix'
import { SystemIcon } from './AdminShell'
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function LivePixPanel({ items, period, onOpen }: { items: LivePixItem[]; period: string; onOpen: (item: LivePixItem) => void }) {
  const [search, setSearch] = useState('')
  const visible = items.filter(item => item.nome.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
  return <section className="live-pix-panel">
    <div className="live-pix-heading"><div><span className="section-label">QUINZENA ATUAL · {period}</span><h2>Central PIX da quinzena</h2><p>Valores das diárias aprovadas, atualizados durante a apuração.</p></div><div className="live-pix-total"><span>Saldo aprovado disponível</span><strong>{money(items.reduce((sum, item) => sum + item.valorTotal, 0))}</strong><small>Pagamentos confirmados e em processamento descontados</small></div></div>
    <label className="live-pix-search"><SystemIcon name="search"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar trabalhador nesta quinzena" aria-label="Buscar trabalhador na Central PIX"/></label>
    <div className="live-pix-grid">{visible.map(item => <article className="live-pix-worker" key={item.previsaoKey}><div className="live-pix-worker-heading"><span>{item.nome.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('')}</span><div><h3>{item.nome}</h3><small>{item.funcao}</small></div></div><dl><div><dt>Diárias aprovadas</dt><dd>{item.quantidadeDiarias}</dd></div><div><dt>Total aprovado</dt><dd>{money(item.aprovado)}</dd></div><div><dt>Já pago</dt><dd>{money(item.pago)}</dd></div>{item.reservado > 0 && <div><dt>Em processamento</dt><dd>{money(item.reservado)}</dd></div>}</dl><div className="live-pix-balance"><span>Saldo disponível</span><strong>{money(item.valorTotal)}</strong></div><p className="live-pix-key">{item.pix || 'Chave PIX não cadastrada'}</p><button className="primary-button" disabled={!item.pix || !item.pixCidade || item.valorTotal <= 0} onClick={() => onOpen(item)}><SystemIcon name="wallet"/> Ver QR Code PIX</button>{!item.pixCidade && <small className="live-pix-missing">Cadastre a cidade do titular na ficha do trabalhador.</small>}</article>)}</div>
    {!visible.length && <div className="empty-filter-result">{search ? 'Nenhum trabalhador encontrado.' : 'As diárias aprovadas desta quinzena aparecerão aqui, mesmo antes do fechamento.'}</div>}
    <p className="live-pix-footnote">Este painel acompanha o saldo aprovado. O histórico e a confirmação dos pagamentos vinculados aos fechamentos continuam abaixo.</p>
  </section>
}
