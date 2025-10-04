# 📚 ÍNDICE DE DOCUMENTAÇÃO - PORTAL MANDUVI BACKEND

## 🎯 Documentação Principal

### 📖 [README.md](./README.md)
**Documentação principal do projeto**
- Visão geral do Portal Manduvi Backend
- Funcionalidades principais
- Instalação e configuração
- Comandos úteis
- Scripts de verificação
- Deploy e monitoramento

---

## 🏗️ Arquitetura e Especificações

### 📋 [BLUEPRINT.md](./BLUEPRINT.md)
**Arquitetura completa do sistema**
- Visão geral da arquitetura
- Stack tecnológica
- Estrutura do banco de dados
- Edge Functions
- APIs e endpoints
- Sistema de autenticação
- Políticas de segurança
- Sistema de IA
- Integrações
- Monitoramento e logs
- Deploy e infraestrutura
- Scripts de verificação
- Roadmap

### 🔧 [TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md)
**Especificações técnicas detalhadas**
- Arquitetura técnica
- Especificações do banco de dados
- Edge Functions (código e schemas)
- Sistema de segurança (RLS)
- Sistema de IA (embeddings e busca)
- APIs e endpoints (REST/GraphQL)
- Scripts de verificação
- Performance e escalabilidade
- Monitoramento
- Deploy e infraestrutura

### 📊 [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md)
**Diagramas de arquitetura (Mermaid)**
- Visão geral da arquitetura
- Fluxo de autenticação
- Sistema de IA
- Estrutura do banco de dados
- Fluxo de geração de embeddings
- Sistema de segurança
- Monitoramento e observabilidade
- Pipeline de deploy
- Scripts de verificação
- Roadmap de desenvolvimento

---

## 🔍 Scripts de Verificação

### 🗄️ [VERIFY_SCHEMA.md](./VERIFY_SCHEMA.md)
**Script de verificação do schema**
- Pré-requisitos e instalação
- Como executar
- O que o script verifica
- Exemplo de saída
- Troubleshooting
- Dependências

### 🛡️ [VERIFY_RLS.md](./VERIFY_RLS.md)
**Script de teste de RLS (Row-Level Security)**
- Pré-requisitos e instalação
- Testes realizados
- Exemplo de saída
- Políticas RLS testadas
- Troubleshooting
- Validações específicas

### ⚡ [VERIFY_FUNCTION.md](./VERIFY_FUNCTION.md)
**Script de teste de Edge Function**
- Pré-requisitos e instalação
- Testes realizados
- Exemplo de saída
- Configuração da Edge Function
- Troubleshooting
- Validações específicas

---

## 📁 Estrutura de Arquivos

```
portal-manduvi-backend/
├── 📄 README.md                    # Documentação principal
├── 📄 INDEX.md                     # Este arquivo (índice)
├── 📄 package.json                 # Dependências Node.js
├── 📄 env.example                  # Exemplo de variáveis de ambiente
│
├── 📁 supabase/
│   ├── 📁 migrations/              # Migrações do banco
│   │   ├── 20251004200900_initial_schema.sql
│   │   ├── 20251004200901_rls_policies.sql
│   │   ├── 20251004201000_portal_schema_v2.sql
│   │   ├── 20251004201001_update_rls_policies_org_based.sql
│   │   ├── 20251004201002_add_embedding_trigger.sql
│   │   └── 20251004201003_fix_semantic_search_functions.sql
│   ├── 📁 functions/               # Edge Functions
│   │   ├── 📁 generate-embeddings/
│   │   │   └── index.ts
│   │   └── 📁 process-task-run/
│   │       └── index.ts
│   └── config.toml                 # Configuração do Supabase
│
├── 📁 scripts/                     # Scripts de verificação
│   ├── verify_schema.mjs
│   ├── verify_rls.mjs
│   ├── verify_function.mjs
│   ├── test_verify.mjs
│   └── demo_scripts.mjs
│
└── 📁 docs/                       # Documentação (se organizada)
    ├── BLUEPRINT.md
    ├── TECHNICAL_SPECS.md
    ├── ARCHITECTURE_DIAGRAMS.md
    ├── VERIFY_SCHEMA.md
    ├── VERIFY_RLS.md
    └── VERIFY_FUNCTION.md
```

---

## 🚀 Guia de Início Rápido

### 1. **Configuração Inicial**
```bash
# Clone o repositório
git clone <repository-url>
cd portal-manduvi-backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env
# Edite o arquivo .env com suas credenciais
```

