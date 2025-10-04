# Script de Verificação de Edge Function

Este script Node.js testa a Edge Function `generate-embeddings` do Portal Manduvi, verificando se a função está funcionando corretamente e gerando embeddings.

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Arquivo `.env` com as credenciais do Supabase
- Edge Function `generate-embeddings` deployada no Supabase
- OpenAI API Key configurada (para a Edge Function)

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
OPENAI_API_KEY=sua_openai_api_key_aqui
```

## 🏃‍♂️ Como Executar

```bash
# Executar o script de teste da Edge Function
npm run verify-function

# Ou executar diretamente
node verify_function.mjs
```

## 🧪 Testes Realizados

### ✅ Teste 1: Verificação de Disponibilidade
**Objetivo:** Verificar se a Edge Function está disponível e acessível.

**Processo:**
1. Tenta invocar a função com dados mínimos
2. Verifica se a função responde (mesmo que com erro)
3. Identifica se a função não foi encontrada

**Resultado Esperado:**
- ✅ SUCESSO: Função encontrada e acessível
- ❌ FALHA: Função não encontrada ou inacessível

### ✅ Teste 2: Teste Principal
**Objetivo:** Testar a função com dados de exemplo completos.

**Processo:**
1. Invoca a função com um record de exemplo
2. Verifica se a resposta contém a mensagem esperada
3. Analisa se embeddings foram gerados

**Dados de Teste:**
```javascript
{
  id: '123e4567-e89b-12d3-a456-426614174000',
  body: 'Este é um teste de conteúdo para gerar um embedding...',
  org_id: '876e4567-e89b-12d3-a456-426614174000',
  title: 'Teste de Embedding - Portal Manduvi',
  excerpt: 'Conteúdo de teste para verificar a geração de embeddings'
}
```

**Resultado Esperado:**
- ✅ SUCESSO: Resposta contém mensagem de sucesso
- ❌ FALHA: Erro na execução ou resposta vazia

### ✅ Teste 3: Diferentes Tipos de Conteúdo
**Objetivo:** Testar a função com diferentes tipos de conteúdo.

**Tipos Testados:**
1. **Conteúdo Curto:** Texto simples e direto
2. **Conteúdo Longo:** Texto extenso para testar chunking
3. **Conteúdo com Caracteres Especiais:** Acentos, símbolos, emojis

**Resultado Esperado:**
- ✅ SUCESSO: Todos os tipos de conteúdo são processados
- ❌ FALHA: Alguns tipos de conteúdo falham

## 📊 Exemplo de Saída

```
🎯 TESTE DA EDGE FUNCTION: generate-embeddings
============================================================

🔍 VERIFICANDO DISPONIBILIDADE DA EDGE FUNCTION
--------------------------------------------------
✅ Edge Function encontrada
   Erro esperado (dados de teste inválidos): Invalid input data

🧪 EXECUTANDO TESTE PRINCIPAL
🚀 Testando Edge Function: generate-embeddings
📡 Conectando ao Supabase: https://ygnxdxkykkdflaswegwn.supabase.co
🔑 Usando chave anônima para invocação

📝 Dados de teste:
   ID: 123e4567-e89b-12d3-a456-426614174000
   Org ID: 876e4567-e89b-12d3-a456-426614174000
   Título: Teste de Embedding - Portal Manduvi
   Conteúdo: Este é um teste de conteúdo para gerar um embedding. O Portal Manduvi é uma plataforma inovadora...

🔍 Invocando Edge Function...

📊 RESULTADO DA INVOCAÇÃO:
--------------------------------------------------
✅ SUCESSO:
   Resposta: { message: "Generated 2 embeddings." }
   Mensagem: Generated 2 embeddings.

📈 Resposta completa:
{
  "message": "Generated 2 embeddings."
}

🧪 TESTANDO DIFERENTES TIPOS DE CONTEÚDO
============================================================

