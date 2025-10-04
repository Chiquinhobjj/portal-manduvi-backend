# 📋 ESPECIFICAÇÕES TÉCNICAS - PORTAL MANDUVI BACKEND

## 🎯 Visão Geral

O Portal Manduvi Backend é uma plataforma de backend-as-a-service construída com Supabase, oferecendo gestão de conteúdo, análise de dados e inteligência artificial para organizações sociais e ambientais.

---

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Database**: PostgreSQL 15+ com extensões pgvector e uuid-ossp
- **Runtime**: Deno para Edge Functions
- **AI/ML**: OpenAI API (text-embedding-3-small, gpt-4o-mini)
- **Client**: @supabase/supabase-js v2.39.0+

### Especificações de Infraestrutura

#### Supabase
- **Plano**: Pro (recomendado para produção)
- **Região**: us-east-1 (ou mais próxima ao usuário)
- **Storage**: 100GB+ para assets de mídia
- **Bandwidth**: 250GB+ por mês
- **Database**: 8GB+ RAM, 2+ vCPUs

#### PostgreSQL
- **Versão**: 15+
- **Extensões**:
  - `pgvector` v0.5.1+ (embeddings)
  - `uuid-ossp` v1.1+ (UUIDs)
  - `pgcrypto` v1.3+ (criptografia)
  - `pg_trgm` (busca de texto)
  - `unaccent` (normalização de texto)

---

## 🗄️ Especificações do Banco de Dados

### Tabelas Principais

#### 1. Sistema de Conteúdo (CMS)

```sql
-- Tabela principal de conteúdo
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,                    -- FK para organizações
  type TEXT NOT NULL CHECK (type IN (
    'page', 'post', 'project_story', 'dataset', 'press'
  )),
  slug TEXT NOT NULL,                      -- URL amigável
  title TEXT NOT NULL,                     -- Título do conteúdo
  excerpt TEXT,                            -- Resumo/descrição curta
  body TEXT,                               -- Conteúdo principal (Markdown/HTML)
  cover_url TEXT,                          -- URL da imagem de capa
  published_at TIMESTAMPTZ,                -- Data de publicação
  is_public BOOLEAN DEFAULT true NOT NULL, -- Visibilidade pública
  created_by UUID REFERENCES auth.users(id), -- Autor
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (org_id, slug)                    -- Slug único por organização
);

-- Índices de performance
CREATE INDEX idx_content_items_org_type_pub 
ON content_items(org_id, type, is_public, published_at DESC);

CREATE INDEX idx_content_items_title_trgm 
ON content_items USING gin(title gin_trgm_ops);
```

#### 2. Sistema de Tags

```sql
-- Tags de conteúdo
CREATE TABLE content_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,                      -- Nome da tag
  slug TEXT NOT NULL,                      -- Slug da tag
  UNIQUE (org_id, slug)
);

-- Relacionamento many-to-many
CREATE TABLE content_item_tags (
  item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);
```

#### 3. Sistema de Mídia

```sql
-- Assets de mídia
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  url TEXT NOT NULL,                       -- URL do asset
  mime TEXT,                               -- Tipo MIME
  meta JSONB,                              -- Metadados adicionais
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

#### 4. Sistema de Usuários e Papéis

```sql
-- Perfis de usuários
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID,                             -- Organização preferida
  full_name TEXT,                          -- Nome completo
  avatar_url TEXT,                         -- URL do avatar
  locale TEXT DEFAULT 'pt-BR',             -- Idioma preferido
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Papéis do sistema
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,               -- Código do papel
  name TEXT NOT NULL                       -- Nome do papel
);

