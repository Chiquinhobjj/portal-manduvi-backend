#!/usr/bin/env node

/**
 * Script para testar a Edge Function 'generate-embeddings' do Portal Manduvi
 * Verifica se a função está funcionando corretamente
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que as seguintes variáveis estão definidas no arquivo .env:');
  console.error('- SUPABASE_URL');
  console.error('- SUPABASE_ANON_KEY');
  process.exit(1);
}

// Cria o cliente Supabase com a chave anônima
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Função para testar a Edge Function generate-embeddings
 */
async function testGenerateEmbeddingsFunction() {
  console.log('🚀 Testando Edge Function: generate-embeddings');
  console.log('📡 Conectando ao Supabase:', supabaseUrl);
  console.log('🔑 Usando chave anônima para invocação');
  
  // Dados de exemplo para o teste
  const testRecord = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    body: 'Este é um teste de conteúdo para gerar um embedding. O Portal Manduvi é uma plataforma inovadora que utiliza inteligência artificial para análise de dados sociais e ambientais.',
    org_id: '876e4567-e89b-12d3-a456-426614174000',
    title: 'Teste de Embedding - Portal Manduvi',
    excerpt: 'Conteúdo de teste para verificar a geração de embeddings'
  };

  console.log('\n📝 Dados de teste:');
  console.log('   ID:', testRecord.id);
  console.log('   Org ID:', testRecord.org_id);
  console.log('   Título:', testRecord.title);
  console.log('   Conteúdo:', testRecord.body.substring(0, 100) + '...');

  try {
    console.log('\n🔍 Invocando Edge Function...');
    
    // Invoca a Edge Function generate-embeddings
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: {
        record: testRecord
      }
    });

    console.log('\n📊 RESULTADO DA INVOCAÇÃO:');
    console.log('-'.repeat(50));

    if (error) {
      console.log('❌ ERRO:');
      console.log('   Tipo:', error.name || 'Unknown');
      console.log('   Mensagem:', error.message);
      console.log('   Status:', error.status || 'Unknown');
      
      if (error.context) {
        console.log('   Contexto:', error.context);
      }
      
      console.log('\n🔍 Detalhes do erro:');
      console.log(JSON.stringify(error, null, 2));
      
      return false;
    }

    if (data) {
      console.log('✅ SUCESSO:');
      console.log('   Resposta:', data);
      
      // Verifica se a resposta contém a mensagem esperada
      if (data.message) {
        console.log('   Mensagem:', data.message);
      }
      
      // Verifica se embeddings foram gerados
      if (data.embeddings) {
        console.log('   Embeddings gerados:', data.embeddings.length);
      }
      
      console.log('\n📈 Resposta completa:');
      console.log(JSON.stringify(data, null, 2));
      
      return true;
    } else {
      console.log('⚠️  AVISO:');
      console.log('   A função foi executada mas não retornou dados');
      console.log('   Isso pode indicar um problema na função ou na configuração');
      
      return false;
    }

  } catch (error) {
    console.log('💥 ERRO INESPERADO:');
    console.log('   Tipo:', error.name || 'Unknown');
    console.log('   Mensagem:', error.message);
    console.log('   Stack:', error.stack);
    
    return false;
  }
}

/**
 * Função para testar com diferentes tipos de conteúdo
 */
