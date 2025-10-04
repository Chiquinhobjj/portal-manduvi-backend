#!/usr/bin/env node

/**
 * Script para verificar o schema do banco de dados Supabase
 * Lista todas as tabelas e extensões ativas no schema public
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no arquivo .env');
  console.error('\nExemplo de arquivo .env:');
  console.error('SUPABASE_URL=https://seu-projeto.supabase.co');
  console.error('SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui');
  process.exit(1);
}

// Cria o cliente Supabase com a chave de serviço
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Função para executar consulta SQL e tratar erros
 */
async function executeQuery(query, description) {
  try {
    console.log(`\n🔍 ${description}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      // Se a função RPC não existir, tenta executar diretamente
      const { data: directData, error: directError } = await supabase
        .from('_sql')
        .select('*')
        .limit(1000);
      
      if (directError) {
        throw new Error(`Erro na consulta: ${error.message}`);
      }
      return directData;
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Erro ao executar consulta: ${error.message}`);
    return null;
  }
}

/**
 * Função principal para verificar o schema
 */
async function verifySchema() {
  console.log('🚀 Iniciando verificação do schema do Portal Manduvi...');
  console.log(`📡 Conectando ao Supabase: ${supabaseUrl}`);
  
  // Consulta para listar todas as tabelas do schema public
  const tablesQuery = `
    SELECT 
      table_name,
      table_type,
      is_insertable_into,
      is_typed
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;
  
  // Consulta para listar todas as extensões ativas
  const extensionsQuery = `
    SELECT 
      extname as extension_name,
      extversion as version,
      extrelocatable as relocatable,
      extnamespace::regnamespace as schema_name
    FROM pg_extension 
    ORDER BY extname;
  `;
  
  // Consulta para listar funções criadas pelo usuário
  const functionsQuery = `
    SELECT 
      routine_name,
      routine_type,
      data_type as return_type
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_name NOT LIKE 'pg_%'
      AND routine_name NOT LIKE 'sql_%'
    ORDER BY routine_name;
  `;
  
  // Consulta para listar políticas RLS
  const policiesQuery = `
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;
  
  // Executa as consultas
  const tables = await executeQuery(tablesQuery, 'Listando tabelas do schema public');
  const extensions = await executeQuery(extensionsQuery, 'Listando extensões ativas');
  const functions = await executeQuery(functionsQuery, 'Listando funções personalizadas');
  const policies = await executeQuery(policiesQuery, 'Listando políticas RLS');
  
  // Exibe os resultados
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO DO SCHEMA DO PORTAL MANDUVI');
  console.log('='.repeat(80));
  
  // Tabelas
  if (tables && tables.length > 0) {
    console.log('\n📋 TABELAS CRIADAS:');
    console.log('-'.repeat(50));
    tables.forEach((table, index) => {
      const type = table.table_type === 'BASE TABLE' ? 'Tabela' : table.table_type;
      const insertable = table.is_insertable_into === 'YES' ? '✅' : '❌';
      console.log(`${index + 1}. ${table.table_name} (${type}) ${insertable}`);
    });
    console.log(`\nTotal: ${tables.length} tabelas encontradas`);
  } else {
    console.log('\n❌ Nenhuma tabela encontrada ou erro na consulta');
  }
  
  // Extensões
  if (extensions && extensions.length > 0) {
    console.log('\n🔌 EXTENSÕES ATIVAS:');
    console.log('-'.repeat(50));
    extensions.forEach((ext, index) => {
      const relocatable = ext.relocatable ? '✅' : '❌';
      console.log(`${index + 1}. ${ext.extension_name} v${ext.version} (${ext.schema_name}) ${relocatable}`);
    });
    console.log(`\nTotal: ${extensions.length} extensões ativas`);
  } else {
    console.log('\n❌ Nenhuma extensão encontrada ou erro na consulta');
  }
  
  // Funções
  if (functions && functions.length > 0) {
    console.log('\n⚙️  FUNÇÕES PERSONALIZADAS:');
    console.log('-'.repeat(50));
    functions.forEach((func, index) => {
      const type = func.routine_type === 'FUNCTION' ? 'Função' : func.routine_type;
      console.log(`${index + 1}. ${func.routine_name} (${type}) -> ${func.return_type || 'void'}`);
    });
    console.log(`\nTotal: ${functions.length} funções encontradas`);
  } else {
    console.log('\n❌ Nenhuma função personalizada encontrada ou erro na consulta');
  }
  
  // Políticas RLS
  if (policies && policies.length > 0) {
    console.log('\n🔒 POLÍTICAS RLS:');
    console.log('-'.repeat(50));
    const policiesByTable = {};
    policies.forEach(policy => {
      if (!policiesByTable[policy.tablename]) {
        policiesByTable[policy.tablename] = [];
      }
      policiesByTable[policy.tablename].push(policy);
    });
    
    Object.keys(policiesByTable).forEach(tableName => {
      console.log(`\n📌 ${tableName}:`);
      policiesByTable[tableName].forEach(policy => {
        const cmd = policy.cmd || 'ALL';
        const roles = policy.roles ? policy.roles.join(', ') : 'public';
        console.log(`  • ${policy.policyname} (${cmd}) - ${roles}`);
      });
    });
    console.log(`\nTotal: ${policies.length} políticas RLS encontradas`);
  } else {
    console.log('\n❌ Nenhuma política RLS encontrada ou erro na consulta');
  }
  
  // Resumo final
  console.log('\n' + '='.repeat(80));
  console.log('✅ Verificação do schema concluída!');
  console.log('='.repeat(80));
  
  // Verifica se as tabelas principais estão presentes
  const expectedTables = [
    'content_items', 'content_tags', 'content_item_tags', 'media_assets',
    'profiles', 'roles', 'role_assignments', 'audit_log',
    'data_consents', 'pii_access_logs', 'ai_embeddings',
    'ai_agent_tasks', 'ai_agent_task_runs'
  ];
  
  const foundTables = tables ? tables.map(t => t.table_name) : [];
  const missingTables = expectedTables.filter(table => !foundTables.includes(table));
  
  if (missingTables.length === 0) {
    console.log('🎉 Todas as tabelas principais estão presentes!');
  } else {
    console.log('⚠️  Tabelas ausentes:');
    missingTables.forEach(table => console.log(`  • ${table}`));
  }
  
  // Verifica extensões importantes
  const expectedExtensions = ['uuid-ossp', 'vector', 'pgcrypto'];
  const foundExtensions = extensions ? extensions.map(e => e.extension_name) : [];
  const missingExtensions = expectedExtensions.filter(ext => !foundExtensions.includes(ext));
  
  if (missingExtensions.length === 0) {
    console.log('🎉 Todas as extensões necessárias estão ativas!');
  } else {
    console.log('⚠️  Extensões ausentes:');
    missingExtensions.forEach(ext => console.log(`  • ${ext}`));
  }
}

// Executa o script
verifySchema().catch(error => {
  console.error('💥 Erro fatal:', error.message);
  process.exit(1);
});
