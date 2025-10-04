# Portal Manduvi Backend

Backend do Portal Manduvi construído com Supabase, oferecendo uma plataforma completa para gestão de conteúdo, editais, iniciativas e análise de dados com IA.

## 🏗️ Estrutura do Projeto

```
portal-manduvi-backend/
├── supabase/
│   ├── migrations/
│   │   ├── 20251004200900_initial_schema.sql  # Schema principal do banco
│   │   └── 20251004200901_rls_policies.sql    # Políticas de segurança RLS
│   ├── functions/
│   │   ├── generate-embeddings/
│   │   │   └── index.ts                       # Função para gerar embeddings
│   │   └── process-task-run/
│   │       └── index.ts                       # Função para processar tarefas de IA
│   └── config.toml                            # Configurações do Supabase
└── README.md                                  # Este arquivo
```

## 🚀 Funcionalidades

### 📊 Banco de Dados
- **Instituto**: Seções, fundadores, valores e projetos
- **Iniciativas**: Gestão de iniciativas sociais e ambientais
- **Editais**: Sistema completo de editais e licitações
- **Artigos**: Sistema de notícias e artigos
- **Serviços**: Catálogo de serviços públicos
- **Datasets**: Conjuntos de dados e indicadores
- **Banners**: Sistema de banners promocionais

### 🤖 Inteligência Artificial
- **Embeddings Automáticos**: Geração automática de embeddings para busca semântica
- **Chunking Inteligente**: Divisão de texto em pedaços otimizados para embeddings
- **Busca Semântica**: Busca por similaridade usando embeddings vector
- **Conteúdo Similar**: Recomendação de conteúdo relacionado
- **Análise de Artigos**: Extração de insights e tendências
- **Resumos Automáticos**: Geração de resumos de conteúdo
- **Categorização**: Classificação automática de conteúdo
- **Análise de Sentimento**: Análise de sentimento em textos

### 🔒 Segurança
- **Row Level Security (RLS)**: Políticas de segurança por linha
- **Autenticação**: Sistema de autenticação integrado
- **Auditoria**: Log de ações dos usuários
- **Políticas de Acesso**: Controle granular de permissões

## 🛠️ Configuração e Instalação

### Pré-requisitos
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Deno](https://deno.land/) (para Edge Functions)

### 1. Instalação do Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux/Windows
npm install -g supabase
```

### 2. Configuração do Projeto

```bash
# Clone o repositório
git clone <repository-url>
cd portal-manduvi-backend

# Inicialize o Supabase (se ainda não foi feito)
supabase init

# Faça login no Supabase
supabase login

# Conecte ao projeto remoto
supabase link --project-ref ygnxdxkykkdflaswegwn
```

### 3. Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
SUPABASE_URL=https://ygnxdxkykkdflaswegwn.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI (para funções de IA)
OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Execução Local

```bash
# Inicie o Supabase localmente
supabase start

# Aplique as migrações
supabase db reset

# Deploy das Edge Functions
supabase functions deploy generate-embeddings
supabase functions deploy process-task-run
```

## 📚 Uso das APIs

### Banco de Dados

O projeto utiliza o Supabase como backend, oferecendo APIs REST e GraphQL automáticas para todas as tabelas.

**Exemplo de consulta de artigos:**
```javascript
const { data, error } = await supabase
  .from('articles')
  .select('*')
  .eq('status', 'published')
  .order('published_at', { ascending: false })
  .limit(10);
```

### Edge Functions

#### 1. Gerar Embeddings

```bash
curl -X POST 'https://ygnxdxkykkdflaswegwn.supabase.co/functions/v1/generate-embeddings' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Texto para gerar embedding",
    "table_name": "articles",
    "record_id": "uuid-do-registro",
    "column_name": "title"
  }'
```

#### 2. Processar Tarefas de IA

```bash
curl -X POST 'https://ygnxdxkykkdflaswegwn.supabase.co/functions/v1/process-task-run' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "task_type": "analyze_articles",
    "parameters": {
      "table_name": "articles",
      "filters": {
        "limit": 10,
        "status": "published"
      }
    },
    "priority": "normal"
  }'
```

#### 3. Gerar Embeddings (Automático)

Os embeddings são gerados automaticamente quando conteúdo é criado ou atualizado. Para gerar manualmente:

```sql
-- Reindexar embeddings de um item específico
SELECT reindex_content_embeddings('uuid-do-item');

-- Processar embeddings pendentes
SELECT process_pending_embeddings();
```

#### 4. Busca Semântica

```sql
-- Buscar conteúdo similar
SELECT * FROM semantic_search(
  'termo de busca',
  'uuid-da-organizacao',
  0.7,  -- threshold de similaridade
  10    -- limite de resultados
);

-- Encontrar conteúdo similar a um item
SELECT * FROM find_similar_content(
  'uuid-do-item',
  'uuid-da-organizacao',
  0.7,  -- threshold de similaridade
  5     -- limite de resultados
);