-- Atribuições de papéis
CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,                    -- Organização
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, org_id, role_id)        -- Um papel por usuário/org
);
```

#### 5. Sistema de IA

```sql
-- Embeddings vector
CREATE TABLE ai_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  content TEXT NOT NULL,                   -- Conteúdo do chunk
  embedding vector(1536) NOT NULL,         -- Embedding vector
  model TEXT DEFAULT 'text-embedding-3-small',
  dim INT DEFAULT 1536,                    -- Dimensões do embedding
  chunk_id TEXT,                           -- ID do chunk
  chunk_ix INT,                            -- Índice do chunk
  source_table TEXT,                       -- Tabela de origem
  source_field TEXT,                       -- Campo de origem
  source_record_id UUID,                   -- ID do registro de origem
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índice de similaridade
CREATE INDEX ai_embeddings_embedding_ivfflat
ON ai_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Tarefas de IA
CREATE TABLE ai_agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  prompt TEXT NOT NULL,                    -- Prompt da tarefa
  status ai_task_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Execuções de tarefas
CREATE TABLE ai_agent_task_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_agent_tasks(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status ai_task_status DEFAULT 'in_progress' NOT NULL,
  logs TEXT,                               -- Logs da execução
  result JSONB                             -- Resultado da tarefa
);

-- Enum para status de tarefas
CREATE TYPE ai_task_status AS ENUM (
  'pending', 'in_progress', 'completed', 'failed', 'cancelled'
);
```

#### 6. Sistema de Auditoria e LGPD

```sql
-- Log de auditoria
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID,                             -- Organização
  table_name TEXT NOT NULL,                -- Tabela afetada
  row_pk TEXT NOT NULL,                    -- Chave primária do registro
  action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  actor_user_id UUID REFERENCES auth.users(id), -- Usuário que executou
  diff JSONB,                              -- Diferenças (old/new)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Consentimentos LGPD
CREATE TABLE data_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('beneficiary','user')),
  subject_id UUID NOT NULL,                -- ID do sujeito
  purpose TEXT NOT NULL,                   -- Finalidade do consentimento
  granted BOOLEAN NOT NULL,                -- Consentimento concedido
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  revoked_at TIMESTAMPTZ                   -- Data de revogação
);

-- Logs de acesso a PII
CREATE TABLE pii_access_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES auth.users(id),
  org_id UUID,
  subject_type TEXT NOT NULL,              -- Tipo do sujeito
  subject_id UUID NOT NULL,                -- ID do sujeito
  action TEXT NOT NULL,                    -- Ação executada
  reason TEXT,                             -- Motivo do acesso
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
```

---

## ⚡ Edge Functions

### 1. generate-embeddings

**Arquivo**: `supabase/functions/generate-embeddings/index.ts`

**Dependências**:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from "https://deno.land/x/openai/mod.ts"
```

**Variáveis de Ambiente**:
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço
- `OPENAI_API_KEY`: Chave da API OpenAI

**Input Schema**:
```typescript
interface EmbeddingRequest {
  record: {
    id: string
    org_id: string
    body: string
    title?: string
    excerpt?: string
  }
}
```

**Output Schema**:
```typescript
interface EmbeddingResponse {
  message: string  // "Generated X embeddings."
  embeddings?: number[][]
}
```

**Funcionalidades**:
- Chunking de texto (500 chars, overlap 50)
- Geração de embeddings via OpenAI
- Limpeza de embeddings antigos
- Armazenamento otimizado

### 2. process-task-run

**Arquivo**: `supabase/functions/process-task-run/index.ts`

**Tipos de Tarefas**:
- `analyze_articles`: Análise de artigos
- `generate_summaries`: Geração de resumos
- `extract_insights`: Extração de insights
- `categorize_content`: Categorização
- `sentiment_analysis`: Análise de sentimento

**Input Schema**:
```typescript
interface TaskRunRequest {
  task_type: string
  parameters: {
    table_name?: string
    record_ids?: string[]
    filters?: Record<string, any>
    options?: Record<string, any>
  }
  priority?: 'low' | 'normal' | 'high'
}
```

**Output Schema**:
```typescript
interface TaskRunResponse {
  success: boolean
  task_id?: string
  results?: any
  error?: string
  status?: 'pending' | 'processing' | 'completed' | 'failed'
}
```

