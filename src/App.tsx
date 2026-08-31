import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

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
  foto: string
  facial: 'Cadastrado' | 'Pendente'
}

type RegistroPonto = {
  nome: string
  funcao: string
  data: string
  horario: string
  status: 'Registrado' | 'Pendente'
  metodo?: 'Reconhecimento facial' | 'Manual'
}

type ListaDiaristas = {
  id: number
  data: string
  local: string
  horario: string
  observacao: string
  diaristas: string[]
  criadaEm: string
}

type Diaria = {
  nome: string
  funcao: string
  data: string
  tipoDia: 'Semana' | 'Sábado' | 'Domingo' | 'Feriado'
  diariaBase: number
  adicional: number
  vt: number
  vr: number
  valor: number
  status: 'Aprovada' | 'Pendente'
}

type StatusFechamento =
  | 'Aberto'
  | 'Em revisão'
  | 'Aprovado'
  | 'Aguardando pagamento'
  | 'Pago'

type Fechamento = {
  periodo: string
  pagamento: string
  status: StatusFechamento
}

type Pagamento = {
  nome: string
  periodo: string
  quantidadeDiarias: number
  valorTotal: number
  pix: string
  status: 'Aguardando' | 'Pago'
  dataPagamento: string
}

type Documento = {
  nome: string
  funcionario: string
  tipo: string
  dataEnvio: string
  status: 'Enviado' | 'Pendente'
}

type ConfiguracaoValores = {
  diariaBase: number
  percentualSabado: number
  percentualDomingo: number
  percentualFeriado: number
  vt: number
  vr: number
}

type TipoFeriado = 'Nacional' | 'Estadual' | 'Municipal' | 'Empresa'

type Feriado = {
  id: number
  data: string
  nome: string
  tipo: TipoFeriado
  ativo: boolean
}

type PerfilAcesso = 'Administrador' | 'Supervisor' | 'Consulta'

