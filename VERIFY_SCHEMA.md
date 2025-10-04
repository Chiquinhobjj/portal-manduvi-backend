# Script de Verificação do Schema

Este script Node.js verifica o schema do banco de dados Supabase do Portal Manduvi, listando todas as tabelas, extensões, funções e políticas RLS criadas.

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Arquivo `.env` com as credenciais do Supabase

## 🚀 Instalação

1. **Instale as dependências:**
```bash
npm install
```

2. **Configure as variáveis de ambiente:**
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Edite o arquivo .env com suas credenciais
nano .env
```

3. **Configure o arquivo .env:**
```env
SUPABASE_URL=https://ygnxdxkykkdflaswegwn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

## 🏃‍♂️ Como Executar

```bash
# Executar o script
npm run verify-schema

# Ou executar diretamente
node verify_schema.mjs
```

## 📊 O que o Script Verifica

### ✅ Tabelas
- Lista todas as tabelas do schema `public`
- Mostra o tipo de tabela (BASE TABLE, VIEW, etc.)
- Indica se a tabela é inserível
- Conta o total de tabelas encontradas

### ✅ Extensões
- Lista todas as extensões PostgreSQL ativas
- Mostra versão e schema de cada extensão
- Indica se a extensão é relocável
- Verifica extensões essenciais: `uuid-ossp`, `vector`, `pgcrypto`

### ✅ Funções Personalizadas
- Lista funções criadas pelo usuário
- Mostra tipo de função e tipo de retorno
- Exclui funções do sistema PostgreSQL

### ✅ Políticas RLS
- Lista todas as políticas Row Level Security
- Agrupa por tabela
- Mostra comandos permitidos e roles
- Conta total de políticas

## 🎯 Tabelas Esperadas

O script verifica se as seguintes tabelas principais estão presentes:

**CMS do Portal:**
- `content_items` - Itens de conteúdo
- `content_tags` - Tags de conteúdo
- `content_item_tags` - Relacionamento item-tag
- `media_assets` - Assets de mídia

**Perfis e Papéis:**
- `profiles` - Perfis de usuários
- `roles` - Papéis do sistema
- `role_assignments` - Atribuições de papéis

**LGPD/Segurança:**
- `audit_log` - Log de auditoria
- `data_consents` - Consentimentos LGPD
- `pii_access_logs` - Logs de acesso a PII

**IA em Escala:**
- `ai_embeddings` - Embeddings vector
- `ai_agent_tasks` - Tarefas de IA
- `ai_agent_task_runs` - Execuções de tarefas

## 🔧 Extensões Necessárias

- `uuid-ossp` - Geração de UUIDs
- `vector` - Suporte a embeddings vector
- `pgcrypto` - Funções criptográficas

## 📝 Exemplo de Saída

```
🚀 Iniciando verificação do schema do Portal Manduvi...
📡 Conectando ao Supabase: https://ygnxdxkykkdflaswegwn.supabase.co

================================================================================
📊 RELATÓRIO DO SCHEMA DO PORTAL MANDUVI
================================================================================

📋 TABELAS CRIADAS:
--------------------------------------------------
1. ai_agent_task_runs (Tabela) ✅
2. ai_agent_tasks (Tabela) ✅
3. ai_embeddings (Tabela) ✅
4. audit_log (Tabela) ✅
5. content_item_tags (Tabela) ✅
6. content_items (Tabela) ✅
7. content_tags (Tabela) ✅
8. data_consents (Tabela) ✅
9. media_assets (Tabela) ✅
10. pii_access_logs (Tabela) ✅
11. profiles (Tabela) ✅
12. role_assignments (Tabela) ✅
13. roles (Tabela) ✅

Total: 13 tabelas encontradas

🔌 EXTENSÕES ATIVAS:
--------------------------------------------------
1. uuid-ossp v1.1 (public) ✅
2. vector v0.5.1 (public) ✅
3. pgcrypto v1.3 (public) ✅

Total: 3 extensões ativas

⚙️  FUNÇÕES PERSONALIZADAS:
--------------------------------------------------
1. generate_embeddings_for_content (Função) -> void
2. get_embedding_stats (Função) -> TABLE
3. semantic_search (Função) -> TABLE
4. find_similar_content (Função) -> TABLE
5. reindex_content_embeddings (Função) -> void

Total: 5 funções encontradas

🔒 POLÍTICAS RLS:
--------------------------------------------------
📌 content_items:
  • Public can view public content (SELECT) - public
  • Users can view content from their own org (SELECT) - public
  • Editors and Admins can manage content in their org (ALL) - public

Total: 40 políticas RLS encontradas

================================================================================
✅ Verificação do schema concluída!
🎉 Todas as tabelas principais estão presentes!
🎉 Todas as extensões necessárias estão ativas!
================================================================================
```

## 🚨 Tratamento de Erros

O script trata os seguintes erros:

- **Variáveis de ambiente ausentes**: Verifica se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão definidas
- **Erro de conexão**: Mostra mensagem de erro se não conseguir conectar ao Supabase
- **Erro de consulta**: Continua executando mesmo se uma consulta falhar
- **Dados ausentes**: Mostra mensagem apropriada se não encontrar dados

## 🔍 Troubleshooting

### Erro: "Variáveis de ambiente não encontradas"
- Verifique se o arquivo `.env` existe
- Confirme se as variáveis estão definidas corretamente
- Use `cp env.example .env` para criar o arquivo

### Erro: "Erro na consulta"
- Verifique se a `SUPABASE_SERVICE_ROLE_KEY` está correta
- Confirme se o projeto Supabase está ativo
- Verifique se o usuário tem permissões de administrador

### Nenhuma tabela encontrada
- Execute as migrations do Supabase
- Verifique se está conectando ao projeto correto
- Confirme se as tabelas foram criadas no schema `public`

## 📚 Dependências

- `@supabase/supabase-js`: Cliente JavaScript para Supabase
- `dotenv`: Carregamento de variáveis de ambiente

## 🤝 Contribuição

Para melhorar o script:

1. Adicione novas verificações no arquivo `verify_schema.mjs`
2. Atualize a lista de tabelas esperadas se necessário
3. Melhore o tratamento de erros
4. Adicione mais validações específicas do Portal Manduvi