---

## 🔐 Sistema de Segurança

### Row Level Security (RLS)

#### Políticas por Tabela

**content_items**:
```sql
-- Visitantes veem apenas conteúdo público
CREATE POLICY "Public can view public content"
ON content_items FOR SELECT USING (is_public = true);

-- Usuários veem conteúdo da sua organização
CREATE POLICY "Users can view content from their own org"
ON content_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM role_assignments
    WHERE user_id = auth.uid() AND org_id = content_items.org_id
  )
);

-- Editores/Admins gerenciam conteúdo
CREATE POLICY "Editors and Admins can manage content in their org"
ON content_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM role_assignments ra
    JOIN roles r ON r.id = ra.role_id
    WHERE ra.user_id = auth.uid()
      AND ra.org_id = content_items.org_id
      AND r.code IN ('editor', 'admin')
  )
);
```

**role_assignments** (Segurança Máxima):
```sql
-- Apenas admins gerenciam papéis
CREATE POLICY "Admins can manage role assignments in their org"
ON role_assignments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM role_assignments ra
    JOIN roles r ON r.id = ra.role_id
    WHERE ra.user_id = auth.uid()
      AND ra.org_id = role_assignments.org_id
      AND r.code = 'admin'
  )
);
```

### Isolamento por Organização

Todas as políticas implementam isolamento baseado em `org_id`:

```sql
-- Função auxiliar para verificar acesso à organização
CREATE OR REPLACE FUNCTION public.user_has_org_access(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM role_assignments
    WHERE user_id = auth.uid() AND role_assignments.org_id = user_has_org_access.org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🤖 Sistema de IA

### Geração de Embeddings

#### Chunking Inteligente
```typescript
function chunkText(text: string, size = 500, overlap = 50): string[] {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    chunks.push(text.slice(i, end));
    i += size - overlap;
  }
  return chunks;
}
```

#### Integração OpenAI
```typescript
const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY")! });

const embeddingResponse = await openai.createEmbeddings({
  model: 'text-embedding-3-small',
  input: chunk,
});

const [embedding] = embeddingResponse.data;
```

### Busca Semântica

#### Função SQL
```sql
CREATE OR REPLACE FUNCTION public.semantic_search(
  query_text TEXT,
  org_id_param UUID,
  similarity_threshold FLOAT DEFAULT 0.7,
  limit_results INT DEFAULT 10
)
RETURNS TABLE (
  content_item_id UUID,
  title TEXT,
  excerpt TEXT,
  similarity FLOAT,
  chunk_content TEXT,
  published_at TIMESTAMPTZ
) AS $$
-- Implementação da busca semântica
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Uso
```sql
SELECT * FROM semantic_search(
  'sustentabilidade ambiental',
  'uuid-da-organizacao',
  0.7,  -- threshold de similaridade
  10    -- limite de resultados
);
```

---

## 📊 APIs e Endpoints

### REST API (Auto-gerada pelo Supabase)

#### Content Management
```
GET    /rest/v1/content_items?select=*&org_id=eq.{org_id}
POST   /rest/v1/content_items
PATCH  /rest/v1/content_items?id=eq.{id}
DELETE /rest/v1/content_items?id=eq.{id}

GET    /rest/v1/content_tags?select=*&org_id=eq.{org_id}
POST   /rest/v1/content_tags
PATCH  /rest/v1/content_tags?id=eq.{id}
DELETE /rest/v1/content_tags?id=eq.{id}
```

#### User Management
```
GET    /rest/v1/profiles?select=*&user_id=eq.{user_id}
POST   /rest/v1/profiles
PATCH  /rest/v1/profiles?user_id=eq.{user_id}
DELETE /rest/v1/profiles?user_id=eq.{user_id}

GET    /rest/v1/roles?select=*
GET    /rest/v1/role_assignments?select=*&org_id=eq.{org_id}
POST   /rest/v1/role_assignments
DELETE /rest/v1/role_assignments?id=eq.{id}
```