🔍 Testando: Conteúdo Curto
----------------------------------------
✅ Conteúdo Curto: SUCESSO
   Resposta: Função executada

🔍 Testando: Conteúdo Longo
----------------------------------------
✅ Conteúdo Longo: SUCESSO
   Resposta: Função executada

🔍 Testando: Conteúdo com Caracteres Especiais
----------------------------------------
✅ Conteúdo com Caracteres Especiais: SUCESSO
   Resposta: Função executada

================================================================================
📊 RESUMO DOS TESTES DA EDGE FUNCTION
================================================================================

1. Teste Principal: ✅ SUCESSO

2. Testes de Conteúdo:
   1. Conteúdo Curto: ✅ SUCESSO
   2. Conteúdo Longo: ✅ SUCESSO
   3. Conteúdo com Caracteres Especiais: ✅ SUCESSO

📈 Resultado Final: 3/3 testes de conteúdo passaram

🎉 Todos os testes passaram! A Edge Function está funcionando corretamente.
================================================================================
```

## 🔧 Configuração da Edge Function

### Variáveis de Ambiente Necessárias
A Edge Function precisa das seguintes variáveis de ambiente:

```env
# Supabase
SUPABASE_URL=https://ygnxdxkykkdflaswegwn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# OpenAI
OPENAI_API_KEY=sua_openai_api_key_aqui
```

### Deploy da Edge Function
```bash
# Deploy da função
supabase functions deploy generate-embeddings

# Verificar se foi deployada
supabase functions list
```

## 🚨 Tratamento de Erros

O script trata os seguintes cenários:

- **Função não encontrada:** Verifica se a função foi deployada
- **Erro de autenticação:** Verifica se as chaves estão corretas
- **Erro de API:** Captura erros da OpenAI API
- **Timeout:** Trata timeouts de rede
- **Dados inválidos:** Valida entrada da função

## 🔍 Troubleshooting

### Erro: "Function not found"
```bash
# Verifique se a função foi deployada
supabase functions list

# Deploy da função se necessário
supabase functions deploy generate-embeddings
```

### Erro: "Invalid input data"
- Verifique se o formato do record está correto
- Confirme se todos os campos obrigatórios estão presentes
- Verifique se os tipos de dados estão corretos

### Erro: "OpenAI API error"
- Verifique se a `OPENAI_API_KEY` está configurada
- Confirme se a chave é válida e tem créditos
- Verifique se a API está acessível

### Erro: "Database error"
- Verifique se a `SUPABASE_SERVICE_ROLE_KEY` está correta
- Confirme se as tabelas existem no banco
- Verifique se as políticas RLS permitem a operação

### Timeout ou Erro de Rede
- Verifique sua conexão com a internet
- Confirme se o Supabase está acessível
- Tente novamente após alguns minutos

## 📚 Dependências

- `@supabase/supabase-js`: Cliente JavaScript para Supabase
- `dotenv`: Carregamento de variáveis de ambiente

## 🎯 Validações Específicas

### Funcionamento da Edge Function
- ✅ Função está disponível e acessível
- ✅ Responde corretamente a invocações
- ✅ Processa diferentes tipos de conteúdo
- ✅ Gera embeddings com sucesso
- ✅ Retorna mensagens de confirmação

### Integração com OpenAI
- ✅ API Key configurada corretamente
- ✅ Modelo `text-embedding-3-small` funcionando
- ✅ Chunking de texto funcionando
- ✅ Geração de embeddings funcionando

### Integração com Supabase
- ✅ Conexão com banco de dados funcionando
- ✅ Inserção de embeddings funcionando
- ✅ Limpeza de embeddings antigos funcionando
- ✅ Políticas RLS permitindo operações

## 🤝 Contribuição

Para melhorar o script:

1. Adicione novos tipos de conteúdo para teste
2. Teste com diferentes tamanhos de texto
3. Adicione validação de performance
4. Teste com diferentes organizações
5. Adicione testes de erro específicos
6. Melhore o tratamento de timeouts