-- Estatísticas de embeddings
SELECT * FROM get_embedding_stats('uuid-da-organizacao');
```

**Tipos de tarefas disponíveis:**
- `analyze_articles`: Análise de artigos para insights
- `generate_summaries`: Geração de resumos
- `extract_insights`: Extração de insights
- `categorize_content`: Categorização de conteúdo
- `sentiment_analysis`: Análise de sentimento

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### Instituto
- `instituto_sections`: Seções do instituto
- `instituto_founders`: Fundadores
- `instituto_values`: Valores
- `instituto_projects`: Projetos

#### Conteúdo
- `initiatives`: Iniciativas sociais/ambientais
- `articles`: Artigos e notícias
- `sources`: Fontes de dados
- `banners`: Banners promocionais

#### Editais
- `editais`: Editais e licitações
- `editais_categories`: Categorias de editais

#### Serviços e Dados
- `services`: Serviços públicos
- `datasets`: Conjuntos de dados
- `dataset_indicators`: Indicadores

### Relacionamentos

- `articles.source_id` → `sources.id`
- `editais.category_slug` → `editais_categories.slug`
- `dataset_indicators.dataset_slug` → `datasets.slug`

## 🔧 Comandos Úteis

### Supabase CLI
```bash
# Iniciar Supabase local
supabase start

# Parar Supabase local
supabase stop

# Aplicar migrações
supabase db reset

# Deploy de funções
supabase functions deploy

# Ver logs das funções
supabase functions logs

# Conectar ao banco local
supabase db connect

# Gerar tipos TypeScript
supabase gen types typescript --local > types/database.types.ts
```

### Scripts Node.js
```bash
# Instalar dependências
npm install

# Verificar schema do banco
npm run verify-schema

# Testar políticas RLS
npm run verify-rls

# Testar Edge Function
npm run verify-function

# Configurar Vault
npm run setup-vault

# Testar Trigger de Embeddings
npm run test-trigger

# Testar Webhook do Clerk
npm run test-clerk-webhook

# Testar configuração
npm run test-verify
```

### Verificação do Schema
O script `verify_schema.mjs` verifica:
- ✅ Todas as tabelas criadas no schema public
- ✅ Extensões PostgreSQL ativas
- ✅ Funções personalizadas
- ✅ Políticas RLS configuradas
- ✅ Validação das tabelas principais do Portal Manduvi

### Teste de RLS (Row-Level Security)
O script `verify_rls.mjs` testa:
- ✅ Acesso anônimo (apenas conteúdo público)
- ✅ Bloqueio de escrita não autorizada
- ✅ Políticas por organização
- ✅ Isolamento de dados entre organizações
- ✅ Validação de políticas de segurança

### Teste de Edge Function
O script `verify_function.mjs` testa:
- ✅ Disponibilidade da Edge Function `generate-embeddings`
- ✅ Invocação com dados de exemplo
- ✅ Geração de embeddings com diferentes tipos de conteúdo
- ✅ Integração com OpenAI API
- ✅ Integração com banco de dados Supabase

### Trigger de Embeddings
O sistema de trigger automático inclui:
- ✅ Geração automática de embeddings quando conteúdo é criado/atualizado
- ✅ Integração com Edge Function via HTTP
- ✅ Logs de auditoria completos
- ✅ Tratamento de erros robusto
- ✅ Configuração via Vault do Supabase

### Webhook do Clerk
O sistema de integração com Clerk inclui:
- ✅ Recebimento de webhooks do Clerk
- ✅ Sincronização automática de usuários
- ✅ Validação de assinatura com svix
- ✅ Suporte a eventos: user.created, user.updated, user.deleted
- ✅ Integração com Supabase Auth

Para mais detalhes, consulte:
- [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) - Resumo executivo para stakeholders
- [INDEX.md](./INDEX.md) - Índice completo da documentação
- [BLUEPRINT.md](./BLUEPRINT.md) - Arquitetura completa do sistema
- [TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md) - Especificações técnicas detalhadas
- [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) - Diagramas de arquitetura
- [VERIFY_SCHEMA.md](./VERIFY_SCHEMA.md) - Verificação do schema
- [VERIFY_RLS.md](./VERIFY_RLS.md) - Testes de segurança RLS
- [VERIFY_FUNCTION.md](./VERIFY_FUNCTION.md) - Testes de Edge Function
- [TRIGGER_EMBEDDINGS.md](./TRIGGER_EMBEDDINGS.md) - Sistema de trigger automático
- [CLERK_WEBHOOK.md](./CLERK_WEBHOOK.md) - Integração com Clerk

## 🚀 Deploy

### Deploy para Produção

```bash
# Deploy das migrações
supabase db push

# Deploy das Edge Functions
supabase functions deploy generate-embeddings
supabase functions deploy process-task-run

# Deploy de mudanças de configuração
supabase config push
```

### Verificação de Deploy

```bash
# Verificar status do projeto
supabase status

# Ver logs de produção
supabase logs --project-ref ygnxdxkykkdflaswegwn
```

## 🔍 Monitoramento

### Logs e Métricas
- Acesse o [Dashboard do Supabase](https://supabase.com/dashboard/project/ygnxdxkykkdflaswegwn)
- Monitore performance das Edge Functions
- Acompanhe uso de recursos e custos

### Alertas
Configure alertas para:
- Uso excessivo de recursos
- Erros nas Edge Functions
- Falhas de autenticação
- Problemas de performance

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no repositório
- Entre em contato com a equipe de desenvolvimento
- Consulte a [documentação do Supabase](https://supabase.com/docs)

---

**Portal Manduvi** - Transformando dados em impacto social através da tecnologia.
