type Worker = { id?: string; nome: string; chavePix: string; titularPix: string; cidadePix: string; funcao: string }
type Daily = { employeeId?: string; nome: string; data: string; status: string; valor: number }
type Payment = { employeeId?: string; nome: string; periodo: string; status: string; valorTotal: number }
export type LivePixItem = {
  previsaoKey: string; employeeId?: string; nome: string; funcao: string; periodo: string;
  quantidadeDiarias: number; aprovado: number; pago: number; reservado: number; valorTotal: number;
  pix: string; pixTitular: string; pixCidade: string; status: 'Aguardando'; dataPagamento: string;
}
const cents = (amount: number) => Math.round(amount * 100)
function isoDate(date: string) { const [day, month, year] = date.split('/'); return `${year}-${month}-${day}` }

export function calculateLivePix(workers: Worker[], daily: Daily[], payments: Payment[], period: string, start: string, end: string): LivePixItem[] {
  return workers.flatMap(worker => {
    const sameWorker = (item: { employeeId?: string; nome: string }) => item.employeeId
      ? Boolean(worker.id && item.employeeId === worker.id)
      : item.nome === worker.nome && workers.filter(other => other.nome === item.nome).length === 1
    const approved = daily.filter(item => item.status === 'Aprovada' && sameWorker(item) && isoDate(item.data) >= start && isoDate(item.data) <= end)
    if (!approved.length) return []
    const paid = payments.filter(item => item.periodo === period && sameWorker(item))
    const approvedCents = approved.reduce((sum, item) => sum + cents(item.valor), 0)
    const paidCents = paid.filter(item => item.status === 'Pago').reduce((sum, item) => sum + cents(item.valorTotal), 0)
    const reservedCents = paid.filter(item => item.status === 'Processando').reduce((sum, item) => sum + cents(item.valorTotal), 0)
    return [{
      previsaoKey: `${worker.id || worker.nome}:${period}`, employeeId: worker.id, nome: worker.nome, funcao: worker.funcao,
      periodo: period, quantidadeDiarias: approved.length, aprovado: approvedCents / 100, pago: paidCents / 100,
      reservado: reservedCents / 100, valorTotal: Math.max(0, approvedCents - paidCents - reservedCents) / 100,
      pix: worker.chavePix, pixTitular: worker.titularPix || worker.nome, pixCidade: worker.cidadePix,
      status: 'Aguardando' as const, dataPagamento: '-',
    }]
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}
