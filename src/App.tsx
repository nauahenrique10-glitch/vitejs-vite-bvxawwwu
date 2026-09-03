import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { supabase } from './supabase'
import * as faceapi from 'face-api.js'
import QRCode from 'qrcode'

type Tela =
  | 'operacao'
  | 'historicoOperacional'
  | 'dashboard'
  | 'funcionarios'
  | 'ponto'
  | 'listaDiaristas'
  | 'diarias'
  | 'fechamentos'
  | 'pagamentos'
  | 'documentos'
  | 'relatorios'
  | 'configuracoes'
  | 'calendario'
  | 'usuarios'
  | 'auditoria'
  | 'totem'

type TipoNotificacao = 'success' | 'warning' | 'error' | 'info'

type Notificacao = {
  mensagem: string
  tipo: TipoNotificacao
}

type Funcionario = {
  id?: string
  nome: string
  cpf: string
  nascimento: string
  telefone: string
  email: string
  endereco: string
  admissao: string
  funcao: string
  diaria: string
  status: 'Ativo' | 'Inativo'
  tipoPix: string
  chavePix: string
  titularPix: string
  cidadePix: string
  foto: string
  facial: 'Cadastrado' | 'Pendente'
}

type BiometricEnrollmentSupabase = {
  id: string
  employee_id: string
  provider: string | null
  status: 'Pendente' | 'Ativo' | 'Revogado' | 'Falhou'
  face_descriptor: number[] | null
  descriptor_version: string | null
  sample_count: number
}

type RegistroPonto = {
  id?: string
  employeeId?: string
  nome: string
  funcao: string
  data: string
  horario: string
  status: 'Registrado' | 'Pendente'
  metodo?: string
  tipoRegistro?: 'Entrada' | 'Saída'
  facialVerificada?: boolean
  confiancaFacial?: number | null
  observacao?: string
}

type RegistroPontoSupabase = {
  id: string
  employee_id: string
  occurred_at: string
  record_type: 'Entrada' | 'Saída'
  source: 'Manual' | 'Facial' | 'Importação' | 'Sistema'
  facial_verified: boolean
  facial_confidence: number | string | null
  observation: string | null
  employee?: {
    id: string
    full_name: string
    job_title: string
    status: 'Ativo' | 'Inativo'
  } | null
}

type ListaDiaristas = {
  id: string
  data: string
  local: string
  horario: string
  observacao: string
  diaristas: string[]
  ausentes?: string[]
  criadaEm: string
}

type Diaria = {
  id?: string
  employeeId?: string
  nome: string
  funcao: string
  data: string
  tipoDia: 'Semana' | 'Sábado' | 'Domingo' | 'Feriado'
  diariaBase: number
  adicional: number
  vt: number
  vr: number
  valor: number
  status: 'Pendente' | 'Conferida' | 'Aprovada' | 'Cancelada'
  geradaPor?: 'Manual' | 'Ponto' | 'Importação' | 'Sistema'
  observacao?: string
}

type DiariaSupabase = {
  id: string
  employee_id: string
  work_date: string
  base_amount: number | string
  additional_amount: number | string
  transport_amount: number | string
  meal_amount: number | string
  total_amount: number | string
  day_type: 'Útil' | 'Sábado' | 'Domingo' | 'Feriado'
  status: 'Pendente' | 'Conferida' | 'Aprovada' | 'Cancelada'
  generated_from: 'Manual' | 'Ponto' | 'Importação' | 'Sistema'
  observation: string | null
  employee?: {
    id: string
    full_name: string
    job_title: string
  } | null
}

type StatusFechamento =
  | 'Em conferência'
  | 'Aprovado'
  | 'Enviado para pagamento'
  | 'Pago'
  | 'Reaberto'

type Fechamento = {
  id?: string
  periodo: string
  pagamento: string
  status: StatusFechamento
  startDate?: string
  endDate?: string
  totalDaily?: number
  totalTransport?: number
  totalMeal?: number
  totalAmount?: number
  dailyRecordIds?: string[]
}

type FechamentoSupabase = {
  id: string
  start_date: string
  end_date: string
  status: StatusFechamento
  total_daily: number | string
  total_transport: number | string
  total_meal: number | string
  total_amount: number | string
}

type Pagamento = {
  id?: string
  employeeId?: string
  closingId?: string
  nome: string
  periodo: string
  quantidadeDiarias: number
  valorTotal: number
  pix: string
  pixTitular?: string
  pixCidade?: string
  status: 'Aguardando' | 'Processando' | 'Pago' | 'Falhou' | 'Cancelado'
  dataPagamento: string
}

type PagamentoSupabase = {
  id: string
  employee_id: string
  closing_id: string | null
  amount: number | string
  payment_method: 'PIX' | 'Transferência' | 'Dinheiro' | 'Outro'
  status: 'Pendente' | 'Processando' | 'Pago' | 'Falhou' | 'Cancelado'
  pix_key_snapshot: string | null
  pix_holder_snapshot: string | null
  pix_city_snapshot: string | null
  transaction_reference: string | null
  paid_at: string | null
  observation: string | null
  employee?: { full_name: string } | { full_name: string }[] | null
  closing?: { start_date: string; end_date: string } | { start_date: string; end_date: string }[] | null
}

type Documento = {
  id?: string
  employeeId?: string
  nome: string
  titulo: string
  funcionario: string
  tipo: string
  dataEnvio: string
  validade: string
  status: 'Ativo' | 'Expirado' | 'Arquivado'
  storagePath?: string
  mimeType?: string
  tamanho?: number
}

type DocumentoSupabase = {
  id: string
  employee_id: string
  document_type: string
  title: string
  storage_path: string
  original_filename: string | null
  mime_type: string | null
  file_size: number | string | null
  expires_at: string | null
  status: 'Ativo' | 'Expirado' | 'Arquivado'
  created_at: string
  employee?: { full_name: string } | { full_name: string }[] | null
}

type ConfiguracaoValores = {
  diariaBase: number
  percentualSabado: number
  percentualDomingo: number
  percentualFeriado: number
  vt: number
  vr: number
  horarioEntradaPadrao: string
  horarioSaidaPadrao: string
}

type TipoFeriado = 'Nacional' | 'Estadual' | 'Municipal' | 'Interno'

type Feriado = {
  id: string
  data: string
  nome: string
  tipo: TipoFeriado
  ativo: boolean
}

type FeriadoSupabase = {
  id: string
  holiday_date: string
  name: string
  holiday_type: TipoFeriado
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

type PerfilAcesso = 'Administrador' | 'Supervisor' | 'Consulta'

type UsuarioSistema = {
  id: number
  authId?: string
  nome: string
  usuario: string
  senha: string
  email: string
  celular: string
  perfil: PerfilAcesso
  status: 'Ativo' | 'Inativo'
  ultimoAcesso: string
  tentativasFalhas?: number
  bloqueadoAte?: number | null
  criadoEm?: string
  criadoPor?: string
  senhaAlteradaEm?: string
}

type RegistroAuditoria = {
  id: number
  dataHora: string
  usuario: string
  perfil: PerfilAcesso | 'Sistema'
  acao: string
  modulo: string
  detalhe: string
  nivel: 'Informação' | 'Atenção' | 'Crítico'
  entidade?: string
  entityId?: string
  ip?: string
}

type RegistroAuditoriaSupabase = {
  id: number
  user_id: string | null
  user_name: string | null
  user_role: string | null
  action: string
  module: string
  details: string | null
  severity: 'Informação' | 'Atenção' | 'Crítico'
  entity_type: string | null
  entity_id: string | null
  ip_address: string | null
  created_at: string
}

const funcionarioVazio: Funcionario = {
  nome: '',
  cpf: '',
  nascimento: '',
  telefone: '',
  email: '',
  endereco: '',
  admissao: '',
  funcao: 'Auxiliar Logístico',
  diaria: 'R$ 100,00',
  status: 'Ativo',
  tipoPix: '',
  chavePix: '',
  titularPix: '',
  cidadePix: '',
  foto: '',
  facial: 'Pendente',
}

type FuncionarioSupabase = {
  id: string
  full_name: string
  cpf: string
  birth_date: string | null
  phone: string | null
  email: string | null
  address: string | null
  hire_date: string | null
  job_title: string
  status: 'Ativo' | 'Inativo'
  daily_rate: number | string
  pix_type: string | null
  pix_key: string | null
  pix_holder: string | null
  pix_city: string | null
  photo_path: string | null
  facial_status: 'Cadastrado' | 'Pendente'
}

function valorDiariaFormatado(valor: number | string) {
  const numero = Number(valor || 0)
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function somenteDigitos(valor: string) {
  return String(valor || '').replace(/\D/g, '')
}

function formatarCpf(valor: string) {
  const digitos = somenteDigitos(valor).slice(0, 11)

  return digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

function formatarTelefone(valor: string) {
  let digitos = somenteDigitos(valor)

  // Se vier no padrão internacional do PIX (+55...), exibimos no padrão brasileiro.
  if (digitos.length > 11 && digitos.startsWith('55')) {
    digitos = digitos.slice(2)
  }

  digitos = digitos.slice(0, 11)

  if (digitos.length <= 2) return digitos
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`

  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

function formatarChavePixEntrada(tipo: string, chave: string) {
  const tipoNormalizado = String(tipo || '').toLowerCase()

  if (tipoNormalizado.includes('cpf')) return formatarCpf(chave)
  if (tipoNormalizado.includes('celular') || tipoNormalizado.includes('telefone')) {
    return formatarTelefone(chave)
  }

  return String(chave || '')
}

function formatarChavePixExibicao(tipo: string, chave: string) {
  return formatarChavePixEntrada(tipo, chave)
}

function funcionarioDoSupabase(registro: FuncionarioSupabase): Funcionario {
  return {
    id: registro.id,
    nome: registro.full_name,
    cpf: formatarCpf(registro.cpf),
    nascimento: registro.birth_date || '',
    telefone: formatarTelefone(registro.phone || ''),
    email: registro.email || '',
    endereco: registro.address || '',
    admissao: registro.hire_date || '',
    funcao: registro.job_title || 'Auxiliar Logístico',
    diaria: valorDiariaFormatado(registro.daily_rate),
    status: registro.status === 'Inativo' ? 'Inativo' : 'Ativo',
    tipoPix: registro.pix_type || '',
    chavePix: formatarChavePixExibicao(registro.pix_type || '', registro.pix_key || ''),
    titularPix: registro.pix_holder || '',
    cidadePix: registro.pix_city || '',
    foto: registro.photo_path || '',
    facial:
      registro.facial_status === 'Cadastrado' ? 'Cadastrado' : 'Pendente',
  }
}


function normalizarTextoPix(valor: string, limite: number) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 $%*+\-./:]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, limite)
}

function normalizarChavePix(tipo: string, chave: string) {
  const valor = String(chave || '').trim()
  const tipoNormalizado = String(tipo || '').toLowerCase()

  if (tipoNormalizado.includes('cpf') || tipoNormalizado.includes('cnpj')) {
    return somenteDigitos(valor)
  }

  if (tipoNormalizado.includes('celular') || tipoNormalizado.includes('telefone')) {
    if (valor.startsWith('+')) return `+${somenteDigitos(valor)}`
    const digitos = somenteDigitos(valor)
    if (digitos.length === 10 || digitos.length === 11) return `+55${digitos}`
    if (digitos.startsWith('55')) return `+${digitos}`
    return valor
  }

  return valor
}

function campoEmv(id: string, valor: string) {
  const tamanho = String(valor.length).padStart(2, '0')
  return `${id}${tamanho}${valor}`
}

function crc16Pix(valor: string) {
  let crc = 0xffff

  for (let i = 0; i < valor.length; i++) {
    crc ^= valor.charCodeAt(i) << 8

    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function gerarPayloadPixEstatico({
  chave,
  tipoChave,
  titular,
  cidade,
  valor,
}: {
  chave: string
  tipoChave: string
  titular: string
  cidade: string
  valor: number
}) {
  const chaveNormalizada = normalizarChavePix(tipoChave, chave)
  const titularNormalizado = normalizarTextoPix(titular, 25)
  const cidadeNormalizada = normalizarTextoPix(cidade, 15)
  const valorNumerico = Number(valor)

  if (!chaveNormalizada || chaveNormalizada === '-') {
    throw new Error('Cadastre uma chave PIX válida para este funcionário.')
  }

  if (!titularNormalizado) {
    throw new Error('Cadastre o titular do PIX para este funcionário.')
  }

  if (!cidadeNormalizada) {
    throw new Error('Cadastre a cidade do titular do PIX para gerar o QR Code.')
  }

  if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
    throw new Error('O pagamento precisa ter um valor maior que zero.')
  }

  const contaPix = campoEmv('00', 'BR.GOV.BCB.PIX') + campoEmv('01', chaveNormalizada)

  const payloadSemCrc =
    campoEmv('00', '01') +
    campoEmv('26', contaPix) +
    campoEmv('52', '0000') +
    campoEmv('53', '986') +
    campoEmv('54', valorNumerico.toFixed(2)) +
    campoEmv('58', 'BR') +
    campoEmv('59', titularNormalizado) +
    campoEmv('60', cidadeNormalizada) +
    campoEmv('62', campoEmv('05', '***')) +
    '6304'

  return payloadSemCrc + crc16Pix(payloadSemCrc)
}

function App() {
  const [tela, setTela] = useState<Tela>('dashboard')

  const [modoAcesso, setModoAcesso] = useState<
    'inicio' | 'login' | 'admin' | 'totem'
  >('inicio')

  const [usuarioLogin, setUsuarioLogin] = useState('')
  const [senhaLogin, setSenhaLogin] = useState('')
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false)
  const [erroLogin, setErroLogin] = useState('')
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioSistema | null>(null)

  const [usuariosSistema, setUsuariosSistema] = useState<UsuarioSistema[]>([
    {
      id: 1,
      nome: 'Administrador Geral',
      usuario: 'admin',
      senha: '1234',
      email: 'admin@sindicato.local',
      celular: '(19) 99999-0001',
      perfil: 'Administrador',
      status: 'Ativo',
      ultimoAcesso: 'Agora',
    },
    {
      id: 2,
      nome: 'Supervisor Operacional',
      usuario: 'supervisor',
      senha: '1234',
      email: 'supervisor@sindicato.local',
      celular: '(19) 99999-0002',
      perfil: 'Supervisor',
      status: 'Ativo',
      ultimoAcesso: 'Hoje, 08:52',
    },
    {
      id: 3,
      nome: 'Consulta Sindical',
      usuario: 'consulta',
      senha: '1234',
      email: 'consulta@sindicato.local',
      celular: '(19) 99999-0003',
      perfil: 'Consulta',
      status: 'Ativo',
      ultimoAcesso: 'Ontem, 16:20',
    },
  ])

  const [registrosAuditoria, setRegistrosAuditoria] = useState<
    RegistroAuditoria[]
  >([
    {
      id: 1,
      dataHora: '30/08/2026 09:12',
      usuario: 'Administrador Geral',
      perfil: 'Administrador',
      acao: 'Login realizado',
      modulo: 'Acesso',
      detalhe: 'Acesso administrativo autorizado.',
      nivel: 'Informação',
    },
    {
      id: 2,
      dataHora: '30/08/2026 09:18',
      usuario: 'Supervisor Operacional',
      perfil: 'Supervisor',
      acao: 'Lista do dia consultada',
      modulo: 'Operação',
      detalhe: 'Consulta da escala operacional da DHL Mogi Mirim.',
      nivel: 'Informação',
    },
    {
      id: 3,
      dataHora: '29/08/2026 18:42',
      usuario: 'Administrador Geral',
      perfil: 'Administrador',
      acao: 'Fechamento atualizado',
      modulo: 'Fechamentos',
      detalhe: 'Status da quinzena atualizado durante a conferência.',
      nivel: 'Atenção',
    },
  ])
  const [buscaAuditoria, setBuscaAuditoria] = useState('')
  const [moduloAuditoriaFiltro, setModuloAuditoriaFiltro] = useState('Todos')
  const [nivelAuditoriaFiltro, setNivelAuditoriaFiltro] = useState('Todos')
  const [dataAuditoriaFiltro, setDataAuditoriaFiltro] = useState('')

  const [mostrarNovoUsuario, setMostrarNovoUsuario] = useState(false)
  const [novoUsuarioNome, setNovoUsuarioNome] = useState('')
  const [novoUsuarioLogin, setNovoUsuarioLogin] = useState('')
  const [novoUsuarioEmail, setNovoUsuarioEmail] = useState('')
  const [novoUsuarioCelular, setNovoUsuarioCelular] = useState('')
  const [novoUsuarioSenha, setNovoUsuarioSenha] = useState('')
  const [novoUsuarioConfirmarSenha, setNovoUsuarioConfirmarSenha] = useState('')
  const [novoUsuarioPerfil, setNovoUsuarioPerfil] =
    useState<PerfilAcesso>('Supervisor')
  const [novoUsuarioStatus, setNovoUsuarioStatus] =
    useState<UsuarioSistema['status']>('Ativo')

  const [usuarioEditandoId, setUsuarioEditandoId] = useState<number | null>(null)
  const [usuarioEditandoNome, setUsuarioEditandoNome] = useState('')
  const [usuarioEditandoLogin, setUsuarioEditandoLogin] = useState('')
  const [usuarioEditandoEmail, setUsuarioEditandoEmail] = useState('')
  const [usuarioEditandoCelular, setUsuarioEditandoCelular] = useState('')
  const [usuarioEditandoPerfil, setUsuarioEditandoPerfil] =
    useState<PerfilAcesso>('Supervisor')
  const [usuarioEditandoStatus, setUsuarioEditandoStatus] =
    useState<UsuarioSistema['status']>('Ativo')
  const [usuarioEditandoNovaSenha, setUsuarioEditandoNovaSenha] = useState('')
  const [usuarioEditandoConfirmarSenha, setUsuarioEditandoConfirmarSenha] = useState('')

  const [recuperacaoAberta, setRecuperacaoAberta] = useState(false)
  const [recuperacaoEtapa, setRecuperacaoEtapa] = useState<'identificacao' | 'codigo' | 'novaSenha'>('identificacao')
  const [recuperacaoIdentificador, setRecuperacaoIdentificador] = useState('')
  const [recuperacaoCanal, setRecuperacaoCanal] = useState<'email' | 'sms'>('email')
  const [recuperacaoUsuarioId, setRecuperacaoUsuarioId] = useState<number | null>(null)
  const [recuperacaoCodigoGerado, setRecuperacaoCodigoGerado] = useState('')
  const [recuperacaoCodigoDigitado, setRecuperacaoCodigoDigitado] = useState('')
  const [recuperacaoCodigoExpiraEm, setRecuperacaoCodigoExpiraEm] = useState<number | null>(null)
  const [recuperacaoTentativasCodigo, setRecuperacaoTentativasCodigo] = useState(0)
  const [recuperacaoNovaSenha, setRecuperacaoNovaSenha] = useState('')
  const [recuperacaoConfirmarSenha, setRecuperacaoConfirmarSenha] = useState('')
  const [mostrarAlterarMinhaSenha, setMostrarAlterarMinhaSenha] = useState(false)
  const [minhaSenhaAtual, setMinhaSenhaAtual] = useState('')
  const [minhaNovaSenha, setMinhaNovaSenha] = useState('')
  const [minhaConfirmarSenha, setMinhaConfirmarSenha] = useState('')

  const [notificacao, setNotificacao] = useState<Notificacao | null>(null)
  const timerNotificacao = useRef<number | null>(null)
  const inputBackupRef = useRef<HTMLInputElement | null>(null)

  const [diariaEditando, setDiariaEditando] = useState<{
    index: number
    diaria: Diaria
  } | null>(null)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarDocumento, setMostrarDocumento] = useState(false)

  const [funcionarioSelecionado, setFuncionarioSelecionado] =
    useState<Funcionario | null>(null)

  const [abaFichaFuncionario, setAbaFichaFuncionario] = useState<
    'resumo' | 'ponto' | 'diarias' | 'documentos' | 'pagamentos'
  >('resumo')

  const [funcionarioDiariasSelecionado, setFuncionarioDiariasSelecionado] =
    useState<string | null>(null)

  const [fechamentoSelecionado, setFechamentoSelecionado] =
    useState<number | null>(null)

  const [pagamentoPixSelecionado, setPagamentoPixSelecionado] =
    useState<Pagamento | null>(null)

  const [registroPontoSelecionado, setRegistroPontoSelecionado] =
    useState<RegistroPonto | null>(null)

  const [ajustePontoAberto, setAjustePontoAberto] = useState(false)
  const [ajustePontoFuncionarioId, setAjustePontoFuncionarioId] = useState('')
  const [ajustePontoData, setAjustePontoData] = useState('')
  const [ajustePontoHorario, setAjustePontoHorario] = useState('')
  const [ajustePontoTipo, setAjustePontoTipo] = useState<'Entrada' | 'Saída'>('Entrada')
  const [ajustePontoMotivo, setAjustePontoMotivo] = useState('')
  const [ajustePontoSalvando, setAjustePontoSalvando] = useState(false)

  const [buscaFuncionario, setBuscaFuncionario] = useState('')

  const [buscaPonto, setBuscaPonto] = useState('')
  const [statusPontoFiltro, setStatusPontoFiltro] = useState('Todos')
  const dataLocalHoje = (() => {
    const agora = new Date()
    const ano = agora.getFullYear()
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const dia = String(agora.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  })()

  const [dataPontoFiltro, setDataPontoFiltro] = useState(dataLocalHoje)
  const [dataOperacao, setDataOperacao] = useState(dataLocalHoje)

  const [buscaHistoricoOperacional, setBuscaHistoricoOperacional] = useState('')
  const [dataInicioHistorico, setDataInicioHistorico] = useState('')
  const [dataFimHistorico, setDataFimHistorico] = useState('')
  const [historicoSelecionado, setHistoricoSelecionado] = useState<string | null>(
    null
  )

  const [dataListaDiaristas, setDataListaDiaristas] = useState(dataLocalHoje)
  const [localListaDiaristas, setLocalListaDiaristas] = useState('DHL Mogi Mirim')
  const [horarioListaDiaristas, setHorarioListaDiaristas] = useState('09:30')
  const [observacaoListaDiaristas, setObservacaoListaDiaristas] = useState('')
  const [buscaListaDiaristas, setBuscaListaDiaristas] = useState('')
  const [diaristasSelecionados, setDiaristasSelecionados] = useState<string[]>([])
  const [listasDiaristas, setListasDiaristas] = useState<ListaDiaristas[]>([])
  const [listaDiaristasSelecionada, setListaDiaristasSelecionada] =
    useState<ListaDiaristas | null>(null)

  const [buscaDiaria, setBuscaDiaria] = useState('')
  const [statusDiariaFiltro, setStatusDiariaFiltro] = useState('Todos')
  const [dataInicioDiaria, setDataInicioDiaria] = useState('')
  const [dataFimDiaria, setDataFimDiaria] = useState('')

  const [buscaFechamento, setBuscaFechamento] = useState('')
  const [statusFechamentoFiltro, setStatusFechamentoFiltro] =
    useState('Todos')

  const [buscaPagamento, setBuscaPagamento] = useState('')
  const [periodoPagamentoFiltro, setPeriodoPagamentoFiltro] = useState('Todos')
  const [statusPagamentoFiltro, setStatusPagamentoFiltro] = useState('Todos')

  const [buscaDocumento, setBuscaDocumento] = useState('')
  const [tipoDocumentoFiltro, setTipoDocumentoFiltro] = useState('Todos')
  const [statusDocumentoFiltro, setStatusDocumentoFiltro] = useState('Todos')

  const [configuracaoValores, setConfiguracaoValores] =
    useState<ConfiguracaoValores>({
      diariaBase: 100,
      percentualSabado: 50,
      percentualDomingo: 100,
      percentualFeriado: 100,
      vt: 12,
      vr: 26,
      horarioEntradaPadrao: '09:30',
      horarioSaidaPadrao: '18:30',
    })

  const [configuracaoTemporaria, setConfiguracaoTemporaria] =
    useState<ConfiguracaoValores>({
      diariaBase: 100,
      percentualSabado: 50,
      percentualDomingo: 100,
      percentualFeriado: 100,
      vt: 12,
      vr: 26,
      horarioEntradaPadrao: '09:30',
      horarioSaidaPadrao: '18:30',
    })

  const [feriados, setFeriados] = useState<Feriado[]>([])
  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })
  const [novoFeriadoData, setNovoFeriadoData] = useState('')
  const [novoFeriadoNome, setNovoFeriadoNome] = useState('')
  const [novoFeriadoTipo, setNovoFeriadoTipo] =
    useState<TipoFeriado>('Municipal')
  const [mostrarNovoFeriado, setMostrarNovoFeriado] = useState(false)
  const [buscaFeriado, setBuscaFeriado] = useState('')

  useEffect(() => {
    if (tela !== 'calendario') return
    const hoje = new Date()
    setMesCalendario(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
  }, [tela])

  const [estadoTotem, setEstadoTotem] = useState<
    'aguardando' | 'reconhecendo' | 'sucesso' | 'erro'
  >('aguardando')

  const [funcionarioReconhecido, setFuncionarioReconhecido] = useState('')
  const [horarioTotem, setHorarioTotem] = useState('')
  const [mensagemErroTotem, setMensagemErroTotem] = useState('')
  const [tipoRegistroTotem, setTipoRegistroTotem] = useState<'Entrada' | 'Saída' | ''>('')
  const [agoraTotem, setAgoraTotem] = useState(new Date())
  const videoTotemRef = useRef<HTMLVideoElement | null>(null)
  const streamTotemRef = useRef<MediaStream | null>(null)
  const [cameraTotemAtiva, setCameraTotemAtiva] = useState(false)
  const [modelosFaciaisProntos, setModelosFaciaisProntos] = useState(false)
  const [erroModelosFaciais, setErroModelosFaciais] = useState('')
  const [cadastroFacialAberto, setCadastroFacialAberto] = useState(false)
  const [funcionarioCadastroFacial, setFuncionarioCadastroFacial] = useState<Funcionario | null>(null)
  const [consentimentoFacial, setConsentimentoFacial] = useState(false)
  const [cameraFacialAtiva, setCameraFacialAtiva] = useState(false)
  const [capturandoFacial, setCapturandoFacial] = useState(false)
  const [progressoFacial, setProgressoFacial] = useState(0)
  const [mensagemFacial, setMensagemFacial] = useState('')
  const videoCadastroFacialRef = useRef<HTMLVideoElement | null>(null)
  const streamCadastroFacialRef = useRef<MediaStream | null>(null)


  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([
    {
      nome: 'João da Silva',
      cpf: '123.456.789-00',
      nascimento: '12/04/1991',
      telefone: '(19) 99999-1001',
      email: 'joao@email.com',
      endereco: 'Rua das Flores, 120 - Limeira/SP',
      admissao: '05/02/2024',
      funcao: 'Auxiliar Logístico',
      diaria: 'R$ 100,00',
      status: 'Ativo',
      tipoPix: 'CPF',
      chavePix: '123.456.789-00',
      titularPix: 'João da Silva',
      cidadePix: 'Limeira',
      foto: '',
      facial: 'Cadastrado',
    },
    {
      nome: 'Maria Oliveira',
      cpf: '987.654.321-00',
      nascimento: '08/09/1994',
      telefone: '(19) 99999-1002',
      email: 'maria@email.com',
      endereco: 'Av. Central, 450 - Limeira/SP',
      admissao: '15/03/2025',
      funcao: 'Auxiliar Logístico',
      diaria: 'R$ 100,00',
      status: 'Ativo',
      tipoPix: 'E-mail',
      chavePix: 'maria@email.com',
      titularPix: 'Maria Oliveira',
      cidadePix: 'Limeira',
      foto: '',
      facial: 'Cadastrado',
    },
    {
      nome: 'Carlos Santos',
      cpf: '456.789.123-00',
      nascimento: '20/11/1988',
      telefone: '(19) 99999-1003',
      email: 'carlos@email.com',
      endereco: 'Rua São Paulo, 90 - Limeira/SP',
      admissao: '10/01/2023',
      funcao: 'Auxiliar Logístico',
      diaria: 'R$ 100,00',
      status: 'Inativo',
      tipoPix: 'Celular',
      chavePix: '(19) 99999-1003',
      titularPix: 'Carlos Santos',
      cidadePix: 'Limeira',
      foto: '',
      facial: 'Pendente',
    },
    {
      nome: 'Pedro Almeida',
      cpf: '321.654.987-00',
      nascimento: '14/05/1990',
      telefone: '(19) 99999-2001',
      email: 'pedro@email.com',
      endereco: 'Rua do Trabalho, 200 - Limeira/SP',
      admissao: '03/06/2025',
      funcao: 'Auxiliar Logístico',
      diaria: 'R$ 100,00',
      status: 'Ativo',
      tipoPix: 'CPF',
      chavePix: '321.654.987-00',
      titularPix: 'Pedro Almeida',
      cidadePix: 'Limeira',
      foto: '',
      facial: 'Cadastrado',
    },
    {
      nome: 'Lucas Ferreira',
      cpf: '741.852.963-00',
      nascimento: '19/02/1993',
      telefone: '(19) 99999-3001',
      email: 'lucas@email.com',
      endereco: 'Rua Limeira, 85 - Limeira/SP',
      admissao: '10/04/2024',
      funcao: 'Auxiliar Logístico',
      diaria: 'R$ 100,00',
      status: 'Ativo',
      tipoPix: 'Celular',
      chavePix: '(19) 99999-3001',
      titularPix: 'Lucas Ferreira',
      cidadePix: 'Limeira',
      foto: '',
      facial: 'Cadastrado',
    },
  ])

  const [novoFuncionario, setNovoFuncionario] =
    useState<Funcionario>(funcionarioVazio)

  const [editandoFuncionario, setEditandoFuncionario] = useState(false)
  const [funcionarioEmEdicao, setFuncionarioEmEdicao] =
    useState<Funcionario | null>(null)
  const [cpfOriginalEdicao, setCpfOriginalEdicao] = useState('')

  const [registrosPonto, setRegistrosPonto] = useState<RegistroPonto[]>([])

  const [diarias, setDiarias] = useState<Diaria[]>([])

  const [fechamentos, setFechamentos] = useState<Fechamento[]>([])

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([
    {
      nome: 'João da Silva',
      periodo: '01/08/2026 a 15/08/2026',
      quantidadeDiarias: 7,
      valorTotal: 1050,
      pix: '123.456.789-00',
      status: 'Pago',
      dataPagamento: '20/08/2026 14:20',
    },
    {
      nome: 'Maria Oliveira',
      periodo: '01/08/2026 a 15/08/2026',
      quantidadeDiarias: 6,
      valorTotal: 900,
      pix: 'maria@email.com',
      status: 'Pago',
      dataPagamento: '20/08/2026 14:28',
    },
    {
      nome: 'Lucas Ferreira',
      periodo: '01/08/2026 a 15/08/2026',
      quantidadeDiarias: 8,
      valorTotal: 1360,
      pix: '(19) 99999-3001',
      status: 'Pago',
      dataPagamento: '20/08/2026 14:35',
    },
    {
      nome: 'João da Silva',
      periodo: '16/08/2026 a 31/08/2026',
      quantidadeDiarias: 10,
      valorTotal: 1500,
      pix: '123.456.789-00',
      status: 'Aguardando',
      dataPagamento: '-',
    },
    {
      nome: 'Maria Oliveira',
      periodo: '16/08/2026 a 31/08/2026',
      quantidadeDiarias: 9,
      valorTotal: 1170,
      pix: 'maria@email.com',
      status: 'Aguardando',
      dataPagamento: '-',
    },
    {
      nome: 'Pedro Almeida',
      periodo: '16/08/2026 a 31/08/2026',
      quantidadeDiarias: 8,
      valorTotal: 1200,
      pix: '321.654.987-00',
      status: 'Aguardando',
      dataPagamento: '-',
    },
  ])

  const [documentos, setDocumentos] = useState<Documento[]>([])

  const [novoDocumento, setNovoDocumento] = useState({
    funcionario: '',
    tipo: '',
    titulo: '',
    validade: '',
    nomeArquivo: '',
    arquivo: null as File | null,
  })

  const [enviandoDocumento, setEnviandoDocumento] = useState(false)

  const armazenamentoCarregado = useRef(false)
  const [ultimaSincronizacaoLocal, setUltimaSincronizacaoLocal] =
    useState<string>('')

  const CHAVE_DADOS_LOCAIS = 'gestao-sindical-dhl-mogi-mirim-v1'

  useEffect(() => {
    try {
      const dadosSalvos = window.localStorage.getItem(CHAVE_DADOS_LOCAIS)

      if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos)

        // Arquitetura de dados:
        // O navegador mantém temporariamente apenas os módulos que ainda
        // não foram migrados para o backend real. Dados operacionais e
        // financeiros passam a vir exclusivamente do Supabase.
        if (Array.isArray(dados.listasDiaristas)) {
          setListasDiaristas(dados.listasDiaristas)
        }

        if (typeof dados.salvoEm === 'string') {
          setUltimaSincronizacaoLocal(dados.salvoEm)
        }
      }
    } catch (erro) {
      console.error('Não foi possível carregar os dados legados do navegador:', erro)
    } finally {
      armazenamentoCarregado.current = true
    }
  }, [])

  async function carregarConfiguracoesSupabase() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'daily_rules')
      .maybeSingle()

    if (error) {
      console.error('Não foi possível carregar as configurações do Supabase:', error)
      mostrarNotificacao('Não foi possível carregar as configurações do sistema.', 'error')
      return
    }

    if (!data?.setting_value || typeof data.setting_value !== 'object') return

    const valor = data.setting_value as Record<string, unknown>
    const configuracao: ConfiguracaoValores = {
      diariaBase: Number(valor.dailyBase ?? 100),
      percentualSabado: Number(valor.saturdayPercentage ?? 50),
      percentualDomingo: Number(valor.sundayPercentage ?? 100),
      percentualFeriado: Number(valor.holidayPercentage ?? 100),
      vt: Number(valor.transport ?? 12),
      vr: Number(valor.meal ?? 26),
      horarioEntradaPadrao: String(valor.standardStart ?? '09:30'),
      horarioSaidaPadrao: String(valor.standardEnd ?? '18:30'),
    }

    setConfiguracaoValores(configuracao)
    setConfiguracaoTemporaria(configuracao)
  }

  async function carregarFeriadosSupabase() {
    const { data, error } = await supabase
      .from('holidays')
      .select('id, holiday_date, name, holiday_type, active, created_by, created_at, updated_at')
      .order('holiday_date', { ascending: true })

    if (error) {
      console.error('Não foi possível carregar os feriados do Supabase:', error)
      mostrarNotificacao(`Não foi possível carregar os feriados: ${error.message}`, 'error')
      return
    }

    const feriadosReais = ((data || []) as FeriadoSupabase[]).map((feriado) => ({
      id: feriado.id,
      data: feriado.holiday_date,
      nome: feriado.name,
      tipo: feriado.holiday_type,
      ativo: feriado.active,
    }))

    setFeriados(feriadosReais)
  }

  async function carregarAuditoriaSupabase() {
    if (usuarioLogado?.perfil !== 'Administrador') {
      setRegistrosAuditoria([])
      return
    }

    const { data, error } = await supabase
      .from('audit_logs')
      .select(
        'id, user_id, user_name, user_role, action, module, details, severity, entity_type, entity_id, ip_address, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('Não foi possível carregar a auditoria do Supabase:', error)
      mostrarNotificacao(
        `Não foi possível carregar a auditoria: ${error.message}`,
        'error'
      )
      return
    }

    const registros = ((data || []) as RegistroAuditoriaSupabase[]).map(
      (registro) => ({
        id: Number(registro.id),
        dataHora: new Date(registro.created_at).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        }),
        usuario: registro.user_name || 'Sistema',
        perfil: (registro.user_role || 'Sistema') as PerfilAcesso | 'Sistema',
        acao: registro.action,
        modulo: registro.module,
        detalhe: registro.details || '-',
        nivel: registro.severity,
        entidade: registro.entity_type || undefined,
        entityId: registro.entity_id || undefined,
        ip: registro.ip_address || undefined,
      })
    )

    setRegistrosAuditoria(registros)
  }

  async function carregarFuncionariosSupabase() {
    const { data, error } = await supabase
      .from('employees')
      .select(
        'id, full_name, cpf, birth_date, phone, email, address, hire_date, job_title, status, daily_rate, pix_type, pix_key, pix_holder, pix_city, photo_path, facial_status'
      )
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Não foi possível carregar os funcionários do Supabase:', error)
      mostrarNotificacao(
        `Não foi possível carregar os funcionários: ${error.message}`,
        'error'
      )
      return
    }

    const registros = (data || []) as FuncionarioSupabase[]
    setFuncionarios(registros.map(funcionarioDoSupabase))
  }

  async function carregarDocumentosSupabase() {
    const { data, error } = await supabase
      .from('employee_documents')
      .select(
        'id, employee_id, document_type, title, storage_path, original_filename, mime_type, file_size, expires_at, status, created_at, employee:employees!employee_documents_employee_id_fkey(full_name)'
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Não foi possível carregar os documentos do Supabase:', error)
      mostrarNotificacao(
        `Não foi possível carregar os documentos: ${error.message}`,
        'error'
      )
      return
    }

    const registros = ((data || []) as unknown as DocumentoSupabase[]).map((registro) => {
      const empregado = Array.isArray(registro.employee)
        ? registro.employee[0]
        : registro.employee

      return {
        id: registro.id,
        employeeId: registro.employee_id,
        nome: registro.original_filename || registro.title,
        titulo: registro.title,
        funcionario: empregado?.full_name || 'Funcionário',
        tipo: registro.document_type,
        dataEnvio: new Date(registro.created_at).toLocaleDateString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
        }),
        validade: registro.expires_at ? dataBancoParaBR(registro.expires_at) : '-',
        status: registro.status,
        storagePath: registro.storage_path,
        mimeType: registro.mime_type || '',
        tamanho: Number(registro.file_size) || 0,
      } satisfies Documento
    })

    setDocumentos(registros)
  }

  function dataISOEmSaoPaulo(data: Date = new Date()) {
    const partes = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(data)

    const ano = partes.find((parte) => parte.type === 'year')?.value || ''
    const mes = partes.find((parte) => parte.type === 'month')?.value || ''
    const dia = partes.find((parte) => parte.type === 'day')?.value || ''
    return `${ano}-${mes}-${dia}`
  }

  function dataBancoParaBR(data: string) {
    const [ano, mes, dia] = data.split('-')
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data
  }

  async function carregarDiariasSupabase() {
    const { data, error } = await supabase
      .from('daily_records')
      .select(
        'id, employee_id, work_date, base_amount, additional_amount, transport_amount, meal_amount, total_amount, day_type, status, generated_from, observation, employee:employees!daily_records_employee_id_fkey(id, full_name, job_title)'
      )
      .order('work_date', { ascending: false })

    if (error) {
      console.error('Não foi possível carregar as diárias do Supabase:', error)
      mostrarNotificacao(
        `Não foi possível carregar as diárias: ${error.message}`,
        'error'
      )
      return
    }

    const registros = ((data || []) as unknown as DiariaSupabase[]).map((registro) => {
      const empregado = Array.isArray(registro.employee)
        ? registro.employee[0]
        : registro.employee

      return {
        id: registro.id,
        employeeId: registro.employee_id,
        nome: empregado?.full_name || 'Funcionário',
        funcao: empregado?.job_title || 'Auxiliar Logístico',
        data: dataBancoParaBR(registro.work_date),
        tipoDia: registro.day_type === 'Útil' ? 'Semana' as const : registro.day_type,
        diariaBase: Number(registro.base_amount) || 0,
        adicional: Number(registro.additional_amount) || 0,
        vt: Number(registro.transport_amount) || 0,
        vr: Number(registro.meal_amount) || 0,
        valor: Number(registro.total_amount) || 0,
        status: registro.status,
        geradaPor: registro.generated_from,
        observacao: registro.observation || '',
      }
    })

    setDiarias(registros)
  }


  function dataISOParaDateLocal(dataISO: string) {
    const [ano, mes, dia] = dataISO.split('-').map(Number)
    return new Date(ano, (mes || 1) - 1, dia || 1, 12)
  }

  function pagamentoPrevistoPorPeriodo(startDate: string) {
    const inicio = dataISOParaDateLocal(startDate)
    const primeira = inicio.getDate() <= 15
    const pagamento = primeira
      ? new Date(inicio.getFullYear(), inicio.getMonth(), 20, 12)
      : new Date(inicio.getFullYear(), inicio.getMonth() + 1, 5, 12)
    return pagamento.toLocaleDateString('pt-BR')
  }

  async function carregarPagamentosSupabase() {
    const [pagamentosResposta, vinculosResposta, diariasResposta] = await Promise.all([
      supabase
        .from('payments')
        .select(
          'id, employee_id, closing_id, amount, payment_method, status, pix_key_snapshot, pix_holder_snapshot, pix_city_snapshot, transaction_reference, paid_at, observation, employee:employees!payments_employee_id_fkey(full_name), closing:closings!payments_closing_id_fkey(start_date, end_date)'
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('closing_daily_records')
        .select('closing_id, daily_record_id'),
      supabase
        .from('daily_records')
        .select('id, employee_id'),
    ])

    if (pagamentosResposta.error) {
      console.error('Não foi possível carregar os pagamentos do Supabase:', pagamentosResposta.error)
      mostrarNotificacao(
        `Não foi possível carregar os pagamentos: ${pagamentosResposta.error.message}`,
        'error'
      )
      return
    }

    if (vinculosResposta.error) {
      console.error('Não foi possível carregar os vínculos para contar diárias:', vinculosResposta.error)
    }

    if (diariasResposta.error) {
      console.error('Não foi possível carregar as diárias para contar pagamentos:', diariasResposta.error)
    }

    const vinculos = (vinculosResposta.data || []) as Array<{
      closing_id: string
      daily_record_id: string
    }>
    const diariasMinimas = (diariasResposta.data || []) as Array<{
      id: string
      employee_id: string
    }>

    const registros = ((pagamentosResposta.data || []) as unknown as PagamentoSupabase[]).map((registro) => {
      const empregado = Array.isArray(registro.employee)
        ? registro.employee[0]
        : registro.employee
      const fechamento = Array.isArray(registro.closing)
        ? registro.closing[0]
        : registro.closing

      const idsDiariasDoFechamento = vinculos
        .filter((item) => item.closing_id === registro.closing_id)
        .map((item) => item.daily_record_id)

      const quantidadeDiarias = diariasMinimas.filter(
        (item) =>
          item.employee_id === registro.employee_id &&
          idsDiariasDoFechamento.includes(item.id)
      ).length

      const periodo = fechamento
        ? `${dataBancoParaBR(fechamento.start_date)} a ${dataBancoParaBR(fechamento.end_date)}`
        : '-'

      const statusTela: Pagamento['status'] =
        registro.status === 'Pendente' ? 'Aguardando' : registro.status

      return {
        id: registro.id,
        employeeId: registro.employee_id,
        closingId: registro.closing_id || undefined,
        nome: empregado?.full_name || 'Funcionário',
        periodo,
        quantidadeDiarias,
        valorTotal: Number(registro.amount) || 0,
        pix: registro.pix_key_snapshot || '-',
        pixTitular: registro.pix_holder_snapshot || undefined,
        pixCidade: registro.pix_city_snapshot || undefined,
        status: statusTela,
        dataPagamento: registro.paid_at
          ? new Date(registro.paid_at).toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              dateStyle: 'short',
              timeStyle: 'short',
            })
          : '-',
      }
    })

    setPagamentos(registros)
  }

  async function carregarFechamentosSupabase() {
    const [{ data: dadosFechamentos, error: erroFechamentos }, { data: vinculos, error: erroVinculos }] =
      await Promise.all([
        supabase
          .from('closings')
          .select('id, start_date, end_date, status, total_daily, total_transport, total_meal, total_amount')
          .order('start_date', { ascending: false }),
        supabase
          .from('closing_daily_records')
          .select('closing_id, daily_record_id'),
      ])

    if (erroFechamentos) {
      console.error('Não foi possível carregar os fechamentos:', erroFechamentos)
      mostrarNotificacao(`Não foi possível carregar os fechamentos: ${erroFechamentos.message}`, 'error')
      return
    }

    if (erroVinculos) {
      console.error('Não foi possível carregar os vínculos do fechamento:', erroVinculos)
    }

    const links = (vinculos || []) as Array<{ closing_id: string; daily_record_id: string }>
    const registros = ((dadosFechamentos || []) as FechamentoSupabase[]).map((item) => ({
      id: item.id,
      periodo: `${dataBancoParaBR(item.start_date)} a ${dataBancoParaBR(item.end_date)}`,
      pagamento: pagamentoPrevistoPorPeriodo(item.start_date),
      status: item.status,
      startDate: item.start_date,
      endDate: item.end_date,
      totalDaily: Number(item.total_daily) || 0,
      totalTransport: Number(item.total_transport) || 0,
      totalMeal: Number(item.total_meal) || 0,
      totalAmount: Number(item.total_amount) || 0,
      dailyRecordIds: links.filter((link) => link.closing_id === item.id).map((link) => link.daily_record_id),
    }))

    setFechamentos(registros)
  }

  async function carregarListasDiaristasSupabase() {
    const { data: listas, error: erroListas } = await supabase
      .from('work_lists')
      .select('id, work_date, unit_name, status, notes, created_at')
      .order('work_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (erroListas) {
      console.error('Não foi possível carregar as listas do dia:', erroListas)
      mostrarNotificacao(
        `Não foi possível carregar as listas do dia: ${erroListas.message}`,
        'error'
      )
      return
    }

    const ids = (listas || []).map((lista: any) => lista.id)
    let vinculos: any[] = []

    if (ids.length > 0) {
      const { data, error } = await supabase
        .from('work_list_employees')
        .select(
          'work_list_id, employee_id, scheduled_start, scheduled_end, status, observation, employee:employees!work_list_employees_employee_id_fkey(id, full_name)'
        )
        .in('work_list_id', ids)

      if (error) {
        console.error('Não foi possível carregar os diaristas das listas:', error)
        mostrarNotificacao(
          `Não foi possível carregar os diaristas das listas: ${error.message}`,
          'error'
        )
        return
      }

      vinculos = data || []
    }

    const listasReais: ListaDiaristas[] = (listas || []).map((lista: any) => {
      const membros = vinculos.filter((item: any) => item.work_list_id === lista.id)
      const primeiroHorario = membros.find((item: any) => item.scheduled_start)?.scheduled_start

      return {
        id: lista.id,
        data: lista.work_date,
        local: lista.unit_name || '',
        horario: primeiroHorario ? String(primeiroHorario).slice(0, 5) : '09:30',
        observacao: lista.notes || '',
        diaristas: membros
          .map((item: any) => {
            const empregado = Array.isArray(item.employee)
              ? item.employee[0]
              : item.employee
            return empregado?.full_name || ''
          })
          .filter(Boolean),
        ausentes: membros
          .filter((item: any) => item.status === 'Ausente')
          .map((item: any) => {
            const empregado = Array.isArray(item.employee)
              ? item.employee[0]
              : item.employee
            return empregado?.full_name || ''
          })
          .filter(Boolean),
        criadaEm: lista.created_at
          ? new Date(lista.created_at).toLocaleString('pt-BR')
          : '',
      }
    })

    setListasDiaristas(listasReais)

    setListaDiaristasSelecionada((atual) => {
      if (!atual) return null
      return listasReais.find((lista) => lista.id === atual.id) || null
    })
  }

  async function carregarPontosSupabase() {
    const [{ data: pontos, error: erroPontos }, { data: empregados, error: erroEmpregados }] =
      await Promise.all([
        supabase
          .from('attendance_records')
          .select(
            'id, employee_id, occurred_at, record_type, source, facial_verified, facial_confidence, observation, employee:employees!attendance_records_employee_id_fkey(id, full_name, job_title, status)'
          )
          .order('occurred_at', { ascending: false }),
        supabase
          .from('employees')
          .select('id, full_name, job_title, status')
          .eq('status', 'Ativo')
          .order('full_name', { ascending: true }),
      ])

    if (erroPontos) {
      console.error('Não foi possível carregar os registros de ponto:', erroPontos)
      mostrarNotificacao(
        `Não foi possível carregar o controle de ponto: ${erroPontos.message}`,
        'error'
      )
      return
    }

    if (erroEmpregados) {
      console.error('Não foi possível carregar os funcionários para o ponto:', erroEmpregados)
      mostrarNotificacao(
        `Não foi possível preparar os funcionários para o ponto: ${erroEmpregados.message}`,
        'error'
      )
      return
    }

    const registrosReais = ((pontos || []) as unknown as RegistroPontoSupabase[]).map(
      (registro) => {
        const ocorrido = new Date(registro.occurred_at)
        const empregado = Array.isArray(registro.employee)
          ? registro.employee[0]
          : registro.employee

        return {
          id: registro.id,
          employeeId: registro.employee_id,
          nome: empregado?.full_name || 'Funcionário',
          funcao: empregado?.job_title || 'Auxiliar Logístico',
          data: ocorrido.toLocaleDateString('pt-BR'),
          horario: ocorrido.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: 'Registrado' as const,
          metodo:
            registro.source === 'Facial'
              ? 'Reconhecimento facial'
              : registro.source,
          tipoRegistro: registro.record_type,
          facialVerificada: registro.facial_verified,
          confiancaFacial:
            registro.facial_confidence === null
              ? null
              : Number(registro.facial_confidence),
          observacao: registro.observation || '',
        }
      }
    )

    // Produção 1.9.2: monta pendências a partir da escala real de TODAS as datas
    // até hoje. Assim, dias anteriores continuam ajustáveis no Controle de Ponto.
    const { data: listasPonto, error: erroListasPonto } = await supabase
      .from('work_lists')
      .select('id, work_date')
      .lte('work_date', dataLocalHoje)
      .neq('status', 'Cancelada')
      .order('work_date', { ascending: false })

    if (erroListasPonto) {
      console.error('Não foi possível consultar as escalas para o ponto:', erroListasPonto)
    }

    const idsListasPonto = (listasPonto || []).map((lista: any) => lista.id)
    let membrosEscalados: any[] = []

    if (idsListasPonto.length > 0) {
      const { data: membros, error: erroMembros } = await supabase
        .from('work_list_employees')
        .select('work_list_id, employee_id, status')
        .in('work_list_id', idsListasPonto)
        .in('status', ['Escalado', 'Presente'])

      if (erroMembros) {
        console.error('Não foi possível consultar os diaristas escalados para o ponto:', erroMembros)
      } else {
        membrosEscalados = membros || []
      }
    }

    const empregadoPorId = new Map(
      (empregados || []).map((empregado: any) => [empregado.id, empregado])
    )
    const listaPorId = new Map(
      (listasPonto || []).map((lista: any) => [lista.id, lista])
    )

    // Evita repetir o mesmo funcionário quando houver mais de uma lista na mesma data.
    const escalasUnicas = new Map<string, { employeeId: string; workDate: string }>()

    membrosEscalados.forEach((membro: any) => {
      const lista: any = listaPorId.get(membro.work_list_id)
      if (!lista?.work_date || !membro.employee_id) return

      const chave = `${lista.work_date}|${membro.employee_id}`
      if (!escalasUnicas.has(chave)) {
        escalasUnicas.set(chave, {
          employeeId: membro.employee_id,
          workDate: lista.work_date,
        })
      }
    })

    const pendentes: RegistroPonto[] = Array.from(escalasUnicas.values()).flatMap(
      ({ employeeId, workDate }): RegistroPonto[] => {
        const empregado: any = empregadoPorId.get(employeeId)
        if (!empregado) return []

        const [ano, mes, dia] = String(workDate).split('-')
        if (!ano || !mes || !dia) return []
        const dataBR = `${dia}/${mes}/${ano}`

        const registrosDaData = registrosReais
          .filter(
            (registro) =>
              registro.data === dataBR && registro.employeeId === employeeId
          )
          .sort((a, b) => a.horario.localeCompare(b.horario))

        const temEntrada = registrosDaData.some(
          (registro) => registro.tipoRegistro === 'Entrada'
        )
        const temSaida = registrosDaData.some(
          (registro) => registro.tipoRegistro === 'Saída'
        )

        if (!temEntrada) {
          return [{
            employeeId,
            nome: empregado.full_name,
            funcao: empregado.job_title || 'Auxiliar Logístico',
            data: dataBR,
            horario: '--:--',
            status: 'Pendente' as const,
            tipoRegistro: 'Entrada' as const,
          }]
        }

        if (!temSaida) {
          return [{
            employeeId,
            nome: empregado.full_name,
            funcao: empregado.job_title || 'Auxiliar Logístico',
            data: dataBR,
            horario: '--:--',
            status: 'Pendente' as const,
            tipoRegistro: 'Saída' as const,
          }]
        }

        return []
      }
    )

    setRegistrosPonto([...pendentes, ...registrosReais])
  }

  useEffect(() => {
    if (modoAcesso !== 'admin' || !usuarioLogado) return

    void (async () => {
      await carregarFuncionariosSupabase()
      await carregarListasDiaristasSupabase()
      await carregarPontosSupabase()
      await carregarDiariasSupabase()
      await carregarFechamentosSupabase()
      await carregarPagamentosSupabase()
      await carregarDocumentosSupabase()
      await carregarConfiguracoesSupabase()
      await carregarFeriadosSupabase()
      if (usuarioLogado.perfil === 'Administrador') {
        await carregarUsuariosSupabase()
        await carregarAuditoriaSupabase()
      }
    })()
  }, [modoAcesso, usuarioLogado?.id])

  useEffect(() => {
    if (modoAcesso !== 'admin' || !usuarioLogado) return

    let timerAtualizacao: number | null = null

    const atualizarFinanceiroEmTempoReal = () => {
      if (timerAtualizacao) {
        window.clearTimeout(timerAtualizacao)
      }

      timerAtualizacao = window.setTimeout(() => {
        void carregarPagamentosSupabase()
        void carregarFechamentosSupabase()
      }, 180)
    }

    const canalFinanceiro = supabase
      .channel(`financeiro-tempo-real-${usuarioLogado.authId || usuarioLogado.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        atualizarFinanceiroEmTempoReal
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'closings' },
        atualizarFinanceiroEmTempoReal
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error(
            'Não foi possível ativar a atualização em tempo real de pagamentos.'
          )
        }
      })

    return () => {
      if (timerAtualizacao) {
        window.clearTimeout(timerAtualizacao)
      }

      void supabase.removeChannel(canalFinanceiro)
    }
  }, [modoAcesso, usuarioLogado?.id, usuarioLogado?.authId])

  useEffect(() => {
    let ativo = true

    async function restaurarSessaoSupabase() {
      const { data, error } = await supabase.auth.getSession()

      if (!ativo) return

      if (error) {
        console.error('Não foi possível restaurar a sessão do Supabase:', error)
        return
      }

      if (data.session?.user) {
        await carregarPerfilAutenticado(data.session.user)
      }
    }

    void restaurarSessaoSupabase()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!ativo) return

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUsuarioLogado(null)
        setModoAcesso((modoAtual) => (modoAtual === 'admin' ? 'inicio' : modoAtual))
        return
      }

      if (event === 'PASSWORD_RECOVERY') {
        setModoAcesso('inicio')
        setRecuperacaoAberta(true)
        setRecuperacaoEtapa('novaSenha')
        setRecuperacaoNovaSenha('')
        setRecuperacaoConfirmarSenha('')
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        window.setTimeout(() => {
          if (ativo) void carregarPerfilAutenticado(session.user)
        }, 0)
      }
    })

    return () => {
      ativo = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!armazenamentoCarregado.current) return

    try {
      const salvoEm = new Date().toLocaleString('pt-BR')

      const dadosLegadosParaSalvar = {
        versao: 2,
        salvoEm,
        // Temporário até a migração do módulo de listas:
        listasDiaristas,
      }

      window.localStorage.setItem(
        CHAVE_DADOS_LOCAIS,
        JSON.stringify(dadosLegadosParaSalvar)
      )

      setUltimaSincronizacaoLocal(salvoEm)
    } catch (erro) {
      console.error('Não foi possível salvar os dados legados locais:', erro)
    }
  }, [listasDiaristas])

  function limparDadosLocais() {
    const confirmou = window.confirm(
      'Isso apagará somente os dados legados que ainda permanecem neste navegador. Os dados já migrados para o Supabase não serão apagados. Deseja continuar?'
    )

    if (!confirmou) return

    registrarAuditoria(
      'Restauração solicitada',
      'Configurações',
      'Os dados legados armazenados neste navegador foram removidos.',
      'Crítico'
    )

    window.localStorage.removeItem(CHAVE_DADOS_LOCAIS)
    window.location.reload()
  }

  function exportarBackupCompleto() {
    if (!podeAdministrar) {
      mostrarNotificacao('Somente o Administrador pode exportar o backup completo.', 'warning')
      return
    }

    try {
      const agora = new Date()
      const carimbo = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}_${String(agora.getHours()).padStart(2, '0')}-${String(agora.getMinutes()).padStart(2, '0')}`
      const backup = {
        produto: 'Gestão de Diaristas - Sindicato',
        versao: '1.0',
        exportadoEm: agora.toISOString(),
        dados: {
          funcionarios,
          registrosPonto,
          diarias,
          fechamentos,
          pagamentos,
          documentos,
          listasDiaristas,
          usuariosSistema,
          feriados,
          configuracaoValores,
        },
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `backup-sindicato-${carimbo}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      registrarAuditoria(
        'Backup exportado',
        'Configurações',
        'Backup completo dos dados locais foi exportado em JSON.',
        'Informação'
      )
      mostrarNotificacao('Backup completo exportado com sucesso.', 'success')
    } catch (erro) {
      console.error(erro)
      mostrarNotificacao('Não foi possível exportar o backup.', 'error')
    }
  }

  function solicitarRestauracaoBackup() {
    if (!podeAdministrar) {
      mostrarNotificacao('Somente o Administrador pode restaurar backups.', 'warning')
      return
    }
    inputBackupRef.current?.click()
  }

  function importarBackupCompleto(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!arquivo) return

    const leitor = new FileReader()
    leitor.onload = () => {
      try {
        const conteudo = JSON.parse(String(leitor.result || '{}'))
        const dados = conteudo?.dados ?? conteudo

        const colecoesObrigatorias = [
          'funcionarios',
          'registrosPonto',
          'diarias',
          'fechamentos',
          'pagamentos',
          'documentos',
          'listasDiaristas',
          'usuariosSistema',
          'feriados',
        ]

        const invalido = colecoesObrigatorias.some(
          (chave) => !Array.isArray(dados?.[chave])
        )

        if (invalido || !dados?.configuracaoValores) {
          mostrarNotificacao('Arquivo de backup inválido ou incompleto.', 'error')
          return
        }

        if (!window.confirm('Restaurar este backup substituirá os dados atuais deste navegador. Deseja continuar?')) {
          return
        }

        setFuncionarios(dados.funcionarios)
        setRegistrosPonto(dados.registrosPonto)
        setDiarias(dados.diarias)
        setFechamentos(dados.fechamentos)
        setPagamentos(dados.pagamentos)
        setDocumentos(dados.documentos)
        setListasDiaristas(dados.listasDiaristas)
        setUsuariosSistema(dados.usuariosSistema)
        setFeriados(dados.feriados)
        setConfiguracaoValores(dados.configuracaoValores)
        setConfiguracaoTemporaria(dados.configuracaoValores)

        window.setTimeout(() => {
          registrarAuditoria(
            'Backup restaurado',
            'Configurações',
            `Backup ${arquivo.name} restaurado no navegador.`,
            'Crítico'
          )
        }, 0)
        mostrarNotificacao('Backup restaurado com sucesso.', 'success')
      } catch (erro) {
        console.error(erro)
        mostrarNotificacao('Não foi possível ler este arquivo de backup.', 'error')
      }
    }
    leitor.readAsText(arquivo)
  }

  function abrirEdicaoDiaria(index: number) {
    if (!podeAdministrar) {
      mostrarNotificacao('Somente o Administrador pode editar uma diária.', 'warning')
      return
    }
    const diaria = diarias[index]
    if (!diaria) return
    setDiariaEditando({ index, diaria: { ...diaria } })
  }

  function alterarCampoDiaria<K extends keyof Diaria>(campo: K, valor: Diaria[K]) {
    setDiariaEditando((atual) =>
      atual
        ? { ...atual, diaria: { ...atual.diaria, [campo]: valor } }
        : atual
    )
  }

  async function salvarEdicaoDiaria() {
    if (!diariaEditando || !podeAdministrar) return

    const diariaAtualizada = {
      ...diariaEditando.diaria,
      diariaBase: Math.max(0, Number(diariaEditando.diaria.diariaBase) || 0),
      adicional: Math.max(0, Number(diariaEditando.diaria.adicional) || 0),
      vt: Math.max(0, Number(diariaEditando.diaria.vt) || 0),
      vr: Math.max(0, Number(diariaEditando.diaria.vr) || 0),
    }
    diariaAtualizada.valor =
      diariaAtualizada.diariaBase +
      diariaAtualizada.adicional +
      diariaAtualizada.vt +
      diariaAtualizada.vr

    if (!diariaAtualizada.id) {
      mostrarNotificacao(
        'Esta diária não possui vínculo com o Supabase. Recarregue a página e tente novamente.',
        'error'
      )
      return
    }

    const { data: authData } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('daily_records')
      .update({
        base_amount: diariaAtualizada.diariaBase,
        additional_amount: diariaAtualizada.adicional,
        transport_amount: diariaAtualizada.vt,
        meal_amount: diariaAtualizada.vr,
        total_amount: diariaAtualizada.valor,
        observation: diariaAtualizada.observacao || null,
        updated_by: authData.user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', diariaAtualizada.id)

    if (error) {
      console.error('Não foi possível atualizar a diária no Supabase:', error)
      mostrarNotificacao(`Não foi possível atualizar a diária: ${error.message}`, 'error')
      return
    }

    await carregarDiariasSupabase()

    registrarAuditoria(
      'Diária editada manualmente',
      'Diárias',
      `${diariaAtualizada.nome} - ${diariaAtualizada.data}: total ajustado para ${moeda(diariaAtualizada.valor)} e salvo no Supabase.`,
      'Atenção'
    )
    setDiariaEditando(null)
    mostrarNotificacao('Diária atualizada no Supabase.', 'success')
  }

  async function cancelarDiaria(index: number) {
    const diaria = diarias[index]

    if (!diaria) return

    if (!podeAdministrar) {
      mostrarNotificacao('Somente o Administrador pode cancelar uma diária.', 'warning')
      return
    }

    if (!diaria.id) {
      mostrarNotificacao(
        'Esta diária não possui vínculo com o Supabase. Recarregue a página e tente novamente.',
        'error'
      )
      return
    }

    if (diaria.status === 'Cancelada') {
      mostrarNotificacao('Esta diária já está cancelada.', 'info')
      return
    }

    const { data: vinculoFechamento, error: erroVinculo } = await supabase
      .from('closing_daily_records')
      .select('closing_id')
      .eq('daily_record_id', diaria.id)
      .limit(1)
      .maybeSingle()

    if (erroVinculo) {
      console.error('Não foi possível verificar o fechamento da diária:', erroVinculo)
      mostrarNotificacao(
        `Não foi possível verificar se a diária está em um fechamento: ${erroVinculo.message}`,
        'error'
      )
      return
    }

    if (vinculoFechamento?.closing_id) {
      mostrarNotificacao(
        'Esta diária já está vinculada a um fechamento. Para preservar os valores financeiros, ela não pode ser cancelada por esta tela.',
        'warning'
      )
      return
    }

    const motivo = window.prompt(
      `Motivo do cancelamento da diária de ${diaria.nome} em ${diaria.data}:`
    )

    if (motivo === null) return

    if (!motivo.trim()) {
      mostrarNotificacao('Informe o motivo do cancelamento da diária.', 'warning')
      return
    }

    const confirmou = window.confirm(
      `Cancelar a diária de ${diaria.nome} em ${diaria.data}?\n\n` +
        `Valor: ${moeda(diaria.valor)}\n` +
        `Motivo: ${motivo.trim()}\n\n` +
        'A diária permanecerá no histórico com status Cancelada.'
    )

    if (!confirmou) return

    const { data: authData } = await supabase.auth.getUser()
    const observacaoAnterior = diaria.observacao?.trim()
    const novaObservacao = [
      observacaoAnterior,
      `Cancelada: ${motivo.trim()}`,
    ]
      .filter(Boolean)
      .join(' | ')

    const { error } = await supabase
      .from('daily_records')
      .update({
        status: 'Cancelada',
        observation: novaObservacao || null,
        updated_by: authData.user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', diaria.id)

    if (error) {
      console.error('Não foi possível cancelar a diária:', error)
      mostrarNotificacao(`Não foi possível cancelar a diária: ${error.message}`, 'error')
      return
    }

    await registrarAuditoria(
      'Diária cancelada',
      'Diárias',
      `${diaria.nome} - ${diaria.data}: diária de ${moeda(
        diaria.valor
      )} cancelada. Motivo: ${motivo.trim()}.`,
      'Atenção',
      undefined,
      'daily_record',
      diaria.id
    )

    await carregarDiariasSupabase()
    mostrarNotificacao('Diária cancelada com sucesso.', 'success')
  }

  function moeda(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  function converterDataBR(data: string) {
    if (!data || data === '-') return null

    const [dia, mes, ano] = data.split('/').map(Number)

    return new Date(ano, mes - 1, dia)
  }

  function converterDataInput(data: string) {
    if (!data) return null

    const [ano, mes, dia] = data.split('-').map(Number)

    return new Date(ano, mes - 1, dia)
  }

  function mostrarNotificacao(
    mensagem: string,
    tipo: TipoNotificacao = 'success'
  ) {
    if (timerNotificacao.current) {
      window.clearTimeout(timerNotificacao.current)
    }

    setNotificacao({ mensagem, tipo })

    timerNotificacao.current = window.setTimeout(() => {
      setNotificacao(null)
    }, 3500)
  }

  function fecharNotificacao() {
    if (timerNotificacao.current) {
      window.clearTimeout(timerNotificacao.current)
    }

    setNotificacao(null)
  }

  function iconeNotificacao(tipo: TipoNotificacao) {
    if (tipo === 'success') return '✓'
    if (tipo === 'warning') return '!'
    if (tipo === 'error') return '×'
    return 'i'
  }


  function escaparHtmlExcel(valor: string) {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function dataBRParaDate(data: string) {
    const [dia, mes, ano] = data.split('/').map(Number)
    return new Date(ano, mes - 1, dia, 12, 0, 0)
  }

  function extrairPeriodoFechamento(periodo: string) {
    const partes = periodo.split(' a ').map((item) => item.trim())

    if (partes.length !== 2) return null

    const inicio = dataBRParaDate(partes[0])
    const fim = dataBRParaDate(partes[1])

    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(fim.getTime())
    ) {
      return null
    }

    return { inicio, fim }
  }

  function datasDoPeriodo(periodo: string) {
    const intervalo = extrairPeriodoFechamento(periodo)
    if (!intervalo) return []

    const datas: Date[] = []
    const atual = new Date(intervalo.inicio)

    while (atual <= intervalo.fim) {
      datas.push(new Date(atual))
      atual.setDate(atual.getDate() + 1)
    }

    return datas
  }

  function formatarDataBRExcel(data: Date) {
    return data.toLocaleDateString('pt-BR')
  }

  function nomeArquivoSeguro(texto: string) {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase()
  }

  function exportarFechamentoExcel(fechamento: Fechamento) {
    const datas = datasDoPeriodo(fechamento.periodo)

    if (datas.length === 0) {
      mostrarNotificacao(
        'Não foi possível identificar as datas desse fechamento.',
        'warning'
      )
      return
    }

    const intervalo = extrairPeriodoFechamento(fechamento.periodo)

    if (!intervalo) {
      mostrarNotificacao('Período de fechamento inválido.', 'warning')
      return
    }

    const diariasPeriodo = diarias.filter((diaria) => {
      const data = dataBRParaDate(diaria.data)

      return (
        data >= intervalo.inicio &&
        data <= intervalo.fim
      )
    })

    if (diariasPeriodo.length === 0) {
      mostrarNotificacao(
        'Ainda não existem diárias registradas nesta quinzena para exportar.',
        'warning'
      )
      return
    }

    const nomes = Array.from(
      new Set(diariasPeriodo.map((diaria) => diaria.nome))
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

    const locaisPeriodo = Array.from(
      new Set(
        listasDiaristas
          .filter((lista) => {
            const data = new Date(`${lista.data}T12:00:00`)
            return (
              data >= intervalo.inicio &&
              data <= intervalo.fim &&
              lista.local.trim()
            )
          })
          .map((lista) => lista.local.trim())
      )
    )

    const tituloLocal = 'DHL MOGI MIRIM'

    const moedaExcel = (valor: number) =>
      valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

    const cabecalhoDias = datas
      .map((data) => {
        const diaSemana = data.getDay()
        const fimSemana = diaSemana === 0 || diaSemana === 6
        const classe =
          diaSemana === 0
            ? 'domingo'
            : diaSemana === 6
            ? 'sabado'
            : ''

        return `<th class="dia ${classe}">
          <div>${data.getDate()}</div>
          <small>${fimSemana ? (diaSemana === 6 ? 'SÁB' : 'DOM') : ''}</small>
        </th>`
      })
      .join('')

    const linhas = nomes
      .map((nome, index) => {
        const funcionario = obterFuncionarioPorNome(nome)
        const diariasFuncionario = diariasPeriodo.filter(
          (diaria) => diaria.nome === nome
        )

        const celulasDias = datas
          .map((data) => {
            const dataBR = formatarDataBRExcel(data)
            const diaria = diariasFuncionario.find(
              (item) => item.data === dataBR
            )

            const diaSemana = data.getDay()
            const classe =
              diaSemana === 0
                ? 'domingo'
                : diaSemana === 6
                ? 'sabado'
                : ''

            if (!diaria) {
              return `<td class="valor-dia ${classe}"></td>`
            }

            return `<td class="valor-dia ${classe}">${moedaExcel(
              diaria.valor
            )}</td>`
          })
          .join('')

        const quantidade = diariasFuncionario.length
        const totalBase = diariasFuncionario.reduce(
          (total, diaria) =>
            total + diaria.diariaBase + diaria.adicional,
          0
        )
        const totalVt = diariasFuncionario.reduce(
          (total, diaria) => total + diaria.vt,
          0
        )
        const totalVr = diariasFuncionario.reduce(
          (total, diaria) => total + diaria.vr,
          0
        )
        const totalGeral = diariasFuncionario.reduce(
          (total, diaria) => total + diaria.valor,
          0
        )

        return `
          <tr>
            <td class="numero">${index + 1}</td>
            <td class="nome">
              ${escaparHtmlExcel(nome)}
              <small>${escaparHtmlExcel(funcionario?.funcao || '')}</small>
            </td>
            ${celulasDias}
            <td class="quantidade">${quantidade}</td>
            <td class="dinheiro">${moedaExcel(totalBase)}</td>
            <td class="dinheiro">${moedaExcel(totalVt)}</td>
            <td class="dinheiro">${moedaExcel(totalVr)}</td>
            <td class="dinheiro total">${moedaExcel(totalGeral)}</td>
          </tr>
        `
      })
      .join('')

    const totalQuantidade = diariasPeriodo.length
    const totalBasePeriodo = diariasPeriodo.reduce(
      (total, diaria) => total + diaria.diariaBase + diaria.adicional,
      0
    )
    const totalVtPeriodo = diariasPeriodo.reduce(
      (total, diaria) => total + diaria.vt,
      0
    )
    const totalVrPeriodo = diariasPeriodo.reduce(
      (total, diaria) => total + diaria.vr,
      0
    )
    const totalGeralPeriodo = diariasPeriodo.reduce(
      (total, diaria) => total + diaria.valor,
      0
    )

    const totalColunas = 2 + datas.length + 5

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #111;
            }

            table {
              border-collapse: collapse;
              width: 100%;
            }

            th, td {
              border: 1px solid #333;
              padding: 5px 6px;
              font-size: 10pt;
              vertical-align: middle;
            }

            .cabecalho-sindicato {
              font-weight: bold;
              text-align: center;
              font-size: 11pt;
              border: 1px solid #333;
              padding: 8px;
            }

            .titulo-quinzena {
              font-size: 18pt;
              font-weight: bold;
              text-align: center;
              padding: 9px;
              background: #f4f0f7;
            }

            .subtitulo {
              font-size: 9pt;
              text-align: center;
              color: #555;
              padding: 6px;
            }

            thead th {
              background: #f3f3f3;
              font-weight: bold;
              text-align: center;
            }

            .dia {
              min-width: 45px;
              text-align: center;
            }

            .dia small {
              display: block;
              font-size: 7pt;
            }

            .sabado {
              background: #dcecff;
            }

            .domingo {
              background: #ffdede;
            }

            .numero {
              text-align: center;
              width: 28px;
            }

            .nome {
              min-width: 230px;
              font-weight: bold;
            }

            .nome small {
              display: block;
              font-size: 8pt;
              font-weight: normal;
              color: #555;
            }

            .valor-dia,
            .dinheiro {
              text-align: right;
              white-space: nowrap;
            }

            .quantidade {
              text-align: center;
              font-weight: bold;
            }

            .total {
              font-weight: bold;
              background: #fff5b8;
            }

            .linha-total td {
              font-weight: bold;
              background: #fff200;
              border-top: 2px solid #000;
            }

            .status {
              text-align: left;
              padding: 7px;
              background: #f8f8f8;
            }
          </style>
        </head>
        <body>
          <table>
            <tr>
              <td colspan="${totalColunas}" class="cabecalho-sindicato">
                SINDICATO DOS TRABALHADORES NA MOVIMENTAÇÃO DE MERCADORIAS DE LIMEIRA • OPERAÇÃO DHL MOGI MIRIM
              </td>
            </tr>

            <tr>
              <td colspan="${totalColunas}" class="titulo-quinzena">
                ${escaparHtmlExcel(tituloLocal.toUpperCase())} — ${escaparHtmlExcel(
                  fechamento.periodo
                )}
              </td>
            </tr>

            <tr>
              <td colspan="${totalColunas}" class="subtitulo">
                Fechamento automático gerado pelo sistema • Pagamento previsto: ${escaparHtmlExcel(
                  fechamento.pagamento
                )} • Status: ${escaparHtmlExcel(fechamento.status)}
              </td>
            </tr>

            <thead>
              <tr>
                <th>#</th>
                <th>NOMES</th>
                ${cabecalhoDias}
                <th>DIÁRIAS</th>
                <th>BASE + ADIC.</th>
                <th>VT</th>
                <th>VR</th>
                <th>TOTAL</th>
              </tr>
            </thead>

            <tbody>
              ${linhas}

              <tr class="linha-total">
                <td></td>
                <td>TOTAL DA QUINZENA</td>
                ${datas.map(() => '<td></td>').join('')}
                <td class="quantidade">${totalQuantidade}</td>
                <td class="dinheiro">${moedaExcel(totalBasePeriodo)}</td>
                <td class="dinheiro">${moedaExcel(totalVtPeriodo)}</td>
                <td class="dinheiro">${moedaExcel(totalVrPeriodo)}</td>
                <td class="dinheiro">${moedaExcel(totalGeralPeriodo)}</td>
              </tr>

              <tr>
                <td colspan="${totalColunas}" class="status">
                  Funcionários: ${nomes.length} • Diárias: ${totalQuantidade} • Total geral: R$ ${moedaExcel(
                    totalGeralPeriodo
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    const blob = new Blob(['\ufeff', html], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const periodoArquivo = nomeArquivoSeguro(fechamento.periodo)
    const localArquivo = nomeArquivoSeguro(tituloLocal)

    link.href = url
    link.download = `dhl-mogi-mirim-${periodoArquivo}.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    mostrarNotificacao(
      `Excel da quinzena ${fechamento.periodo} exportado com sucesso.`,
      'success'
    )
  }

  function pagamentosDoFechamento(periodo: string) {
    return pagamentos.filter((pagamento) => pagamento.periodo === periodo)
  }

  function valorDoFechamento(periodo: string) {
    return pagamentosDoFechamento(periodo).reduce(
      (total, pagamento) => total + pagamento.valorTotal,
      0
    )
  }

  function diariasDoFechamento(periodo: string) {
    return pagamentosDoFechamento(periodo).reduce(
      (total, pagamento) => total + pagamento.quantidadeDiarias,
      0
    )
  }

  function obterFuncionarioPorNome(nome: string) {
    return funcionarios.find((funcionario) => funcionario.nome === nome)
  }

  function gerarPadraoQr(valor: string) {
    const base = Array.from({ length: 13 }, (_, linha) =>
      Array.from({ length: 13 }, (_, coluna) => {
        const codigo = valor.charCodeAt((linha * 13 + coluna) % valor.length)
        return (codigo + linha * 3 + coluna * 5) % 2 === 0
      })
    )

    const marcador = (inicioLinha: number, inicioColuna: number) => {
      for (let linha = 0; linha < 5; linha++) {
        for (let coluna = 0; coluna < 5; coluna++) {
          const borda =
            linha === 0 || linha === 4 || coluna === 0 || coluna === 4

          const centro =
            linha >= 2 && linha <= 2 && coluna >= 2 && coluna <= 2

          base[inicioLinha + linha][inicioColuna + coluna] = borda || centro
        }
      }
    }

    marcador(0, 0)
    marcador(0, 8)
    marcador(8, 0)

    return base
  }

  async function copiarChavePix(chave: string) {
    try {
      await navigator.clipboard.writeText(chave)

      mostrarNotificacao('Chave PIX copiada.', 'success')
    } catch {
      mostrarNotificacao(
        'Não foi possível copiar automaticamente. Selecione a chave manualmente.',
        'warning'
      )
    }
  }

  async function copiarPixCopiaCola(payload: string) {
    if (!payload) {
      mostrarNotificacao('PIX Copia e Cola indisponível para este pagamento.', 'warning')
      return
    }

    try {
      await navigator.clipboard.writeText(payload)
      mostrarNotificacao('PIX Copia e Cola copiado.', 'success')
    } catch {
      mostrarNotificacao(
        'Não foi possível copiar automaticamente o PIX Copia e Cola.',
        'warning'
      )
    }
  }

  function formatarDataLista(data: string) {
    if (!data) return '-'
    return new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR')
  }

  function alternarDiaristaLista(nome: string) {
    setDiaristasSelecionados((atual) =>
      atual.includes(nome)
        ? atual.filter((item) => item !== nome)
        : [...atual, nome]
    )
  }

  function selecionarTodosDiaristas() {
    const ativos = funcionarios
      .filter((funcionario) => funcionario.status === 'Ativo')
      .map((funcionario) => funcionario.nome)

    const todosJaSelecionados = ativos.every((nome) =>
      diaristasSelecionados.includes(nome)
    )

    setDiaristasSelecionados(todosJaSelecionados ? [] : ativos)
  }

  function montarTextoLista(lista: {
    data: string
    local: string
    horario: string
    observacao: string
    diaristas: string[]
  }) {
    const linhasDiaristas = lista.diaristas
      .map((nome, index) => {
        const funcionario = obterFuncionarioPorNome(nome)
        const cpf = funcionario?.cpf?.trim()
          ? formatarCpf(funcionario.cpf)
          : 'Não informado'
        const email = funcionario?.email?.trim() || 'Não informado'

        return `${index + 1} - ${nome}\nCPF: ${cpf}\n${email}`
      })
      .join('\n\n')

    return [
      '📋 LISTA DE DIARISTAS • PM',
      `📅 Data: ${formatarDataLista(lista.data)}`,
      lista.local ? `📍 Local: ${lista.local}` : '',
      lista.horario ? `🕐 Turno PM: ${lista.horario} às 18:30` : '🕐 Turno: PM',
      '',
      `👥 Diaristas (${lista.diaristas.length}):`,
      linhasDiaristas || 'Nenhum diarista selecionado.',
      lista.observacao ? '' : '',
      lista.observacao ? `📝 Observação: ${lista.observacao}` : '',
      '',
      'Gestão Sindical',
    ]
      .filter((linha, index, array) => {
        if (linha !== '') return true
        return index > 0 && array[index - 1] !== ''
      })
      .join('\n')
  }

  async function copiarListaParaWhatsApp(lista?: ListaDiaristas) {
    const dados = lista ?? {
      id: 0,
      data: dataListaDiaristas,
      local: localListaDiaristas,
      horario: horarioListaDiaristas,
      observacao: observacaoListaDiaristas,
      diaristas: diaristasSelecionados,
      criadaEm: '',
    }

    if (dados.diaristas.length === 0) {
      mostrarNotificacao(
        'Selecione pelo menos um diarista antes de copiar a lista.',
        'warning'
      )
      return
    }

    try {
      await navigator.clipboard.writeText(montarTextoLista(dados))
      mostrarNotificacao(
        'Lista copiada. Agora é só colar no grupo dos diaristas.',
        'success'
      )
    } catch {
      mostrarNotificacao(
        'Não foi possível copiar automaticamente.',
        'warning'
      )
    }
  }

  function exportarListaTxt(lista?: ListaDiaristas) {
    const dados = lista ?? {
      id: 0,
      data: dataListaDiaristas,
      local: localListaDiaristas,
      horario: horarioListaDiaristas,
      observacao: observacaoListaDiaristas,
      diaristas: diaristasSelecionados,
      criadaEm: '',
    }

    if (dados.diaristas.length === 0) {
      mostrarNotificacao(
        'Selecione pelo menos um diarista antes de exportar.',
        'warning'
      )
      return
    }

    const linhasDiaristasExportacao = dados.diaristas
      .map((nome, index) => {
        const funcionario = obterFuncionarioPorNome(nome)
        const cpf = funcionario?.cpf?.trim()
          ? formatarCpf(funcionario.cpf)
          : 'Não informado'
        const email = funcionario?.email?.trim() || 'Não informado'
        return `${index + 1} - ${nome}\nCPF: ${cpf}\n${email}`
      })
      .join('\n\n')

    const textoExportacao = [
      '📋 LISTA DE DIARISTAS • PM',
      `📅 Data: ${formatarDataLista(dados.data)}`,
      dados.local ? `📍 Local: ${dados.local}` : '',
      dados.horario ? `🕐 Turno PM: ${dados.horario} às 18:30` : '🕐 Turno: PM',
      '',
      `👥 Diaristas (${dados.diaristas.length}):`,
      linhasDiaristasExportacao,
      dados.observacao ? '' : '',
      dados.observacao ? `📝 Observação: ${dados.observacao}` : '',
    ]
      .filter((linha, index, array) => linha !== '' || array[index - 1] !== '')
      .join('\n')

    const blob = new Blob([textoExportacao], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lista-diaristas-${dados.data || 'data'}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    mostrarNotificacao('Lista exportada com sucesso.', 'success')
  }

  async function salvarListaDiaristas() {
    if (!dataListaDiaristas) {
      mostrarNotificacao('Informe a data da lista.', 'warning')
      return
    }

    if (!localListaDiaristas.trim()) {
      mostrarNotificacao('Informe o local da lista.', 'warning')
      return
    }

    if (diaristasSelecionados.length === 0) {
      mostrarNotificacao(
        'Selecione pelo menos um diarista para salvar a lista.',
        'warning'
      )
      return
    }

    const funcionariosSelecionados = diaristasSelecionados
      .map((nome) => funcionarios.find((funcionario) => funcionario.nome === nome))
      .filter((funcionario): funcionario is Funcionario => Boolean(funcionario?.id))

    if (funcionariosSelecionados.length !== diaristasSelecionados.length) {
      mostrarNotificacao(
        'Não foi possível identificar todos os funcionários selecionados no banco.',
        'error'
      )
      return
    }

    const local = localListaDiaristas.trim()
    const observacao = observacaoListaDiaristas.trim()

    const { data: existente, error: erroBusca } = await supabase
      .from('work_lists')
      .select('id')
      .eq('work_date', dataListaDiaristas)
      .eq('unit_name', local)
      .maybeSingle()

    if (erroBusca) {
      mostrarNotificacao(`Não foi possível verificar a lista: ${erroBusca.message}`, 'error')
      return
    }

    let listaId = existente?.id as string | undefined

    if (listaId) {
      const { error: erroAtualizar } = await supabase
        .from('work_lists')
        .update({
          notes: observacao || null,
          status: 'Aberta',
          updated_at: new Date().toISOString(),
        })
        .eq('id', listaId)

      if (erroAtualizar) {
        mostrarNotificacao(`Não foi possível atualizar a lista: ${erroAtualizar.message}`, 'error')
        return
      }

      const { error: erroLimpar } = await supabase
        .from('work_list_employees')
        .delete()
        .eq('work_list_id', listaId)

      if (erroLimpar) {
        mostrarNotificacao(`Não foi possível atualizar os diaristas da lista: ${erroLimpar.message}`, 'error')
        return
      }
    } else {
      const { data: criada, error: erroCriar } = await supabase
        .from('work_lists')
        .insert({
          work_date: dataListaDiaristas,
          unit_name: local,
          status: 'Aberta',
          notes: observacao || null,
          created_by: usuarioLogado?.authId || null,
        })
        .select('id')
        .single()

      if (erroCriar || !criada?.id) {
        mostrarNotificacao(
          `Não foi possível salvar a lista: ${erroCriar?.message || 'erro desconhecido'}`,
          'error'
        )
        return
      }

      listaId = criada.id
    }

    const { error: erroVinculos } = await supabase
      .from('work_list_employees')
      .insert(
        funcionariosSelecionados.map((funcionario) => ({
          work_list_id: listaId,
          employee_id: funcionario.id,
          scheduled_start: horarioListaDiaristas || '09:30',
          scheduled_end: '18:30',
          status: 'Escalado',
          observation: null,
        }))
      )

    if (erroVinculos) {
      mostrarNotificacao(
        `A lista foi criada, mas houve erro ao vincular os diaristas: ${erroVinculos.message}`,
        'error'
      )
      await carregarListasDiaristasSupabase()
      return
    }

    await carregarListasDiaristasSupabase()

    const listaSalva: ListaDiaristas = {
      id: listaId!,
      data: dataListaDiaristas,
      local,
      horario: horarioListaDiaristas || '09:30',
      observacao,
      diaristas: [...diaristasSelecionados],
      ausentes: [],
      criadaEm: new Date().toLocaleString('pt-BR'),
    }
    setListaDiaristasSelecionada(listaSalva)

    mostrarNotificacao(
      `Lista de ${formatarDataLista(dataListaDiaristas)} salva com ${diaristasSelecionados.length} diarista(s).`,
      'success'
    )
  }

  function novaListaDiaristas() {
    setDataListaDiaristas(dataLocalHoje)
    setLocalListaDiaristas('DHL Mogi Mirim')
    setHorarioListaDiaristas('09:30')
    setObservacaoListaDiaristas('')
    setBuscaListaDiaristas('')
    setDiaristasSelecionados([])
    setListaDiaristasSelecionada(null)
  }

  async function excluirListaDiaristas(id: string) {
    const lista = listasDiaristas.find((item) => item.id === id)
    if (!lista) return

    const confirmou = window.confirm(
      `Excluir a lista de ${formatarDataLista(lista.data)} - ${lista.local}?

` +
        `Os ${lista.diaristas.length} funcionário(s) vinculados a esta lista serão removidos somente da escala. ` +
        `Os cadastros dos funcionários não serão apagados.

Essa ação não pode ser desfeita.`
    )

    if (!confirmou) return

    const { error } = await supabase
      .from('work_lists')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Não foi possível excluir a lista:', error)
      mostrarNotificacao(`Não foi possível excluir a lista: ${error.message}`, 'error')
      return
    }

    if (listaDiaristasSelecionada?.id === id) {
      setListaDiaristasSelecionada(null)
    }

    await carregarListasDiaristasSupabase()
    mostrarNotificacao('Lista excluída com sucesso.', 'success')
  }

  async function lancarFaltaLista(nomeFuncionario: string) {
    if (!listaDiaristasSelecionada?.id) {
      mostrarNotificacao('Selecione uma Lista do Dia.', 'warning')
      return
    }

    const funcionario = funcionarios.find((item) => item.nome === nomeFuncionario)
    if (!funcionario?.id) {
      mostrarNotificacao('Não foi possível localizar o funcionário no banco.', 'error')
      return
    }

    const motivo = window.prompt(
      `Justificativa da falta de ${nomeFuncionario}:`,
      'Falta não justificada'
    )

    if (motivo === null) return
    if (!motivo.trim()) {
      mostrarNotificacao('Informe uma justificativa para lançar a falta.', 'warning')
      return
    }

    const confirmou = window.confirm(
      `Confirmar falta de ${nomeFuncionario} na lista de ${formatarDataLista(
        listaDiaristasSelecionada.data
      )}?`
    )
    if (!confirmou) return

    const { error } = await supabase
      .from('work_list_employees')
      .update({
        status: 'Ausente',
        observation: motivo.trim(),
      })
      .eq('work_list_id', listaDiaristasSelecionada.id)
      .eq('employee_id', funcionario.id)

    if (error) {
      mostrarNotificacao(`Não foi possível lançar a falta: ${error.message}`, 'error')
      return
    }

    await registrarAuditoria(
      'Falta lançada',
      'Lista do Dia',
      `${nomeFuncionario} marcado como ausente em ${formatarDataLista(
        listaDiaristasSelecionada.data
      )}. Motivo: ${motivo.trim()}.`,
      'Atenção',
      undefined,
      'employee',
      funcionario.id
    )

    await carregarListasDiaristasSupabase()
    mostrarNotificacao(`Falta de ${nomeFuncionario} lançada com sucesso.`, 'success')
  }

  async function excluirRegistroPonto(registro: RegistroPonto) {
    if (!podeEditar) {
      mostrarNotificacao('Você não possui permissão para excluir registros de ponto.', 'warning')
      return
    }

    if (!registro.id) {
      mostrarNotificacao('Este ponto não possui vínculo com o Supabase.', 'error')
      return
    }

    const diariaDoDia = diarias.find(
      (diaria) =>
        diaria.employeeId === registro.employeeId &&
        diaria.data === registro.data &&
        diaria.status !== 'Cancelada'
    )

    if (diariaDoDia) {
      mostrarNotificacao(
        'Existe uma diária vinculada a este funcionário nesta data. Cancele a diária antes de excluir o ponto para não deixar o financeiro inconsistente.',
        'warning'
      )
      return
    }

    const motivo = window.prompt(
      `Motivo da exclusão do ponto de ${registro.nome} em ${registro.data} às ${registro.horario}:`
    )

    if (motivo === null) return
    if (!motivo.trim()) {
      mostrarNotificacao('Informe o motivo da exclusão do ponto.', 'warning')
      return
    }

    const confirmou = window.confirm(
      `Excluir definitivamente este registro de ${registro.tipoRegistro || 'ponto'}?\n\n` +
        `${registro.nome} • ${registro.data} • ${registro.horario}\n\n` +
        'O registro será removido do ponto, mas a exclusão ficará registrada na auditoria.'
    )
    if (!confirmou) return

    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', registro.id)

    if (error) {
      mostrarNotificacao(`Não foi possível excluir o ponto: ${error.message}`, 'error')
      return
    }

    await registrarAuditoria(
      'Registro de ponto excluído',
      'Controle de Ponto',
      `${registro.nome}: ${registro.tipoRegistro || 'Ponto'} de ${registro.data} às ${
        registro.horario
      } excluído. Motivo: ${motivo.trim()}.`,
      'Crítico',
      undefined,
      'attendance_record',
      registro.id
    )

    setRegistroPontoSelecionado(null)
    await carregarPontosSupabase()
    mostrarNotificacao('Registro de ponto excluído com sucesso.', 'success')
  }

  async function excluirFuncionario(funcionario: Funcionario) {
    if (usuarioLogado?.perfil !== 'Administrador') {
      mostrarNotificacao('Somente o Administrador Geral pode excluir funcionários.', 'warning')
      return
    }

    if (!funcionario.id) {
      mostrarNotificacao('Este funcionário não possui vínculo com o Supabase.', 'error')
      return
    }

    const confirmou = window.confirm(
      `Excluir definitivamente o cadastro de ${funcionario.nome}?\n\n` +
        'Use esta opção somente para cadastros criados por engano. Se houver histórico de ponto, diária, pagamento, documentos, biometria ou listas, o banco poderá bloquear a exclusão para preservar o histórico.\n\n' +
        'Para alguém que apenas deixou de trabalhar, prefira Desativar funcionário.'
    )
    if (!confirmou) return

    const confirmouNome = window.prompt(
      `Para confirmar, digite exatamente o nome do funcionário:\n${funcionario.nome}`
    )
    if (confirmouNome !== funcionario.nome) {
      if (confirmouNome !== null) {
        mostrarNotificacao('O nome digitado não confere. Exclusão cancelada.', 'warning')
      }
      return
    }

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', funcionario.id)

    if (error) {
      console.error('Não foi possível excluir o funcionário:', error)
      mostrarNotificacao(
        `Não foi possível excluir este funcionário. Ele provavelmente possui histórico vinculado. Nesse caso, use "Desativar funcionário". Detalhe: ${error.message}`,
        'warning'
      )
      return
    }

    await registrarAuditoria(
      'Funcionário excluído',
      'Funcionários',
      `${funcionario.nome} (${funcionario.cpf}) foi excluído definitivamente por ser um cadastro sem histórico operacional.`,
      'Crítico',
      undefined,
      'employee',
      funcionario.id
    )

    setFuncionarioSelecionado(null)
    setEditandoFuncionario(false)
    setFuncionarioEmEdicao(null)
    await carregarFuncionariosSupabase()
    await carregarListasDiaristasSupabase()
    mostrarNotificacao('Funcionário excluído definitivamente.', 'success')
  }

  const diaristasDisponiveis = useMemo(() => {
    const termo = buscaListaDiaristas.trim().toLowerCase()

    return funcionarios.filter((funcionario) => {
      const ativo = funcionario.status === 'Ativo'
      const combinaBusca =
        !termo ||
        funcionario.nome.toLowerCase().includes(termo) ||
        funcionario.funcao.toLowerCase().includes(termo)

      return ativo && combinaBusca
    })
  }, [funcionarios, buscaListaDiaristas])

  const funcionariosFiltrados = useMemo(() => {
    const termo = buscaFuncionario.trim().toLowerCase()

    if (!termo) return funcionarios

    return funcionarios.filter(
      (funcionario) =>
        funcionario.nome.toLowerCase().includes(termo) ||
        funcionario.cpf.toLowerCase().includes(termo) ||
        funcionario.funcao.toLowerCase().includes(termo)
    )
  }, [buscaFuncionario, funcionarios])

  const registrosPontoFiltrados = useMemo(() => {
    return registrosPonto
      .map((registro, index) => ({
        registro,
        indexOriginal: index,
      }))
      .filter(({ registro }) => {
        const termo = buscaPonto.trim().toLowerCase()

        const combinaBusca =
          !termo ||
          registro.nome.toLowerCase().includes(termo) ||
          registro.funcao.toLowerCase().includes(termo)

        const combinaStatus =
          statusPontoFiltro === 'Todos' ||
          registro.status === statusPontoFiltro

        const combinaData =
          !dataPontoFiltro ||
          registro.data ===
            new Date(`${dataPontoFiltro}T12:00:00`).toLocaleDateString('pt-BR')

        const listasDaData = dataPontoFiltro
          ? listasDiaristas.filter(
              (lista) => lista.data === dataPontoFiltro
            )
          : []

        const nomesEscalados = new Set(
          listasDaData.flatMap((lista) =>
            lista.diaristas.filter(
              (nome) => !(lista.ausentes || []).includes(nome)
            )
          )
        )

        const combinaEscala =
          !dataPontoFiltro ||
          (listasDaData.length > 0 && nomesEscalados.has(registro.nome))

        return combinaBusca && combinaStatus && combinaData && combinaEscala
      })
  }, [
    registrosPonto,
    buscaPonto,
    statusPontoFiltro,
    dataPontoFiltro,
    listasDiaristas,
  ])

  const diariasFiltradas = useMemo(() => {
    const inicio = converterDataInput(dataInicioDiaria)
    const fim = converterDataInput(dataFimDiaria)

    return diarias
      .map((diaria, index) => ({
        diaria,
        indexOriginal: index,
      }))
      .filter(({ diaria }) => {
        const termo = buscaDiaria.trim().toLowerCase()

        const combinaBusca =
          !termo ||
          diaria.nome.toLowerCase().includes(termo) ||
          diaria.funcao.toLowerCase().includes(termo)

        const combinaStatus =
          statusDiariaFiltro === 'Todos' || diaria.status === statusDiariaFiltro

        const dataDiaria = converterDataBR(diaria.data)

        let combinaPeriodo = true

        if (dataDiaria && inicio && dataDiaria < inicio) {
          combinaPeriodo = false
        }

        if (dataDiaria && fim && dataDiaria > fim) {
          combinaPeriodo = false
        }

        return combinaBusca && combinaStatus && combinaPeriodo
      })
  }, [
    diarias,
    buscaDiaria,
    statusDiariaFiltro,
    dataInicioDiaria,
    dataFimDiaria,
  ])

  const fechamentosFiltrados = useMemo(() => {
    const termo = buscaFechamento.trim().toLowerCase()

    return fechamentos
      .map((fechamento, index) => ({
        fechamento,
        indexOriginal: index,
      }))
      .filter(({ fechamento }) => {
        const combinaBusca =
          !termo ||
          fechamento.periodo.toLowerCase().includes(termo) ||
          fechamento.pagamento.toLowerCase().includes(termo)

        const combinaStatus =
          statusFechamentoFiltro === 'Todos' ||
          fechamento.status === statusFechamentoFiltro

        return combinaBusca && combinaStatus
      })
  }, [fechamentos, buscaFechamento, statusFechamentoFiltro])

  const periodosPagamento = useMemo(() => {
    return Array.from(new Set(pagamentos.map((pagamento) => pagamento.periodo)))
  }, [pagamentos])

  const pagamentosFiltrados = useMemo(() => {
    return pagamentos
      .map((pagamento, index) => ({
        pagamento,
        indexOriginal: index,
      }))
      .filter(({ pagamento }) => {
        const termo = buscaPagamento.trim().toLowerCase()

        const combinaBusca =
          !termo ||
          pagamento.nome.toLowerCase().includes(termo) ||
          pagamento.pix.toLowerCase().includes(termo)

        const combinaPeriodo =
          periodoPagamentoFiltro === 'Todos' ||
          pagamento.periodo === periodoPagamentoFiltro

        const combinaStatus =
          statusPagamentoFiltro === 'Todos' ||
          pagamento.status === statusPagamentoFiltro

        return combinaBusca && combinaPeriodo && combinaStatus
      })
  }, [
    pagamentos,
    buscaPagamento,
    periodoPagamentoFiltro,
    statusPagamentoFiltro,
  ])

  const tiposDocumento = useMemo(() => {
    return Array.from(new Set(documentos.map((documento) => documento.tipo)))
  }, [documentos])

  const documentosFiltrados = useMemo(() => {
    return documentos.filter((documento) => {
      const termo = buscaDocumento.trim().toLowerCase()

      const combinaBusca =
        !termo ||
        documento.funcionario.toLowerCase().includes(termo) ||
        documento.nome.toLowerCase().includes(termo)

      const combinaTipo =
        tipoDocumentoFiltro === 'Todos' || documento.tipo === tipoDocumentoFiltro

      const combinaStatus =
        statusDocumentoFiltro === 'Todos' ||
        documento.status === statusDocumentoFiltro

      return combinaBusca && combinaTipo && combinaStatus
    })
  }, [
    documentos,
    buscaDocumento,
    tipoDocumentoFiltro,
    statusDocumentoFiltro,
  ])

  const resumoDiariasPorFuncionario = useMemo(() => {
    const resumo = new Map<
      string,
      {
        nome: string
        funcao: string
        quantidade: number
        aprovadas: number
        pendentes: number
        total: number
      }
    >()

    diariasFiltradas.forEach(({ diaria }) => {
      const atual = resumo.get(diaria.nome)

      if (atual) {
        atual.quantidade += 1
        atual.total += diaria.valor

        if (diaria.status === 'Aprovada') {
          atual.aprovadas += 1
        } else {
          atual.pendentes += 1
        }
      } else {
        resumo.set(diaria.nome, {
          nome: diaria.nome,
          funcao: diaria.funcao,
          quantidade: 1,
          aprovadas: diaria.status === 'Aprovada' ? 1 : 0,
          pendentes: diaria.status === 'Pendente' ? 1 : 0,
          total: diaria.valor,
        })
      }
    })

    return Array.from(resumo.values())
  }, [diariasFiltradas])

  const diariasFuncionarioSelecionado = funcionarioDiariasSelecionado
    ? diarias
        .map((diaria, index) => ({
          diaria,
          indexOriginal: index,
        }))
        .filter((item) => item.diaria.nome === funcionarioDiariasSelecionado)
    : []

  const totalFuncionarioSelecionado = diariasFuncionarioSelecionado.reduce(
    (total, item) => total + item.diaria.valor,
    0
  )

  function obterDiaSemana(data: string) {
    const [dia, mes, ano] = data.split('/').map(Number)

    const dataConvertida = new Date(ano, mes - 1, dia)

    const nome = dataConvertida.toLocaleDateString('pt-BR', {
      weekday: 'long',
    })

    return nome.charAt(0).toUpperCase() + nome.slice(1)
  }

  function limparFiltrosPonto() {
    setBuscaPonto('')
    setStatusPontoFiltro('Todos')
    setDataPontoFiltro('')
  }

  function limparFiltrosDiarias() {
    setBuscaDiaria('')
    setStatusDiariaFiltro('Todos')
    setDataInicioDiaria('')
    setDataFimDiaria('')
  }

  function limparFiltrosFechamentos() {
    setBuscaFechamento('')
    setStatusFechamentoFiltro('Todos')
  }

  function limparFiltrosPagamentos() {
    setBuscaPagamento('')
    setPeriodoPagamentoFiltro('Todos')
    setStatusPagamentoFiltro('Todos')
  }

  function limparFiltrosDocumentos() {
    setBuscaDocumento('')
    setTipoDocumentoFiltro('Todos')
    setStatusDocumentoFiltro('Todos')
  }

  async function salvarFuncionario() {
    if (
      !novoFuncionario.nome ||
      !novoFuncionario.cpf ||
      !novoFuncionario.funcao ||
      !novoFuncionario.telefone
    ) {
      mostrarNotificacao(
        'Preencha pelo menos nome, CPF, telefone e função.',
        'warning'
      )
      return
    }

    const cpf = somenteDigitos(novoFuncionario.cpf)
    const cpfDuplicado = funcionarios.some(
      (item) => somenteDigitos(item.cpf) === cpf
    )

    if (cpfDuplicado) {
      mostrarNotificacao(
        'Já existe um funcionário cadastrado com este CPF.',
        'error'
      )
      return
    }

    const { data: sessao } = await supabase.auth.getSession()
    const usuarioId = sessao.session?.user.id ?? null

    const payload = {
      full_name: novoFuncionario.nome.trim(),
      cpf,
      birth_date: novoFuncionario.nascimento || null,
      phone: somenteDigitos(novoFuncionario.telefone) || null,
      email: novoFuncionario.email.trim() || null,
      address: novoFuncionario.endereco.trim() || null,
      hire_date: novoFuncionario.admissao || null,
      job_title: novoFuncionario.funcao.trim() || 'Auxiliar Logístico',
      status: novoFuncionario.status,
      daily_rate: 100,
      pix_type: novoFuncionario.tipoPix.trim() || null,
      pix_key: normalizarChavePix(novoFuncionario.tipoPix, novoFuncionario.chavePix) || null,
      pix_holder: novoFuncionario.titularPix.trim() || null,
      pix_city: novoFuncionario.cidadePix.trim() || null,
      photo_path: novoFuncionario.foto || null,
      facial_status: 'Pendente',
      created_by: usuarioId,
      updated_by: usuarioId,
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(payload)
      .select(
        'id, full_name, cpf, birth_date, phone, email, address, hire_date, job_title, status, daily_rate, pix_type, pix_key, pix_holder, pix_city, photo_path, facial_status'
      )
      .single()

    if (error || !data) {
      console.error('Erro ao cadastrar funcionário no Supabase:', error)
      mostrarNotificacao(
        error?.message
          ? `Não foi possível cadastrar: ${error.message}`
          : 'Não foi possível cadastrar o funcionário.',
        'error'
      )
      return
    }

    const cadastrado = funcionarioDoSupabase(data as FuncionarioSupabase)
    setFuncionarios((atuais) =>
      [...atuais, cadastrado].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    )

    const nome = cadastrado.nome
    setNovoFuncionario(funcionarioVazio)
    setMostrarFormulario(false)

    registrarAuditoria(
      'Funcionário cadastrado',
      'Funcionários',
      `${nome} (${cadastrado.cpf}) foi cadastrado no banco de dados.`,
      'Informação'
    )

    mostrarNotificacao(`${nome} foi cadastrado com sucesso no Supabase.`, 'success')
  }

  function encerrarCameraCadastroFacial() {
    streamCadastroFacialRef.current?.getTracks().forEach((track) => track.stop())
    streamCadastroFacialRef.current = null
    if (videoCadastroFacialRef.current) {
      videoCadastroFacialRef.current.srcObject = null
    }
    setCameraFacialAtiva(false)
  }

  function fecharCadastroFacial() {
    encerrarCameraCadastroFacial()
    setCadastroFacialAberto(false)
    setFuncionarioCadastroFacial(null)
    setConsentimentoFacial(false)
    setCapturandoFacial(false)
    setProgressoFacial(0)
    setMensagemFacial('')
  }

  async function abrirCadastroFacial(funcionario: Funcionario) {
    if (!funcionario.id) {
      mostrarNotificacao(
        'Salve o funcionário antes de cadastrar a biometria facial.',
        'warning'
      )
      return
    }

    if (usuarioLogado?.perfil !== 'Administrador') {
      mostrarNotificacao(
        'Somente o Administrador Geral pode cadastrar ou recadastrar a biometria facial.',
        'warning'
      )
      return
    }

    setFuncionarioCadastroFacial(funcionario)
    setCadastroFacialAberto(true)
    setConsentimentoFacial(false)
    setProgressoFacial(0)
    setMensagemFacial(
      modelosFaciaisProntos
        ? 'Confirme o consentimento e abra a câmera para iniciar.'
        : 'Carregando os modelos de reconhecimento facial...'
    )
  }

  async function iniciarCameraCadastroFacial() {
    if (!consentimentoFacial) {
      mostrarNotificacao(
        'Confirme o consentimento para o uso da biometria facial.',
        'warning'
      )
      return
    }

    if (!modelosFaciaisProntos) {
      mostrarNotificacao(
        erroModelosFaciais || 'Os modelos faciais ainda estão sendo carregados.',
        'warning'
      )
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      mostrarNotificacao(
        'Este navegador não disponibiliza acesso à câmera.',
        'error'
      )
      return
    }

    try {
      encerrarCameraCadastroFacial()
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
      })

      streamCadastroFacialRef.current = stream
      setCameraFacialAtiva(true)
      setMensagemFacial('Posicione o rosto no centro, com boa iluminação e sem outras pessoas no quadro.')

      window.setTimeout(async () => {
        if (videoCadastroFacialRef.current) {
          videoCadastroFacialRef.current.srcObject = stream
          try {
            await videoCadastroFacialRef.current.play()
          } catch (erro) {
            console.error('Não foi possível iniciar o vídeo:', erro)
          }
        }
      }, 50)
    } catch (erro) {
      console.error('Erro ao acessar câmera:', erro)
      setCameraFacialAtiva(false)
      mostrarNotificacao(
        'Não foi possível acessar a câmera. Confira a permissão do navegador.',
        'error'
      )
    }
  }

  async function capturarCadastroFacial() {
    if (!funcionarioCadastroFacial?.id || !videoCadastroFacialRef.current) return
    if (!cameraFacialAtiva || !modelosFaciaisProntos) return

    setCapturandoFacial(true)
    setProgressoFacial(0)
    setMensagemFacial('Capturando amostras faciais. Mantenha o rosto visível e faça pequenos movimentos naturais.')

    try {
      const descritores: number[][] = []
      const totalAmostras = 5
      let tentativas = 0
      const maxTentativas = 12

      while (descritores.length < totalAmostras && tentativas < maxTentativas) {
        tentativas += 1

        const deteccao = await faceapi
          .detectSingleFace(
            videoCadastroFacialRef.current,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.55,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor()

        if (deteccao?.descriptor?.length === 128) {
          descritores.push(Array.from(deteccao.descriptor))
          setProgressoFacial(descritores.length)
        }

        if (descritores.length < totalAmostras) {
          await new Promise((resolve) => window.setTimeout(resolve, 500))
        }
      }

      if (descritores.length < totalAmostras) {
        throw new Error(
          'Não foi possível obter cinco amostras válidas. Centralize o rosto, melhore a iluminação e tente novamente.'
        )
      }

      const descritorMedio = Array.from({ length: 128 }, (_, indice) =>
        descritores.reduce((soma, descritor) => soma + descritor[indice], 0) /
        descritores.length
      )

      const norma = Math.sqrt(
        descritorMedio.reduce((soma, valor) => soma + valor * valor, 0)
      )
      const descritorNormalizado = descritorMedio.map((valor) =>
        norma > 0 ? valor / norma : valor
      )

      const { data: sessao } = await supabase.auth.getSession()
      const usuarioId = sessao.session?.user.id ?? null
      const agora = new Date().toISOString()

      const { data: cadastroExistente, error: erroConsulta } = await supabase
        .from('biometric_enrollments')
        .select('id, employee_id, provider, status, face_descriptor, descriptor_version, sample_count')
        .eq('employee_id', funcionarioCadastroFacial.id)
        .in('status', ['Ativo', 'Pendente'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (erroConsulta) throw erroConsulta

      const payloadBiometria = {
        employee_id: funcionarioCadastroFacial.id,
        provider: 'face-api.js',
        provider_subject_id: funcionarioCadastroFacial.id,
        status: 'Ativo',
        consent_recorded_at: agora,
        enrolled_at: agora,
        revoked_at: null,
        face_descriptor: descritorNormalizado,
        descriptor_version: 'face-api.js-faceRecognitionNet-v1',
        sample_count: totalAmostras,
        created_by: usuarioId,
      }

      if (cadastroExistente?.id) {
        const { error } = await supabase
          .from('biometric_enrollments')
          .update({
            ...payloadBiometria,
            created_by: undefined,
          })
          .eq('id', cadastroExistente.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('biometric_enrollments')
          .insert(payloadBiometria)

        if (error) throw error
      }

      const { error: erroFuncionario } = await supabase
        .from('employees')
        .update({
          facial_status: 'Cadastrado',
          updated_by: usuarioId,
        })
        .eq('id', funcionarioCadastroFacial.id)

      if (erroFuncionario) throw erroFuncionario

      const funcionarioAtualizado: Funcionario = {
        ...funcionarioCadastroFacial,
        facial: 'Cadastrado',
      }

      setFuncionarios((atuais) =>
        atuais.map((item) =>
          item.id === funcionarioAtualizado.id ? funcionarioAtualizado : item
        )
      )
      setFuncionarioSelecionado((atual) =>
        atual?.id === funcionarioAtualizado.id ? funcionarioAtualizado : atual
      )
      setFuncionarioCadastroFacial(funcionarioAtualizado)

      registrarAuditoria(
        'Biometria facial cadastrada',
        'Funcionários',
        `Biometria facial de ${funcionarioAtualizado.nome} cadastrada com ${totalAmostras} amostras.`,
        'Atenção',
        undefined,
        'employee',
        funcionarioAtualizado.id
      )

      encerrarCameraCadastroFacial()
      setMensagemFacial('Biometria facial cadastrada com sucesso.')
      mostrarNotificacao(
        `Biometria facial de ${funcionarioAtualizado.nome} cadastrada com sucesso.`,
        'success'
      )
    } catch (erro) {
      console.error('Erro ao cadastrar biometria facial:', erro)
      const mensagem =
        erro instanceof Error
          ? erro.message
          : 'Não foi possível concluir o cadastro facial.'
      setMensagemFacial(mensagem)
      mostrarNotificacao(mensagem, 'error')
    } finally {
      setCapturandoFacial(false)
    }
  }

  function iniciarEdicaoFuncionario(funcionario: Funcionario) {
    if (usuarioLogado?.perfil !== 'Administrador') {
      mostrarNotificacao(
        'Somente o Administrador Geral pode editar informações de funcionários.',
        'warning'
      )
      return
    }

    setFuncionarioEmEdicao({ ...funcionario })
    setCpfOriginalEdicao(funcionario.cpf)
    setEditandoFuncionario(true)
  }

  function cancelarEdicaoFuncionario() {
    setEditandoFuncionario(false)
    setFuncionarioEmEdicao(null)
    setCpfOriginalEdicao('')
  }

  async function salvarEdicaoFuncionario() {
    if (!funcionarioEmEdicao) return

    if (usuarioLogado?.perfil !== 'Administrador') {
      mostrarNotificacao(
        'Somente o Administrador Geral pode editar informações de funcionários.',
        'warning'
      )
      return
    }

    const dados = funcionarioEmEdicao

    if (!dados.nome.trim() || !dados.cpf.trim() || !dados.telefone.trim() || !dados.funcao.trim()) {
      mostrarNotificacao(
        'Preencha pelo menos nome, CPF, telefone e função.',
        'warning'
      )
      return
    }

    const cpfDuplicado = funcionarios.some(
      (item) =>
        item.cpf !== cpfOriginalEdicao &&
        somenteDigitos(item.cpf) === somenteDigitos(dados.cpf)
    )

    if (cpfDuplicado) {
      mostrarNotificacao('Já existe um funcionário cadastrado com este CPF.', 'error')
      return
    }

    const original = funcionarios.find((item) => item.cpf === cpfOriginalEdicao)

    if (!original || !original.id) {
      mostrarNotificacao(
        'Não foi possível localizar o cadastro real deste funcionário no Supabase.',
        'error'
      )
      return
    }

    const { data: sessao } = await supabase.auth.getSession()
    const usuarioId = sessao.session?.user.id ?? null

    const payload = {
      full_name: dados.nome.trim(),
      cpf: somenteDigitos(dados.cpf),
      birth_date: dados.nascimento || null,
      phone: somenteDigitos(dados.telefone) || null,
      email: dados.email.trim() || null,
      address: dados.endereco.trim() || null,
      hire_date: dados.admissao || null,
      job_title: dados.funcao.trim() || 'Auxiliar Logístico',
      status: dados.status,
      daily_rate: Number(
        String(dados.diaria || '100')
          .replace(/[^0-9,.-]/g, '')
          .replace('.', '')
          .replace(',', '.')
      ) || 100,
      pix_type: dados.tipoPix.trim() || null,
      pix_key: normalizarChavePix(dados.tipoPix, dados.chavePix) || null,
      pix_holder: dados.titularPix.trim() || null,
      pix_city: dados.cidadePix.trim() || null,
      photo_path: dados.foto || null,
      facial_status: dados.facial,
      updated_by: usuarioId,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('employees')
      .update(payload)
      .eq('id', original.id)
      .select(
        'id, full_name, cpf, birth_date, phone, email, address, hire_date, job_title, status, daily_rate, pix_type, pix_key, pix_holder, pix_city, photo_path, facial_status'
      )
      .single()

    if (error || !data) {
      console.error('Erro ao atualizar funcionário no Supabase:', error)
      mostrarNotificacao(
        error?.message
          ? `Não foi possível salvar: ${error.message}`
          : 'Não foi possível salvar as alterações.',
        'error'
      )
      return
    }

    const atualizado = funcionarioDoSupabase(data as FuncionarioSupabase)

    setFuncionarios((atuais) =>
      atuais.map((item) => (item.id === original.id ? atualizado : item))
    )

    // Os módulos que ainda estão em migração usam o nome do trabalhador como referência.
    if (original.nome !== atualizado.nome) {
      setRegistrosPonto((atuais) =>
        atuais.map((registro) =>
          registro.nome === original.nome
            ? { ...registro, nome: atualizado.nome }
            : registro
        )
      )

      setDiarias((atuais) =>
        atuais.map((diaria) =>
          diaria.nome === original.nome
            ? { ...diaria, nome: atualizado.nome }
            : diaria
        )
      )

      setPagamentos((atuais) =>
        atuais.map((pagamento) =>
          pagamento.nome === original.nome
            ? { ...pagamento, nome: atualizado.nome }
            : pagamento
        )
      )

      setDocumentos((atuais) =>
        atuais.map((documento) =>
          documento.funcionario === original.nome
            ? { ...documento, funcionario: atualizado.nome }
            : documento
        )
      )

      setListasDiaristas((atuais) =>
        atuais.map((lista) => ({
          ...lista,
          diaristas: lista.diaristas.map((nome) =>
            nome === original.nome ? atualizado.nome : nome
          ),
        }))
      )
    }

    setFuncionarioSelecionado(atualizado)
    setFuncionarioEmEdicao(null)
    setCpfOriginalEdicao('')
    setEditandoFuncionario(false)

    const camposAlterados: string[] = []
    ;(Object.keys(atualizado) as Array<keyof Funcionario>).forEach((campo) => {
      if (original[campo] !== atualizado[campo]) camposAlterados.push(String(campo))
    })

    registrarAuditoria(
      'Cadastro de funcionário editado',
      'Funcionários',
      `${atualizado.nome} (${atualizado.cpf}) teve o cadastro atualizado no Supabase${
        camposAlterados.length > 0 ? `: ${camposAlterados.join(', ')}` : ''
      }.`,
      'Informação'
    )

    mostrarNotificacao(
      `Informações de ${atualizado.nome} salvas no Supabase.`,
      'success'
    )
  }

  async function alternarStatusFuncionario(funcionario: Funcionario) {
    if (usuarioLogado?.perfil !== 'Administrador') {
      mostrarNotificacao(
        'Somente o Administrador Geral pode ativar ou inativar funcionários.',
        'warning'
      )
      return
    }

    if (!funcionario.id) {
      mostrarNotificacao(
        'Este cadastro ainda não está vinculado ao Supabase. Atualize a página e tente novamente.',
        'error'
      )
      return
    }

    const novoStatus: Funcionario['status'] =
      funcionario.status === 'Ativo' ? 'Inativo' : 'Ativo'

    const { data: sessao } = await supabase.auth.getSession()
    const usuarioId = sessao.session?.user.id ?? null

    const { data, error } = await supabase
      .from('employees')
      .update({
        status: novoStatus,
        updated_by: usuarioId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', funcionario.id)
      .select(
        'id, full_name, cpf, birth_date, phone, email, address, hire_date, job_title, status, daily_rate, pix_type, pix_key, pix_holder, pix_city, photo_path, facial_status'
      )
      .single()

    if (error || !data) {
      console.error('Erro ao alterar status do funcionário:', error)
      mostrarNotificacao(
        error?.message
          ? `Não foi possível alterar o status: ${error.message}`
          : 'Não foi possível alterar o status do funcionário.',
        'error'
      )
      return
    }

    const atualizado = funcionarioDoSupabase(data as FuncionarioSupabase)

    setFuncionarios((atuais) =>
      atuais.map((item) => (item.id === funcionario.id ? atualizado : item))
    )
    setFuncionarioSelecionado(atualizado)

    registrarAuditoria(
      novoStatus === 'Ativo'
        ? 'Funcionário reativado'
        : 'Funcionário inativado',
      'Funcionários',
      `${funcionario.nome} (${funcionario.cpf}) foi ${
        novoStatus === 'Ativo' ? 'reativado' : 'inativado'
      } no Supabase.`,
      novoStatus === 'Ativo' ? 'Informação' : 'Atenção'
    )

    mostrarNotificacao(
      novoStatus === 'Ativo'
        ? `${funcionario.nome} foi reativado com sucesso.`
        : `${funcionario.nome} foi inativado. O histórico foi preservado.`,
      novoStatus === 'Ativo' ? 'success' : 'warning'
    )
  }

  function dataISO(data: Date) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  function feriadoDaData(data: Date) {
    const iso = dataISO(data)
    return feriados.find((feriado) => feriado.ativo && feriado.data === iso)
  }

  function feriadosNacionaisDoAno(ano: number) {
    return [
      { holiday_date: `${ano}-01-01`, name: 'Confraternização Universal' },
      { holiday_date: `${ano}-04-21`, name: 'Tiradentes' },
      { holiday_date: `${ano}-05-01`, name: 'Dia Mundial do Trabalho' },
      { holiday_date: `${ano}-09-07`, name: 'Independência do Brasil' },
      { holiday_date: `${ano}-10-12`, name: 'Nossa Senhora Aparecida' },
      { holiday_date: `${ano}-11-02`, name: 'Finados' },
      { holiday_date: `${ano}-11-15`, name: 'Proclamação da República' },
      { holiday_date: `${ano}-11-20`, name: 'Dia Nacional de Zumbi e da Consciência Negra' },
      { holiday_date: `${ano}-12-25`, name: 'Natal' },
    ]
  }

  async function sincronizarFeriadosNacionaisAutomaticos() {
    if (!podeAdministrar) return

    const anoAtual = new Date().getFullYear()
    const anos = Array.from({ length: 6 }, (_, indice) => anoAtual + indice)
    const oficiais = anos.flatMap(feriadosNacionaisDoAno)

    const { data: existentes, error: erroConsulta } = await supabase
      .from('holidays')
      .select('holiday_date')
      .in('holiday_date', oficiais.map((feriado) => feriado.holiday_date))

    if (erroConsulta) {
      console.error('Não foi possível conferir os feriados nacionais:', erroConsulta)
      return
    }

    const datasExistentes = new Set(
      (existentes || []).map((feriado: { holiday_date: string }) => feriado.holiday_date)
    )
    const faltantes = oficiais.filter(
      (feriado) => !datasExistentes.has(feriado.holiday_date)
    )

    if (!faltantes.length) return

    const { data: authData } = await supabase.auth.getUser()
    const authId = authData.user?.id ?? usuarioLogado?.authId ?? null

    const { error } = await supabase.from('holidays').insert(
      faltantes.map((feriado) => ({
        ...feriado,
        holiday_type: 'Nacional' as TipoFeriado,
        active: true,
        created_by: authId,
      }))
    )

    if (error) {
      console.error('Não foi possível cadastrar automaticamente os feriados nacionais:', error)
      mostrarNotificacao(
        `Não foi possível sincronizar os feriados nacionais: ${error.message}`,
        'error'
      )
      return
    }

    await carregarFeriadosSupabase()
    await registrarAuditoria(
      'Feriados nacionais sincronizados',
      'Calendário',
      `${faltantes.length} feriado(s) nacional(is) oficial(is) foram incluído(s) automaticamente entre ${anoAtual} e ${anoAtual + 5}.`,
      'Informação'
    )
    mostrarNotificacao(
      `${faltantes.length} feriado(s) nacional(is) adicionado(s) automaticamente.`,
      'success'
    )
  }

  useEffect(() => {
    if (modoAcesso !== 'admin' || !usuarioLogado || tela !== 'calendario' || !podeAdministrar) return
    void sincronizarFeriadosNacionaisAutomaticos()
  }, [modoAcesso, usuarioLogado?.id, tela, usuarioLogado?.perfil])

  async function adicionarFeriado(e: React.FormEvent) {
    e.preventDefault()

    if (!novoFeriadoData || !novoFeriadoNome.trim()) {
      mostrarNotificacao('Informe a data e o nome do feriado.', 'warning')
      return
    }

    const jaExiste = feriados.some((feriado) => feriado.data === novoFeriadoData)

    if (jaExiste) {
      mostrarNotificacao('Já existe um feriado cadastrado nessa data.', 'warning')
      return
    }

    const { data: authData } = await supabase.auth.getUser()
    const authId = authData.user?.id ?? usuarioLogado?.authId ?? null

    const { data, error } = await supabase
      .from('holidays')
      .insert({
        holiday_date: novoFeriadoData,
        name: novoFeriadoNome.trim(),
        holiday_type: novoFeriadoTipo,
        active: true,
        created_by: authId,
      })
      .select('id, holiday_date, name, holiday_type, active, created_by, created_at, updated_at')
      .single()

    if (error) {
      console.error('Não foi possível cadastrar o feriado:', error)
      mostrarNotificacao(`Não foi possível cadastrar o feriado: ${error.message}`, 'error')
      return
    }

    const criado = data as FeriadoSupabase
    await carregarFeriadosSupabase()
    await registrarAuditoria(
      'Feriado cadastrado',
      'Calendário',
      `${criado.name} em ${new Date(`${criado.holiday_date}T12:00:00`).toLocaleDateString('pt-BR')} (${criado.holiday_type}).`,
      'Atenção',
      undefined,
      'holiday',
      criado.id
    )

    setNovoFeriadoData('')
    setNovoFeriadoNome('')
    setNovoFeriadoTipo('Municipal')
    setMostrarNovoFeriado(false)
    mostrarNotificacao('Feriado cadastrado no Supabase.', 'success')
  }

  async function alternarFeriado(id: string) {
    const alvo = feriados.find((feriado) => feriado.id === id)
    if (!alvo) return

    const novoStatus = !alvo.ativo
    const { error } = await supabase
      .from('holidays')
      .update({ active: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Não foi possível alterar o feriado:', error)
      mostrarNotificacao(`Não foi possível alterar o feriado: ${error.message}`, 'error')
      return
    }

    await carregarFeriadosSupabase()
    await registrarAuditoria(
      novoStatus ? 'Feriado ativado' : 'Feriado desativado',
      'Calendário',
      `${alvo.nome} teve sua regra de cálculo alterada no Supabase.`,
      'Atenção',
      undefined,
      'holiday',
      id
    )
    mostrarNotificacao(novoStatus ? 'Feriado ativado.' : 'Feriado desativado.', novoStatus ? 'success' : 'warning')
  }

  async function excluirFeriado(id: string) {
    const alvo = feriados.find((feriado) => feriado.id === id)
    if (!alvo) return

    const confirmou = window.confirm(`Deseja excluir "${alvo.nome}" do calendário?`)
    if (!confirmou) return

    const { error } = await supabase.from('holidays').delete().eq('id', id)

    if (error) {
      console.error('Não foi possível excluir o feriado:', error)
      mostrarNotificacao(`Não foi possível excluir o feriado: ${error.message}`, 'error')
      return
    }

    await carregarFeriadosSupabase()
    await registrarAuditoria(
      'Feriado excluído',
      'Calendário',
      `${alvo.nome} foi removido do calendário do Supabase.`,
      'Atenção',
      undefined,
      'holiday',
      id
    )
    mostrarNotificacao('Feriado removido do Supabase.', 'success')
  }

  function calcularAdicionalPercentual(
    base: number,
    percentual: number
  ) {
    return base * (percentual / 100)
  }

  function descobrirTipoDia(data: Date): {
    tipoDia: 'Semana' | 'Sábado' | 'Domingo' | 'Feriado'
    adicional: number
  } {
    const diaSemana = data.getDay()
    const feriado = feriadoDaData(data)

    if (diaSemana === 6) {
      return {
        tipoDia: 'Sábado',
        adicional: calcularAdicionalPercentual(
          configuracaoValores.diariaBase,
          configuracaoValores.percentualSabado
        ),
      }
    }

    if (diaSemana === 0) {
      return {
        tipoDia: 'Domingo',
        adicional: calcularAdicionalPercentual(
          configuracaoValores.diariaBase,
          configuracaoValores.percentualDomingo
        ),
      }
    }

    if (feriado) {
      return {
        tipoDia: 'Feriado',
        adicional: calcularAdicionalPercentual(
          configuracaoValores.diariaBase,
          configuracaoValores.percentualFeriado
        ),
      }
    }

    return {
      tipoDia: 'Semana',
      adicional: 0,
    }
  }

  function criarDiariaDoPonto(nome: string, funcao: string, data: Date) {
    const dataFormatada = data.toLocaleDateString('pt-BR')

    const jaExiste = diarias.some(
      (diaria) => diaria.nome === nome && diaria.data === dataFormatada
    )

    if (jaExiste) return false

    const { tipoDia, adicional } = descobrirTipoDia(data)

    const valor =
      configuracaoValores.diariaBase +
      adicional +
      configuracaoValores.vt +
      configuracaoValores.vr

    const novaDiaria: Diaria = {
      nome,
      funcao,
      data: dataFormatada,
      tipoDia,
      diariaBase: configuracaoValores.diariaBase,
      adicional,
      vt: configuracaoValores.vt,
      vr: configuracaoValores.vr,
      valor,
      status: 'Pendente',
    }

    setDiarias((atuais) => [...atuais, novaDiaria])

    return true
  }

  async function gerarDiariaDoPontoSupabase(
    employeeId: string,
    ocorridoEm: Date,
    usuarioId: string | null
  ) {
    const workDate = dataISOEmSaoPaulo(ocorridoEm)

    const { data: existente, error: erroExistente } = await supabase
      .from('daily_records')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('work_date', workDate)
      .maybeSingle()

    if (erroExistente) {
      console.error('Não foi possível verificar a diária existente:', erroExistente)
      return { criada: false, erro: erroExistente.message }
    }

    if (existente) {
      await carregarDiariasSupabase()
      return { criada: false, erro: null }
    }

    const { data: empregado, error: erroEmpregado } = await supabase
      .from('employees')
      .select('id, full_name, job_title, daily_rate')
      .eq('id', employeeId)
      .single()

    if (erroEmpregado || !empregado) {
      console.error('Não foi possível carregar o funcionário para gerar a diária:', erroEmpregado)
      return { criada: false, erro: erroEmpregado?.message || 'Funcionário não encontrado.' }
    }

    const dataReferencia = new Date(`${workDate}T12:00:00`)
    const { tipoDia } = descobrirTipoDia(dataReferencia)
    const base = Number(empregado.daily_rate) || configuracaoValores.diariaBase

    let percentualAdicional = 0
    if (tipoDia === 'Sábado') percentualAdicional = configuracaoValores.percentualSabado
    if (tipoDia === 'Domingo') percentualAdicional = configuracaoValores.percentualDomingo
    if (tipoDia === 'Feriado') percentualAdicional = configuracaoValores.percentualFeriado

    const adicional = calcularAdicionalPercentual(base, percentualAdicional)
    const vt = Math.max(0, Number(configuracaoValores.vt) || 0)
    const vr = Math.max(0, Number(configuracaoValores.vr) || 0)
    const total = base + adicional + vt + vr

    const { error: erroInsert } = await supabase
      .from('daily_records')
      .insert({
        employee_id: employeeId,
        work_date: workDate,
        base_amount: base,
        additional_amount: adicional,
        transport_amount: vt,
        meal_amount: vr,
        total_amount: total,
        day_type: tipoDia === 'Semana' ? 'Útil' : tipoDia,
        status: 'Pendente',
        generated_from: 'Ponto',
        observation: 'Diária gerada automaticamente após registro de saída no controle de ponto.',
        created_by: usuarioId,
        updated_by: usuarioId,
      })

    if (erroInsert) {
      console.error('Não foi possível gerar a diária no Supabase:', erroInsert)
      return { criada: false, erro: erroInsert.message }
    }

    await carregarDiariasSupabase()
    return { criada: true, erro: null }
  }

  async function registrarPontoManual(index: number) {
    const registro = registrosPonto[index]

    if (!registro) return

    if (!registro.employeeId) {
      mostrarNotificacao(
        'Este registro não possui vínculo com o funcionário no Supabase.',
        'error'
      )
      return
    }

    const agora = new Date()
    const horario = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const { data: authData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('attendance_records')
      .insert({
        employee_id: registro.employeeId,
        occurred_at: agora.toISOString(),
        record_type: registro.tipoRegistro || 'Entrada',
        source: 'Manual',
        facial_verified: false,
        facial_confidence: null,
        terminal_id: null,
        observation: 'Registro manual realizado pelo painel administrativo.',
        created_by: authData.user?.id || null,
      })
      .select(
        'id, employee_id, occurred_at, record_type, source, facial_verified, facial_confidence, observation'
      )
      .single()

    if (error || !data) {
      console.error('Não foi possível registrar o ponto no Supabase:', error)
      mostrarNotificacao(
        `Não foi possível registrar o ponto: ${error?.message || 'erro desconhecido'}`,
        'error'
      )
      return
    }

    await carregarPontosSupabase()

    let diariaGerada = false
    let erroDiaria: string | null = null
    if ((registro.tipoRegistro || 'Entrada') === 'Saída') {
      const resultadoDiaria = await gerarDiariaDoPontoSupabase(
        registro.employeeId,
        agora,
        authData.user?.id || null
      )
      diariaGerada = resultadoDiaria.criada
      erroDiaria = resultadoDiaria.erro
    }

    registrarAuditoria(
      'Ponto manual registrado',
      'Controle de Ponto',
      `${registro.tipoRegistro || 'Entrada'} de ${registro.nome} registrada manualmente às ${horario} e salva no Supabase.`,
      'Atenção'
    )

    if (erroDiaria) {
      mostrarNotificacao(
        `${registro.tipoRegistro || 'Entrada'} registrada, mas a diária não pôde ser gerada: ${erroDiaria}`,
        'warning'
      )
      return
    }

    if (diariaGerada) {
      mostrarNotificacao(
        `Saída de ${registro.nome} registrada e diária gerada automaticamente no Supabase.`,
        'success'
      )
      return
    }

    mostrarNotificacao(
      `${registro.tipoRegistro || 'Entrada'} de ${registro.nome} registrada e salva no Supabase.`,
      'success'
    )
  }

  function abrirAjustePonto(registro?: RegistroPonto) {
    const agora = new Date()
    const dataPadrao = registro?.data
      ? (() => {
          const [dia, mes, ano] = registro.data.split('/')
          return dia && mes && ano ? `${ano}-${mes}-${dia}` : dataLocalHoje
        })()
      : dataLocalHoje

    const horarioPadrao = registro?.horario && registro.horario !== '--:--'
      ? registro.horario
      : agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    setAjustePontoFuncionarioId(registro?.employeeId || '')
    setAjustePontoData(dataPadrao)
    setAjustePontoHorario(horarioPadrao)
    setAjustePontoTipo(registro?.tipoRegistro || 'Entrada')
    setAjustePontoMotivo('')
    setAjustePontoAberto(true)
  }

  async function salvarAjustePonto() {
    if (usuarioLogado?.perfil === 'Consulta') {
      mostrarNotificacao('Seu perfil não possui permissão para ajustar pontos.', 'error')
      return
    }

    const funcionario = funcionarios.find(
      (item) => item.id === ajustePontoFuncionarioId
    )

    if (!funcionario?.id) {
      mostrarNotificacao('Selecione o funcionário do ajuste.', 'warning')
      return
    }

    if (!ajustePontoData || !ajustePontoHorario) {
      mostrarNotificacao('Informe a data e o horário do ponto.', 'warning')
      return
    }

    const motivo = ajustePontoMotivo.trim()
    if (motivo.length < 8) {
      mostrarNotificacao('Informe uma justificativa com pelo menos 8 caracteres.', 'warning')
      return
    }

    const ocorridoEm = new Date(`${ajustePontoData}T${ajustePontoHorario}:00-03:00`)
    if (Number.isNaN(ocorridoEm.getTime())) {
      mostrarNotificacao('Data ou horário inválido para o ajuste.', 'error')
      return
    }

    if (ocorridoEm.getTime() > Date.now() + 60_000) {
      mostrarNotificacao('Não é possível registrar um ponto manual no futuro.', 'warning')
      return
    }

    setAjustePontoSalvando(true)

    try {
      const inicioMinuto = new Date(ocorridoEm)
      inicioMinuto.setSeconds(0, 0)
      const fimMinuto = new Date(inicioMinuto.getTime() + 60_000)

      const { data: duplicado, error: erroDuplicado } = await supabase
        .from('attendance_records')
        .select('id, record_type, occurred_at')
        .eq('employee_id', funcionario.id)
        .eq('record_type', ajustePontoTipo)
        .gte('occurred_at', inicioMinuto.toISOString())
        .lt('occurred_at', fimMinuto.toISOString())
        .limit(1)
        .maybeSingle()

      if (erroDuplicado) {
        throw erroDuplicado
      }

      if (duplicado) {
        mostrarNotificacao(
          `Já existe uma ${ajustePontoTipo.toLowerCase()} desse funcionário nesse mesmo minuto.`,
          'warning'
        )
        return
      }

      const { data: authData } = await supabase.auth.getUser()
      const usuarioId = authData.user?.id || null
      const observacao = `AJUSTE MANUAL — ${motivo}`

      const { data: pontoCriado, error: erroInsert } = await supabase
        .from('attendance_records')
        .insert({
          employee_id: funcionario.id,
          occurred_at: ocorridoEm.toISOString(),
          record_type: ajustePontoTipo,
          source: 'Manual',
          facial_verified: false,
          facial_confidence: null,
          terminal_id: null,
          observation: observacao,
          created_by: usuarioId,
        })
        .select('id')
        .single()

      if (erroInsert || !pontoCriado) {
        throw erroInsert || new Error('O Supabase não retornou o registro criado.')
      }

      let diariaGerada = false
      let erroDiaria: string | null = null

      if (ajustePontoTipo === 'Saída') {
        const resultado = await gerarDiariaDoPontoSupabase(
          funcionario.id,
          ocorridoEm,
          usuarioId
        )
        diariaGerada = resultado.criada
        erroDiaria = resultado.erro
      }

      await registrarAuditoria(
        'Ajuste manual de ponto',
        'Controle de Ponto',
        `${ajustePontoTipo} de ${funcionario.nome} ajustada para ${ajustePontoData.split('-').reverse().join('/')} às ${ajustePontoHorario}. Justificativa: ${motivo}`,
        'Atenção'
      )

      await carregarPontosSupabase()
      setAjustePontoAberto(false)
      setAjustePontoMotivo('')

      if (erroDiaria) {
        mostrarNotificacao(
          `Ponto ajustado, mas a diária não pôde ser gerada: ${erroDiaria}`,
          'warning'
        )
        return
      }

      mostrarNotificacao(
        diariaGerada
          ? `Ponto de ${funcionario.nome} ajustado e diária gerada.`
          : `Ponto de ${funcionario.nome} ajustado com sucesso.`,
        'success'
      )
    } catch (error: any) {
      console.error('Não foi possível salvar o ajuste de ponto:', error)
      mostrarNotificacao(
        `Não foi possível salvar o ajuste: ${error?.message || 'erro desconhecido'}`,
        'error'
      )
    } finally {
      setAjustePontoSalvando(false)
    }
  }

  async function ajustarTurnoBase(registro: RegistroPonto) {
    if (usuarioLogado?.perfil === 'Consulta') {
      mostrarNotificacao(
        'Seu perfil não possui permissão para ajustar o turno base.',
        'error'
      )
      return
    }

    const funcionario = funcionarios.find(
      (item) => item.id === registro.employeeId || item.nome === registro.nome
    )

    if (!funcionario?.id) {
      mostrarNotificacao('Funcionário não encontrado para o ajuste.', 'error')
      return
    }

    const dataISO = registro.data
      ? (() => {
          const [dia, mes, ano] = registro.data.split('/')
          return dia && mes && ano ? `${ano}-${mes}-${dia}` : dataPontoFiltro
        })()
      : dataPontoFiltro

    if (!dataISO) {
      mostrarNotificacao('Não foi possível identificar a data da escala.', 'error')
      return
    }

    const listaDaData = listasDiaristas.find(
      (lista) =>
        lista.data === dataISO &&
        lista.diaristas.some((nome) => nome === funcionario.nome)
    )

    if (!listaDaData) {
      mostrarNotificacao(
        'Esse funcionário não está escalado na Lista do Dia selecionada.',
        'warning'
      )
      return
    }

    const entradaBase = configuracaoValores.horarioEntradaPadrao || '09:30'
    const saidaBase = configuracaoValores.horarioSaidaPadrao || '18:30'
    const entradaEm = new Date(`${dataISO}T${entradaBase}:00-03:00`)
    const saidaEm = new Date(`${dataISO}T${saidaBase}:00-03:00`)

    if (
      Number.isNaN(entradaEm.getTime()) ||
      Number.isNaN(saidaEm.getTime())
    ) {
      mostrarNotificacao('Horário base configurado é inválido.', 'error')
      return
    }

    if (saidaEm.getTime() > Date.now() + 60_000) {
      mostrarNotificacao(
        `O turno base termina às ${saidaBase}. Não é possível lançar uma saída futura.`,
        'warning'
      )
      return
    }

    const motivoDigitado = window.prompt(
      `Justificativa para ajustar ${funcionario.nome} para o turno base ${entradaBase}–${saidaBase}:`,
      'Ajuste administrativo para o horário base do turno.'
    )

    if (motivoDigitado === null) return

    const motivo = motivoDigitado.trim()
    if (motivo.length < 8) {
      mostrarNotificacao(
        'Informe uma justificativa com pelo menos 8 caracteres.',
        'warning'
      )
      return
    }

    const confirmou = window.confirm(
      `Confirmar turno base de ${funcionario.nome}?\n\n` +
        `Data: ${dataISO.split('-').reverse().join('/')}\n` +
        `Entrada: ${entradaBase}\n` +
        `Saída: ${saidaBase}\n\n` +
        'O sistema incluirá somente os registros que ainda não existirem.'
    )

    if (!confirmou) return

    setAjustePontoSalvando(true)

    try {
      const { data: authData } = await supabase.auth.getUser()
      const usuarioId = authData.user?.id || null
      const observacao = `AJUSTE TURNO BASE ${entradaBase}-${saidaBase} — ${motivo}`

      const registrosBase = [
        { tipo: 'Entrada' as const, ocorridoEm: entradaEm },
        { tipo: 'Saída' as const, ocorridoEm: saidaEm },
      ]

      const criados: Array<'Entrada' | 'Saída'> = []
      const existentes: Array<'Entrada' | 'Saída'> = []

      for (const item of registrosBase) {
        const inicioMinuto = new Date(item.ocorridoEm)
        inicioMinuto.setSeconds(0, 0)
        const fimMinuto = new Date(inicioMinuto.getTime() + 60_000)

        const { data: duplicado, error: erroDuplicado } = await supabase
          .from('attendance_records')
          .select('id')
          .eq('employee_id', funcionario.id)
          .eq('record_type', item.tipo)
          .gte('occurred_at', inicioMinuto.toISOString())
          .lt('occurred_at', fimMinuto.toISOString())
          .limit(1)
          .maybeSingle()

        if (erroDuplicado) throw erroDuplicado

        if (duplicado) {
          existentes.push(item.tipo)
          continue
        }

        const { error: erroInsert } = await supabase
          .from('attendance_records')
          .insert({
            employee_id: funcionario.id,
            occurred_at: item.ocorridoEm.toISOString(),
            record_type: item.tipo,
            source: 'Manual',
            facial_verified: false,
            facial_confidence: null,
            terminal_id: null,
            observation: observacao,
            created_by: usuarioId,
          })

        if (erroInsert) throw erroInsert
        criados.push(item.tipo)
      }

      const resultadoDiaria = await gerarDiariaDoPontoSupabase(
        funcionario.id,
        saidaEm,
        usuarioId
      )

      await registrarAuditoria(
        'Ajuste de turno base',
        'Controle de Ponto',
        `Turno base de ${funcionario.nome} ajustado em ${dataISO
          .split('-')
          .reverse()
          .join('/')} para ${entradaBase}-${saidaBase}. Registros criados: ${
          criados.length ? criados.join(' e ') : 'nenhum (já existentes)'
        }. Justificativa: ${motivo}`,
        'Atenção'
      )

      await carregarPontosSupabase()

      if (resultadoDiaria.erro) {
        mostrarNotificacao(
          `Turno base ajustado, mas a diária não pôde ser gerada: ${resultadoDiaria.erro}`,
          'warning'
        )
        return
      }

      if (criados.length === 0 && existentes.length === 2) {
        mostrarNotificacao(
          `Entrada e saída base de ${funcionario.nome} já estavam registradas.`,
          'warning'
        )
        return
      }

      mostrarNotificacao(
        `Turno base de ${funcionario.nome} ajustado para ${entradaBase}–${saidaBase}${
          resultadoDiaria.criada ? ' e diária gerada automaticamente' : ''
        }.`,
        'success'
      )
    } catch (error: any) {
      console.error('Não foi possível ajustar o turno base:', error)
      mostrarNotificacao(
        `Não foi possível ajustar o turno base: ${
          error?.message || 'erro desconhecido'
        }`,
        'error'
      )
    } finally {
      setAjustePontoSalvando(false)
    }
  }

  function gerarDiariasDaListaSelecionada() {
    const lista = listaDiaristasSelecionada ?? listasDiaristas[0]

    if (!lista) {
      mostrarNotificacao(
        'Crie e salve uma Lista do Dia antes de gerar as diárias.',
        'warning'
      )
      return
    }

    const dataBR = formatarDataLista(lista.data)

    const presentes = lista.diaristas.filter((nome) =>
      registrosPonto.some(
        (registro) =>
          registro.nome === nome &&
          registro.data === dataBR &&
          registro.status === 'Registrado'
      )
    )

    if (presentes.length === 0) {
      mostrarNotificacao(
        `Nenhum diarista da lista de ${dataBR} possui ponto registrado.`,
        'warning'
      )
      return
    }

    const dataReferencia = new Date(`${lista.data}T12:00:00`)
    const { tipoDia, adicional } = descobrirTipoDia(dataReferencia)

    const novasDiarias: Diaria[] = []

    presentes.forEach((nome) => {
      const jaExiste = diarias.some(
        (diaria) => diaria.nome === nome && diaria.data === dataBR
      )

      if (jaExiste) return

      const funcionario = obterFuncionarioPorNome(nome)

      const valor =
        configuracaoValores.diariaBase +
        adicional +
        configuracaoValores.vt +
        configuracaoValores.vr

      novasDiarias.push({
        nome,
        funcao: funcionario?.funcao || 'Diarista',
        data: dataBR,
        tipoDia,
        diariaBase: configuracaoValores.diariaBase,
        adicional,
        vt: configuracaoValores.vt,
        vr: configuracaoValores.vr,
        valor,
        status: 'Pendente',
      })
    })

    if (novasDiarias.length === 0) {
      mostrarNotificacao(
        'As diárias dos trabalhadores presentes já foram geradas.',
        'info'
      )
      return
    }

    setDiarias((atuais) => [...atuais, ...novasDiarias])

    mostrarNotificacao(
      `${novasDiarias.length} diária(s) gerada(s) a partir da Lista do Dia.`,
      'success'
    )
  }

  function gerarDiariasDaOperacao(lista: ListaDiaristas) {
    const dataBR = formatarDataLista(lista.data)

    const presentes = lista.diaristas.filter((nome) =>
      registrosPonto.some(
        (registro) =>
          registro.nome === nome &&
          registro.data === dataBR &&
          registro.status === 'Registrado'
      )
    )

    if (presentes.length === 0) {
      mostrarNotificacao(
        `Nenhum diarista presente em ${dataBR} para gerar diária.`,
        'warning'
      )
      return
    }

    const dataReferencia = new Date(`${lista.data}T12:00:00`)
    const { tipoDia, adicional } = descobrirTipoDia(dataReferencia)
    const novasDiarias: Diaria[] = []

    presentes.forEach((nome) => {
      const jaExiste = diarias.some(
        (diaria) => diaria.nome === nome && diaria.data === dataBR
      )

      if (jaExiste) return

      const funcionario = obterFuncionarioPorNome(nome)

      novasDiarias.push({
        nome,
        funcao: 'Auxiliar Logístico',
        data: dataBR,
        tipoDia,
        diariaBase: configuracaoValores.diariaBase,
        adicional,
        vt: configuracaoValores.vt,
        vr: configuracaoValores.vr,
        valor:
          configuracaoValores.diariaBase +
          adicional +
          configuracaoValores.vt +
          configuracaoValores.vr,
        status: 'Pendente',
      })
    })

    if (novasDiarias.length === 0) {
      mostrarNotificacao(
        'As diárias dos diaristas presentes já foram geradas.',
        'info'
      )
      return
    }

    setDiarias((atuais) => [...atuais, ...novasDiarias])

    mostrarNotificacao(
      `${novasDiarias.length} diária(s) gerada(s) para a operação do dia.`,
      'success'
    )
  }

  function avancarStatusDiaria(index: number) {
    const diaria = diarias[index]
    if (!diaria) return

    const ordemStatus: Array<'Pendente' | 'Conferida' | 'Aprovada' | 'Cancelada'> = [
      'Pendente',
      'Conferida',
      'Aprovada',
      'Cancelada',
    ]

    const indiceAtual = ordemStatus.indexOf(diaria.status)
    const proximoStatus = ordemStatus[(indiceAtual + 1) % ordemStatus.length]
    void alterarStatusDiaria(index, proximoStatus)
  }

  async function alterarStatusDiaria(index: number, novoStatus: 'Pendente' | 'Conferida' | 'Aprovada' | 'Cancelada') {
    const diaria = diarias[index]
    if (!diaria) return

    if (!podeEditar) {
      mostrarNotificacao('Seu usuário não possui permissão para alterar o status das diárias.', 'warning')
      return
    }

    if (!diaria.id) {
      mostrarNotificacao('Esta diária não possui vínculo com o Supabase.', 'error')
      return
    }

    if (diaria.status === novoStatus) return

    const { data: vinculoFechamento, error: erroVinculo } = await supabase
      .from('closing_daily_records')
      .select('closing_id')
      .eq('daily_record_id', diaria.id)
      .limit(1)
      .maybeSingle()

    if (erroVinculo) {
      console.error('Não foi possível verificar o fechamento da diária:', erroVinculo)
      mostrarNotificacao(`Não foi possível verificar o fechamento: ${erroVinculo.message}`, 'error')
      return
    }

    if (vinculoFechamento?.closing_id) {
      mostrarNotificacao(
        'Esta diária já está vinculada a um fechamento. O status não pode ser alterado por aqui para preservar o financeiro.',
        'warning'
      )
      return
    }

    let motivoCancelamento = ''
    if (novoStatus === 'Cancelada') {
      const motivo = window.prompt(`Motivo do cancelamento da diária de ${diaria.nome} em ${diaria.data}:`)
      if (motivo === null) return
      if (!motivo.trim()) {
        mostrarNotificacao('Informe o motivo do cancelamento da diária.', 'warning')
        return
      }
      motivoCancelamento = motivo.trim()
    }

    const confirmou = window.confirm(
      `Alterar a diária de ${diaria.nome} em ${diaria.data} de ${diaria.status} para ${novoStatus}?`
    )
    if (!confirmou) return

    const { data: authData } = await supabase.auth.getUser()
    const observacaoAnterior = diaria.observacao?.trim()
    const observacao = novoStatus === 'Cancelada'
      ? [observacaoAnterior, `Cancelada: ${motivoCancelamento}`].filter(Boolean).join(' | ')
      : observacaoAnterior || null

    const { error } = await supabase
      .from('daily_records')
      .update({
        status: novoStatus,
        observation: observacao,
        updated_by: authData.user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', diaria.id)

    if (error) {
      console.error('Não foi possível alterar o status da diária:', error)
      mostrarNotificacao(`Não foi possível alterar o status: ${error.message}`, 'error')
      return
    }

    await registrarAuditoria(
      'Status da diária alterado',
      'Diárias',
      `${diaria.nome} - ${diaria.data}: status alterado de ${diaria.status} para ${novoStatus}${motivoCancelamento ? `. Motivo: ${motivoCancelamento}.` : '.'}`,
      novoStatus === 'Cancelada' ? 'Atenção' : 'Informação',
      undefined,
      'daily_record',
      diaria.id
    )

    await carregarDiariasSupabase()
    mostrarNotificacao(`Status alterado para ${novoStatus}.`, 'success')
  }

  async function aprovarDiaria(index: number) {
    const diaria = diarias[index]
    if (!diaria) return

    if (!diaria.id) {
      mostrarNotificacao('Esta diária não possui vínculo com o Supabase.', 'error')
      return
    }

    const { data: authData } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('daily_records')
      .update({
        status: 'Aprovada',
        updated_by: authData.user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', diaria.id)

    if (error) {
      console.error('Não foi possível aprovar a diária no Supabase:', error)
      mostrarNotificacao(`Não foi possível aprovar a diária: ${error.message}`, 'error')
      return
    }

    await carregarDiariasSupabase()
    mostrarNotificacao(`Diária de ${diaria.nome} aprovada no Supabase.`, 'success')
  }

  function periodoFechamentoPorData(dataReferencia = new Date()) {
    const ano = dataReferencia.getFullYear()
    const mes = dataReferencia.getMonth()
    const primeira = dataReferencia.getDate() <= 15
    const inicio = new Date(ano, mes, primeira ? 1 : 16, 12)
    const fim = primeira
      ? new Date(ano, mes, 15, 12)
      : new Date(ano, mes + 1, 0, 12)
    const pagamento = primeira
      ? new Date(ano, mes, 20, 12)
      : new Date(ano, mes + 1, 5, 12)

    return {
      periodo: `${inicio.toLocaleDateString('pt-BR')} a ${fim.toLocaleDateString('pt-BR')}`,
      pagamento: pagamento.toLocaleDateString('pt-BR'),
    }
  }

  function datasDaQuinzena(periodo: string) {
    const datas = extrairPeriodoFechamento(periodo)
    if (!datas) return [] as Date[]

    const resultado: Date[] = []
    const cursor = new Date(datas.inicio)

    while (cursor <= datas.fim) {
      resultado.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }

    return resultado
  }

  function resumoAutomaticoFechamento(periodo: string, dailyRecordIds?: string[]) {
    const datas = extrairPeriodoFechamento(periodo)

    if (!datas) {
      return {
        funcionarios: [] as Array<any>,
        inconsistencias: [] as Array<{
          tipo: string
          detalhe: string
          nivel: 'Atenção' | 'Crítico'
        }>,
        totais: {
          escalas: 0,
          presencas: 0,
          faltas: 0,
          diarias: 0,
          base: 0,
          adicional: 0,
          vt: 0,
          vr: 0,
          total: 0,
        },
      }
    }

    const noPeriodoBR = (dataBR: string) => {
      const data = dataBRParaDate(dataBR)
      return !!data && data >= datas.inicio && data <= datas.fim
    }

    const listasPeriodo = listasDiaristas.filter((lista) => {
      const data = new Date(`${lista.data}T12:00:00`)
      return data >= datas.inicio && data <= datas.fim
    })

    // O fechamento financeiro considera exclusivamente diárias APROVADAS.
    // Quando recebemos os IDs do fechamento, mostramos somente as diárias
    // efetivamente vinculadas àquela quinzena no Supabase.
    const idsVinculados = dailyRecordIds ? new Set(dailyRecordIds) : null
    const diariasPeriodo = diarias.filter(
      (diaria) =>
        noPeriodoBR(diaria.data) &&
        diaria.status === 'Aprovada' &&
        (!idsVinculados || (!!diaria.id && idsVinculados.has(diaria.id)))
    )

    const nomes = Array.from(
      new Set(diariasPeriodo.map((diaria) => diaria.nome))
    ).sort((a, b) => a.localeCompare(b))

    const inconsistencias: Array<{
      tipo: string
      detalhe: string
      nivel: 'Atenção' | 'Crítico'
    }> = []

    listasPeriodo.forEach((lista) => {
      const dataBR = new Date(`${lista.data}T12:00:00`).toLocaleDateString('pt-BR')

      lista.diaristas.forEach((nome) => {
        const ponto = registrosPonto.some(
          (registro) =>
            registro.nome === nome &&
            registro.data === dataBR &&
            registro.status === 'Registrado'
        )
        const diaria = diarias.some(
          (registro) => registro.nome === nome && registro.data === dataBR
        )

        if (!ponto) {
          inconsistencias.push({
            tipo: 'Escalado sem ponto',
            detalhe: `${nome} estava escalado em ${dataBR}, mas não possui presença registrada.`,
            nivel: 'Atenção',
          })
        } else if (!diaria) {
          inconsistencias.push({
            tipo: 'Ponto sem diária',
            detalhe: `${nome} registrou presença em ${dataBR}, mas a diária ainda não foi gerada.`,
            nivel: 'Crítico',
          })
        }
      })
    })

    const funcionariosResumo = nomes.map((nome) => {
      const escalas = listasPeriodo.filter((lista) =>
        lista.diaristas.includes(nome)
      )

      const presencas = escalas.filter((lista) => {
        const dataBR = new Date(`${lista.data}T12:00:00`).toLocaleDateString('pt-BR')
        return registrosPonto.some(
          (registro) =>
            registro.nome === nome &&
            registro.data === dataBR &&
            registro.status === 'Registrado'
        )
      }).length

      const itens = diariasPeriodo.filter((diaria) => diaria.nome === nome)

      return {
        nome,
        escalas: escalas.length,
        presencas,
        faltas: Math.max(escalas.length - presencas, 0),
        diarias: itens.length,
        uteis: itens.filter((item) => item.tipoDia === 'Semana').length,
        sabados: itens.filter((item) => item.tipoDia === 'Sábado').length,
        domingos: itens.filter((item) => item.tipoDia === 'Domingo').length,
        feriados: itens.filter((item) => item.tipoDia === 'Feriado').length,
        base: itens.reduce((soma, item) => soma + item.diariaBase, 0),
        adicional: itens.reduce((soma, item) => soma + item.adicional, 0),
        vt: itens.reduce((soma, item) => soma + item.vt, 0),
        vr: itens.reduce((soma, item) => soma + item.vr, 0),
        total: itens.reduce((soma, item) => soma + item.valor, 0),
      }
    })

    const totais = funcionariosResumo.reduce(
      (acc, item) => ({
        escalas: acc.escalas + item.escalas,
        presencas: acc.presencas + item.presencas,
        faltas: acc.faltas + item.faltas,
        diarias: acc.diarias + item.diarias,
        base: acc.base + item.base,
        adicional: acc.adicional + item.adicional,
        vt: acc.vt + item.vt,
        vr: acc.vr + item.vr,
        total: acc.total + item.total,
      }),
      {
        escalas: 0,
        presencas: 0,
        faltas: 0,
        diarias: 0,
        base: 0,
        adicional: 0,
        vt: 0,
        vr: 0,
        total: 0,
      }
    )

    return { funcionarios: funcionariosResumo, inconsistencias, totais }
  }

  async function sincronizarDiariasAprovadasFechamento(
    fechamento: Fechamento,
    mostrarMensagem = true
  ) {
    if (!fechamento.id || !fechamento.startDate || !fechamento.endDate) {
      mostrarNotificacao('Fechamento sem vínculo válido com o Supabase.', 'error')
      return null
    }

    if (fechamento.status !== 'Em conferência' && fechamento.status !== 'Reaberto') {
      if (mostrarMensagem) {
        mostrarNotificacao(
          'Somente fechamentos em conferência ou reabertos podem receber novas diárias aprovadas.',
          'warning'
        )
      }
      return fechamento.dailyRecordIds || []
    }

    const { data: aprovadas, error: erroDiarias } = await supabase
      .from('daily_records')
      .select('id, base_amount, additional_amount, transport_amount, meal_amount, total_amount')
      .gte('work_date', fechamento.startDate)
      .lte('work_date', fechamento.endDate)
      .eq('status', 'Aprovada')

    if (erroDiarias) {
      mostrarNotificacao(`Não foi possível consultar as diárias aprovadas: ${erroDiarias.message}`, 'error')
      return null
    }

    const registros = aprovadas || []
    const idsAprovados = registros.map((item) => item.id)
    const idsAtuais = new Set(fechamento.dailyRecordIds || [])
    const novosIds = idsAprovados.filter((id) => !idsAtuais.has(id))

    if (novosIds.length) {
      const { error: erroVinculos } = await supabase
        .from('closing_daily_records')
        .insert(novosIds.map((dailyRecordId) => ({
          closing_id: fechamento.id,
          daily_record_id: dailyRecordId,
        })))

      if (erroVinculos) {
        mostrarNotificacao(`Não foi possível vincular as novas diárias aprovadas: ${erroVinculos.message}`, 'error')
        return null
      }
    }

    const totalDaily = registros.reduce(
      (soma, item) => soma + Number(item.base_amount || 0) + Number(item.additional_amount || 0),
      0
    )
    const totalTransport = registros.reduce((soma, item) => soma + Number(item.transport_amount || 0), 0)
    const totalMeal = registros.reduce((soma, item) => soma + Number(item.meal_amount || 0), 0)
    const totalAmount = registros.reduce((soma, item) => soma + Number(item.total_amount || 0), 0)

    const { error: erroTotais } = await supabase
      .from('closings')
      .update({
        total_daily: totalDaily,
        total_transport: totalTransport,
        total_meal: totalMeal,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fechamento.id)

    if (erroTotais) {
      mostrarNotificacao(`As diárias foram conferidas, mas os totais não puderam ser atualizados: ${erroTotais.message}`, 'error')
      return null
    }

    await carregarFechamentosSupabase()

    if (mostrarMensagem) {
      mostrarNotificacao(
        novosIds.length
          ? `${novosIds.length} nova(s) diária(s) aprovada(s) adicionada(s) ao fechamento.`
          : 'Fechamento já está sincronizado com todas as diárias aprovadas da quinzena.',
        'success'
      )
    }

    return idsAprovados
  }

  async function abrirQuinzenaAtual() {
    const atual = periodoFechamentoPorData()
    const datas = extrairPeriodoFechamento(atual.periodo)
    if (!datas) return

    const inicioISO = dataISOEmSaoPaulo(datas.inicio)
    const fimISO = dataISOEmSaoPaulo(datas.fim)

    const existente = fechamentos.find(
      (item) => item.startDate === inicioISO && item.endDate === fimISO
    )
    if (existente) {
      setFechamentoSelecionado(fechamentos.indexOf(existente))
      if (existente.status === 'Em conferência' || existente.status === 'Reaberto') {
        await sincronizarDiariasAprovadasFechamento(existente, true)
      } else {
        mostrarNotificacao('Essa quinzena já existe no Supabase.', 'success')
      }
      return
    }

    const { data: registros, error: erroDiarias } = await supabase
      .from('daily_records')
      .select('id, base_amount, additional_amount, transport_amount, meal_amount, total_amount')
      .gte('work_date', inicioISO)
      .lte('work_date', fimISO)
      .eq('status', 'Aprovada')

    if (erroDiarias) {
      mostrarNotificacao(`Não foi possível consultar as diárias aprovadas: ${erroDiarias.message}`, 'error')
      return
    }

    if (!registros?.length) {
      mostrarNotificacao('Não há diárias aprovadas nessa quinzena.', 'warning')
      return
    }

    const totalDaily = registros.reduce((soma, item) => soma + Number(item.base_amount || 0) + Number(item.additional_amount || 0), 0)
    const totalTransport = registros.reduce((soma, item) => soma + Number(item.transport_amount || 0), 0)
    const totalMeal = registros.reduce((soma, item) => soma + Number(item.meal_amount || 0), 0)
    const totalAmount = registros.reduce((soma, item) => soma + Number(item.total_amount || 0), 0)

    const { data: criado, error: erroFechamento } = await supabase
      .from('closings')
      .insert({
        start_date: inicioISO,
        end_date: fimISO,
        status: 'Em conferência',
        total_daily: totalDaily,
        total_transport: totalTransport,
        total_meal: totalMeal,
        total_amount: totalAmount,
        created_by: usuarioLogado?.authId || null,
      })
      .select('id')
      .single()

    if (erroFechamento || !criado) {
      mostrarNotificacao(`Não foi possível criar o fechamento: ${erroFechamento?.message || 'erro desconhecido'}`, 'error')
      return
    }

    const { error: erroVinculo } = await supabase
      .from('closing_daily_records')
      .insert(registros.map((item) => ({ closing_id: criado.id, daily_record_id: item.id })))

    if (erroVinculo) {
      mostrarNotificacao(`Fechamento criado, mas houve erro ao vincular as diárias: ${erroVinculo.message}`, 'error')
      await carregarFechamentosSupabase()
      return
    }

    await carregarFechamentosSupabase()
    registrarAuditoria('Fechamento criado', 'Fechamentos', `Quinzena ${atual.periodo} criada no Supabase com ${registros.length} diária(s) aprovada(s).`, 'Atenção')
    mostrarNotificacao('Quinzena criada e vinculada às diárias no Supabase.', 'success')
  }

  async function aprovarQuinzena(index: number) {
    const fechamento = fechamentos[index]
    if (!fechamento?.id) return

    const idsSincronizados = await sincronizarDiariasAprovadasFechamento(fechamento, false)
    if (idsSincronizados === null) return

    if (!idsSincronizados.length) {
      mostrarNotificacao('Não há diárias aprovadas para vincular a esse fechamento.', 'warning')
      return
    }

    const resumo = resumoAutomaticoFechamento(fechamento.periodo, idsSincronizados)
    const criticos = resumo.inconsistencias.filter((item) => item.nivel === 'Crítico')
    if (criticos.length) {
      mostrarNotificacao(`Corrija ${criticos.length} pendência(s) crítica(s) antes de aprovar.`, 'error')
      return
    }

    const { error } = await supabase.from('closings').update({
      status: 'Aprovado',
      approved_by: usuarioLogado?.authId || null,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', fechamento.id)

    if (error) {
      mostrarNotificacao(`Não foi possível aprovar a quinzena: ${error.message}`, 'error')
      return
    }

    await carregarFechamentosSupabase()
    mostrarNotificacao('Quinzena aprovada no Supabase.', 'success')
  }

  async function enviarQuinzenaPagamentos(index: number) {
    const fechamento = fechamentos[index]
    if (!fechamento?.id || fechamento.status !== 'Aprovado') {
      mostrarNotificacao('Aprove a quinzena antes de enviar para pagamentos.', 'warning')
      return
    }

    const idsDoFechamento = fechamento.dailyRecordIds || []
    const diariasDoFechamento = diarias.filter(
      (item) => item.id && idsDoFechamento.includes(item.id) && item.status === 'Aprovada'
    )

    if (!diariasDoFechamento.length) {
      mostrarNotificacao('Não há diárias aprovadas vinculadas a esse fechamento.', 'warning')
      return
    }

    const agrupados = new Map<
      string,
      { employeeId: string; nome: string; quantidade: number; total: number }
    >()

    diariasDoFechamento.forEach((item) => {
      if (!item.employeeId) return
      const atual = agrupados.get(item.employeeId) || {
        employeeId: item.employeeId,
        nome: item.nome,
        quantidade: 0,
        total: 0,
      }
      atual.quantidade += 1
      atual.total += Number(item.valor) || 0
      agrupados.set(item.employeeId, atual)
    })

    const { data: existentes, error: erroExistentes } = await supabase
      .from('payments')
      .select('employee_id')
      .eq('closing_id', fechamento.id)

    if (erroExistentes) {
      mostrarNotificacao(`Não foi possível verificar pagamentos existentes: ${erroExistentes.message}`, 'error')
      return
    }

    const empregadosJaGerados = new Set(
      (existentes || []).map((item: { employee_id: string }) => item.employee_id)
    )

    const novosPagamentos = Array.from(agrupados.values())
      .filter((item) => !empregadosJaGerados.has(item.employeeId))
      .map((item) => {
        const funcionario = funcionarios.find((f) => f.id === item.employeeId)
        return {
          employee_id: item.employeeId,
          closing_id: fechamento.id,
          amount: item.total,
          payment_method: 'PIX',
          status: 'Pendente',
          pix_key_snapshot: funcionario?.chavePix || null,
          pix_holder_snapshot: funcionario?.titularPix || funcionario?.nome || item.nome,
          pix_city_snapshot: funcionario?.cidadePix || null,
          observation: `Pagamento referente ao fechamento ${fechamento.periodo}.`,
          created_by: usuarioLogado?.authId || null,
          updated_by: usuarioLogado?.authId || null,
        }
      })

    if (novosPagamentos.length) {
      const { error: erroPagamentos } = await supabase
        .from('payments')
        .insert(novosPagamentos)

      if (erroPagamentos) {
        mostrarNotificacao(`Não foi possível gerar os pagamentos: ${erroPagamentos.message}`, 'error')
        return
      }
    }

    const { error } = await supabase.from('closings').update({
      status: 'Enviado para pagamento',
      sent_to_payment_by: usuarioLogado?.authId || null,
      sent_to_payment_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', fechamento.id)

    if (error) {
      mostrarNotificacao(`Os pagamentos foram gerados, mas não foi possível atualizar o fechamento: ${error.message}`, 'error')
      await carregarPagamentosSupabase()
      return
    }

    await carregarFechamentosSupabase()
    await carregarPagamentosSupabase()
    registrarAuditoria(
      'Pagamentos gerados',
      'Pagamentos',
      `Fechamento ${fechamento.periodo} enviado para pagamento com ${agrupados.size} funcionário(s).`,
      'Atenção'
    )
    mostrarNotificacao('Pagamentos gerados no Supabase e fechamento enviado para pagamento.', 'success')
  }

  async function reabrirQuinzena(index: number) {
    const fechamento = fechamentos[index]
    if (!fechamento?.id || fechamento.status === 'Pago') return
    if (!window.confirm(`Reabrir ${fechamento.periodo} para conferência?`)) return

    const { error } = await supabase.from('closings').update({
      status: 'Reaberto',
      approved_by: null,
      approved_at: null,
      updated_at: new Date().toISOString(),
    }).eq('id', fechamento.id)

    if (error) {
      mostrarNotificacao(`Não foi possível reabrir o fechamento: ${error.message}`, 'error')
      return
    }

    await carregarFechamentosSupabase()
    mostrarNotificacao('Fechamento reaberto no Supabase.', 'success')
  }

  async function marcarPagamentoComoPago(index: number) {
    const pagamento = pagamentos[index]

    if (!pagamento?.id) {
      mostrarNotificacao('Esse pagamento ainda não está vinculado ao Supabase.', 'warning')
      return
    }

    if (pagamento.status === 'Pago') return

    const agoraISO = new Date().toISOString()
    const { data: authData, error: authError } = await supabase.auth.getUser()

    if (authError || !authData.user) {
      mostrarNotificacao('Sua sessão não pôde ser confirmada. Entre novamente no sistema.', 'error')
      return
    }

    const { data: pagamentoAtualizado, error } = await supabase
      .from('payments')
      .update({
        status: 'Pago',
        paid_at: agoraISO,
        updated_by: authData.user.id,
        updated_at: agoraISO,
      })
      .eq('id', pagamento.id)
      .select('id, status, paid_at, closing_id')
      .single()

    if (error || !pagamentoAtualizado || pagamentoAtualizado.status !== 'Pago') {
      console.error('Falha ao persistir pagamento como Pago:', error)
      mostrarNotificacao(
        `O pagamento não foi alterado no banco. ${error?.message || 'Verifique as permissões de atualização da tabela payments.'}`,
        'error'
      )
      return
    }

    if (pagamento.closingId) {
      const { data: pagamentosDoFechamento, error: erroConsulta } = await supabase
        .from('payments')
        .select('status')
        .eq('closing_id', pagamento.closingId)

      if (!erroConsulta && pagamentosDoFechamento?.length) {
        const todosPagos = pagamentosDoFechamento.every(
          (item: { status: string }) => item.status === 'Pago'
        )

        if (todosPagos) {
          const { error: erroFechamento } = await supabase
            .from('closings')
            .update({ status: 'Pago', updated_at: agoraISO })
            .eq('id', pagamento.closingId)

          if (erroFechamento) {
            console.error('Pagamento foi salvo, mas o fechamento não pôde ser marcado como Pago:', erroFechamento)
          }
        }
      }
    }

    await carregarPagamentosSupabase()
    await carregarFechamentosSupabase()

    if (pagamentoPixSelecionado?.id === pagamento.id) {
      setPagamentoPixSelecionado({
        ...pagamentoPixSelecionado,
        status: 'Pago',
        dataPagamento: new Date(pagamentoAtualizado.paid_at || agoraISO).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          dateStyle: 'short',
          timeStyle: 'short',
        }),
      })
    }

    registrarAuditoria(
      'Pagamento confirmado',
      'Pagamentos',
      `Pagamento de ${pagamento.nome} no valor de ${moeda(pagamento.valorTotal)} confirmado manualmente.`,
      'Atenção'
    )
    mostrarNotificacao(`Pagamento de ${pagamento.nome} confirmado e verificado no Supabase.`, 'success')
  }

  function marcarPagamentoSelecionadoComoPago() {
    if (!pagamentoPixSelecionado) return

    const index = pagamentos.findIndex(
      (pagamento) =>
        pagamento.nome === pagamentoPixSelecionado.nome &&
        pagamento.periodo === pagamentoPixSelecionado.periodo
    )

    if (index >= 0) {
      marcarPagamentoComoPago(index)
    }
  }

  async function salvarDocumento() {
    if (
      !novoDocumento.funcionario ||
      !novoDocumento.tipo ||
      !novoDocumento.titulo.trim() ||
      !novoDocumento.arquivo
    ) {
      mostrarNotificacao(
        'Preencha funcionário, tipo, título e selecione um arquivo.',
        'warning'
      )
      return
    }

    const funcionario = funcionarios.find(
      (item) => item.nome === novoDocumento.funcionario
    )

    if (!funcionario?.id) {
      mostrarNotificacao(
        'Esse funcionário não possui vínculo válido com o Supabase.',
        'error'
      )
      return
    }

    const arquivo = novoDocumento.arquivo
    const limiteBytes = 10 * 1024 * 1024

    if (arquivo.size > limiteBytes) {
      mostrarNotificacao(
        'O arquivo ultrapassa 10 MB. Escolha um documento menor.',
        'warning'
      )
      return
    }

    setEnviandoDocumento(true)

    const nomeSeguro = arquivo.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')

    const caminho = `${funcionario.id}/${Date.now()}-${crypto.randomUUID()}-${nomeSeguro}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('documentos-funcionarios')
        .upload(caminho, arquivo, {
          cacheControl: '3600',
          upsert: false,
          contentType: arquivo.type || undefined,
        })

      if (uploadError) {
        throw uploadError
      }

      const { data, error } = await supabase
        .from('employee_documents')
        .insert({
          employee_id: funcionario.id,
          document_type: novoDocumento.tipo,
          title: novoDocumento.titulo.trim(),
          storage_path: caminho,
          original_filename: arquivo.name,
          mime_type: arquivo.type || null,
          file_size: arquivo.size,
          expires_at: novoDocumento.validade || null,
          status: 'Ativo',
          uploaded_by: usuarioLogado?.authId || null,
        })
        .select(
          'id, employee_id, document_type, title, storage_path, original_filename, mime_type, file_size, expires_at, status, created_at'
        )
        .single()

      if (error || !data) {
        await supabase.storage
          .from('documentos-funcionarios')
          .remove([caminho])
        throw error || new Error('Documento não retornado após o cadastro.')
      }

      setNovoDocumento({
        funcionario: '',
        tipo: '',
        titulo: '',
        validade: '',
        nomeArquivo: '',
        arquivo: null,
      })

      setMostrarDocumento(false)
      await carregarDocumentosSupabase()

      registrarAuditoria(
        'Documento enviado',
        'Documentos',
        `Documento "${novoDocumento.titulo.trim()}" enviado para ${funcionario.nome}.`,
        'Atenção'
      )

      mostrarNotificacao(
        `Documento de ${funcionario.nome} enviado com segurança.`,
        'success'
      )
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : 'Não foi possível enviar o documento.'

      console.error('Erro ao enviar documento:', erro)
      mostrarNotificacao(`Erro no envio: ${mensagem}`, 'error')
    } finally {
      setEnviandoDocumento(false)
    }
  }

  async function abrirDocumento(documento: Documento) {
    if (!documento.storagePath) {
      mostrarNotificacao('Caminho do arquivo não encontrado.', 'error')
      return
    }

    const { data, error } = await supabase.storage
      .from('documentos-funcionarios')
      .createSignedUrl(documento.storagePath, 60)

    if (error || !data?.signedUrl) {
      console.error('Não foi possível gerar o link temporário:', error)
      mostrarNotificacao(
        `Não foi possível abrir o documento: ${error?.message || 'link indisponível'}`,
        'error'
      )
      return
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  async function arquivarDocumento(documento: Documento) {
    if (!documento.id) {
      mostrarNotificacao('Documento sem identificação no Supabase.', 'error')
      return
    }

    if (!window.confirm(`Arquivar "${documento.titulo || documento.nome}"?`)) {
      return
    }

    const { error } = await supabase
      .from('employee_documents')
      .update({
        status: 'Arquivado',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documento.id)

    if (error) {
      console.error('Não foi possível arquivar o documento:', error)
      mostrarNotificacao(
        `Não foi possível arquivar: ${error.message}`,
        'error'
      )
      return
    }

    await carregarDocumentosSupabase()
    mostrarNotificacao('Documento arquivado com sucesso.', 'success')
  }

  function escaparHtml(valor: unknown) {
    return String(valor ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;')
  }

  function exportarPDF() {
    const janela = window.open('', '_blank', 'width=1000,height=760')
    if (!janela) {
      mostrarNotificacao('O navegador bloqueou a janela do relatório. Libere pop-ups e tente novamente.', 'warning')
      return
    }

    const totalDiarias = diarias.reduce((soma, item) => soma + item.valor, 0)
    const pagos = pagamentos.filter((item) => item.status === 'Pago')
    const totalPago = pagos.reduce((soma, item) => soma + item.valorTotal, 0)
    const linhas = diarias
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((item) => `<tr><td>${escaparHtml(item.nome)}</td><td>${escaparHtml(item.data)}</td><td>${escaparHtml(item.tipoDia)}</td><td>${escaparHtml(item.status)}</td><td>${escaparHtml(moeda(item.valor))}</td></tr>`)
      .join('')

    janela.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório - Gestão de Diaristas</title><style>body{font-family:Arial,sans-serif;color:#2f2732;padding:28px}h1{margin:0 0 6px;color:#54266c}p{color:#6f6572}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0}.card{border:1px solid #ddd4e1;border-radius:12px;padding:12px}.card span{font-size:11px;color:#777}.card strong{display:block;font-size:18px;margin-top:6px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:8px;border-bottom:1px solid #e9e4ec;text-align:left}th{background:#f3edf6;color:#5b2c70}@media print{button{display:none}body{padding:0}}</style></head><body><h1>Gestão de Diaristas</h1><p>Sindicato • Operação DHL Mogi Mirim</p><div class="cards"><div class="card"><span>Funcionários ativos</span><strong>${funcionarios.filter((f) => f.status === 'Ativo').length}</strong></div><div class="card"><span>Registros de ponto</span><strong>${registrosPonto.filter((p) => p.status === 'Registrado').length}</strong></div><div class="card"><span>Valor em diárias</span><strong>${escaparHtml(moeda(totalDiarias))}</strong></div><div class="card"><span>Pagamentos realizados</span><strong>${escaparHtml(moeda(totalPago))}</strong></div></div><h2>Diárias</h2><table><thead><tr><th>Funcionário</th><th>Data</th><th>Tipo</th><th>Status</th><th>Total</th></tr></thead><tbody>${linhas || '<tr><td colspan="5">Nenhuma diária cadastrada.</td></tr>'}</tbody></table><script>window.onload=()=>{window.print()}</script></body></html>`)
    janela.document.close()

    registrarAuditoria('Relatório preparado para PDF', 'Relatórios', 'Relatório geral aberto para impressão/salvamento em PDF.', 'Informação')
    mostrarNotificacao('Relatório aberto. Escolha “Salvar como PDF” na impressão.', 'success')
  }

  function exportarExcel() {
    const linhasFuncionarios = funcionarios
      .map((item) => `<tr><td>${escaparHtml(item.nome)}</td><td>${escaparHtml(item.cpf)}</td><td>${escaparHtml(item.funcao)}</td><td>${escaparHtml(item.status)}</td><td>${escaparHtml(item.chavePix)}</td></tr>`)
      .join('')
    const linhasDiarias = diarias
      .map((item) => `<tr><td>${escaparHtml(item.nome)}</td><td>${escaparHtml(item.data)}</td><td>${escaparHtml(item.tipoDia)}</td><td>${item.diariaBase.toFixed(2)}</td><td>${item.adicional.toFixed(2)}</td><td>${item.vt.toFixed(2)}</td><td>${item.vr.toFixed(2)}</td><td>${item.valor.toFixed(2)}</td><td>${escaparHtml(item.status)}</td></tr>`)
      .join('')
    const linhasPagamentos = pagamentos
      .map((item) => `<tr><td>${escaparHtml(item.nome)}</td><td>${escaparHtml(item.periodo)}</td><td>${item.quantidadeDiarias}</td><td>${item.valorTotal.toFixed(2)}</td><td>${escaparHtml(item.status)}</td><td>${escaparHtml(item.dataPagamento)}</td></tr>`)
      .join('')

    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><h2>Funcionários</h2><table border="1"><tr><th>Nome</th><th>CPF</th><th>Função</th><th>Status</th><th>PIX</th></tr>${linhasFuncionarios}</table><br><h2>Diárias</h2><table border="1"><tr><th>Funcionário</th><th>Data</th><th>Tipo</th><th>Base</th><th>Adicional</th><th>VT</th><th>VR</th><th>Total</th><th>Status</th></tr>${linhasDiarias}</table><br><h2>Pagamentos</h2><table border="1"><tr><th>Funcionário</th><th>Período</th><th>Diárias</th><th>Total</th><th>Status</th><th>Data pagamento</th></tr>${linhasPagamentos}</table></body></html>`

    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const hoje = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `relatorio-sindicato-${hoje}.xls`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    registrarAuditoria('Relatório Excel exportado', 'Relatórios', 'Relatório geral exportado em formato compatível com Excel.', 'Informação')
    mostrarNotificacao('Relatório Excel exportado com sucesso.', 'success')
  }

  async function salvarConfiguracoes() {
    if (!podeAdministrar) {
      mostrarNotificacao(
        'Somente o administrador pode alterar os valores das diárias.',
        'error'
      )
      return
    }

    const {
      diariaBase,
      percentualSabado,
      percentualDomingo,
      percentualFeriado,
      vt,
      vr,
      horarioEntradaPadrao,
      horarioSaidaPadrao,
    } = configuracaoTemporaria

    if (
      diariaBase <= 0 ||
      percentualSabado < 0 ||
      percentualDomingo < 0 ||
      percentualFeriado < 0 ||
      vt < 0 ||
      vr < 0 ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(horarioEntradaPadrao) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(horarioSaidaPadrao)
    ) {
      mostrarNotificacao(
        'Confira os valores informados. A diária deve ser maior que zero, os demais valores não podem ser negativos e os horários devem estar no formato HH:MM.',
        'error'
      )
      return
    }

    const authId = usuarioLogado?.authId ?? null

    const { data: configuracaoAtual, error: erroLeitura } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'daily_rules')
      .maybeSingle()

    if (erroLeitura) {
      console.error('Não foi possível ler a configuração atual:', erroLeitura)
      mostrarNotificacao(
        `Erro ao preparar as configurações: ${erroLeitura.message}`,
        'error'
      )
      return
    }

    const valorAtual =
      configuracaoAtual?.setting_value &&
      typeof configuracaoAtual.setting_value === 'object'
        ? (configuracaoAtual.setting_value as Record<string, unknown>)
        : {}

    const novoValor = {
      ...valorAtual,
      dailyBase: diariaBase,
      saturdayPercentage: percentualSabado,
      sundayPercentage: percentualDomingo,
      holidayPercentage: percentualFeriado,
      transport: vt,
      meal: vr,
      standardStart: horarioEntradaPadrao,
      standardEnd: horarioSaidaPadrao,
    }

    const { data, error } = await supabase
      .from('system_settings')
      .upsert(
        {
          setting_key: 'daily_rules',
          setting_value: novoValor,
          description: 'Regras gerais de diária e jornada.',
          updated_by: authId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'setting_key' }
      )
      .select('id, setting_key, setting_value, updated_at')
      .single()

    if (error || !data) {
      console.error('Não foi possível salvar as configurações no Supabase:', error)
      mostrarNotificacao(
        `Erro ao salvar configurações: ${error?.message ?? 'o banco não confirmou a gravação.'}`,
        'error'
      )
      return
    }

    const valorConfirmado = data.setting_value as Record<string, unknown>
    const configuracaoConfirmada: ConfiguracaoValores = {
      diariaBase: Number(valorConfirmado.dailyBase ?? diariaBase),
      percentualSabado: Number(
        valorConfirmado.saturdayPercentage ?? percentualSabado
      ),
      percentualDomingo: Number(
        valorConfirmado.sundayPercentage ?? percentualDomingo
      ),
      percentualFeriado: Number(
        valorConfirmado.holidayPercentage ?? percentualFeriado
      ),
      vt: Number(valorConfirmado.transport ?? vt),
      vr: Number(valorConfirmado.meal ?? vr),
      horarioEntradaPadrao: String(valorConfirmado.standardStart ?? horarioEntradaPadrao),
      horarioSaidaPadrao: String(valorConfirmado.standardEnd ?? horarioSaidaPadrao),
    }

    setConfiguracaoValores(configuracaoConfirmada)
    setConfiguracaoTemporaria(configuracaoConfirmada)

    registrarAuditoria(
      'Valores da diária atualizados',
      'Configurações',
      `Diária-base ${moeda(configuracaoConfirmada.diariaBase)}; sábado ${configuracaoConfirmada.percentualSabado}%; domingo ${configuracaoConfirmada.percentualDomingo}%; feriado ${configuracaoConfirmada.percentualFeriado}%; VT ${moeda(configuracaoConfirmada.vt)}; VR ${moeda(configuracaoConfirmada.vr)}; jornada ${configuracaoConfirmada.horarioEntradaPadrao}–${configuracaoConfirmada.horarioSaidaPadrao}.`,
      'Atenção'
    )

    mostrarNotificacao(
      'Configurações confirmadas e salvas no Supabase.',
      'success'
    )
  }

  useEffect(() => {
    let ativo = true

    async function carregarModelosFaciais() {
      try {
        setErroModelosFaciais('')
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ])
        if (ativo) setModelosFaciaisProntos(true)
      } catch (erro) {
        console.error('Erro ao carregar modelos faciais:', erro)
        if (ativo) {
          setModelosFaciaisProntos(false)
          setErroModelosFaciais(
            'Não foi possível carregar os modelos de reconhecimento facial.'
          )
        }
      }
    }

    carregarModelosFaciais()

    return () => {
      ativo = false
      streamCadastroFacialRef.current?.getTracks().forEach((track) => track.stop())
      streamTotemRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  useEffect(() => {
    const intervaloRelogio = window.setInterval(() => {
      setAgoraTotem(new Date())
    }, 1000)

    return () => window.clearInterval(intervaloRelogio)
  }, [])

  useEffect(() => {
    if (estadoTotem !== 'sucesso') return

    const retornoAutomatico = window.setTimeout(() => {
      novoRegistroTotem()
    }, 5000)

    return () => window.clearTimeout(retornoAutomatico)
  }, [estadoTotem])

  function desligarCameraTotem() {
    streamTotemRef.current?.getTracks().forEach((track) => track.stop())
    streamTotemRef.current = null
    setCameraTotemAtiva(false)

    if (videoTotemRef.current) {
      videoTotemRef.current.srcObject = null
    }
  }

  async function iniciarReconhecimentoFacialTotem() {
    if (!modelosFaciaisProntos) {
      setMensagemErroTotem(
        erroModelosFaciais || 'O reconhecimento facial ainda está sendo preparado. Tente novamente em alguns segundos.'
      )
      setEstadoTotem('erro')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMensagemErroTotem('Este dispositivo ou navegador não disponibilizou acesso à câmera.')
      setEstadoTotem('erro')
      return
    }

    setMensagemErroTotem('')
    setTipoRegistroTotem('')
    setFuncionarioReconhecido('')
    setHorarioTotem('')

    try {
      desligarCameraTotem()

      const videoAnterior = videoTotemRef.current
      if (videoAnterior) {
        try {
          videoAnterior.pause()
        } catch {
          // Sem ação: apenas garante que nenhum quadro anterior permaneça em reprodução.
        }
        videoAnterior.srcObject = null
        videoAnterior.removeAttribute('src')
        videoAnterior.load()
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      })

      const track = stream.getVideoTracks()[0]
      if (!track || track.readyState !== 'live') {
        stream.getTracks().forEach((item) => item.stop())
        throw new Error('A câmera não iniciou uma transmissão de vídeo válida.')
      }

      streamTotemRef.current = stream
      setCameraTotemAtiva(true)
      setEstadoTotem('reconhecendo')

      // Dá tempo para o React renderizar o <video> visível antes de anexar o stream.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })

      const video = videoTotemRef.current
      if (!video) {
        throw new Error('Câmera do terminal não foi inicializada.')
      }

      video.srcObject = stream

      await video.play()

      // Não aceita o último quadro congelado de uma captura anterior.
      const inicioEspera = Date.now()
      while (
        (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
          video.videoWidth < 160 ||
          video.videoHeight < 120) &&
        Date.now() - inicioEspera < 5000
      ) {
        await new Promise((resolve) => window.setTimeout(resolve, 100))
      }

      if (
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth < 160 ||
        video.videoHeight < 120
      ) {
        throw new Error('A câmera abriu, mas não entregou uma imagem válida.')
      }

      const tempoInicial = video.currentTime
      await new Promise((resolve) => window.setTimeout(resolve, 700))

      if (video.currentTime <= tempoInicial + 0.05) {
        throw new Error('A imagem da câmera não está atualizando.')
      }

      const avaliarQuadro = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 160
        canvas.height = 120
        const context = canvas.getContext('2d', { willReadFrequently: true })

        if (!context) {
          return { valido: true, media: 100, desvio: 100 }
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data

        let soma = 0
        let somaQuadrados = 0
        let quantidade = 0

        // Amostragem espaçada para validar rapidamente se existe uma imagem real.
        for (let i = 0; i < pixels.length; i += 4 * 16) {
          const luminancia =
            pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722
          soma += luminancia
          somaQuadrados += luminancia * luminancia
          quantidade += 1
        }

        const media = quantidade ? soma / quantidade : 0
        const variancia = quantidade
          ? Math.max(0, somaQuadrados / quantidade - media * media)
          : 0
        const desvio = Math.sqrt(variancia)

        return {
          valido: media >= 12 && desvio >= 4,
          media,
          desvio,
        }
      }

      const quadroInicial = avaliarQuadro()
      if (!quadroInicial.valido) {
        desligarCameraTotem()
        setMensagemErroTotem(
          'A câmera está sem imagem útil ou parece estar coberta. Descubra a lente, melhore a iluminação e tente novamente.'
        )
        setEstadoTotem('erro')
        return
      }

      const descritores: number[][] = []
      let ultimaDeteccaoEm = 0

      // Exige três detecções em quadros atuais diferentes antes de enviar ao servidor.
      for (let tentativa = 0; tentativa < 12; tentativa += 1) {
        const quadro = avaliarQuadro()
        if (!quadro.valido) {
          await new Promise((resolve) => window.setTimeout(resolve, 250))
          continue
        }

        const deteccao = await faceapi
          .detectSingleFace(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.65,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptor()

        if (deteccao) {
          const caixa = deteccao.detection.box
          const areaVideo = Math.max(1, video.videoWidth * video.videoHeight)
          const proporcaoRosto = (caixa.width * caixa.height) / areaVideo
          const centroX = caixa.x + caixa.width / 2
          const centroY = caixa.y + caixa.height / 2
          const centralizado =
            Math.abs(centroX - video.videoWidth / 2) <= video.videoWidth * 0.34 &&
            Math.abs(centroY - video.videoHeight / 2) <= video.videoHeight * 0.34

          if (proporcaoRosto >= 0.06 && centralizado) {
            const agoraCaptura = performance.now()
            if (agoraCaptura - ultimaDeteccaoEm >= 220) {
              descritores.push(Array.from(deteccao.descriptor))
              ultimaDeteccaoEm = agoraCaptura
            }
          }
        }

        if (descritores.length >= 3) break
        await new Promise((resolve) => window.setTimeout(resolve, 280))
      }

      if (descritores.length < 3) {
        desligarCameraTotem()
        setMensagemErroTotem(
          'Não foi possível confirmar um rosto real em quadros atuais da câmera. Mantenha o rosto visível, centralizado e bem iluminado e tente novamente.'
        )
        setEstadoTotem('erro')
        return
      }

      // Usa a média das três leituras para reduzir ruído de um único quadro.
      const descriptor = Array.from({ length: 128 }, (_, indice) => {
        const soma = descritores.reduce((total, atual) => total + atual[indice], 0)
        return soma / descritores.length
      })

      const { data, error } = await supabase.functions.invoke('facial-attendance', {
        body: { descriptor },
      })

      desligarCameraTotem()

      if (error) {
        console.error('Erro ao chamar facial-attendance:', error)
        setMensagemErroTotem(
          'Não foi possível concluir a identificação no servidor. Tente novamente.'
        )
        setEstadoTotem('erro')
        return
      }

      if (!data?.success || !data?.recognized) {
        setMensagemErroTotem(
          data?.error || data?.message || 'Rosto não reconhecido. Confira o cadastro facial e tente novamente.'
        )
        setEstadoTotem('erro')
        return
      }

      const ocorrido = data?.attendance?.occurred_at
        ? new Date(data.attendance.occurred_at)
        : new Date()
      const tipo = data?.attendance?.type === 'Saída' ? 'Saída' : 'Entrada'

      setFuncionarioReconhecido(data?.employee?.name || 'Funcionário')
      setTipoRegistroTotem(tipo)
      setHorarioTotem(
        ocorrido.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo',
        })
      )
      setAgoraTotem(ocorrido)
      setMensagemErroTotem(data?.message || `${tipo} registrada com sucesso.`)
      setEstadoTotem('sucesso')

      if (usuarioLogado) {
        await carregarPontosSupabase()
      }
    } catch (erro) {
      console.error('Erro no reconhecimento facial do terminal:', erro)
      desligarCameraTotem()

      const mensagem =
        erro instanceof DOMException && erro.name === 'NotAllowedError'
          ? 'A permissão da câmera foi negada. Permita o acesso à câmera e tente novamente.'
          : erro instanceof Error && erro.message
          ? erro.message
          : 'Não foi possível iniciar ou processar a câmera. Tente novamente.'

      setMensagemErroTotem(mensagem)
      setEstadoTotem('erro')
    }
  }

  function novoRegistroTotem() {
    desligarCameraTotem()
    setEstadoTotem('aguardando')
    setFuncionarioReconhecido('')
    setHorarioTotem('')
    setTipoRegistroTotem('')
    setMensagemErroTotem('')
  }

  const totalRegistrados = registrosPonto.filter(
    (registro) => registro.status === 'Registrado'
  ).length

  const totalPendentes = registrosPonto.filter(
    (registro) => registro.status === 'Pendente'
  ).length

  const totalDiariasAprovadas = diarias.filter(
    (diaria) => diaria.status === 'Aprovada'
  ).length

  const totalDiariasPendentes = diarias.filter(
    (diaria) => diaria.status === 'Pendente'
  ).length

  const valorTotalDiarias = diarias
    .filter((diaria) => diaria.status === 'Aprovada')
    .reduce((total, diaria) => total + diaria.valor, 0)

  const fechamentosAbertos = fechamentos.filter(
    (fechamento) => fechamento.status !== 'Pago'
  ).length

  const fechamentosPagos = fechamentos.filter(
    (fechamento) => fechamento.status === 'Pago'
  ).length

  const totalPrevistoFechamentos = fechamentos
    .filter((fechamento) => fechamento.status !== 'Pago')
    .reduce(
      (total, fechamento) => total + valorDoFechamento(fechamento.periodo),
      0
    )

  const pagamentosPendentes = pagamentos.filter(
    (pagamento) => pagamento.status === 'Aguardando'
  ).length

  const pagamentosPagos = pagamentos.filter(
    (pagamento) => pagamento.status === 'Pago'
  ).length

  const valorPendentePagamentos = pagamentos
    .filter((pagamento) => pagamento.status === 'Aguardando')
    .reduce((total, pagamento) => total + pagamento.valorTotal, 0)

  const documentosAtivos = documentos.filter(
    (documento) => documento.status === 'Ativo'
  ).length

  const documentosArquivados = documentos.filter(
    (documento) => documento.status === 'Arquivado'
  ).length

  const funcionariosAtivos = funcionarios.filter(
    (funcionario) => funcionario.status === 'Ativo'
  ).length

  const valorTotalPago = pagamentos
    .filter((pagamento) => pagamento.status === 'Pago')
    .reduce((total, pagamento) => total + pagamento.valorTotal, 0)

  const valorDiariasPendentes = diarias
    .filter((diaria) => diaria.status === 'Pendente')
    .reduce((total, diaria) => total + diaria.valor, 0)

  const periodoAtualDashboard = periodoFechamentoPorData(new Date())

  const fechamentoAtual: Fechamento =
    fechamentos.find(
      (fechamento) => fechamento.periodo === periodoAtualDashboard.periodo
    ) ?? {
      periodo: periodoAtualDashboard.periodo,
      pagamento: periodoAtualDashboard.pagamento,
      status: 'Em conferência',
    }

  const diariasQuinzenaAtual = diarias.filter((diaria) => {
    const dataDiaria = converterDataBR(diaria.data)

    return (
      dataDiaria !== null &&
      periodoFechamentoPorData(dataDiaria).periodo === fechamentoAtual.periodo &&
      diaria.status !== 'Cancelada'
    )
  })

  const diariasAprovadasQuinzenaAtual = diariasQuinzenaAtual.filter(
    (diaria) => diaria.status === 'Aprovada'
  ).length

  const andamentoFechamento =
    diariasQuinzenaAtual.length > 0
      ? Math.round(
          (diariasAprovadasQuinzenaAtual / diariasQuinzenaAtual.length) * 100
        )
      : 0

  const valorPrevistoQuinzenaAtual = diariasQuinzenaAtual.reduce(
    (total, diaria) => total + diaria.valor,
    0
  )

  const funcionarioPixSelecionado = pagamentoPixSelecionado
    ? obterFuncionarioPorNome(pagamentoPixSelecionado.nome)
    : undefined

  const [pixCopiaCola, setPixCopiaCola] = useState('')
  const [qrPixDataUrl, setQrPixDataUrl] = useState('')
  const [erroQrPix, setErroQrPix] = useState('')

  useEffect(() => {
    let cancelado = false

    async function gerarQrPixSelecionado() {
      setPixCopiaCola('')
      setQrPixDataUrl('')
      setErroQrPix('')

      if (!pagamentoPixSelecionado) return

      const titular =
        pagamentoPixSelecionado.pixTitular ||
        funcionarioPixSelecionado?.titularPix ||
        pagamentoPixSelecionado.nome
      const cidade =
        pagamentoPixSelecionado.pixCidade ||
        funcionarioPixSelecionado?.cidadePix ||
        ''
      const tipoChave = funcionarioPixSelecionado?.tipoPix || ''

      try {
        const payload = gerarPayloadPixEstatico({
          chave: pagamentoPixSelecionado.pix,
          tipoChave,
          titular,
          cidade,
          valor: pagamentoPixSelecionado.valorTotal,
        })

        const dataUrl = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'M',
          margin: 2,
          width: 320,
        })

        if (cancelado) return
        setPixCopiaCola(payload)
        setQrPixDataUrl(dataUrl)
      } catch (error) {
        if (cancelado) return
        const mensagem =
          error instanceof Error ? error.message : 'Não foi possível gerar o QR PIX.'
        setErroQrPix(mensagem)
      }
    }

    void gerarQrPixSelecionado()

    return () => {
      cancelado = true
    }
  }, [pagamentoPixSelecionado, funcionarioPixSelecionado])

  const caixaNotificacao = notificacao ? (
    <div className={`notification-toast ${notificacao.tipo}`}>
      <div className="notification-icon">
        {iconeNotificacao(notificacao.tipo)}
      </div>

      <div className="notification-content">
        <strong>
          {notificacao.tipo === 'success' && 'Sucesso'}
          {notificacao.tipo === 'warning' && 'Atenção'}
          {notificacao.tipo === 'error' && 'Erro'}
          {notificacao.tipo === 'info' && 'Informação'}
        </strong>

        <span>{notificacao.mensagem}</span>
      </div>

      <button className="notification-close" onClick={fecharNotificacao}>
        ×
      </button>
    </div>
  ) : null

  async function registrarAuditoria(
    acao: string,
    modulo: string,
    detalhe: string,
    nivel: RegistroAuditoria['nivel'] = 'Informação',
    usuarioForcado?: UsuarioSistema | null,
    entidade?: string | null,
    entityId?: string | null
  ) {
    const usuarioEvento = usuarioForcado ?? usuarioLogado

    const { error } = await supabase.rpc('write_audit', {
      p_action: acao,
      p_module: modulo,
      p_details: detalhe,
      p_severity: nivel,
      p_entity_type: entidade ?? null,
      p_entity_id: entityId ?? null,
    })

    if (error) {
      console.error('Não foi possível registrar a auditoria no Supabase:', error)
      return
    }

    if (usuarioEvento?.perfil === 'Administrador') {
      await carregarAuditoriaSupabase()
    }
  }

  const telasPorPerfil: Record<PerfilAcesso, Tela[]> = {
    Administrador: [
      'operacao',
      'historicoOperacional',
      'dashboard',
      'funcionarios',
      'ponto',
      'listaDiaristas',
      'diarias',
      'fechamentos',
      'pagamentos',
      'documentos',
      'relatorios',
      'configuracoes',
      'calendario',
      'usuarios',
      'auditoria',
    ],
    Supervisor: [
      'operacao',
      'historicoOperacional',
      'dashboard',
      'funcionarios',
      'ponto',
      'listaDiaristas',
      'diarias',
      'relatorios',
      'calendario',
    ],
    Consulta: [
      'historicoOperacional',
      'dashboard',
      'funcionarios',
      'ponto',
      'relatorios',
    ],
  }

  const podeEditar = usuarioLogado?.perfil !== 'Consulta'
  const podeAdministrar =
    usuarioLogado?.perfil === 'Administrador'
  const podeAcessarFinanceiro =
    usuarioLogado?.perfil === 'Administrador'

  function temAcesso(telaDestino: Tela) {
    if (!usuarioLogado) return false
    return telasPorPerfil[usuarioLogado.perfil].includes(telaDestino)
  }

  function navegarComPermissao(telaDestino: Tela) {
    if (!temAcesso(telaDestino)) {
      mostrarNotificacao(
        'Seu perfil não possui permissão para acessar esta área.',
        'warning'
      )
      return
    }

    setTela(telaDestino)
  }


  function senhaForte(senha: string) {
    return (
      senha.length >= 8 &&
      /[A-Z]/.test(senha) &&
      /[a-z]/.test(senha) &&
      /\d/.test(senha) &&
      /[^A-Za-z0-9]/.test(senha)
    )
  }

  function mensagemRegraSenha() {
    return 'Use pelo menos 8 caracteres, com letra maiúscula, minúscula, número e símbolo.'
  }

  function emailValido(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  }

  function celularValido(celular: string) {
    return celular.replace(/\D/g, '').length >= 10
  }

  function fecharRecuperacaoSenha() {
    setRecuperacaoAberta(false)
    setRecuperacaoEtapa('identificacao')
    setRecuperacaoIdentificador('')
    setRecuperacaoCanal('email')
    setRecuperacaoUsuarioId(null)
    setRecuperacaoCodigoGerado('')
    setRecuperacaoCodigoDigitado('')
    setRecuperacaoCodigoExpiraEm(null)
    setRecuperacaoTentativasCodigo(0)
    setRecuperacaoNovaSenha('')
    setRecuperacaoConfirmarSenha('')
  }

  async function iniciarRecuperacaoSenha(e: React.FormEvent) {
    e.preventDefault()

    const email = recuperacaoIdentificador.trim().toLowerCase()

    if (!emailValido(email)) {
      mostrarNotificacao('Informe o e-mail usado para acessar o sistema.', 'warning')
      return
    }

    const redirectTo = `${window.location.origin}${window.location.pathname}`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      console.error('Erro ao solicitar recuperação de senha:', error)
      mostrarNotificacao(
        'Não foi possível enviar o e-mail de recuperação agora. Tente novamente.',
        'error'
      )
      return
    }

    mostrarNotificacao(
      'Se esse e-mail estiver cadastrado, você receberá um link para redefinir a senha.',
      'success'
    )
    setRecuperacaoAberta(false)
    setRecuperacaoIdentificador('')
  }

  async function concluirRecuperacaoSenha(e: React.FormEvent) {
    e.preventDefault()

    if (!senhaForte(recuperacaoNovaSenha)) {
      mostrarNotificacao(mensagemRegraSenha(), 'warning')
      return
    }

    if (recuperacaoNovaSenha !== recuperacaoConfirmarSenha) {
      mostrarNotificacao('As novas senhas não coincidem.', 'warning')
      return
    }

    const { error } = await supabase.auth.updateUser({
      password: recuperacaoNovaSenha,
    })

    if (error) {
      console.error('Erro ao concluir recuperação de senha:', error)
      mostrarNotificacao(
        error.message || 'Não foi possível redefinir a senha.',
        'error'
      )
      return
    }

    await registrarAuditoria(
      'Senha recuperada',
      'Acesso',
      'Senha redefinida pelo fluxo real de recuperação do Supabase Auth.',
      'Crítico'
    )

    setRecuperacaoNovaSenha('')
    setRecuperacaoConfirmarSenha('')
    setRecuperacaoEtapa('identificacao')
    setRecuperacaoAberta(false)

    mostrarNotificacao(
      'Senha redefinida com sucesso. Você já pode usar a nova senha.',
      'success'
    )
  }

  async function alterarMinhaSenha(e: React.FormEvent) {
    e.preventDefault()

    if (!usuarioLogado) return

    if (!minhaSenhaAtual.trim()) {
      mostrarNotificacao('Informe sua senha atual.', 'warning')
      return
    }

    if (!senhaForte(minhaNovaSenha)) {
      mostrarNotificacao(mensagemRegraSenha(), 'warning')
      return
    }

    if (minhaNovaSenha !== minhaConfirmarSenha) {
      mostrarNotificacao(
        'A confirmação da nova senha não confere.',
        'warning'
      )
      return
    }

    if (minhaNovaSenha === minhaSenhaAtual) {
      mostrarNotificacao(
        'A nova senha deve ser diferente da senha atual.',
        'warning'
      )
      return
    }

    const { data: authData, error: authError } =
      await supabase.auth.getUser()

    if (authError || !authData.user?.email) {
      console.error(
        'Não foi possível identificar o usuário autenticado:',
        authError
      )
      mostrarNotificacao(
        'Sua sessão não pôde ser validada. Entre novamente e tente outra vez.',
        'warning'
      )
      return
    }

    const usuarioAuth = authData.user
    const emailUsuario = usuarioAuth.email

    if (!emailUsuario) {
      mostrarNotificacao(
        'Sua conta autenticada não possui e-mail de acesso.',
        'error'
      )
      return
    }

    const {
      data: reauthData,
      error: reauthError,
    } = await supabase.auth.signInWithPassword({
      email: emailUsuario,
      password: minhaSenhaAtual,
    })

    if (
      reauthError ||
      !reauthData.user ||
      reauthData.user.id !== usuarioAuth.id
    ) {
      console.error(
        'Falha ao confirmar a senha atual:',
        reauthError
      )
      mostrarNotificacao(
        'A senha atual está incorreta.',
        'warning'
      )
      return
    }

    const { error: updateError } =
      await supabase.auth.updateUser({
        password: minhaNovaSenha,
      })

    if (updateError) {
      console.error(
        'Erro ao alterar senha no Supabase Auth:',
        updateError
      )
      mostrarNotificacao(
        updateError.message ||
          'Não foi possível alterar sua senha.',
        'error'
      )
      return
    }

    await registrarAuditoria(
      'Senha alterada',
      'Acesso',
      'O usuário conectado alterou a própria senha no Supabase Auth.',
      'Crítico',
      usuarioLogado
    )

    setMinhaSenhaAtual('')
    setMinhaNovaSenha('')
    setMinhaConfirmarSenha('')
    setMostrarAlterarMinhaSenha(false)

    mostrarNotificacao(
      'Sua senha foi alterada com sucesso no Supabase.',
      'success'
    )
  }

  function idNumericoDoSupabase(id: string) {
    let hash = 0
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) | 0
    }
    return Math.abs(hash) || 1
  }

  async function carregarUsuariosSupabase() {
    if (usuarioLogado?.perfil !== 'Administrador') return

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, status, last_access_at, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Não foi possível carregar os usuários reais:', error)
      mostrarNotificacao('Não foi possível carregar os usuários e acessos.', 'error')
      return
    }

    const usuariosReais: UsuarioSistema[] = (data ?? []).map((perfil) => ({
      id: idNumericoDoSupabase(perfil.id),
      authId: perfil.id,
      nome: perfil.full_name || perfil.email || 'Usuário',
      usuario: perfil.email || '',
      senha: '',
      email: perfil.email || '',
      celular: formatarTelefone(perfil.phone || ''),
      perfil: perfil.role as PerfilAcesso,
      status: perfil.status as UsuarioSistema['status'],
      ultimoAcesso: perfil.last_access_at
        ? new Date(perfil.last_access_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : 'Nunca acessou',
      criadoEm: perfil.created_at
        ? new Date(perfil.created_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        : undefined,
    }))

    setUsuariosSistema(usuariosReais)
  }

  async function carregarPerfilAutenticado(authUser: { id: string; email?: string | null }) {
    const { data: perfil, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, status, last_access_at')
      .eq('id', authUser.id)
      .single()

    if (error || !perfil) {
      console.error('Não foi possível carregar o perfil do usuário:', error)
      setErroLogin('Sua conta existe, mas o perfil de acesso não pôde ser carregado.')
      await supabase.auth.signOut()
      return null
    }

    if (perfil.status !== 'Ativo') {
      setErroLogin('Este usuário está inativo. Procure um administrador.')
      await supabase.auth.signOut()
      return null
    }

    const perfilAcesso = perfil.role as PerfilAcesso

    if (!['Administrador', 'Supervisor', 'Consulta'].includes(perfilAcesso)) {
      setErroLogin('Perfil de acesso inválido. Procure um administrador.')
      await supabase.auth.signOut()
      return null
    }

    const usuarioReal: UsuarioSistema = {
      id: idNumericoDoSupabase(authUser.id),
      authId: authUser.id,
      nome: perfil.full_name || authUser.email || 'Usuário',
      usuario: authUser.email || perfil.email || '',
      senha: '',
      email: perfil.email || authUser.email || '',
      celular: formatarTelefone(perfil.phone || ''),
      perfil: perfilAcesso,
      status: 'Ativo',
      ultimoAcesso: 'Agora',
    }

    const { data: acessoRegistrado, error: erroUltimoAcesso } = await supabase
      .rpc('registrar_ultimo_acesso')

    if (erroUltimoAcesso) {
      console.error('Não foi possível registrar o último acesso:', erroUltimoAcesso)
    }

    const acessoEfetivo =
      typeof acessoRegistrado === 'string' && acessoRegistrado
        ? acessoRegistrado
        : perfil.last_access_at

    usuarioReal.ultimoAcesso = acessoEfetivo
      ? new Date(acessoEfetivo).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      : 'Nunca acessou'

    setUsuarioLogado(usuarioReal)
    setErroLogin('')
    setModoAcesso('admin')
    setTela(perfilAcesso === 'Consulta' ? 'dashboard' : 'operacao')

    return usuarioReal
  }

  async function entrarAreaAdministrativa(e: React.FormEvent) {
    e.preventDefault()

    const email = usuarioLogin.trim().toLowerCase()

    if (!email || !senhaLogin) {
      setErroLogin('Informe seu e-mail e sua senha.')
      return
    }

    setErroLogin('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senhaLogin,
    })

    if (error || !data.user) {
      console.error('ERRO REAL DO SUPABASE:', error)
      setErroLogin(
        error?.message || 'Não foi possível realizar o login.'
      )
      setSenhaLogin('')
      return
    }

    const usuarioReal = await carregarPerfilAutenticado(data.user)

    if (!usuarioReal) return

    setSenhaLogin('')

    registrarAuditoria(
      'Login realizado',
      'Acesso',
      `Acesso real autorizado pelo Supabase para o perfil ${usuarioReal.perfil}.`,
      'Informação',
      usuarioReal
    )

    mostrarNotificacao(
      `Bem-vindo, ${usuarioReal.nome}. Perfil: ${usuarioReal.perfil}.`,
      'success'
    )
  }

  async function sairAreaAdministrativa() {
    const usuarioSaindo = usuarioLogado

    if (usuarioSaindo) {
      await registrarAuditoria(
        'Logout realizado',
        'Acesso',
        'Sessão administrativa encerrada pelo usuário.',
        'Informação',
        usuarioSaindo,
        'profile',
        usuarioSaindo.authId ?? null
      )
    }

    await supabase.auth.signOut()

    setUsuarioLogin('')
    setSenhaLogin('')
    setErroLogin('')
    setUsuarioLogado(null)
    setTela('dashboard')
    setModoAcesso('inicio')
  }

  async function salvarNovoUsuario(e: React.FormEvent) {
    e.preventDefault()

    if (usuarioLogado?.perfil !== 'Administrador') {
      mostrarNotificacao(
        'Somente Administradores ativos podem criar usuários.',
        'warning'
      )
      return
    }

    if (
      !novoUsuarioNome.trim() ||
      !novoUsuarioEmail.trim() ||
      !novoUsuarioCelular.trim() ||
      !novoUsuarioSenha.trim() ||
      !novoUsuarioConfirmarSenha.trim()
    ) {
      mostrarNotificacao(
        'Preencha nome, e-mail, celular, senha e confirmação da senha.',
        'warning'
      )
      return
    }

    if (!emailValido(novoUsuarioEmail)) {
      mostrarNotificacao('Informe um e-mail válido.', 'warning')
      return
    }

    if (!celularValido(novoUsuarioCelular)) {
      mostrarNotificacao('Informe um celular válido com DDD.', 'warning')
      return
    }

    if (!senhaForte(novoUsuarioSenha)) {
      mostrarNotificacao(mensagemRegraSenha(), 'warning')
      return
    }

    if (novoUsuarioSenha !== novoUsuarioConfirmarSenha) {
      mostrarNotificacao('As senhas informadas não coincidem.', 'warning')
      return
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      console.error('Erro ao recuperar sessão antes da Edge Function:', sessionError)
      mostrarNotificacao(
        'Sua sessão não pôde ser validada. Saia do sistema, entre novamente e tente outra vez.',
        'warning'
      )
      return
    }

    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {
        full_name: novoUsuarioNome.trim(),
        email: novoUsuarioEmail.trim().toLowerCase(),
        phone: somenteDigitos(novoUsuarioCelular) || null,
        password: novoUsuarioSenha,
        role: novoUsuarioPerfil,
      },
    })

    if (error) {
      console.error('Erro ao chamar admin-create-user:', error)

      let mensagem = error.message || 'Não foi possível criar o usuário.'

      try {
        const contexto = (error as { context?: Response }).context
        if (contexto) {
          const resposta = await contexto.clone().json()
          if (resposta?.error) mensagem = String(resposta.error)
        }
      } catch {
        // Mantém a mensagem original caso o corpo da resposta não seja JSON.
      }

      mostrarNotificacao(mensagem, 'error')
      return
    }

    if (!data?.success) {
      mostrarNotificacao(
        data?.error || 'O servidor não confirmou a criação do usuário.',
        'error'
      )
      return
    }

    // A Edge Function cria o usuário como Ativo. Se o administrador escolheu
    // Inativo, aplicamos o status imediatamente usando a policy admin da profiles.
    if (novoUsuarioStatus === 'Inativo' && data.user?.id) {
      const { error: statusError } = await supabase
        .from('profiles')
        .update({
          status: 'Inativo',
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.user.id)

      if (statusError) {
        console.error('Usuário criado, mas o status inicial falhou:', statusError)
        mostrarNotificacao(
          'Usuário criado, mas não foi possível aplicar o status Inativo.',
          'warning'
        )
      }
    }

    setNovoUsuarioNome('')
    setNovoUsuarioLogin('')
    setNovoUsuarioEmail('')
    setNovoUsuarioCelular('')
    setNovoUsuarioSenha('')
    setNovoUsuarioConfirmarSenha('')
    setNovoUsuarioPerfil('Supervisor')
    setNovoUsuarioStatus('Ativo')
    setMostrarNovoUsuario(false)

    await carregarUsuariosSupabase()

    mostrarNotificacao(
      'Usuário criado no Supabase Auth e perfil confirmado no banco.',
      'success'
    )
  }

  function iniciarEdicaoUsuario(usuario: UsuarioSistema) {
    if (usuarioLogado?.perfil !== 'Administrador') {
      mostrarNotificacao(
        'Somente o Administrador Geral pode editar usuários.',
        'warning'
      )
      return
    }

    setMostrarNovoUsuario(false)
    setUsuarioEditandoId(usuario.id)
    setUsuarioEditandoNome(usuario.nome)
    setUsuarioEditandoLogin(usuario.usuario)
    setUsuarioEditandoEmail(usuario.email || '')
    setUsuarioEditandoCelular(formatarTelefone(usuario.celular || ''))
    setUsuarioEditandoPerfil(usuario.perfil)
    setUsuarioEditandoStatus(usuario.status)
    setUsuarioEditandoNovaSenha('')
    setUsuarioEditandoConfirmarSenha('')
  }

  function cancelarEdicaoUsuario() {
    setUsuarioEditandoId(null)
    setUsuarioEditandoNome('')
    setUsuarioEditandoLogin('')
    setUsuarioEditandoEmail('')
    setUsuarioEditandoCelular('')
    setUsuarioEditandoPerfil('Supervisor')
    setUsuarioEditandoStatus('Ativo')
    setUsuarioEditandoNovaSenha('')
    setUsuarioEditandoConfirmarSenha('')
  }

  async function salvarEdicaoUsuario(e: React.FormEvent) {
    e.preventDefault()

    if (usuarioLogado?.perfil !== 'Administrador') {
      mostrarNotificacao(
        'Somente o Administrador Geral pode editar usuários.',
        'warning'
      )
      return
    }

    if (usuarioEditandoId === null) return

    const usuarioOriginal = usuariosSistema.find(
      (item) => item.id === usuarioEditandoId
    )

    if (!usuarioOriginal?.authId) {
      mostrarNotificacao('Usuário real do Supabase não encontrado.', 'error')
      cancelarEdicaoUsuario()
      return
    }

    if (
      !usuarioEditandoNome.trim() ||
      !usuarioEditandoEmail.trim() ||
      !usuarioEditandoCelular.trim()
    ) {
      mostrarNotificacao('Preencha nome, e-mail e celular.', 'warning')
      return
    }

    if (!emailValido(usuarioEditandoEmail)) {
      mostrarNotificacao('Informe um e-mail válido.', 'warning')
      return
    }

    if (!celularValido(usuarioEditandoCelular)) {
      mostrarNotificacao('Informe um celular válido com DDD.', 'warning')
      return
    }

    const emailExiste = usuariosSistema.some(
      (item) =>
        item.id !== usuarioEditandoId &&
        (item.email || '').toLowerCase() ===
          usuarioEditandoEmail.trim().toLowerCase()
    )

    if (emailExiste) {
      mostrarNotificacao(
        'Esse e-mail já está vinculado a outro usuário.',
        'warning'
      )
      return
    }

    if (usuarioEditandoNovaSenha || usuarioEditandoConfirmarSenha) {
      if (!senhaForte(usuarioEditandoNovaSenha)) {
        mostrarNotificacao(mensagemRegraSenha(), 'warning')
        return
      }

      if (usuarioEditandoNovaSenha !== usuarioEditandoConfirmarSenha) {
        mostrarNotificacao(
          'A confirmação da nova senha não confere.',
          'warning'
        )
        return
      }
    }

    const editandoProprioUsuario =
      usuarioLogado.authId === usuarioOriginal.authId

    if (editandoProprioUsuario) {
      if (usuarioEditandoStatus !== 'Ativo') {
        mostrarNotificacao(
          'Você não pode desativar a própria conta enquanto está conectado.',
          'warning'
        )
        return
      }

      if (usuarioEditandoPerfil !== 'Administrador') {
        mostrarNotificacao(
          'O Administrador conectado não pode remover o próprio acesso administrativo.',
          'warning'
        )
        return
      }
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      console.error(
        'Erro ao recuperar sessão antes de editar usuário:',
        sessionError
      )
      mostrarNotificacao(
        'Sua sessão não pôde ser validada. Entre novamente e tente outra vez.',
        'warning'
      )
      return
    }

    const { data, error } = await supabase.functions.invoke(
      'admin-update-user',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          user_id: usuarioOriginal.authId,
          full_name: usuarioEditandoNome.trim(),
          email: usuarioEditandoEmail.trim().toLowerCase(),
          phone: somenteDigitos(usuarioEditandoCelular) || null,
          role: usuarioEditandoPerfil,
          status: usuarioEditandoStatus,
          password: usuarioEditandoNovaSenha || undefined,
        },
      }
    )

    if (error) {
      console.error('Erro ao chamar admin-update-user:', error)

      let mensagem = error.message || 'Não foi possível atualizar o usuário.'

      try {
        const contexto = (error as { context?: Response }).context
        if (contexto) {
          const resposta = await contexto.clone().json()
          if (resposta?.error) mensagem = String(resposta.error)
        }
      } catch {
        // Mantém a mensagem original caso o corpo não seja JSON.
      }

      mostrarNotificacao(mensagem, 'error')
      return
    }

    if (!data?.success) {
      mostrarNotificacao(
        data?.error || 'O servidor não confirmou a atualização do usuário.',
        'error'
      )
      return
    }

    cancelarEdicaoUsuario()
    await carregarUsuariosSupabase()

    if (editandoProprioUsuario) {
      setUsuarioLogado((atual) =>
        atual
          ? {
              ...atual,
              nome: usuarioEditandoNome.trim(),
              usuario: usuarioEditandoEmail.trim().toLowerCase(),
              email: usuarioEditandoEmail.trim().toLowerCase(),
              celular: formatarTelefone(usuarioEditandoCelular),
              perfil: usuarioEditandoPerfil,
              status: usuarioEditandoStatus,
            }
          : atual
      )
    }

    mostrarNotificacao(
      usuarioEditandoNovaSenha
        ? 'Usuário e senha atualizados no Supabase.'
        : 'Usuário atualizado no Supabase.',
      'success'
    )
  }

  async function alternarStatusUsuario(id: number) {
    if (usuarioLogado?.perfil !== 'Administrador') {
      mostrarNotificacao(
        'Somente o Administrador Geral pode ativar ou inativar usuários.',
        'warning'
      )
      return
    }

    const usuarioAlterado = usuariosSistema.find((item) => item.id === id)

    if (!usuarioAlterado?.authId) {
      mostrarNotificacao('Usuário real do Supabase não encontrado.', 'error')
      return
    }

    if (usuarioLogado.authId === usuarioAlterado.authId) {
      mostrarNotificacao(
        'Você não pode desativar o próprio usuário enquanto está conectado.',
        'warning'
      )
      return
    }

    const novoStatus =
      usuarioAlterado.status === 'Ativo' ? 'Inativo' : 'Ativo'

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      mostrarNotificacao(
        'Sua sessão não pôde ser validada. Entre novamente e tente outra vez.',
        'warning'
      )
      return
    }

    const { data, error } = await supabase.functions.invoke(
      'admin-update-user',
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: {
          user_id: usuarioAlterado.authId,
          status: novoStatus,
        },
      }
    )

    if (error) {
      console.error('Erro ao alterar status do usuário:', error)

      let mensagem = error.message || 'Não foi possível alterar o status.'

      try {
        const contexto = (error as { context?: Response }).context
        if (contexto) {
          const resposta = await contexto.clone().json()
          if (resposta?.error) mensagem = String(resposta.error)
        }
      } catch {
        // Mantém a mensagem original caso o corpo não seja JSON.
      }

      mostrarNotificacao(mensagem, 'error')
      return
    }

    if (!data?.success) {
      mostrarNotificacao(
        data?.error || 'O servidor não confirmou a alteração de status.',
        'error'
      )
      return
    }

    await carregarUsuariosSupabase()
    mostrarNotificacao(
      `Usuário ${novoStatus === 'Ativo' ? 'reativado' : 'inativado'} no Supabase.`,
      'success'
    )
  }

  if (modoAcesso === 'inicio') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, rgba(104,48,132,.12), transparent 38%), linear-gradient(135deg, #f7f4f8 0%, #ffffff 52%, #f2f7f4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px',
          boxSizing: 'border-box',
          fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
        }}
      >
        {caixaNotificacao}

        <div
          style={{
            width: '100%',
            maxWidth: '1040px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '15px',
              marginBottom: '28px',
            }}
          >
            <img
              src="/logo-sindicato.png"
              alt="Logo do Sindicato dos Trabalhadores na Movimentação de Mercadorias de Limeira"
              style={{
                width: '78px',
                height: '78px',
                objectFit: 'contain',
                background: '#ffffff',
                borderRadius: '20px',
                padding: '5px',
                boxSizing: 'border-box',
                boxShadow: '0 10px 30px rgba(55, 31, 67, .10)',
              }}
            />

            <div>
              <span
                style={{
                  display: 'block',
                  color: '#775f80',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '1.1px',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Sindicato • Operação DHL Mogi Mirim
              </span>

              <strong
                style={{
                  display: 'block',
                  color: '#302437',
                  fontSize: '25px',
                  lineHeight: 1.05,
                }}
              >
                Gestão de Diaristas
              </strong>
            </div>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #ece5ee',
              borderRadius: '26px',
              boxShadow: '0 24px 70px rgba(55,31,67,.10)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '38px 28px 22px',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '7px 11px',
                  borderRadius: '999px',
                  background: '#f3ecf6',
                  color: '#69347f',
                  fontSize: '10px',
                  fontWeight: 800,
                  marginBottom: '14px',
                }}
              >
                TURNO • 09:30 ÀS 18:30
              </span>

              <h1
                style={{
                  margin: '0 0 9px',
                  color: '#302437',
                  fontSize: '31px',
                  lineHeight: 1.1,
                }}
              >
                Como deseja acessar?
              </h1>

              <p
                style={{
                  margin: 0,
                  color: '#8b818e',
                  fontSize: '13px',
                  lineHeight: 1.6,
                }}
              >
                A administração e o registro facial funcionam em ambientes
                separados.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
                padding: '18px 28px 32px',
              }}
            >
              <button
                onClick={() => {
                  setErroLogin('')
                  setModoAcesso('login')
                }}
                style={{
                  border: '1px solid #e4d7e9',
                  borderRadius: '20px',
                  background:
                    'linear-gradient(145deg, #4c1f64 0%, #6d3488 100%)',
                  color: '#ffffff',
                  textAlign: 'left',
                  padding: '24px',
                  cursor: 'pointer',
                  minHeight: '190px',
                  boxShadow: '0 14px 34px rgba(86,38,108,.18)',
                }}
              >
                <span
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '21px',
                    marginBottom: '22px',
                  }}
                >
                  🔐
                </span>

                <strong
                  style={{
                    display: 'block',
                    fontSize: '20px',
                    marginBottom: '8px',
                  }}
                >
                  Área Administrativa
                </strong>

                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    lineHeight: 1.55,
                    opacity: 0.78,
                  }}
                >
                  Funcionários, listas, diárias, fechamentos, PIX, documentos e
                  relatórios.
                </span>
              </button>

              <button
                onClick={() => {
                  novoRegistroTotem()
                  setModoAcesso('totem')
                }}
                style={{
                  border: '1px solid #dbece3',
                  borderRadius: '20px',
                  background:
                    'linear-gradient(145deg, #f6fcf8 0%, #ebf8f0 100%)',
                  color: '#1f5136',
                  textAlign: 'left',
                  padding: '24px',
                  cursor: 'pointer',
                  minHeight: '190px',
                }}
              >
                <span
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: '#dff3e7',
                    color: '#177647',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '21px',
                    marginBottom: '22px',
                  }}
                >
                  ◉
                </span>

                <strong
                  style={{
                    display: 'block',
                    fontSize: '20px',
                    marginBottom: '8px',
                  }}
                >
                  Registro Facial
                </strong>

                <span
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    lineHeight: 1.55,
                    color: '#5e7d6b',
                  }}
                >
                  Terminal exclusivo para o diarista registrar sua presença,
                  sem acesso aos dados administrativos.
                </span>
              </button>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              marginTop: '18px',
              color: '#9a919d',
              fontSize: '10px',
            }}
          >
            DHL Mogi Mirim • Auxiliares Logísticos • Operação de diaristas
          </div>
        </div>
      </div>
    )
  }

  if (modoAcesso === 'login') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f5f0f7 0%, #ffffff 55%, #eef7f1 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '28px',
          boxSizing: 'border-box',
          fontFamily: 'Inter, "Segoe UI", Arial, sans-serif',
        }}
      >
        {caixaNotificacao}

        <div
          style={{
            width: '100%',
            maxWidth: '430px',
            background: '#ffffff',
            border: '1px solid #e9e1eb',
            borderRadius: '24px',
            boxShadow: '0 24px 70px rgba(55,31,67,.12)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '28px 30px 23px',
              background: 'linear-gradient(135deg, #3d1853, #6c3387)',
              color: '#ffffff',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setErroLogin('')
                setSenhaLogin('')
                setModoAcesso('inicio')
              }}
              style={{
                border: '1px solid rgba(255,255,255,.18)',
                background: 'rgba(255,255,255,.10)',
                color: '#ffffff',
                borderRadius: '9px',
                padding: '7px 10px',
                cursor: 'pointer',
                fontSize: '10px',
                marginBottom: '22px',
              }}
            >
              ← Voltar
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <img
                src="/logo-sindicato.png"
                alt="Logo do Sindicato"
                style={{
                  width: '58px',
                  height: '58px',
                  objectFit: 'contain',
                  borderRadius: '15px',
                  background: '#ffffff',
                  padding: '4px',
                  boxSizing: 'border-box',
                }}
              />

              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '9px',
                    fontWeight: 800,
                    letterSpacing: '.9px',
                    opacity: .72,
                    marginBottom: '4px',
                  }}
                >
                  ACESSO RESTRITO
                </span>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '20px',
                  }}
                >
                  Área Administrativa
                </strong>
              </div>
            </div>
          </div>

          <form
            onSubmit={entrarAreaAdministrativa}
            style={{ padding: '28px 30px 30px' }}
          >
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#554b59',
                  fontSize: '11px',
                  fontWeight: 750,
                  marginBottom: '7px',
                }}
              >
                E-mail
              </label>

              <input
                autoFocus
                value={usuarioLogin}
                onChange={(e) => {
                  setUsuarioLogin(e.target.value)
                  setErroLogin('')
                }}
                placeholder="seuemail@empresa.com"
                autoComplete="email"
                style={{
                  width: '100%',
                  height: '45px',
                  borderRadius: '11px',
                  border: '1px solid #ddd4e0',
                  padding: '0 12px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontSize: '12px',
                }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  color: '#554b59',
                  fontSize: '11px',
                  fontWeight: 750,
                  marginBottom: '7px',
                }}
              >
                Senha
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarSenhaLogin ? 'text' : 'password'}
                  value={senhaLogin}
                  onChange={(e) => {
                    setSenhaLogin(e.target.value)
                    setErroLogin('')
                  }}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    height: '45px',
                    borderRadius: '11px',
                    border: erroLogin
                      ? '1px solid #e2a0a0'
                      : '1px solid #ddd4e0',
                    padding: '0 76px 0 12px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontSize: '12px',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenhaLogin((atual) => !atual)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '6px',
                    height: '33px',
                    padding: '0 9px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f3eef5',
                    color: '#6a5871',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: 750,
                  }}
                >
                  {mostrarSenhaLogin ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-3px 0 14px' }}>
              <button
                type="button"
                onClick={() => {
                  setRecuperacaoAberta(true)
                  setErroLogin('')
                }}
                style={{
                  border: 'none', background: 'transparent', color: '#6b2c91',
                  padding: 0, cursor: 'pointer', fontSize: '10px', fontWeight: 800,
                }}
              >
                Esqueci minha senha
              </button>
            </div>

            {erroLogin && (
              <div
                style={{
                  padding: '10px 11px',
                  marginBottom: '13px',
                  borderRadius: '10px',
                  background: '#fff0f0',
                  color: '#a84444',
                  border: '1px solid #f1cccc',
                  fontSize: '10px',
                  fontWeight: 650,
                }}
              >
                {erroLogin}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                height: '45px',
                marginTop: '8px',
                borderRadius: '11px',
                border: 'none',
                background: 'linear-gradient(135deg, #4a1e62, #71368c)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 10px 20px rgba(82,35,105,.16)',
              }}
            >
              Entrar no painel
            </button>

          </form>
        </div>

        {recuperacaoAberta && (
          <div
            onClick={fecharRecuperacaoSenha}
            style={{ position: 'fixed', inset: 0, background: 'rgba(24,15,29,.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '22px', zIndex: 9999, backdropFilter: 'blur(7px)' }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '470px', background: '#fff', borderRadius: '22px', boxShadow: '0 28px 80px rgba(0,0,0,.25)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '18px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '9px', fontWeight: 850, letterSpacing: '1px', color: '#8d7498', marginBottom: '5px' }}>RECUPERAÇÃO DE ACESSO</span>
                  <strong style={{ fontSize: '20px', color: '#392b3f' }}>Redefinir senha</strong>
                </div>
                <button type="button" onClick={fecharRecuperacaoSenha} style={{ width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#f4eff6', cursor: 'pointer' }}>✕</button>
              </div>

              {recuperacaoEtapa === 'identificacao' && (
                <form onSubmit={iniciarRecuperacaoSenha}>
                  <p style={{ color: '#756c79', fontSize: '12px', lineHeight: 1.6, marginTop: 0 }}>
                    Informe o e-mail usado para acessar o sistema. Enviaremos um link para redefinição de senha.
                  </p>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label>E-mail de acesso</label>
                    <input
                      type="email"
                      value={recuperacaoIdentificador}
                      onChange={(e) => setRecuperacaoIdentificador(e.target.value)}
                      placeholder="email@empresa.com"
                      autoFocus
                    />
                  </div>
                  <button className="primary-button" style={{ width: '100%' }}>
                    Enviar link de recuperação
                  </button>
                </form>
              )}

              {recuperacaoEtapa === 'novaSenha' && (
                <form onSubmit={concluirRecuperacaoSenha}>
                  <p style={{ color: '#756c79', fontSize: '12px', lineHeight: 1.6 }}>
                    Link validado. Crie uma nova senha segura para concluir a recuperação.
                  </p>
                  <div className="form-group" style={{ marginBottom: '11px' }}>
                    <label>Nova senha</label>
                    <input
                      type="password"
                      value={recuperacaoNovaSenha}
                      onChange={(e) => setRecuperacaoNovaSenha(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '9px' }}>
                    <label>Confirmar nova senha</label>
                    <input
                      type="password"
                      value={recuperacaoConfirmarSenha}
                      onChange={(e) => setRecuperacaoConfirmarSenha(e.target.value)}
                    />
                  </div>
                  <small style={{ display: 'block', color: '#877c8b', lineHeight: 1.5, marginBottom: '16px' }}>
                    {mensagemRegraSenha()}
                  </small>
                  <button className="primary-button" style={{ width: '100%' }}>
                    Salvar nova senha
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (modoAcesso === 'totem') {
    const horaAtualTotem = agoraTotem.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const dataAtualTotem = agoraTotem.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })

    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, rgba(113,67,136,.20), transparent 34%), radial-gradient(circle at bottom right, rgba(38,147,91,.16), transparent 32%), #f6f4f8',
          color: '#332a36',
          fontFamily:
            'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {caixaNotificacao}

        <header
          style={{
            minHeight: '72px',
            padding: '12px 24px',
            background: 'rgba(255,255,255,.92)',
            borderBottom: '1px solid #e9e3eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: 0,
            }}
          >
            <img
              src="/logo-sindicato.png"
              alt="Logo do Sindicato"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '13px',
                objectFit: 'contain',
                background: '#ffffff',
                border: '1px solid #e8e1eb',
                padding: '4px',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ minWidth: 0 }}>
              <strong
                style={{
                  display: 'block',
                  color: '#4e315d',
                  fontSize: '13px',
                  lineHeight: 1.25,
                }}
              >
                Registro Facial
              </strong>
              <span
                style={{
                  display: 'block',
                  color: '#918695',
                  fontSize: '9px',
                  marginTop: '2px',
                }}
              >
                Sindicato • DHL Mogi Mirim
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <div
              style={{
                textAlign: 'right',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: '#403548',
                  fontSize: '17px',
                  letterSpacing: '.02em',
                }}
              >
                {horaAtualTotem}
              </strong>
              <span
                style={{
                  display: 'block',
                  color: '#9a919c',
                  fontSize: '8px',
                  textTransform: 'capitalize',
                  marginTop: '1px',
                }}
              >
                {dataAtualTotem}
              </span>
            </div>

            <button
              onClick={() => {
                novoRegistroTotem()
                setModoAcesso('inicio')
              }}
              style={{
                minHeight: '36px',
                padding: '0 13px',
                borderRadius: '10px',
                border: '1px solid #e3dce6',
                background: '#ffffff',
                color: '#716875',
                fontSize: '9px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Sair
            </button>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            width: '100%',
            maxWidth: '1180px',
            margin: '0 auto',
            padding: '26px 22px 22px',
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, .65fr)',
            gap: '18px',
            alignItems: 'stretch',
          }}
        >
          <section
            style={{
              minHeight: '580px',
              background: '#ffffff',
              border: '1px solid #e8e1eb',
              borderRadius: '26px',
              boxShadow: '0 20px 55px rgba(68,43,78,.08)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                marginBottom: '16px',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'block',
                    color: '#9a8da0',
                    fontSize: '8px',
                    fontWeight: 800,
                    letterSpacing: '.12em',
                    marginBottom: '4px',
                  }}
                >
                  TERMINAL FACIAL 02
                </span>
                <strong
                  style={{
                    display: 'block',
                    color: '#3d3043',
                    fontSize: '15px',
                  }}
                >
                  Entrada de funcionários
                </strong>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 9px',
                  borderRadius: '999px',
                  background: '#ebf8f0',
                  color: '#23764e',
                  fontSize: '8px',
                  fontWeight: 850,
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#2da56a',
                    boxShadow: '0 0 0 4px rgba(45,165,106,.10)',
                  }}
                />
                Terminal online
              </span>
            </div>

            <div
              style={{
                flex: 1,
                minHeight: '410px',
                borderRadius: '22px',
                background:
                  estadoTotem === 'sucesso'
                    ? 'linear-gradient(145deg, #eefaf3, #f8fffb)'
                    : estadoTotem === 'erro'
                    ? 'linear-gradient(145deg, #fff3f1, #fffafa)'
                    : 'linear-gradient(145deg, #18131d, #2b2031)',
                border:
                  estadoTotem === 'sucesso'
                    ? '1px solid #cfe9d9'
                    : estadoTotem === 'erro'
                    ? '1px solid #f1d2cc'
                    : '1px solid #302638',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px',
                boxSizing: 'border-box',
                textAlign: 'center',
              }}
            >
              {(estadoTotem === 'aguardando' ||
                estadoTotem === 'reconhecendo') && (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'radial-gradient(circle at 50% 42%, rgba(138,92,160,.22), transparent 27%)',
                    }}
                  />

                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      width: '100%',
                      maxWidth: '470px',
                    }}
                  >
                    <div
                      style={{
                        width: '224px',
                        height: '274px',
                        margin: '0 auto 24px',
                        position: 'relative',
                        borderRadius: '110px 110px 88px 88px',
                        border:
                          estadoTotem === 'reconhecendo'
                            ? '2px solid rgba(114,207,153,.88)'
                            : '1px solid rgba(255,255,255,.32)',
                        boxShadow:
                          estadoTotem === 'reconhecendo'
                            ? '0 0 0 8px rgba(77,184,123,.07), 0 0 42px rgba(77,184,123,.18)'
                            : '0 0 0 8px rgba(255,255,255,.025)',
                      }}
                    >
                      <video
                        ref={videoTotemRef}
                        muted
                        playsInline
                        autoPlay
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 'inherit',
                          transform: 'scaleX(-1)',
                          opacity: cameraTotemAtiva ? 1 : 0,
                        }}
                      />

                      {[
                        { top: '-2px', left: '-2px', borderTop: '3px solid #b99ac7', borderLeft: '3px solid #b99ac7' },
                        { top: '-2px', right: '-2px', borderTop: '3px solid #b99ac7', borderRight: '3px solid #b99ac7' },
                        { bottom: '-2px', left: '-2px', borderBottom: '3px solid #b99ac7', borderLeft: '3px solid #b99ac7' },
                        { bottom: '-2px', right: '-2px', borderBottom: '3px solid #b99ac7', borderRight: '3px solid #b99ac7' },
                      ].map((corner, index) => (
                        <span
                          key={index}
                          style={{
                            position: 'absolute',
                            width: '34px',
                            height: '34px',
                            borderRadius:
                              index === 0
                                ? '13px 0 0 0'
                                : index === 1
                                ? '0 13px 0 0'
                                : index === 2
                                ? '0 0 0 13px'
                                : '0 0 13px 0',
                            ...corner,
                          }}
                        />
                      ))}

                      <div
                        style={{
                          position: 'absolute',
                          display: cameraTotemAtiva ? 'none' : 'block',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '118px',
                          height: '154px',
                          borderRadius: '54% 54% 48% 48%',
                          background:
                            'linear-gradient(180deg, rgba(255,255,255,.15), rgba(255,255,255,.06))',
                          border: '1px solid rgba(255,255,255,.12)',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            top: '55px',
                            left: '27px',
                            width: '12px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,.52)',
                            boxShadow: '52px 0 0 rgba(255,255,255,.52)',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            left: '50%',
                            bottom: '38px',
                            transform: 'translateX(-50%)',
                            width: '35px',
                            height: '12px',
                            borderBottom: '2px solid rgba(255,255,255,.40)',
                            borderRadius: '0 0 50% 50%',
                          }}
                        />
                      </div>

                      {estadoTotem === 'reconhecendo' && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '10px',
                            right: '10px',
                            top: '48%',
                            height: '2px',
                            background:
                              'linear-gradient(90deg, transparent, #65d696, transparent)',
                            boxShadow: '0 0 16px rgba(101,214,150,.85)',
                          }}
                        />
                      )}
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 9px',
                        borderRadius: '999px',
                        background:
                          estadoTotem === 'reconhecendo'
                            ? 'rgba(53,184,111,.12)'
                            : 'rgba(255,255,255,.07)',
                        color:
                          estadoTotem === 'reconhecendo'
                            ? '#92e6b8'
                            : '#cfc5d3',
                        fontSize: '8px',
                        fontWeight: 850,
                        marginBottom: '11px',
                      }}
                    >
                      {estadoTotem === 'reconhecendo'
                        ? '● Analisando imagem facial'
                        : '◉ Câmera pronta'}
                    </span>

                    <h1
                      style={{
                        margin: '0 0 8px',
                        color: '#ffffff',
                        fontSize: '24px',
                        letterSpacing: '-.02em',
                      }}
                    >
                      {estadoTotem === 'reconhecendo'
                        ? 'Reconhecendo seu rosto...'
                        : 'Posicione o rosto na câmera'}
                    </h1>

                    <p
                      style={{
                        margin: '0 auto',
                        maxWidth: '370px',
                        color: '#b9afbD',
                        fontSize: '10px',
                        lineHeight: 1.6,
                      }}
                    >
                      {estadoTotem === 'reconhecendo'
                        ? 'Mantenha-se parado por alguns segundos enquanto a identificação é processada.'
                        : 'Olhe de frente, mantenha o rosto dentro da marcação e evite cobrir olhos ou face.'}
                    </p>
                  </div>
                </>
              )}

              {estadoTotem === 'sucesso' && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '460px',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: '76px',
                      height: '76px',
                      margin: '0 auto 16px',
                      borderRadius: '50%',
                      background: '#daf3e4',
                      color: '#218451',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '34px',
                      fontWeight: 900,
                      boxShadow: '0 10px 28px rgba(45,154,94,.13)',
                    }}
                  >
                    ✓
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      background: '#e6f6ec',
                      color: '#25764d',
                      fontSize: '8px',
                      fontWeight: 900,
                      letterSpacing: '.07em',
                      marginBottom: '10px',
                    }}
                  >
                    IDENTIDADE CONFIRMADA
                  </span>

                  <h1
                    style={{
                      margin: '0 0 6px',
                      color: '#2f4839',
                      fontSize: '24px',
                    }}
                  >
                    Ponto registrado
                  </h1>

                  <p
                    style={{
                      margin: '0 0 20px',
                      color: '#789080',
                      fontSize: '10px',
                    }}
                  >
                    {tipoRegistroTotem ? `${tipoRegistroTotem} registrada com sucesso.` : 'Registro concluído com sucesso.'}
                  </p>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #dcebe1',
                      borderRadius: '17px',
                      padding: '16px',
                      textAlign: 'left',
                      boxShadow: '0 7px 20px rgba(57,114,78,.05)',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        color: '#9aaca0',
                        fontSize: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      FUNCIONÁRIO
                    </span>
                    <strong
                      style={{
                        display: 'block',
                        color: '#34483b',
                        fontSize: '17px',
                        marginBottom: '13px',
                      }}
                    >
                      {funcionarioReconhecido}
                    </strong>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '9px',
                      }}
                    >
                      <div
                        style={{
                          background: '#f7fbf8',
                          borderRadius: '11px',
                          padding: '10px',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            color: '#91a297',
                            fontSize: '8px',
                            marginBottom: '3px',
                          }}
                        >
                          DATA
                        </span>
                        <strong
                          style={{
                            display: 'block',
                            color: '#425348',
                            fontSize: '11px',
                          }}
                        >
                          {agoraTotem.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        </strong>
                      </div>

                      <div
                        style={{
                          background: '#f7fbf8',
                          borderRadius: '11px',
                          padding: '10px',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            color: '#91a297',
                            fontSize: '8px',
                            marginBottom: '3px',
                          }}
                        >
                          HORÁRIO
                        </span>
                        <strong
                          style={{
                            display: 'block',
                            color: '#425348',
                            fontSize: '11px',
                          }}
                        >
                          {horarioTotem}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={novoRegistroTotem}
                    style={{
                      marginTop: '15px',
                      minHeight: '40px',
                      padding: '0 18px',
                      border: 0,
                      borderRadius: '11px',
                      background: '#328c5b',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 850,
                      cursor: 'pointer',
                    }}
                  >
                    Finalizar agora
                  </button>

                  <small
                    style={{
                      display: 'block',
                      color: '#96aa9c',
                      fontSize: '8px',
                      marginTop: '9px',
                    }}
                  >
                    A tela voltará automaticamente em alguns segundos.
                  </small>
                </div>
              )}

              {estadoTotem === 'erro' && (
                <div
                  style={{
                    width: '100%',
                    maxWidth: '440px',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      margin: '0 auto 16px',
                      borderRadius: '50%',
                      background: '#fde2dd',
                      color: '#b84d3d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '30px',
                      fontWeight: 900,
                    }}
                  >
                    !
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      background: '#fde8e4',
                      color: '#b05041',
                      fontSize: '8px',
                      fontWeight: 900,
                      marginBottom: '10px',
                    }}
                  >
                    IDENTIFICAÇÃO NÃO CONFIRMADA
                  </span>

                  <h1
                    style={{
                      margin: '0 0 7px',
                      color: '#66413b',
                      fontSize: '23px',
                    }}
                  >
                    Tente novamente
                  </h1>

                  <p
                    style={{
                      margin: '0 auto 18px',
                      maxWidth: '350px',
                      color: '#97736d',
                      fontSize: '10px',
                      lineHeight: 1.55,
                    }}
                  >
                    {mensagemErroTotem}
                  </p>

                  <button
                    onClick={novoRegistroTotem}
                    style={{
                      minHeight: '40px',
                      padding: '0 18px',
                      border: 0,
                      borderRadius: '11px',
                      background: '#754783',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 850,
                      cursor: 'pointer',
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>

            {(estadoTotem === 'aguardando' ||
              estadoTotem === 'reconhecendo') && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '9px',
                  flexWrap: 'wrap',
                  marginTop: '16px',
                }}
              >
                <button
                  onClick={iniciarReconhecimentoFacialTotem}
                  disabled={estadoTotem === 'reconhecendo'}
                  style={{
                    minHeight: '42px',
                    minWidth: '210px',
                    padding: '0 18px',
                    border: 0,
                    borderRadius: '12px',
                    background:
                      estadoTotem === 'reconhecendo'
                        ? '#998ba0'
                        : 'linear-gradient(135deg, #724286, #5b356c)',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 900,
                    cursor:
                      estadoTotem === 'reconhecendo'
                        ? 'default'
                        : 'pointer',
                    boxShadow:
                      estadoTotem === 'reconhecendo'
                        ? 'none'
                        : '0 8px 18px rgba(91,53,108,.18)',
                  }}
                >
                  {estadoTotem === 'reconhecendo'
                    ? 'Processando identificação...'
                    : '◉ Abrir câmera e registrar ponto'}
                </button>

              </div>
            )}
          </section>

          <aside
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(145deg, #684078, #4f315d)',
                borderRadius: '22px',
                padding: '20px',
                color: '#ffffff',
                boxShadow: '0 16px 36px rgba(69,43,80,.15)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  color: '#d9c9df',
                  fontSize: '8px',
                  fontWeight: 800,
                  letterSpacing: '.10em',
                  marginBottom: '6px',
                }}
              >
                OPERAÇÃO ATUAL
              </span>

              <strong
                style={{
                  display: 'block',
                  fontSize: '18px',
                  marginBottom: '3px',
                }}
              >
                DHL Mogi Mirim
              </strong>

              <span
                style={{
                  display: 'block',
                  color: '#d9cfe0',
                  fontSize: '9px',
                  marginBottom: '18px',
                }}
              >
                Turno 09:30 às 18:30
              </span>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    padding: '11px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,.08)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      opacity: .68,
                      fontSize: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    STATUS
                  </span>
                  <strong style={{ fontSize: '10px' }}>Online</strong>
                </div>

                <div
                  style={{
                    padding: '11px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,.08)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      opacity: .68,
                      fontSize: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    MÉTODO
                  </span>
                  <strong style={{ fontSize: '10px' }}>Facial</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e8e1eb',
                borderRadius: '20px',
                padding: '18px',
                boxShadow: '0 10px 28px rgba(68,43,78,.05)',
              }}
            >
              <span
                style={{
                  display: 'block',
                  color: '#9a8fa0',
                  fontSize: '8px',
                  fontWeight: 850,
                  letterSpacing: '.10em',
                  marginBottom: '11px',
                }}
              >
                COMO REGISTRAR
              </span>

              {[
                ['1', 'Fique de frente para a câmera.'],
                ['2', 'Mantenha o rosto dentro da marcação.'],
                ['3', 'Aguarde a confirmação na tela.'],
              ].map(([numero, texto]) => (
                <div
                  key={numero}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 0',
                    borderBottom:
                      numero !== '3' ? '1px solid #f0ecf1' : 'none',
                  }}
                >
                  <span
                    style={{
                      width: '25px',
                      height: '25px',
                      borderRadius: '8px',
                      background: '#f2ebf5',
                      color: '#6d3d7d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '8px',
                      fontWeight: 900,
                      flexShrink: 0,
                    }}
                  >
                    {numero}
                  </span>

                  <span
                    style={{
                      color: '#756b78',
                      fontSize: '9px',
                      lineHeight: 1.45,
                    }}
                  >
                    {texto}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                background: '#edf8f1',
                border: '1px solid #d7ecdf',
                borderRadius: '18px',
                padding: '15px',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: '#31754d',
                  fontSize: '10px',
                  marginBottom: '5px',
                }}
              >
                ✓ Privacidade
              </strong>
              <span
                style={{
                  display: 'block',
                  color: '#658172',
                  fontSize: '8.5px',
                  lineHeight: 1.55,
                }}
              >
                O terminal exibe apenas as informações necessárias para confirmar
                o registro de ponto. Dados financeiros e documentos não aparecem
                nesta tela.
              </span>
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: '0 4px',
                textAlign: 'center',
                color: '#aaa1ac',
                fontSize: '8px',
                lineHeight: 1.5,
              }}
            >
              O reconhecimento facial depende da integração biométrica habilitada para o terminal.
            </div>
          </aside>
        </main>

        <footer
          style={{
            padding: '11px 20px 14px',
            textAlign: 'center',
            color: '#aaa1ac',
            fontSize: '8px',
          }}
        >
          Sistema de Gestão Sindical • Terminal exclusivo para registro de presença
        </footer>

        <style>{`
          @media (max-width: 900px) {
            main {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 620px) {
            header {
              padding-left: 14px !important;
              padding-right: 14px !important;
            }

            main {
              padding: 14px !important;
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      className={`app ${
        usuarioLogado?.perfil === 'Consulta' ? 'modo-consulta' : ''
      }`}
    >
      {caixaNotificacao}

      {pagamentoPixSelecionado && (
        <div
          className="pix-modal-backdrop"
          onClick={() => setPagamentoPixSelecionado(null)}
        >
          <div
            className="pix-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pix-modal-header">
              <div>
                <span className="section-label">PAGAMENTO VIA PIX</span>
                <h2>Dados para pagamento</h2>
              </div>

              <button
                className="pix-modal-close"
                onClick={() => setPagamentoPixSelecionado(null)}
              >
                ×
              </button>
            </div>

            <div className="pix-worker-card">
              <div className="pix-avatar">
                {pagamentoPixSelecionado.nome.charAt(0)}
              </div>

              <div className="pix-worker-main">
                <strong>{pagamentoPixSelecionado.nome}</strong>

                <span>
                  {funcionarioPixSelecionado?.funcao || 'Funcionário'}
                </span>
              </div>

              <span
                className={
                  pagamentoPixSelecionado.status === 'Pago'
                    ? 'employee-status active-status'
                    : 'employee-status pending-status'
                }
              >
                {pagamentoPixSelecionado.status}
              </span>
            </div>

            <div className="pix-payment-highlight">
              <span>Valor do pagamento</span>
              <strong>{moeda(pagamentoPixSelecionado.valorTotal)}</strong>
              <small>
                {pagamentoPixSelecionado.quantidadeDiarias} diária(s) •{' '}
                {pagamentoPixSelecionado.periodo}
              </small>
            </div>

            <div className="pix-content-grid">
              <div className="pix-info-area">
                <div className="pix-data-box">
                  <span>Tipo da chave</span>
                  <strong>
                    {funcionarioPixSelecionado?.tipoPix || 'PIX'}
                  </strong>
                </div>

                <div className="pix-data-box">
                  <span>Titular</span>
                  <strong>
                    {pagamentoPixSelecionado.pixTitular ||
                      funcionarioPixSelecionado?.titularPix ||
                      pagamentoPixSelecionado.nome}
                  </strong>
                </div>

                <div className="pix-data-box">
                  <span>Cidade do titular</span>
                  <strong>
                    {pagamentoPixSelecionado.pixCidade ||
                      funcionarioPixSelecionado?.cidadePix ||
                      'Não cadastrada'}
                  </strong>
                </div>

                <div className="pix-key-card">
                  <span>Chave PIX</span>

                  <strong>{pagamentoPixSelecionado.pix}</strong>

                  <button
                    className="copy-pix-button"
                    onClick={() =>
                      copiarChavePix(pagamentoPixSelecionado.pix)
                    }
                  >
                    Copiar chave PIX
                  </button>
                </div>

                {pagamentoPixSelecionado.status === 'Pago' && (
                  <div className="pix-paid-info">
                    <span>Pagamento confirmado</span>
                    <strong>{pagamentoPixSelecionado.dataPagamento}</strong>
                  </div>
                )}
              </div>

              <div className="pix-qr-area">
                <div className="pix-qr-label">QR CODE PIX</div>

                {qrPixDataUrl ? (
                  <img
                    src={qrPixDataUrl}
                    alt="QR Code PIX para pagamento"
                    style={{
                      width: 'min(100%, 280px)',
                      aspectRatio: '1 / 1',
                      objectFit: 'contain',
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '10px',
                      boxSizing: 'border-box',
                      border: '1px solid #e4dce8',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      minHeight: '220px',
                      width: '100%',
                      display: 'grid',
                      placeItems: 'center',
                      textAlign: 'center',
                      padding: '20px',
                      borderRadius: '16px',
                      background: '#f8f5fa',
                      boxSizing: 'border-box',
                    }}
                  >
                    <span style={{ color: '#6f6572', fontSize: '13px' }}>
                      {erroQrPix || 'Gerando QR Code PIX...'}
                    </span>
                  </div>
                )}

                <strong>Escaneie para pagamento</strong>

                <small>
                  QR Code PIX estático com o valor exato deste pagamento. Confira os dados no aplicativo do banco antes de concluir.
                </small>

                {pixCopiaCola && (
                  <button
                    className="copy-pix-button"
                    onClick={() => copiarPixCopiaCola(pixCopiaCola)}
                  >
                    Copiar PIX Copia e Cola
                  </button>
                )}
              </div>
            </div>

            <div className="pix-security-note">
              <div>✓</div>

              <div>
                <strong>Conferência antes do pagamento</strong>
                <span>
                  Verifique titular, chave PIX e valor antes de confirmar.
                </span>
              </div>
            </div>

            <div className="pix-modal-actions">
              <button
                className="secondary-button"
                onClick={() => setPagamentoPixSelecionado(null)}
              >
                Fechar
              </button>

              {pagamentoPixSelecionado.status === 'Aguardando' && (
                <button
                  className="payment-confirm-button"
                  onClick={marcarPagamentoSelecionadoComoPago}
                >
                  ✓ Confirmar pagamento manual
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <aside className="sidebar">
        <div className="brand-area">
          <img
            src="/logo-sindicato.png"
            alt="Logo do Sindicato dos Trabalhadores na Movimentação de Mercadorias de Limeira"
            className="brand-logo"
            style={{
              objectFit: 'contain',
              background: '#ffffff',
              padding: '4px',
              boxSizing: 'border-box',
            }}
          />

          <div>
            <h1>Gestão Sindical</h1>
            <span>DHL Mogi Mirim</span>
          </div>
        </div>

        <div
          style={{
            margin: '0 5px 16px',
            padding: '10px',
            borderRadius: '11px',
            background: 'rgba(255,255,255,.07)',
            border: '1px solid rgba(255,255,255,.08)',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '8px',
              opacity: .55,
              marginBottom: '3px',
            }}
          >
            USUÁRIO CONECTADO
          </span>
          <strong
            style={{
              display: 'block',
              fontSize: '10px',
              marginBottom: '3px',
            }}
          >
            {usuarioLogado?.nome || 'Usuário'}
          </strong>
          <span
            style={{
              display: 'inline-flex',
              padding: '3px 6px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,.10)',
              fontSize: '8px',
              fontWeight: 800,
              opacity: .82,
            }}
          >
            {usuarioLogado?.perfil || 'Sem perfil'}
          </span>
          <span
            style={{
              display: 'block',
              marginTop: '6px',
              fontSize: '7px',
              color: 'rgba(255,255,255,.55)',
            }}
          >
            @{usuarioLogado?.usuario || 'usuario'} · conta ativa
          </span>
          <button
            type="button"
            onClick={() => setMostrarAlterarMinhaSenha(true)}
            style={{
              marginTop: '9px', width: '100%', border: '1px solid rgba(255,255,255,.16)',
              background: 'rgba(255,255,255,.08)', color: '#fff', borderRadius: '8px',
              padding: '7px 8px', cursor: 'pointer', fontSize: '8px', fontWeight: 750,
            }}
          >
            Alterar minha senha
          </button>
        </div>

        <div className="menu-group-title">GESTÃO</div>

        <div className="menu">
          {temAcesso('operacao') && (
            <button
              className={tela === 'operacao' ? 'active' : ''}
              onClick={() => navegarComPermissao('operacao')}
            >
              <span className="menu-icon">◎</span>
              Operação do Dia
            </button>
          )}

          {temAcesso('historicoOperacional') && (
            <button
              className={tela === 'historicoOperacional' ? 'active' : ''}
              onClick={() => navegarComPermissao('historicoOperacional')}
            >
              <span className="menu-icon">◴</span>
              Histórico Operacional
            </button>
          )}

          {temAcesso('dashboard') && (
            <button
              className={tela === 'dashboard' ? 'active' : ''}
              onClick={() => navegarComPermissao('dashboard')}
            >
              <span className="menu-icon">▦</span>
              Dashboard
            </button>
          )}

          {temAcesso('funcionarios') && (
            <button
              className={tela === 'funcionarios' ? 'active' : ''}
              onClick={() => navegarComPermissao('funcionarios')}
            >
              <span className="menu-icon">♟</span>
              Funcionários
            </button>
          )}

          {temAcesso('ponto') && (
            <button
              className={tela === 'ponto' ? 'active' : ''}
              onClick={() => navegarComPermissao('ponto')}
            >
              <span className="menu-icon">◷</span>
              Controle de Ponto
            </button>
          )}

          {temAcesso('listaDiaristas') && (
            <button
              className={tela === 'listaDiaristas' ? 'active' : ''}
              onClick={() => navegarComPermissao('listaDiaristas')}
            >
              <span className="menu-icon">☷</span>
              Lista do Dia
            </button>
          )}

          {temAcesso('diarias') && (
            <button
              className={tela === 'diarias' ? 'active' : ''}
              onClick={() => navegarComPermissao('diarias')}
            >
              <span className="menu-icon">R$</span>
              Diárias
            </button>
          )}
        </div>

        {podeAcessarFinanceiro && (
          <>
            <div className="menu-group-title">FINANCEIRO</div>

            <div className="menu">
              <button
                className={tela === 'fechamentos' ? 'active' : ''}
                onClick={() => navegarComPermissao('fechamentos')}
              >
                <span className="menu-icon">✓</span>
                Fechamentos
              </button>

              <button
                className={tela === 'pagamentos' ? 'active' : ''}
                onClick={() => navegarComPermissao('pagamentos')}
              >
                <span className="menu-icon">◆</span>
                Pagamentos
              </button>
            </div>
          </>
        )}

        <div className="menu-group-title">ADMINISTRAÇÃO</div>

        <div className="menu">
          {temAcesso('documentos') && (
            <button
              className={tela === 'documentos' ? 'active' : ''}
              onClick={() => navegarComPermissao('documentos')}
            >
              <span className="menu-icon">▤</span>
              Documentos
            </button>
          )}

          {temAcesso('relatorios') && (
            <button
              className={tela === 'relatorios' ? 'active' : ''}
              onClick={() => navegarComPermissao('relatorios')}
            >
              <span className="menu-icon">▥</span>
              Relatórios
            </button>
          )}

          {temAcesso('calendario') && (
            <button
              className={tela === 'calendario' ? 'active' : ''}
              onClick={() => navegarComPermissao('calendario')}
            >
              <span className="menu-icon">▣</span>
              Calendário
            </button>
          )}

          {temAcesso('configuracoes') && (
            <button
              className={tela === 'configuracoes' ? 'active' : ''}
              onClick={() => navegarComPermissao('configuracoes')}
            >
              <span className="menu-icon">⚙</span>
              Configurações
            </button>
          )}

          {temAcesso('usuarios') && (
            <button
              className={tela === 'usuarios' ? 'active' : ''}
              onClick={() => navegarComPermissao('usuarios')}
            >
              <span className="menu-icon">⚿</span>
              Usuários
            </button>
          )}

          {temAcesso('auditoria') && (
            <button
              className={tela === 'auditoria' ? 'active' : ''}
              onClick={() => navegarComPermissao('auditoria')}
            >
              <span className="menu-icon">⌕</span>
              Auditoria
            </button>
          )}
        </div>

        <div
          style={{
            margin: '12px 5px 4px',
            padding: '9px 10px',
            borderRadius: '10px',
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.07)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '3px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#67d59a',
                boxShadow: '0 0 0 3px rgba(103,213,154,.10)',
              }}
            />
            <strong
              style={{
                fontSize: '8px',
                color: 'rgba(255,255,255,.84)',
              }}
            >
              Salvamento automático
            </strong>
          </div>

          <span
            style={{
              display: 'block',
              fontSize: '7px',
              color: 'rgba(255,255,255,.46)',
              lineHeight: 1.4,
            }}
          >
            {ultimaSincronizacaoLocal
              ? `Último salvamento: ${ultimaSincronizacaoLocal}`
              : 'Dados protegidos neste navegador'}
          </span>
        </div>

        <div className="totem-menu-area">
          {podeEditar && (
            <button
              className="totem-menu-button"
              onClick={() => {
                novoRegistroTotem()
                setModoAcesso('totem')
              }}
            >
              ◉ Abrir Totem de Ponto
            </button>
          )}

          <button
            onClick={sairAreaAdministrativa}
            style={{
              width: '100%',
              marginTop: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,.12)',
              background: 'rgba(255,255,255,.06)',
              color: 'rgba(255,255,255,.72)',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Sair da conta
          </button>
        </div>
      </aside>

      <main className="content">
        <style>{`
          .modo-consulta .primary-button,
          .modo-consulta .payment-confirm-button,
          .modo-consulta .payment-small-confirm,
          .modo-consulta .totem-menu-button {
            display: none !important;
          }

          .modo-consulta .form-panel {
            display: none !important;
          }
        `}</style>

        {usuarioLogado?.perfil === 'Consulta' && (
          <div
            style={{
              marginBottom: '14px',
              padding: '10px 13px',
              borderRadius: '11px',
              background: '#eef4ff',
              border: '1px solid #d8e4f7',
              color: '#42608c',
              fontSize: '9px',
              fontWeight: 700,
            }}
          >
            ◉ Modo consulta: este perfil possui acesso somente para visualização.
          </div>
        )}

        {!temAcesso(tela) && (
          <div
            style={{
              minHeight: '55vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                textAlign: 'center',
                background: '#ffffff',
                border: '1px solid #e9e3eb',
                borderRadius: '20px',
                padding: '28px',
                boxShadow: '0 12px 34px rgba(60,36,72,.07)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  margin: '0 auto 12px',
                  background: '#f3edf6',
                  color: '#68317f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                ⛨
              </div>
              <strong
                style={{
                  display: 'block',
                  color: '#403447',
                  fontSize: '16px',
                  marginBottom: '6px',
                }}
              >
                Área restrita
              </strong>
              <span
                style={{
                  display: 'block',
                  color: '#918793',
                  fontSize: '10px',
                  lineHeight: 1.55,
                  marginBottom: '14px',
                }}
              >
                O perfil {usuarioLogado?.perfil} não possui permissão para acessar esta tela.
              </span>
              <button
                className="secondary-button"
                onClick={() => setTela('dashboard')}
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        )}

        {tela === 'operacao' && temAcesso('operacao') && (
          <>
            {(() => {
              const dataOperacaoBR = formatarDataLista(dataOperacao)

              const listaOperacao =
                listasDiaristas.find((lista) => lista.data === dataOperacao) ||
                null

              const escalados = listaOperacao?.diaristas || []

              const registrosDoDia = registrosPonto.filter(
                (registro) =>
                  registro.data === dataOperacaoBR &&
                  registro.status === 'Registrado'
              )

              const presentes = escalados.filter((nome) =>
                registrosDoDia.some((registro) => registro.nome === nome)
              )

              const ausentes = escalados.filter((nome) =>
                (listaOperacao?.ausentes || []).includes(nome)
              )

              const pendentesOperacao = escalados.filter(
                (nome) =>
                  !presentes.includes(nome) &&
                  !(listaOperacao?.ausentes || []).includes(nome)
              )

              const diariasDoDia = diarias.filter(
                (diaria) => diaria.data === dataOperacaoBR
              )

              const diariasGeradas = escalados.filter((nome) =>
                diariasDoDia.some((diaria) => diaria.nome === nome)
              )

              const dataReferencia = new Date(`${dataOperacao}T12:00:00`)
              const { tipoDia, adicional } = descobrirTipoDia(dataReferencia)

              const valorUnitarioPrevisto =
                configuracaoValores.diariaBase +
                adicional +
                configuracaoValores.vt +
                configuracaoValores.vr

              const valorPrevisto =
                escalados.length * valorUnitarioPrevisto

              const valorConfirmado = diariasDoDia
                .filter((diaria) => escalados.includes(diaria.nome))
                .reduce((total, diaria) => total + diaria.valor, 0)

              const statusDiarista = (nome: string) => {
                if (presentes.includes(nome)) return 'Presente'
                if ((listaOperacao?.ausentes || []).includes(nome)) return 'Falta'
                return 'Pendente'
              }

              const registroDoDiarista = (nome: string) =>
                registrosDoDia.find((registro) => registro.nome === nome)

              const diariaDoDiarista = (nome: string) =>
                diariasDoDia.find((diaria) => diaria.nome === nome)

              const abrirListaDoDia = () => {
                setDataListaDiaristas(dataOperacao)
                setLocalListaDiaristas('DHL Mogi Mirim')
                setHorarioListaDiaristas('09:30')
                setTela('listaDiaristas')
              }

              const cardOperacao = {
                background: '#ffffff',
                border: '1px solid #ebe5ed',
                borderRadius: '18px',
                padding: '18px',
                boxShadow: '0 8px 22px rgba(60,36,72,.05)',
              }

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      gap: '18px',
                      flexWrap: 'wrap',
                      marginBottom: '22px',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          color: '#6b3c83',
                          fontSize: '10px',
                          fontWeight: 850,
                          letterSpacing: '1.1px',
                          textTransform: 'uppercase',
                          marginBottom: '7px',
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#28a867',
                            boxShadow: '0 0 0 4px rgba(40,168,103,.10)',
                          }}
                        />
                        DHL Mogi Mirim • Turno 09:30 às 18:30
                      </span>

                      <h1
                        className="page-title"
                        style={{ marginBottom: '6px' }}
                      >
                        Painel Operacional do Dia
                      </h1>

                      <p className="page-subtitle">
                        Escala, presença, faltas e diárias em uma única visão.
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-end',
                        gap: '9px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: 'block',
                            color: '#817684',
                            fontSize: '9px',
                            fontWeight: 750,
                            marginBottom: '5px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Data da operação
                        </label>

                        <input
                          type="date"
                          value={dataOperacao}
                          onChange={(e) => setDataOperacao(e.target.value)}
                          style={{
                            height: '39px',
                            border: '1px solid #ddd5e0',
                            borderRadius: '10px',
                            padding: '0 10px',
                            background: '#ffffff',
                            color: '#443948',
                            fontSize: '11px',
                          }}
                        />
                      </div>

                      <button
                        className="secondary-button"
                        onClick={abrirListaDoDia}
                        style={{ height: '39px' }}
                      >
                        {listaOperacao ? 'Editar Lista do Dia' : 'Criar Lista do Dia'}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '16px 18px',
                      marginBottom: '16px',
                      borderRadius: '17px',
                      background:
                        listaOperacao
                          ? 'linear-gradient(135deg, #f0f8f3, #fbfdfc)'
                          : 'linear-gradient(135deg, #fff8e9, #fffdf8)',
                      border: listaOperacao
                        ? '1px solid #d9ecdf'
                        : '1px solid #f0dfae',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '14px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          display: 'block',
                          color: listaOperacao ? '#256645' : '#87620b',
                          fontSize: '13px',
                          marginBottom: '4px',
                        }}
                      >
                        {listaOperacao
                          ? `Lista do Dia encontrada • ${dataOperacaoBR}`
                          : `Nenhuma Lista do Dia para ${dataOperacaoBR}`}
                      </strong>

                      <span
                        style={{
                          display: 'block',
                          color: listaOperacao ? '#658071' : '#9b803e',
                          fontSize: '10px',
                          lineHeight: 1.5,
                        }}
                      >
                        {listaOperacao
                          ? `${escalados.length} auxiliar(es) logístico(s) escalado(s) para a DHL Mogi Mirim.`
                          : 'Crie a escala antes de acompanhar presença e gerar as diárias.'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '7px',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          padding: '6px 9px',
                          borderRadius: '999px',
                          background: '#ffffff',
                          border: '1px solid rgba(100,80,110,.12)',
                          color: '#6d6271',
                          fontSize: '9px',
                          fontWeight: 750,
                        }}
                      >
                        {tipoDia}
                      </span>

                      <span
                        style={{
                          padding: '6px 9px',
                          borderRadius: '999px',
                          background: '#ffffff',
                          border: '1px solid rgba(100,80,110,.12)',
                          color: '#6d6271',
                          fontSize: '9px',
                          fontWeight: 750,
                        }}
                      >
                        VT incluído
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(175px, 1fr))',
                      gap: '13px',
                      marginBottom: '18px',
                    }}
                  >
                    {[
                      {
                        titulo: 'Escalados',
                        valor: escalados.length,
                        detalhe: 'Lista do Dia',
                        icone: '☷',
                        fundo: '#f1e9f5',
                        cor: '#642d7c',
                      },
                      {
                        titulo: 'Presentes',
                        valor: presentes.length,
                        detalhe:
                          escalados.length > 0
                            ? `${Math.round(
                                (presentes.length / escalados.length) * 100
                              )}% da escala`
                            : 'Sem escala',
                        icone: '✓',
                        fundo: '#e8f8ee',
                        cor: '#177647',
                      },
                      {
                        titulo: 'Faltas lançadas',
                        valor: ausentes.length,
                        detalhe: ausentes.length > 0 ? 'Ausência confirmada' : `${pendentesOperacao.length} pendente(s) de ponto`,
                        icone: '!',
                        fundo: '#fff2e5',
                        cor: '#ad641c',
                      },
                      {
                        titulo: 'Diárias geradas',
                        valor: diariasGeradas.length,
                        detalhe: `${moeda(valorConfirmado)} confirmado`,
                        icone: 'R$',
                        fundo: '#eaf1ff',
                        cor: '#2c5fbd',
                      },
                      {
                        titulo: 'Valor previsto',
                        valor: moeda(valorPrevisto),
                        detalhe:
                          escalados.length > 0
                            ? `${moeda(valorUnitarioPrevisto)} por diarista`
                            : 'Aguardando escala',
                        icone: '◈',
                        fundo: '#fff7db',
                        cor: '#96700a',
                      },
                    ].map((card) => (
                      <div key={card.titulo} style={cardOperacao}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '10px',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: 'block',
                                color: '#7d737f',
                                fontSize: '11px',
                                fontWeight: 650,
                                marginBottom: '8px',
                              }}
                            >
                              {card.titulo}
                            </span>

                            <strong
                              style={{
                                display: 'block',
                                color: '#34283a',
                                fontSize:
                                  typeof card.valor === 'string'
                                    ? '19px'
                                    : '27px',
                                lineHeight: 1.05,
                                marginBottom: '8px',
                              }}
                            >
                              {card.valor}
                            </strong>

                            <small
                              style={{
                                color: '#9a919d',
                                fontSize: '9px',
                              }}
                            >
                              {card.detalhe}
                            </small>
                          </div>

                          <span
                            style={{
                              minWidth: '38px',
                              height: '38px',
                              padding: '0 8px',
                              borderRadius: '11px',
                              background: card.fundo,
                              color: card.cor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: card.icone === 'R$' ? '9px' : '15px',
                              fontWeight: 850,
                            }}
                          >
                            {card.icone}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'minmax(0, 1.7fr) minmax(280px, .7fr)',
                      gap: '16px',
                      alignItems: 'start',
                    }}
                  >
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #eae4ec',
                        borderRadius: '18px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 22px rgba(60,36,72,.05)',
                      }}
                    >
                      <div
                        style={{
                          padding: '17px 19px',
                          borderBottom: '1px solid #eee9f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              display: 'block',
                              color: '#392d40',
                              fontSize: '14px',
                              marginBottom: '3px',
                            }}
                          >
                            Acompanhamento da equipe
                          </strong>

                          <span
                            style={{
                              display: 'block',
                              color: '#988f9b',
                              fontSize: '9px',
                            }}
                          >
                            Auxiliares Logísticos • DHL Mogi Mirim
                          </span>
                        </div>

                        <button
                          className="secondary-button"
                          onClick={() => setTela('ponto')}
                        >
                          Ver Controle de Ponto
                        </button>
                      </div>

                      {listaOperacao ? (
                        <div className="table-wrapper">
                          <table className="employees-table">
                            <thead>
                              <tr>
                                <th>Funcionário</th>
                                <th>Status</th>
                                <th>Entrada</th>
                                <th>Método</th>
                                <th>Diária</th>
                                <th>Valor</th>
                              </tr>
                            </thead>

                            <tbody>
                              {escalados.map((nome) => {
                                const status = statusDiarista(nome)
                                const registro = registroDoDiarista(nome)
                                const diaria = diariaDoDiarista(nome)

                                return (
                                  <tr key={nome}>
                                    <td>
                                      <strong>{nome}</strong>
                                      <small
                                        style={{
                                          display: 'block',
                                          color: '#9a919d',
                                          fontSize: '9px',
                                          marginTop: '2px',
                                        }}
                                      >
                                        Auxiliar Logístico
                                      </small>
                                    </td>

                                    <td>
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          padding: '5px 8px',
                                          borderRadius: '999px',
                                          background:
                                            status === 'Presente'
                                              ? '#e8f7ee'
                                              : status === 'Falta'
                                              ? '#fdecec'
                                              : '#fff5dd',
                                          color:
                                            status === 'Presente'
                                              ? '#177647'
                                              : status === 'Falta'
                                              ? '#a83d3d'
                                              : '#97690d',
                                          fontSize: '9px',
                                          fontWeight: 750,
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        <span
                                          style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: 'currentColor',
                                          }}
                                        />
                                        {status}
                                      </span>
                                    </td>

                                    <td>{registro?.horario || '—'}</td>

                                    <td>
                                      {registro?.metodo || '—'}
                                    </td>

                                    <td>
                                      {diaria ? (
                                        <span
                                          style={{
                                            color:
                                              diaria.status === 'Aprovada'
                                                ? '#177647'
                                                : '#93670d',
                                            fontWeight: 700,
                                            fontSize: '10px',
                                          }}
                                        >
                                          {diaria.status === 'Aprovada'
                                            ? 'Aprovada'
                                            : 'Em conferência'}
                                        </span>
                                      ) : (
                                        <span
                                          style={{
                                            color: '#a49ba6',
                                            fontSize: '10px',
                                          }}
                                        >
                                          Não gerada
                                        </span>
                                      )}
                                    </td>

                                    <td>
                                      <strong>
                                        {diaria ? moeda(diaria.valor) : '—'}
                                      </strong>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '38px 22px',
                            textAlign: 'center',
                            color: '#938997',
                          }}
                        >
                          <strong
                            style={{
                              display: 'block',
                              color: '#5a4d60',
                              fontSize: '13px',
                              marginBottom: '6px',
                            }}
                          >
                            Nenhuma escala encontrada
                          </strong>

                          <span
                            style={{
                              display: 'block',
                              fontSize: '10px',
                              marginBottom: '15px',
                            }}
                          >
                            Crie a Lista do Dia para começar o acompanhamento.
                          </span>

                          <button
                            className="primary-button"
                            onClick={abrirListaDoDia}
                          >
                            Criar Lista do Dia
                          </button>
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '13px',
                      }}
                    >
                      <div
                        style={{
                          background:
                            'linear-gradient(145deg, #431b5c, #6b3286)',
                          color: '#ffffff',
                          borderRadius: '18px',
                          padding: '19px',
                          boxShadow: '0 12px 28px rgba(76,31,98,.16)',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            fontSize: '9px',
                            fontWeight: 800,
                            letterSpacing: '.8px',
                            opacity: .65,
                            marginBottom: '7px',
                          }}
                        >
                          AÇÃO OPERACIONAL
                        </span>

                        <strong
                          style={{
                            display: 'block',
                            fontSize: '16px',
                            marginBottom: '7px',
                          }}
                        >
                          Gerar diárias dos presentes
                        </strong>

                        <p
                          style={{
                            margin: '0 0 15px',
                            fontSize: '10px',
                            lineHeight: 1.55,
                            opacity: .76,
                          }}
                        >
                          Somente quem está na Lista do Dia e possui ponto
                          registrado receberá diária.
                        </p>

                        <button
                          disabled={!listaOperacao || presentes.length === 0}
                          onClick={() =>
                            listaOperacao &&
                            gerarDiariasDaOperacao(listaOperacao)
                          }
                          style={{
                            width: '100%',
                            border: 'none',
                            borderRadius: '11px',
                            padding: '11px 12px',
                            background:
                              !listaOperacao || presentes.length === 0
                                ? 'rgba(255,255,255,.14)'
                                : '#ffffff',
                            color:
                              !listaOperacao || presentes.length === 0
                                ? 'rgba(255,255,255,.48)'
                                : '#58266e',
                            fontSize: '10px',
                            fontWeight: 850,
                            cursor:
                              !listaOperacao || presentes.length === 0
                                ? 'not-allowed'
                                : 'pointer',
                          }}
                        >
                          ✓ Gerar diárias do dia
                        </button>
                      </div>

                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #eae4ec',
                          borderRadius: '18px',
                          padding: '17px',
                        }}
                      >
                        <strong
                          style={{
                            display: 'block',
                            color: '#3f3345',
                            fontSize: '13px',
                            marginBottom: '12px',
                          }}
                        >
                          Resumo financeiro
                        </strong>

                        {[
                          [
                            'Diária base',
                            moeda(configuracaoValores.diariaBase),
                          ],
                          ['Adicional do dia', moeda(adicional)],
                          ['Vale-transporte', moeda(configuracaoValores.vt)],
                          ['Vale-refeição', moeda(configuracaoValores.vr)],
                          ['Por diarista', moeda(valorUnitarioPrevisto)],
                        ].map(([rotulo, valor], index) => (
                          <div
                            key={rotulo}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '10px',
                              padding: '8px 0',
                              borderTop:
                                index === 0 ? 'none' : '1px solid #f0ebf1',
                            }}
                          >
                            <span
                              style={{
                                color: '#8c828f',
                                fontSize: '10px',
                              }}
                            >
                              {rotulo}
                            </span>

                            <strong
                              style={{
                                color:
                                  rotulo === 'Por diarista'
                                    ? '#55246b'
                                    : '#554b59',
                                fontSize: '10px',
                              }}
                            >
                              {valor}
                            </strong>
                          </div>
                        ))}

                        <div
                          style={{
                            marginTop: '8px',
                            padding: '10px',
                            borderRadius: '10px',
                            background: '#f0f8f3',
                            color: '#397056',
                            fontSize: '9px',
                            lineHeight: 1.45,
                          }}
                        >
                          Todos os diaristas da operação recebem
                          vale-transporte.
                        </div>
                      </div>

                      <button
                        className="secondary-button"
                        onClick={() => setModoAcesso('totem')}
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          padding: '11px',
                        }}
                      >
                        ◉ Abrir Registro Facial
                      </button>
                    </div>
                  </div>
                </>
              )
            })()}
          </>
        )}

        {tela === 'historicoOperacional' && temAcesso('historicoOperacional') && (
          <>
            {(() => {
              const historicos = [...listasDiaristas]
                .filter((lista) => {
                  const busca = buscaHistoricoOperacional.trim().toLowerCase()

                  const correspondeBusca =
                    !busca ||
                    lista.diaristas.some((nome) =>
                      nome.toLowerCase().includes(busca)
                    ) ||
                    lista.observacao.toLowerCase().includes(busca) ||
                    lista.local.toLowerCase().includes(busca)

                  const correspondeInicio =
                    !dataInicioHistorico || lista.data >= dataInicioHistorico

                  const correspondeFim =
                    !dataFimHistorico || lista.data <= dataFimHistorico

                  return correspondeBusca && correspondeInicio && correspondeFim
                })
                .sort((a, b) => b.data.localeCompare(a.data))

              const montarResumo = (lista: ListaDiaristas) => {
                const dataBR = formatarDataLista(lista.data)

                const pontosDoDia = registrosPonto.filter(
                  (registro) =>
                    registro.data === dataBR &&
                    registro.status === 'Registrado'
                )

                const presentes = lista.diaristas.filter((nome) =>
                  pontosDoDia.some((registro) => registro.nome === nome)
                )

                const faltas = lista.diaristas.filter((nome) =>
                  (lista.ausentes || []).includes(nome)
                )

                const pendentes = lista.diaristas.filter(
                  (nome) =>
                    !presentes.includes(nome) &&
                    !(lista.ausentes || []).includes(nome)
                )

                const diariasDaLista = diarias.filter(
                  (diaria) =>
                    diaria.data === dataBR &&
                    lista.diaristas.includes(diaria.nome)
                )

                const total = diariasDaLista.reduce(
                  (soma, diaria) => soma + diaria.valor,
                  0
                )

                const aprovadas = diariasDaLista.filter(
                  (diaria) => diaria.status === 'Aprovada'
                ).length

                return {
                  dataBR,
                  pontosDoDia,
                  presentes,
                  faltas,
                  pendentes,
                  diariasDaLista,
                  total,
                  aprovadas,
                }
              }

              const listaSelecionada =
                listasDiaristas.find(
                  (lista) => lista.data === historicoSelecionado
                ) || null

              const resumoSelecionado = listaSelecionada
                ? montarResumo(listaSelecionada)
                : null

              const totalOperacoes = historicos.length
              const totalEscalados = historicos.reduce(
                (soma, lista) => soma + lista.diaristas.length,
                0
              )
              const totalPresentes = historicos.reduce(
                (soma, lista) => soma + montarResumo(lista).presentes.length,
                0
              )
              const totalFaltas = historicos.reduce(
                (soma, lista) => soma + montarResumo(lista).faltas.length,
                0
              )
              const valorHistorico = historicos.reduce(
                (soma, lista) => soma + montarResumo(lista).total,
                0
              )

              const taxaPresenca =
                totalEscalados > 0
                  ? Math.round((totalPresentes / totalEscalados) * 100)
                  : 0

              const abrirNoPainelDoDia = (data: string) => {
                setDataOperacao(data)
                setTela('operacao')
              }

              const limparFiltrosHistorico = () => {
                setBuscaHistoricoOperacional('')
                setDataInicioHistorico('')
                setDataFimHistorico('')
              }

              const cardResumo = {
                background: '#ffffff',
                border: '1px solid #ece7ee',
                borderRadius: '20px',
                padding: '18px',
                boxShadow: '0 8px 28px rgba(60,36,72,.055)',
              }

              return (
                <>
                  <div
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      borderRadius: '24px',
                      padding: '24px',
                      marginBottom: '18px',
                      background:
                        'linear-gradient(135deg, #4b1f63 0%, #6f3489 55%, #3e6f54 140%)',
                      color: '#ffffff',
                      boxShadow: '0 18px 42px rgba(75,31,99,.18)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        width: '230px',
                        height: '230px',
                        borderRadius: '50%',
                        right: '-75px',
                        top: '-95px',
                        background: 'rgba(255,255,255,.07)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        right: '105px',
                        bottom: '-95px',
                        background: 'rgba(255,255,255,.045)',
                      }}
                    />

                    <div
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '20px',
                        alignItems: 'flex-end',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '6px 9px',
                            borderRadius: '999px',
                            background: 'rgba(255,255,255,.10)',
                            border: '1px solid rgba(255,255,255,.12)',
                            fontSize: '9px',
                            fontWeight: 800,
                            letterSpacing: '.8px',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                          }}
                        >
                          ◷ Memória operacional • DHL Mogi Mirim
                        </span>

                        <h1
                          style={{
                            margin: '0 0 7px',
                            fontSize: '27px',
                            lineHeight: 1.05,
                            letterSpacing: '-.5px',
                          }}
                        >
                          Histórico Operacional
                        </h1>

                        <p
                          style={{
                            margin: 0,
                            maxWidth: '620px',
                            fontSize: '11px',
                            lineHeight: 1.6,
                            opacity: .72,
                          }}
                        >
                          Consulte cada operação, confira presença, faltas,
                          diárias e valores consolidados em uma única visão.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setDataOperacao(dataLocalHoje)
                          setTela('operacao')
                        }}
                        style={{
                          border: '1px solid rgba(255,255,255,.18)',
                          background: '#ffffff',
                          color: '#54236b',
                          borderRadius: '11px',
                          padding: '10px 14px',
                          fontSize: '10px',
                          fontWeight: 850,
                          cursor: 'pointer',
                          boxShadow: '0 8px 20px rgba(0,0,0,.10)',
                        }}
                      >
                        ◎ Ir para a operação de hoje
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(165px, 1fr))',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    {[
                      {
                        titulo: 'Operações',
                        valor: totalOperacoes,
                        detalhe: 'dias encontrados',
                        icone: '◴',
                        fundo: '#f2eaf6',
                        cor: '#6b3384',
                      },
                      {
                        titulo: 'Escalados',
                        valor: totalEscalados,
                        detalhe: 'convocações',
                        icone: '☷',
                        fundo: '#eef2ff',
                        cor: '#4258a8',
                      },
                      {
                        titulo: 'Presença',
                        valor: `${taxaPresenca}%`,
                        detalhe: `${totalPresentes} comparecimentos`,
                        icone: '✓',
                        fundo: '#e9f8ef',
                        cor: '#1c7a4b',
                      },
                      {
                        titulo: 'Faltas',
                        valor: totalFaltas,
                        detalhe: 'sem registro de ponto',
                        icone: '!',
                        fundo: '#fff1e7',
                        cor: '#b46424',
                      },
                      {
                        titulo: 'Valor registrado',
                        valor: moeda(valorHistorico),
                        detalhe: 'diárias geradas',
                        icone: 'R$',
                        fundo: '#fff7db',
                        cor: '#8d6a0b',
                      },
                    ].map((card) => (
                      <div key={card.titulo} style={cardResumo}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '10px',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: 'block',
                                color: '#807682',
                                fontSize: '10px',
                                fontWeight: 650,
                                marginBottom: '8px',
                              }}
                            >
                              {card.titulo}
                            </span>

                            <strong
                              style={{
                                display: 'block',
                                color: '#372b3d',
                                fontSize:
                                  typeof card.valor === 'string' &&
                                  card.valor.includes('R$')
                                    ? '18px'
                                    : '25px',
                                lineHeight: 1.05,
                                marginBottom: '7px',
                              }}
                            >
                              {card.valor}
                            </strong>

                            <small
                              style={{
                                color: '#a098a2',
                                fontSize: '9px',
                              }}
                            >
                              {card.detalhe}
                            </small>
                          </div>

                          <span
                            style={{
                              minWidth: '38px',
                              height: '38px',
                              padding: '0 8px',
                              borderRadius: '12px',
                              background: card.fundo,
                              color: card.cor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: card.icone === 'R$' ? '9px' : '15px',
                              fontWeight: 850,
                            }}
                          >
                            {card.icone}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #ebe5ed',
                      borderRadius: '20px',
                      padding: '15px',
                      marginBottom: '16px',
                      boxShadow: '0 7px 24px rgba(60,36,72,.045)',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'minmax(240px, 1.6fr) repeat(2, minmax(150px, .55fr)) auto',
                        gap: '10px',
                        alignItems: 'end',
                      }}
                    >
                      <div>
                        <label
                          style={{
                            display: 'block',
                            color: '#7e7481',
                            fontSize: '9px',
                            fontWeight: 800,
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '.5px',
                          }}
                        >
                          Buscar na operação
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span
                            style={{
                              position: 'absolute',
                              left: '11px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#9a909d',
                              fontSize: '12px',
                            }}
                          >
                            ⌕
                          </span>
                          <input
                            value={buscaHistoricoOperacional}
                            onChange={(e) =>
                              setBuscaHistoricoOperacional(e.target.value)
                            }
                            placeholder="Funcionário, local ou observação"
                            style={{
                              width: '100%',
                              height: '40px',
                              border: '1px solid #ded6e1',
                              borderRadius: '11px',
                              padding: '0 11px 0 31px',
                              boxSizing: 'border-box',
                              fontSize: '10px',
                              outline: 'none',
                              background: '#fbfafc',
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            color: '#7e7481',
                            fontSize: '9px',
                            fontWeight: 800,
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '.5px',
                          }}
                        >
                          Data inicial
                        </label>
                        <input
                          type="date"
                          value={dataInicioHistorico}
                          onChange={(e) =>
                            setDataInicioHistorico(e.target.value)
                          }
                          style={{
                            width: '100%',
                            height: '40px',
                            border: '1px solid #ded6e1',
                            borderRadius: '11px',
                            padding: '0 10px',
                            boxSizing: 'border-box',
                            fontSize: '10px',
                            outline: 'none',
                            background: '#fbfafc',
                          }}
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            display: 'block',
                            color: '#7e7481',
                            fontSize: '9px',
                            fontWeight: 800,
                            marginBottom: '6px',
                            textTransform: 'uppercase',
                            letterSpacing: '.5px',
                          }}
                        >
                          Data final
                        </label>
                        <input
                          type="date"
                          value={dataFimHistorico}
                          onChange={(e) =>
                            setDataFimHistorico(e.target.value)
                          }
                          style={{
                            width: '100%',
                            height: '40px',
                            border: '1px solid #ded6e1',
                            borderRadius: '11px',
                            padding: '0 10px',
                            boxSizing: 'border-box',
                            fontSize: '10px',
                            outline: 'none',
                            background: '#fbfafc',
                          }}
                        />
                      </div>

                      <button
                        onClick={limparFiltrosHistorico}
                        style={{
                          height: '40px',
                          borderRadius: '11px',
                          border: '1px solid #ded6e1',
                          background: '#ffffff',
                          color: '#716675',
                          padding: '0 13px',
                          fontSize: '9px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Limpar filtros
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: listaSelecionada
                        ? 'minmax(0, 1.25fr) minmax(320px, .75fr)'
                        : '1fr',
                      gap: '16px',
                      alignItems: 'start',
                    }}
                  >
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e9e3eb',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 9px 28px rgba(60,36,72,.05)',
                      }}
                    >
                      <div
                        style={{
                          padding: '17px 18px',
                          borderBottom: '1px solid #eee9f0',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <strong
                            style={{
                              display: 'block',
                              color: '#3b3040',
                              fontSize: '14px',
                              marginBottom: '3px',
                            }}
                          >
                            Linha do tempo das operações
                          </strong>
                          <span
                            style={{
                              color: '#99909c',
                              fontSize: '9px',
                            }}
                          >
                            {historicos.length} resultado(s) encontrados
                          </span>
                        </div>

                        <span
                          style={{
                            padding: '6px 9px',
                            borderRadius: '999px',
                            background: '#f5f1f7',
                            color: '#765a83',
                            fontSize: '9px',
                            fontWeight: 750,
                          }}
                        >
                          DHL Mogi Mirim
                        </span>
                      </div>

                      {historicos.length > 0 ? (
                        <div style={{ padding: '10px' }}>
                          {historicos.map((lista) => {
                            const resumo = montarResumo(lista)

                            const todasGeradas =
                              resumo.presentes.length > 0 &&
                              resumo.diariasDaLista.length >=
                                resumo.presentes.length

                            const selecionado =
                              historicoSelecionado === lista.data

                            return (
                              <button
                                key={lista.id}
                                onClick={() =>
                                  setHistoricoSelecionado(lista.data)
                                }
                                style={{
                                  width: '100%',
                                  border: selecionado
                                    ? '1px solid #cdb8d7'
                                    : '1px solid transparent',
                                  borderRadius: '14px',
                                  background: selecionado
                                    ? '#f8f3fa'
                                    : '#ffffff',
                                  padding: '13px',
                                  marginBottom: '7px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  display: 'grid',
                                  gridTemplateColumns:
                                    'minmax(135px, .7fr) minmax(100px, .45fr) minmax(100px, .45fr) minmax(100px, .45fr) minmax(110px, .55fr) auto',
                                  gap: '10px',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <strong
                                    style={{
                                      display: 'block',
                                      color: '#3e3344',
                                      fontSize: '11px',
                                      marginBottom: '3px',
                                    }}
                                  >
                                    {resumo.dataBR}
                                  </strong>
                                  <small
                                    style={{
                                      color: '#9b929e',
                                      fontSize: '8px',
                                    }}
                                  >
                                    09:30 às 18:30
                                  </small>
                                </div>

                                <div>
                                  <small
                                    style={{
                                      display: 'block',
                                      color: '#9a919d',
                                      fontSize: '8px',
                                      marginBottom: '3px',
                                    }}
                                  >
                                    Escalados
                                  </small>
                                  <strong
                                    style={{
                                      color: '#55495b',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {lista.diaristas.length}
                                  </strong>
                                </div>

                                <div>
                                  <small
                                    style={{
                                      display: 'block',
                                      color: '#9a919d',
                                      fontSize: '8px',
                                      marginBottom: '3px',
                                    }}
                                  >
                                    Presentes
                                  </small>
                                  <strong
                                    style={{
                                      color: '#1f7b4e',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {resumo.presentes.length}
                                  </strong>
                                </div>

                                <div>
                                  <small
                                    style={{
                                      display: 'block',
                                      color: '#9a919d',
                                      fontSize: '8px',
                                      marginBottom: '3px',
                                    }}
                                  >
                                    Faltas
                                  </small>
                                  <strong
                                    style={{
                                      color:
                                        resumo.faltas.length > 0
                                          ? '#af5847'
                                          : '#6f6772',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {resumo.faltas.length}
                                  </strong>
                                </div>

                                <div>
                                  <small
                                    style={{
                                      display: 'block',
                                      color: '#9a919d',
                                      fontSize: '8px',
                                      marginBottom: '3px',
                                    }}
                                  >
                                    Total
                                  </small>
                                  <strong
                                    style={{
                                      color: '#3f3445',
                                      fontSize: '11px',
                                    }}
                                  >
                                    {moeda(resumo.total)}
                                  </strong>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    justifyContent: 'flex-end',
                                  }}
                                >
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      padding: '5px 8px',
                                      borderRadius: '999px',
                                      background: todasGeradas
                                        ? '#e8f7ee'
                                        : resumo.presentes.length === 0
                                        ? '#f2eef4'
                                        : '#fff4dd',
                                      color: todasGeradas
                                        ? '#177647'
                                        : resumo.presentes.length === 0
                                        ? '#766d79'
                                        : '#95670c',
                                      fontSize: '8px',
                                      fontWeight: 800,
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {todasGeradas
                                      ? 'Concluída'
                                      : resumo.presentes.length === 0
                                      ? 'Sem presença'
                                      : 'Em conferência'}
                                  </span>

                                  <span
                                    style={{
                                      color: '#8d7c94',
                                      fontSize: '14px',
                                      fontWeight: 700,
                                    }}
                                  >
                                    ›
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '42px 22px',
                            textAlign: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: '46px',
                              height: '46px',
                              borderRadius: '14px',
                              background: '#f3edf6',
                              color: '#735184',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '0 auto 12px',
                              fontSize: '18px',
                            }}
                          >
                            ◴
                          </div>
                          <strong
                            style={{
                              display: 'block',
                              color: '#554a5a',
                              fontSize: '12px',
                              marginBottom: '5px',
                            }}
                          >
                            Nenhuma operação encontrada
                          </strong>
                          <span
                            style={{
                              color: '#968d99',
                              fontSize: '9px',
                            }}
                          >
                            Ajuste os filtros para consultar outro período.
                          </span>
                        </div>
                      )}
                    </div>

                    {listaSelecionada && resumoSelecionado && (
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e8e1ea',
                          borderRadius: '20px',
                          overflow: 'hidden',
                          boxShadow: '0 12px 34px rgba(60,36,72,.07)',
                          position: 'sticky',
                          top: '16px',
                        }}
                      >
                        <div
                          style={{
                            padding: '18px',
                            background:
                              'linear-gradient(135deg, #f8f3fa, #ffffff)',
                            borderBottom: '1px solid #ece5ee',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              gap: '12px',
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  display: 'block',
                                  color: '#80618f',
                                  fontSize: '8px',
                                  fontWeight: 850,
                                  letterSpacing: '.7px',
                                  textTransform: 'uppercase',
                                  marginBottom: '5px',
                                }}
                              >
                                Detalhes da operação
                              </span>

                              <strong
                                style={{
                                  display: 'block',
                                  color: '#362b3c',
                                  fontSize: '18px',
                                  marginBottom: '3px',
                                }}
                              >
                                {resumoSelecionado.dataBR}
                              </strong>

                              <small
                                style={{
                                  color: '#938996',
                                  fontSize: '9px',
                                }}
                              >
                                DHL Mogi Mirim • 09:30 às 18:30
                              </small>
                            </div>

                            <button
                              onClick={() => setHistoricoSelecionado(null)}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '9px',
                                border: '1px solid #e4dce7',
                                background: '#ffffff',
                                color: '#786b7d',
                                cursor: 'pointer',
                                fontSize: '13px',
                              }}
                              title="Fechar detalhes"
                            >
                              ×
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              abrirNoPainelDoDia(listaSelecionada.data)
                            }
                            style={{
                              width: '100%',
                              marginTop: '13px',
                              border: 'none',
                              borderRadius: '10px',
                              padding: '9px 11px',
                              background:
                                'linear-gradient(135deg, #502168, #6f3489)',
                              color: '#ffffff',
                              fontSize: '9px',
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Abrir no Painel Operacional
                          </button>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '8px',
                            padding: '14px',
                            borderBottom: '1px solid #eee9f0',
                          }}
                        >
                          {[
                            [
                              'Escalados',
                              listaSelecionada.diaristas.length,
                            ],
                            [
                              'Presentes',
                              resumoSelecionado.presentes.length,
                            ],
                            ['Faltas', resumoSelecionado.faltas.length],
                            [
                              'Diárias',
                              resumoSelecionado.diariasDaLista.length,
                            ],
                            [
                              'Aprovadas',
                              resumoSelecionado.aprovadas,
                            ],
                            ['Total', moeda(resumoSelecionado.total)],
                          ].map(([rotulo, valor]) => (
                            <div
                              key={String(rotulo)}
                              style={{
                                background: '#faf8fb',
                                border: '1px solid #eee8f0',
                                borderRadius: '11px',
                                padding: '10px',
                              }}
                            >
                              <span
                                style={{
                                  display: 'block',
                                  color: '#938995',
                                  fontSize: '8px',
                                  marginBottom: '4px',
                                }}
                              >
                                {rotulo}
                              </span>
                              <strong
                                style={{
                                  color: '#473a4d',
                                  fontSize: '11px',
                                }}
                              >
                                {valor}
                              </strong>
                            </div>
                          ))}
                        </div>

                        <div
                          style={{
                            padding: '13px 14px',
                            maxHeight: '360px',
                            overflowY: 'auto',
                          }}
                        >
                          <strong
                            style={{
                              display: 'block',
                              color: '#4c404f',
                              fontSize: '10px',
                              marginBottom: '9px',
                            }}
                          >
                            Equipe do dia
                          </strong>

                          {listaSelecionada.diaristas.map((nome) => {
                            const ponto =
                              resumoSelecionado.pontosDoDia.find(
                                (registro) => registro.nome === nome
                              )

                            const diaria =
                              resumoSelecionado.diariasDaLista.find(
                                (registro) => registro.nome === nome
                              )

                            const presente =
                              resumoSelecionado.presentes.includes(nome)

                            return (
                              <div
                                key={nome}
                                style={{
                                  display: 'grid',
                                  gridTemplateColumns:
                                    'minmax(0, 1fr) auto',
                                  gap: '9px',
                                  alignItems: 'center',
                                  padding: '10px 0',
                                  borderBottom: '1px solid #f0ebf1',
                                }}
                              >
                                <div>
                                  <strong
                                    style={{
                                      display: 'block',
                                      color: '#493e4e',
                                      fontSize: '10px',
                                      marginBottom: '3px',
                                    }}
                                  >
                                    {nome}
                                  </strong>

                                  <span
                                    style={{
                                      display: 'block',
                                      color: '#9c939f',
                                      fontSize: '8px',
                                    }}
                                  >
                                    {ponto
                                      ? `${ponto.horario} • ${
                                          ponto.metodo || 'Registro'
                                        }`
                                      : 'Sem registro de ponto'}
                                  </span>
                                </div>

                                <div
                                  style={{
                                    textAlign: 'right',
                                  }}
                                >
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      padding: '4px 7px',
                                      borderRadius: '999px',
                                      background: presente
                                        ? '#e8f7ee'
                                        : '#fdecec',
                                      color: presente
                                        ? '#177647'
                                        : '#aa4646',
                                      fontSize: '8px',
                                      fontWeight: 800,
                                      marginBottom: '3px',
                                    }}
                                  >
                                    {presente
                                      ? 'Presente'
                                      : (listaSelecionada?.ausentes || []).includes(nome)
                                        ? 'Falta'
                                        : 'Pendente'}
                                  </span>

                                  <small
                                    style={{
                                      display: 'block',
                                      color: '#827884',
                                      fontSize: '8px',
                                    }}
                                  >
                                    {diaria
                                      ? moeda(diaria.valor)
                                      : 'Sem diária'}
                                  </small>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div
                          style={{
                            padding: '13px 14px 15px',
                            background: '#fbfafc',
                            borderTop: '1px solid #eee9f0',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              color: '#938a96',
                              fontSize: '8px',
                              marginBottom: '4px',
                            }}
                          >
                            Observação
                          </span>
                          <strong
                            style={{
                              display: 'block',
                              color: '#5a505e',
                              fontSize: '9px',
                              fontWeight: 650,
                              lineHeight: 1.5,
                            }}
                          >
                            {listaSelecionada.observacao || 'Sem observações.'}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )
            })()}
          </>
        )}

        {tela === 'dashboard' && temAcesso('dashboard') && (
          <>
            <div className="dashboard-header">
              <div>
                <span className="dashboard-kicker">VISÃO GERAL</span>

                <h1 className="page-title">Dashboard</h1>

                <p className="page-subtitle">
                  Acompanhe a operação, os pontos e os pagamentos.
                </p>
              </div>

              <div className="dashboard-date">
                <span>Período atual</span>
                <strong>16 a 31 de agosto</strong>
              </div>
            </div>

            <div className="dashboard-cards">
              <div className="dashboard-card">
                <div className="dashboard-card-icon purple">♟</div>
                <div>
                  <span>Funcionários ativos</span>
                  <strong>{funcionariosAtivos}</strong>
                  <small>Trabalhadores cadastrados</small>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon green">✓</div>
                <div>
                  <span>Pontos registrados</span>
                  <strong>{totalRegistrados}</strong>
                  <small>{totalPendentes} pendente(s)</small>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon yellow">◷</div>
                <div>
                  <span>Diárias pendentes</span>
                  <strong>{totalDiariasPendentes}</strong>
                  <small>{moeda(valorDiariasPendentes)}</small>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-icon blue">R$</div>
                <div>
                  <span>Aguardando pagamento</span>
                  <strong>{pagamentosPendentes}</strong>
                  <small>{moeda(valorPendentePagamentos)}</small>
                </div>
              </div>
            </div>

            <div className="dashboard-main-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-label">QUINZENA ATUAL</span>
                    <h2>{fechamentoAtual.periodo}</h2>
                  </div>

                  <span className="closing-status em-revisao">
                    {fechamentoAtual.status}
                  </span>
                </div>

                <div className="fortnight-progress">
                  <div className="progress-top">
                    <span>Andamento do fechamento</span>
                    <strong>{andamentoFechamento}%</strong>
                  </div>

                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${andamentoFechamento}%` }} />
                  </div>
                </div>

                <div className="fortnight-stats">
                  <div>
                    <span>Diárias</span>
                    <strong>{diariasQuinzenaAtual.length}</strong>
                  </div>

                  <div>
                    <span>Valor previsto</span>
                    <strong>{moeda(valorPrevistoQuinzenaAtual)}</strong>
                  </div>

                  <div>
                    <span>Próximo pagamento</span>
                    <strong>{fechamentoAtual.pagamento}</strong>
                  </div>
                </div>

                <button
                  className="dashboard-link-button"
                  onClick={() => setTela('fechamentos')}
                >
                  Ver fechamento completo →
                </button>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-label">ATENÇÃO</span>
                    <h2>Pendências</h2>
                  </div>

                  <span className="pending-number">
                    {totalPendentes +
                      totalDiariasPendentes +
                      pagamentosPendentes}
                  </span>
                </div>

                <button
                  className="pending-item"
                  onClick={() => setTela('ponto')}
                >
                  <span className="pending-dot yellow" />
                  <div>
                    <strong>{totalPendentes} ponto(s) pendente(s)</strong>
                    <small>Trabalhadores sem registro</small>
                  </div>
                  <span>›</span>
                </button>

                <button
                  className="pending-item"
                  onClick={() => setTela('diarias')}
                >
                  <span className="pending-dot purple" />
                  <div>
                    <strong>
                      {totalDiariasPendentes} diária(s) para aprovar
                    </strong>
                    <small>Aguardando conferência</small>
                  </div>
                  <span>›</span>
                </button>

                <button
                  className="pending-item"
                  onClick={() => setTela('pagamentos')}
                >
                  <span className="pending-dot green" />
                  <div>
                    <strong>
                      {pagamentosPendentes} pagamento(s) pendente(s)
                    </strong>
                    <small>Aguardando confirmação</small>
                  </div>
                  <span>›</span>
                </button>
              </div>
            </div>

            <div className="dashboard-bottom-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-label">ACESSO RÁPIDO</span>
                    <h2>Ações rápidas</h2>
                  </div>
                </div>

                <div className="quick-actions">
                  <button
                    onClick={() => {
                      setTela('funcionarios')
                      setMostrarFormulario(true)
                    }}
                  >
                    <span className="quick-icon">＋</span>
                    <div>
                      <strong>Novo funcionário</strong>
                      <small>Realizar cadastro</small>
                    </div>
                  </button>

                  <button onClick={() => setModoAcesso('totem')}>
                    <span className="quick-icon">◉</span>
                    <div>
                      <strong>Abrir Totem</strong>
                      <small>Registrar ponto</small>
                    </div>
                  </button>

                  <button onClick={() => setTela('diarias')}>
                    <span className="quick-icon">R$</span>
                    <div>
                      <strong>Ver diárias</strong>
                      <small>Conferir registros</small>
                    </div>
                  </button>

                  <button onClick={() => setTela('pagamentos')}>
                    <span className="quick-icon">◆</span>
                    <div>
                      <strong>Pagamentos</strong>
                      <small>Consultar PIX</small>
                    </div>
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <span className="section-label">HOJE</span>
                    <h2>Atividade recente</h2>
                  </div>
                </div>

                <div className="activity-list">
                  {registrosPonto
                    .filter((registro) => registro.status === 'Registrado')
                    .map((registro, index) => (
                      <div className="activity-item" key={index}>
                        <div className="activity-time">{registro.horario}</div>

                        <div className="activity-line">
                          <span className="activity-circle green" />

                          <div>
                            <strong>{registro.nome}</strong>
                            <small>registrou o ponto</small>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {tela === 'funcionarios' && temAcesso('funcionarios') && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Funcionários</h1>
                <p className="page-subtitle">
                  Cadastro completo dos trabalhadores.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => setMostrarFormulario(true)}
              >
                + Novo Funcionário
              </button>
            </div>

            <div className="employee-search-box">
              <input
                type="text"
                placeholder="Pesquisar por nome, CPF ou função..."
                value={buscaFuncionario}
                onChange={(e) => setBuscaFuncionario(e.target.value)}
              />

              <span>
                {funcionariosFiltrados.length} funcionário(s) encontrado(s)
              </span>
            </div>

            {mostrarFormulario && (
              <div className="panel form-panel">
                <div className="form-header">
                  <div>
                    <h2>Novo Funcionário</h2>
                    <p className="page-subtitle">
                      Preencha os dados do trabalhador.
                    </p>
                  </div>

                  <button
                    className="close-button"
                    onClick={() => setMostrarFormulario(false)}
                  >
                    ✕
                  </button>
                </div>

                <h3 className="form-section-title">Dados pessoais</h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Nome completo</label>
                    <input
                      value={novoFuncionario.nome}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          nome: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>CPF</label>
                    <input
                      value={novoFuncionario.cpf}
                      inputMode="numeric"
                      maxLength={14}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          cpf: formatarCpf(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Data de nascimento</label>
                    <input
                      type="date"
                      value={novoFuncionario.nascimento}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          nascimento: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Telefone</label>
                    <input
                      value={novoFuncionario.telefone}
                      inputMode="tel"
                      maxLength={15}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          telefone: formatarTelefone(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>E-mail</label>
                    <input
                      value={novoFuncionario.email}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Endereço</label>
                    <input
                      value={novoFuncionario.endereco}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          endereco: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <h3 className="form-section-title">Dados profissionais</h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Data de admissão</label>
                    <input
                      type="date"
                      value={novoFuncionario.admissao}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          admissao: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Função</label>
                    <input
                      value={novoFuncionario.funcao}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          funcao: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Diária-base</label>
                    <input value="R$ 100,00" disabled />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={novoFuncionario.status}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          status: e.target.value as 'Ativo' | 'Inativo',
                        })
                      }
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <h3 className="form-section-title">Dados PIX</h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Tipo da chave</label>

                    <select
                      value={novoFuncionario.tipoPix}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          tipoPix: e.target.value,
                          chavePix: formatarChavePixEntrada(
                            e.target.value,
                            novoFuncionario.chavePix
                          ),
                        })
                      }
                    >
                      <option value="">Selecione</option>
                      <option value="CPF">CPF</option>
                      <option value="Celular">Celular</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Aleatória">Chave aleatória</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Chave PIX</label>
                    <input
                      value={novoFuncionario.chavePix}
                      inputMode={novoFuncionario.tipoPix === 'Celular' ? 'tel' : novoFuncionario.tipoPix === 'CPF' ? 'numeric' : 'text'}
                      maxLength={novoFuncionario.tipoPix === 'CPF' ? 14 : novoFuncionario.tipoPix === 'Celular' ? 15 : 120}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          chavePix: formatarChavePixEntrada(
                            novoFuncionario.tipoPix,
                            e.target.value
                          ),
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Titular</label>
                    <input
                      value={novoFuncionario.titularPix}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          titularPix: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Cidade do titular</label>
                    <input
                      value={novoFuncionario.cidadePix}
                      placeholder="Ex.: Limeira"
                      maxLength={15}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          cidadePix: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <h3 className="form-section-title">Reconhecimento facial</h3>

                <div className="biometric-box">
                  <div className="biometric-photo">👤</div>
                  <div className="biometric-info">
                    <strong style={{ color: '#4b1f6f' }}>Cadastro após salvar o funcionário</strong>
                    <span style={{ color: '#8f8694', fontSize: '10px', lineHeight: 1.5 }}>
                      A biometria facial precisa ser vinculada ao registro definitivo do funcionário. Salve o cadastro e, em seguida, abra o perfil para capturar o rosto pela câmera.
                    </span>
                    <span className="employee-status pending-status">Facial: Pendente</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      setMostrarFormulario(false)
                      setNovoFuncionario(funcionarioVazio)
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    className="primary-button"
                    onClick={salvarFuncionario}
                  >
                    Salvar Funcionário
                  </button>
                </div>
              </div>
            )}

            {funcionarioSelecionado && (() => {
              const pontosFuncionario = registrosPonto.filter(
                (registro) => registro.nome === funcionarioSelecionado.nome
              )

              const diariasFuncionario = diarias.filter(
                (diaria) => diaria.nome === funcionarioSelecionado.nome
              )

              const documentosFuncionario = documentos.filter(
                (documento) =>
                  documento.funcionario === funcionarioSelecionado.nome
              )

              const pagamentosFuncionario = pagamentos.filter(
                (pagamento) => pagamento.nome === funcionarioSelecionado.nome
              )

              const totalDiariasFuncionario = diariasFuncionario.reduce(
                (total, diaria) => total + diaria.valor,
                0
              )

              const totalPagoFuncionario = pagamentosFuncionario
                .filter((pagamento) => pagamento.status === 'Pago')
                .reduce((total, pagamento) => total + pagamento.valorTotal, 0)

              const totalPendenteFuncionario = pagamentosFuncionario
                .filter((pagamento) => pagamento.status === 'Aguardando')
                .reduce((total, pagamento) => total + pagamento.valorTotal, 0)

              const estiloCard = {
                background: '#ffffff',
                border: '1px solid #ebe7ee',
                borderRadius: '18px',
                padding: '18px',
              }

              const estiloLabel = {
                color: '#95899b',
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.5px',
              }

              const abrirModulo = (
                modulo: Tela,
                definirBusca: (valor: string) => void
              ) => {
                definirBusca(funcionarioSelecionado.nome)
                setTela(modulo)
                setFuncionarioSelecionado(null)
              }

              return (
                <div
                  style={{
                    marginBottom: '24px',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    background: '#faf9fb',
                    border: '1px solid #e9e3ed',
                    boxShadow: '0 14px 40px rgba(55, 28, 70, 0.10)',
                  }}
                >
                  <div
                    style={{
                      padding: '26px 28px',
                      background:
                        'linear-gradient(135deg, #35134f 0%, #4b1f6f 50%, #743598 100%)',
                      color: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '22px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '1.5px',
                          opacity: 0.65,
                        }}
                      >
                        FICHA DO TRABALHADOR
                      </span>

                      <button
                        onClick={() => {
                          setFuncionarioSelecionado(null)
                          cancelarEdicaoFuncionario()
                        }}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          border: '1px solid rgba(255,255,255,.22)',
                          background: 'rgba(255,255,255,.10)',
                          color: '#fff',
                          fontSize: '20px',
                          cursor: 'pointer',
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          width: '82px',
                          height: '82px',
                          borderRadius: '24px',
                          background: '#ffffff',
                          color: '#4b1f6f',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '26px',
                          fontWeight: 850,
                          boxShadow: '0 12px 28px rgba(20,8,28,.22)',
                        }}
                      >
                        {funcionarioSelecionado.nome
                          .split(' ')
                          .slice(0, 2)
                          .map((parte) => parte.charAt(0))
                          .join('')}
                      </div>

                      <div style={{ flex: 1, minWidth: '220px' }}>
                        <h2
                          style={{
                            margin: 0,
                            fontSize: '27px',
                            color: '#fff',
                          }}
                        >
                          {funcionarioSelecionado.nome}
                        </h2>

                        <p
                          style={{
                            margin: '5px 0 15px',
                            color: 'rgba(255,255,255,.68)',
                          }}
                        >
                          {funcionarioSelecionado.funcao}
                        </p>

                        <div
                          style={{
                            display: 'flex',
                            gap: '22px',
                            flexWrap: 'wrap',
                            fontSize: '11px',
                          }}
                        >
                          <span>
                            <small style={{ opacity: 0.55 }}>CPF</small>
                            <br />
                            <strong>{funcionarioSelecionado.cpf}</strong>
                          </span>

                          <span>
                            <small style={{ opacity: 0.55 }}>ADMISSÃO</small>
                            <br />
                            <strong>{funcionarioSelecionado.admissao}</strong>
                          </span>

                          <span>
                            <small style={{ opacity: 0.55 }}>FACIAL</small>
                            <br />
                            <strong>
                              {funcionarioSelecionado.facial === 'Cadastrado'
                                ? '✓ Cadastrado'
                                : '● Pendente'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '10px',
                        }}
                      >
                        <span
                          style={{
                            padding: '8px 12px',
                            borderRadius: '999px',
                            background:
                              funcionarioSelecionado.status === 'Ativo'
                                ? 'rgba(57,210,124,.16)'
                                : 'rgba(255,100,100,.16)',
                            border:
                              funcionarioSelecionado.status === 'Ativo'
                                ? '1px solid rgba(100,235,160,.25)'
                                : '1px solid rgba(255,160,160,.25)',
                            color:
                              funcionarioSelecionado.status === 'Ativo'
                                ? '#c5f7d8'
                                : '#ffd0d0',
                            fontSize: '11px',
                            fontWeight: 800,
                          }}
                        >
                          ● {funcionarioSelecionado.status}
                        </span>

                        {usuarioLogado?.perfil === 'Administrador' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                iniciarEdicaoFuncionario(funcionarioSelecionado)
                              }
                              style={{
                                padding: '9px 13px',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,255,255,.30)',
                                background: 'rgba(255,255,255,.14)',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              ✎ Editar informações
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                alternarStatusFuncionario(funcionarioSelecionado)
                              }
                              style={{
                                padding: '9px 13px',
                                borderRadius: '10px',
                                border:
                                  funcionarioSelecionado.status === 'Ativo'
                                    ? '1px solid rgba(255,170,170,.35)'
                                    : '1px solid rgba(150,240,185,.35)',
                                background:
                                  funcionarioSelecionado.status === 'Ativo'
                                    ? 'rgba(170,35,55,.28)'
                                    : 'rgba(35,155,85,.28)',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              {funcionarioSelecionado.status === 'Ativo'
                                ? 'Desativar funcionário'
                                : 'Reativar funcionário'}
                            </button>

                            <button
                              type="button"
                              onClick={() => void excluirFuncionario(funcionarioSelecionado)}
                              style={{
                                padding: '9px 13px',
                                borderRadius: '10px',
                                border: '1px solid rgba(255,170,170,.42)',
                                background: 'rgba(125,20,35,.42)',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              Excluir funcionário
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {editandoFuncionario && funcionarioEmEdicao && (
                    <div
                      style={{
                        margin: '20px 22px 0',
                        padding: '22px',
                        background: '#ffffff',
                        border: '1px solid #dfd5e4',
                        borderRadius: '18px',
                        boxShadow: '0 10px 28px rgba(55, 28, 70, 0.08)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '14px',
                          flexWrap: 'wrap',
                          marginBottom: '18px',
                        }}
                      >
                        <div>
                          <span style={estiloLabel}>EDIÇÃO DO CADASTRO</span>
                          <h3 style={{ margin: '5px 0 4px', color: '#35283d' }}>
                            Alterar informações do funcionário
                          </h3>
                          <p
                            style={{
                              margin: 0,
                              color: '#817786',
                              fontSize: '12px',
                            }}
                          >
                            As alterações serão salvas no cadastro e registradas na auditoria.
                          </p>
                        </div>

                        <span
                          style={{
                            padding: '7px 10px',
                            borderRadius: '999px',
                            background: '#f5eff9',
                            color: '#4b1f6f',
                            fontSize: '10px',
                            fontWeight: 800,
                          }}
                        >
                          Acesso: Administrador
                        </span>
                      </div>

                      <h4 className="form-section-title">Dados pessoais</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Nome completo</label>
                          <input
                            value={funcionarioEmEdicao.nome}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                nome: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>CPF</label>
                          <input
                            value={funcionarioEmEdicao.cpf}
                            inputMode="numeric"
                            maxLength={14}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                cpf: formatarCpf(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Data de nascimento</label>
                          <input
                            type="date"
                            value={funcionarioEmEdicao.nascimento}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                nascimento: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Telefone</label>
                          <input
                            value={funcionarioEmEdicao.telefone}
                            inputMode="tel"
                            maxLength={15}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                telefone: formatarTelefone(e.target.value),
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>E-mail</label>
                          <input
                            type="email"
                            value={funcionarioEmEdicao.email}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                email: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Endereço</label>
                          <input
                            value={funcionarioEmEdicao.endereco}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                endereco: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <h4 className="form-section-title">Dados profissionais</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Data de admissão</label>
                          <input
                            type="date"
                            value={funcionarioEmEdicao.admissao}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                admissao: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Função</label>
                          <input
                            value={funcionarioEmEdicao.funcao}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                funcao: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Diária-base</label>
                          <input value={funcionarioEmEdicao.diaria} disabled />
                        </div>

                        <div className="form-group">
                          <label>Reconhecimento facial</label>
                          <select
                            value={funcionarioEmEdicao.facial}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                facial: e.target.value as
                                  | 'Cadastrado'
                                  | 'Pendente',
                              })
                            }
                          >
                            <option value="Cadastrado">Cadastrado</option>
                            <option value="Pendente">Pendente</option>
                          </select>
                        </div>
                      </div>

                      <h4 className="form-section-title">Dados PIX</h4>
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Tipo da chave</label>
                          <select
                            value={funcionarioEmEdicao.tipoPix}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                tipoPix: e.target.value,
                                chavePix: formatarChavePixEntrada(
                                  e.target.value,
                                  funcionarioEmEdicao.chavePix
                                ),
                              })
                            }
                          >
                            <option value="">Selecione</option>
                            <option value="CPF">CPF</option>
                            <option value="Celular">Celular</option>
                            <option value="E-mail">E-mail</option>
                            <option value="Aleatória">Chave aleatória</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Chave PIX</label>
                          <input
                            value={funcionarioEmEdicao.chavePix}
                            inputMode={funcionarioEmEdicao.tipoPix === 'Celular' ? 'tel' : funcionarioEmEdicao.tipoPix === 'CPF' ? 'numeric' : 'text'}
                            maxLength={funcionarioEmEdicao.tipoPix === 'CPF' ? 14 : funcionarioEmEdicao.tipoPix === 'Celular' ? 15 : 120}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                chavePix: formatarChavePixEntrada(
                                  funcionarioEmEdicao.tipoPix,
                                  e.target.value
                                ),
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Titular</label>
                          <input
                            value={funcionarioEmEdicao.titularPix}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                titularPix: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Cidade do titular</label>
                          <input
                            value={funcionarioEmEdicao.cidadePix}
                            placeholder="Ex.: Limeira"
                            maxLength={15}
                            onChange={(e) =>
                              setFuncionarioEmEdicao({
                                ...funcionarioEmEdicao,
                                cidadePix: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={cancelarEdicaoFuncionario}
                        >
                          Cancelar edição
                        </button>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={salvarEdicaoFuncionario}
                        >
                          Salvar alterações
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      padding: '18px 22px 0',
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {[
                      {
                        titulo: 'Pontos registrados',
                        valor: pontosFuncionario.filter(
                          (registro) => registro.status === 'Registrado'
                        ).length,
                        detalhe: `${pontosFuncionario.length} registro(s)`,
                      },
                      {
                        titulo: 'Diárias',
                        valor: diariasFuncionario.length,
                        detalhe: moeda(totalDiariasFuncionario),
                      },
                      {
                        titulo: 'Total pago',
                        valor: moeda(totalPagoFuncionario),
                        detalhe: 'Pagamentos confirmados',
                      },
                      {
                        titulo: 'A receber',
                        valor: moeda(totalPendenteFuncionario),
                        detalhe: 'Valores pendentes',
                      },
                    ].map((item) => (
                      <div key={item.titulo} style={estiloCard}>
                        <span style={estiloLabel}>{item.titulo}</span>
                        <strong
                          style={{
                            display: 'block',
                            marginTop: '7px',
                            color: '#34253d',
                            fontSize: '20px',
                          }}
                        >
                          {item.valor}
                        </strong>
                        <small style={{ color: '#a097a5' }}>
                          {item.detalhe}
                        </small>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      padding: '20px 22px 0',
                      display: 'flex',
                      gap: '6px',
                      flexWrap: 'wrap',
                      borderBottom: '1px solid #e8e2eb',
                    }}
                  >
                    {[
                      ['resumo', 'Visão geral'],
                      ['ponto', `Ponto (${pontosFuncionario.length})`],
                      ['diarias', `Diárias (${diariasFuncionario.length})`],
                      [
                        'documentos',
                        `Documentos (${documentosFuncionario.length})`,
                      ],
                      [
                        'pagamentos',
                        `Pagamentos (${pagamentosFuncionario.length})`,
                      ],
                    ].map(([id, titulo]) => (
                      <button
                        key={id}
                        onClick={() =>
                          setAbaFichaFuncionario(
                            id as
                              | 'resumo'
                              | 'ponto'
                              | 'diarias'
                              | 'documentos'
                              | 'pagamentos'
                          )
                        }
                        style={{
                          border: 'none',
                          borderBottom:
                            abaFichaFuncionario === id
                              ? '3px solid #4b1f6f'
                              : '3px solid transparent',
                          background: 'transparent',
                          color:
                            abaFichaFuncionario === id ? '#4b1f6f' : '#817786',
                          padding: '12px 14px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {titulo}
                      </button>
                    ))}
                  </div>

                  <div style={{ padding: '22px' }}>
                    {abaFichaFuncionario === 'resumo' && (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(auto-fit, minmax(300px, 1fr))',
                          gap: '15px',
                        }}
                      >
                        <div style={estiloCard}>
                          <h3
                            style={{
                              margin: '0 0 16px',
                              color: '#35283d',
                              fontSize: '15px',
                            }}
                          >
                            Dados pessoais
                          </h3>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fit, minmax(150px, 1fr))',
                              gap: '10px',
                            }}
                          >
                            {[
                              ['Nome completo', funcionarioSelecionado.nome],
                              ['CPF', funcionarioSelecionado.cpf],
                              [
                                'Nascimento',
                                funcionarioSelecionado.nascimento ||
                                  'Não informado',
                              ],
                              ['Telefone', funcionarioSelecionado.telefone],
                              [
                                'E-mail',
                                funcionarioSelecionado.email || 'Não informado',
                              ],
                              [
                                'Endereço',
                                funcionarioSelecionado.endereco ||
                                  'Não informado',
                              ],
                            ].map(([label, valor]) => (
                              <div
                                key={label}
                                style={{
                                  padding: '12px',
                                  borderRadius: '11px',
                                  background: '#faf8fb',
                                }}
                              >
                                <span style={estiloLabel}>{label}</span>
                                <strong
                                  style={{
                                    display: 'block',
                                    marginTop: '5px',
                                    color: '#403347',
                                    fontSize: '11px',
                                    overflowWrap: 'anywhere',
                                  }}
                                >
                                  {valor}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={estiloCard}>
                          <h3
                            style={{
                              margin: '0 0 16px',
                              color: '#35283d',
                              fontSize: '15px',
                            }}
                          >
                            Dados profissionais
                          </h3>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '10px',
                            }}
                          >
                            {[
                              ['Função', funcionarioSelecionado.funcao],
                              ['Admissão', funcionarioSelecionado.admissao],
                              ['Diária-base', funcionarioSelecionado.diaria],
                              ['Situação', funcionarioSelecionado.status],
                            ].map(([label, valor]) => (
                              <div
                                key={label}
                                style={{
                                  padding: '12px',
                                  borderRadius: '11px',
                                  background: '#faf8fb',
                                }}
                              >
                                <span style={estiloLabel}>{label}</span>
                                <strong
                                  style={{
                                    display: 'block',
                                    marginTop: '5px',
                                    color: '#403347',
                                    fontSize: '11px',
                                  }}
                                >
                                  {valor}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div
                          style={{
                            ...estiloCard,
                            gridColumn: '1 / -1',
                            background:
                              'linear-gradient(135deg,#fbf8fc,#f5eef8)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div>
                              <span style={estiloLabel}>
                                DADOS BANCÁRIOS / PIX
                              </span>
                              <h3
                                style={{
                                  margin: '4px 0 0',
                                  color: '#4b1f6f',
                                }}
                              >
                                Pagamento do trabalhador
                              </h3>
                            </div>

                            <span
                              style={{
                                padding: '7px 10px',
                                borderRadius: '999px',
                                background: '#e8f8ee',
                                color: '#16804c',
                                fontSize: '10px',
                                fontWeight: 800,
                              }}
                            >
                              ✓ Dados cadastrados
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '10px',
                              marginTop: '16px',
                            }}
                          >
                            <div
                              style={{
                                padding: '13px',
                                background: '#fff',
                                borderRadius: '12px',
                              }}
                            >
                              <span style={estiloLabel}>Tipo da chave</span>
                              <strong
                                style={{
                                  display: 'block',
                                  marginTop: '5px',
                                  color: '#4b1f6f',
                                }}
                              >
                                {funcionarioSelecionado.tipoPix ||
                                  'Não informado'}
                              </strong>
                            </div>

                            <div
                              style={{
                                padding: '13px',
                                background: '#fff',
                                borderRadius: '12px',
                              }}
                            >
                              <span style={estiloLabel}>Chave PIX</span>
                              <strong
                                style={{
                                  display: 'block',
                                  marginTop: '5px',
                                  color: '#4b1f6f',
                                  overflowWrap: 'anywhere',
                                }}
                              >
                                {funcionarioSelecionado.chavePix ||
                                  'Não cadastrada'}
                              </strong>

                              {funcionarioSelecionado.chavePix && (
                                <button
                                  onClick={() =>
                                    copiarChavePix(
                                      funcionarioSelecionado.chavePix
                                    )
                                  }
                                  style={{
                                    marginTop: '8px',
                                    border: '1px solid #d7c5e0',
                                    borderRadius: '8px',
                                    background: '#fff',
                                    color: '#4b1f6f',
                                    padding: '7px 10px',
                                    fontSize: '10px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Copiar chave
                                </button>
                              )}
                            </div>

                            <div
                              style={{
                                padding: '13px',
                                background: '#fff',
                                borderRadius: '12px',
                              }}
                            >
                              <span style={estiloLabel}>Titular</span>
                              <strong
                                style={{
                                  display: 'block',
                                  marginTop: '5px',
                                  color: '#4b1f6f',
                                }}
                              >
                                {funcionarioSelecionado.titularPix ||
                                  funcionarioSelecionado.nome}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div style={estiloCard}>
                          <span style={estiloLabel}>
                            RECONHECIMENTO FACIAL
                          </span>
                          <h3
                            style={{
                              color:
                                funcionarioSelecionado.facial === 'Cadastrado'
                                  ? '#16804c'
                                  : '#a96d00',
                              margin: '7px 0 6px',
                            }}
                          >
                            {funcionarioSelecionado.facial === 'Cadastrado'
                              ? '✓ Identificação cadastrada'
                              : '! Cadastro pendente'}
                          </h3>
                          <p
                            style={{
                              color: '#8f8694',
                              fontSize: '11px',
                              margin: 0,
                              lineHeight: 1.5,
                            }}
                          >
                            {funcionarioSelecionado.facial === 'Cadastrado'
                              ? 'Trabalhador liberado para identificação no terminal de ponto.'
                              : 'O reconhecimento facial ainda precisa ser cadastrado.'}
                          </p>

                          {usuarioLogado?.perfil === 'Administrador' && (
                            <button
                              className="action-button"
                              onClick={() => abrirCadastroFacial(funcionarioSelecionado)}
                              style={{ marginTop: '12px' }}
                            >
                              {funcionarioSelecionado.facial === 'Cadastrado'
                                ? 'Recadastrar biometria facial'
                                : 'Cadastrar biometria facial'}
                            </button>
                          )}
                        </div>

                        <div style={estiloCard}>
                          <span style={estiloLabel}>ATALHOS</span>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '8px',
                              marginTop: '10px',
                            }}
                          >
                            <button
                              className="action-button"
                              onClick={() =>
                                abrirModulo('ponto', setBuscaPonto)
                              }
                            >
                              Controle de Ponto
                            </button>

                            <button
                              className="action-button"
                              onClick={() =>
                                abrirModulo('diarias', setBuscaDiaria)
                              }
                            >
                              Ver Diárias
                            </button>

                            <button
                              className="action-button"
                              onClick={() =>
                                abrirModulo('documentos', setBuscaDocumento)
                              }
                            >
                              Documentos
                            </button>

                            <button
                              className="action-button"
                              onClick={() =>
                                abrirModulo('pagamentos', setBuscaPagamento)
                              }
                            >
                              Pagamentos
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {abaFichaFuncionario === 'ponto' && (
                      <div style={estiloCard}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <span style={estiloLabel}>HISTÓRICO</span>
                            <h3 style={{ margin: '4px 0 0' }}>
                              Registros de ponto
                            </h3>
                          </div>

                          <button
                            className="action-button"
                            onClick={() =>
                              abrirModulo('ponto', setBuscaPonto)
                            }
                          >
                            Abrir Controle de Ponto
                          </button>
                        </div>

                        <div className="table-wrapper">
                          <table className="employees-table">
                            <thead>
                              <tr>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Função</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pontosFuncionario.length > 0 ? (
                                pontosFuncionario.map((registro, index) => (
                                  <tr key={index}>
                                    <td>{registro.data}</td>
                                    <td>{registro.horario}</td>
                                    <td>{registro.funcao}</td>
                                    <td>
                                      <span
                                        className={
                                          registro.status === 'Registrado'
                                            ? 'employee-status active-status'
                                            : 'employee-status pending-status'
                                        }
                                      >
                                        {registro.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4}>
                                    Nenhum ponto localizado.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {abaFichaFuncionario === 'diarias' && (
                      <div style={estiloCard}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <span style={estiloLabel}>
                              HISTÓRICO FINANCEIRO
                            </span>
                            <h3 style={{ margin: '4px 0 0' }}>
                              Diárias do trabalhador
                            </h3>
                          </div>

                          <button
                            className="action-button"
                            onClick={() =>
                              abrirModulo('diarias', setBuscaDiaria)
                            }
                          >
                            Abrir Diárias
                          </button>
                        </div>

                        <div className="table-wrapper">
                          <table className="employees-table">
                            <thead>
                              <tr>
                                <th>Data</th>
                                <th>Dia</th>
                                <th>Base</th>
                                <th>Adicional</th>
                                <th>VT</th>
                                <th>VR</th>
                                <th>Total</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {diariasFuncionario.length > 0 ? (
                                diariasFuncionario.map((diaria, index) => (
                                  <tr key={index}>
                                    <td>{diaria.data}</td>
                                    <td>{obterDiaSemana(diaria.data)}</td>
                                    <td>{moeda(diaria.diariaBase)}</td>
                                    <td>{moeda(diaria.adicional)}</td>
                                    <td>{moeda(diaria.vt)}</td>
                                    <td>{moeda(diaria.vr)}</td>
                                    <td>
                                      <strong>{moeda(diaria.valor)}</strong>
                                    </td>
                                    <td>
                                      <span
                                        className={
                                          diaria.status === 'Aprovada'
                                            ? 'employee-status active-status'
                                            : 'employee-status pending-status'
                                        }
                                      >
                                        {diaria.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={8}>
                                    Nenhuma diária localizada.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {abaFichaFuncionario === 'documentos' && (
                      <div style={estiloCard}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <span style={estiloLabel}>ARQUIVO DIGITAL</span>
                            <h3 style={{ margin: '4px 0 0' }}>
                              Documentos do trabalhador
                            </h3>
                          </div>

                          <button
                            className="action-button"
                            onClick={() =>
                              abrirModulo('documentos', setBuscaDocumento)
                            }
                          >
                            Abrir Documentos
                          </button>
                        </div>

                        <div className="table-wrapper">
                          <table className="employees-table">
                            <thead>
                              <tr>
                                <th>Documento</th>
                                <th>Tipo</th>
                                <th>Envio</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {documentosFuncionario.length > 0 ? (
                                documentosFuncionario.map(
                                  (documento, index) => (
                                    <tr key={index}>
                                      <td>
                                        <strong>{documento.nome}</strong>
                                      </td>
                                      <td>{documento.tipo}</td>
                                      <td>{documento.dataEnvio}</td>
                                      <td>
                                        <span
                                          className={
                                            documento.status === 'Ativo'
                                              ? 'employee-status active-status'
                                              : 'employee-status pending-status'
                                          }
                                        >
                                          {documento.status}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                )
                              ) : (
                                <tr>
                                  <td colSpan={4}>
                                    Nenhum documento localizado.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {abaFichaFuncionario === 'pagamentos' && (
                      <div style={estiloCard}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '15px',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <span style={estiloLabel}>FINANCEIRO</span>
                            <h3 style={{ margin: '4px 0 0' }}>
                              Histórico de pagamentos
                            </h3>
                          </div>

                          <button
                            className="action-button"
                            onClick={() =>
                              abrirModulo('pagamentos', setBuscaPagamento)
                            }
                          >
                            Abrir Pagamentos
                          </button>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '10px',
                            marginBottom: '16px',
                          }}
                        >
                          <div
                            style={{
                              padding: '14px',
                              borderRadius: '12px',
                              background: '#eefaf3',
                            }}
                          >
                            <span style={estiloLabel}>Total pago</span>
                            <strong
                              style={{
                                display: 'block',
                                marginTop: '5px',
                                color: '#16804c',
                                fontSize: '20px',
                              }}
                            >
                              {moeda(totalPagoFuncionario)}
                            </strong>
                          </div>

                          <div
                            style={{
                              padding: '14px',
                              borderRadius: '12px',
                              background: '#fff8e8',
                            }}
                          >
                            <span style={estiloLabel}>A receber</span>
                            <strong
                              style={{
                                display: 'block',
                                marginTop: '5px',
                                color: '#a86b00',
                                fontSize: '20px',
                              }}
                            >
                              {moeda(totalPendenteFuncionario)}
                            </strong>
                          </div>
                        </div>

                        <div className="table-wrapper">
                          <table className="employees-table">
                            <thead>
                              <tr>
                                <th>Período</th>
                                <th>Diárias</th>
                                <th>Valor</th>
                                <th>PIX</th>
                                <th>Status</th>
                                <th>Pagamento</th>
                                <th>Ação</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pagamentosFuncionario.length > 0 ? (
                                pagamentosFuncionario.map(
                                  (pagamento, index) => (
                                    <tr key={index}>
                                      <td>{pagamento.periodo}</td>
                                      <td>
                                        {pagamento.quantidadeDiarias}
                                      </td>
                                      <td>
                                        <strong>
                                          {moeda(pagamento.valorTotal)}
                                        </strong>
                                      </td>
                                      <td>{pagamento.pix}</td>
                                      <td>
                                        <span
                                          className={
                                            pagamento.status === 'Pago'
                                              ? 'employee-status active-status'
                                              : 'employee-status pending-status'
                                          }
                                        >
                                          {pagamento.status}
                                        </span>
                                      </td>
                                      <td>{pagamento.dataPagamento}</td>
                                      <td>
                                        <button
                                          className="pix-button"
                                          onClick={() =>
                                            setPagamentoPixSelecionado(
                                              pagamento
                                            )
                                          }
                                        >
                                          ◫ Ver PIX
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                )
                              ) : (
                                <tr>
                                  <td colSpan={7}>
                                    Nenhum pagamento localizado.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}


            <div className="panel">
              <div className="table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Função</th>
                      <th>PIX</th>
                      <th>Facial</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {funcionariosFiltrados.map((funcionario, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{funcionario.nome}</strong>
                        </td>
                        <td>{funcionario.cpf}</td>
                        <td>{funcionario.funcao}</td>
                        <td>{funcionario.tipoPix || '-'}</td>
                        <td>{funcionario.facial}</td>
                        <td>
                          <span
                            className={
                              funcionario.status === 'Ativo'
                                ? 'employee-status active-status'
                                : 'employee-status inactive-status'
                            }
                          >
                            {funcionario.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="action-button"
                            onClick={() => {
                              setFuncionarioSelecionado(funcionario)
                              setAbaFichaFuncionario('resumo')
                            }}
                          >
                            Ver cadastro
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tela === 'ponto' && temAcesso('ponto') && (
          <>
            {(() => {
              const registrosFaciais = registrosPonto.filter(
                (registro) =>
                  registro.status === 'Registrado' &&
                  registro.metodo !== 'Manual'
              ).length

              const ultimoRegistro = [...registrosPonto]
                .filter((registro) => registro.status === 'Registrado')
                .reverse()[0]

              const pontoCard = {
                background: '#ffffff',
                border: '1px solid #ebe5ed',
                borderRadius: '18px',
                padding: '19px',
                boxShadow: '0 8px 22px rgba(60, 36, 72, 0.055)',
              }

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: '20px',
                      marginBottom: '24px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          color: '#6b3c83',
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '1.15px',
                          textTransform: 'uppercase',
                          marginBottom: '7px',
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#6b3c83',
                          }}
                        />
                        Central operacional
                      </span>

                      <h1
                        className="page-title"
                        style={{ marginBottom: '7px', color: '#2f2435' }}
                      >
                        Controle de Ponto
                      </h1>

                      <p className="page-subtitle">
                        Acompanhe presença, registros faciais e pendências em tempo real.
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '9px',
                        padding: '11px 14px',
                        borderRadius: '12px',
                        background: '#ecfdf3',
                        border: '1px solid #c8efd9',
                        color: '#18784a',
                        fontSize: '11px',
                        fontWeight: 750,
                      }}
                    >
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: '#2fb66d',
                          boxShadow: '0 0 0 4px rgba(47,182,109,.11)',
                        }}
                      />
                      Totem online
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(205px, 1fr))',
                      gap: '14px',
                      marginBottom: '18px',
                    }}
                  >
                    {[
                      {
                        titulo: 'Presentes hoje',
                        valor: totalRegistrados,
                        detalhe: `${registrosPonto.length} trabalhadores previstos`,
                        icone: '✓',
                        fundo: '#e9f8ef',
                        cor: '#17804c',
                      },
                      {
                        titulo: 'Ainda não registraram',
                        valor: totalPendentes,
                        detalhe:
                          totalPendentes === 0
                            ? 'Nenhuma pendência'
                            : 'Aguardando registro de entrada',
                        icone: '◷',
                        fundo: '#fff5dc',
                        cor: '#a86d00',
                      },
                      {
                        titulo: 'Registros faciais',
                        valor: registrosFaciais,
                        detalhe: 'Reconhecimento facial',
                        icone: '◉',
                        fundo: '#f1e9f5',
                        cor: '#5a2776',
                      },
                      {
                        titulo: 'Último registro',
                        valor: ultimoRegistro?.horario || '--:--',
                        detalhe: ultimoRegistro?.nome || 'Nenhum registro',
                        icone: '↗',
                        fundo: '#eaf1ff',
                        cor: '#285dc2',
                      },
                    ].map((card) => (
                      <div key={card.titulo} style={pontoCard}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '14px',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: 'block',
                                color: '#766d7a',
                                fontSize: '12px',
                                fontWeight: 650,
                                marginBottom: '8px',
                              }}
                            >
                              {card.titulo}
                            </span>

                            <strong
                              style={{
                                display: 'block',
                                color: '#302437',
                                fontSize: '29px',
                                lineHeight: 1,
                                fontWeight: 800,
                                letterSpacing: '-0.65px',
                                marginBottom: '9px',
                              }}
                            >
                              {card.valor}
                            </strong>

                            <small
                              style={{
                                display: 'block',
                                color: '#948b98',
                                fontSize: '11px',
                                lineHeight: 1.4,
                              }}
                            >
                              {card.detalhe}
                            </small>
                          </div>

                          <span
                            style={{
                              width: '40px',
                              height: '40px',
                              minWidth: '40px',
                              borderRadius: '12px',
                              background: card.fundo,
                              color: card.cor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '15px',
                              fontWeight: 800,
                            }}
                          >
                            {card.icone}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #ebe5ed',
                      borderRadius: '18px',
                      padding: '19px',
                      marginBottom: '18px',
                      boxShadow: '0 8px 22px rgba(60, 36, 72, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            display: 'block',
                            color: '#3c3042',
                            fontSize: '14px',
                            marginBottom: '3px',
                          }}
                        >
                          Filtros de registros
                        </strong>
                        <span style={{ color: '#948b98', fontSize: '11px' }}>
                          Localize um trabalhador, data ou situação.
                        </span>
                      </div>

                      <button
                        className="clear-filter-button"
                        onClick={limparFiltrosPonto}
                      >
                        Limpar filtros
                      </button>
                    </div>

                    <div className="filter-grid filter-grid-3">
                      <div className="filter-field">
                        <label>Pesquisar</label>
                        <input
                          placeholder="Nome ou função..."
                          value={buscaPonto}
                          onChange={(e) => setBuscaPonto(e.target.value)}
                        />
                      </div>

                      <div className="filter-field">
                        <label>Data</label>
                        <input
                          type="date"
                          value={dataPontoFiltro}
                          onChange={(e) => setDataPontoFiltro(e.target.value)}
                        />
                      </div>

                      <div className="filter-field">
                        <label>Status</label>
                        <select
                          value={statusPontoFiltro}
                          onChange={(e) => setStatusPontoFiltro(e.target.value)}
                        >
                          <option value="Todos">Todos</option>
                          <option value="Registrado">Registrado</option>
                          <option value="Pendente">Pendente</option>
                        </select>
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: '13px',
                        color: '#8f8593',
                        fontSize: '11px',
                      }}
                    >
                      {registrosPontoFiltrados.length} registro(s) encontrado(s)
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #ebe5ed',
                      borderRadius: '18px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 22px rgba(60, 36, 72, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '15px',
                        padding: '19px 20px',
                        borderBottom: '1px solid #eee9f0',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            display: 'block',
                            color: '#35293c',
                            fontSize: '15px',
                            marginBottom: '3px',
                          }}
                        >
                          Registros de entrada
                        </strong>
                        <span style={{ color: '#928894', fontSize: '11px' }}>
                          Histórico operacional do ponto.
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap' }}>
                        {podeEditar && (
                          <button
                            className="secondary-button"
                            onClick={() => abrirAjustePonto()}
                            style={{ padding: '10px 14px', fontSize: '11px' }}
                          >
                            ✎ Ajustar ponto
                          </button>
                        )}

                        <button
                          className="primary-button"
                          onClick={() => setModoAcesso('totem')}
                          style={{ padding: '10px 14px', fontSize: '11px' }}
                        >
                          ◉ Abrir Totem
                        </button>
                      </div>
                    </div>

                    <div className="table-wrapper">
                      <table className="employees-table">
                        <thead>
                          <tr>
                            <th>Funcionário</th>
                            <th>Função</th>
                            <th>Data</th>
                            <th>Horário</th>
                            <th>Método</th>
                            <th>Status</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registrosPontoFiltrados.map(
                            ({ registro, indexOriginal }) => (
                              <tr key={indexOriginal}>
                                <td>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '10px',
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: '34px',
                                        height: '34px',
                                        minWidth: '34px',
                                        borderRadius: '10px',
                                        background: '#f1e9f5',
                                        color: '#5a2776',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                      }}
                                    >
                                      {registro.nome
                                        .split(' ')
                                        .slice(0, 2)
                                        .map((parte) => parte[0])
                                        .join('')}
                                    </span>
                                    <strong>{registro.nome}</strong>
                                  </div>
                                </td>
                                <td>{registro.funcao}</td>
                                <td>{registro.data}</td>
                                <td>
                                  <strong>
                                    {registro.horario}
                                  </strong>
                                </td>
                                <td>
                                  {registro.status === 'Registrado' ? (
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '10px',
                                        color:
                                          registro.metodo === 'Manual'
                                            ? '#715f79'
                                            : '#5a2776',
                                        fontWeight: 650,
                                      }}
                                    >
                                      <span
                                        style={{
                                          width: '7px',
                                          height: '7px',
                                          borderRadius: '50%',
                                          background:
                                            registro.metodo === 'Manual'
                                              ? '#9c8ea3'
                                              : '#6b3c83',
                                        }}
                                      />
                                      {registro.metodo || 'Sistema'}
                                      {registro.tipoRegistro
                                        ? ` • ${registro.tipoRegistro}`
                                        : ''}
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        color: '#aaa1ad',
                                        fontSize: '10px',
                                      }}
                                    >
                                      Aguardando
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <span
                                    className={
                                      registro.status === 'Registrado'
                                        ? 'employee-status active-status'
                                        : 'employee-status pending-status'
                                    }
                                  >
                                    {registro.status}
                                  </span>
                                </td>
                                <td>
                                  {registro.status === 'Pendente' ? (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                      <button
                                        className="action-button"
                                        onClick={() =>
                                          abrirAjustePonto(registro)
                                        }
                                      >
                                        Ajustar {registro.tipoRegistro || 'Entrada'}
                                      </button>
                                      {podeEditar && (
                                        <button
                                          className="action-button"
                                          onClick={() => void ajustarTurnoBase(registro)}
                                          disabled={ajustePontoSalvando}
                                          title={`Registrar Entrada ${configuracaoValores.horarioEntradaPadrao} e Saída ${configuracaoValores.horarioSaidaPadrao}`}
                                          style={{
                                            color: '#5a2776',
                                            borderColor: '#d9c8e2',
                                            background: '#faf6fc',
                                          }}
                                        >
                                          Turno base {configuracaoValores.horarioEntradaPadrao}–{configuracaoValores.horarioSaidaPadrao}
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                      <button
                                        className="action-button"
                                        onClick={() =>
                                          setRegistroPontoSelecionado(registro)
                                        }
                                      >
                                        Ver detalhes
                                      </button>
                                      {podeEditar && (
                                        <button
                                          className="action-button"
                                          onClick={() => void excluirRegistroPonto(registro)}
                                          style={{
                                            color: '#a33f49',
                                            borderColor: '#ecc9cd',
                                            background: '#fff7f7',
                                          }}
                                        >
                                          Excluir
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>

                      {registrosPontoFiltrados.length === 0 && (
                        <div className="empty-filter-result">
                          Nenhum registro encontrado com esses filtros.
                        </div>
                      )}
                    </div>
                  </div>

                  {ajustePontoAberto && (
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9998,
                        background: 'rgba(26, 15, 33, .62)',
                        backdropFilter: 'blur(6px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '18px',
                      }}
                      onClick={() => !ajustePontoSalvando && setAjustePontoAberto(false)}
                    >
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '610px',
                          maxHeight: '92vh',
                          overflowY: 'auto',
                          background: '#ffffff',
                          borderRadius: '22px',
                          boxShadow: '0 28px 70px rgba(30, 15, 40, .30)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            padding: '21px 23px',
                            background: 'linear-gradient(135deg, #35134f, #6b2c91)',
                            color: '#ffffff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '14px',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                letterSpacing: '1.2px',
                                opacity: 0.74,
                              }}
                            >
                              CONTROLE ADMINISTRATIVO
                            </span>
                            <h2
                              style={{
                                margin: '6px 0 4px',
                                color: '#ffffff',
                                fontSize: '21px',
                              }}
                            >
                              Ajustar ponto
                            </h2>
                            <span style={{ fontSize: '10px', opacity: 0.76 }}>
                              Registre uma entrada ou saída esquecida com data, horário e justificativa.
                            </span>
                          </div>

                          <button
                            onClick={() => setAjustePontoAberto(false)}
                            disabled={ajustePontoSalvando}
                            style={{
                              width: '35px',
                              height: '35px',
                              border: '1px solid rgba(255,255,255,.18)',
                              borderRadius: '10px',
                              background: 'rgba(255,255,255,.10)',
                              color: '#ffffff',
                              cursor: 'pointer',
                              fontSize: '18px',
                            }}
                          >
                            ×
                          </button>
                        </div>

                        <div style={{ padding: '22px 23px 24px' }}>
                          <div
                            style={{
                              padding: '11px 13px',
                              borderRadius: '12px',
                              background: '#fff8e8',
                              border: '1px solid #f0dfb4',
                              color: '#765c22',
                              fontSize: '10px',
                              lineHeight: 1.55,
                              marginBottom: '17px',
                            }}
                          >
                            <strong>Ajuste administrativo.</strong> O registro será salvo como método Manual e a justificativa ficará vinculada ao ponto e à auditoria.
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                              gap: '13px',
                            }}
                          >
                            <div className="filter-field">
                              <label>Funcionário *</label>
                              <select
                                value={ajustePontoFuncionarioId}
                                onChange={(e) => setAjustePontoFuncionarioId(e.target.value)}
                                disabled={ajustePontoSalvando}
                              >
                                <option value="">Selecione...</option>
                                {funcionarios
                                  .filter((funcionario) => funcionario.status === 'Ativo')
                                  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                                  .map((funcionario) => (
                                    <option key={funcionario.id} value={funcionario.id}>
                                      {funcionario.nome}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div className="filter-field">
                              <label>Tipo de registro *</label>
                              <select
                                value={ajustePontoTipo}
                                onChange={(e) => setAjustePontoTipo(e.target.value as 'Entrada' | 'Saída')}
                                disabled={ajustePontoSalvando}
                              >
                                <option value="Entrada">Entrada</option>
                                <option value="Saída">Saída</option>
                              </select>
                            </div>

                            <div className="filter-field">
                              <label>Data *</label>
                              <input
                                type="date"
                                value={ajustePontoData}
                                max={dataLocalHoje}
                                onChange={(e) => setAjustePontoData(e.target.value)}
                                disabled={ajustePontoSalvando}
                              />
                            </div>

                            <div className="filter-field">
                              <label>Horário *</label>
                              <input
                                type="time"
                                value={ajustePontoHorario}
                                onChange={(e) => setAjustePontoHorario(e.target.value)}
                                disabled={ajustePontoSalvando}
                              />
                            </div>
                          </div>

                          <div className="filter-field" style={{ marginTop: '14px' }}>
                            <label>Justificativa obrigatória *</label>
                            <textarea
                              value={ajustePontoMotivo}
                              onChange={(e) => setAjustePontoMotivo(e.target.value)}
                              disabled={ajustePontoSalvando}
                              placeholder="Ex.: Funcionário esqueceu de registrar a saída no fim do turno."
                              rows={4}
                              style={{
                                width: '100%',
                                resize: 'vertical',
                                minHeight: '94px',
                                padding: '11px 12px',
                                border: '1px solid #ded6e1',
                                borderRadius: '11px',
                                fontFamily: 'inherit',
                                fontSize: '11px',
                                color: '#3d3341',
                                background: '#ffffff',
                                outline: 'none',
                              }}
                            />
                            <span style={{ color: '#99909c', fontSize: '9px', marginTop: '5px' }}>
                              Mínimo de 8 caracteres. A justificativa não poderá ficar vazia.
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              gap: '9px',
                              flexWrap: 'wrap',
                              marginTop: '19px',
                              paddingTop: '17px',
                              borderTop: '1px solid #eee8f0',
                            }}
                          >
                            <button
                              className="secondary-button"
                              onClick={() => setAjustePontoAberto(false)}
                              disabled={ajustePontoSalvando}
                            >
                              Cancelar
                            </button>
                            <button
                              className="primary-button"
                              onClick={salvarAjustePonto}
                              disabled={ajustePontoSalvando}
                            >
                              {ajustePontoSalvando ? 'Salvando ajuste...' : '✓ Salvar ajuste de ponto'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {registroPontoSelecionado && (
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9997,
                        background: 'rgba(26, 15, 33, .58)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                      }}
                      onClick={() => setRegistroPontoSelecionado(null)}
                    >
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '560px',
                          background: '#ffffff',
                          borderRadius: '22px',
                          overflow: 'hidden',
                          boxShadow: '0 28px 70px rgba(30, 15, 40, .30)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          style={{
                            padding: '22px 24px',
                            background:
                              'linear-gradient(135deg, #35134f, #6b2c91)',
                            color: '#ffffff',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 800,
                                letterSpacing: '1.2px',
                                opacity: 0.72,
                              }}
                            >
                              COMPROVANTE DE REGISTRO
                            </span>
                            <h2
                              style={{
                                margin: '6px 0 0',
                                color: '#ffffff',
                                fontSize: '21px',
                                fontWeight: 760,
                              }}
                            >
                              Detalhes do ponto
                            </h2>
                          </div>

                          <button
                            onClick={() => setRegistroPontoSelecionado(null)}
                            style={{
                              width: '35px',
                              height: '35px',
                              border: '1px solid rgba(255,255,255,.18)',
                              borderRadius: '10px',
                              background: 'rgba(255,255,255,.10)',
                              color: '#ffffff',
                              cursor: 'pointer',
                              fontSize: '18px',
                            }}
                          >
                            ×
                          </button>
                        </div>

                        <div style={{ padding: '22px 24px 24px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '13px',
                              paddingBottom: '18px',
                              borderBottom: '1px solid #eee8f0',
                            }}
                          >
                            <span
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: '#f1e9f5',
                                color: '#5a2776',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 800,
                              }}
                            >
                              {registroPontoSelecionado.nome
                                .split(' ')
                                .slice(0, 2)
                                .map((parte) => parte[0])
                                .join('')}
                            </span>

                            <div>
                              <strong
                                style={{
                                  display: 'block',
                                  color: '#34283b',
                                  fontSize: '16px',
                                  marginBottom: '3px',
                                }}
                              >
                                {registroPontoSelecionado.nome}
                              </strong>
                              <span style={{ color: '#8d838f', fontSize: '11px' }}>
                                {registroPontoSelecionado.funcao}
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fit, minmax(150px, 1fr))',
                              gap: '11px',
                              marginTop: '18px',
                            }}
                          >
                            {[
                              ['Data', registroPontoSelecionado.data],
                              ['Horário', registroPontoSelecionado.horario],
                              [
                                'Tipo de registro',
                                registroPontoSelecionado.tipoRegistro || 'Entrada',
                              ],
                              [
                                'Método',
                                registroPontoSelecionado.metodo ||
                                  'Reconhecimento facial',
                              ],
                              [
                                'Origem',
                                registroPontoSelecionado.metodo === 'Manual'
                                  ? 'Painel administrativo'
                                  : 'Totem principal',
                              ],
                            ].map(([rotulo, valor]) => (
                              <div
                                key={rotulo}
                                style={{
                                  padding: '13px',
                                  borderRadius: '12px',
                                  background: '#faf9fb',
                                  border: '1px solid #eee9f0',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'block',
                                    color: '#9a909d',
                                    fontSize: '9px',
                                    fontWeight: 750,
                                    textTransform: 'uppercase',
                                    letterSpacing: '.55px',
                                    marginBottom: '5px',
                                  }}
                                >
                                  {rotulo}
                                </span>
                                <strong
                                  style={{
                                    color: '#403446',
                                    fontSize: '12px',
                                  }}
                                >
                                  {valor}
                                </strong>
                              </div>
                            ))}
                          </div>

                          <div
                            style={{
                              marginTop: '16px',
                              padding: '13px 14px',
                              borderRadius: '12px',
                              background: '#ecfdf3',
                              border: '1px solid #ccefdc',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                            }}
                          >
                            <span
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: '#198754',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 800,
                              }}
                            >
                              ✓
                            </span>
                            <div>
                              <strong
                                style={{
                                  display: 'block',
                                  color: '#187849',
                                  fontSize: '11px',
                                  marginBottom: '2px',
                                }}
                              >
                                Registro confirmado
                              </strong>
                              <span style={{ color: '#4d8b6a', fontSize: '9px' }}>
                                O ponto foi salvo com sucesso no sistema.
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              marginTop: '18px',
                              display: 'flex',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <button
                              className="secondary-button"
                              onClick={() => setRegistroPontoSelecionado(null)}
                            >
                              Fechar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}

        {tela === 'listaDiaristas' && temAcesso('listaDiaristas') && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: '18px',
                marginBottom: '24px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    color: '#6b3c83',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '1.1px',
                    textTransform: 'uppercase',
                    marginBottom: '7px',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#6b3c83',
                    }}
                  />
                  Organização diária
                </span>

                <h1 className="page-title" style={{ marginBottom: '7px' }}>
                  Lista do Dia
                </h1>

                <p className="page-subtitle">
                  Monte a relação de diaristas convocados e compartilhe no grupo.
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={novaListaDiaristas}
                style={{ padding: '10px 14px' }}
              >
                + Nova lista
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.5fr) minmax(310px, .8fr)',
                gap: '18px',
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #ebe5ed',
                  borderRadius: '19px',
                  boxShadow: '0 8px 24px rgba(60,36,72,.055)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid #eee9f0',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      color: '#382d3e',
                      fontSize: '16px',
                      marginBottom: '4px',
                    }}
                  >
                    Dados da convocação
                  </strong>
                  <span style={{ color: '#928894', fontSize: '11px' }}>
                    Defina a data e selecione quem trabalhará no turno das 09:30 às 18:30.
                  </span>
                </div>

                <div style={{ padding: '20px' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      marginBottom: '17px',
                    }}
                  >
                    <div className="filter-field">
                      <label>Data da diária</label>
                      <input
                        type="date"
                        value={dataListaDiaristas}
                        onChange={(e) => setDataListaDiaristas(e.target.value)}
                      />
                    </div>

                    <div className="filter-field">
                      <label>Turno / período</label>
                      <input
                        type="text"
                        value="PM • 09:30 às 18:30"
                        disabled
                        style={{
                          background: '#f7f5f8',
                          color: '#5f5662',
                          cursor: 'not-allowed',
                        }}
                      />
                    </div>

                    <div className="filter-field">
                      <label>Operação</label>
                      <input
                        value="DHL Mogi Mirim"
                        disabled
                        style={{
                          background: '#f7f5f8',
                          color: '#5f5662',
                          cursor: 'not-allowed',
                        }}
                      />
                    </div>
                  </div>

                  <div className="filter-field" style={{ marginBottom: '18px' }}>
                    <label>Observação</label>
                    <input
                      placeholder="Ex.: Chegar 15 minutos antes, levar documento..."
                      value={observacaoListaDiaristas}
                      onChange={(e) =>
                        setObservacaoListaDiaristas(e.target.value)
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginBottom: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          display: 'block',
                          color: '#3a2e40',
                          fontSize: '14px',
                          marginBottom: '3px',
                        }}
                      >
                        Selecionar diaristas
                      </strong>
                      <span style={{ color: '#948b98', fontSize: '10px' }}>
                        Somente funcionários ativos aparecem nesta lista.
                      </span>
                    </div>

                    <button
                      className="action-button"
                      onClick={selecionarTodosDiaristas}
                    >
                      {funcionarios
                        .filter((funcionario) => funcionario.status === 'Ativo')
                        .every((funcionario) =>
                          diaristasSelecionados.includes(funcionario.nome)
                        )
                        ? 'Desmarcar todos'
                        : 'Selecionar todos'}
                    </button>
                  </div>

                  <div
                    style={{
                      position: 'relative',
                      marginBottom: '12px',
                    }}
                  >
                    <input
                      value={buscaListaDiaristas}
                      onChange={(e) => setBuscaListaDiaristas(e.target.value)}
                      placeholder="Buscar diarista por nome ou função..."
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: '11px',
                        border: '1px solid #ddd5e1',
                        outline: 'none',
                        fontSize: '12px',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      border: '1px solid #eee8f0',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      maxHeight: '340px',
                      overflowY: 'auto',
                    }}
                  >
                    {diaristasDisponiveis.map((funcionario, index) => {
                      const selecionado = diaristasSelecionados.includes(
                        funcionario.nome
                      )

                      return (
                        <label
                          key={funcionario.cpf}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '11px',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            background: selecionado ? '#faf5fd' : '#ffffff',
                            borderBottom:
                              index < diaristasDisponiveis.length - 1
                                ? '1px solid #f0ebf2'
                                : 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() =>
                              alternarDiaristaLista(funcionario.nome)
                            }
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: '#6b3c83',
                            }}
                          />

                          <span
                            style={{
                              width: '34px',
                              height: '34px',
                              minWidth: '34px',
                              borderRadius: '10px',
                              background: '#f1e9f5',
                              color: '#5a2776',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '11px',
                            }}
                          >
                            {funcionario.nome
                              .split(' ')
                              .slice(0, 2)
                              .map((parte) => parte[0])
                              .join('')}
                          </span>

                          <span style={{ minWidth: 0, flex: 1 }}>
                            <strong
                              style={{
                                display: 'block',
                                color: '#3d3143',
                                fontSize: '12px',
                                marginBottom: '2px',
                              }}
                            >
                              {funcionario.nome}
                            </strong>
                            <small
                              style={{
                                display: 'block',
                                color: '#948a97',
                                fontSize: '10px',
                              }}
                            >
                              {funcionario.funcao}
                            </small>
                          </span>

                          {selecionado && (
                            <span
                              style={{
                                padding: '5px 8px',
                                borderRadius: '999px',
                                background: '#e8f7ee',
                                color: '#18794a',
                                fontSize: '9px',
                                fontWeight: 750,
                              }}
                            >
                              Selecionado
                            </span>
                          )}
                        </label>
                      )
                    })}

                    {diaristasDisponiveis.length === 0 && (
                      <div
                        style={{
                          padding: '22px',
                          textAlign: 'center',
                          color: '#9a909d',
                          fontSize: '11px',
                        }}
                      >
                        Nenhum diarista encontrado.
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      marginTop: '16px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span
                      style={{
                        color: '#756b78',
                        fontSize: '11px',
                        fontWeight: 650,
                      }}
                    >
                      {diaristasSelecionados.length} diarista(s) selecionado(s)
                    </span>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        className="secondary-button"
                        onClick={() => copiarListaParaWhatsApp()}
                      >
                        Copiar para WhatsApp
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() => exportarListaTxt()}
                      >
                        Exportar lista
                      </button>

                      <button
                        className="primary-button"
                        onClick={salvarListaDiaristas}
                      >
                        Salvar lista
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                <div
                  style={{
                    background:
                      'linear-gradient(145deg, #3d1758 0%, #6b2f8c 100%)',
                    borderRadius: '19px',
                    padding: '20px',
                    color: '#ffffff',
                    boxShadow: '0 12px 30px rgba(76,36,96,.18)',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      fontSize: '9px',
                      fontWeight: 800,
                      letterSpacing: '1.05px',
                      textTransform: 'uppercase',
                      opacity: 0.7,
                      marginBottom: '7px',
                    }}
                  >
                    Prévia para o grupo
                  </span>

                  <strong
                    style={{
                      display: 'block',
                      fontSize: '17px',
                      marginBottom: '14px',
                    }}
                  >
                    Lista de {formatarDataLista(dataListaDiaristas)} • PM
                  </strong>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginBottom: '15px',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '11px',
                        background: 'rgba(255,255,255,.10)',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: '9px',
                          opacity: 0.7,
                          marginBottom: '3px',
                        }}
                      >
                        DIARISTAS
                      </span>
                      <strong style={{ fontSize: '18px' }}>
                        {diaristasSelecionados.length}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '11px',
                        background: 'rgba(255,255,255,.10)',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: '9px',
                          opacity: 0.7,
                          marginBottom: '3px',
                        }}
                      >
                        ENTRADA
                      </span>
                      <strong style={{ fontSize: '15px' }}>
                        {horarioListaDiaristas || '--:--'}
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '13px',
                      background: 'rgba(255,255,255,.09)',
                      borderRadius: '13px',
                      maxHeight: '270px',
                      overflowY: 'auto',
                    }}
                  >
                    {diaristasSelecionados.length === 0 ? (
                      <span style={{ fontSize: '11px', opacity: 0.72 }}>
                        Selecione os diaristas para montar a prévia.
                      </span>
                    ) : (
                      diaristasSelecionados.map((nome, index) => (
                        <div
                          key={nome}
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            padding: '6px 0',
                            borderBottom:
                              index < diaristasSelecionados.length - 1
                                ? '1px solid rgba(255,255,255,.09)'
                                : 'none',
                          }}
                        >
                          <span
                            style={{
                              width: '20px',
                              opacity: 0.65,
                              fontSize: '10px',
                            }}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <strong style={{ fontSize: '11px' }}>{nome}</strong>
                        </div>
                      ))
                    )}
                  </div>

                  {localListaDiaristas && (
                    <div
                      style={{
                        marginTop: '12px',
                        fontSize: '10px',
                        opacity: 0.82,
                      }}
                    >
                      📍 {localListaDiaristas}
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '10px',
                      opacity: 0.82,
                    }}
                  >
                    🕐 Período PM
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #ebe5ed',
                    borderRadius: '18px',
                    padding: '18px',
                    boxShadow: '0 8px 22px rgba(60,36,72,.05)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      marginBottom: '13px',
                    }}
                  >
                    <div>
                      <strong
                        style={{
                          display: 'block',
                          color: '#3a2e40',
                          fontSize: '14px',
                          marginBottom: '2px',
                        }}
                      >
                        Listas salvas
                      </strong>
                      <span style={{ color: '#968c99', fontSize: '10px' }}>
                        Histórico das convocações.
                      </span>
                    </div>

                    <span
                      style={{
                        minWidth: '30px',
                        height: '30px',
                        padding: '0 8px',
                        borderRadius: '10px',
                        background: '#f3edf6',
                        color: '#5b3170',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      {listasDiaristas.length}
                    </span>
                  </div>

                  {listasDiaristas.length === 0 ? (
                    <div
                      style={{
                        padding: '20px 12px',
                        borderRadius: '12px',
                        background: '#faf9fb',
                        textAlign: 'center',
                        color: '#9b929e',
                        fontSize: '10px',
                      }}
                    >
                      Nenhuma lista salva ainda.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '8px' }}>
                      {listasDiaristas.slice(0, 6).map((lista) => (
                        <div
                          key={lista.id}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: '1px solid #eee8f0',
                            background:
                              listaDiaristasSelecionada?.id === lista.id
                                ? '#faf5fd'
                                : '#ffffff',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '10px',
                            }}
                          >
                            <button
                              onClick={() => setListaDiaristasSelecionada(lista)}
                              style={{
                                flex: 1,
                                padding: 0,
                                border: 0,
                                background: 'transparent',
                                textAlign: 'left',
                                cursor: 'pointer',
                              }}
                            >
                              <strong
                                style={{
                                  display: 'block',
                                  color: '#3b3040',
                                  fontSize: '11px',
                                  marginBottom: '3px',
                                }}
                              >
                                {formatarDataLista(lista.data)}
                              </strong>
                              <span
                                style={{
                                  display: 'block',
                                  color: '#918793',
                                  fontSize: '9px',
                                }}
                              >
                                {lista.diaristas.length} diarista(s)
                                {lista.local ? ` • ${lista.local}` : ''}
                              </span>
                            </button>

                            <button
                              onClick={() => void excluirListaDiaristas(lista.id)}
                              title="Excluir lista"
                              style={{
                                border: '1px solid #f1dada',
                                background: '#fff7f7',
                                color: '#a94f4f',
                                cursor: 'pointer',
                                fontSize: '9px',
                                fontWeight: 800,
                                borderRadius: '9px',
                                padding: '7px 9px',
                              }}
                            >
                              Excluir
                            </button>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              gap: '6px',
                              marginTop: '9px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <button
                              className="action-button"
                              onClick={() => copiarListaParaWhatsApp(lista)}
                            >
                              Copiar
                            </button>
                            <button
                              className="action-button"
                              onClick={() => exportarListaTxt(lista)}
                            >
                              Exportar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {listaDiaristasSelecionada && (
              <div
                style={{
                  marginTop: '18px',
                  background: '#ffffff',
                  border: '1px solid #ebe5ed',
                  borderRadius: '18px',
                  padding: '20px',
                  boxShadow: '0 8px 22px rgba(60,36,72,.05)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: 'block',
                        color: '#392e3f',
                        fontSize: '15px',
                        marginBottom: '3px',
                      }}
                    >
                      Lista salva — {formatarDataLista(listaDiaristasSelecionada.data)}
                    </strong>
                    <span style={{ color: '#948a97', fontSize: '10px' }}>
                      Criada em {listaDiaristasSelecionada.criadaEm}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="secondary-button"
                      onClick={() =>
                        copiarListaParaWhatsApp(listaDiaristasSelecionada)
                      }
                    >
                      Copiar para WhatsApp
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() => exportarListaTxt(listaDiaristasSelecionada)}
                    >
                      Exportar
                    </button>
                  </div>
                </div>

                <div className="table-wrapper">
                  <table className="employees-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Diarista</th>
                        <th>Função</th>
                        <th>Data</th>
                        <th>Horário</th>
                        <th>Local</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaDiaristasSelecionada.diaristas.map((nome, index) => {
                        const funcionario = obterFuncionarioPorNome(nome)

                        return (
                          <tr key={nome}>
                            <td>{index + 1}</td>
                            <td>
                              <strong>{nome}</strong>
                            </td>
                            <td>{funcionario?.funcao || '-'}</td>
                            <td>
                              {formatarDataLista(listaDiaristasSelecionada.data)}
                            </td>
                            <td>{listaDiaristasSelecionada.horario || '-'}</td>
                            <td>{listaDiaristasSelecionada.local || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {tela === 'diarias' && temAcesso('diarias') && (
          <>
            {(() => {
              const listaReferencia =
                listaDiaristasSelecionada ?? listasDiaristas[0] ?? null

              const dataListaBR = listaReferencia
                ? formatarDataLista(listaReferencia.data)
                : ''

              const convocados = listaReferencia?.diaristas ?? []

              const presentesLista = listaReferencia
                ? convocados.filter((nome) =>
                    registrosPonto.some(
                      (registro) =>
                        registro.nome === nome &&
                        registro.data === dataListaBR &&
                        registro.status === 'Registrado'
                    )
                  )
                : []

              const faltasLancadasLista = listaReferencia?.ausentes || []

              const faltaramLista = listaReferencia
                ? convocados.filter(
                    (nome) =>
                      !presentesLista.includes(nome) &&
                      !faltasLancadasLista.includes(nome)
                  )
                : []

              const diariasGeradasLista = listaReferencia
                ? convocados.filter((nome) =>
                    diarias.some(
                      (diaria) =>
                        diaria.nome === nome && diaria.data === dataListaBR
                    )
                  )
                : []

              const valorPrevistoLista = listaReferencia
                ? diarias
                    .filter(
                      (diaria) =>
                        diaria.data === dataListaBR &&
                        convocados.includes(diaria.nome)
                    )
                    .reduce((total, diaria) => total + diaria.valor, 0)
                : 0

              const cardOperacional = {
                background: '#ffffff',
                border: '1px solid #ebe5ed',
                borderRadius: '18px',
                padding: '18px',
                boxShadow: '0 8px 22px rgba(60, 36, 72, 0.05)',
              }

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      gap: '18px',
                      marginBottom: '24px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '7px',
                          color: '#6b3c83',
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '1.1px',
                          textTransform: 'uppercase',
                          marginBottom: '7px',
                        }}
                      >
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#6b3c83',
                          }}
                        />
                        Operação financeira
                      </span>

                      <h1 className="page-title" style={{ marginBottom: '7px' }}>
                        Diárias
                      </h1>

                      <p className="page-subtitle">
                        Cruze a Lista do Dia com o ponto e gere somente as
                        diárias de quem realmente trabalhou.
                      </p>
                    </div>

                    <button
                      className="secondary-button"
                      onClick={() => setTela('listaDiaristas')}
                      style={{ padding: '10px 14px' }}
                    >
                      ☷ Abrir Lista do Dia
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(205px, 1fr))',
                      gap: '14px',
                      marginBottom: '18px',
                    }}
                  >
                    {[
                      {
                        titulo: 'Convocados',
                        valor: listaReferencia ? convocados.length : '--',
                        detalhe: listaReferencia
                          ? `Lista de ${dataListaBR}`
                          : 'Nenhuma lista selecionada',
                        icone: '☷',
                        fundo: '#f1e9f5',
                        cor: '#5a2776',
                      },
                      {
                        titulo: 'Compareceram',
                        valor: listaReferencia ? presentesLista.length : '--',
                        detalhe: 'Com ponto registrado',
                        icone: '✓',
                        fundo: '#e9f8ef',
                        cor: '#17804c',
                      },
                      {
                        titulo: 'Pendentes de ponto',
                        valor: listaReferencia ? faltaramLista.length : '--',
                        detalhe:
                          faltaramLista.length > 0
                            ? 'Sem registro de ponto'
                            : 'Nenhuma falta identificada',
                        icone: '!',
                        fundo: '#fff4dc',
                        cor: '#a86d00',
                      },
                      {
                        titulo: 'Diárias geradas',
                        valor: listaReferencia
                          ? diariasGeradasLista.length
                          : '--',
                        detalhe:
                          valorPrevistoLista > 0
                            ? moeda(valorPrevistoLista)
                            : 'Aguardando geração',
                        icone: 'R$',
                        fundo: '#eaf1ff',
                        cor: '#285dc2',
                      },
                    ].map((card) => (
                      <div key={card.titulo} style={cardOperacional}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '12px',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                display: 'block',
                                color: '#776d7a',
                                fontSize: '12px',
                                fontWeight: 650,
                                marginBottom: '8px',
                              }}
                            >
                              {card.titulo}
                            </span>

                            <strong
                              style={{
                                display: 'block',
                                color: '#302437',
                                fontSize: '29px',
                                lineHeight: 1,
                                fontWeight: 800,
                                letterSpacing: '-0.6px',
                                marginBottom: '9px',
                              }}
                            >
                              {card.valor}
                            </strong>

                            <small
                              style={{
                                display: 'block',
                                color: '#948b98',
                                fontSize: '11px',
                              }}
                            >
                              {card.detalhe}
                            </small>
                          </div>

                          <span
                            style={{
                              minWidth: '40px',
                              height: '40px',
                              padding: '0 10px',
                              borderRadius: '12px',
                              background: card.fundo,
                              color: card.cor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: card.icone === 'R$' ? '11px' : '15px',
                              fontWeight: 800,
                            }}
                          >
                            {card.icone}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background:
                        'linear-gradient(135deg, #3c1755 0%, #6b2f8c 100%)',
                      borderRadius: '20px',
                      padding: '20px',
                      color: '#ffffff',
                      marginBottom: '18px',
                      boxShadow: '0 12px 30px rgba(76, 36, 96, 0.16)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '18px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: '1 1 360px' }}>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '9px',
                            fontWeight: 800,
                            letterSpacing: '1.05px',
                            textTransform: 'uppercase',
                            opacity: 0.7,
                            marginBottom: '6px',
                          }}
                        >
                          Integração automática
                        </span>

                        <strong
                          style={{
                            display: 'block',
                            fontSize: '18px',
                            marginBottom: '6px',
                          }}
                        >
                          {listaReferencia
                            ? `Lista de ${dataListaBR}`
                            : 'Nenhuma Lista do Dia selecionada'}
                        </strong>

                        <span
                          style={{
                            display: 'block',
                            fontSize: '11px',
                            lineHeight: 1.55,
                            opacity: 0.78,
                            maxWidth: '680px',
                          }}
                        >
                          {listaReferencia
                            ? `${convocados.length} convocado(s), ${presentesLista.length} com ponto e ${faltaramLista.length} pendente(s) de registro. O sistema só considera falta quando ela é lançada explicitamente na Lista do Dia.`
                            : 'Salve uma Lista do Dia para cruzar os convocados com os registros de ponto.'}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '9px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {listasDiaristas.length > 0 && (
                          <select
                            value={listaReferencia?.id ?? ''}
                            onChange={(e) => {
                              const id = e.target.value
                              const lista =
                                listasDiaristas.find(
                                  (item) => item.id === id
                                ) ?? null
                              setListaDiaristasSelecionada(lista)
                            }}
                            style={{
                              minWidth: '210px',
                              padding: '10px 12px',
                              borderRadius: '11px',
                              border: '1px solid rgba(255,255,255,.22)',
                              background: 'rgba(255,255,255,.10)',
                              color: '#ffffff',
                              outline: 'none',
                              fontSize: '11px',
                            }}
                          >
                            {listasDiaristas.map((lista) => (
                              <option
                                key={lista.id}
                                value={lista.id}
                                style={{ color: '#302437' }}
                              >
                                {formatarDataLista(lista.data)} •{' '}
                                {lista.diaristas.length} diaristas
                              </option>
                            ))}
                          </select>
                        )}

                        <button
                          onClick={gerarDiariasDaListaSelecionada}
                          disabled={!listaReferencia}
                          style={{
                            padding: '10px 15px',
                            borderRadius: '11px',
                            border: '1px solid rgba(255,255,255,.16)',
                            background: listaReferencia
                              ? '#ffffff'
                              : 'rgba(255,255,255,.12)',
                            color: listaReferencia ? '#55246e' : '#d3c5da',
                            fontWeight: 800,
                            fontSize: '11px',
                            cursor: listaReferencia ? 'pointer' : 'not-allowed',
                          }}
                        >
                          ✓ Gerar diárias do dia
                        </button>
                      </div>
                    </div>
                  </div>

                  {listaReferencia && faltaramLista.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '11px',
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: '#fff8e8',
                        border: '1px solid #f0db9e',
                        marginBottom: '18px',
                      }}
                    >
                      <span
                        style={{
                          width: '30px',
                          height: '30px',
                          minWidth: '30px',
                          borderRadius: '50%',
                          background: '#e3a719',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '12px',
                        }}
                      >
                        !
                      </span>

                      <div>
                        <strong
                          style={{
                            display: 'block',
                            color: '#8d5d00',
                            fontSize: '12px',
                            marginBottom: '4px',
                          }}
                        >
                          {faltaramLista.length} convocado(s) pendente(s) de ponto
                          registrado
                        </strong>

                        <span
                          style={{
                            color: '#9b762f',
                            fontSize: '10px',
                            lineHeight: 1.5,
                          }}
                        >
                          Nenhuma diária será gerada para esses nomes até existir um ponto confirmado ou a situação ser tratada.
                        </span>

                        {podeEditar && (
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              flexWrap: 'wrap',
                              marginTop: '10px',
                            }}
                          >
                            {faltaramLista.map((nome) => (
                              <button
                                key={nome}
                                type="button"
                                onClick={() => void lancarFaltaLista(nome)}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: '9px',
                                  border: '1px solid #e3c66f',
                                  background: '#ffffff',
                                  color: '#8d5d00',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                Lançar falta • {nome}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {listaReferencia && faltasLancadasLista.length > 0 && (
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: '#fff1f1',
                        border: '1px solid #efcaca',
                        marginBottom: '18px',
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          color: '#9a3e48',
                          fontSize: '12px',
                          marginBottom: '5px',
                        }}
                      >
                        Faltas lançadas: {faltasLancadasLista.length}
                      </strong>
                      <span style={{ color: '#a45b63', fontSize: '10px' }}>
                        {faltasLancadasLista.join(', ')}
                      </span>
                    </div>
                  )}

                  {listaReferencia && presentesLista.length > 0 && (
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #ebe5ed',
                        borderRadius: '18px',
                        overflow: 'hidden',
                        boxShadow: '0 8px 22px rgba(60,36,72,.05)',
                        marginBottom: '18px',
                      }}
                    >
                      <div
                        style={{
                          padding: '18px 20px',
                          borderBottom: '1px solid #eee9f0',
                        }}
                      >
                        <strong
                          style={{
                            display: 'block',
                            color: '#382d3e',
                            fontSize: '15px',
                            marginBottom: '3px',
                          }}
                        >
                          Conferência da Lista do Dia
                        </strong>

                        <span style={{ color: '#948a97', fontSize: '10px' }}>
                          Resultado do cruzamento entre convocação e ponto.
                        </span>
                      </div>

                      <div className="table-wrapper">
                        <table className="employees-table">
                          <thead>
                            <tr>
                              <th>Funcionário</th>
                              <th>Ponto</th>
                              <th>Diária</th>
                              <th>Base</th>
                              <th>Adicional</th>
                              <th>VT</th>
                              <th>VR</th>
                              <th>Total</th>
                            </tr>
                          </thead>

                          <tbody>
                            {convocados.map((nome) => {
                              const funcionario = obterFuncionarioPorNome(nome)
                              const ponto = registrosPonto.find(
                                (registro) =>
                                  registro.nome === nome &&
                                  registro.data === dataListaBR &&
                                  registro.status === 'Registrado'
                              )
                              const diaria = diarias.find(
                                (item) =>
                                  item.nome === nome &&
                                  item.data === dataListaBR
                              )

                              return (
                                <tr key={nome}>
                                  <td>
                                    <strong>{nome}</strong>
                                    <small
                                      style={{
                                        display: 'block',
                                        color: '#9b929e',
                                        marginTop: '2px',
                                      }}
                                    >
                                      {funcionario?.funcao || '-'}
                                    </small>
                                  </td>

                                  <td>
                                    {ponto ? (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px',
                                          padding: '5px 8px',
                                          borderRadius: '999px',
                                          background: '#eaf8ef',
                                          color: '#18794a',
                                          fontSize: '9px',
                                          fontWeight: 750,
                                        }}
                                      >
                                        ✓ {ponto.horario}
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          padding: '5px 8px',
                                          borderRadius: '999px',
                                          background: '#fff4dc',
                                          color: '#9a6200',
                                          fontSize: '9px',
                                          fontWeight: 750,
                                        }}
                                      >
                                        Sem ponto
                                      </span>
                                    )}
                                  </td>

                                  <td>
                                    {diaria ? (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          padding: '5px 8px',
                                          borderRadius: '999px',
                                          background:
                                            diaria.status === 'Aprovada'
                                              ? '#eaf8ef'
                                              : '#f1e9f5',
                                          color:
                                            diaria.status === 'Aprovada'
                                              ? '#18794a'
                                              : '#5a2776',
                                          fontSize: '9px',
                                          fontWeight: 750,
                                        }}
                                      >
                                        {diaria.status === 'Aprovada'
                                          ? 'Aprovada'
                                          : 'Em conferência'}
                                      </span>
                                    ) : ponto ? (
                                      <span
                                        style={{
                                          color: '#7d7280',
                                          fontSize: '10px',
                                        }}
                                      >
                                        Pronta para gerar
                                      </span>
                                    ) : (
                                      <span
                                        style={{
                                          color: '#aaa1ad',
                                          fontSize: '10px',
                                        }}
                                      >
                                        Não gerada
                                      </span>
                                    )}
                                  </td>

                                  <td>{diaria ? moeda(diaria.diariaBase) : '-'}</td>
                                  <td>{diaria ? moeda(diaria.adicional) : '-'}</td>
                                  <td>{diaria ? moeda(diaria.vt) : '-'}</td>
                                  <td>{diaria ? moeda(diaria.vr) : '-'}</td>
                                  <td>
                                    <strong>
                                      {diaria ? moeda(diaria.valor) : '-'}
                                    </strong>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="cards diaria-cards">
                    <div className="card">
                      <span>Diárias aprovadas</span>
                      <strong>{totalDiariasAprovadas}</strong>
                    </div>

                    <div className="card">
                      <span>Em conferência</span>
                      <strong>{totalDiariasPendentes}</strong>
                    </div>

                    <div className="card">
                      <span>Valor aprovado</span>
                      <strong>{moeda(valorTotalDiarias)}</strong>
                    </div>
                  </div>

                  <div className="rules-box">
                    <strong>Composição automática da diária</strong>
                    <span>
                      Segunda a sexta: R$ 100,00 + VT + VR
                    </span>
                    <span>
                      Sábado: R$ 100,00 + R$ 50,00 + VT + VR
                    </span>
                    <span>
                      Domingo: R$ 100,00 + R$ 100,00 + VT + VR
                    </span>
                    <span>
                      Todos os diaristas da operação DHL Mogi Mirim recebem VT no turno da tarde. Os valores históricos permanecem preservados quando VT ou VR forem alterados.
                    </span>
                  </div>

                  <div className="filter-panel">
                    <div className="filter-header">
                      <div>
                        <strong>Histórico de diárias</strong>
                        <span>
                          Pesquise por trabalhador, período ou situação.
                        </span>
                      </div>

                      <button
                        className="clear-filter-button"
                        onClick={limparFiltrosDiarias}
                      >
                        Limpar filtros
                      </button>
                    </div>

                    <div className="filter-grid filter-grid-4">
                      <div className="filter-field">
                        <label>Pesquisar funcionário</label>
                        <input
                          placeholder="Nome ou função..."
                          value={buscaDiaria}
                          onChange={(e) => setBuscaDiaria(e.target.value)}
                        />
                      </div>

                      <div className="filter-field">
                        <label>Data inicial</label>
                        <input
                          type="date"
                          value={dataInicioDiaria}
                          onChange={(e) => setDataInicioDiaria(e.target.value)}
                        />
                      </div>

                      <div className="filter-field">
                        <label>Data final</label>
                        <input
                          type="date"
                          value={dataFimDiaria}
                          onChange={(e) => setDataFimDiaria(e.target.value)}
                        />
                      </div>

                      <div className="filter-field">
                        <label>Status</label>
                        <select
                          value={statusDiariaFiltro}
                          onChange={(e) =>
                            setStatusDiariaFiltro(e.target.value)
                          }
                        >
                          <option value="Todos">Todos</option>
                          <option value="Aprovada">Aprovada</option>
                          <option value="Pendente">Em conferência</option>
                        </select>
                      </div>
                    </div>

                    <div className="filter-result">
                      {diariasFiltradas.length} diária(s) encontrada(s)
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Diárias por funcionário</h2>

                    <div className="table-wrapper">
                      <table className="employees-table">
                        <thead>
                          <tr>
                            <th>Funcionário</th>
                            <th>Função</th>
                            <th>Dias</th>
                            <th>Aprovadas</th>
                            <th>Em conferência</th>
                            <th>Total</th>
                            <th>Ações</th>
                          </tr>
                        </thead>

                        <tbody>
                          {resumoDiariasPorFuncionario.map(
                            (funcionario, index) => (
                              <tr key={index}>
                                <td>
                                  <strong>{funcionario.nome}</strong>
                                </td>
                                <td>{funcionario.funcao}</td>
                                <td>{funcionario.quantidade}</td>
                                <td>{funcionario.aprovadas}</td>
                                <td>{funcionario.pendentes}</td>
                                <td>
                                  <strong>{moeda(funcionario.total)}</strong>
                                </td>
                                <td>
                                  <button
                                    className="action-button"
                                    onClick={() =>
                                      setFuncionarioDiariasSelecionado(
                                        funcionario.nome
                                      )
                                    }
                                  >
                                    Ver detalhes
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>

                      {resumoDiariasPorFuncionario.length === 0 && (
                        <div className="empty-filter-result">
                          Nenhuma diária encontrada com esses filtros.
                        </div>
                      )}
                    </div>
                  </div>

                  {funcionarioDiariasSelecionado && (
                    <div className="panel daily-detail-panel">
                      <div className="form-header">
                        <div>
                          <h2>Detalhamento das Diárias</h2>
                          <p className="page-subtitle">
                            {funcionarioDiariasSelecionado}
                          </p>
                        </div>

                        <button
                          className="close-button"
                          onClick={() =>
                            setFuncionarioDiariasSelecionado(null)
                          }
                        >
                          ✕
                        </button>
                      </div>

                      <div className="daily-detail-summary">
                        <div>
                          <span>Dias trabalhados</span>
                          <strong>
                            {diariasFuncionarioSelecionado.length}
                          </strong>
                        </div>

                        <div>
                          <span>Valor acumulado</span>
                          <strong>{moeda(totalFuncionarioSelecionado)}</strong>
                        </div>
                      </div>

                      <div className="table-wrapper">
                        <table className="employees-table">
                          <thead>
                            <tr>
                              <th>Data</th>
                              <th>Dia da semana</th>
                              <th>Base</th>
                              <th>Adicional</th>
                              <th>VT</th>
                              <th>VR</th>
                              <th>Total</th>
                              <th>Status</th>
                              <th>Ação</th>
                            </tr>
                          </thead>

                          <tbody>
                            {diariasFuncionarioSelecionado.map(
                              ({ diaria, indexOriginal }) => (
                                <tr key={indexOriginal}>
                                  <td>{diaria.data}</td>
                                  <td>{obterDiaSemana(diaria.data)}</td>
                                  <td>{moeda(diaria.diariaBase)}</td>
                                  <td>{moeda(diaria.adicional)}</td>
                                  <td>{moeda(diaria.vt)}</td>
                                  <td>{moeda(diaria.vr)}</td>
                                  <td>
                                    <strong>{moeda(diaria.valor)}</strong>
                                  </td>
                                  <td>
                                    <span
                                      style={{
                                        display: 'inline-flex',
                                        padding: '5px 8px',
                                        borderRadius: '999px',
                                        background:
                                          diaria.status === 'Aprovada'
                                            ? '#eaf8ef'
                                            : diaria.status === 'Cancelada'
                                            ? '#fff0f1'
                                            : '#f1e9f5',
                                        color:
                                          diaria.status === 'Aprovada'
                                            ? '#18794a'
                                            : diaria.status === 'Cancelada'
                                            ? '#a33f49'
                                            : '#5a2776',
                                        fontSize: '9px',
                                        fontWeight: 750,
                                      }}
                                    >
                                      {diaria.status}
                                    </span>
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                      {(() => {
                                        const estiloStatus =
                                          diaria.status === 'Aprovada'
                                            ? { fundo: '#eaf8ef', borda: '#bfe7ce', cor: '#18794a' }
                                            : diaria.status === 'Cancelada'
                                            ? { fundo: '#fff0f1', borda: '#efc7cb', cor: '#a33f49' }
                                            : diaria.status === 'Conferida'
                                            ? { fundo: '#eef4ff', borda: '#cbd9f2', cor: '#315b96' }
                                            : { fundo: '#f6f0f8', borda: '#ddd3e3', cor: '#5a2776' }

                                        return (
                                          <button
                                            type="button"
                                            disabled={!podeEditar}
                                            onClick={() => avancarStatusDiaria(indexOriginal)}
                                            aria-label={`Status atual: ${diaria.status}. Clique para avançar para o próximo status.`}
                                            title="Clique para avançar: Pendente → Conferida → Aprovada → Cancelada"
                                            style={{
                                              minHeight: '32px',
                                              padding: '0 12px',
                                              borderRadius: '999px',
                                              border: `1px solid ${estiloStatus.borda}`,
                                              background: estiloStatus.fundo,
                                              color: estiloStatus.cor,
                                              fontSize: '9px',
                                              fontWeight: 800,
                                              cursor: podeEditar ? 'pointer' : 'default',
                                              opacity: podeEditar ? 1 : 0.55,
                                              boxShadow: '0 3px 8px rgba(60, 36, 72, .06)',
                                              whiteSpace: 'nowrap',
                                            }}
                                          >
                                            {diaria.status} →
                                          </button>
                                        )
                                      })()}

                                      {podeAdministrar && diaria.status !== 'Cancelada' && (
                                        <button
                                          className="action-button"
                                          onClick={() => abrirEdicaoDiaria(indexOriginal)}
                                          style={{ background: '#fff', border: '1px solid #ddd3e3' }}
                                        >
                                          Editar
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}

        {tela === 'fechamentos' && temAcesso('fechamentos') && (
          <>
            {(() => {
              const filtrados = fechamentos.filter((fechamento) => {
                const termo = buscaFechamento.trim().toLowerCase()
                return (
                  (!termo ||
                    fechamento.periodo.toLowerCase().includes(termo) ||
                    fechamento.pagamento.toLowerCase().includes(termo)) &&
                  (statusFechamentoFiltro === 'Todos' ||
                    fechamento.status === statusFechamentoFiltro)
                )
              })

              const indice =
                fechamentoSelecionado !== null
                  ? fechamentoSelecionado
                  : fechamentos.findIndex((item) => item.status !== 'Pago')

              const selecionado = indice >= 0 ? fechamentos[indice] : undefined
              const resumo = selecionado
                ? resumoAutomaticoFechamento(selecionado.periodo, selecionado.dailyRecordIds)
                : null
              const diasPeriodo = selecionado
                ? datasDaQuinzena(selecionado.periodo)
                : []

              const criticos =
                resumo?.inconsistencias.filter(
                  (item) => item.nivel === 'Crítico'
                ).length || 0

              const totalVT = resumo?.totais.vt || 0
              const totalVR = resumo?.totais.vr || 0

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      gap: '14px',
                      flexWrap: 'wrap',
                      marginBottom: '18px',
                    }}
                  >
                    <div>
                      <span className="section-label">
                        FINANCEIRO • MODELO PLANILHA
                      </span>
                      <h1 className="page-title">
                        Fechamento da Quinzena
                      </h1>
                      <p className="page-subtitle">
                        Somente diárias aprovadas e vinculadas entram no fechamento,
                        nos totais da quinzena e no fluxo de pagamento.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selecionado &&
                        (selecionado.status === 'Em conferência' || selecionado.status === 'Reaberto') && (
                          <button
                            className="secondary-button"
                            onClick={() => void sincronizarDiariasAprovadasFechamento(selecionado)}
                          >
                            ↻ Sincronizar aprovadas
                          </button>
                        )}
                      <button
                        className="primary-button"
                        onClick={abrirQuinzenaAtual}
                      >
                        + Abrir quinzena atual
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '10px',
                      marginBottom: '14px',
                    }}
                  >
                    {[
                      {
                        titulo: 'Diárias',
                        valor: resumo?.totais.diarias || 0,
                        detalhe: 'somente aprovadas vinculadas',
                      },
                      {
                        titulo: 'VT',
                        valor: moeda(totalVT),
                        detalhe: `${resumo?.totais.diarias || 0} dia(s) considerados`,
                      },
                      {
                        titulo: 'VR',
                        valor: moeda(totalVR),
                        detalhe: `${resumo?.totais.diarias || 0} dia(s) considerados`,
                      },
                      {
                        titulo: 'Total da quinzena',
                        valor: moeda(resumo?.totais.total || 0),
                        detalhe: selecionado?.status || 'Selecione uma quinzena',
                      },
                    ].map((item) => (
                      <div
                        key={item.titulo}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e8e2ea',
                          borderRadius: '16px',
                          padding: '14px',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            color: '#918793',
                            fontSize: '8px',
                            marginBottom: '4px',
                          }}
                        >
                          {item.titulo}
                        </span>
                        <strong
                          style={{
                            display: 'block',
                            color: '#46394b',
                            fontSize: '17px',
                            marginBottom: '3px',
                          }}
                        >
                          {item.valor}
                        </strong>
                        <small style={{ color: '#9b929e', fontSize: '7.5px' }}>
                          {item.detalhe}
                        </small>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: '#fff',
                      border: '1px solid #e8e2ea',
                      borderRadius: '17px',
                      padding: '12px',
                      marginBottom: '14px',
                      display: 'grid',
                      gridTemplateColumns:
                        'minmax(200px,1fr) minmax(160px,.45fr) minmax(220px,.75fr)',
                      gap: '9px',
                      alignItems: 'end',
                    }}
                  >
                    <div className="form-group">
                      <label>Buscar quinzena</label>
                      <input
                        value={buscaFechamento}
                        onChange={(e) => setBuscaFechamento(e.target.value)}
                        placeholder="Período..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={statusFechamentoFiltro}
                        onChange={(e) =>
                          setStatusFechamentoFiltro(e.target.value)
                        }
                      >
                        <option value="Todos">Todos</option>
                        <option value="Em conferência">Em conferência</option>
                        <option value="Reaberto">Reaberto</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Enviado para pagamento">
                          Enviado para pagamento
                        </option>
                        <option value="Pago">Pago</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Quinzena</label>
                      <select
                        value={indice >= 0 ? String(indice) : ''}
                        onChange={(e) =>
                          setFechamentoSelecionado(Number(e.target.value))
                        }
                      >
                        {filtrados.map((fechamento) => {
                          const real = fechamentos.findIndex(
                            (item) => item === fechamento
                          )
                          return (
                            <option key={real} value={real}>
                              {fechamento.periodo} • {fechamento.status}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                  </div>

                  {selecionado && resumo ? (
                    <>
                      <div
                        style={{
                          background:
                            'linear-gradient(145deg,#684078,#4f315d)',
                          color: '#fff',
                          borderRadius: '18px 18px 0 0',
                          padding: '14px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: 'block',
                              fontSize: '8px',
                              opacity: 0.7,
                              marginBottom: '3px',
                            }}
                          >
                            DHL MOGI MIRIM
                          </span>
                          <strong
                            style={{
                              display: 'block',
                              fontSize: '15px',
                              marginBottom: '2px',
                            }}
                          >
                            {selecionado.periodo}
                          </strong>
                          <small style={{ opacity: 0.75, fontSize: '8px' }}>
                            Pagamento previsto: {selecionado.pagamento}
                          </small>
                        </div>

                        <span
                          style={{
                            padding: '6px 9px',
                            borderRadius: '999px',
                            background: 'rgba(255,255,255,.10)',
                            fontSize: '8px',
                            fontWeight: 850,
                          }}
                        >
                          {selecionado.status}
                        </span>
                      </div>

                      <div
                        style={{
                          background: '#fff',
                          border: '1px solid #e8e2ea',
                          borderTop: 'none',
                          borderRadius: '0 0 18px 18px',
                          overflow: 'auto',
                          boxShadow: '0 9px 26px rgba(60,36,72,.045)',
                        }}
                      >
                        <table
                          style={{
                            width: '100%',
                            minWidth: `${470 + diasPeriodo.length * 62}px`,
                            borderCollapse: 'collapse',
                            fontSize: '8px',
                          }}
                        >
                          <thead>
                            <tr>
                              <th
                                style={{
                                  position: 'sticky',
                                  left: 0,
                                  zIndex: 4,
                                  background: '#f5f1f6',
                                  minWidth: '190px',
                                  padding: '9px',
                                  border: '1px solid #e5dfe7',
                                  textAlign: 'left',
                                }}
                              >
                                DIARISTA
                              </th>

                              {diasPeriodo.map((data) => {
                                const feriado = feriadoDaData(data)
                                const domingo = data.getDay() === 0
                                const sabado = data.getDay() === 6
                                return (
                                  <th
                                    key={dataISO(data)}
                                    title={feriado?.nome}
                                    style={{
                                      minWidth: '58px',
                                      padding: '7px 4px',
                                      border: '1px solid #e5dfe7',
                                      textAlign: 'center',
                                      background: feriado
                                        ? '#fff0a8'
                                        : domingo
                                        ? '#ffd9d5'
                                        : sabado
                                        ? '#dbeaff'
                                        : '#f7f5f8',
                                      color: feriado
                                        ? '#805d12'
                                        : domingo
                                        ? '#9f453b'
                                        : sabado
                                        ? '#416491'
                                        : '#655969',
                                    }}
                                  >
                                    <span
                                      style={{
                                        display: 'block',
                                        fontSize: '9px',
                                        fontWeight: 900,
                                      }}
                                    >
                                      {data.getDate()}
                                    </span>
                                    <small style={{ fontSize: '6.5px' }}>
                                      {feriado
                                        ? 'FER'
                                        : domingo
                                        ? 'DOM'
                                        : sabado
                                        ? 'SÁB'
                                        : data
                                            .toLocaleDateString('pt-BR', {
                                              weekday: 'short',
                                            })
                                            .replace('.', '')
                                            .toUpperCase()}
                                    </small>
                                  </th>
                                )
                              })}

                              {[
                                'DIÁRIAS',
                                'VT DIAS',
                                'VR DIAS',
                                'BASE + ADIC.',
                                'VT',
                                'VR',
                                'TOTAL',
                              ].map((titulo) => (
                                <th
                                  key={titulo}
                                  style={{
                                    minWidth:
                                      titulo === 'BASE + ADIC.' ||
                                      titulo === 'TOTAL'
                                        ? '92px'
                                        : '68px',
                                    padding: '8px 5px',
                                    border: '1px solid #e5dfe7',
                                    background: '#eee8f0',
                                    color: '#55475b',
                                    textAlign: 'center',
                                    fontSize: '7px',
                                  }}
                                >
                                  {titulo}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {resumo.funcionarios.map((item, linha) => {
                              const itensFuncionario = diarias.filter(
                                (diaria) =>
                                  diaria.nome === item.nome &&
                                  diasPeriodo.some(
                                    (data) =>
                                      data.toLocaleDateString('pt-BR') ===
                                      diaria.data
                                  )
                              )

                              const vtDias = itensFuncionario.filter(
                                (diaria) => diaria.vt > 0
                              ).length
                              const vrDias = itensFuncionario.filter(
                                (diaria) => diaria.vr > 0
                              ).length

                              return (
                                <tr key={item.nome}>
                                  <td
                                    style={{
                                      position: 'sticky',
                                      left: 0,
                                      zIndex: 2,
                                      background:
                                        linha % 2 === 0 ? '#fff' : '#fbfafb',
                                      padding: '8px 9px',
                                      border: '1px solid #e8e3e9',
                                      fontWeight: 750,
                                      color: '#4f4353',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {item.nome}
                                  </td>

                                  {diasPeriodo.map((data) => {
                                    const dataBR =
                                      data.toLocaleDateString('pt-BR')
                                    const diaria = itensFuncionario.find(
                                      (registro) => registro.data === dataBR
                                    )
                                    const feriado = feriadoDaData(data)
                                    const domingo = data.getDay() === 0
                                    const sabado = data.getDay() === 6

                                    return (
                                      <td
                                        key={`${item.nome}-${dataBR}`}
                                        style={{
                                          padding: '7px 4px',
                                          border: '1px solid #ece7ed',
                                          textAlign: 'center',
                                          background: diaria
                                            ? feriado
                                              ? '#fff9d9'
                                              : domingo
                                              ? '#fff3f1'
                                              : sabado
                                              ? '#f1f6ff'
                                              : linha % 2 === 0
                                              ? '#ffffff'
                                              : '#fbfafb'
                                            : linha % 2 === 0
                                            ? '#ffffff'
                                            : '#fbfafb',
                                          color: diaria
                                            ? '#55485a'
                                            : '#c1b9c3',
                                          fontWeight: diaria ? 750 : 400,
                                        }}
                                      >
                                        {diaria ? moeda(diaria.valor) : '—'}
                                      </td>
                                    )
                                  })}

                                  <td
                                    style={{
                                      border: '1px solid #e5dfe7',
                                      textAlign: 'center',
                                      fontWeight: 850,
                                    }}
                                  >
                                    {item.diarias}
                                  </td>
                                  <td
                                    style={{
                                      border: '1px solid #e5dfe7',
                                      textAlign: 'center',
                                      fontWeight: 850,
                                    }}
                                  >
                                    {vtDias}
                                  </td>
                                  <td
                                    style={{
                                      border: '1px solid #e5dfe7',
                                      textAlign: 'center',
                                      fontWeight: 850,
                                    }}
                                  >
                                    {vrDias}
                                  </td>
                                  <td
                                    style={{
                                      border: '1px solid #e5dfe7',
                                      textAlign: 'right',
                                      padding: '0 7px',
                                    }}
                                  >
                                    {moeda(item.base + item.adicional)}
                                  </td>
                                  <td
                                    style={{
                                      border: '1px solid #e5dfe7',
                                      textAlign: 'right',
                                      padding: '0 7px',
                                    }}
                                  >
                                    {moeda(item.vt)}
                                  </td>
                                  <td
                                    style={{
                                      border: '1px solid #e5dfe7',
                                      textAlign: 'right',
                                      padding: '0 7px',
                                    }}
                                  >
                                    {moeda(item.vr)}
                                  </td>
                                  <td
                                    style={{
                                      border: '1px solid #d8ccdc',
                                      textAlign: 'right',
                                      padding: '0 7px',
                                      background: '#f5eff7',
                                      color: '#5b3969',
                                      fontWeight: 900,
                                    }}
                                  >
                                    {moeda(item.total)}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>

                          <tfoot>
                            <tr>
                              <td
                                colSpan={diasPeriodo.length + 4}
                                style={{
                                  padding: '9px',
                                  border: '1px solid #ded6e1',
                                  textAlign: 'right',
                                  background: '#f0ebf2',
                                  fontWeight: 900,
                                  color: '#514456',
                                }}
                              >
                                TOTAL DA QUINZENA
                              </td>
                              <td
                                style={{
                                  padding: '9px 6px',
                                  border: '1px solid #ded6e1',
                                  textAlign: 'right',
                                  background: '#f0ebf2',
                                  fontWeight: 900,
                                }}
                              >
                                {moeda(resumo.totais.base + resumo.totais.adicional)}
                              </td>
                              <td
                                style={{
                                  padding: '9px 6px',
                                  border: '1px solid #ded6e1',
                                  textAlign: 'right',
                                  background: '#f0ebf2',
                                  fontWeight: 900,
                                }}
                              >
                                {moeda(resumo.totais.vt)}
                              </td>
                              <td
                                style={{
                                  padding: '9px 6px',
                                  border: '1px solid #ded6e1',
                                  textAlign: 'right',
                                  background: '#f0ebf2',
                                  fontWeight: 900,
                                }}
                              >
                                {moeda(resumo.totais.vr)}
                              </td>
                              <td
                                style={{
                                  padding: '9px 6px',
                                  border: '1px solid #cbbbd1',
                                  textAlign: 'right',
                                  background: '#e8dcec',
                                  color: '#583565',
                                  fontWeight: 900,
                                }}
                              >
                                {moeda(resumo.totais.total)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      <div
                        style={{
                          marginTop: '12px',
                          display: 'grid',
                          gridTemplateColumns:
                            'minmax(0,1fr) minmax(260px,.48fr)',
                          gap: '12px',
                        }}
                      >
                        <div
                          style={{
                            background: '#fff',
                            border: '1px solid #e8e2ea',
                            borderRadius: '16px',
                            padding: '14px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: '10px',
                              alignItems: 'center',
                              marginBottom: '8px',
                            }}
                          >
                            <strong
                              style={{
                                color: '#493d4e',
                                fontSize: '10.5px',
                              }}
                            >
                              Conferência automática
                            </strong>
                            <span
                              style={{
                                padding: '5px 8px',
                                borderRadius: '999px',
                                background:
                                  criticos > 0
                                    ? '#fde9e6'
                                    : resumo.inconsistencias.length
                                    ? '#fff4d8'
                                    : '#eaf8ef',
                                color:
                                  criticos > 0
                                    ? '#ad4d40'
                                    : resumo.inconsistencias.length
                                    ? '#94690d'
                                    : '#28734d',
                                fontSize: '8px',
                                fontWeight: 850,
                              }}
                            >
                              {criticos
                                ? `${criticos} bloqueio(s)`
                                : resumo.inconsistencias.length
                                ? `${resumo.inconsistencias.length} aviso(s)`
                                : 'Tudo certo'}
                            </span>
                          </div>

                          {!resumo.inconsistencias.length ? (
                            <div
                              style={{
                                padding: '10px',
                                borderRadius: '10px',
                                background: '#eef8f2',
                                color: '#397254',
                                fontSize: '8.5px',
                              }}
                            >
                              ✓ Lista do Dia, pontos e diárias conferidos.
                            </div>
                          ) : (
                            resumo.inconsistencias.slice(0, 8).map((item, i) => (
                              <div
                                key={i}
                                style={{
                                  padding: '7px 0',
                                  borderBottom: '1px solid #f0ecf1',
                                  color: '#766a79',
                                  fontSize: '8.2px',
                                }}
                              >
                                <strong
                                  style={{
                                    color:
                                      item.nivel === 'Crítico'
                                        ? '#a94d41'
                                        : '#916812',
                                  }}
                                >
                                  {item.nivel === 'Crítico' ? '! ' : '△ '}
                                  {item.tipo}:
                                </strong>{' '}
                                {item.detalhe}
                              </div>
                            ))
                          )}
                        </div>

                        <div
                          style={{
                            background: '#fff',
                            border: '1px solid #e8e2ea',
                            borderRadius: '16px',
                            padding: '14px',
                          }}
                        >
                          <strong
                            style={{
                              display: 'block',
                              color: '#493d4e',
                              fontSize: '10.5px',
                              marginBottom: '9px',
                            }}
                          >
                            Ações
                          </strong>

                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '7px',
                            }}
                          >
                            <button
                              className="secondary-button"
                              onClick={() =>
                                exportarFechamentoExcel(selecionado)
                              }
                            >
                              Exportar Excel
                            </button>

                            {(selecionado.status === 'Em conferência' ||
                              selecionado.status === 'Reaberto') && (
                              <button
                                className="primary-button"
                                disabled={criticos > 0}
                                onClick={() => aprovarQuinzena(indice)}
                              >
                                ✓ Aprovar quinzena
                              </button>
                            )}

                            {selecionado.status === 'Aprovado' && (
                              <>
                                <button
                                  className="primary-button"
                                  onClick={() =>
                                    enviarQuinzenaPagamentos(indice)
                                  }
                                >
                                  Enviar para pagamentos
                                </button>
                                <button
                                  className="secondary-button"
                                  onClick={() => reabrirQuinzena(indice)}
                                >
                                  Reabrir
                                </button>
                              </>
                            )}

                            {selecionado.status ===
                              'Enviado para pagamento' && (
                              <button
                                className="primary-button"
                                onClick={() => setTela('pagamentos')}
                              >
                                Abrir pagamentos
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: '12px',
                          padding: '10px 12px',
                          borderRadius: '11px',
                          background: '#f8f4fa',
                          border: '1px solid #eadfee',
                          color: '#766779',
                          fontSize: '8.2px',
                          lineHeight: 1.5,
                        }}
                      >
                        VT DIAS e VR DIAS mostram quantos dias daquele
                        funcionário tiveram o benefício lançado. Assim, por
                        exemplo, quem trabalhou 6 dias pode aparecer com 6 dias
                        de VT e 6 dias de VR, igual à lógica visual da planilha.
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        minHeight: '260px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff',
                        border: '1px solid #e8e2ea',
                        borderRadius: '18px',
                        color: '#958b97',
                        fontSize: '9px',
                      }}
                    >
                      Selecione uma quinzena para visualizar a planilha.
                    </div>
                  )}
                </>
              )
            })()}
          </>
        )}

        {tela === 'pagamentos' && temAcesso('pagamentos') && (
          <>
            <div className="page-header">
              <div>
                <span className="section-label">FINANCEIRO</span>

                <h1 className="page-title">Pagamentos</h1>

                <p className="page-subtitle">
                  Central de pagamentos individuais via PIX.
                </p>
              </div>

              <div className="payment-header-badge">
                <span>Valor pendente</span>
                <strong>{moeda(valorPendentePagamentos)}</strong>
              </div>
            </div>

            <div className="cards pagamento-cards">
              <div className="card payment-summary-card">
                <div className="payment-summary-icon pending">◷</div>

                <div>
                  <span>Aguardando pagamento</span>
                  <strong>{pagamentosPendentes}</strong>
                  <small>Pagamentos ainda não confirmados</small>
                </div>
              </div>

              <div className="card payment-summary-card">
                <div className="payment-summary-icon success">✓</div>

                <div>
                  <span>Pagamentos concluídos</span>
                  <strong>{pagamentosPagos}</strong>
                  <small>Transferências já registradas</small>
                </div>
              </div>

              <div className="card payment-summary-card">
                <div className="payment-summary-icon money">R$</div>

                <div>
                  <span>Total já pago</span>
                  <strong>{moeda(valorTotalPago)}</strong>
                  <small>Valor confirmado no sistema</small>
                </div>
              </div>
            </div>

            <div className="payment-info-banner">
              <div className="payment-info-icon">◆</div>

              <div>
                <strong>Central PIX</strong>

                <span>
                  Abra os dados PIX do trabalhador, confira o valor e confirme
                  o pagamento após a transferência.
                </span>
              </div>
            </div>

            <div className="filter-panel">
              <div className="filter-header">
                <div>
                  <strong>Filtros dos pagamentos</strong>
                  <span>
                    Encontre um funcionário ou uma quinzena específica.
                  </span>
                </div>

                <button
                  className="clear-filter-button"
                  onClick={limparFiltrosPagamentos}
                >
                  Limpar filtros
                </button>
              </div>

              <div className="filter-grid filter-grid-3">
                <div className="filter-field">
                  <label>Pesquisar</label>

                  <input
                    placeholder="Funcionário ou chave PIX..."
                    value={buscaPagamento}
                    onChange={(e) => setBuscaPagamento(e.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label>Quinzena</label>

                  <select
                    value={periodoPagamentoFiltro}
                    onChange={(e) => setPeriodoPagamentoFiltro(e.target.value)}
                  >
                    <option value="Todos">Todas as quinzenas</option>

                    {periodosPagamento.map((periodo) => (
                      <option key={periodo} value={periodo}>
                        {periodo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label>Status</label>

                  <select
                    value={statusPagamentoFiltro}
                    onChange={(e) => setStatusPagamentoFiltro(e.target.value)}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Aguardando">Aguardando</option>
                    <option value="Pago">Pago</option>
                  </select>
                </div>
              </div>

              <div className="filter-result">
                {pagamentosFiltrados.length} pagamento(s) encontrado(s)
              </div>
            </div>

            <div className="panel payment-table-panel">
              <div className="payment-table-header">
                <div>
                  <span className="section-label">TRANSFERÊNCIAS</span>
                  <h2>Lista de pagamentos</h2>
                </div>

                <span className="payment-table-count">
                  {pagamentosFiltrados.length} registro(s)
                </span>
              </div>

              <div className="table-wrapper">
                <table className="employees-table payment-table">
                  <thead>
                    <tr>
                      <th>Funcionário</th>
                      <th>Período</th>
                      <th>Diárias</th>
                      <th>Valor</th>
                      <th>PIX</th>
                      <th>Status</th>
                      <th>Pagamento</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagamentosFiltrados.map(
                      ({ pagamento, indexOriginal }) => {
                        const funcionario = obterFuncionarioPorNome(
                          pagamento.nome
                        )

                        return (
                          <tr key={indexOriginal}>
                            <td>
                              <div className="payment-worker-cell">
                                <div className="payment-worker-avatar">
                                  {pagamento.nome.charAt(0)}
                                </div>

                                <div>
                                  <strong>{pagamento.nome}</strong>
                                  <small>{funcionario?.funcao || '-'}</small>
                                </div>
                              </div>
                            </td>

                            <td>{pagamento.periodo}</td>

                            <td>
                              <span className="daily-count-badge">
                                {pagamento.quantidadeDiarias}
                              </span>
                            </td>

                            <td>
                              <strong className="payment-money-value">
                                {moeda(pagamento.valorTotal)}
                              </strong>
                            </td>

                            <td>
                              <div className="payment-pix-cell">
                                <span>{funcionario?.tipoPix || 'PIX'}</span>
                                <strong>{pagamento.pix}</strong>
                              </div>
                            </td>

                            <td>
                              <span
                                className={
                                  pagamento.status === 'Pago'
                                    ? 'employee-status active-status'
                                    : 'employee-status pending-status'
                                }
                              >
                                {pagamento.status}
                              </span>
                            </td>

                            <td>{pagamento.dataPagamento}</td>

                            <td>
                              <div className="table-actions">
                                <button
                                  className="pix-button"
                                  onClick={() =>
                                    setPagamentoPixSelecionado(pagamento)
                                  }
                                >
                                  ◫ Ver PIX
                                </button>

                                {pagamento.status === 'Aguardando' ? (
                                  <button
                                    className="payment-small-confirm"
                                    onClick={() =>
                                      marcarPagamentoComoPago(indexOriginal)
                                    }
                                  >
                                    ✓ Pago
                                  </button>
                                ) : (
                                  <span className="registered-text">
                                    Concluído
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      }
                    )}
                  </tbody>
                </table>

                {pagamentosFiltrados.length === 0 && (
                  <div className="empty-filter-result">
                    Nenhum pagamento encontrado.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tela === 'documentos' && temAcesso('documentos') && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Documentos</h1>

                <p className="page-subtitle">
                  Arquivo digital dos trabalhadores.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => setMostrarDocumento(true)}
              >
                + Adicionar Documento
              </button>
            </div>

            <div className="cards documento-cards">
              <div className="card">
                <span>Cadastrados</span>
                <strong>{documentos.length}</strong>
              </div>

              <div className="card">
                <span>Ativos</span>
                <strong>{documentosAtivos}</strong>
              </div>

              <div className="card">
                <span>Arquivados</span>
                <strong>{documentosArquivados}</strong>
              </div>
            </div>

            <div className="filter-panel">
              <div className="filter-header">
                <div>
                  <strong>Filtros dos documentos</strong>
                  <span>Localize documentos e trabalhadores rapidamente.</span>
                </div>

                <button
                  className="clear-filter-button"
                  onClick={limparFiltrosDocumentos}
                >
                  Limpar filtros
                </button>
              </div>

              <div className="filter-grid filter-grid-3">
                <div className="filter-field">
                  <label>Pesquisar</label>

                  <input
                    placeholder="Funcionário ou documento..."
                    value={buscaDocumento}
                    onChange={(e) => setBuscaDocumento(e.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label>Tipo</label>

                  <select
                    value={tipoDocumentoFiltro}
                    onChange={(e) => setTipoDocumentoFiltro(e.target.value)}
                  >
                    <option value="Todos">Todos os tipos</option>

                    {tiposDocumento.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label>Status</label>

                  <select
                    value={statusDocumentoFiltro}
                    onChange={(e) => setStatusDocumentoFiltro(e.target.value)}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Ativo">Ativo</option>
                    <option value="Expirado">Expirado</option>
                    <option value="Arquivado">Arquivado</option>
                  </select>
                </div>
              </div>

              <div className="filter-result">
                {documentosFiltrados.length} documento(s) encontrado(s)
              </div>
            </div>

            {mostrarDocumento && (
              <div className="panel form-panel">
                <div className="form-header">
                  <h2>Adicionar Documento</h2>

                  <button
                    className="close-button"
                    onClick={() => setMostrarDocumento(false)}
                  >
                    ✕
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Funcionário</label>

                    <select
                      value={novoDocumento.funcionario}
                      onChange={(e) =>
                        setNovoDocumento({
                          ...novoDocumento,
                          funcionario: e.target.value,
                        })
                      }
                    >
                      <option value="">Selecione</option>

                      {funcionarios
                        .filter((funcionario) => funcionario.status === 'Ativo')
                        .map((funcionario) => (
                          <option
                            key={funcionario.id || funcionario.nome}
                            value={funcionario.nome}
                          >
                            {funcionario.nome}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tipo</label>

                    <select
                      value={novoDocumento.tipo}
                      onChange={(e) =>
                        setNovoDocumento({
                          ...novoDocumento,
                          tipo: e.target.value,
                        })
                      }
                    >
                      <option value="">Selecione</option>
                      <option value="Contrato">Contrato</option>
                      <option value="RG/CNH">RG / CNH</option>
                      <option value="CPF">CPF</option>
                      <option value="Comprovante de endereço">
                        Comprovante de endereço
                      </option>
                      <option value="Atestado">Atestado</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Título</label>
                    <input
                      placeholder="Ex.: Contrato assinado 2026"
                      value={novoDocumento.titulo}
                      onChange={(e) =>
                        setNovoDocumento({
                          ...novoDocumento,
                          titulo: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Validade (opcional)</label>
                    <input
                      type="date"
                      value={novoDocumento.validade}
                      onChange={(e) =>
                        setNovoDocumento({
                          ...novoDocumento,
                          validade: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Arquivo (máx. 10 MB)</label>

                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                      onChange={(e) => {
                        const arquivo = e.target.files?.[0] || null
                        setNovoDocumento({
                          ...novoDocumento,
                          nomeArquivo: arquivo?.name || '',
                          arquivo,
                        })
                      }}
                    />
                    {novoDocumento.nomeArquivo && (
                      <small>{novoDocumento.nomeArquivo}</small>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="secondary-button"
                    onClick={() => setMostrarDocumento(false)}
                  >
                    Cancelar
                  </button>

                  <button
                    className="primary-button"
                    onClick={salvarDocumento}
                    disabled={enviandoDocumento}
                  >
                    {enviandoDocumento ? 'Enviando...' : 'Salvar Documento'}
                  </button>
                </div>
              </div>
            )}

            <div className="panel">
              <div className="table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Funcionário</th>
                      <th>Tipo</th>
                      <th>Envio</th>
                      <th>Validade</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {documentosFiltrados.map((documento, index) => (
                      <tr key={documento.id || index}>
                        <td>
                          <strong>{documento.titulo || documento.nome}</strong>
                          {documento.titulo !== documento.nome && (
                            <div className="table-secondary-text">
                              {documento.nome}
                            </div>
                          )}
                        </td>

                        <td>{documento.funcionario}</td>

                        <td>{documento.tipo}</td>

                        <td>{documento.dataEnvio}</td>

                        <td>{documento.validade || '-'}</td>

                        <td>
                          <span
                            className={
                              documento.status === 'Ativo'
                                ? 'employee-status active-status'
                                : 'employee-status pending-status'
                            }
                          >
                            {documento.status}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              className="action-button"
                              onClick={() => void abrirDocumento(documento)}
                            >
                              Abrir
                            </button>

                            {documento.status !== 'Arquivado' && (
                              <button
                                className="action-button"
                                onClick={() => void arquivarDocumento(documento)}
                              >
                                Arquivar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {documentosFiltrados.length === 0 && (
                  <div className="empty-filter-result">
                    Nenhum documento encontrado.
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tela === 'relatorios' && temAcesso('relatorios') && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Relatórios</h1>

                <p className="page-subtitle">
                  Dados operacionais e financeiros.
                </p>
              </div>

              <div className="report-actions">
                <button className="secondary-button" onClick={exportarExcel}>
                  Exportar Excel
                </button>

                <button className="primary-button" onClick={exportarPDF}>
                  Exportar PDF
                </button>
              </div>
            </div>

            <div className="cards relatorio-cards">
              <div className="card">
                <span>Funcionários ativos</span>
                <strong>{funcionariosAtivos}</strong>
              </div>

              <div className="card">
                <span>Pontos registrados</span>
                <strong>{totalRegistrados}</strong>
              </div>

              <div className="card">
                <span>Diárias aprovadas</span>
                <strong>{totalDiariasAprovadas}</strong>
              </div>

              <div className="card">
                <span>Total pago</span>
                <strong>{moeda(valorTotalPago)}</strong>
              </div>
            </div>

            <div className="report-grid">
              <div className="panel">
                <h2>Resumo operacional</h2>

                <div className="report-row">
                  <span>Funcionários cadastrados</span>
                  <strong>{funcionarios.length}</strong>
                </div>

                <div className="report-row">
                  <span>Pontos registrados</span>
                  <strong>{totalRegistrados}</strong>
                </div>

                <div className="report-row">
                  <span>Diárias aprovadas</span>
                  <strong>{totalDiariasAprovadas}</strong>
                </div>
              </div>

              <div className="panel">
                <h2>Resumo financeiro</h2>

                <div className="report-row">
                  <span>Pagamentos pendentes</span>
                  <strong>{pagamentosPendentes}</strong>
                </div>

                <div className="report-row">
                  <span>Pagamentos concluídos</span>
                  <strong>{pagamentosPagos}</strong>
                </div>

                <div className="report-row">
                  <span>Valor pago</span>
                  <strong className="report-success">
                    {moeda(valorTotalPago)}
                  </strong>
                </div>
              </div>
            </div>
          </>
        )}

        {tela === 'calendario' && temAcesso('calendario') && (
          <>
            {(() => {
              const ano = mesCalendario.getFullYear()
              const mes = mesCalendario.getMonth()
              const primeiroDia = new Date(ano, mes, 1)
              const ultimoDia = new Date(ano, mes + 1, 0)
              const inicioSemana = primeiroDia.getDay()
              const quantidadeDias = ultimoDia.getDate()
              const hojeIso = dataISO(new Date())

              const diasCalendario: Array<Date | null> = []
              for (let i = 0; i < inicioSemana; i += 1) {
                diasCalendario.push(null)
              }
              for (let dia = 1; dia <= quantidadeDias; dia += 1) {
                diasCalendario.push(new Date(ano, mes, dia, 12, 0, 0))
              }
              while (diasCalendario.length % 7 !== 0) {
                diasCalendario.push(null)
              }

              const termoFeriado = buscaFeriado.trim().toLowerCase()
              const feriadosFiltrados = feriados
                .filter(
                  (feriado) =>
                    !termoFeriado ||
                    feriado.nome.toLowerCase().includes(termoFeriado) ||
                    feriado.tipo.toLowerCase().includes(termoFeriado) ||
                    new Date(`${feriado.data}T12:00:00`)
                      .toLocaleDateString('pt-BR')
                      .includes(termoFeriado)
                )
                .sort((a, b) => a.data.localeCompare(b.data))

              const ativos = feriados.filter((feriado) => feriado.ativo)
              const feriadosNoMes = ativos.filter((feriado) => {
                const data = new Date(`${feriado.data}T12:00:00`)
                return data.getFullYear() === ano && data.getMonth() === mes
              })

              const proximos = ativos
                .filter((feriado) => feriado.data >= hojeIso)
                .sort((a, b) => a.data.localeCompare(b.data))
                .slice(0, 3)

              const mudarMes = (diferenca: number) => {
                setMesCalendario(
                  new Date(
                    mesCalendario.getFullYear(),
                    mesCalendario.getMonth() + diferenca,
                    1
                  )
                )
              }

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      gap: '16px',
                      flexWrap: 'wrap',
                      marginBottom: '18px',
                    }}
                  >
                    <div>
                      <span className="section-label">
                        OPERAÇÃO • REGRAS AUTOMÁTICAS
                      </span>
                      <h1 className="page-title">Calendário Operacional</h1>
                      <p className="page-subtitle">
                        Feriados cadastrados alteram automaticamente o cálculo
                        das novas diárias e ficam destacados no calendário.
                      </p>
                    </div>

                    {podeAdministrar && (
                      <button
                        className="primary-button"
                        onClick={() =>
                          setMostrarNovoFeriado((atual) => !atual)
                        }
                      >
                        {mostrarNovoFeriado
                          ? 'Cancelar'
                          : '+ Adicionar feriado'}
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    {[
                      {
                        titulo: 'Feriados ativos',
                        valor: ativos.length,
                        detalhe: 'considerados no cálculo',
                        fundo: '#f1eaf5',
                        cor: '#65387a',
                      },
                      {
                        titulo: 'Neste mês',
                        valor: feriadosNoMes.length,
                        detalhe: mesCalendario.toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric',
                        }),
                        fundo: '#fff4d8',
                        cor: '#94690d',
                      },
                      {
                        titulo: 'Adicional feriado',
                        valor: `${configuracaoValores.percentualFeriado}%`,
                        detalhe: 'adicional em feriado de dia útil',
                        fundo: '#eaf8ef',
                        cor: '#28734d',
                      },
                      {
                        titulo: 'Próximo feriado',
                        valor: proximos[0]
                          ? new Date(
                              `${proximos[0].data}T12:00:00`
                            ).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          : '—',
                        detalhe: proximos[0]?.nome || 'nenhum cadastrado',
                        fundo: '#eaf1ff',
                        cor: '#315ea8',
                      },
                    ].map((card) => (
                      <div
                        key={card.titulo}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e9e3eb',
                          borderRadius: '18px',
                          padding: '16px',
                          boxShadow: '0 7px 22px rgba(60,36,72,.045)',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '11px',
                            background: card.fundo,
                            color: card.cor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px',
                            fontWeight: 900,
                          }}
                        >
                          ▣
                        </div>
                        <span
                          style={{
                            display: 'block',
                            color: '#847a87',
                            fontSize: '9px',
                            marginBottom: '5px',
                          }}
                        >
                          {card.titulo}
                        </span>
                        <strong
                          style={{
                            display: 'block',
                            color: '#3b3040',
                            fontSize: '21px',
                            marginBottom: '3px',
                            textTransform:
                              card.titulo === 'Neste mês' ? 'capitalize' : 'none',
                          }}
                        >
                          {card.valor}
                        </strong>
                        <small style={{ color: '#9e96a0', fontSize: '8px' }}>
                          {card.detalhe}
                        </small>
                      </div>
                    ))}
                  </div>

                  {mostrarNovoFeriado && podeAdministrar && (
                    <form
                      onSubmit={adicionarFeriado}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e8e1eb',
                        borderRadius: '18px',
                        padding: '16px',
                        marginBottom: '16px',
                        boxShadow: '0 8px 24px rgba(60,36,72,.045)',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'minmax(150px,.7fr) minmax(220px,1.4fr) minmax(150px,.7fr) auto',
                          gap: '10px',
                          alignItems: 'end',
                        }}
                      >
                        <div className="form-group">
                          <label>Data</label>
                          <input
                            type="date"
                            value={novoFeriadoData}
                            onChange={(e) =>
                              setNovoFeriadoData(e.target.value)
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Nome do feriado</label>
                          <input
                            value={novoFeriadoNome}
                            onChange={(e) =>
                              setNovoFeriadoNome(e.target.value)
                            }
                            placeholder="Ex.: Aniversário do município"
                          />
                        </div>

                        <div className="form-group">
                          <label>Tipo</label>
                          <select
                            value={novoFeriadoTipo}
                            onChange={(e) =>
                              setNovoFeriadoTipo(
                                e.target.value as TipoFeriado
                              )
                            }
                          >
                            <option value="Nacional">Nacional</option>
                            <option value="Estadual">Estadual</option>
                            <option value="Municipal">Municipal</option>
                            <option value="Interno">Interno</option>
                          </select>
                        </div>

                        <button className="primary-button">
                          Salvar feriado
                        </button>
                      </div>
                    </form>
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'minmax(0, 1.45fr) minmax(290px, .55fr)',
                      gap: '16px',
                      alignItems: 'start',
                    }}
                  >
                    <div
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e8e2ea',
                        borderRadius: '20px',
                        padding: '17px',
                        boxShadow: '0 10px 28px rgba(60,36,72,.05)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginBottom: '15px',
                        }}
                      >
                        <button
                          className="secondary-button"
                          onClick={() => mudarMes(-1)}
                        >
                          ‹
                        </button>

                        <div style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'block',
                              color: '#9b919e',
                              fontSize: '8px',
                              marginBottom: '2px',
                            }}
                          >
                            CALENDÁRIO
                          </span>
                          <strong
                            style={{
                              display: 'block',
                              color: '#47394c',
                              fontSize: '15px',
                              textTransform: 'capitalize',
                            }}
                          >
                            {mesCalendario.toLocaleDateString('pt-BR', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </strong>
                        </div>

                        <button
                          className="secondary-button"
                          onClick={() => mudarMes(1)}
                        >
                          ›
                        </button>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          gap: '6px',
                          marginBottom: '6px',
                        }}
                      >
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(
                          (dia) => (
                            <div
                              key={dia}
                              style={{
                                textAlign: 'center',
                                color: '#9c919f',
                                fontSize: '8px',
                                fontWeight: 850,
                                padding: '6px 0',
                              }}
                            >
                              {dia}
                            </div>
                          )
                        )}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          gap: '6px',
                        }}
                      >
                        {diasCalendario.map((data, index) => {
                          if (!data) {
                            return (
                              <div
                                key={`vazio-${index}`}
                                style={{
                                  minHeight: '76px',
                                  borderRadius: '12px',
                                  background: '#fbfafb',
                                }}
                              />
                            )
                          }

                          const iso = dataISO(data)
                          const feriado = feriados.find(
                            (item) => item.ativo && item.data === iso
                          )
                          const domingo = data.getDay() === 0
                          const sabado = data.getDay() === 6
                          const hoje = iso === hojeIso

                          return (
                            <div
                              key={iso}
                              style={{
                                minHeight: '76px',
                                borderRadius: '12px',
                                padding: '8px',
                                boxSizing: 'border-box',
                                border: hoje
                                  ? '2px solid #755087'
                                  : feriado
                                  ? '1px solid #e6cfaa'
                                  : '1px solid #eee9ef',
                                background: feriado
                                  ? '#fff8e9'
                                  : domingo
                                  ? '#fff4f2'
                                  : sabado
                                  ? '#eef4ff'
                                  : '#ffffff',
                                position: 'relative',
                              }}
                            >
                              <strong
                                style={{
                                  display: 'block',
                                  color: feriado
                                    ? '#8f6719'
                                    : domingo
                                    ? '#a84f43'
                                    : sabado
                                    ? '#48699d'
                                    : '#554a59',
                                  fontSize: '10px',
                                  marginBottom: '5px',
                                }}
                              >
                                {data.getDate()}
                              </strong>

                              {feriado && (
                                <span
                                  style={{
                                    display: 'block',
                                    color: '#8f6719',
                                    fontSize: '7px',
                                    lineHeight: 1.3,
                                    fontWeight: 750,
                                  }}
                                >
                                  {feriado.nome}
                                </span>
                              )}

                              {!feriado && (sabado || domingo) && (
                                <span
                                  style={{
                                    display: 'block',
                                    color: domingo ? '#b36b60' : '#6681aa',
                                    fontSize: '7px',
                                  }}
                                >
                                  {domingo ? 'Domingo' : 'Sábado'}
                                </span>
                              )}

                              {hoje && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    right: '6px',
                                    top: '6px',
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: '#754d87',
                                  }}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          flexWrap: 'wrap',
                          marginTop: '12px',
                          color: '#8e838f',
                          fontSize: '8px',
                        }}
                      >
                        <span>🟨 Feriado</span>
                        <span>🟦 Sábado</span>
                        <span>🟥 Domingo</span>
                        <span>● Hoje</span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                      }}
                    >
                      <div
                        style={{
                          background:
                            'linear-gradient(145deg, #684078, #4f315d)',
                          borderRadius: '20px',
                          padding: '18px',
                          color: '#ffffff',
                          boxShadow: '0 14px 32px rgba(69,43,80,.14)',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            color: '#d9c9df',
                            fontSize: '8px',
                            fontWeight: 850,
                            letterSpacing: '.08em',
                            marginBottom: '7px',
                          }}
                        >
                          REGRA AUTOMÁTICA
                        </span>
                        <strong
                          style={{
                            display: 'block',
                            fontSize: '16px',
                            marginBottom: '6px',
                          }}
                        >
                          Feriado em dia útil ={' '}
                          {configuracaoValores.percentualFeriado}% de adicional
                        </strong>
                        <span
                          style={{
                            display: 'block',
                            color: '#d8cddd',
                            fontSize: '8.5px',
                            lineHeight: 1.55,
                          }}
                        >
                          A nova diária usa base + adicional do dia + VT + VR.
                          Se o feriado cair no sábado ou domingo, vale somente a regra
                          daquele fim de semana, sem adicional extra de feriado.
                        </span>
                      </div>

                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e8e2ea',
                          borderRadius: '18px',
                          padding: '16px',
                        }}
                      >
                        <strong
                          style={{
                            display: 'block',
                            color: '#493c4e',
                            fontSize: '11px',
                            marginBottom: '10px',
                          }}
                        >
                          Próximos feriados
                        </strong>

                        {proximos.length === 0 ? (
                          <span
                            style={{
                              color: '#978d9a',
                              fontSize: '8.5px',
                            }}
                          >
                            Nenhum feriado futuro cadastrado.
                          </span>
                        ) : (
                          proximos.map((feriado) => (
                            <div
                              key={feriado.id}
                              style={{
                                display: 'flex',
                                gap: '9px',
                                padding: '9px 0',
                                borderBottom: '1px solid #f0ecf1',
                              }}
                            >
                              <div
                                style={{
                                  width: '42px',
                                  minWidth: '42px',
                                  height: '42px',
                                  borderRadius: '11px',
                                  background: '#fff4d8',
                                  color: '#906711',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '9px',
                                  fontWeight: 900,
                                }}
                              >
                                {new Date(
                                  `${feriado.data}T12:00:00`
                                ).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </div>

                              <div>
                                <strong
                                  style={{
                                    display: 'block',
                                    color: '#514456',
                                    fontSize: '9px',
                                    marginBottom: '3px',
                                  }}
                                >
                                  {feriado.nome}
                                </strong>
                                <span
                                  style={{
                                    color: '#9b919e',
                                    fontSize: '7.5px',
                                  }}
                                >
                                  {feriado.tipo}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '16px',
                      background: '#ffffff',
                      border: '1px solid #e8e2ea',
                      borderRadius: '19px',
                      overflow: 'hidden',
                      boxShadow: '0 9px 26px rgba(60,36,72,.045)',
                    }}
                  >
                    <div
                      style={{
                        padding: '15px 17px',
                        borderBottom: '1px solid #eee9f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            display: 'block',
                            color: '#443849',
                            fontSize: '12px',
                            marginBottom: '3px',
                          }}
                        >
                          Feriados cadastrados
                        </strong>
                        <span
                          style={{
                            color: '#9b929e',
                            fontSize: '8.5px',
                          }}
                        >
                          Nacionais pré-cadastrados e datas locais adicionadas
                          pelo administrador.
                        </span>
                      </div>

                      <input
                        value={buscaFeriado}
                        onChange={(e) => setBuscaFeriado(e.target.value)}
                        placeholder="Buscar feriado..."
                        style={{
                          minWidth: '220px',
                          minHeight: '36px',
                          borderRadius: '10px',
                          border: '1px solid #ddd6df',
                          padding: '0 11px',
                          fontSize: '9px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div className="table-wrapper">
                      <table className="employees-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Feriado</th>
                            <th>Tipo</th>
                            <th>Regra</th>
                            <th>Status</th>
                            {podeAdministrar && <th>Ações</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {feriadosFiltrados.map((feriado) => (
                            <tr key={feriado.id}>
                              <td>
                                {new Date(
                                  `${feriado.data}T12:00:00`
                                ).toLocaleDateString('pt-BR')}
                              </td>
                              <td>
                                <strong>{feriado.nome}</strong>
                              </td>
                              <td>{feriado.tipo}</td>
                              <td>
                                +{configuracaoValores.percentualFeriado}%
                              </td>
                              <td>
                                <span
                                  className={`employee-status ${
                                    feriado.ativo
                                      ? 'active-status'
                                      : 'inactive-status'
                                  }`}
                                >
                                  {feriado.ativo ? 'Ativo' : 'Desativado'}
                                </span>
                              </td>
                              {podeAdministrar && (
                                <td>
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: '6px',
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <button
                                      className="table-action-button"
                                      onClick={() =>
                                        alternarFeriado(feriado.id)
                                      }
                                    >
                                      {feriado.ativo
                                        ? 'Desativar'
                                        : 'Ativar'}
                                    </button>
                                    <button
                                      className="table-action-button"
                                      onClick={() =>
                                        excluirFeriado(feriado.id)
                                      }
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '14px',
                      padding: '11px 13px',
                      borderRadius: '11px',
                      background: '#fff8e8',
                      border: '1px solid #f0dfb7',
                      color: '#856525',
                      fontSize: '8.5px',
                      lineHeight: 1.55,
                    }}
                  >
                    ✓ Os feriados nacionais oficiais são sincronizados automaticamente
                    para o ano atual e os próximos 5 anos. Feriados estaduais, municipais,
                    pontos facultativos e datas específicas da empresa continuam podendo
                    ser adicionados pelo administrador.
                  </div>
                </>
              )
            })()}
          </>
        )}

        {tela === 'auditoria' && temAcesso('auditoria') && (
          <>
            {(() => {
              const termo = buscaAuditoria.trim().toLowerCase()

              const registrosFiltrados = registrosAuditoria.filter((registro) => {
                const bateBusca =
                  !termo ||
                  registro.usuario.toLowerCase().includes(termo) ||
                  registro.acao.toLowerCase().includes(termo) ||
                  registro.modulo.toLowerCase().includes(termo) ||
                  registro.detalhe.toLowerCase().includes(termo)

                const bateModulo =
                  moduloAuditoriaFiltro === 'Todos' ||
                  registro.modulo === moduloAuditoriaFiltro

                const bateNivel =
                  nivelAuditoriaFiltro === 'Todos' ||
                  registro.nivel === nivelAuditoriaFiltro

                const bateData =
                  !dataAuditoriaFiltro ||
                  registro.dataHora.startsWith(
                    new Date(
                      `${dataAuditoriaFiltro}T12:00:00`
                    ).toLocaleDateString('pt-BR')
                  )

                return bateBusca && bateModulo && bateNivel && bateData
              })

              const modulosAuditoria = [
                'Todos',
                ...Array.from(
                  new Set(registrosAuditoria.map((registro) => registro.modulo))
                ),
              ]

              const hojeAuditoria = new Date().toLocaleDateString('pt-BR')

              const eventosHoje = registrosAuditoria.filter((registro) =>
                registro.dataHora.startsWith(hojeAuditoria)
              ).length

              const eventosAtencao = registrosAuditoria.filter(
                (registro) => registro.nivel === 'Atenção'
              ).length

              const eventosCriticos = registrosAuditoria.filter(
                (registro) => registro.nivel === 'Crítico'
              ).length

              return (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      gap: '16px',
                      flexWrap: 'wrap',
                      marginBottom: '18px',
                    }}
                  >
                    <div>
                      <span className="section-label">
                        SEGURANÇA • RASTREABILIDADE
                      </span>
                      <h1 className="page-title">Auditoria do Sistema</h1>
                      <p className="page-subtitle">
                        Histórico de acessos e alterações importantes realizadas
                        no painel administrativo.
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        padding: '8px 11px',
                        borderRadius: '999px',
                        background: '#eaf8ef',
                        color: '#24754c',
                        fontSize: '8px',
                        fontWeight: 850,
                      }}
                    >
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#2fa769',
                        }}
                      />
                      Registro de eventos ativo
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      marginBottom: '16px',
                    }}
                  >
                    {[
                      {
                        titulo: 'Eventos registrados',
                        valor: registrosAuditoria.length,
                        detalhe: 'histórico protegido',
                        fundo: '#f1eaf5',
                        cor: '#65387a',
                      },
                      {
                        titulo: 'Eventos hoje',
                        valor: eventosHoje,
                        detalhe: hojeAuditoria,
                        fundo: '#eaf1ff',
                        cor: '#315ea8',
                      },
                      {
                        titulo: 'Atenções',
                        valor: eventosAtencao,
                        detalhe: 'ações sensíveis',
                        fundo: '#fff4d8',
                        cor: '#94690d',
                      },
                      {
                        titulo: 'Críticos',
                        valor: eventosCriticos,
                        detalhe:
                          eventosCriticos === 0
                            ? 'nenhum evento crítico'
                            : 'requer conferência',
                        fundo: '#fde9e6',
                        cor: '#ad4d40',
                      },
                    ].map((card) => (
                      <div
                        key={card.titulo}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e9e3eb',
                          borderRadius: '18px',
                          padding: '16px',
                          boxShadow: '0 7px 22px rgba(60,36,72,.045)',
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '11px',
                            background: card.fundo,
                            color: card.cor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px',
                            fontWeight: 900,
                          }}
                        >
                          ⌕
                        </div>
                        <span
                          style={{
                            display: 'block',
                            color: '#847a87',
                            fontSize: '9px',
                            marginBottom: '5px',
                          }}
                        >
                          {card.titulo}
                        </span>
                        <strong
                          style={{
                            display: 'block',
                            color: '#3b3040',
                            fontSize: '22px',
                            marginBottom: '3px',
                          }}
                        >
                          {card.valor}
                        </strong>
                        <small
                          style={{
                            color: '#9e96a0',
                            fontSize: '8px',
                          }}
                        >
                          {card.detalhe}
                        </small>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e9e3eb',
                      borderRadius: '17px',
                      padding: '14px',
                      marginBottom: '14px',
                      boxShadow: '0 7px 22px rgba(60,36,72,.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'minmax(210px, 1.4fr) repeat(3, minmax(130px, .7fr)) auto',
                        gap: '9px',
                        alignItems: 'end',
                      }}
                    >
                      <div className="form-group">
                        <label>Buscar evento</label>
                        <input
                          value={buscaAuditoria}
                          onChange={(e) => setBuscaAuditoria(e.target.value)}
                          placeholder="Usuário, ação, módulo ou detalhe..."
                        />
                      </div>

                      <div className="form-group">
                        <label>Módulo</label>
                        <select
                          value={moduloAuditoriaFiltro}
                          onChange={(e) =>
                            setModuloAuditoriaFiltro(e.target.value)
                          }
                        >
                          {modulosAuditoria.map((modulo) => (
                            <option key={modulo} value={modulo}>
                              {modulo}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Nível</label>
                        <select
                          value={nivelAuditoriaFiltro}
                          onChange={(e) =>
                            setNivelAuditoriaFiltro(e.target.value)
                          }
                        >
                          <option value="Todos">Todos</option>
                          <option value="Informação">Informação</option>
                          <option value="Atenção">Atenção</option>
                          <option value="Crítico">Crítico</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Data</label>
                        <input
                          type="date"
                          value={dataAuditoriaFiltro}
                          onChange={(e) =>
                            setDataAuditoriaFiltro(e.target.value)
                          }
                        />
                      </div>

                      <button
                        className="secondary-button"
                        onClick={() => {
                          setBuscaAuditoria('')
                          setModuloAuditoriaFiltro('Todos')
                          setNivelAuditoriaFiltro('Todos')
                          setDataAuditoriaFiltro('')
                        }}
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e9e3eb',
                      borderRadius: '19px',
                      overflow: 'hidden',
                      boxShadow: '0 9px 26px rgba(60,36,72,.05)',
                    }}
                  >
                    <div
                      style={{
                        padding: '16px 18px',
                        borderBottom: '1px solid #eee9f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <strong
                          style={{
                            display: 'block',
                            color: '#3f3444',
                            fontSize: '13px',
                            marginBottom: '3px',
                          }}
                        >
                          Linha do tempo de auditoria
                        </strong>
                        <span
                          style={{
                            color: '#9b929e',
                            fontSize: '9px',
                          }}
                        >
                          {registrosFiltrados.length} evento(s) encontrado(s)
                        </span>
                      </div>

                      <span
                        style={{
                          color: '#9b929e',
                          fontSize: '8px',
                        }}
                      >
                        Últimos 500 eventos registrados
                      </span>
                    </div>

                    {registrosFiltrados.length === 0 ? (
                      <div
                        style={{
                          padding: '44px 20px',
                          textAlign: 'center',
                          color: '#978d9a',
                          fontSize: '10px',
                        }}
                      >
                        Nenhum evento encontrado com os filtros selecionados.
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '8px 18px 16px',
                        }}
                      >
                        {registrosFiltrados.map((registro) => (
                          <div
                            key={registro.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                '132px 42px minmax(160px,.85fr) minmax(160px,.9fr) minmax(240px,1.5fr)',
                              gap: '12px',
                              alignItems: 'center',
                              padding: '12px 0',
                              borderBottom: '1px solid #f0ecf1',
                            }}
                          >
                            <div>
                              <strong
                                style={{
                                  display: 'block',
                                  color: '#5a4e5e',
                                  fontSize: '9px',
                                  marginBottom: '2px',
                                }}
                              >
                                {registro.dataHora}
                              </strong>
                              <span
                                style={{
                                  color: '#a097a3',
                                  fontSize: '8px',
                                }}
                              >
                                {registro.modulo}
                              </span>
                            </div>

                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                background:
                                  registro.nivel === 'Crítico'
                                    ? '#fde8e4'
                                    : registro.nivel === 'Atenção'
                                    ? '#fff4d8'
                                    : '#eef2fa',
                                color:
                                  registro.nivel === 'Crítico'
                                    ? '#ad4d40'
                                    : registro.nivel === 'Atenção'
                                    ? '#94690d'
                                    : '#506a98',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                              }}
                            >
                              {registro.nivel === 'Crítico'
                                ? '!'
                                : registro.nivel === 'Atenção'
                                ? '△'
                                : 'i'}
                            </div>

                            <div>
                              <strong
                                style={{
                                  display: 'block',
                                  color: '#443849',
                                  fontSize: '9.5px',
                                  marginBottom: '3px',
                                }}
                              >
                                {registro.usuario}
                              </strong>
                              <span
                                style={{
                                  color: '#9a909d',
                                  fontSize: '8px',
                                }}
                              >
                                {registro.perfil}
                              </span>
                            </div>

                            <div>
                              <strong
                                style={{
                                  display: 'block',
                                  color: '#534657',
                                  fontSize: '9px',
                                  marginBottom: '4px',
                                }}
                              >
                                {registro.acao}
                              </strong>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  padding: '4px 7px',
                                  borderRadius: '999px',
                                  background:
                                    registro.nivel === 'Crítico'
                                      ? '#fde8e4'
                                      : registro.nivel === 'Atenção'
                                      ? '#fff4d8'
                                      : '#edf3ff',
                                  color:
                                    registro.nivel === 'Crítico'
                                      ? '#ad4d40'
                                      : registro.nivel === 'Atenção'
                                      ? '#94690d'
                                      : '#4c6695',
                                  fontSize: '7px',
                                  fontWeight: 850,
                                }}
                              >
                                {registro.nivel}
                              </span>
                            </div>

                            <span
                              style={{
                                color: '#817684',
                                fontSize: '8.5px',
                                lineHeight: 1.5,
                              }}
                            >
                              {registro.detalhe}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      marginTop: '14px',
                      padding: '11px 13px',
                      borderRadius: '11px',
                      background: '#f8f4fa',
                      border: '1px solid #eadfee',
                      color: '#756478',
                      fontSize: '8.5px',
                      lineHeight: 1.55,
                    }}
                  >
                    ⛨ O histórico de auditoria é protegido e somente leitura no painel administrativo.
                  </div>
                </>
              )
            })()}
          </>
        )}

        {tela === 'usuarios' && podeAdministrar && (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: '16px',
                flexWrap: 'wrap',
                marginBottom: '18px',
              }}
            >
              <div>
                <span className="section-label">SEGURANÇA E ACESSO</span>
                <h1 className="page-title">Usuários do Sistema</h1>
                <p className="page-subtitle">
                  Controle quem entra no sistema, dados de recuperação, níveis de acesso e segurança das contas.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => {
                  const proximo = !mostrarNovoUsuario
                  setMostrarNovoUsuario(proximo)
                  if (proximo) cancelarEdicaoUsuario()
                }}
              >
                {mostrarNovoUsuario ? 'Cancelar' : '+ Novo usuário'}
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '18px',
              }}
            >
              {[
                {
                  titulo: 'Usuários ativos',
                  valor: usuariosSistema.filter((u) => u.status === 'Ativo').length,
                  detalhe: `${usuariosSistema.length} cadastrados`,
                  fundo: '#e9f8ef',
                  cor: '#1d8050',
                },
                {
                  titulo: 'Administradores',
                  valor: usuariosSistema.filter(
                    (u) => u.perfil === 'Administrador' && u.status === 'Ativo'
                  ).length,
                  detalhe: 'acesso total',
                  fundo: '#f2eaf6',
                  cor: '#67327f',
                },
                {
                  titulo: 'Supervisores',
                  valor: usuariosSistema.filter(
                    (u) => u.perfil === 'Supervisor' && u.status === 'Ativo'
                  ).length,
                  detalhe: 'gestão operacional',
                  fundo: '#eaf1ff',
                  cor: '#315ea8',
                },
                {
                  titulo: 'Consultas',
                  valor: usuariosSistema.filter(
                    (u) => u.perfil === 'Consulta' && u.status === 'Ativo'
                  ).length,
                  detalhe: 'somente visualização',
                  fundo: '#fff4d8',
                  cor: '#94690d',
                },
              ].map((card) => (
                <div
                  key={card.titulo}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #ebe5ed',
                    borderRadius: '18px',
                    padding: '16px',
                    boxShadow: '0 7px 22px rgba(60,36,72,.045)',
                  }}
                >
                  <div
                    style={{
                      width: '37px',
                      height: '37px',
                      borderRadius: '11px',
                      background: card.fundo,
                      color: card.cor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '11px',
                      fontWeight: 850,
                    }}
                  >
                    ⚿
                  </div>
                  <span
                    style={{
                      display: 'block',
                      color: '#847a87',
                      fontSize: '9px',
                      marginBottom: '5px',
                    }}
                  >
                    {card.titulo}
                  </span>
                  <strong
                    style={{
                      display: 'block',
                      color: '#3b3040',
                      fontSize: '23px',
                      marginBottom: '4px',
                    }}
                  >
                    {card.valor}
                  </strong>
                  <small style={{ color: '#9e96a0', fontSize: '8px' }}>
                    {card.detalhe}
                  </small>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  mostrarNovoUsuario || usuarioEditandoId !== null
                    ? 'minmax(0, 1.3fr) minmax(320px, .7fr)'
                    : '1fr',
                gap: '16px',
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e9e3eb',
                  borderRadius: '19px',
                  overflow: 'hidden',
                  boxShadow: '0 9px 26px rgba(60,36,72,.05)',
                }}
              >
                <div
                  style={{
                    padding: '17px 18px',
                    borderBottom: '1px solid #eee9f0',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      color: '#3f3444',
                      fontSize: '13px',
                      marginBottom: '3px',
                    }}
                  >
                    Acessos cadastrados
                  </strong>
                  <span style={{ color: '#9b929e', fontSize: '9px' }}>
                    Usuários e perfis de acesso
                  </span>
                </div>

                <div className="table-wrapper">
                  <table className="employees-table">
                    <thead>
                      <tr>
                        <th>Usuário</th>
                        <th>E-mail de acesso</th>
                        <th>Contato</th>
                        <th>Perfil</th>
                        <th>Status</th>
                        <th>Último acesso</th>
                        <th>Ação</th>
                      </tr>
                    </thead>

                    <tbody>
                      {usuariosSistema.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <strong>{item.nome}</strong>
                            {usuarioLogado?.id === item.id && (
                              <small
                                style={{
                                  display: 'block',
                                  color: '#1d8050',
                                  fontSize: '8px',
                                  marginTop: '2px',
                                }}
                              >
                                Sessão atual
                              </small>
                            )}
                          </td>
                          <td>{item.usuario}</td>
                          <td>
                            <span style={{ color: '#5f5662', fontSize: '9px' }}>
                              {item.celular || 'Sem celular'}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                display: 'inline-flex',
                                padding: '5px 8px',
                                borderRadius: '999px',
                                background:
                                  item.perfil === 'Administrador'
                                    ? '#f2eaf6'
                                    : item.perfil === 'Supervisor'
                                    ? '#eaf1ff'
                                    : '#fff4d8',
                                color:
                                  item.perfil === 'Administrador'
                                    ? '#67327f'
                                    : item.perfil === 'Supervisor'
                                    ? '#315ea8'
                                    : '#94690d',
                                fontSize: '8px',
                                fontWeight: 800,
                              }}
                            >
                              {item.perfil}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`employee-status ${
                                item.status === 'Ativo'
                                  ? 'active-status'
                                  : 'inactive-status'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>{item.ultimoAcesso}</td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="table-action-button"
                                onClick={() => iniciarEdicaoUsuario(item)}
                              >
                                Editar
                              </button>
                              <button
                                className="table-action-button"
                                onClick={() => alternarStatusUsuario(item.id)}
                              >
                                {item.status === 'Ativo' ? 'Desativar' : 'Reativar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {mostrarNovoUsuario && (
                <form
                  onSubmit={salvarNovoUsuario}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e9e3eb',
                    borderRadius: '19px',
                    padding: '18px',
                    boxShadow: '0 9px 26px rgba(60,36,72,.05)',
                  }}
                >
                  <span className="section-label">NOVO ACESSO</span>
                  <strong
                    style={{
                      display: 'block',
                      color: '#3d3142',
                      fontSize: '14px',
                      marginBottom: '16px',
                    }}
                  >
                    Criar usuário
                  </strong>

                  <div className="form-group" style={{ marginBottom: '11px' }}>
                    <label>Nome completo</label>
                    <input
                      value={novoUsuarioNome}
                      onChange={(e) => setNovoUsuarioNome(e.target.value)}
                      placeholder="Ex.: José da Silva"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '11px' }}>
                    <label>E-mail</label>
                    <input type="email" value={novoUsuarioEmail} onChange={(e) => setNovoUsuarioEmail(e.target.value)} placeholder="nome@empresa.com" />
                  </div>

                  <div className="form-group" style={{ marginBottom: '11px' }}>
                    <label>Celular</label>
                    <input value={novoUsuarioCelular} onChange={(e) => setNovoUsuarioCelular(formatarTelefone(e.target.value))} placeholder="(19) 99999-9999" inputMode="tel" />
                  </div>

                  <div className="form-group" style={{ marginBottom: '11px' }}>
                    <label>Senha inicial</label>
                    <input
                      type="password"
                      value={novoUsuarioSenha}
                      onChange={(e) => setNovoUsuarioSenha(e.target.value)}
                      placeholder="Senha de acesso"
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '11px' }}>
                    <label>Confirmar senha</label>
                    <input
                      type="password"
                      value={novoUsuarioConfirmarSenha}
                      onChange={(e) => setNovoUsuarioConfirmarSenha(e.target.value)}
                      placeholder="Digite a senha novamente"
                    />
                  </div>

                  <div style={{ margin: '-3px 0 12px', color: '#8e8491', fontSize: '9px', lineHeight: 1.5 }}>
                    {mensagemRegraSenha()}
                  </div>

                  <div className="form-group" style={{ marginBottom: '11px' }}>
                    <label>Perfil de acesso</label>
                    <select
                      value={novoUsuarioPerfil}
                      onChange={(e) =>
                        setNovoUsuarioPerfil(e.target.value as PerfilAcesso)
                      }
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Consulta">Consulta</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label>Status inicial</label>
                    <select
                      value={novoUsuarioStatus}
                      onChange={(e) =>
                        setNovoUsuarioStatus(
                          e.target.value as UsuarioSistema['status']
                        )
                      }
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>

                  <button className="primary-button" style={{ width: '100%' }}>
                    Criar usuário
                  </button>
                </form>
              )}

              {usuarioEditandoId !== null && (() => {
                const usuarioOriginal = usuariosSistema.find(
                  (item) => item.id === usuarioEditandoId
                )

                if (!usuarioOriginal) return null

                return (
                  <form
                    onSubmit={salvarEdicaoUsuario}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e9e3eb',
                      borderRadius: '19px',
                      padding: '18px',
                      boxShadow: '0 9px 26px rgba(60,36,72,.05)',
                    }}
                  >
                    <span className="section-label">EDITAR ACESSO</span>
                    <strong
                      style={{
                        display: 'block',
                        color: '#3d3142',
                        fontSize: '14px',
                        marginBottom: '5px',
                      }}
                    >
                      {usuarioOriginal.nome}
                    </strong>
                    <span
                      style={{
                        display: 'block',
                        color: '#8f8592',
                        fontSize: '10px',
                        lineHeight: 1.5,
                        marginBottom: '16px',
                      }}
                    >
                      Altere os dados, o perfil de acesso e as credenciais do usuário.
                    </span>

                    <div className="form-group" style={{ marginBottom: '11px' }}>
                      <label>Nome completo</label>
                      <input
                        value={usuarioEditandoNome}
                        onChange={(e) => setUsuarioEditandoNome(e.target.value)}
                      />
                    </div>


                    <div className="form-group" style={{ marginBottom: '11px' }}>
                      <label>E-mail</label>
                      <input type="email" value={usuarioEditandoEmail} onChange={(e) => setUsuarioEditandoEmail(e.target.value)} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '11px' }}>
                      <label>Celular</label>
                      <input value={usuarioEditandoCelular} onChange={(e) => setUsuarioEditandoCelular(formatarTelefone(e.target.value))} placeholder="(19) 99999-9999" inputMode="tel" />
                    </div>

                    <div className="form-group" style={{ marginBottom: '11px' }}>
                      <label>Perfil de acesso</label>
                      <select
                        value={usuarioEditandoPerfil}
                        onChange={(e) =>
                          setUsuarioEditandoPerfil(e.target.value as PerfilAcesso)
                        }
                      >
                        <option value="Administrador">Administrador</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="Consulta">Consulta</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '11px' }}>
                      <label>Status</label>
                      <select
                        value={usuarioEditandoStatus}
                        onChange={(e) =>
                          setUsuarioEditandoStatus(
                            e.target.value as UsuarioSistema['status']
                          )
                        }
                        disabled={usuarioLogado?.id === usuarioOriginal.id}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>

                    <div
                      style={{
                        margin: '15px 0 12px',
                        paddingTop: '13px',
                        borderTop: '1px solid #eee9f0',
                      }}
                    >
                      <strong
                        style={{
                          display: 'block',
                          color: '#514456',
                          fontSize: '11px',
                          marginBottom: '3px',
                        }}
                      >
                        Redefinir senha
                      </strong>
                      <span style={{ color: '#9b929e', fontSize: '9px' }}>
                        Deixe os dois campos vazios para manter a senha atual.
                      </span>
                    </div>

                    <div className="form-group" style={{ marginBottom: '11px' }}>
                      <label>Nova senha</label>
                      <input
                        type="password"
                        value={usuarioEditandoNovaSenha}
                        onChange={(e) => setUsuarioEditandoNovaSenha(e.target.value)}
                        placeholder="Nova senha"
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label>Confirmar nova senha</label>
                      <input
                        type="password"
                        value={usuarioEditandoConfirmarSenha}
                        onChange={(e) =>
                          setUsuarioEditandoConfirmarSenha(e.target.value)
                        }
                        placeholder="Digite a nova senha novamente"
                      />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '9px',
                      }}
                    >
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={cancelarEdicaoUsuario}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="primary-button">
                        Salvar alterações
                      </button>
                    </div>
                  </form>
                )
              })()}
            </div>

            <div
              style={{
                marginTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '11px',
              }}
            >
              {[
                {
                  perfil: 'Administrador',
                  texto:
                    'Acesso total: operação, financeiro, documentos, configurações e usuários.',
                },
                {
                  perfil: 'Supervisor',
                  texto:
                    'Gestão operacional: operação do dia, ponto, lista, diárias, funcionários e relatórios.',
                },
                {
                  perfil: 'Consulta',
                  texto:
                    'Visualização: dashboard, histórico, funcionários, ponto e relatórios.',
                },
              ].map((item) => (
                <div
                  key={item.perfil}
                  style={{
                    padding: '13px 14px',
                    background: '#faf8fb',
                    border: '1px solid #ebe5ed',
                    borderRadius: '13px',
                  }}
                >
                  <strong
                    style={{
                      display: 'block',
                      color: '#514456',
                      fontSize: '10px',
                      marginBottom: '4px',
                    }}
                  >
                    {item.perfil}
                  </strong>
                  <span
                    style={{
                      color: '#8f8592',
                      fontSize: '8.5px',
                      lineHeight: 1.5,
                    }}
                  >
                    {item.texto}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '14px',
                padding: '11px 13px',
                borderRadius: '11px',
                background: '#fff8e8',
                border: '1px solid #f0dfb7',
                color: '#856525',
                fontSize: '8.5px',
                lineHeight: 1.5,
              }}
            >
              ✓ Criação de usuários protegida por Edge Function. Credenciais administrativas permanecem somente no backend.
            </div>
          </>
        )}

        {tela === 'configuracoes' && temAcesso('configuracoes') && (
          <>
            <div className="page-header">
              <div>
                <span className="section-label">
                  FINANCEIRO • REGRAS DE CÁLCULO
                </span>
                <h1 className="page-title">Configurações das Diárias</h1>
                <p className="page-subtitle">
                  O administrador pode definir a diária-base, percentuais de
                  sábado, domingo e feriado, VT, VR e a jornada padrão da operação.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '12px 14px',
                marginBottom: '15px',
                borderRadius: '12px',
                background: '#eef8f2',
                border: '1px solid #d6eadf',
                color: '#3c7255',
                fontSize: '9px',
                lineHeight: 1.55,
              }}
            >
              <strong>Regra atual:</strong> dias úteis recebem a diária-base.
              Sábado acrescenta {configuracaoTemporaria.percentualSabado}%,
              domingo acrescenta {configuracaoTemporaria.percentualDomingo}% e
              feriado em dia útil acrescenta{' '}
              {configuracaoTemporaria.percentualFeriado}%. Se um feriado cair
              no sábado ou domingo, vale apenas a regra do fim de semana — o
              feriado não gera um segundo adicional. A jornada padrão configurada é{' '}
              <strong>{configuracaoTemporaria.horarioEntradaPadrao}–{configuracaoTemporaria.horarioSaidaPadrao}</strong>.
            </div>

            <div className="panel">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  marginBottom: '14px',
                }}
              >
                <div>
                  <h2 style={{ marginBottom: '4px' }}>Valores das Diárias</h2>
                  <span
                    style={{
                      color: '#918793',
                      fontSize: '8.5px',
                    }}
                  >
                    As alterações valem apenas para novas diárias. Registros
                    históricos mantêm os valores que já foram gerados.
                  </span>
                </div>

                <span
                  style={{
                    display: 'inline-flex',
                    padding: '6px 9px',
                    borderRadius: '999px',
                    background: '#f1eaf5',
                    color: '#673b79',
                    fontSize: '8px',
                    fontWeight: 850,
                  }}
                >
                  Administrador
                </span>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Diária-base (R$)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={configuracaoTemporaria.diariaBase}
                    onChange={(e) =>
                      setConfiguracaoTemporaria({
                        ...configuracaoTemporaria,
                        diariaBase: Number(e.target.value),
                      })
                    }
                    disabled={!podeAdministrar}
                  />
                </div>

                <div className="form-group">
                  <label>Adicional sábado (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={configuracaoTemporaria.percentualSabado}
                    onChange={(e) =>
                      setConfiguracaoTemporaria({
                        ...configuracaoTemporaria,
                        percentualSabado: Number(e.target.value),
                      })
                    }
                    disabled={!podeAdministrar}
                  />
                </div>

                <div className="form-group">
                  <label>Adicional domingo (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={configuracaoTemporaria.percentualDomingo}
                    onChange={(e) =>
                      setConfiguracaoTemporaria({
                        ...configuracaoTemporaria,
                        percentualDomingo: Number(e.target.value),
                      })
                    }
                    disabled={!podeAdministrar}
                  />
                </div>

                <div className="form-group">
                  <label>Adicional feriado (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={configuracaoTemporaria.percentualFeriado}
                    onChange={(e) =>
                      setConfiguracaoTemporaria({
                        ...configuracaoTemporaria,
                        percentualFeriado: Number(e.target.value),
                      })
                    }
                    disabled={!podeAdministrar}
                  />
                </div>

                <div className="form-group">
                  <label>Vale-transporte (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={configuracaoTemporaria.vt}
                    onChange={(e) =>
                      setConfiguracaoTemporaria({
                        ...configuracaoTemporaria,
                        vt: Number(e.target.value),
                      })
                    }
                    disabled={!podeAdministrar}
                  />
                </div>

                <div className="form-group">
                  <label>Vale-refeição (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={configuracaoTemporaria.vr}
                    onChange={(e) =>
                      setConfiguracaoTemporaria({
                        ...configuracaoTemporaria,
                        vr: Number(e.target.value),
                      })
                    }
                    disabled={!podeAdministrar}
                  />
                </div>

                <div className="form-group">
                  <label>Entrada padrão</label>
                  <input
                    type="time"
                    value={configuracaoTemporaria.horarioEntradaPadrao}
                    onChange={(e) =>
                      setConfiguracaoTemporaria({
                        ...configuracaoTemporaria,
                        horarioEntradaPadrao: e.target.value,
                      })
                    }
                    disabled={!podeAdministrar}
                  />
                </div>

                <div className="form-group">
                  <label>Saída padrão</label>
                  <input
                    type="time"
                    value={configuracaoTemporaria.horarioSaidaPadrao}
                    onChange={(e) =>
                      setConfiguracaoTemporaria({
                        ...configuracaoTemporaria,
                        horarioSaidaPadrao: e.target.value,
                      })
                    }
                    disabled={!podeAdministrar}
                  />
                </div>
              </div>

              <div className="current-values">
                <div>
                  <span>Dia útil</span>
                  <strong>
                    {moeda(
                      configuracaoTemporaria.diariaBase +
                        configuracaoTemporaria.vt +
                        configuracaoTemporaria.vr
                    )}
                  </strong>
                  <small>0% adicional</small>
                </div>

                <div>
                  <span>Sábado</span>
                  <strong>
                    {moeda(
                      configuracaoTemporaria.diariaBase +
                        calcularAdicionalPercentual(
                          configuracaoTemporaria.diariaBase,
                          configuracaoTemporaria.percentualSabado
                        ) +
                        configuracaoTemporaria.vt +
                        configuracaoTemporaria.vr
                    )}
                  </strong>
                  <small>
                    +{configuracaoTemporaria.percentualSabado}% da diária-base
                  </small>
                </div>

                <div>
                  <span>Domingo</span>
                  <strong>
                    {moeda(
                      configuracaoTemporaria.diariaBase +
                        calcularAdicionalPercentual(
                          configuracaoTemporaria.diariaBase,
                          configuracaoTemporaria.percentualDomingo
                        ) +
                        configuracaoTemporaria.vt +
                        configuracaoTemporaria.vr
                    )}
                  </strong>
                  <small>
                    +{configuracaoTemporaria.percentualDomingo}% da diária-base
                  </small>
                </div>

                <div>
                  <span>Feriado em dia útil</span>
                  <strong>
                    {moeda(
                      configuracaoTemporaria.diariaBase +
                        calcularAdicionalPercentual(
                          configuracaoTemporaria.diariaBase,
                          configuracaoTemporaria.percentualFeriado
                        ) +
                        configuracaoTemporaria.vt +
                        configuracaoTemporaria.vr
                    )}
                  </strong>
                  <small>
                    +{configuracaoTemporaria.percentualFeriado}% da diária-base
                  </small>
                </div>
              </div>

              {podeAdministrar && (
                <div className="form-actions">
                  <button
                    className="primary-button"
                    onClick={salvarConfiguracoes}
                  >
                    Salvar alterações
                  </button>
                </div>
              )}
            </div>

            <div
              style={{
                marginTop: '16px',
                background: '#ffffff',
                border: '1px solid #e8e2ea',
                borderRadius: '18px',
                padding: '18px',
                boxShadow: '0 8px 24px rgba(60,36,72,.045)',
              }}
            >
              <span className="section-label">RESUMO DAS REGRAS</span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(165px, 1fr))',
                  gap: '9px',
                  marginTop: '10px',
                }}
              >
                {[
                  {
                    titulo: 'Segunda a sexta',
                    valor: '100%',
                    detalhe: 'somente a diária-base',
                  },
                  {
                    titulo: 'Sábado',
                    valor: `${configuracaoValores.percentualSabado}%`,
                    detalhe: 'adicional sobre a diária-base',
                  },
                  {
                    titulo: 'Domingo',
                    valor: `${configuracaoValores.percentualDomingo}%`,
                    detalhe: 'adicional sobre a diária-base',
                  },
                  {
                    titulo: 'Feriado',
                    valor: `${configuracaoValores.percentualFeriado}%`,
                    detalhe: 'em dia útil',
                  },
                ].map((item) => (
                  <div
                    key={item.titulo}
                    style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: '#faf8fb',
                      border: '1px solid #eee8f0',
                    }}
                  >
                    <span
                      style={{
                        display: 'block',
                        color: '#8d828f',
                        fontSize: '8px',
                        marginBottom: '3px',
                      }}
                    >
                      {item.titulo}
                    </span>
                    <strong
                      style={{
                        display: 'block',
                        color: '#4a3b50',
                        fontSize: '16px',
                        marginBottom: '2px',
                      }}
                    >
                      {item.valor}
                    </strong>
                    <small
                      style={{
                        color: '#a097a3',
                        fontSize: '7.5px',
                      }}
                    >
                      {item.detalhe}
                    </small>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '11px',
                  padding: '10px 12px',
                  borderRadius: '11px',
                  background: '#fff8e8',
                  border: '1px solid #f0dfb7',
                  color: '#856525',
                  fontSize: '8.5px',
                  lineHeight: 1.55,
                }}
              >
                Exemplo: se um feriado cair no sábado, é aplicada apenas a
                regra de sábado. Se cair no domingo, é aplicada apenas a regra
                de domingo. Não existe adicional de feriado acumulado no fim de
                semana.
              </div>
            </div>

            <div
              style={{
                marginTop: '16px',
                background: '#ffffff',
                border: '1px solid #e8e2ea',
                borderRadius: '18px',
                padding: '18px',
                boxShadow: '0 8px 24px rgba(60,36,72,.045)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '14px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ maxWidth: '620px' }}>
                  <span className="section-label">
                    ARMAZENAMENTO DO PROTÓTIPO
                  </span>
                  <strong
                    style={{
                      display: 'block',
                      color: '#443649',
                      fontSize: '13px',
                      marginBottom: '5px',
                    }}
                  >
                    Salvamento automático ativado
                  </strong>
                  <span
                    style={{
                      display: 'block',
                      color: '#8f8592',
                      fontSize: '9px',
                      lineHeight: 1.55,
                    }}
                  >
                    Funcionários, listas, pontos, diárias, fechamentos,
                    pagamentos, documentos, usuários, feriados e valores de
                    configuração são salvos automaticamente neste navegador.
                  </span>

                  <div
                    style={{
                      marginTop: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 9px',
                      borderRadius: '999px',
                      background: '#eaf8ef',
                      color: '#27744d',
                      fontSize: '8px',
                      fontWeight: 850,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#2fa769',
                      }}
                    />
                    {ultimaSincronizacaoLocal
                      ? `Salvo em ${ultimaSincronizacaoLocal}`
                      : 'Pronto para salvar'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <input
                    ref={inputBackupRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={importarBackupCompleto}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={exportarBackupCompleto}
                    disabled={!podeAdministrar}
                    className="secondary-button"
                    style={{ minHeight: '36px' }}
                  >
                    ⇩ Exportar backup
                  </button>
                  <button
                    type="button"
                    onClick={solicitarRestauracaoBackup}
                    disabled={!podeAdministrar}
                    className="secondary-button"
                    style={{ minHeight: '36px' }}
                  >
                    ⇧ Restaurar backup
                  </button>
                  <button
                    type="button"
                    onClick={limparDadosLocais}
                    disabled={!podeAdministrar}
                    style={{
                      minHeight: '36px',
                      padding: '0 12px',
                      borderRadius: '10px',
                      border: '1px solid #efd6d2',
                      background: '#fff8f7',
                      color: '#a64d41',
                      fontSize: '8px',
                      fontWeight: 850,
                      cursor: podeAdministrar ? 'pointer' : 'not-allowed',
                      opacity: podeAdministrar ? 1 : 0.55,
                    }}
                  >
                    Limpar dados locais legados
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      {mostrarAlterarMinhaSenha && usuarioLogado && (
        <div className="pix-modal-backdrop" onClick={() => setMostrarAlterarMinhaSenha(false)}>
          <div className="pix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="pix-modal-header">
              <div>
                <span className="section-label">SEGURANÇA DA CONTA</span>
                <h2>Alterar minha senha</h2>
                <p className="page-subtitle" style={{ marginTop: '4px' }}>{usuarioLogado.nome} • @{usuarioLogado.usuario}</p>
              </div>
              <button className="pix-modal-close" onClick={() => setMostrarAlterarMinhaSenha(false)}>✕</button>
            </div>
            <form onSubmit={alterarMinhaSenha} style={{ paddingTop: '10px' }}>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Senha atual</label>
                <input type="password" value={minhaSenhaAtual} onChange={(e) => setMinhaSenhaAtual(e.target.value)} autoComplete="current-password" />
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label>Nova senha</label>
                <input type="password" value={minhaNovaSenha} onChange={(e) => setMinhaNovaSenha(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <label>Confirmar nova senha</label>
                <input type="password" value={minhaConfirmarSenha} onChange={(e) => setMinhaConfirmarSenha(e.target.value)} autoComplete="new-password" />
              </div>
              <div style={{ padding: '10px 12px', borderRadius: '11px', background: '#f8f4fa', border: '1px solid #eadfee', color: '#746679', fontSize: '9px', lineHeight: 1.5, marginBottom: '15px' }}>{mensagemRegraSenha()}</div>
              <div className="pix-modal-actions">
                <button type="button" className="secondary-button" onClick={() => setMostrarAlterarMinhaSenha(false)}>Cancelar</button>
                <button className="primary-button">Alterar senha</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {diariaEditando && (
        <div className="pix-modal-backdrop" onClick={() => setDiariaEditando(null)}>
          <div className="pix-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <div className="pix-modal-header">
              <div>
                <span className="section-label">AJUSTE ADMINISTRATIVO</span>
                <h2>Editar diária</h2>
                <p className="page-subtitle" style={{ marginTop: '4px' }}>
                  {diariaEditando.diaria.nome} • {diariaEditando.diaria.data}
                </p>
              </div>
              <button className="pix-modal-close" onClick={() => setDiariaEditando(null)}>✕</button>
            </div>

            <div className="form-grid" style={{ marginTop: '16px' }}>
              <div className="form-group">
                <label>Diária base (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={diariaEditando.diaria.diariaBase}
                  onChange={(e) => alterarCampoDiaria('diariaBase', Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Adicional (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={diariaEditando.diaria.adicional}
                  onChange={(e) => alterarCampoDiaria('adicional', Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Vale-transporte (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={diariaEditando.diaria.vt}
                  onChange={(e) => alterarCampoDiaria('vt', Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Vale-refeição (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={diariaEditando.diaria.vr}
                  onChange={(e) => alterarCampoDiaria('vr', Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={diariaEditando.diaria.status}
                  onChange={(e) => alterarCampoDiaria('status', e.target.value as Diaria['status'])}
                >
                  <option value="Pendente">Em conferência</option>
                  <option value="Aprovada">Aprovada</option>
                </select>
              </div>
              <div className="form-group">
                <label>Total recalculado</label>
                <div style={{ minHeight: '42px', display: 'flex', alignItems: 'center', padding: '0 12px', border: '1px solid #e7e0ea', borderRadius: '10px', background: '#f8f5fa', fontWeight: 850, color: '#52296c' }}>
                  {moeda(
                    Number(diariaEditando.diaria.diariaBase || 0) +
                    Number(diariaEditando.diaria.adicional || 0) +
                    Number(diariaEditando.diaria.vt || 0) +
                    Number(diariaEditando.diaria.vr || 0)
                  )}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '11px', background: '#fff8e8', border: '1px solid #f0dfb7', color: '#856525', fontSize: '9px', lineHeight: 1.5 }}>
              Ajustes manuais ficam registrados na Auditoria. O valor total é recalculado automaticamente.
            </div>

            <div className="pix-modal-actions">
              <button className="secondary-button" onClick={() => setDiariaEditando(null)}>Cancelar</button>
              <button className="primary-button" onClick={salvarEdicaoDiaria}>Salvar diária</button>
            </div>
          </div>
        </div>
      )}

      {cadastroFacialAberto && funcionarioCadastroFacial && (
        <div className="modal-overlay" onClick={fecharCadastroFacial}>
          <div
            className="pix-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '650px', width: 'calc(100% - 28px)' }}
          >
            <div className="pix-modal-header">
              <div>
                <span style={{ color: '#8f8694', fontSize: '9px', fontWeight: 800 }}>BIOMETRIA FACIAL</span>
                <h3 style={{ margin: '4px 0 0' }}>{funcionarioCadastroFacial.nome}</h3>
              </div>
              <button className="secondary-button" onClick={fecharCadastroFacial}>Fechar</button>
            </div>

            <div style={{ marginTop: '14px', padding: '11px 12px', borderRadius: '12px', background: modelosFaciaisProntos ? '#eef8f2' : erroModelosFaciais ? '#fff0f0' : '#fff8e8', border: `1px solid ${modelosFaciaisProntos ? '#cfe8d8' : erroModelosFaciais ? '#efcccc' : '#efdfbb'}`, color: modelosFaciaisProntos ? '#2d6847' : erroModelosFaciais ? '#a84444' : '#856525', fontSize: '10px', lineHeight: 1.5 }}>
              {modelosFaciaisProntos
                ? 'Motor facial carregado e pronto para captura.'
                : erroModelosFaciais || 'Carregando os modelos faciais...'}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginTop: '14px', padding: '11px 12px', borderRadius: '12px', background: '#f8f5fa', color: '#655a69', fontSize: '10px', lineHeight: 1.45, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={consentimentoFacial}
                onChange={(e) => setConsentimentoFacial(e.target.checked)}
                disabled={cameraFacialAtiva || capturandoFacial}
                style={{ marginTop: '2px' }}
              />
              <span>Confirmo que o trabalhador foi informado sobre a coleta e o uso da biometria facial para identificação no registro de ponto e autorizou este cadastro.</span>
            </label>

            <div style={{ marginTop: '14px', minHeight: '330px', borderRadius: '18px', overflow: 'hidden', background: '#17121b', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {cameraFacialAtiva ? (
                <>
                  <video
                    ref={videoCadastroFacialRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', minHeight: '330px', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                  <div style={{ position: 'absolute', width: '190px', height: '245px', borderRadius: '50%', border: '3px solid rgba(255,255,255,.82)', boxShadow: '0 0 0 999px rgba(0,0,0,.16)', pointerEvents: 'none' }} />
                  {capturandoFacial && (
                    <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '16px', padding: '11px 13px', borderRadius: '12px', background: 'rgba(24,18,28,.82)', color: '#fff', fontSize: '10px', fontWeight: 800 }}>
                      Capturando amostra {Math.min(progressoFacial + 1, 5)} de 5...
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: '#cfc6d3', textAlign: 'center', padding: '30px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>◉</div>
                  <strong style={{ display: 'block', color: '#fff', marginBottom: '6px' }}>Câmera aguardando</strong>
                  <span style={{ fontSize: '10px' }}>Confirme o consentimento e abra a câmera.</span>
                </div>
              )}
            </div>

            <p style={{ margin: '12px 0 0', color: '#786d7d', fontSize: '10px', lineHeight: 1.5 }}>
              {mensagemFacial || 'Serão coletadas cinco amostras do rosto e transformadas em um descritor numérico para comparação facial.'}
            </p>

            <div className="pix-modal-actions">
              {cameraFacialAtiva ? (
                <>
                  <button className="secondary-button" onClick={encerrarCameraCadastroFacial} disabled={capturandoFacial}>Desligar câmera</button>
                  <button className="primary-button" onClick={capturarCadastroFacial} disabled={capturandoFacial || !modelosFaciaisProntos}>
                    {capturandoFacial ? `Capturando ${progressoFacial}/5` : 'Capturar e salvar biometria'}
                  </button>
                </>
              ) : (
                <button className="primary-button" onClick={iniciarCameraCadastroFacial} disabled={!consentimentoFacial || !modelosFaciaisProntos}>Abrir câmera</button>
              )}
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  )
}

export default App