type UsuarioSistema = {
  id: number
  nome: string
  usuario: string
  senha: string
  perfil: PerfilAcesso
  status: 'Ativo' | 'Inativo'
  ultimoAcesso: string
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
  foto: '',
  facial: 'Pendente',
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
      perfil: 'Administrador',
      status: 'Ativo',
      ultimoAcesso: 'Agora',
    },
    {
      id: 2,
      nome: 'Supervisor Operacional',
      usuario: 'supervisor',
      senha: '1234',
      perfil: 'Supervisor',
      status: 'Ativo',
      ultimoAcesso: 'Hoje, 08:52',
    },
    {
      id: 3,
      nome: 'Consulta Sindical',
      usuario: 'consulta',
      senha: '1234',
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
  const [novoUsuarioSenha, setNovoUsuarioSenha] = useState('')
  const [novoUsuarioPerfil, setNovoUsuarioPerfil] =
    useState<PerfilAcesso>('Supervisor')

  const [notificacao, setNotificacao] = useState<Notificacao | null>(null)
  const timerNotificacao = useRef<number | null>(null)

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
    useState<string | null>(null)

  const [pagamentoPixSelecionado, setPagamentoPixSelecionado] =
    useState<Pagamento | null>(null)

  const [registroPontoSelecionado, setRegistroPontoSelecionado] =
    useState<RegistroPonto | null>(null)

  const [buscaFuncionario, setBuscaFuncionario] = useState('')

  const [buscaPonto, setBuscaPonto] = useState('')
  const [statusPontoFiltro, setStatusPontoFiltro] = useState('Todos')
  const [dataPontoFiltro, setDataPontoFiltro] = useState('')

  const dataLocalHoje = (() => {
    const agora = new Date()
    const ano = agora.getFullYear()
    const mes = String(agora.getMonth() + 1).padStart(2, '0')
    const dia = String(agora.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  })()

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
  const [listasDiaristas, setListasDiaristas] = useState<ListaDiaristas[]>([
    {
      id: 1,
      data: dataLocalHoje,
      local: 'DHL Mogi Mirim',
      horario: '09:30',
      observacao: 'Turno operacional das 09:30 às 18:30.',
      diaristas: [
        'João da Silva',
        'Maria Oliveira',
        'Pedro Almeida',
        'Lucas Ferreira',
      ],
      criadaEm: new Date().toLocaleString('pt-BR'),
    },
    {
      id: 2,
      data: '2026-08-29',
      local: 'DHL Mogi Mirim',
      horario: '09:30',
      observacao: 'Operação de sábado.',
      diaristas: ['João da Silva', 'Maria Oliveira'],
      criadaEm: '28/08/2026 16:40',
    },
    {
      id: 3,
      data: '2026-08-28',
      local: 'DHL Mogi Mirim',
      horario: '09:30',
      observacao: 'Operação regular.',
      diaristas: ['Pedro Almeida'],
      criadaEm: '27/08/2026 17:10',
    },
  ])
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
    })

  const [configuracaoTemporaria, setConfiguracaoTemporaria] =
    useState<ConfiguracaoValores>({
      diariaBase: 100,
      percentualSabado: 50,
      percentualDomingo: 100,
      percentualFeriado: 100,
      vt: 12,
      vr: 26,
    })

  const [feriados, setFeriados] = useState<Feriado[]>([
    { id: 1, data: '2026-01-01', nome: 'Confraternização Universal', tipo: 'Nacional', ativo: true },
    { id: 2, data: '2026-04-21', nome: 'Tiradentes', tipo: 'Nacional', ativo: true },
    { id: 3, data: '2026-05-01', nome: 'Dia Mundial do Trabalho', tipo: 'Nacional', ativo: true },
    { id: 4, data: '2026-09-07', nome: 'Independência do Brasil', tipo: 'Nacional', ativo: true },
    { id: 5, data: '2026-10-12', nome: 'Nossa Senhora Aparecida', tipo: 'Nacional', ativo: true },
    { id: 6, data: '2026-11-02', nome: 'Finados', tipo: 'Nacional', ativo: true },
    { id: 7, data: '2026-11-15', nome: 'Proclamação da República', tipo: 'Nacional', ativo: true },
    { id: 8, data: '2026-11-20', nome: 'Dia Nacional de Zumbi e da Consciência Negra', tipo: 'Nacional', ativo: true },
    { id: 9, data: '2026-12-25', nome: 'Natal', tipo: 'Nacional', ativo: true },
  ])
  const [mesCalendario, setMesCalendario] = useState(new Date(2026, 7, 1))
  const [novoFeriadoData, setNovoFeriadoData] = useState('')
  const [novoFeriadoNome, setNovoFeriadoNome] = useState('')
  const [novoFeriadoTipo, setNovoFeriadoTipo] =
    useState<TipoFeriado>('Municipal')
  const [mostrarNovoFeriado, setMostrarNovoFeriado] = useState(false)
  const [buscaFeriado, setBuscaFeriado] = useState('')

  const [estadoTotem, setEstadoTotem] = useState<
    'aguardando' | 'reconhecendo' | 'sucesso' | 'erro'
  >('aguardando')

  const [funcionarioReconhecido, setFuncionarioReconhecido] = useState('')
  const [horarioTotem, setHorarioTotem] = useState('')
  const [mensagemErroTotem, setMensagemErroTotem] = useState('')
  const [agoraTotem, setAgoraTotem] = useState(new Date())

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
      foto: '',
      facial: 'Cadastrado',
    },
  ])

  const [novoFuncionario, setNovoFuncionario] =
    useState<Funcionario>(funcionarioVazio)

  const [registrosPonto, setRegistrosPonto] = useState<RegistroPonto[]>([
    {
      nome: 'João da Silva',
      funcao: 'Auxiliar Logístico',
      data: new Date().toLocaleDateString('pt-BR'),
      horario: '09:27',
      status: 'Registrado',
      metodo: 'Reconhecimento facial',
    },
    {
      nome: 'Maria Oliveira',
      funcao: 'Auxiliar Logístico',
      data: new Date().toLocaleDateString('pt-BR'),
      horario: '09:31',
      status: 'Registrado',
      metodo: 'Reconhecimento facial',
    },
    {
      nome: 'Pedro Almeida',
      funcao: 'Auxiliar Logístico',
      data: new Date().toLocaleDateString('pt-BR'),
      horario: '--:--',
      status: 'Pendente',
    },
    {
      nome: 'Lucas Ferreira',
      funcao: 'Auxiliar Logístico',
      data: new Date().toLocaleDateString('pt-BR'),
      horario: '09:34',
      status: 'Registrado',
      metodo: 'Reconhecimento facial',
    },
    {
      nome: 'João da Silva',
      funcao: 'Auxiliar Logístico',
      data: '29/08/2026',
      horario: '09:28',
      status: 'Registrado',
      metodo: 'Reconhecimento facial',
    },
    {
      nome: 'Maria Oliveira',
      funcao: 'Auxiliar Logístico',
      data: '29/08/2026',
      horario: '09:33',
      status: 'Registrado',
      metodo: 'Reconhecimento facial',
    },
    {
      nome: 'Pedro Almeida',
      funcao: 'Auxiliar Logístico',
      data: '28/08/2026',
      horario: '09:29',
      status: 'Registrado',
      metodo: 'Reconhecimento facial',
    },
  ])

  const [diarias, setDiarias] = useState<Diaria[]>([
    {
      nome: 'João da Silva',
      funcao: 'Auxiliar Logístico',
      data: '25/08/2026',
      tipoDia: 'Semana',
      diariaBase: 100,
      adicional: 0,
      vt: 12,
      vr: 26,
      valor: 138,
      status: 'Aprovada',
    },
    {
      nome: 'João da Silva',
      funcao: 'Auxiliar Logístico',
      data: '26/08/2026',
      tipoDia: 'Semana',
      diariaBase: 100,
      adicional: 0,
      vt: 12,
      vr: 26,
      valor: 138,
      status: 'Aprovada',
    },
    {
      nome: 'João da Silva',
      funcao: 'Auxiliar Logístico',
      data: '29/08/2026',
      tipoDia: 'Sábado',
      diariaBase: 100,
      adicional: 50,
      vt: 12,
      vr: 26,
      valor: 188,
      status: 'Pendente',
    },
    {
      nome: 'Maria Oliveira',
      funcao: 'Auxiliar Logístico',
      data: '27/08/2026',
      tipoDia: 'Semana',
      diariaBase: 100,
      adicional: 0,
      vt: 12,
      vr: 26,
      valor: 138,
      status: 'Aprovada',
    },
    {
      nome: 'Maria Oliveira',
      funcao: 'Auxiliar Logístico',
      data: '29/08/2026',
      tipoDia: 'Sábado',
      diariaBase: 100,
      adicional: 50,
      vt: 12,
      vr: 26,
      valor: 188,
      status: 'Aprovada',
    },
    {
      nome: 'Lucas Ferreira',
      funcao: 'Auxiliar Logístico',
      data: '30/08/2026',
      tipoDia: 'Domingo',
      diariaBase: 100,
      adicional: 100,
      vt: 12,
      vr: 26,
      valor: 238,
      status: 'Aprovada',
    },
    {
      nome: 'Pedro Almeida',
      funcao: 'Auxiliar Logístico',
      data: '28/08/2026',
      tipoDia: 'Semana',
      diariaBase: 100,
      adicional: 0,
      vt: 12,
      vr: 26,
      valor: 138,
      status: 'Pendente',
    },
  ])

  const [fechamentos, setFechamentos] = useState<Fechamento[]>([
    {
      periodo: '01/08/2026 a 15/08/2026',
      pagamento: '20/08/2026',
      status: 'Pago',
    },
    {
      periodo: '16/08/2026 a 31/08/2026',
      pagamento: '05/09/2026',
      status: 'Em revisão',
    },
    {
      periodo: '01/09/2026 a 15/09/2026',
      pagamento: '20/09/2026',
      status: 'Aberto',
    },
  ])

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

  const [documentos, setDocumentos] = useState<Documento[]>([
    {
      nome: 'Contrato de Trabalho.pdf',
      funcionario: 'João da Silva',
      tipo: 'Contrato',
      dataEnvio: '10/08/2026',
      status: 'Enviado',
    },
    {
      nome: 'RG.pdf',
      funcionario: 'João da Silva',
      tipo: 'RG',
      dataEnvio: '10/08/2026',
      status: 'Enviado',
    },
    {
      nome: 'CPF.pdf',
      funcionario: 'Maria Oliveira',
      tipo: 'CPF',
      dataEnvio: '12/08/2026',
      status: 'Enviado',
    },
    {
      nome: 'Comprovante de residência',
      funcionario: 'Maria Oliveira',
      tipo: 'Comprovante',
      dataEnvio: '-',
      status: 'Pendente',
    },
  ])

  const [novoDocumento, setNovoDocumento] = useState({
    funcionario: '',
    tipo: '',
    nomeArquivo: '',
  })

  const armazenamentoCarregado = useRef(false)
  const [ultimaSincronizacaoLocal, setUltimaSincronizacaoLocal] =
    useState<string>('')

  const CHAVE_DADOS_LOCAIS = 'gestao-sindical-dhl-mogi-mirim-v1'

  useEffect(() => {
    try {
      const dadosSalvos = window.localStorage.getItem(CHAVE_DADOS_LOCAIS)

      if (dadosSalvos) {
        const dados = JSON.parse(dadosSalvos)

        if (Array.isArray(dados.funcionarios)) {
          setFuncionarios(dados.funcionarios)
        }

        if (Array.isArray(dados.registrosPonto)) {
          setRegistrosPonto(dados.registrosPonto)
        }

        if (Array.isArray(dados.diarias)) {
          setDiarias(dados.diarias)
        }

        if (Array.isArray(dados.fechamentos)) {
          setFechamentos(dados.fechamentos)
        }

        if (Array.isArray(dados.pagamentos)) {
          setPagamentos(dados.pagamentos)
        }

        if (Array.isArray(dados.documentos)) {
          setDocumentos(dados.documentos)
        }

        if (Array.isArray(dados.listasDiaristas)) {
          setListasDiaristas(dados.listasDiaristas)
        }

        if (Array.isArray(dados.usuariosSistema)) {
          setUsuariosSistema(dados.usuariosSistema)
        }

        if (Array.isArray(dados.registrosAuditoria)) {
          setRegistrosAuditoria(dados.registrosAuditoria)
        }

        if (Array.isArray(dados.feriados)) {
          setFeriados(dados.feriados)
        }

        if (
          dados.configuracaoValores &&
          typeof dados.configuracaoValores === 'object'
        ) {
          const anterior = dados.configuracaoValores
          const base =
            Number(anterior.diariaBase) > 0 ? Number(anterior.diariaBase) : 100

          const configuracaoMigrada: ConfiguracaoValores = {
            diariaBase: base,
            percentualSabado:
              typeof anterior.percentualSabado === 'number'
                ? anterior.percentualSabado
                : typeof anterior.adicionalSabado === 'number'
                ? (anterior.adicionalSabado / base) * 100
                : 50,
            percentualDomingo:
              typeof anterior.percentualDomingo === 'number'
                ? anterior.percentualDomingo
                : typeof anterior.adicionalDomingo === 'number'
                ? (anterior.adicionalDomingo / base) * 100
                : 100,
            percentualFeriado:
              typeof anterior.percentualFeriado === 'number'
                ? anterior.percentualFeriado
                : typeof anterior.adicionalFeriado === 'number'
                ? (anterior.adicionalFeriado / base) * 100
                : 100,
            vt: Number(anterior.vt) || 0,
            vr: Number(anterior.vr) || 0,
          }

          setConfiguracaoValores(configuracaoMigrada)
          setConfiguracaoTemporaria(configuracaoMigrada)
        }

        if (typeof dados.salvoEm === 'string') {
          setUltimaSincronizacaoLocal(dados.salvoEm)
        }
      }
    } catch (erro) {
      console.error('Não foi possível carregar os dados locais:', erro)
    }

    window.setTimeout(() => {
      armazenamentoCarregado.current = true
    }, 0)
  }, [])

  useEffect(() => {
    if (!armazenamentoCarregado.current) return

    try {
      const salvoEm = new Date().toLocaleString('pt-BR')

      const dadosParaSalvar = {
        versao: 1,
        salvoEm,
        funcionarios,
        registrosPonto,
        diarias,
        fechamentos,
        pagamentos,
        documentos,
        listasDiaristas,
        usuariosSistema,
        registrosAuditoria,
        feriados,
        configuracaoValores,
      }

      window.localStorage.setItem(
        CHAVE_DADOS_LOCAIS,
        JSON.stringify(dadosParaSalvar)
      )

      setUltimaSincronizacaoLocal(salvoEm)
    } catch (erro) {
      console.error('Não foi possível salvar os dados locais:', erro)
    }
  }, [
    funcionarios,
    registrosPonto,
    diarias,
    fechamentos,
    pagamentos,
    documentos,
    listasDiaristas,
    usuariosSistema,
    registrosAuditoria,
    feriados,
    configuracaoValores,
  ])

  function limparDadosLocais() {
    const confirmou = window.confirm(
      'Isso apagará os dados salvos neste navegador e restaurará o protótipo na próxima atualização da página. Deseja continuar?'
    )

    if (!confirmou) return

    registrarAuditoria(
      'Restauração solicitada',
      'Configurações',
      'Os dados locais do protótipo foram marcados para restauração.',
      'Crítico'
    )

    window.localStorage.removeItem(CHAVE_DADOS_LOCAIS)
    window.location.reload()
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
      .map((nome, index) => `${index + 1}. ${nome}`)
      .join('\n')

    return [
      '📋 LISTA DE DIARISTAS',
      `📅 Data: ${formatarDataLista(lista.data)}`,
      lista.local ? `📍 Local: ${lista.local}` : '',
      lista.horario ? `🕐 Turno: ${lista.horario} às 18:30` : '',
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

    const blob = new Blob([montarTextoLista(dados)], {
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

  function salvarListaDiaristas() {
    if (!dataListaDiaristas) {
      mostrarNotificacao('Informe a data da lista.', 'warning')
      return
    }

    if (diaristasSelecionados.length === 0) {
      mostrarNotificacao(
        'Selecione pelo menos um diarista para salvar a lista.',
        'warning'
      )
      return
    }

    const novaLista: ListaDiaristas = {
      id: Date.now(),
      data: dataListaDiaristas,
      local: localListaDiaristas.trim(),
      horario: horarioListaDiaristas,
      observacao: observacaoListaDiaristas.trim(),
      diaristas: diaristasSelecionados,
      criadaEm: new Date().toLocaleString('pt-BR'),
    }

    setListasDiaristas((atual) => [novaLista, ...atual])
    setListaDiaristasSelecionada(novaLista)

    mostrarNotificacao(
      `Lista de ${formatarDataLista(dataListaDiaristas)} salva com ${diaristasSelecionados.length} diarista(s).`,
      'success'
    )
  }

  function novaListaDiaristas() {
    setDataListaDiaristas(new Date().toISOString().slice(0, 10))
    setLocalListaDiaristas('DHL Mogi Mirim')
    setHorarioListaDiaristas('09:30')
    setObservacaoListaDiaristas('')
    setBuscaListaDiaristas('')
    setDiaristasSelecionados([])
    setListaDiaristasSelecionada(null)
  }

  function excluirListaDiaristas(id: number) {
    setListasDiaristas((atual) => atual.filter((lista) => lista.id !== id))

    if (listaDiaristasSelecionada?.id === id) {
      setListaDiaristasSelecionada(null)
    }

    mostrarNotificacao('Lista removida.', 'info')
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

        return combinaBusca && combinaStatus && combinaData
      })
  }, [registrosPonto, buscaPonto, statusPontoFiltro, dataPontoFiltro])

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

  const detalhesFechamentoSelecionado = fechamentoSelecionado
    ? pagamentosDoFechamento(fechamentoSelecionado)
    : []

  const fechamentoSelecionadoDados = fechamentoSelecionado
    ? fechamentos.find(
        (fechamento) => fechamento.periodo === fechamentoSelecionado
      )
    : undefined

  const valorFechamentoSelecionado = detalhesFechamentoSelecionado.reduce(
    (total, pagamento) => total + pagamento.valorTotal,
    0
  )

  const diariasFechamentoSelecionado = detalhesFechamentoSelecionado.reduce(
    (total, pagamento) => total + pagamento.quantidadeDiarias,
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

  function salvarFuncionario() {
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

    setFuncionarios([
      ...funcionarios,
      {
        ...novoFuncionario,
        diaria: 'R$ 100,00',
      },
    ])

    const nome = novoFuncionario.nome

    setNovoFuncionario(funcionarioVazio)
    setMostrarFormulario(false)

    mostrarNotificacao(`${nome} foi cadastrado com sucesso.`, 'success')
  }

  function cadastrarFacial() {
    setNovoFuncionario({
      ...novoFuncionario,
      facial: 'Cadastrado',
    })

    mostrarNotificacao(
      'Cadastro facial realizado no modo demonstrativo.',
      'success'
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

  function adicionarFeriado(e: React.FormEvent) {
    e.preventDefault()

    if (!novoFeriadoData || !novoFeriadoNome.trim()) {
      mostrarNotificacao('Informe a data e o nome do feriado.', 'warning')
      return
    }

    const jaExiste = feriados.some(
      (feriado) =>
        feriado.data === novoFeriadoData &&
        feriado.nome.trim().toLowerCase() === novoFeriadoNome.trim().toLowerCase()
    )

    if (jaExiste) {
      mostrarNotificacao('Esse feriado já está cadastrado.', 'warning')
      return
    }

    const novo: Feriado = {
      id: Date.now(),
      data: novoFeriadoData,
      nome: novoFeriadoNome.trim(),
      tipo: novoFeriadoTipo,
      ativo: true,
    }

    setFeriados((atuais) =>
      [...atuais, novo].sort((a, b) => a.data.localeCompare(b.data))
    )

    registrarAuditoria(
      'Feriado cadastrado',
      'Calendário',
      `${novo.nome} em ${new Date(`${novo.data}T12:00:00`).toLocaleDateString('pt-BR')} (${novo.tipo}).`,
      'Atenção'
    )

    setNovoFeriadoData('')
    setNovoFeriadoNome('')
    setNovoFeriadoTipo('Municipal')
    setMostrarNovoFeriado(false)
    mostrarNotificacao('Feriado adicionado ao calendário.', 'success')
  }

  function alternarFeriado(id: number) {
    const alvo = feriados.find((feriado) => feriado.id === id)

    setFeriados((atuais) =>
      atuais.map((feriado) =>
        feriado.id === id
          ? { ...feriado, ativo: !feriado.ativo }
          : feriado
      )
    )

    if (alvo) {
      registrarAuditoria(
        alvo.ativo ? 'Feriado desativado' : 'Feriado ativado',
        'Calendário',
        `${alvo.nome} teve sua regra de cálculo alterada.`,
        'Atenção'
      )
    }
  }

  function excluirFeriado(id: number) {
    const alvo = feriados.find((feriado) => feriado.id === id)
    if (!alvo) return

    const confirmou = window.confirm(
      `Deseja excluir "${alvo.nome}" do calendário?`
    )
    if (!confirmou) return

    setFeriados((atuais) => atuais.filter((feriado) => feriado.id !== id))
    registrarAuditoria(
      'Feriado excluído',
      'Calendário',
      `${alvo.nome} foi removido do calendário.`,
      'Atenção'
    )
    mostrarNotificacao('Feriado removido.', 'success')
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

  function registrarPontoManual(index: number) {
    const agora = new Date()

    const horario = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const data = agora.toLocaleDateString('pt-BR')

    const registro = registrosPonto[index]
    const novosRegistros = [...registrosPonto]

    novosRegistros[index] = {
      ...registro,
      data,
      horario,
      status: 'Registrado',
      metodo: 'Manual',
    }

    setRegistrosPonto(novosRegistros)

    registrarAuditoria(
      'Ponto manual registrado',
      'Controle de Ponto',
      `Presença de ${registro.nome} registrada manualmente às ${horario}.`,
      'Atenção'
    )

    mostrarNotificacao(
      `Ponto de ${registro.nome} registrado. A diária será gerada após a conferência da operação.`,
      'success'
    )
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

  function aprovarDiaria(index: number) {
    const diaria = diarias[index]
    const novasDiarias = [...diarias]

    novasDiarias[index] = {
      ...novasDiarias[index],
      status: 'Aprovada',
    }

    setDiarias(novasDiarias)

    mostrarNotificacao(`Diária de ${diaria.nome} aprovada.`, 'success')
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

  function resumoAutomaticoFechamento(periodo: string) {
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

    const diariasPeriodo = diarias.filter((diaria) => noPeriodoBR(diaria.data))

    const nomes = Array.from(
      new Set([
        ...listasPeriodo.flatMap((lista) => lista.diaristas),
        ...diariasPeriodo.map((diaria) => diaria.nome),
      ])
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
        base: itens.reduce((soma, item) => soma + item.valorBase, 0),
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

  function abrirQuinzenaAtual() {
    const atual = periodoFechamentoPorData()
    const indice = fechamentos.findIndex(
      (fechamento) => fechamento.periodo === atual.periodo
    )

    if (indice >= 0) {
      setFechamentoSelecionado(indice)
      mostrarNotificacao('Quinzena aberta para conferência.', 'success')
      return
    }

    setFechamentos((atuais) => [
      { periodo: atual.periodo, pagamento: atual.pagamento, status: 'Aberto' },
      ...atuais,
    ])
    setFechamentoSelecionado(0)
    registrarAuditoria(
      'Fechamento criado',
      'Fechamentos',
      `Quinzena ${atual.periodo} criada automaticamente.`,
      'Atenção'
    )
    mostrarNotificacao('Quinzena atual criada automaticamente.', 'success')
  }

  function aprovarQuinzena(index: number) {
    const fechamento = fechamentos[index]
    if (!fechamento) return

    const resumo = resumoAutomaticoFechamento(fechamento.periodo)
    const criticos = resumo.inconsistencias.filter(
      (item) => item.nivel === 'Crítico'
    )

    if (criticos.length) {
      mostrarNotificacao(
        `Corrija ${criticos.length} pendência(s) crítica(s) antes de aprovar.`,
        'error'
      )
      return
    }

    if (!resumo.totais.diarias) {
      mostrarNotificacao('Não há diárias para aprovar nesta quinzena.', 'warning')
      return
    }

    setFechamentos((atuais) =>
      atuais.map((item, i) =>
        i === index ? { ...item, status: 'Aprovado' } : item
      )
    )

    registrarAuditoria(
      'Quinzena aprovada',
      'Fechamentos',
      `${fechamento.periodo} aprovada com total de ${moeda(resumo.totais.total)}.`,
      'Atenção'
    )
    mostrarNotificacao('Quinzena aprovada e consolidada.', 'success')
  }

  function enviarQuinzenaPagamentos(index: number) {
    const fechamento = fechamentos[index]
    if (!fechamento || fechamento.status !== 'Aprovado') {
      mostrarNotificacao('Aprove a quinzena antes de enviar para pagamentos.', 'warning')
      return
    }

    const resumo = resumoAutomaticoFechamento(fechamento.periodo)

    const novos: Pagamento[] = resumo.funcionarios
      .filter((item) => item.total > 0)
      .filter(
        (item) =>
          !pagamentos.some(
            (pagamento) =>
              pagamento.nome === item.nome &&
              pagamento.periodo === fechamento.periodo
          )
      )
      .map((item) => {
        const funcionario = funcionarios.find((f) => f.nome === item.nome)
        return {
          nome: item.nome,
          periodo: fechamento.periodo,
          quantidadeDiarias: item.diarias,
          valorTotal: item.total,
          pix: funcionario?.pix || '-',
          status: 'Aguardando',
          dataPagamento: '-',
        }
      })

    if (novos.length) setPagamentos((atuais) => [...atuais, ...novos])

    setFechamentos((atuais) =>
      atuais.map((item, i) =>
        i === index ? { ...item, status: 'Aguardando pagamento' } : item
      )
    )

    registrarAuditoria(
      'Enviado para pagamentos',
      'Fechamentos',
      `${fechamento.periodo}: ${novos.length} pagamento(s) preparado(s).`,
      'Atenção'
    )
    mostrarNotificacao('Quinzena enviada para a Central de Pagamentos.', 'success')
  }

  function reabrirQuinzena(index: number) {
    const fechamento = fechamentos[index]
    if (!fechamento || fechamento.status === 'Pago') return

    if (!window.confirm(`Reabrir ${fechamento.periodo} para conferência?`)) return

    setFechamentos((atuais) =>
      atuais.map((item, i) =>
        i === index ? { ...item, status: 'Em revisão' } : item
      )
    )

    registrarAuditoria(
      'Fechamento reaberto',
      'Fechamentos',
      `${fechamento.periodo} foi reaberto para correções.`,
      'Crítico'
    )
    mostrarNotificacao('Fechamento reaberto.', 'success')
  }

  function avancarFechamento(index: number) {
    const fechamento = fechamentos[index]
    if (!fechamento) return

    if (fechamento.status === 'Aberto') {
      setFechamentos((atuais) =>
        atuais.map((item, i) =>
          i === index ? { ...item, status: 'Em revisão' } : item
        )
      )
      mostrarNotificacao('Fechamento enviado para revisão.', 'success')
      return
    }

    if (fechamento.status === 'Em revisão') {
      aprovarQuinzena(index)
      return
    }

    if (fechamento.status === 'Aprovado') {
      enviarQuinzenaPagamentos(index)
      return
    }

    if (fechamento.status === 'Aguardando pagamento') {
      setTela('pagamentos')
      return
    }

    mostrarNotificacao('Fechamento já concluído.', 'warning')
  }

  function marcarPagamentoComoPago(index: number) {
    const novosPagamentos = [...pagamentos]

    const agora = new Date()

    const data = agora.toLocaleDateString('pt-BR')

    const hora = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const pagamento = novosPagamentos[index]

    novosPagamentos[index] = {
      ...pagamento,
      status: 'Pago',
      dataPagamento: `${data} ${hora}`,
    }

    setPagamentos(novosPagamentos)

    if (
      pagamentoPixSelecionado &&
      pagamentoPixSelecionado.nome === pagamento.nome &&
      pagamentoPixSelecionado.periodo === pagamento.periodo
    ) {
      setPagamentoPixSelecionado({
        ...pagamentoPixSelecionado,
        status: 'Pago',
        dataPagamento: `${data} ${hora}`,
      })
    }

    mostrarNotificacao(
      `Pagamento de ${pagamento.nome} confirmado.`,
      'success'
    )
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

  function salvarDocumento() {
    if (
      !novoDocumento.funcionario ||
      !novoDocumento.tipo ||
      !novoDocumento.nomeArquivo
    ) {
      mostrarNotificacao('Preencha funcionário, tipo e arquivo.', 'warning')
      return
    }

    const hoje = new Date().toLocaleDateString('pt-BR')
    const nomeFuncionario = novoDocumento.funcionario

    setDocumentos([
      ...documentos,
      {
        nome: novoDocumento.nomeArquivo,
        funcionario: novoDocumento.funcionario,
        tipo: novoDocumento.tipo,
        dataEnvio: hoje,
        status: 'Enviado',
      },
    ])

    setNovoDocumento({
      funcionario: '',
      tipo: '',
      nomeArquivo: '',
    })

    setMostrarDocumento(false)

    mostrarNotificacao(
      `Documento de ${nomeFuncionario} adicionado.`,
      'success'
    )
  }

  function exportarPDF() {
    mostrarNotificacao('PDF gerado no modo demonstrativo.', 'info')
  }

  function exportarExcel() {
    mostrarNotificacao('Excel gerado no modo demonstrativo.', 'info')
  }

  function salvarConfiguracoes() {
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
    } = configuracaoTemporaria

    if (
      diariaBase <= 0 ||
      percentualSabado < 0 ||
      percentualDomingo < 0 ||
      percentualFeriado < 0 ||
      vt < 0 ||
      vr < 0
    ) {
      mostrarNotificacao(
        'Confira os valores informados. A diária deve ser maior que zero e os demais valores não podem ser negativos.',
        'error'
      )
      return
    }

    setConfiguracaoValores({ ...configuracaoTemporaria })

    registrarAuditoria(
      'Valores da diária atualizados',
      'Configurações',
      `Diária-base ${moeda(diariaBase)}; sábado ${percentualSabado}%; domingo ${percentualDomingo}%; feriado ${percentualFeriado}%; VT ${moeda(vt)}; VR ${moeda(vr)}.`,
      'Atenção'
    )

    mostrarNotificacao(
      'Valores atualizados. As novas diárias usarão as novas regras.',
      'success'
    )
  }

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

  function simularReconhecimento() {
    setMensagemErroTotem('')
    setEstadoTotem('reconhecendo')

    window.setTimeout(() => {
      const agora = new Date()

      const horario = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })

      const data = agora.toLocaleDateString('pt-BR')

      const candidatos = funcionarios.filter(
        (funcionario) =>
          funcionario.status === 'Ativo' &&
          funcionario.facial === 'Cadastrado'
      )

      const aindaSemPontoHoje = candidatos.filter((funcionario) => {
        const registroHoje = registrosPonto.find(
          (registro) =>
            registro.nome === funcionario.nome &&
            registro.data === data &&
            registro.status === 'Registrado'
        )

        return !registroHoje
      })

      const funcionarioDemo =
        aindaSemPontoHoje[0] ||
        candidatos.find((funcionario) => funcionario.nome === 'Pedro Almeida') ||
        candidatos[0]

      if (!funcionarioDemo) {
        setMensagemErroTotem(
          'Nenhum funcionário ativo com reconhecimento facial cadastrado foi encontrado.'
        )
        setEstadoTotem('erro')
        return
      }

      setFuncionarioReconhecido(funcionarioDemo.nome)
      setHorarioTotem(horario)

      setRegistrosPonto((atuais) => {
        const indice = atuais.findIndex(
          (registro) =>
            registro.nome === funcionarioDemo.nome &&
            registro.data === data
        )

        if (indice >= 0) {
          return atuais.map((registro, registroIndex) =>
            registroIndex === indice
              ? {
                  ...registro,
                  funcao: funcionarioDemo.funcao,
                  horario,
                  status: 'Registrado',
                  metodo: 'Reconhecimento facial',
                }
              : registro
          )
        }

        return [
          {
            nome: funcionarioDemo.nome,
            funcao: funcionarioDemo.funcao,
            data,
            horario,
            status: 'Registrado',
            metodo: 'Reconhecimento facial',
          },
          ...atuais,
        ]
      })

      setEstadoTotem('sucesso')
    }, 1800)
  }

  function simularFalhaReconhecimento() {
    setMensagemErroTotem('')
    setEstadoTotem('reconhecendo')

    window.setTimeout(() => {
      setMensagemErroTotem(
        'Não foi possível confirmar sua identidade. Ajuste a posição do rosto e tente novamente.'
      )
      setEstadoTotem('erro')
    }, 1500)
  }

  function novoRegistroTotem() {
    setEstadoTotem('aguardando')
    setFuncionarioReconhecido('')
    setHorarioTotem('')
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

  const documentosEnviados = documentos.filter(
    (documento) => documento.status === 'Enviado'
  ).length

  const documentosPendentes = documentos.filter(
    (documento) => documento.status === 'Pendente'
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

  const fechamentoAtual =
    fechamentos.find(
      (fechamento) => fechamento.periodo === '16/08/2026 a 31/08/2026'
    ) ?? fechamentos[1]

  const funcionarioPixSelecionado = pagamentoPixSelecionado
    ? obterFuncionarioPorNome(pagamentoPixSelecionado.nome)
    : undefined

  const qrPix = pagamentoPixSelecionado
    ? gerarPadraoQr(
        `${pagamentoPixSelecionado.nome}-${pagamentoPixSelecionado.pix}-${pagamentoPixSelecionado.valorTotal}`
      )
    : []

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

  function registrarAuditoria(
    acao: string,
    modulo: string,
    detalhe: string,
    nivel: RegistroAuditoria['nivel'] = 'Informação',
    usuarioForcado?: UsuarioSistema | null
  ) {
    const usuarioEvento = usuarioForcado ?? usuarioLogado

    const novoRegistro: RegistroAuditoria = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      dataHora: new Date().toLocaleString('pt-BR'),
      usuario: usuarioEvento?.nome || 'Sistema',
      perfil: usuarioEvento?.perfil || 'Sistema',
      acao,
      modulo,
      detalhe,
      nivel,
    }

    setRegistrosAuditoria((atuais) => [novoRegistro, ...atuais].slice(0, 300))
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

  function entrarAreaAdministrativa(e: React.FormEvent) {
    e.preventDefault()

    const loginDigitado = usuarioLogin.trim().toLowerCase()

    const usuarioEncontrado = usuariosSistema.find(
      (item) =>
        item.usuario.toLowerCase() === loginDigitado &&
        item.senha === senhaLogin
    )

    if (!usuarioEncontrado) {
      setErroLogin('Usuário ou senha incorretos.')
      return
    }

    if (usuarioEncontrado.status !== 'Ativo') {
      setErroLogin('Este usuário está inativo. Procure um administrador.')
      return
    }

    const usuarioAtualizado = {
      ...usuarioEncontrado,
      ultimoAcesso: 'Agora',
    }

    setUsuariosSistema((atuais) =>
      atuais.map((item) =>
        item.id === usuarioEncontrado.id ? usuarioAtualizado : item
      )
    )

    setUsuarioLogado(usuarioAtualizado)
    setErroLogin('')
    setSenhaLogin('')

    if (usuarioAtualizado.perfil === 'Consulta') {
      setTela('dashboard')
    } else {
      setTela('operacao')
    }

    setModoAcesso('admin')

    registrarAuditoria(
      'Login realizado',
      'Acesso',
      `Acesso autorizado para o perfil ${usuarioAtualizado.perfil}.`,
      'Informação',
      usuarioAtualizado
    )

    mostrarNotificacao(
      `Bem-vindo, ${usuarioAtualizado.nome}. Perfil: ${usuarioAtualizado.perfil}.`,
      'success'
    )
  }

  function sairAreaAdministrativa() {
    registrarAuditoria(
      'Logout realizado',
      'Acesso',
      'Sessão administrativa encerrada pelo usuário.'
    )

    setUsuarioLogin('')
    setSenhaLogin('')
    setErroLogin('')
    setUsuarioLogado(null)
    setTela('dashboard')
    setModoAcesso('inicio')
  }

  function salvarNovoUsuario(e: React.FormEvent) {
    e.preventDefault()

    if (
      !novoUsuarioNome.trim() ||
      !novoUsuarioLogin.trim() ||
      !novoUsuarioSenha.trim()
    ) {
      mostrarNotificacao('Preencha nome, usuário e senha.', 'warning')
      return
    }

    const loginExiste = usuariosSistema.some(
      (item) =>
        item.usuario.toLowerCase() === novoUsuarioLogin.trim().toLowerCase()
    )

    if (loginExiste) {
      mostrarNotificacao('Esse nome de usuário já está em uso.', 'warning')
      return
    }

    const novo: UsuarioSistema = {
      id: Date.now(),
      nome: novoUsuarioNome.trim(),
      usuario: novoUsuarioLogin.trim(),
      senha: novoUsuarioSenha,
      perfil: novoUsuarioPerfil,
      status: 'Ativo',
      ultimoAcesso: 'Nunca acessou',
    }

    setUsuariosSistema((atuais) => [...atuais, novo])
    setNovoUsuarioNome('')
    setNovoUsuarioLogin('')
    setNovoUsuarioSenha('')
    setNovoUsuarioPerfil('Supervisor')
    setMostrarNovoUsuario(false)

    registrarAuditoria(
      'Usuário criado',
      'Usuários',
      `Novo acesso criado para ${novo.nome} com perfil ${novo.perfil}.`,
      'Atenção'
    )

    mostrarNotificacao('Novo usuário criado com sucesso.', 'success')
  }

  function alternarStatusUsuario(id: number) {
    if (usuarioLogado?.id === id) {
      mostrarNotificacao(
        'Você não pode desativar o próprio usuário enquanto está conectado.',
        'warning'
      )
      return
    }

    setUsuariosSistema((atuais) =>
      atuais.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === 'Ativo' ? 'Inativo' : 'Ativo',
            }
          : item
      )
    )

    const usuarioAlterado = usuariosSistema.find((item) => item.id === id)

    registrarAuditoria(
      'Status de usuário alterado',
      'Usuários',
      usuarioAlterado
        ? `O acesso de ${usuarioAlterado.nome} teve o status alterado.`
        : 'Status de acesso alterado.',
      'Atenção'
    )

    mostrarNotificacao('Status do usuário atualizado.', 'success')
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
                Usuário
              </label>

              <input
                autoFocus
                value={usuarioLogin}
                onChange={(e) => {
                  setUsuarioLogin(e.target.value)
                  setErroLogin('')
                }}
                placeholder="Digite seu usuário"
                autoComplete="username"
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

            <div
              style={{
                margin: '0 0 14px',
                padding: '12px',
                borderRadius: '11px',
                background: '#f8f4fa',
                border: '1px solid #eadfee',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: '#5d3b6c',
                  fontSize: '9px',
                  marginBottom: '6px',
                }}
              >
                Acessos demonstrativos
              </strong>

              <div
                style={{
                  display: 'grid',
                  gap: '4px',
                  color: '#796f7d',
                  fontSize: '9px',
                }}
              >
                <span><b>Administrador:</b> admin / 1234</span>
                <span><b>Supervisor:</b> supervisor / 1234</span>
                <span><b>Consulta:</b> consulta / 1234</span>
              </div>
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

            <div
              style={{
                marginTop: '18px',
                padding: '12px',
                borderRadius: '11px',
                background: '#f8f6f9',
                border: '1px solid #eee8f0',
                color: '#807585',
                fontSize: '9px',
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: '#5f5065' }}>
                Acesso demonstrativo:
              </strong>{' '}
              usuário <strong>admin</strong> e senha <strong>1234</strong>.
              Quando o sistema tiver backend, essa autenticação será substituída
              por segurança real.
            </div>
          </form>
        </div>
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
                    Seu registro de presença foi concluído com sucesso.
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
                          {agoraTotem.toLocaleDateString('pt-BR')}
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
                  onClick={simularReconhecimento}
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
                    : '◉ Iniciar reconhecimento'}
                </button>

                {estadoTotem === 'aguardando' && (
                  <button
                    onClick={simularFalhaReconhecimento}
                    style={{
                      minHeight: '42px',
                      padding: '0 14px',
                      borderRadius: '12px',
                      border: '1px solid #e3dce6',
                      background: '#ffffff',
                      color: '#8c818f',
                      fontSize: '8px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Simular falha
                  </button>
                )}
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
              Protótipo demonstrativo. O reconhecimento facial real será
              integrado posteriormente com validação e prova de vida.
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
                    {funcionarioPixSelecionado?.titularPix ||
                      pagamentoPixSelecionado.nome}
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

                <div className="fake-qr-code">
                  {qrPix.map((linha, linhaIndex) =>
                    linha.map((ativo, colunaIndex) => (
                      <span
                        key={`${linhaIndex}-${colunaIndex}`}
                        className={ativo ? 'qr-cell active' : 'qr-cell'}
                      />
                    ))
                  )}
                </div>

                <strong>Escaneie para pagamento</strong>

                <small>
                  QR demonstrativo para apresentação do protótipo.
                </small>
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
                  ✓ Confirmar pagamento
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
            Sair da Área Administrativa
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

              const ausentes = escalados.filter(
                (nome) => !presentes.includes(nome)
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

              const hoje = dataLocalHoje
              const dataJaPassou = dataOperacao < hoje

              const statusDiarista = (nome: string) => {
                if (presentes.includes(nome)) return 'Presente'
                if (dataJaPassou) return 'Falta'
                return 'Ainda não registrou'
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
                        titulo: dataJaPassou ? 'Faltas' : 'Sem registro',
                        valor: ausentes.length,
                        detalhe: dataJaPassou
                          ? 'Não compareceram'
                          : 'Aguardando ponto',
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

                const faltas = lista.diaristas.filter(
                  (nome) => !presentes.includes(nome)
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
                                    {presente ? 'Presente' : 'Falta'}
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
                    <strong>75%</strong>
                  </div>

                  <div className="progress-track">
                    <div className="progress-fill" />
                  </div>
                </div>

                <div className="fortnight-stats">
                  <div>
                    <span>Diárias</span>
                    <strong>
                      {diariasDoFechamento(fechamentoAtual.periodo)}
                    </strong>
                  </div>

                  <div>
                    <span>Valor previsto</span>
                    <strong>
                      {moeda(valorDoFechamento(fechamentoAtual.periodo))}
                    </strong>
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
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          cpf: e.target.value,
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
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          telefone: e.target.value,
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
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          chavePix: e.target.value,
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
                </div>

                <h3 className="form-section-title">Reconhecimento facial</h3>

                <div className="biometric-box">
                  <div className="biometric-photo">👤</div>

                  <div className="biometric-info">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          foto: e.target.files?.[0]?.name || '',
                        })
                      }
                    />

                    <button
                      className="action-button"
                      onClick={cadastrarFacial}
                    >
                      Simular cadastro facial
                    </button>

                    <span
                      className={
                        novoFuncionario.facial === 'Cadastrado'
                          ? 'employee-status active-status'
                          : 'employee-status pending-status'
                      }
                    >
                      Facial: {novoFuncionario.facial}
                    </span>
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
                        onClick={() => setFuncionarioSelecionado(null)}
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
                    </div>
                  </div>

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
                                            documento.status === 'Enviado'
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

                      <button
                        className="primary-button"
                        onClick={() => setModoAcesso('totem')}
                        style={{ padding: '10px 14px', fontSize: '11px' }}
                      >
                        ◉ Abrir Totem
                      </button>
                    </div>

                    <div className="table-wrapper">
                      <table className="employees-table">
                        <thead>
                          <tr>
                            <th>Funcionário</th>
                            <th>Função</th>
                            <th>Data</th>
                            <th>Entrada</th>
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
                                      {registro.metodo ||
                                        'Reconhecimento facial'}
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
                                    <button
                                      className="action-button"
                                      onClick={() =>
                                        registrarPontoManual(indexOriginal)
                                      }
                                    >
                                      Registrar
                                    </button>
                                  ) : (
                                    <button
                                      className="action-button"
                                      onClick={() =>
                                        setRegistroPontoSelecionado(registro)
                                      }
                                    >
                                      Ver detalhes
                                    </button>
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
                      <label>Turno</label>
                      <input
                        type="text"
                        value="09:30 às 18:30"
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
                    Lista de {formatarDataLista(dataListaDiaristas)}
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
                              onClick={() => excluirListaDiaristas(lista.id)}
                              title="Excluir lista"
                              style={{
                                border: 0,
                                background: 'transparent',
                                color: '#b06b6b',
                                cursor: 'pointer',
                                fontSize: '14px',
                              }}
                            >
                              ×
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

              const faltaramLista = listaReferencia
                ? convocados.filter((nome) => !presentesLista.includes(nome))
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
                        titulo: 'Faltaram',
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
                            ? `${convocados.length} convocado(s), ${presentesLista.length} com ponto e ${faltaramLista.length} sem registro. O sistema gera a diária apenas para quem possui ponto confirmado.`
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
                              const id = Number(e.target.value)
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
                          {faltaramLista.length} convocado(s) sem ponto
                          registrado
                        </strong>

                        <span
                          style={{
                            color: '#9b762f',
                            fontSize: '10px',
                            lineHeight: 1.5,
                          }}
                        >
                          {faltaramLista.join(', ')}. Nenhuma diária será gerada
                          para esses nomes até existir um ponto confirmado.
                        </span>
                      </div>
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
                                  </td>
                                  <td>
                                    {diaria.status === 'Pendente' ? (
                                      <button
                                        className="action-button"
                                        onClick={() =>
                                          aprovarDiaria(indexOriginal)
                                        }
                                      >
                                        Aprovar
                                      </button>
                                    ) : (
                                      <span className="registered-text">
                                        Aprovada
                                      </span>
                                    )}
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
                ? resumoAutomaticoFechamento(selecionado.periodo)
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
                        Uma linha por diarista, um campo por dia e resumo de
                        diárias, VT e VR no final.
                      </p>
                    </div>

                    <button
                      className="primary-button"
                      onClick={abrirQuinzenaAtual}
                    >
                      + Abrir quinzena atual
                    </button>
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
                        detalhe: 'dias pagos no período',
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
                        <option value="Aberto">Aberto</option>
                        <option value="Em revisão">Em revisão</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Aguardando pagamento">
                          Aguardando pagamento
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

                            {(selecionado.status === 'Aberto' ||
                              selecionado.status === 'Em revisão') && (
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
                              'Aguardando pagamento' && (
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
                <span>Enviados</span>
                <strong>{documentosEnviados}</strong>
              </div>

              <div className="card">
                <span>Pendentes</span>
                <strong>{documentosPendentes}</strong>
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
                    <option value="Enviado">Enviado</option>
                    <option value="Pendente">Pendente</option>
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

                      {funcionarios.map((funcionario, index) => (
                        <option key={index} value={funcionario.nome}>
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
                      <option value="RG">RG</option>
                      <option value="CPF">CPF</option>
                      <option value="Comprovante">Comprovante</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Arquivo</label>

                    <input
                      type="file"
                      onChange={(e) =>
                        setNovoDocumento({
                          ...novoDocumento,
                          nomeArquivo: e.target.files?.[0]?.name || '',
                        })
                      }
                    />
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
                  >
                    Salvar Documento
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
                      <th>Data</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {documentosFiltrados.map((documento, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{documento.nome}</strong>
                        </td>

                        <td>{documento.funcionario}</td>

                        <td>{documento.tipo}</td>

                        <td>{documento.dataEnvio}</td>

                        <td>
                          <span
                            className={
                              documento.status === 'Enviado'
                                ? 'employee-status active-status'
                                : 'employee-status pending-status'
                            }
                          >
                            {documento.status}
                          </span>
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
                            <option value="Empresa">Empresa</option>
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
                    ⚠ Os feriados nacionais principais de 2026 foram
                    pré-cadastrados. Feriados estaduais, municipais, pontos
                    facultativos e datas específicas da empresa podem ser
                    adicionados pelo administrador.
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
                        detalhe: 'histórico local',
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
                        Máximo local: 300 eventos
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
                    ⛨ A auditoria desta versão é demonstrativa e fica salva
                    localmente. Em produção, esses eventos devem ser gravados no
                    servidor e protegidos contra alteração pelo usuário.
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
                  Controle quem entra no sistema e quais áreas cada perfil pode acessar.
                </p>
              </div>

              <button
                className="primary-button"
                onClick={() => setMostrarNovoUsuario((atual) => !atual)}
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
                gridTemplateColumns: mostrarNovoUsuario
                  ? 'minmax(0, 1.3fr) minmax(300px, .7fr)'
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
                    Login demonstrativo do protótipo
                  </span>
                </div>

                <div className="table-wrapper">
                  <table className="employees-table">
                    <thead>
                      <tr>
                        <th>Usuário</th>
                        <th>Login</th>
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
                            <button
                              className="table-action-button"
                              onClick={() => alternarStatusUsuario(item.id)}
                            >
                              {item.status === 'Ativo' ? 'Desativar' : 'Reativar'}
                            </button>
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
                    <label>Nome de usuário</label>
                    <input
                      value={novoUsuarioLogin}
                      onChange={(e) => setNovoUsuarioLogin(e.target.value)}
                      placeholder="Ex.: jose.silva"
                    />
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

                  <div className="form-group" style={{ marginBottom: '14px' }}>
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

                  <button className="primary-button" style={{ width: '100%' }}>
                    Salvar usuário
                  </button>
                </form>
              )}
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
              ⚠ As senhas desta versão são demonstrativas e ficam no navegador.
              Em produção, autenticação e permissões devem ser controladas no servidor.
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
                  sábado, domingo e feriado, além de VT e VR.
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
              feriado não gera um segundo adicional.
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

                <button
                  type="button"
                  onClick={limparDadosLocais}
                  style={{
                    minHeight: '36px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1px solid #efd6d2',
                    background: '#fff8f7',
                    color: '#a64d41',
                    fontSize: '8px',
                    fontWeight: 850,
                    cursor: 'pointer',
                  }}
                >
                  Restaurar dados de demonstração
                </button>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  )
}

export default App