async function testDifferentContentTypes() {
  console.log('\n🧪 TESTANDO DIFERENTES TIPOS DE CONTEÚDO');
  console.log('='.repeat(60));

  const testCases = [
    {
      name: 'Conteúdo Curto',
      record: {
        id: '11111111-1111-1111-1111-111111111111',
        body: 'Texto curto para teste.',
        org_id: '876e4567-e89b-12d3-a456-426614174000',
        title: 'Teste Curto',
        excerpt: 'Conteúdo curto'
      }
    },
    {
      name: 'Conteúdo Longo',
      record: {
        id: '22222222-2222-2222-2222-222222222222',
        body: 'Este é um conteúdo muito longo para testar como a função de geração de embeddings lida com textos extensos. O Portal Manduvi é uma plataforma inovadora que utiliza inteligência artificial para análise de dados sociais e ambientais. Nossa missão é transformar dados em insights acionáveis para promover o desenvolvimento sustentável e a justiça social. Utilizamos tecnologias avançadas como machine learning, processamento de linguagem natural e análise de dados para extrair informações valiosas de grandes volumes de dados. A plataforma oferece ferramentas para organizações, pesquisadores e tomadores de decisão que buscam entender melhor os desafios sociais e ambientais de nossa sociedade.',
        org_id: '876e4567-e89b-12d3-a456-426614174000',
        title: 'Teste Longo',
        excerpt: 'Conteúdo longo para teste de embeddings'
      }
    },
    {
      name: 'Conteúdo com Caracteres Especiais',
      record: {
        id: '33333333-3333-3333-3333-333333333333',
        body: 'Conteúdo com acentos: ação, coração, nação. Símbolos: @#$%&*(). Emojis: 🚀📊🤖. Números: 1234567890.',
        org_id: '876e4567-e89b-12d3-a456-426614174000',
        title: 'Teste Especiais',
        excerpt: 'Conteúdo com caracteres especiais'
      }
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testando: ${testCase.name}`);
    console.log('-'.repeat(40));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-embeddings', {
        body: {
          record: testCase.record
        }
      });

      if (error) {
        console.log(`❌ ${testCase.name}: FALHA`);
        console.log('   Erro:', error.message);
        results.push({ name: testCase.name, success: false, error: error.message });
      } else if (data) {
        console.log(`✅ ${testCase.name}: SUCESSO`);
        console.log('   Resposta:', data.message || 'Função executada');
        results.push({ name: testCase.name, success: true, data: data });
      } else {
        console.log(`⚠️  ${testCase.name}: SEM RESPOSTA`);
        results.push({ name: testCase.name, success: false, error: 'Sem resposta' });
      }

    } catch (error) {
      console.log(`💥 ${testCase.name}: ERRO INESPERADO`);
      console.log('   Erro:', error.message);
      results.push({ name: testCase.name, success: false, error: error.message });
    }

    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

/**
 * Função para verificar se a Edge Function está disponível
 */
async function checkFunctionAvailability() {
  console.log('\n🔍 VERIFICANDO DISPONIBILIDADE DA EDGE FUNCTION');
  console.log('-'.repeat(50));

  try {
    // Tenta invocar a função com dados mínimos
    const { data, error } = await supabase.functions.invoke('generate-embeddings', {
      body: {
        record: {
          id: 'test-availability',
          body: 'test',
          org_id: 'test-org'
        }
      }
    });

    if (error) {
      if (error.message.includes('Function not found') || error.message.includes('404')) {
        console.log('❌ Edge Function não encontrada');
        console.log('   A função generate-embeddings não está disponível');
        console.log('   Verifique se a função foi deployada corretamente');
        return false;
      } else {
        console.log('✅ Edge Function encontrada');
        console.log('   Erro esperado (dados de teste inválidos):', error.message);
        return true;
      }
    } else {
      console.log('✅ Edge Function encontrada e funcionando');
      return true;
    }

  } catch (error) {
    console.log('❌ Erro ao verificar disponibilidade:', error.message);
    return false;
  }
}

/**
 * Função principal para executar todos os testes
 */
async function runFunctionTests() {
  console.log('🎯 TESTE DA EDGE FUNCTION: generate-embeddings');
  console.log('='.repeat(60));

  // Verifica se a função está disponível
  const isAvailable = await checkFunctionAvailability();
  
  if (!isAvailable) {
    console.log('\n❌ Edge Function não está disponível. Encerrando testes.');
    return;
  }

  // Teste principal
  console.log('\n🧪 EXECUTANDO TESTE PRINCIPAL');
  const mainTestResult = await testGenerateEmbeddingsFunction();

  // Testes com diferentes tipos de conteúdo
  const contentTestResults = await testDifferentContentTypes();

  // Resumo dos resultados
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DOS TESTES DA EDGE FUNCTION');
  console.log('='.repeat(80));

  console.log(`\n1. Teste Principal: ${mainTestResult ? '✅ SUCESSO' : '❌ FALHA'}`);

  console.log('\n2. Testes de Conteúdo:');
  contentTestResults.forEach((result, index) => {
    const status = result.success ? '✅ SUCESSO' : '❌ FALHA';
    console.log(`   ${index + 1}. ${result.name}: ${status}`);
    if (!result.success && result.error) {
      console.log(`      Erro: ${result.error}`);
    }
  });

  const successCount = contentTestResults.filter(r => r.success).length;
  const totalTests = contentTestResults.length;

  console.log(`\n📈 Resultado Final: ${successCount}/${totalTests} testes de conteúdo passaram`);

  if (mainTestResult && successCount === totalTests) {
    console.log('\n🎉 Todos os testes passaram! A Edge Function está funcionando corretamente.');
  } else if (mainTestResult) {
    console.log('\n⚠️  Teste principal passou, mas alguns testes de conteúdo falharam.');
  } else {
    console.log('\n❌ Teste principal falhou. Verifique a configuração da Edge Function.');
  }

  console.log('\n' + '='.repeat(80));
}

// Executa os testes
runFunctionTests().catch(error => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});