### 2. **Configuração do Supabase**
```bash
# Inicie o Supabase localmente
supabase start

# Aplique as migrações
supabase db reset

# Deploy das Edge Functions
supabase functions deploy generate-embeddings
supabase functions deploy process-task-run
```

### 3. **Verificação do Sistema**
```bash
# Verifique a configuração
npm run test-verify

# Verifique o schema do banco
npm run verify-schema

# Teste as políticas de segurança
npm run verify-rls

# Teste as Edge Functions
npm run verify-function

# Veja a demonstração completa
npm run demo
```

---

## 📚 Navegação por Tópicos

### 🏗️ **Arquitetura**
- [BLUEPRINT.md](./BLUEPRINT.md) - Visão geral da arquitetura
- [TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md) - Especificações técnicas
- [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) - Diagramas visuais

### 🗄️ **Banco de Dados**
- [BLUEPRINT.md#estrutura-do-banco-de-dados](./BLUEPRINT.md#-estrutura-do-banco-de-dados)
- [TECHNICAL_SPECS.md#especificações-do-banco-de-dados](./TECHNICAL_SPECS.md#-especificações-do-banco-de-dados)
- [VERIFY_SCHEMA.md](./VERIFY_SCHEMA.md) - Verificação do schema

### 🔐 **Segurança**
- [BLUEPRINT.md#políticas-de-segurança](./BLUEPRINT.md#-políticas-de-segurança)
- [TECHNICAL_SPECS.md#sistema-de-segurança](./TECHNICAL_SPECS.md#-sistema-de-segurança)
- [VERIFY_RLS.md](./VERIFY_RLS.md) - Testes de RLS

### 🤖 **Inteligência Artificial**
- [BLUEPRINT.md#sistema-de-ia](./BLUEPRINT.md#-sistema-de-ia)
- [TECHNICAL_SPECS.md#sistema-de-ia](./TECHNICAL_SPECS.md#-sistema-de-ia)
- [VERIFY_FUNCTION.md](./VERIFY_FUNCTION.md) - Testes de Edge Functions

### ⚡ **Edge Functions**
- [BLUEPRINT.md#edge-functions](./BLUEPRINT.md#-edge-functions)
- [TECHNICAL_SPECS.md#edge-functions](./TECHNICAL_SPECS.md#-edge-functions)
- [VERIFY_FUNCTION.md](./VERIFY_FUNCTION.md) - Testes e uso

### 🔌 **APIs**
- [BLUEPRINT.md#apis-e-endpoints](./BLUEPRINT.md#-apis-e-endpoints)
- [TECHNICAL_SPECS.md#apis-e-endpoints](./TECHNICAL_SPECS.md#-apis-e-endpoints)

### 🚀 **Deploy**
- [README.md#deploy](./README.md#-deploy)
- [BLUEPRINT.md#deploy-e-infraestrutura](./BLUEPRINT.md#-deploy-e-infraestrutura)
- [TECHNICAL_SPECS.md#deploy-e-infraestrutura](./TECHNICAL_SPECS.md#-deploy-e-infraestrutura)

### 🔍 **Testes e Verificação**
- [VERIFY_SCHEMA.md](./VERIFY_SCHEMA.md) - Verificação do schema
- [VERIFY_RLS.md](./VERIFY_RLS.md) - Testes de segurança
- [VERIFY_FUNCTION.md](./VERIFY_FUNCTION.md) - Testes de Edge Functions

---

## 🎯 Próximos Passos

### Para Desenvolvedores
1. Leia o [README.md](./README.md) para visão geral
2. Consulte [BLUEPRINT.md](./BLUEPRINT.md) para arquitetura
3. Estude [TECHNICAL_SPECS.md](./TECHNICAL_SPECS.md) para implementação
4. Execute os scripts de verificação
5. Comece a desenvolver!

### Para Administradores
1. Leia o [README.md](./README.md) para configuração
2. Consulte [BLUEPRINT.md](./BLUEPRINT.md) para arquitetura
3. Execute os scripts de verificação
4. Configure o ambiente de produção
5. Monitore o sistema

### Para Stakeholders
1. Leia o [README.md](./README.md) para visão geral
2. Consulte [BLUEPRINT.md](./BLUEPRINT.md) para arquitetura
3. Veja [ARCHITECTURE_DIAGRAMS.md](./ARCHITECTURE_DIAGRAMS.md) para diagramas
4. Entenda o roadmap e funcionalidades

---

## 📞 Suporte

Para dúvidas e suporte:
- Consulte a documentação específica
- Execute os scripts de verificação
- Verifique os logs de erro
- Entre em contato com a equipe de desenvolvimento

---

**Portal Manduvi Backend** - Transformando dados em impacto social através da tecnologia.
