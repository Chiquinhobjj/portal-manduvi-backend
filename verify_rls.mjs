#!/usr/bin/env node

/**
 * Script para testar as políticas de Row-Level Security (RLS) do Portal Manduvi
 * Verifica se as políticas de segurança estão funcionando corretamente
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carrega as variáveis de ambiente do arquivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Validação das variáveis de ambiente necessárias
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que as seguintes variáveis estão definidas no arquivo .env:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_ANON_KEY');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cria os clientes Supabase
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Função para aguardar um tempo específico
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Função para limpar dados de teste
 */
async function cleanupTestData() {
  try {
    // Remove dados de teste usando service key
    await supabaseService
      .from('content_items')
      .delete()
      .eq('title', 'Teste RLS - Dados Falsos');
    
    console.log('🧹 Dados de teste limpos');
  } catch (error) {
    console.log('⚠️  Aviso: Não foi possível limpar dados de teste:', error.message);
  }
}

/**
 * TESTE 1: Acesso Anônimo
 * Verifica se usuários anônimos podem ver apenas conteúdo público
 */
async function testAnonymousAccess() {
  console.log('\n🔍 TESTE 1: Acesso Anônimo');
  console.log('-'.repeat(50));
  
  try {
    // Primeiro, vamos inserir alguns dados de teste usando service key
    console.log('📝 Inserindo dados de teste...');
    
    const { data: testData, error: insertError } = await supabaseService
      .from('content_items')
      .insert([
        {
          org_id: '00000000-0000-0000-0000-000000000001', // UUID de teste
          type: 'post',
          slug: 'teste-publico',
          title: 'Post Público de Teste',
          excerpt: 'Este é um post público para teste',
          body: 'Conteúdo público para teste de RLS',
          is_public: true,
          published_at: new Date().toISOString()
        },
        {
          org_id: '00000000-0000-0000-0000-000000000001',
          type: 'post',
          slug: 'teste-privado',
          title: 'Post Privado de Teste',
          excerpt: 'Este é um post privado para teste',
          body: 'Conteúdo privado para teste de RLS',
          is_public: false,
          published_at: new Date().toISOString()
        }
      ])
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir dados de teste:', insertError.message);
      return false;
    }

    console.log('✅ Dados de teste inseridos com sucesso');

    // Aguarda um momento para garantir que os dados foram inseridos
    await sleep(1000);

    // Agora testa o acesso anônimo
    console.log('🔍 Testando acesso anônimo...');
    
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('content_items')
      .select('*');

    if (anonError) {
      console.log('❌ Erro na consulta anônima:', anonError.message);
      return false;
    }

    console.log(`📊 Resultado: ${anonData.length} registros encontrados`);
    
    // Verifica se apenas conteúdo público foi retornado
    const publicItems = anonData.filter(item => item.is_public === true);
    const privateItems = anonData.filter(item => item.is_public === false);
    
    console.log(`📈 Itens públicos: ${publicItems.length}`);
    console.log(`📈 Itens privados: ${privateItems.length}`);

    // O teste é considerado SUCESSO se:
    // 1. Não houve erro na consulta
    // 2. Apenas itens públicos foram retornados (ou nenhum item se não houver públicos)
    const success = anonError === null && privateItems.length === 0;
    
    if (success) {
      console.log('✅ Teste de Acesso Anônimo: SUCESSO');
      console.log('   ✓ Usuários anônimos só veem conteúdo público');
    } else {
      console.log('❌ Teste de Acesso Anônimo: FALHA');
      console.log('   ✗ Usuários anônimos conseguiram ver conteúdo privado');
    }

    return success;

  } catch (error) {
    console.log('❌ Erro inesperado no Teste 1:', error.message);
    return false;
  }
}

/**
 * TESTE 2: Tentativa de Escrita Não Autorizada
 * Verifica se usuários anônimos não conseguem inserir dados
 */
async function testUnauthorizedWrite() {
  console.log('\n🔍 TESTE 2: Tentativa de Escrita Não Autorizada');
  console.log('-'.repeat(50));
  
  try {
    console.log('🔍 Tentando inserir dados com chave anônima...');
    
    const { data, error } = await supabaseAnon
      .from('content_items')
      .insert({
        org_id: '00000000-0000-0000-0000-000000000001',
        type: 'post',
        slug: 'teste-rls-escrita',
        title: 'Teste RLS - Dados Falsos',
        excerpt: 'Tentativa de inserção não autorizada',
        body: 'Este conteúdo não deveria ser inserido',
        is_public: true,
        published_at: new Date().toISOString()
      })
      .select();

    // Se chegou até aqui, a inserção foi bem-sucedida (FALHA do teste)
    if (data && data.length > 0) {
      console.log('❌ Teste de Escrita Não Autorizada: FALHA');
      console.log('   ✗ Usuário anônimo conseguiu inserir dados!');
      console.log('   ✗ Dados inseridos:', data);
      return false;
    }

    // Se houve erro, verifica se é o erro esperado de RLS
    if (error) {
      console.log('📝 Erro capturado:', error.message);
      
      // Verifica se é um erro de RLS
      const isRLSError = error.message.includes('new row violates row-level security policy') ||
                        error.message.includes('RLS') ||
                        error.message.includes('row-level security') ||
                        error.message.includes('permission denied');
      
      if (isRLSError) {
        console.log('✅ Teste de Escrita Não Autorizada: SUCESSO');
        console.log('   ✓ Política RLS bloqueou inserção não autorizada');
        console.log('   ✓ Erro de segurança capturado corretamente');
        return true;
      } else {
        console.log('❌ Teste de Escrita Não Autorizada: FALHA');
        console.log('   ✗ Erro inesperado:', error.message);
        return false;
      }
    }

    // Se não houve erro nem dados, algo estranho aconteceu
    console.log('❌ Teste de Escrita Não Autorizada: FALHA');
    console.log('   ✗ Comportamento inesperado - nem erro nem dados');
    return false;

  } catch (error) {
    // Captura erros de rede ou outros erros inesperados
    console.log('❌ Erro inesperado no Teste 2:', error.message);
    return false;
  }
}