### GraphQL API (Auto-gerada pelo Supabase)

```graphql
query GetContentItems($orgId: UUID!, $isPublic: Boolean) {
  content_items(
    where: { 
      org_id: { eq: $orgId }
      is_public: { eq: $isPublic }
    }
    order_by: { published_at: desc }
  ) {
    id
    title
    excerpt
    published_at
    content_tags {
      tag {
        name
        slug
      }
    }
  }
}

mutation CreateContentItem($input: content_items_insert_input!) {
  insert_content_items_one(object: $input) {
    id
    title
    slug
    created_at
  }
}
```

### Edge Functions

```
POST /functions/v1/generate-embeddings
Content-Type: application/json
Authorization: Bearer {anon_key}

{
  "record": {
    "id": "uuid",
    "org_id": "uuid",
    "body": "content text",
    "title": "title",
    "excerpt": "excerpt"
  }
}

POST /functions/v1/process-task-run
Content-Type: application/json
Authorization: Bearer {anon_key}

{
  "task_type": "analyze_articles",
  "parameters": {
    "table_name": "content_items",
    "filters": {
      "org_id": "uuid",
      "limit": 10
    }
  },
  "priority": "normal"
}
```

---

## 🔧 Scripts de Verificação

### 1. verify_schema.mjs

**Dependências**: `@supabase/supabase-js`, `dotenv`

**Funcionalidades**:
- Lista todas as tabelas do schema public
- Verifica extensões PostgreSQL ativas
- Lista funções personalizadas
- Valida políticas RLS configuradas
- Verifica tabelas principais do Portal Manduvi

**Uso**:
```bash
npm run verify-schema
```

### 2. verify_rls.mjs

**Funcionalidades**:
- Testa acesso anônimo (apenas conteúdo público)
- Testa bloqueio de escrita não autorizada
- Testa políticas por organização
- Valida isolamento de dados entre organizações

**Uso**:
```bash
npm run verify-rls
```

### 3. verify_function.mjs

**Funcionalidades**:
- Testa disponibilidade da Edge Function
- Testa invocação com dados de exemplo
- Testa geração de embeddings
- Testa diferentes tipos de conteúdo

**Uso**:
```bash
npm run verify-function
```

---

## 📈 Performance e Escalabilidade

### Otimizações de Banco

#### Índices
```sql
-- Índice de similaridade para embeddings
CREATE INDEX ai_embeddings_embedding_ivfflat
ON ai_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índices de performance
CREATE INDEX idx_content_items_org_type_pub 
ON content_items(org_id, type, is_public, published_at DESC);

CREATE INDEX idx_content_items_title_trgm 
ON content_items USING gin(title gin_trgm_ops);

CREATE INDEX idx_ai_embeddings_org_source 
ON ai_embeddings(org_id, source_table, source_record_id);
```

#### Configurações PostgreSQL
```sql
-- Configurações recomendadas
shared_preload_libraries = 'vector'
max_connections = 100
shared_buffers = '256MB'
effective_cache_size = '1GB'
work_mem = '4MB'
maintenance_work_mem = '64MB'
```

### Otimizações de Edge Functions

#### Rate Limiting
- **OpenAI API**: 3000 requests/minuto
- **Supabase**: 100 requests/segundo
- **Chunking**: Máximo 10 chunks por documento

#### Caching
- **Embeddings**: Cache de 24h para conteúdo não modificado
- **Busca**: Cache de 1h para consultas frequentes
- **Funções**: Cache de 5min para resultados idênticos

---

## 🔍 Monitoramento

### Métricas de Aplicação

#### Performance
- **API Response Time**: < 200ms (p95)
- **Database Query Time**: < 100ms (p95)
- **Edge Function Execution**: < 5s (p95)
- **Embedding Generation**: < 2s por chunk

#### Uso
- **Requests/minuto**: Monitorar por endpoint
- **Usuários ativos**: Por organização
- **Conteúdo criado**: Por dia/semana
- **Busca semântica**: Queries por minuto

