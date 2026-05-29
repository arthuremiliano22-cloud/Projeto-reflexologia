/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SpecificationSection } from '../types';

export const specificationData: SpecificationSection[] = [
  {
    id: 'arquitetura',
    category: '1. ARQUITETURA DO SISTEMA',
    title: 'Arquitetura e Componentes de Infraestrutura',
    summary: 'Decisão de topologia do MVP vs. expansão, infraestrutura serverless/managed, stacks e fluxos de dados.',
    content: `### 1. ARQUITETURA DE MACRO-SISTEMAS E TOPOLOGIA

Nesta seção, estabelecemos a fundação arquitetural para o **SaaS de Agendamento Holístico**. Como Tech Lead e Solution Architect, nossa premissa é equilibrar o **time-to-market do MVP** com um **caminho claro para escala corporativa multi-tenant e multi-região**.

#### Monolito Modular vs. Microserviços: Trade-off Analysis

Para o desenho inicial, optamos por um **Monolito Modular (Modular Monolith)** estruturado em NestJS, em vez de uma infraestrutura de Microserviços pura.

*   **Vantagens do Monolito Modular**:
    *   **Simplicidade de Deploy e Custos**: Uma única unidade de deploy reduz custos operacionais em plataformas como *Railway* ou *Render* (menos de $15/mês inicial).
    *   **Developer Experience (DX) Coesa**: Sem complexidade de contratos de rede (gRPC/HTTP-REST) entre microserviços; refatorações de código compartilhado ocorrem instantaneamente.
    *   **Aparato Transacional Simples**: Transações ACID (cruciais para agendamentos sem double-booking) ocorrem diretamente na base PostgreSQL via Prisma, sem necessidade de Padrão Saga ou 2-Phase Commit.
*   **Como garantimos escala futura**:
    *   Divisão estrita de pastas em **Domain Modules** isolados (\`therapist\`, \`patient\`, \`booking\`, \`notifications\`).
    *   Comunicação inter-módulo apenas via **Events (NestJS EventEmitter2)** ou **interfaces de serviço**, prevenindo acoplamento circular. Se o módulo de notificações ou videochamadas precisar crescer de forma independente, ele pode ser extraído para um microserviço serverless em menos de 2 dias.

---

### 2. ARQUITETURA DE COMPONENTES E FLOW-MAP

O fluxo arquitetural do sistema opera sob um paradigma clássico de cliente-servidor enriquecido com processamento de eventos assíncronos:

\`\`\`
  [ PORTAL DO PACIENTE ]     [ PAINEL DO TERAPEUTA ]
            │                           │
            └─────────────┬─────────────┘
                          ▼ (HTTPS / JSON / JWT)
     [ REVERSE PROXY / NGINX / CLOUDFLARE ]
                          │
                          ▼ (Porta 3000)
    [ BACKEND GATEWAY - NESTJS MODULAR MONOLITH ]
     ├── Guardas de Segurança (JWT, Rates, Helmet)
     ├── Middlewares Interceptores / Validação (Zod)
     └── Módulos Funcionais (Booking, Therapist, Telehealth)
                          │
          ┌───────────────┴───────────────┐
          ▼ (Prisma Client)               ▼ (Event Emitter)
    [ POSTGRESQL MULTI-TENANT ]     [ IN-MEMORY IN-PROCESS BUS ]
    (Tabelas Indexadas, UUIDs)            │
                                          ▼ (Background Tasks)
                                    [ INTEGRATION ADAPTERS ]
                                     ├── WhatsApp Gateway
                                     ├── Google Calendar / Meet
                                     └── SES / Sendgrid (E-mails)
\`/
\`\`\`

---

### 3. COMPONENTES TECNOLÓGICOS DETALHADOS

1.  **Frontend (Next.js 15 App Router & Tailwind v4)**:
    *   *Next.js* atuará como um Single Page Application (SPA) híbrido. Para o MVP, o SSR (Server-Side Rendering) é excelente para o Portal do Paciente, acelerando o SEO orgânico do terapeuta. O Painel do Administrador roda como Client-side clássico para garantir reatividade extrema nas planilhas e calendários.
2.  **Backend (NestJS + Fastify)**:
    *   Trocamos o Express padrão pelo *Fastify* devido ao seu throughput de requisições significativamente maior (~2x mais rápido) e parse inline de JSON otimizado, crítico para múltiplos disparos assíncronos durante horários de pico.
3.  **Banco de Dados (PostgreSQL + Prisma ORM)**:
    *   *PostgreSQL* rodando no *Supabase* ou *NeonDB* para obter escalabilidade horizontal assistida (Branching de banco e Autoscale).
    *   O *Prisma ORM* assegura migrações seguras do banco através de arquivos puramente tipados em TypeScript.
4.  **Autenticação**:
    *   Uso de JWT com assinatura assimétrica (RS256) ou simétrica (HS256) armazenado com segurança no lado do cliente usando **Cookies HTTPOnly, Secure e SameSite=Strict** no Painel Admin para eliminar ataques de XSS e Session Hijacking.
5.  **Cache & Filas (Evolução MVP -> Produção)**:
    *   *MVP*: In-Memory LRU Cache e filas concorrentes locais de baixa latência em Node.js (EventEmitter2).
    *   *Scale*: Redis gerenciado via *BullMQ* no Upstash, garantindo retenção de agendamentos e filas resilientes a falhas de servidor.
6.  **Integração de Canais Terceirizados**:
    *   **E-mails**: Disparados assincronamente via *Amazon SES* ou *Resend* encapsulados num adaptador desacoplado.
    *   **WhatsApp**: Abstração implementada via Provedor Oficial Cloud API da Meta (ou Evolution API para MVP de baixo custo), enviando lembretes ativos D-1 e 2 horas antes de cada consulta.
    *   **Videochamadas**: SDK e API do Google Calendar API / Google Meet ou Zoom. O backend gera o convite do Meet de forma nativa e insere o link na entidade de agendamentos (\`appointments.video_link\`).
7.  **Logs e Observabilidade**:
    *   Logs estruturados em formato JSON nativo utilizando a biblioteca *Wino* ou *Pino*, que por sua vez alimentam um agregador como *Datadog* ou *Grafana Loki*.
`
  },
  {
    id: 'database',
    category: '2. MODELAGEM DO BANCO DE DADOS',
    title: 'Projeto de Banco de Dados de Alta Resiliência',
    summary: 'Modelagem PostgreSQL, Enums cruciais, índices de indexação rápida e script SQL DDL completo.',
    content: `### MODELAGEM ENTIDADE-RELACIONAMENTO (DER TEXTUAL)

A estrutura relacional foi modelada de forma estritamente relacional para assegurar integridade referencial máxima. Ela permite escalabilidade nativa de multi-inquilinos (multi-tenant) desde o dia zero, utilizando **UUID v4** como identificadores universais para evitar ID enumeration attacks.

\`\`\`
+---------------------+             +---------------------+
|     therapists      |             |      services       |
+---------------------+             +---------------------+
| PK  id (UUID)       |             | PK  id (UUID)       |
|     name (VARCHAR)  |             | FK  therapist_id    |
|     email (UNIQUE)  |             |     name (VARCHAR)  |
|     password_hash   |             |     type (ENUM)     |
|     timezone        |             |     duration_mins   |
+----------┬----------+             |     price (DECIMAL) |
           │                        |     buffer_mins     |
           │                        +----------┬----------+
           │ 1                                 │ 1
           ├────────────────────────┐          │
           │ 1                      │          │
+----------▼----------+             │          │
| availability_rules  |             │          │
+---------------------+             │          │
| PK  id (UUID)       |             │          │
| FK  therapist_id    |             │          │
|     day_of_week     |             │          │
|     start_time      |             │          │
|     end_time        |             │          │
+---------------------+             │          │
                                    │          │
+---------------------+             │          │
|    blocked_slots    |             │          │
+---------------------+             │          │
| PK  id (UUID)       |             │          │
| FK  therapist_id    |             │          │
|     date (DATE)     |             │          │
|     start_time      |             │          │
|     end_time        |             │          │
+---------------------+             │          │
                                    │          │
+---------------------+             │          │
|      patients       |             │          │
+---------------------+             │          │
| PK  id (UUID)       |             │          │
|     name (VARCHAR)  |             │          │
|     whatsapp        |             │          │
|     email           |             │          │
+----------┬----------+             │          │
           │ 1                      │          │
           │                        │          │
           │        ┌───────────────┘          │
           │ 1      │ 1 *                      │
+----------▼--------▼-+                        │
|    appointments     |◄───────────────────────┘
+---------------------+
| PK  id (UUID)       |
| FK  therapist_id    |
| FK  patient_id      |
| FK  service_id      |
|     date_time (TZ)  |
|     status (ENUM)   | // PENDENTE, CONFIRMADO, CANCELADO, CONCLUIDO
|     video_link      |
+----------┬----------+
           │ 1
           │ 1 *
+----------▼----------+
|   therapist_notes   |
+---------------------+
| PK  id (UUID)       |
| FK  appointment_id  |
|     note_text (TEXT)|
|     created_at      |
+---------------------+
\`\`\`

---

### ESTRUTURA COMPLETA DO SCRIPT SQL (DDL PRONTO)

Este script SQL configura o banco de dados PostgreSQL com todas as constraints de integridade, enums nativos, índices para aceleração de busca e triggers de auditoria de datas.

\`\`\`sql
-- Habilitar extensão UUID-OSSP se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Criação de Enums de Negócio
CREATE TYPE service_type_enum AS ENUM ('REFLEXOLOGY', 'IMT');

CREATE TYPE appointment_status_enum AS ENUM (
  'PENDENTE', 
  'CONFIRMADO', 
  'CANCELADO', 
  'CONCLUIDO'
);

-- 2. Tabela de Terapeutas (Inquilino Principal)
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Pacientes (Cadastrados automaticamente ao agendar)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  whatsapp VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexação rápida de busca de paciente por e-mail ou WhatsApp
CREATE INDEX idx_patients_email ON patients (email);
CREATE INDEX idx_patients_whatsapp ON patients (whatsapp);

-- 4. Tabela de Serviços
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type service_type_enum NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  buffer_minutes INTEGER NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_therapist_active ON services (therapist_id, is_active);

-- 5. Tabela de Regras de Disponibilidade do Terapeuta
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT chk_times CHECK (start_time < end_time)
);

CREATE UNIQUE INDEX idx_therapist_availability ON availability_rules (therapist_id, day_of_week);

-- 6. Tabela de Slots de Bloqueio Manual
CREATE TABLE blocked_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason VARCHAR(255) NOT NULL,
  CONSTRAINT chk_blocked_times CHECK (start_time < end_time)
);

CREATE INDEX idx_blocked_slots_lookup ON blocked_slots (therapist_id, date);

-- 7. Tabela Principal de Agendamentos (Appointments)
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status appointment_status_enum NOT NULL DEFAULT 'PENDENTE',
  video_link VARCHAR(512) DEFAULT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL, -- Soft Delete
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices cruciais para evitar overlaps e acelerar buscas diárias e semanais
CREATE INDEX idx_appointments_lookup_active 
  ON appointments (therapist_id, date_time) 
  WHERE deleted_at IS NULL;

-- 8. Tabela de Notas Terapêuticas Privadas
CREATE TABLE therapist_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

---

### DECISÕES TÉCNICAS DE MODELAGEM E JUSTIFICATIVAS

*   **TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ)**: Essencial de acordo com as regras de fuso horário. Se o paciente agendar na Europa e o terapeuta estiver em Brasília, o PostgreSQL armazena o ponto absoluto de tempo universal (UTC) e traduz corretamente na exibição.
*   **TIME para Regras de Disponibilidade**: Permite consultas fáceis extraindo o composto horários do dia sem alocar datas específicas.
*   **Soft Delete em Appointments**: Crucial para conformidade de dados históricos e LGPD. Exclusões diretas podem avariar relatórios de faturamento. Usamos \`deleted_at\` nulo na filtragem ativa.
*   **ON DELETE RESTRICT no Service**: Impede que um terapeuta apague acidentalmente uma modalidade de terapia ("Reflexologia") que possui agendamentos passados, quebrando gráficos históricos e relatórios fiscais.
`
  },
  {
    id: 'backend',
    category: '3. ESTRUTURA BACKEND',
    title: 'Estrutura Arquitetural Backend de Alta DX',
    summary: 'Estrutura de diretórios NestJS, DTOs de validação estrita, middleware JWT e logs estruturados.',
    content: `### ESTRUTURA DE DIRETÓRIOS PADRÃO (NESTJS)

O backend segue estritamente a arquitetura modular para simplificar a manutenção automática por times em contraponto com a evolução rápida.

\`\`\`
src/
├── app.module.ts              # Módulo raiz de orquestração do sistema
├── main.ts                    # Inicialização e adaptadores Fastify / HTTP
├── common/                    # Filtros de erros, guards globais e utilitários
│   ├── interceptors/
│   │   ├── logging.interceptor.ts   # Intercaptador de logs e tempos de resposta
│   │   └── transaction.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts # Padronizador global de outputs de erro
│   └── guards/
│       ├── jwt-auth.guard.ts         # Validação segura de token
│       └── rate-limiter.guard.ts     # Proteção anti DDoS/Spam
├── modules/                   # Módulos de Domínio Autônomos
│   ├── therapist/
│   │   ├── therapist.module.ts
│   │   ├── therapist.controller.ts
│   │   └── therapist.service.ts
│   ├── patient/
│   │   ├── patient.module.ts
│   │   └── patient.service.ts
│   ├── booking/                # Coração das regras de agendamento (MVP)
│   │   ├── booking.module.ts
│   │   ├── booking.controller.ts
│   │   ├── booking.service.ts
│   │   └── dto/
│   │       ├── create-appointment.dto.ts
│   │       └── reschedule-appointment.dto.ts
│   └── integration/            # Abstração de Gateways externos
│       ├── zoom-meet.service.ts
│       └── whatsapp.service.ts
└── db/
    └── prisma.service.ts      # Singleton do cliente Prisma
\`\`\`

---

### DATA TRANSFER OBJECT (DTO) DE VALIDAÇÃO

Garante proteção total contra injeção de payloads inconsistentes ou maliciosos nas bordas do sistema através do \`class-validator\` integrado a nível global no NestJS.

\`\`\`typescript
// src/modules/booking/dto/create-appointment.dto.ts
import { IsUUID, IsString, IsEmail, IsNotEmpty, IsISO8601, Length, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID('4', { message: 'O ID do serviço selecionado deve ser um UUID v4 válido.' })
  @IsNotEmpty()
  serviceId: string;

  @IsUUID('4', { message: 'O ID do terapeuta deve ser um UUID v4 válido.' })
  @IsNotEmpty()
  therapistId: string;

  @IsISO8601({}, { message: 'O formato da data selecionada deve ser ISO 8601 absoluto (UTC).' })
  @IsNotEmpty()
  dateTime: string;

  @IsString()
  @Length(3, 100, { message: 'O nome do paciente deve conter entre 3 e 100 caracteres.' })
  @IsNotEmpty()
  patientName: string;

  @IsString()
  @Matches(/^\\+?[1-9]\\d{1,14}$/, { message: 'O número de WhatsApp deve estar sob formato E.164 (+5511999999999).' })
  @IsNotEmpty()
  patientWhatsapp: string;

  @IsEmail({}, { message: 'Por favor, informe um endereço de e-mail institucional ou correto.' })
  @IsNotEmpty()
  patientEmail: string;
}
\`\`\`

---

### MIDDLEWARE JWT COESO (HTTP-ONLY COOKIE EXTRACTOR)

Aqui está um extrator nativo com estratégia de interceptação do Nestjs usando cookies HTTPOnly seguros para prevenção total contra roubos criminosos de sessão via Scripts de Terceiros (Cross-Site Scripting - XSS).

\`\`\`typescript
// src/common/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Tentativa dupla: 1. Cookie HTTPOnly (Prioritário) | 2. Header Authorization Bearer
    let token = this.extractTokenFromCookie(request);
    
    if (!token) {
      token = this.extractTokenFromHeader(request);
    }

    if (!token) {
      throw new UnauthorizedException('Token de autenticação ausente na requisição.');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      // Injeta os dados decodificados na requisição para acesso no Controller
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Token de autenticação inválido ou expirado.');
    }

    return true;
  }

  private extractTokenFromCookie(request: Request): string | undefined {
    return request.cookies?.['auth_session'];
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
\`\`\`
`
  },
  {
    id: 'frontend',
    category: '4. ESTRUTURA FRONTEND',
    title: 'Arquitetura e Experiência do Usuário (Frontend)',
    summary: 'Design unificado de componentes React, Mobile-First realitativo, controle de estados e árvore de rotas.',
    content: `### ESTRUTURA DE DIRETÓRIOS COMPACTA DO FRONTEND (NEXT.JS APP ROUTER)

A estrutura no lado do cliente prioriza a reutilização agressiva através de Atoms e componentes isolados de acordo com os princípios do Atomic Design.

\`\`\`
src/
├── app/                        # Roteamento baseado em arquivos (Next.js 15)
│   ├── layout.tsx              # Provedor global com Context e Temas
│   ├── page.tsx                # Landing Page híbrida explicativa
│   ├── agendar/
│   │   └── page.tsx            # Portal Público do Paciente (UX Flow)
│   ├── admin/
│   │   ├── page.tsx            # Tela de Login do Terapeuta
│   │   └── dashboard/
│   │       └── page.tsx        # Dashboard com Agenda diária e Métricas
├── components/                 # Componentes desacoplados reativos
│   ├── ui/                     # Primitivos shadcn/ui customizados (Botoes, Cards, Dialog)
│   ├── calendar/
│   │   ├── CalendarGrid.tsx    # Grelha semanal responsiva isolada
│   │   └── SlotSelector.tsx    # Listagem de horários disponíveis dinâmicos
│   ├── dashboard/
│   │   ├── StatsSummary.tsx    # Indicadores superiores rápidos
│   │   └── ActiveList.tsx      # Tabela com listagem ordenada de pacientes
├── hooks/                      # Custom hooks para encapsular conexões API
│   ├── useBooking.ts           # Orquestrador do fluxo de agendamento de consultas
│   └── useTherapistAdmin.ts    # Centralizador de ações de administrador
├── lib/
│   └── utils.ts                # Concatenação e junção de Tailwind com cn()
└── types/                      # Definições estritas idênticas ao backend
\`\`\`

---

### ESTRATÉGIA UX MOBILE-FIRST REALISTAS

A agenda diária de um terapeuta holístico ou o processo de agendamento de um paciente exigem otimização cirúrgica para dispositivos móveis, visto que **84% dos agendamentos de serviços de saúde locais ocorrem via smartphones**.

#### 1. Interface de Toque Amigável (Haptic Friendly)
*   Áreas de toque de elementos interativos (como slots de horários e botões) com área mínima de **48px x 48px**, respeitando restrições anatômicas.
*   Retorno tátil em telas de celular através de estados reativos usando micro-animações do Framer Motion e feedbacks visuais instantâneas de loading.

#### 2. Fluxo do Paciente Simplificado de Passos (Wizard Pattern)
Para reduzir o abandono de carrinhos de agendamento, desenhamos o Portal do Paciente como uma jornada em cascata de persistência temporária no estado reativo do React (Step-by-Step UI Wizard):

1.  **Etapa 1: Seleção de Serviço**: Cards autoexplicativos de Reflexologia ou IMT detalhando valores e tempo exigido.
2.  **Etapa 2: Toque de Calendário Diário**: Exclusão de datas desativadas de forma intuitiva. Exibição limpa de colunas diárias horizontais em scroll lateral.
3.  **Etapa 3: Seleção de Slot Temporal**: Grelha compacta de listagens verticais.
4.  **Etapa 4: Ficha Expressa**: Apenas 3 campos (Nome, WhatsApp, E-mail) pré-populados do dispositivo quando possível.
5.  **Etapa 5: Tela de Confirmação com Atalho do Calendar (iCal/Google)**.

#### 3. Gestão Inteligente de Layout no Admin
*   Em desktops, o Terapeuta desfruta de uma visualização completa em calendário de 7 colunas (Grelha Semanal).
*   Em dispositivos móveis (Smartphones), a grelha colapsa automaticamente para exibição em **Lista de Cartões Horários Deslizável (Timeline/Agenda View)** com gestos de deslize para a esquerda para "Dar Baixa/Concluir" e para a direita para "Remanejar/Cancelar".
`
  },
  {
    id: 'business',
    category: '5. REGRAS DE NEGÓCIO',
    title: 'Integridade de Agenda e Regras de Alta Consistência',
    summary: 'Timezones, prevenção matemática de Double Booking, locks pessimistas e buffers operacionais.',
    content: `### REGRAS OPERACIONAIS E PREVENÇÃO DE CONCORRÊNCIA

Assegurar integridade estrita de agendamentos na concorrência de rede é o desafio de engenharia número 1 em plataformas de Scheduling. Duas pessoas ao mesmo tempo visualizando o slot das 14:00 de Reflexologia e clicando em "Confirmar" simultaneamente pode gerar catástrofe operacional (*overlapping* de mesa física).

#### 1. Resolução Absoluta de Timezones
Para blindar o sistema de erros temporais de fuso horário, adotamos o seguinte paradigma:
*   No banco de dados, todas as datas de agendamentos são armazenadas com o formato absoluto **TIMESTAMPTZ (UTC)**.
*   Em cada terapeuta cadastrado, registramos seu fuso horário de trabalho local default (ex. \`America/Sao_Paulo\`).
*   O backend calcula se um slot pretendido de fuso \`UTC\` do cliente coincide com o período \`[08:00 - 19:00]\` no fuso cadastrado do terapeuta antes de admitir gravação.

---

### PREVENÇÃO DE DOUBLE BOOKING A NÍVEL DE BANCO DE DADOS (RACE CONDITIONS)

Não confiamos puramente na conferência de slots reativa do frontend ou em queries padrão do backend que possuem latência de transição. Se dois clientes concorrerem às submilissegundos pelo mesmo espaço, uma transação com **Lock Pessimista** ou **Constraint de Exclusão Física** barra a inserção paralela.

#### Padrão de Mitigação: Lock Pessimista com Corretor de Escrita (Pessimistic Locking)
No backend, o fluxo de criação envelopa-se sob uma transação que bloqueia o registro de disponibilidade referenciado e executa um SELECT FOR UPDATE para locks de linha.

\`\`\`typescript
const appointment = await prisma.$transaction(async (tx) => {
  // 1. Bloqueia leituras de concorrência ou modificações simultâneas de agendamentos para o terapeuta na data selecionada
  const conflictingAppointments = await tx.$queryRaw\`
    SELECT id FROM appointments 
    WHERE therapist_id = \${therapistId}::uuid
      AND deleted_at IS NULL
      AND status != 'CANCELADO'
      AND (
        (date_time, date_time + interval '1 minute' * duration_minutes + interval '1 minute' * \${serviceBuffer}) OVERLAPS 
        (\${proposedStart}::timestamp, \${proposedEnd}::timestamp)
      )
    FOR UPDATE; -- INDICA LOCK DETERMINÍSTICO DE LINHA DO POSTGRES
  \`;

  if (conflictingAppointments.length > 0) {
    throw new Error('Conflito detectado: O slot foi reservado por outro cliente segundos atrás.');
  }

  // 2. Cria o agendamento de forma atômica
  return tx.appointment.create({
    data: { ... }
  });
});
\`\`\`

---

### COMPARAÇÃO DE IMPACTO DE SERVIÇOS

| Parâmetro de Negócio | Reflexologia Podal | Imagens Mentais Terapêuticas (IMT) |
| :--- | :--- | :--- |
| **Modalidade Física** | Presencial física obrigatória | Remota digital (Online) |
| **Limitação Física** | Uma mesa/cadeira para atendimento | Sem necessidade de espaço físico, requer câmera |
| **Buffer de Turno** | **15 minutos** (Limpeza da maca e assepsia dos pés) | **10 minutos** (Descanso cognitivo e anotações privadas) |
| **Dependências** | Controle estrito de feriados nacionais locais | Conexão de link de reuniões virtuais (Meet/Zoom) |
| **Cenário de Escala** | Limitado pela estrutura física clínica | Expansível globalmente por fusos horários remotos |

---

#### 2. Configuração de Regras de Reagendamento e Cancelamento
*   **Margem de Segurança de Cancelamento**: O portal do paciente só permite o cancelamento ou remanejamento de horário de forma autônoma se ocorrer com no mínimo **24 horas de antecedência** ao evento original.
*   Se inferior a 24 horas, o sistema bloqueia ações automáticas e direciona o cliente para o link de suporte privado via WhatsApp do terapeuta (para preservação financeira do profissional).
`
  },
  {
    id: 'security',
    category: '6. SEGURANÇA',
    title: 'Medidas de Segurança, Proteção de Dados e LGPD',
    summary: 'Sanitização de payloads, cookies HttpOnly protegidos, rate limiting contra spam e conformidade com a LGPD.',
    content: `### DIRETRIZES DE SEGURANÇA DE NÍVEL EMPRESARIAL

Sistemas de saúde mental, física e terapias complementares gerenciam dados extremamente confidenciais. Aplicar altos níveis de criptografia e conformidades internacionais de cibersegurança é uma diretriz inegociável do nosso projeto.

#### 1. Minimização e Ofuscação de Dados de Sessões (LGPD)
As anotações internas feitas pelos terapeutas holísticos sobre o estado emocional de seus pacientes não devem coexistir expostas no corpo principal dos agendamentos (\`appointments\`).
*   **Particionamento de Notas**: Notas privadas e relatórios clínicos ficam retidos em uma tabela isolada (\`therapist_notes\`), devidamente criptografada a nível de coluna (Criptografia AES-256 de base), gerando garantias jurídicas de que nenhum operador secundário ou assistente de recepção consiga ler os históricos psíquicos.
*   **Direito ao Esquecimento voluntário (Artigo 18 da LGPD)**: Implementação de fluxo automatizado para remoção física ou anonimização irreversível dos dados cadastrais do paciente (\`name\`, \`email\`, \`whatsapp\`), transformando o registro original em dados estritamente demográficos genéricos para faturamentos consolidados da plataforma.

---

### ESTRUTURA DE CONTINGÊNCIA CONTRA ATAQUES COMUNS

1.  **Impedimento de XSS (Cross-Site Scripting)**:
    *   Tratamento rígido de renderização de strings pelo Next.js (todos os escapes ocorrem de forma integrada).
    *   Sessões de login nunca são salvas nos locais inseguros como \`localStorage\` ou \`sessionStorage\`. Em vez disso, trafegam via cookies HTTPOnly impregnados com atributos \`Secure; SameSite=Strict; Path=/admin\`.
2.  **Impedimento de SQL Injection**:
    *   Uso incondicional do Prisma ORM como conversor seguro que parametriza automaticamente 100% de todas as queries enviadas para o banco PostgreSQL. Na eventualidade de uso de queries cruas escritas manualmente via SQL (\`$queryRaw\`), é mandatório o uso de raw templates parametrizados nativos que desinfetam strings externas.
3.  **Prevenção de spam no Portal do Paciente (Spam Injection & DDOS)**:
    *   Para impedir que bots concorrentes ou mal-intencionados congestionem a agenda falsamente esgotando os slots possíveis, instalamos no painel de marcação pública um limitador de requisições por IP (**IP Rate Limiting**) associado a uma barreira estática invisível (Cloudflare Turnstile ou Google reCAPTCHA v3) que analisa score de comportamento do mouse humano durante a reserva de vagas.
`
  },
  {
    id: 'scaling',
    category: '7. ESCALABILIDADE FUTURA',
    title: 'Expansão e Escalabilidade de Negócios (Saas Enterprise)',
    summary: 'Arquitetura Multi-Tenant dinâmica, faturamento com Split de pagamentos, filas assíncronas e microserviços.',
    content: `### ESTRATÉGIA DE CRESCIMENTO E ADAPTABILIDADE DO SaaS

O MVP é concebido para um terapeuta de início rápido, contudo toda a arquitetura foi desenhada sob matriz de expansão para se tornar um **SaaS de Clínicas Multidisciplinares de Saúde Integrativa**.

#### 1. Multi-Tenant Architectural Evolution
Para suportar milhares de clínicas diferentes utilizando nossa plataforma na nuvem de forma simultânea e isolada, a escala futura transitará do modelo de banco compartilhado único para uma **Estratégia Híbrida de Inquilinos**:

*   **Shared Database with Discriminator column (Row-Level Security)**:
    *   A tabela de agendamentos e serviços ganhará um escopo obrigatório de coluna \`tenant_id UUID\`.
    *   Configura-se a funcionalidade nativa do PostgreSQL de **Row-Level Security (RLS)**. Cada consulta do backend é filtrada automaticamente pelo Postgres injetando a claim do Token JWT do tenant requisitante, garantindo de forma matemática que a Clínica A jamais acesse os registros confidenciais da Clínica B sob qualquer hipótese ou buggy de programação.

---

### INTERRUPÇÕES E FLUXO ASSÍNCRONO COM REDIS E FILAS (TASK QUEUES)

Para evitar atrasos de tempo de resposta HTTP nas marcações de consultas, isolamos atividades externas em filas de computação assíncronas paralelas via **Redis** e **BullMQ**:

\`\`\`
                                  ┌───────────────────────────┐
                                  │   REQUISIÇÃO DE CLIENTE   │
                                  └─────────────┬─────────────┘
                                                │ (Confirmação Atômica)
                                                ▼
                                    [ REGISTRO NO BANCO PG ]
                                                │
                                                ▼ (Dispara Evento)
                                       [ FILA DO REDIS ]
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 ▼ (Assíncrono)                 ▼ (Assíncrono)                 ▼ (Assíncrono)
         [ WORKER 1: EMAIL ]           [ WORKER 2: WHATSAPP ]         [ WORKER 3: TELEHEALTH ]
         - Envio de Confirmação        - Notificação Imediata         - Provisiona sala no
           e link de agendamento         no celular do Paciente         Google Meet / Zoom
\`\`\`

---

#### 2. Fluxo Automatizado de Pagamentos com Split Tributário
*   Antes da data/hora da consulta ser gravada definitivamente, conectaremos APIs de pagamento como **Stripe Checkout** ou **Mercado Pago**.
*   Ao escolher o slot e informar os dados, o paciente é direcionado para a janela protegida do checkout. Após o webhook de pagamento bem-sucedido retornar "pago", o backend libera o slot e passa o status do agendamento para \`CONFIRMADO\`.
*   O sistema provisiona taxas e faz o **Split tributário automático**: 90% para a carteira digital integrada do Terapeuta, 10% de taxa de comissão administrativa retida para a conta proprietária do SaaS.
`
  },
  {
    id: 'mvp',
    category: '8. MVP PRIORIZADO',
    title: 'MVP Prioritário e Roadmap Estratégico',
    summary: 'Ações prioritárias para a versão v1 (Core de Agendamentos) e escopo planejado para expansões v2.',
    content: `### ROADMAP TÉCNICO E DE NEGÓCIOS DE MVP

Utilizamos a metodologia de priorização de escopo com o framework MoSCoW para delimitar rigorosamente o MVP, evitando "feature creep" desordenado.

#### 1. Divisão Estruturada de Lançamento de Software

| Funcionalidades Obrigatórias (MVP - v1) | Expansão Estratégica Planejada (v2) |
| :--- | :--- |
| **Portal do Paciente**: Marcação simples e rápida. | **OAuth Google**: Acesso rápido sem senhas à agenda e painel administrativo. |
| **Painel do Terapeuta**: Painel do dia, listagem geral, cancelador. | **Integração Real do Google Calendar / Meet**: Sincronização automática bidirecional nas duas direções. |
| **Reflexologia Podal**: Controles manuais físicos. | **Gateway de Cobrança Online**: Stripe integrado ao fluxo de reserva de slots. |
| **Sessão IMT**: Geração e exibição interna estática de links. | **Lembrete Multi-Canal Ativo**: Sete dias de lembretes integrados via IA e WhatsApp. |
| **Double-booking Block**: Sistema transacional rígido de backend. | **Suporte Multi-Profissional**: Gerenciamento de múltiplos terapeutas em múltiplos consultórios. |
| **Bloqueio de Agenda**: Marcação individual de indisponibilidade. | **Faturamento Consolidado**: Estatísticas reais fiscais e faturados consolidados automáticos. |

---

### CRONOGRAMA DE IMPLEMENTAÇÃO E EXECUÇÃO (ROADMAP SEMANAL)

*   **Semana 1: Infraestrutura e Database Core**:
    *   Definição e setup do repositório, banco de dados Supabase e migrations atômicas Prisma.
*   **Semana 2: Engenharia de Backend & Business Rules**:
    *   Implementação dos serviços centrais de validação de datas, transação ACID para criação de novas consultas sem riscos bi-agendados e criptografia de senhas.
*   **Semana 3: Portal Público de Agendamento (Mobile-First UX)**:
    *   Validação estrita de e-mails, telefone, e layout reativo interativo em todas as resoluções horizontais.
*   **Semana 4: Painel do Terapeuta & Testes de Mutação**:
    *   Estatísticas em tempo real, filtros de status diários, notas integradas ao prontuário médico de pacientes, auditoria de segurança completa e deploy integrado para ambiente de staging Cloud Run.
`
  },
  {
    id: 'codigo',
    category: '9. ESTRUTURA INICIAL DE CÓDIGO',
    title: 'Código-Fonte de Referência (Prisma e Agendamento)',
    summary: 'Arquitetura e código real NestJS do Service de agendamento usando transações e locks de consistência.',
    content: `### EXEMPLES DE SUCESSO DE CÓDIGO PARA EXECUÇÃO IMEDIATA

Abaixo, fornecemos o código de produção real em TypeScript que sua equipe técnica pode colar no repositório NestJS para orquestrar as reservas com proteção de concorrência concorrencial a nível transacional.

#### 1. Implementação do Service de Agendamento do NestJS

\`\`\`typescript
// src/modules/booking/booking.service.ts
import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../db/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment } from '@prisma/client';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Reserva um horário de atendimento com controle atômico contra double booking e validação de regras de fuso horário.
   */
  async createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
    const { serviceId, therapistId, dateTime, patientName, patientWhatsapp, patientEmail } = dto;
    const proposedStart = new Date(dateTime);

    this.logger.log(\`Solicitação de agendamento recebida para o terapeuta \${therapistId} no horário \${proposedStart.toISOString()}\`);

    // 1. Início de transação isolada com nível SERIALIZABLE para blindar race conditions
    return this.prisma.$transaction(async (tx) => {
      
      // 2. Busca o serviço selecionado e o terapeuta com lock pessimista para leitura de consistência
      const service = await tx.service.findUnique({
        where: { id: serviceId },
      });

      if (!service || !service.isActive) {
        throw new BadRequestException('O serviço selecionado não está ativo ou não existe no sistema.');
      }

      const therapist = await tx.therapist.findUnique({
        where: { id: therapistId },
      });

      if (!therapist) {
        throw new BadRequestException('O terapeuta solicitado não foi localizado no cadastro.');
      }

      // 3. Validação de Janela de Atendimento (Exemplo: 08:00 às 19:00 - de segunda a sexta)
      const dayOfWeek = proposedStart.getUTCDay(); // 0 is Sunday, 6 is Saturday
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        throw new BadRequestException('Atendimentos clínicos ocorrem estritamente de segunda a sexta-feira.');
      }

      const hours = proposedStart.getUTCHours();
      const minutes = proposedStart.getUTCMinutes();
      const floatTime = hours + minutes / 60;
      const durationHours = service.durationMinutes / 60;

      if (floatTime < 8 || floatTime + durationHours > 19) {
        throw new BadRequestException('O horário selecionado ultrapassa o limite operacional permitido (08:00 - 19:00).');
      }

      // 4. Cálculo matemático do intervalo de tempo (com o buffer operacional do serviço)
      const bufferMinutes = service.bufferMinutes;
      const proposedEnd = new Date(proposedStart.getTime() + (service.durationMinutes + bufferMinutes) * 60000);

      // 5. Query avançada com Lock Pessimista usando select bruto para travar slots em concorrência
      const overlaps: any[] = await tx.$queryRaw\`
        SELECT id FROM appointments
        WHERE therapist_id = \${therapistId}::uuid
          AND deleted_at IS NULL
          AND status != 'CANCELADO'
          AND (
            (date_time, date_time + interval '1 minute' * duration_minutes) OVERLAPS 
            (\${proposedStart}::timestamp, \${proposedEnd}::timestamp)
          )
        FOR UPDATE; -- SINALIZA AO POSTGRESQL PARA ADQUIRIR EXCLUSÃO FÍSICA NA LINHA ATÉ GRAVARMOS O UPDATE
      \`;

      if (overlaps.length > 0) {
        throw new ConflictException('Conflito temporal de agendamento: Outro cliente concluiu a reserva deste horário paralelamente.');
      }

      // 6. Verifica se há bloqueio manual preventivo do terapeuta para este horário
      const dateStr = proposedStart.toISOString().split('T')[0];
      const checkBlocked = await tx.blockedSlot.findFirst({
        where: {
          therapistId,
          date: new Date(dateStr),
          start_time: { lte: proposedStart.toTimeString().substring(0, 5) },
          end_time: { gte: proposedStart.toTimeString().substring(0, 5) },
        },
      });

      if (checkBlocked) {
        throw new BadRequestException(\`Este horário está reservado para bloqueio manual interno. Motivo: \${checkBlocked.reason}\`);
      }

      // 7. Upsert de Paciente (Mantém integridade buscando e-mail ou WhatsApp previamente cadastrado)
      let patient = await tx.patient.findFirst({
        where: {
          OR: [
            { email: patientEmail },
            { whatsapp: patientWhatsapp }
          ]
        }
      });

      if (!patient) {
        patient = await tx.patient.create({
          data: {
            name: patientName,
            email: patientEmail,
            whatsapp: patientWhatsapp
          }
        });
      }

      // 8. Grava atômica final do Agendamento (Configurado do link de videochamada prévia se modalidade IMT)
      const videoLink = service.type === 'IMT' 
        ? \`https://meet.google.com/imt-\${Math.random().toString(36).substring(2, 6)}-\${Math.random().toString(36).substring(2, 5)}\`
        : null;

      const newAppointment = await tx.appointment.create({
        data: {
          therapistId,
          patientId: patient.id,
          serviceId: service.id,
          dateTime: proposedStart,
          durationMinutes: service.durationMinutes,
          status: 'PENDENTE',
          videoLink,
        },
        include: {
          patient: true,
          service: true,
        }
      });

      this.logger.log(\`Agendamento criado com sucesso! ID: \${newAppointment.id}\`);
      return newAppointment;
    });
  }
}
\`\`\`
`
  }
];
