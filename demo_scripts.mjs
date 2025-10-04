#!/usr/bin/env node

/**
 * Script de demonstração para os scripts de verificação do Portal Manduvi
 * Mostra como usar os scripts de verificação de schema e RLS
 */

import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎭 DEMONSTRAÇÃO - SCRIPTS DE VERIFICAÇÃO DO PORTAL MANDUVI');
console.log('='.repeat(70));

// Verifica se os arquivos necessários existem
const requiredFiles = [
  'verify_schema.mjs',
  'verify_rls.mjs',
  'package.json',
  '.env'
];

console.log('\n📁 Verificando arquivos necessários:');
requiredFiles.forEach(file => {
  const exists = existsSync(join(__dirname, file));
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${file}`);
});

// Verifica se o .env existe
const envExists = existsSync(join(__dirname, '.env'));
if (!envExists) {
  console.log('\n⚠️  Arquivo .env não encontrado!');
  console.log('\n📝 Para configurar o ambiente:');
  console.log('1. Copie o arquivo de exemplo:');
  console.log('   cp env.example .env');
  console.log('\n2. Edite o arquivo .env com suas credenciais:');
  console.log('   SUPABASE_URL=https://ygnxdxkykkdflaswegwn.supabase.co');
  console.log('   SUPABASE_ANON_KEY=sua_anon_key_aqui');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui');
}

console.log('\n🚀 SCRIPTS DISPONÍVEIS:');
console.log('-'.repeat(50));

console.log('\n1️⃣  VERIFICAÇÃO DO SCHEMA');
console.log('   Comando: npm run verify-schema');
console.log('   Arquivo: verify_schema.mjs');
console.log('   Função: Verifica estrutura do banco de dados');
console.log('   Verifica:');
console.log('     • Tabelas criadas no schema public');
console.log('     • Extensões PostgreSQL ativas');
console.log('     • Funções personalizadas');
console.log('     • Políticas RLS configuradas');
console.log('     • Validação das tabelas do Portal Manduvi');

console.log('\n2️⃣  TESTE DE RLS (ROW-LEVEL SECURITY)');
console.log('   Comando: npm run verify-rls');
console.log('   Arquivo: verify_rls.mjs');
console.log('   Função: Testa políticas de segurança');
console.log('   Testa:');
console.log('     • Acesso anônimo (apenas conteúdo público)');
console.log('     • Bloqueio de escrita não autorizada');
console.log('     • Políticas por organização');
console.log('     • Isolamento de dados entre organizações');

console.log('\n3️⃣  TESTE DE EDGE FUNCTION');
console.log('   Comando: npm run verify-function');
console.log('   Arquivo: verify_function.mjs');
console.log('   Função: Testa Edge Function generate-embeddings');
console.log('   Testa:');
console.log('     • Disponibilidade da Edge Function');
console.log('     • Invocação com dados de exemplo');
console.log('     • Geração de embeddings');
console.log('     • Integração com OpenAI API');
console.log('     • Diferentes tipos de conteúdo');

console.log('\n4️⃣  TESTE DE CONFIGURAÇÃO');
console.log('   Comando: npm run test-verify');
console.log('   Arquivo: test_verify.mjs');
console.log('   Função: Verifica configuração do ambiente');
console.log('   Verifica:');
console.log('     • Arquivo .env existe');
console.log('     • Dependências instaladas');
console.log('     • Configuração correta');

console.log('\n📚 DOCUMENTAÇÃO:');
console.log('-'.repeat(50));
console.log('   • README.md - Documentação principal do projeto');
console.log('   • VERIFY_SCHEMA.md - Documentação do script de schema');
console.log('   • VERIFY_RLS.md - Documentação do script de RLS');
console.log('   • VERIFY_FUNCTION.md - Documentação do script de Edge Function');
console.log('   • env.example - Exemplo de configuração de ambiente');

console.log('\n🔧 COMANDOS RÁPIDOS:');
console.log('-'.repeat(50));
console.log('   npm install          # Instalar dependências');
console.log('   npm run verify-schema # Verificar schema do banco');
console.log('   npm run verify-rls    # Testar políticas RLS');
console.log('   npm run verify-function # Testar Edge Function');
console.log('   npm run test-verify   # Testar configuração');

console.log('\n🎯 FLUXO RECOMENDADO:');
console.log('-'.repeat(50));
console.log('1. npm install          # Instalar dependências');
console.log('2. cp env.example .env  # Configurar ambiente');
console.log('3. npm run test-verify  # Verificar configuração');
console.log('4. npm run verify-schema # Verificar estrutura do banco');
console.log('5. npm run verify-rls    # Testar segurança');
console.log('6. npm run verify-function # Testar Edge Function');

console.log('\n⚠️  IMPORTANTE:');
console.log('-'.repeat(50));
console.log('   • Certifique-se de que o Supabase está configurado');
console.log('   • As migrações devem estar aplicadas');
console.log('   • As políticas RLS devem estar ativas');
console.log('   • Use as chaves corretas no arquivo .env');

console.log('\n🆘 TROUBLESHOOTING:');
console.log('-'.repeat(50));
console.log('   • Erro de conexão: Verifique SUPABASE_URL');
console.log('   • Erro de autenticação: Verifique as chaves no .env');
console.log('   • Tabelas não encontradas: Execute as migrações');
console.log('   • Políticas RLS falhando: Verifique as políticas no banco');

console.log('\n' + '='.repeat(70));
console.log('🎉 Scripts de verificação do Portal Manduvi prontos para uso!');
console.log('📖 Consulte a documentação para mais detalhes.');
console.log('='.repeat(70));
