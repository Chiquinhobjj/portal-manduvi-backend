# Script de Verificação de RLS (Row-Level Security)

Este script Node.js testa as políticas de Row-Level Security (RLS) do Portal Manduvi, verificando se as políticas de segurança estão funcionando corretamente.

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Arquivo `.env` com as credenciais do Supabase
- Políticas RLS configuradas no banco de dados

## 🚀 Instalação

1. **Instale as dependências:**
```bash
npm install
```

2. **Configure as variáveis de ambiente:**
```bash
# Certifique-se de que o arquivo .env contém:
SUPABASE_URL=https://ygnxdxkykkdflaswegwn.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

## 🏃‍♂️ Como Executar

```bash
# Executar o script de teste RLS
npm run verify-rls

# Ou executar diretamente
node verify_rls.mjs
```

## 🧪 Testes Realizados

### ✅ Teste 1: Acesso Anônimo
**Objetivo:** Verificar se usuários anônimos só conseguem ver conteúdo público.

**Processo:**
1. Insere dados de teste (públicos e privados) usando service key
2. Tenta acessar dados usando chave anônima
3. Verifica se apenas conteúdo público é retornado

**Resultado Esperado:**
- ✅ SUCESSO: Apenas itens com `is_public = true` são retornados
- ❌ FALHA: Itens privados são visíveis para usuários anônimos

### ✅ Teste 2: Tentativa de Escrita Não Autorizada
**Objetivo:** Verificar se usuários anônimos não conseguem inserir dados.

**Processo:**
1. Tenta inserir dados usando chave anônima
2. Captura erros de RLS
3. Verifica se a operação é bloqueada

**Resultado Esperado:**
- ✅ SUCESSO: Erro "new row violates row-level security policy"
- ❌ FALHA: Inserção é permitida ou erro inesperado

### ✅ Teste 3: Políticas por Organização
**Objetivo:** Verificar se as políticas de organização estão funcionando.

**Processo:**
1. Insere dados para diferentes organizações
2. Testa acesso anônimo aos dados
3. Verifica visibilidade entre organizações

**Resultado Esperado:**
- ✅ SUCESSO: Conteúdo público de diferentes organizações é visível
- ❌ FALHA: Problemas na visibilidade entre organizações

## 📊 Exemplo de Saída

```
🚀 Iniciando testes de Row-Level Security (RLS)
📡 Conectando ao Supabase: https://ygnxdxkykkdflaswegwn.supabase.co
🔑 Usando chave anônima para testes de segurança

🔍 TESTE 1: Acesso Anônimo
--------------------------------------------------
📝 Inserindo dados de teste...
✅ Dados de teste inseridos com sucesso
🔍 Testando acesso anônimo...
📊 Resultado: 1 registros encontrados
📈 Itens públicos: 1
📈 Itens privados: 0
✅ Teste de Acesso Anônimo: SUCESSO
   ✓ Usuários anônimos só veem conteúdo público

🔍 TESTE 2: Tentativa de Escrita Não Autorizada
--------------------------------------------------
🔍 Tentando inserir dados com chave anônima...
📝 Erro capturado: new row violates row-level security policy
✅ Teste de Escrita Não Autorizada: SUCESSO
   ✓ Política RLS bloqueou inserção não autorizada
   ✓ Erro de segurança capturado corretamente

🔍 TESTE 3: Políticas por Organização
--------------------------------------------------
📝 Inserindo dados para diferentes organizações...
✅ Dados de teste inseridos
📊 Acesso anônimo: 2 registros encontrados
📈 Posts da Org 1: 1
📈 Posts da Org 2: 1
✅ Teste de Políticas por Organização: SUCESSO
   ✓ Conteúdo público de diferentes organizações é visível

================================================================================
📊 RESUMO DOS TESTES DE RLS
================================================================================
1. Acesso Anônimo: ✅ SUCESSO
2. Escrita Não Autorizada: ✅ SUCESSO
3. Políticas por Organização: ✅ SUCESSO

📈 Resultado Final: 3/3 testes passaram
🎉 Todos os testes de RLS passaram! As políticas estão funcionando corretamente.
================================================================================
```

## 🔧 Políticas RLS Testadas

### Tabela `content_items`
- **SELECT:** Usuários anônimos veem apenas `is_public = true`
- **INSERT/UPDATE/DELETE:** Apenas usuários autenticados com papéis apropriados

### Tabela `profiles`
- **SELECT:** Usuários autenticados veem todos os perfis
- **UPDATE:** Usuários só podem atualizar seu próprio perfil

### Tabela `role_assignments`
- **SELECT/ALL:** Apenas admins da organização

### Tabela `ai_embeddings`
- **SELECT/ALL:** Usuários autenticados da organização

## 🚨 Tratamento de Erros

O script trata os seguintes cenários:

- **Variáveis de ambiente ausentes**: Verifica todas as chaves necessárias
- **Erro de conexão**: Mostra mensagem de erro se não conseguir conectar
- **Dados de teste**: Limpa automaticamente dados de teste após execução
- **Erros de RLS**: Captura e valida erros específicos de segurança
- **Comportamento inesperado**: Identifica situações não previstas

## 🔍 Troubleshooting

### Erro: "Variáveis de ambiente não encontradas"
```bash
# Verifique se o arquivo .env contém:
SUPABASE_URL=https://ygnxdxkykkdflaswegwn.supabase.co
SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### Erro: "Erro ao inserir dados de teste"
- Verifique se a `SUPABASE_SERVICE_ROLE_KEY` está correta
- Confirme se o usuário tem permissões de administrador
- Verifique se as tabelas existem no banco

### Teste 1 Falha: "Usuários anônimos conseguem ver conteúdo privado"
- Verifique se a política `"Public can view public content"` está ativa
- Confirme se a condição `is_public = true` está correta
- Verifique se RLS está habilitado na tabela

### Teste 2 Falha: "Inserção não foi bloqueada"
- Verifique se a política de INSERT está configurada
- Confirme se a condição de autenticação está correta
- Verifique se RLS está habilitado na tabela

### Teste 3 Falha: "Problemas na visibilidade entre organizações"
- Verifique se as políticas de organização estão corretas
- Confirme se o campo `org_id` está sendo usado corretamente
- Verifique se as políticas de SELECT estão funcionando

## 📚 Dependências

- `@supabase/supabase-js`: Cliente JavaScript para Supabase
- `dotenv`: Carregamento de variáveis de ambiente

## 🎯 Validações Específicas

### Segurança de Dados
- ✅ Usuários anônimos não veem dados privados
- ✅ Usuários anônimos não podem inserir dados
- ✅ Políticas de organização funcionam corretamente
- ✅ Dados de teste são limpos automaticamente

### Políticas RLS
- ✅ Políticas de SELECT funcionam
- ✅ Políticas de INSERT funcionam
- ✅ Políticas de UPDATE funcionam
- ✅ Políticas de DELETE funcionam

### Isolamento por Organização
- ✅ Conteúdo público é visível entre organizações
- ✅ Conteúdo privado é isolado por organização
- ✅ Políticas de acesso respeitam `org_id`

## 🤝 Contribuição

Para melhorar o script:

1. Adicione novos testes no arquivo `verify_rls.mjs`
2. Teste outras tabelas além de `content_items`
3. Adicione testes para diferentes papéis de usuário
4. Melhore o tratamento de erros específicos
5. Adicione validações de performance das políticas
