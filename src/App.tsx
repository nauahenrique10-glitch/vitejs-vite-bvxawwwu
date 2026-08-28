import { useState } from 'react';
import './App.css';

type Tela =
  | 'dashboard'
  | 'funcionarios'
  | 'ponto'
  | 'diarias'
  | 'fechamentos'
  | 'pagamentos'
  | 'documentos'
  | 'relatorios'
  | 'totem';

type Funcionario = {
  nome: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  admissao: string;
  funcao: string;
  diaria: string;
  status: 'Ativo' | 'Inativo';
  tipoPix: string;
  chavePix: string;
  titularPix: string;
  foto: string;
  facial: 'Cadastrado' | 'Pendente';
};

type RegistroPonto = {
  nome: string;
  funcao: string;
  data: string;
  horario: string;
  status: 'Registrado' | 'Pendente';
};

type Diaria = {
  nome: string;
  funcao: string;
  data: string;
  valor: number;
  status: 'Aprovada' | 'Pendente';
};

type StatusFechamento =
  | 'Aberto'
  | 'Em revisão'
  | 'Aprovado'
  | 'Aguardando pagamento'
  | 'Pago';

type Fechamento = {
  periodo: string;
  pagamento: string;
  quantidadeDiarias: number;
  valorTotal: number;
  status: StatusFechamento;
};

type Pagamento = {
  nome: string;
  periodo: string;
  quantidadeDiarias: number;
  valorTotal: number;
  pix: string;
  status: 'Aguardando' | 'Pago';
  dataPagamento: string;
};

type Documento = {
  nome: string;
  funcionario: string;
  tipo: string;
  dataEnvio: string;
  status: 'Enviado' | 'Pendente';
};

const funcionarioVazio: Funcionario = {
  nome: '',
  cpf: '',
  nascimento: '',
  telefone: '',
  email: '',
  endereco: '',
  admissao: '',
  funcao: '',
  diaria: '',
  status: 'Ativo',
  tipoPix: '',
  chavePix: '',
  titularPix: '',
  foto: '',
  facial: 'Pendente',
};

