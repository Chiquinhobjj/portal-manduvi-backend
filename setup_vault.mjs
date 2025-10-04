#!/usr/bin/env node

/**
 * Script para configurar o Vault do Supabase com a chave de serviço
 * Este script ajuda a configurar o segredo SUPABASE_SERVICE_ROLE_KEY
 * no Vault do Supabase para que o trigger de embeddings funcione
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carrega as variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que as seguintes variáveis estão definidas no arquivo .env:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupVault() {
  console.log('🔐 Configurando Vault do Supabase...');
  console.log('📡 Conectando ao Supabase:', supabaseUrl);
  
  try {
    // Verifica se o segredo já existe
    console.log('\n🔍 Verificando se o segredo já existe...');
    
    const { data: existingSecrets, error: listError } = await supabase
      .from('vault.decrypted_secrets')
      .select('name')
      .eq('name', 'SUPABASE_SERVICE_ROLE_KEY');
    
    if (listError) {
      console.log('⚠️  Não foi possível verificar segredos existentes:', listError.message);
      console.log('   Isso é normal se a tabela vault ainda não foi criada.');
    } else if (existingSecrets && existingSecrets.length > 0) {
      console.log('✅ Segredo SUPABASE_SERVICE_ROLE_KEY já existe no Vault');
      console.log('   O trigger de embeddings deve funcionar corretamente.');
      return;
    }
    
    console.log('📝 Segredo não encontrado. Configurando...');
    
    // Insere o segredo no Vault
    const { data, error } = await supabase
      .from('vault.decrypted_secrets')
      .insert({
        name: 'SUPABASE_SERVICE_ROLE_KEY',
        decrypted_secret: supabaseServiceKey
      });
    
    if (error) {
      console.error('❌ Erro ao configurar o Vault:', error.message);
      console.log('\n🔧 CONFIGURAÇÃO MANUAL NECESSÁRIA:');
      console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
      console.log('2. Vá para o seu projeto');
      console.log('3. Navegue para Settings > Vault');
      console.log('4. Clique em "New Secret"');
      console.log('5. Configure:');
      console.log('   Name: SUPABASE_SERVICE_ROLE_KEY');
      console.log('   Secret: ' + supabaseServiceKey.substring(0, 20) + '...');
      console.log('6. Clique em "Save"');
      return;
    }
    
    console.log('✅ Segredo configurado com sucesso no Vault!');
    console.log('   O trigger de embeddings agora pode funcionar corretamente.');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    console.log('\n🔧 CONFIGURAÇÃO MANUAL NECESSÁRIA:');
    console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard');
    console.log('2. Vá para o seu projeto');
    console.log('3. Navegue para Settings > Vault');
    console.log('4. Clique em "New Secret"');
    console.log('5. Configure:');
    console.log('   Name: SUPABASE_SERVICE_ROLE_KEY');
    console.log('   Secret: [sua_service_role_key_completa]');
    console.log('6. Clique em "Save"');
  }
}

async function testVaultConfiguration() {
  console.log('\n🧪 Testando configuração do Vault...');
  
  try {
    // Testa se consegue acessar o segredo
    const { data, error } = await supabase
      .rpc('supabase_secret');
    
    if (error) {
      console.log('❌ Erro ao testar o Vault:', error.message);
      console.log('   A função supabase_secret() pode não estar disponível ainda.');
      console.log('   Execute a migração do trigger primeiro: supabase db push');
      return;
    }
    
    if (data) {
      console.log('✅ Vault configurado corretamente!');
      console.log('   A função supabase_secret() está funcionando.');
    } else {
      console.log('⚠️  Vault configurado, mas função não retornou dados.');
    }
    
  } catch (error) {
    console.log('⚠️  Não foi possível testar o Vault:', error.message);
    console.log('   Isso é normal se a migração ainda não foi aplicada.');
  }
}

async function showInstructions() {
  console.log('\n📋 INSTRUÇÕES PARA CONFIGURAÇÃO MANUAL:');
  console.log('='.repeat(60));
  
  console.log('\n1️⃣  CONFIGURAR VAULT NO PAINEL SUPABASE:');
  console.log('   • Acesse: https://supabase.com/dashboard');
  console.log('   • Selecione seu projeto');
  console.log('   • Vá para Settings > Vault');
  console.log('   • Clique em "New Secret"');
  console.log('   • Configure:');
  console.log('     - Name: SUPABASE_SERVICE_ROLE_KEY');
  console.log('     - Secret: [sua_service_role_key_completa]');
  console.log('   • Clique em "Save"');
  
  console.log('\n2️⃣  APLICAR MIGRAÇÃO:');
  console.log('   • Execute: supabase db push');
  console.log('   • Isso criará o trigger e as funções necessárias');
  
  console.log('\n3️⃣  VERIFICAR EXTENSÕES:');
  console.log('   • No painel Supabase, vá para Database > Extensions');
  console.log('   • Certifique-se de que estão ativas:');
  console.log('     - http');
  console.log('     - pg_net');
  
  console.log('\n4️⃣  TESTAR O TRIGGER:');
  console.log('   • Insira ou atualize um conteúdo na tabela content_items');
  console.log('   • Verifique se embeddings foram gerados automaticamente');
  console.log('   • Use: SELECT * FROM ai_embeddings WHERE source_record_id = \'seu_id\';');
  
  console.log('\n5️⃣  TROUBLESHOOTING:');
  console.log('   • Verifique os logs em audit_log para erros do trigger');
  console.log('   • Teste a função: SELECT test_embedding_trigger(\'uuid_do_conteudo\');');
  console.log('   • Verifique se a Edge Function está deployada');
  
  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('🚀 CONFIGURAÇÃO DO VAULT - PORTAL MANDUVI');
  console.log('='.repeat(50));
  
  await setupVault();
  await testVaultConfiguration();
  await showInstructions();
  
  console.log('\n✅ Configuração do Vault concluída!');
  console.log('📖 Consulte a documentação para mais detalhes.');
}

main().catch(error => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});
