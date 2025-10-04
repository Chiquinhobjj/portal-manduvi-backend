#!/usr/bin/env node

/**
 * Script para testar a Edge Function clerk-webhook
 * Este script testa se a função está funcionando corretamente
 * e pode receber webhooks do Clerk
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
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que as seguintes variáveis estão definidas no arquivo .env:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testClerkWebhookFunction() {
  console.log('🧪 TESTE DA EDGE FUNCTION: clerk-webhook');
  console.log('='.repeat(50));
  console.log('📡 Conectando ao Supabase:', supabaseUrl);
  
  try {
    // 1. Verificar se a função está disponível
    console.log('\n🔍 1. Verificando disponibilidade da função...');
    
    const { data: functions, error: listError } = await supabase.functions.list();
    
    if (listError) {
      console.log('❌ Erro ao listar funções:', listError.message);
      return;
    }
    
    const clerkWebhook = functions.find(f => f.name === 'clerk-webhook');
    
    if (!clerkWebhook) {
      console.log('❌ Função clerk-webhook não encontrada');
      console.log('   Execute: supabase functions deploy clerk-webhook');
      return;
    }
    
    console.log('✅ Função clerk-webhook encontrada');
    console.log('   Status:', clerkWebhook.status);
    console.log('   Versão:', clerkWebhook.version);
    
    // 2. Testar invocação da função (sem dados válidos)
    console.log('\n🔍 2. Testando invocação da função...');
    
    try {
      const { data, error } = await supabase.functions.invoke('clerk-webhook', {
        body: {
          test: 'invalid_webhook_data'
        }
      });
      
      if (error) {
        if (error.message.includes('Missing svix headers') || 
            error.message.includes('Webhook signature verification failed')) {
          console.log('✅ Função está funcionando corretamente');
          console.log('   Erro esperado (dados de teste inválidos):', error.message);
        } else {
          console.log('⚠️  Erro inesperado:', error.message);
        }
      } else {
        console.log('⚠️  Função retornou dados inesperados:', data);
      }
      
    } catch (invokeError) {
      console.log('⚠️  Erro ao invocar função:', invokeError.message);
    }
    
    // 3. Mostrar informações da função
    console.log('\n📋 3. Informações da função:');
    console.log('   URL:', `${supabaseUrl}/functions/v1/clerk-webhook`);
    console.log('   Método: POST');
    console.log('   Headers necessários:');
    console.log('     - svix-id');
    console.log('     - svix-timestamp');
    console.log('     - svix-signature');
    console.log('     - Content-Type: application/json');
    
    // 4. Mostrar exemplo de payload
    console.log('\n📝 4. Exemplo de payload do Clerk:');
    console.log(JSON.stringify({
      data: {
        id: 'user_123456789',
        email_addresses: [
          {
            id: 'email_123',
            email_address: 'user@example.com'
          }
        ],
        primary_email_address_id: 'email_123',
        first_name: 'João',
        last_name: 'Silva',
        image_url: 'https://example.com/avatar.jpg',
        created_at: 1640995200,
        updated_at: 1640995200
      },
      object: 'event',
      type: 'user.created'
    }, null, 2));
    
    // 5. Instruções de configuração
    console.log('\n🔧 5. Configuração necessária:');
    console.log('   • Variável de ambiente: CLERK_WEBHOOK_SECRET_KEY');
    console.log('   • Configurar no painel Supabase: Settings > Edge Functions');
    console.log('   • Adicionar segredo do webhook do Clerk');
    
    console.log('\n✅ Teste da função clerk-webhook concluído!');
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
  }
}

async function showConfigurationInstructions() {
  console.log('\n📋 INSTRUÇÕES DE CONFIGURAÇÃO:');
  console.log('='.repeat(50));
  
  console.log('\n1️⃣  CONFIGURAR VARIÁVEL DE AMBIENTE:');
  console.log('   • No painel Supabase: Settings > Edge Functions');
  console.log('   • Adicionar variável: CLERK_WEBHOOK_SECRET_KEY');
  console.log('   • Valor: [seu_webhook_secret_do_clerk]');
  
  console.log('\n2️⃣  CONFIGURAR WEBHOOK NO CLERK:');
  console.log('   • No painel do Clerk: Webhooks');
  console.log('   • Endpoint URL:', `${supabaseUrl}/functions/v1/clerk-webhook`);
  console.log('   • Eventos: user.created, user.updated, user.deleted');
  
  console.log('\n3️⃣  TESTAR WEBHOOK:');
  console.log('   • Use o painel do Clerk para enviar webhook de teste');
  console.log('   • Verifique os logs da Edge Function');
  console.log('   • Confirme que usuários são criados/atualizados no Supabase');
  
  console.log('\n4️⃣  VERIFICAR LOGS:');
  console.log('   • No painel Supabase: Edge Functions > clerk-webhook > Logs');
  console.log('   • Ou via CLI: supabase functions logs clerk-webhook');
  
  console.log('\n' + '='.repeat(50));
}

async function main() {
  console.log('🚀 TESTE DA EDGE FUNCTION CLERK-WEBHOOK - PORTAL MANDUVI');
  console.log('='.repeat(60));
  
  await testClerkWebhookFunction();
  await showConfigurationInstructions();
  
  console.log('\n✅ Teste da Edge Function clerk-webhook concluído!');
  console.log('📖 Consulte a documentação para mais detalhes.');
}

main().catch(error => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});