function App() {
  const [tela, setTela] = useState<Tela>('dashboard');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarDocumento, setMostrarDocumento] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] =
    useState<Funcionario | null>(null);

  const [estadoTotem, setEstadoTotem] = useState<
    'aguardando' | 'reconhecendo' | 'sucesso'
  >('aguardando');

  const [funcionarioReconhecido, setFuncionarioReconhecido] = useState('');
  const [horarioTotem, setHorarioTotem] = useState('');

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([
    {
      nome: 'João da Silva',
      cpf: '123.456.789-00',
      nascimento: '12/04/1991',
      telefone: '(19) 99999-1001',
      email: 'joao@email.com',
      endereco: 'Rua das Flores, 120 - Limeira/SP',
      admissao: '05/02/2024',
      funcao: 'Movimentador',
      diaria: 'R$ 150,00',
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
      funcao: 'Auxiliar',
      diaria: 'R$ 130,00',
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
      funcao: 'Conferente',
      diaria: 'R$ 170,00',
      status: 'Inativo',
      tipoPix: 'Celular',
      chavePix: '(19) 99999-1003',
      titularPix: 'Carlos Santos',
      foto: '',
      facial: 'Pendente',
    },
  ]);

  const [novoFuncionario, setNovoFuncionario] =
    useState<Funcionario>(funcionarioVazio);

  const [registrosPonto, setRegistrosPonto] = useState<RegistroPonto[]>([
    {
      nome: 'João da Silva',
      funcao: 'Movimentador',
      data: '28/08/2026',
      horario: '07:03',
      status: 'Registrado',
    },
    {
      nome: 'Maria Oliveira',
      funcao: 'Auxiliar',
      data: '28/08/2026',
      horario: '07:11',
      status: 'Registrado',
    },
    {
      nome: 'Pedro Almeida',
      funcao: 'Movimentador',
      data: '28/08/2026',
      horario: '--:--',
      status: 'Pendente',
    },
    {
      nome: 'Lucas Ferreira',
      funcao: 'Conferente',
      data: '28/08/2026',
      horario: '07:19',
      status: 'Registrado',
    },
  ]);

  const [diarias, setDiarias] = useState<Diaria[]>([
    {
      nome: 'João da Silva',
      funcao: 'Movimentador',
      data: '28/08/2026',
      valor: 150,
      status: 'Aprovada',
    },
    {
      nome: 'Maria Oliveira',
      funcao: 'Auxiliar',
      data: '28/08/2026',
      valor: 130,
      status: 'Aprovada',
    },
    {
      nome: 'Lucas Ferreira',
      funcao: 'Conferente',
      data: '28/08/2026',
      valor: 170,
      status: 'Aprovada',
    },
    {
      nome: 'Pedro Almeida',
      funcao: 'Movimentador',
      data: '28/08/2026',
      valor: 150,
      status: 'Pendente',
    },
  ]);

  const [fechamentos, setFechamentos] = useState<Fechamento[]>([
    {
      periodo: '01/08/2026 a 15/08/2026',
      pagamento: '20/08/2026',
      quantidadeDiarias: 86,
      valorTotal: 12900,
      status: 'Pago',
    },
    {
      periodo: '16/08/2026 a 31/08/2026',
      pagamento: '05/09/2026',
      quantidadeDiarias: 64,
      valorTotal: 9580,
      status: 'Em revisão',
    },
    {
      periodo: '01/09/2026 a 15/09/2026',
      pagamento: '20/09/2026',
      quantidadeDiarias: 0,
      valorTotal: 0,
      status: 'Aberto',
    },
  ]);

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([
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
      nome: 'Lucas Ferreira',
      periodo: '01/08/2026 a 15/08/2026',
      quantidadeDiarias: 8,
      valorTotal: 1360,
      pix: '(19) 99999-1111',
      status: 'Pago',
      dataPagamento: '20/08/2026 14:35',
    },
  ]);

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
  ]);

  const [novoDocumento, setNovoDocumento] = useState({
    funcionario: '',
    tipo: '',
    nomeArquivo: '',
  });

  function salvarFuncionario() {
    if (
      !novoFuncionario.nome ||
      !novoFuncionario.cpf ||
      !novoFuncionario.funcao ||
      !novoFuncionario.diaria ||
      !novoFuncionario.telefone
    ) {
      alert('Preencha pelo menos nome, CPF, telefone, função e diária.');
      return;
    }

    setFuncionarios([...funcionarios, novoFuncionario]);
    setNovoFuncionario(funcionarioVazio);
    setMostrarFormulario(false);
  }

  function cadastrarFacial() {
    setNovoFuncionario({
      ...novoFuncionario,
      facial: 'Cadastrado',
    });

    alert('Rosto cadastrado com sucesso! Simulação do protótipo.');
  }

  function registrarPontoManual(index: number) {
    const novosRegistros = [...registrosPonto];

    const agora = new Date();

    const horario = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    novosRegistros[index] = {
      ...novosRegistros[index],
      horario,
      status: 'Registrado',
    };

    setRegistrosPonto(novosRegistros);
  }

  function aprovarDiaria(index: number) {
    const novasDiarias = [...diarias];

    novasDiarias[index] = {
      ...novasDiarias[index],
      status: 'Aprovada',
    };

    setDiarias(novasDiarias);
  }

  function avancarFechamento(index: number) {
    const ordem: StatusFechamento[] = [
      'Aberto',
      'Em revisão',
      'Aprovado',
      'Aguardando pagamento',
      'Pago',
    ];

    const novosFechamentos = [...fechamentos];
    const atual = novosFechamentos[index].status;
    const posicaoAtual = ordem.indexOf(atual);

    if (posicaoAtual < ordem.length - 1) {
      novosFechamentos[index] = {
        ...novosFechamentos[index],
        status: ordem[posicaoAtual + 1],
      };

      setFechamentos(novosFechamentos);
    }
  }

  function marcarPagamentoComoPago(index: number) {
    const novosPagamentos = [...pagamentos];
    const agora = new Date();

    const data = agora.toLocaleDateString('pt-BR');

    const hora = agora.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    novosPagamentos[index] = {
      ...novosPagamentos[index],
      status: 'Pago',
      dataPagamento: `${data} ${hora}`,
    };

    setPagamentos(novosPagamentos);
  }

  function salvarDocumento() {
    if (
      !novoDocumento.funcionario ||
      !novoDocumento.tipo ||
      !novoDocumento.nomeArquivo
    ) {
      alert('Preencha todos os campos do documento.');
      return;
    }

    const hoje = new Date().toLocaleDateString('pt-BR');

    setDocumentos([
      ...documentos,
      {
        nome: novoDocumento.nomeArquivo,
        funcionario: novoDocumento.funcionario,
        tipo: novoDocumento.tipo,
        dataEnvio: hoje,
        status: 'Enviado',
      },
    ]);

    setNovoDocumento({
      funcionario: '',
      tipo: '',
      nomeArquivo: '',
    });

    setMostrarDocumento(false);
  }

  function exportarPDF() {
    alert('Relatório PDF gerado com sucesso! Simulação do protótipo.');
  }

  function exportarExcel() {
    alert('Relatório Excel gerado com sucesso! Simulação do protótipo.');
  }

  function simularReconhecimento() {
    setEstadoTotem('reconhecendo');

    setTimeout(() => {
      const agora = new Date();

      const horario = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const data = agora.toLocaleDateString('pt-BR');

      setFuncionarioReconhecido('Pedro Almeida');
      setHorarioTotem(horario);

      setRegistrosPonto((registrosAtuais) =>
        registrosAtuais.map((registro) =>
          registro.nome === 'Pedro Almeida'
            ? {
                ...registro,
                data,
                horario,
                status: 'Registrado',
              }
            : registro
        )
      );

      setEstadoTotem('sucesso');
    }, 1800);
  }

  function novoRegistroTotem() {
    setEstadoTotem('aguardando');
    setFuncionarioReconhecido('');
    setHorarioTotem('');
  }

  const totalRegistrados = registrosPonto.filter(
    (registro) => registro.status === 'Registrado'
  ).length;

  const totalPendentes = registrosPonto.filter(
    (registro) => registro.status === 'Pendente'
  ).length;

  const totalDiariasAprovadas = diarias.filter(
    (diaria) => diaria.status === 'Aprovada'
  ).length;

  const totalDiariasPendentes = diarias.filter(
    (diaria) => diaria.status === 'Pendente'
  ).length;

  const valorTotalDiarias = diarias
    .filter((diaria) => diaria.status === 'Aprovada')
    .reduce((total, diaria) => total + diaria.valor, 0);

  const fechamentosAbertos = fechamentos.filter(
    (fechamento) => fechamento.status !== 'Pago'
  ).length;

  const fechamentosPagos = fechamentos.filter(
    (fechamento) => fechamento.status === 'Pago'
  ).length;

  const totalPrevistoFechamentos = fechamentos
    .filter((fechamento) => fechamento.status !== 'Pago')
    .reduce((total, fechamento) => total + fechamento.valorTotal, 0);

  const pagamentosPendentes = pagamentos.filter(
    (pagamento) => pagamento.status === 'Aguardando'
  ).length;

  const pagamentosPagos = pagamentos.filter(
    (pagamento) => pagamento.status === 'Pago'
  ).length;

  const valorPendentePagamentos = pagamentos
    .filter((pagamento) => pagamento.status === 'Aguardando')
    .reduce((total, pagamento) => total + pagamento.valorTotal, 0);

  const documentosEnviados = documentos.filter(
    (documento) => documento.status === 'Enviado'
  ).length;

  const documentosPendentes = documentos.filter(
    (documento) => documento.status === 'Pendente'
  ).length;

  const funcionariosAtivos = funcionarios.filter(
    (funcionario) => funcionario.status === 'Ativo'
  ).length;

  const valorTotalPago = pagamentos
    .filter((pagamento) => pagamento.status === 'Pago')
    .reduce((total, pagamento) => total + pagamento.valorTotal, 0);

  if (tela === 'totem') {
    return (
      <div className="totem-page">
        <div className="totem-top">
          <div>
            <strong>Gestão Sindical</strong>
            <span>Terminal de Registro de Ponto</span>
          </div>

          <button
            className="totem-exit"
            onClick={() => {
              novoRegistroTotem();
              setTela('dashboard');
            }}
          >
            Voltar ao painel
          </button>
        </div>

        <div className="totem-content">
          {estadoTotem === 'aguardando' && (
            <div className="totem-card">
              <div className="camera-area">
                <div className="face-frame">
                  <div className="face-icon">☺</div>
                </div>

                <div className="scan-line"></div>
              </div>

              <h1>Registre seu ponto</h1>

              <p>Posicione seu rosto em frente à câmera.</p>

              <button
                className="totem-main-button"
                onClick={simularReconhecimento}
              >
                Simular reconhecimento facial
              </button>

              <small>
                Protótipo demonstrativo — reconhecimento facial simulado.
              </small>
            </div>
          )}

          {estadoTotem === 'reconhecendo' && (
            <div className="totem-card">
              <div className="camera-area recognizing">
                <div className="face-frame">
                  <div className="face-icon">☺</div>
                </div>

                <div className="scan-line active-scan"></div>
              </div>

              <div className="loading-circle"></div>

              <h1>Reconhecendo...</h1>
              <p>Aguarde enquanto o sistema realiza a identificação.</p>
            </div>
          )}

          {estadoTotem === 'sucesso' && (
            <div className="totem-card success-totem">
              <div className="success-circle">✓</div>

              <span className="success-label">IDENTIFICAÇÃO CONFIRMADA</span>

              <h1>Ponto registrado com sucesso!</h1>

              <div className="worker-result">
                <span>Funcionário</span>
                <strong>{funcionarioReconhecido}</strong>
              </div>

              <div className="totem-time">
                <div>
                  <span>Data</span>
                  <strong>{new Date().toLocaleDateString('pt-BR')}</strong>
                </div>

                <div>
                  <span>Horário</span>
                  <strong>{horarioTotem}</strong>
                </div>
              </div>

              <button className="totem-main-button" onClick={novoRegistroTotem}>
                Finalizar
              </button>
            </div>
          )}
        </div>

        <div className="totem-footer">
          Sindicato dos Trabalhadores na Movimentação de Mercadorias de Limeira
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>Gestão Sindical</h1>

        <div className="menu">
          <button
            className={tela === 'dashboard' ? 'active' : ''}
            onClick={() => setTela('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={tela === 'funcionarios' ? 'active' : ''}
            onClick={() => setTela('funcionarios')}
          >
            Funcionários
          </button>

          <button
            className={tela === 'ponto' ? 'active' : ''}
            onClick={() => setTela('ponto')}
          >
            Controle de Ponto
          </button>

          <button
            className={tela === 'diarias' ? 'active' : ''}
            onClick={() => setTela('diarias')}
          >
            Diárias
          </button>

          <button
            className={tela === 'fechamentos' ? 'active' : ''}
            onClick={() => setTela('fechamentos')}
          >
            Fechamentos
          </button>

          <button
            className={tela === 'pagamentos' ? 'active' : ''}
            onClick={() => setTela('pagamentos')}
          >
            Pagamentos
          </button>

          <button
            className={tela === 'documentos' ? 'active' : ''}
            onClick={() => setTela('documentos')}
          >
            Documentos
          </button>

          <button
            className={tela === 'relatorios' ? 'active' : ''}
            onClick={() => setTela('relatorios')}
          >
            Relatórios
          </button>
        </div>

        <div className="totem-menu-area">
          <button
            className="totem-menu-button"
            onClick={() => setTela('totem')}
          >
            ◉ Abrir Totem de Ponto
          </button>
        </div>
      </aside>

      <main className="content">
        {tela === 'dashboard' && (
          <>
            <h1 className="page-title">Dashboard</h1>

            <div className="cards">
              <div className="card">
                <span>Funcionários ativos</span>
                <strong>{funcionariosAtivos}</strong>
              </div>

              <div className="card">
                <span>Pontos registrados hoje</span>
                <strong>{totalRegistrados}</strong>
              </div>

              <div className="card">
                <span>Aguardando pagamento</span>
                <strong>{pagamentosPendentes}</strong>
              </div>

              <div className="card">
                <span>Fechamentos pagos</span>
                <strong>{fechamentosPagos}</strong>
              </div>
            </div>

            <div className="panel">
              <h2>Resumo do dia</h2>
              <p>
                <span className="status-ok">
                  {totalRegistrados} funcionários
                </span>{' '}
                já registraram o ponto.
              </p>

              <p>
                <span className="status-warning">
                  {totalPendentes} funcionários
                </span>{' '}
                ainda estão pendentes.
              </p>
            </div>
          </>
        )}

        {tela === 'funcionarios' && (
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

            {mostrarFormulario && (
              <div className="panel form-panel">
                <div className="form-header">
                  <div>
                    <h2>Novo Funcionário</h2>
                    <p className="page-subtitle">
                      Preencha os dados pessoais, profissionais e financeiros.
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
                      placeholder="000.000.000-00"
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
                      placeholder="(19) 99999-9999"
                    />
                  </div>

                  <div className="form-group">
                    <label>E-mail</label>
                    <input
                      type="email"
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
                    <label>Valor da diária</label>
                    <input
                      value={novoFuncionario.diaria}
                      onChange={(e) =>
                        setNovoFuncionario({
                          ...novoFuncionario,
                          diaria: e.target.value,
                        })
                      }
                      placeholder="R$ 150,00"
                    />
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

                <h3 className="form-section-title">Dados para PIX</h3>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Tipo da chave PIX</label>

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
                    <label>Titular da conta</label>
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

                <h3 className="form-section-title">
                  Foto e reconhecimento facial
                </h3>

                <div className="biometric-box">
                  <div className="biometric-photo">
                    {novoFuncionario.foto ? (
                      <span>📷 Foto selecionada</span>
                    ) : (
                      <span>👤</span>
                    )}
                  </div>

                  <div className="biometric-info">
                    <strong>Foto do trabalhador</strong>

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

                    <button className="action-button" onClick={cadastrarFacial}>
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
                      setMostrarFormulario(false);
                      setNovoFuncionario(funcionarioVazio);
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

            {funcionarioSelecionado && (
              <div className="panel employee-profile-panel">
                <div className="form-header">
                  <div>
                    <h2>Ficha do Funcionário</h2>
                    <p className="page-subtitle">
                      Dados completos do trabalhador.
                    </p>
                  </div>

                  <button
                    className="close-button"
                    onClick={() => setFuncionarioSelecionado(null)}
                  >
                    ✕
                  </button>
                </div>

                <div className="employee-profile-header">
                  <div className="profile-avatar">
                    {funcionarioSelecionado.nome.charAt(0)}
                  </div>

                  <div>
                    <h2>{funcionarioSelecionado.nome}</h2>
                    <p>{funcionarioSelecionado.funcao}</p>

                    <span
                      className={
                        funcionarioSelecionado.status === 'Ativo'
                          ? 'employee-status active-status'
                          : 'employee-status inactive-status'
                      }
                    >
                      {funcionarioSelecionado.status}
                    </span>
                  </div>
                </div>

                <div className="profile-grid">
                  <div>
                    <span>CPF</span>
                    <strong>{funcionarioSelecionado.cpf}</strong>
                  </div>

                  <div>
                    <span>Nascimento</span>
                    <strong>{funcionarioSelecionado.nascimento || '-'}</strong>
                  </div>

                  <div>
                    <span>Telefone</span>
                    <strong>{funcionarioSelecionado.telefone || '-'}</strong>
                  </div>

                  <div>
                    <span>E-mail</span>
                    <strong>{funcionarioSelecionado.email || '-'}</strong>
                  </div>

                  <div>
                    <span>Endereço</span>
                    <strong>{funcionarioSelecionado.endereco || '-'}</strong>
                  </div>

                  <div>
                    <span>Admissão</span>
                    <strong>{funcionarioSelecionado.admissao || '-'}</strong>
                  </div>

                  <div>
                    <span>Função</span>
                    <strong>{funcionarioSelecionado.funcao}</strong>
                  </div>

                  <div>
                    <span>Valor da diária</span>
                    <strong>{funcionarioSelecionado.diaria}</strong>
                  </div>
                </div>

                <h3 className="form-section-title">Dados PIX</h3>

                <div className="profile-grid">
                  <div>
                    <span>Tipo da chave</span>
                    <strong>{funcionarioSelecionado.tipoPix || '-'}</strong>
                  </div>

                  <div>
                    <span>Chave PIX</span>
                    <strong>{funcionarioSelecionado.chavePix || '-'}</strong>
                  </div>

                  <div>
                    <span>Titular</span>
                    <strong>{funcionarioSelecionado.titularPix || '-'}</strong>
                  </div>
                </div>

                <h3 className="form-section-title">Biometria facial</h3>

                <span
                  className={
                    funcionarioSelecionado.facial === 'Cadastrado'
                      ? 'employee-status active-status'
                      : 'employee-status pending-status'
                  }
                >
                  {funcionarioSelecionado.facial}
                </span>
              </div>
            )}

            <div className="panel">
              <div className="table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Função</th>
                      <th>Diária</th>
                      <th>Facial</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {funcionarios.map((funcionario, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{funcionario.nome}</strong>
                        </td>

                        <td>{funcionario.cpf}</td>
                        <td>{funcionario.funcao}</td>
                        <td>{funcionario.diaria}</td>

                        <td>
                          <span
                            className={
                              funcionario.facial === 'Cadastrado'
                                ? 'employee-status active-status'
                                : 'employee-status pending-status'
                            }
                          >
                            {funcionario.facial}
                          </span>
                        </td>

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
                            onClick={() =>
                              setFuncionarioSelecionado(funcionario)
                            }
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

        {tela === 'ponto' && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Controle de Ponto</h1>
                <p className="page-subtitle">
                  Registros de entrada dos trabalhadores.
                </p>
              </div>
            </div>

            <div className="cards ponto-cards">
              <div className="card">
                <span>Registrados hoje</span>
                <strong>{totalRegistrados}</strong>
              </div>

              <div className="card">
                <span>Pendentes</span>
                <strong>{totalPendentes}</strong>
              </div>

              <div className="card">
                <span>Total previsto</span>
                <strong>{registrosPonto.length}</strong>
              </div>
            </div>

            <div className="panel">
              <div className="table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Funcionário</th>
                      <th>Função</th>
                      <th>Data</th>
                      <th>Entrada</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {registrosPonto.map((registro, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{registro.nome}</strong>
                        </td>
                        <td>{registro.funcao}</td>
                        <td>{registro.data}</td>
                        <td>{registro.horario}</td>
                        <td>{registro.status}</td>

                        <td>
                          {registro.status === 'Pendente' ? (
                            <button
                              className="action-button"
                              onClick={() => registrarPontoManual(index)}
                            >
                              Registrar manualmente
                            </button>
                          ) : (
                            <span className="registered-text">
                              Ponto confirmado
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tela === 'diarias' && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Diárias</h1>
                <p className="page-subtitle">Controle das diárias geradas.</p>
              </div>
            </div>

            <div className="cards diaria-cards">
              <div className="card">
                <span>Aprovadas</span>
                <strong>{totalDiariasAprovadas}</strong>
              </div>

              <div className="card">
                <span>Pendentes</span>
                <strong>{totalDiariasPendentes}</strong>
              </div>

              <div className="card">
                <span>Valor aprovado</span>
                <strong>
                  {valorTotalDiarias.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </div>
            </div>

            <div className="panel">
              <div className="table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Funcionário</th>
                      <th>Função</th>
                      <th>Data</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {diarias.map((diaria, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{diaria.nome}</strong>
                        </td>
                        <td>{diaria.funcao}</td>
                        <td>{diaria.data}</td>
                        <td>
                          {diaria.valor.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>
                        <td>{diaria.status}</td>

                        <td>
                          {diaria.status === 'Pendente' ? (
                            <button
                              className="action-button"
                              onClick={() => aprovarDiaria(index)}
                            >
                              Aprovar diária
                            </button>
                          ) : (
                            <span className="registered-text">
                              Diária aprovada
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tela === 'fechamentos' && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Fechamentos</h1>
                <p className="page-subtitle">
                  Controle dos fechamentos quinzenais.
                </p>
              </div>
            </div>

            <div className="cards fechamento-cards">
              <div className="card">
                <span>Em andamento</span>
                <strong>{fechamentosAbertos}</strong>
              </div>

              <div className="card">
                <span>Pagos</span>
                <strong>{fechamentosPagos}</strong>
              </div>

              <div className="card">
                <span>Valor previsto</span>
                <strong>
                  {totalPrevistoFechamentos.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </div>
            </div>

            <div className="rules-box">
              <strong>Regra de pagamento:</strong>
              <span>01 a 15 → pagamento dia 20.</span>
              <span>16 ao último dia → pagamento dia 05 do mês seguinte.</span>
            </div>

            <div className="panel">
              <div className="table-wrapper">
                <table className="employees-table">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Pagamento</th>
                      <th>Diárias</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {fechamentos.map((fechamento, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{fechamento.periodo}</strong>
                        </td>

                        <td>{fechamento.pagamento}</td>
                        <td>{fechamento.quantidadeDiarias}</td>

                        <td>
                          {fechamento.valorTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>

                        <td>{fechamento.status}</td>

                        <td>
                          {fechamento.status !== 'Pago' ? (
                            <button
                              className="action-button"
                              onClick={() => avancarFechamento(index)}
                            >
                              Avançar status
                            </button>
                          ) : (
                            <span className="registered-text">Concluído</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tela === 'pagamentos' && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Pagamentos</h1>
                <p className="page-subtitle">
                  Controle dos pagamentos via PIX.
                </p>
              </div>
            </div>

            <div className="cards pagamento-cards">
              <div className="card">
                <span>Aguardando pagamento</span>
                <strong>{pagamentosPendentes}</strong>
              </div>

              <div className="card">
                <span>Pagamentos concluídos</span>
                <strong>{pagamentosPagos}</strong>
              </div>

              <div className="card">
                <span>Valor pendente</span>
                <strong>
                  {valorPendentePagamentos.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </div>
            </div>

            <div className="panel">
              <div className="table-wrapper">
                <table className="employees-table">
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
                    {pagamentos.map((pagamento, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{pagamento.nome}</strong>
                        </td>
                        <td>{pagamento.periodo}</td>
                        <td>{pagamento.quantidadeDiarias}</td>

                        <td>
                          {pagamento.valorTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </td>

                        <td>{pagamento.pix}</td>
                        <td>{pagamento.status}</td>
                        <td>{pagamento.dataPagamento}</td>

                        <td>
                          {pagamento.status === 'Aguardando' ? (
                            <button
                              className="action-button"
                              onClick={() => marcarPagamentoComoPago(index)}
                            >
                              Marcar como pago
                            </button>
                          ) : (
                            <span className="registered-text">Concluído</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tela === 'documentos' && (
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

                  <button className="primary-button" onClick={salvarDocumento}>
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
                    {documentos.map((documento, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{documento.nome}</strong>
                        </td>
                        <td>{documento.funcionario}</td>
                        <td>{documento.tipo}</td>
                        <td>{documento.dataEnvio}</td>
                        <td>{documento.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tela === 'relatorios' && (
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

            <div className="report-period">
              <div>
                <strong>Período do relatório</strong>
                <span>01/08/2026 a 31/08/2026</span>
              </div>

              <span className="report-badge">Relatório mensal</span>
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
                <strong>
                  {valorTotalPago.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
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
                  <span>Valor já pago</span>
                  <strong className="report-success">
                    {valorTotalPago.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </strong>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