### Alertas

#### Críticos
- **Error Rate**: > 5% por 5 minutos
- **Response Time**: > 1s por 5 minutos
- **Database Connections**: > 80% da capacidade
- **OpenAI API**: Rate limit excedido

#### Avisos
- **Memory Usage**: > 80% da capacidade
- **Disk Space**: > 85% da capacidade
- **Failed Logins**: > 10 por minuto
- **RLS Violations**: Tentativas de acesso não autorizado

---

## 🚀 Deploy e Infraestrutura

### Ambiente de Desenvolvimento

```bash
# Configuração local
supabase start
supabase db reset
supabase functions serve

# Verificação
npm run verify-schema
npm run verify-rls
npm run verify-function
```

### Ambiente de Produção

```bash
# Deploy das migrações
supabase db push

# Deploy das Edge Functions
supabase functions deploy generate-embeddings
supabase functions deploy process-task-run

# Deploy de configurações
supabase config push
```

### Variáveis de Ambiente

#### Obrigatórias
```env
SUPABASE_URL=https://ygnxdxkykkdflaswegwn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
```

#### Opcionais
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
SUPABASE_DB_PASSWORD=your_db_password
SUPABASE_JWT_SECRET=your_jwt_secret
```

---

## 📚 Documentação

### Arquivos de Documentação
- `README.md` - Documentação principal
- `BLUEPRINT.md` - Arquitetura completa
- `TECHNICAL_SPECS.md` - Este documento
- `ARCHITECTURE_DIAGRAMS.md` - Diagramas Mermaid
- `VERIFY_SCHEMA.md` - Script de schema
- `VERIFY_RLS.md` - Script de RLS
- `VERIFY_FUNCTION.md` - Script de Edge Function

### Estrutura de Código
```
portal-manduvi-backend/
├── supabase/
│   ├── migrations/           # Migrações do banco
│   │   ├── 20251004200900_initial_schema.sql
│   │   ├── 20251004200901_rls_policies.sql
│   │   ├── 20251004201000_portal_schema_v2.sql
│   │   ├── 20251004201001_update_rls_policies_org_based.sql
│   │   ├── 20251004201002_add_embedding_trigger.sql
│   │   └── 20251004201003_fix_semantic_search_functions.sql
│   ├── functions/            # Edge Functions
│   │   ├── generate-embeddings/
│   │   │   └── index.ts
│   │   └── process-task-run/
│   │       └── index.ts
│   └── config.toml          # Configuração do Supabase
├── scripts/                 # Scripts de verificação
│   ├── verify_schema.mjs
│   ├── verify_rls.mjs
│   ├── verify_function.mjs
│   ├── test_verify.mjs
│   └── demo_scripts.mjs
├── docs/                   # Documentação
│   ├── BLUEPRINT.md
│   ├── TECHNICAL_SPECS.md
│   ├── ARCHITECTURE_DIAGRAMS.md
│   ├── VERIFY_SCHEMA.md
│   ├── VERIFY_RLS.md
│   └── VERIFY_FUNCTION.md
├── package.json            # Dependências Node.js
├── env.example            # Exemplo de variáveis de ambiente
└── README.md              # Documentação principal
```

---

## 🎯 Conclusão

O Portal Manduvi Backend é uma solução técnica robusta e escalável que combina:

- **Arquitetura Moderna**: Supabase + PostgreSQL + IA
- **Segurança Avançada**: RLS + LGPD + Auditoria
- **Performance Otimizada**: Índices + Cache + Rate Limiting
- **Monitoramento Completo**: Métricas + Alertas + Logs
- **Documentação Detalhada**: Especificações + Diagramas + Scripts

A plataforma está preparada para suportar organizações de qualquer tamanho, oferecendo uma base sólida para o desenvolvimento de funcionalidades avançadas de gestão de conteúdo e análise de dados sociais/ambientais.

---

**Desenvolvido com ❤️ para o Portal Manduvi**