/**
 * TESTE 3: Verificação de Políticas por Organização
 * Verifica se as políticas de organização estão funcionando
 */
async function testOrganizationPolicies() {
  console.log('\n🔍 TESTE 3: Políticas por Organização');
  console.log('-'.repeat(50));
  
  try {
    // Insere dados para duas organizações diferentes
    console.log('📝 Inserindo dados para diferentes organizações...');
    
    const { data: orgData, error: insertError } = await supabaseService
      .from('content_items')
      .insert([
        {
          org_id: '00000000-0000-0000-0000-000000000001', // Org 1
          type: 'post',
          slug: 'org1-post',
          title: 'Post da Organização 1',
          excerpt: 'Conteúdo da org 1',
          body: 'Este conteúdo pertence à organização 1',
          is_public: true,
          published_at: new Date().toISOString()
        },
        {
          org_id: '00000000-0000-0000-0000-000000000002', // Org 2
          type: 'post',
          slug: 'org2-post',
          title: 'Post da Organização 2',
          excerpt: 'Conteúdo da org 2',
          body: 'Este conteúdo pertence à organização 2',
          is_public: true,
          published_at: new Date().toISOString()
        }
      ])
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir dados de teste:', insertError.message);
      return false;
    }

    console.log('✅ Dados de teste inseridos');

    // Testa acesso anônimo (deve ver ambos os posts públicos)
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('content_items')
      .select('*');

    if (anonError) {
      console.log('❌ Erro na consulta anônima:', anonError.message);
      return false;
    }

    console.log(`📊 Acesso anônimo: ${anonData.length} registros encontrados`);
    
    // Verifica se ambos os posts públicos foram retornados
    const org1Posts = anonData.filter(item => item.org_id === '00000000-0000-0000-0000-000000000001');
    const org2Posts = anonData.filter(item => item.org_id === '00000000-0000-0000-0000-000000000002');
    
    console.log(`📈 Posts da Org 1: ${org1Posts.length}`);
    console.log(`📈 Posts da Org 2: ${org2Posts.length}`);

    const success = org1Posts.length > 0 && org2Posts.length > 0;
    
    if (success) {
      console.log('✅ Teste de Políticas por Organização: SUCESSO');
      console.log('   ✓ Conteúdo público de diferentes organizações é visível');
    } else {
      console.log('❌ Teste de Políticas por Organização: FALHA');
      console.log('   ✗ Problema na visibilidade de conteúdo entre organizações');
    }

    return success;

  } catch (error) {
    console.log('❌ Erro inesperado no Teste 3:', error.message);
    return false;
  }
}

/**
 * Função principal para executar todos os testes
 */
async function runRLSTests() {
  console.log('🚀 Iniciando testes de Row-Level Security (RLS)');
  console.log('📡 Conectando ao Supabase:', supabaseUrl);
  console.log('🔑 Usando chave anônima para testes de segurança');
  
  // Limpa dados de teste anteriores
  await cleanupTestData();
  
  const results = [];
  
  // Executa os testes
  const test1Result = await testAnonymousAccess();
  results.push({ name: 'Acesso Anônimo', success: test1Result });
  
  const test2Result = await testUnauthorizedWrite();
  results.push({ name: 'Escrita Não Autorizada', success: test2Result });
  
  const test3Result = await testOrganizationPolicies();
  results.push({ name: 'Políticas por Organização', success: test3Result });
  
  // Limpa dados de teste
  await cleanupTestData();
  
  // Exibe resumo dos resultados
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DOS TESTES DE RLS');
  console.log('='.repeat(80));
  
  results.forEach((test, index) => {
    const status = test.success ? '✅ SUCESSO' : '❌ FALHA';
    console.log(`${index + 1}. ${test.name}: ${status}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalTests = results.length;
  
  console.log(`\n📈 Resultado Final: ${successCount}/${totalTests} testes passaram`);
  
  if (successCount === totalTests) {
    console.log('🎉 Todos os testes de RLS passaram! As políticas estão funcionando corretamente.');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique as políticas RLS configuradas.');
  }
  
  console.log('\n' + '='.repeat(80));
}

// Executa os testes
runRLSTests().catch(error => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});
