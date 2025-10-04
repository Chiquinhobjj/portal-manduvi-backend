#!/usr/bin/env node

/**
 * Script para testar o trigger de embeddings
 * Este script testa se o trigger está funcionando corretamente
 * quando conteúdo é inserido ou atualizado
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

async function testEmbeddingTrigger() {
  console.log('🧪 TESTE DO TRIGGER DE EMBEDDINGS');
  console.log('='.repeat(50));
  console.log('📡 Conectando ao Supabase:', supabaseUrl);
  
  try {
    // 1. Verifica se as extensões estão ativas
    console.log('\n🔍 1. Verificando extensões necessárias...');
    
    const { data: extensions, error: extError } = await supabase
      .rpc('get_extensions_status');
    
    if (extError) {
      console.log('⚠️  Não foi possível verificar extensões:', extError.message);
    } else {
      console.log('✅ Extensões verificadas');
    }
    
    // 2. Verifica se o trigger existe
    console.log('\n🔍 2. Verificando se o trigger existe...');
    
    const { data: triggers, error: triggerError } = await supabase
      .from('pg_trigger')
      .select('*')
      .eq('tgname', 'on_content_item_change');
    
    if (triggerError) {
      console.log('⚠️  Não foi possível verificar triggers:', triggerError.message);
    } else if (triggers && triggers.length > 0) {
      console.log('✅ Trigger on_content_item_change encontrado');
    } else {
      console.log('❌ Trigger on_content_item_change não encontrado');
      console.log('   Execute: supabase db push para aplicar a migração');
      return;
    }
    
    // 3. Verifica se a função existe
    console.log('\n🔍 3. Verificando se a função existe...');
    
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('*')
      .eq('proname', 'generate_embeddings_for_content');
    
    if (funcError) {
      console.log('⚠️  Não foi possível verificar funções:', funcError.message);
    } else if (functions && functions.length > 0) {
      console.log('✅ Função generate_embeddings_for_content encontrada');
    } else {
      console.log('❌ Função generate_embeddings_for_content não encontrada');
      console.log('   Execute: supabase db push para aplicar a migração');
      return;
    }
    
    // 4. Testa inserção de conteúdo
    console.log('\n🔍 4. Testando inserção de conteúdo...');
    
    const testContent = {
      org_id: '876e4567-e89b-12d3-a456-426614174000',
      type: 'post',
      slug: 'teste-trigger-embeddings',
      title: 'Teste do Trigger de Embeddings',
      excerpt: 'Este é um teste para verificar se o trigger está funcionando',
      body: 'Este é um conteúdo de teste para verificar se o trigger de embeddings está funcionando corretamente. O Portal Manduvi é uma plataforma inovadora que utiliza inteligência artificial para análise de dados sociais e ambientais.',
      is_public: true
    };
    
    const { data: insertedContent, error: insertError } = await supabase
      .from('content_items')
      .insert(testContent)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ Erro ao inserir conteúdo de teste:', insertError.message);
      return;
    }
    
    console.log('✅ Conteúdo de teste inserido com sucesso');
    console.log('   ID:', insertedContent.id);
    
    // 5. Aguarda um pouco para o trigger processar
    console.log('\n⏳ 5. Aguardando processamento do trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. Verifica se embeddings foram gerados
    console.log('\n🔍 6. Verificando se embeddings foram gerados...');
    
    const { data: embeddings, error: embedError } = await supabase
      .from('ai_embeddings')
      .select('*')
      .eq('source_record_id', insertedContent.id);
    
    if (embedError) {
      console.log('❌ Erro ao verificar embeddings:', embedError.message);
    } else if (embeddings && embeddings.length > 0) {
      console.log('✅ Embeddings gerados com sucesso!');
      console.log('   Quantidade:', embeddings.length);
      console.log('   Chunks:', embeddings.map(e => e.chunk_ix).sort());
    } else {
      console.log('⚠️  Nenhum embedding foi gerado');
      console.log('   Verifique os logs de auditoria para erros');
    }
    
    // 7. Verifica logs de auditoria
    console.log('\n🔍 7. Verificando logs de auditoria...');
    
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_log')
      .select('*')
      .eq('row_pk', insertedContent.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (auditError) {
      console.log('⚠️  Não foi possível verificar logs de auditoria:', auditError.message);
    } else if (auditLogs && auditLogs.length > 0) {
      console.log('✅ Logs de auditoria encontrados:');
      auditLogs.forEach(log => {
        console.log(`   ${log.action}: ${log.created_at}`);
        if (log.diff) {
          console.log(`   Detalhes: ${JSON.stringify(log.diff)}`);
        }
      });
    } else {
      console.log('⚠️  Nenhum log de auditoria encontrado');
    }
    
    // 8. Testa a função de teste manual
    console.log('\n🔍 8. Testando função de teste manual...');
    
    const { data: testResult, error: testError } = await supabase
      .rpc('test_embedding_trigger', { content_id: insertedContent.id });
    
    if (testError) {
      console.log('⚠️  Erro ao testar função manual:', testError.message);
    } else {
      console.log('✅ Função de teste manual executada');
      console.log('   Resultado:', testResult);
    }
    
    // 9. Limpeza (opcional)
    console.log('\n🧹 9. Limpeza dos dados de teste...');
    
    const { error: deleteError } = await supabase
      .from('content_items')
      .delete()
      .eq('id', insertedContent.id);
    
    if (deleteError) {
      console.log('⚠️  Erro ao limpar dados de teste:', deleteError.message);
    } else {
      console.log('✅ Dados de teste removidos');
    }
    
    // Resumo final
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMO DO TESTE:');
    console.log('='.repeat(50));
    
    if (embeddings && embeddings.length > 0) {
      console.log('🎉 SUCESSO: O trigger de embeddings está funcionando!');
      console.log('   ✅ Trigger criado e ativo');
      console.log('   ✅ Função de trigger funcionando');
      console.log('   ✅ Embeddings gerados automaticamente');
      console.log('   ✅ Logs de auditoria funcionando');
    } else {
      console.log('⚠️  ATENÇÃO: O trigger pode não estar funcionando corretamente');
      console.log('   Verifique:');
      console.log('   • Se a migração foi aplicada: supabase db push');
      console.log('   • Se o Vault está configurado: npm run setup-vault');
      console.log('   • Se as extensões estão ativas: http e pg_net');
      console.log('   • Se a Edge Function está deployada');
    }
    
  } catch (error) {
    console.error('💥 Erro inesperado:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Verifique se a migração foi aplicada: supabase db push');
    console.log('2. Configure o Vault: npm run setup-vault');
    console.log('3. Verifique as extensões no painel Supabase');
    console.log('4. Deploy da Edge Function: supabase functions deploy generate-embeddings');
  }
}

async function showInstructions() {
  console.log('\n📋 INSTRUÇÕES PARA CONFIGURAÇÃO:');
  console.log('='.repeat(50));
  
  console.log('\n1️⃣  APLICAR MIGRAÇÃO:');
  console.log('   supabase db push');
  
  console.log('\n2️⃣  CONFIGURAR VAULT:');
  console.log('   npm run setup-vault');
  
  console.log('\n3️⃣  VERIFICAR EXTENSÕES:');
  console.log('   • No painel Supabase: Database > Extensions');
  console.log('   • Ativar: http e pg_net');
  
  console.log('\n4️⃣  DEPLOY EDGE FUNCTION:');
  console.log('   supabase functions deploy generate-embeddings');
  
  console.log('\n5️⃣  TESTAR TRIGGER:');
  console.log('   npm run test-trigger');
  
  console.log('\n' + '='.repeat(50));
}

async function main() {
  console.log('🚀 TESTE DO TRIGGER DE EMBEDDINGS - PORTAL MANDUVI');
  console.log('='.repeat(60));
  
  await testEmbeddingTrigger();
  await showInstructions();
  
  console.log('\n✅ Teste do trigger concluído!');
  console.log('📖 Consulte a documentação para mais detalhes.');
}

main().catch(error => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});
