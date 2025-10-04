-- =============================================
-- TRIGGER DE EMBEDDINGS AUTOMÁTICO
-- =============================================
-- Este arquivo cria um trigger que automaticamente gera embeddings
-- quando conteúdo é inserido ou atualizado na tabela content_items

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS http;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =============================================
-- PARTE 1: FUNÇÃO AUXILIAR PARA CHAVE SECRETA
-- =============================================
-- Função auxiliar para pegar a chave secreta de forma segura
-- Certifique-se de que o segredo 'SUPABASE_SERVICE_ROLE_KEY' está configurado no painel da Supabase
-- em Settings > Vault.

CREATE OR REPLACE FUNCTION supabase_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY';
$$;

-- =============================================
-- PARTE 2: FUNÇÃO DO TRIGGER
-- =============================================
-- Esta função será chamada pelo trigger.
-- Ela pega os dados da nova linha (NEW) e invoca a Edge Function 'generate-embeddings'.

CREATE OR REPLACE FUNCTION generate_embeddings_for_content()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que a função execute com permissões elevadas, necessário para chamar http.
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Verifica se o conteúdo tem body (texto para gerar embeddings)
  IF NEW.body IS NULL OR TRIM(NEW.body) = '' THEN
    -- Se não há conteúdo, não precisa gerar embeddings
    RETURN NEW;
  END IF;

  -- Invoca a Edge Function 'generate-embeddings' de forma assíncrona.
  -- A função precisa do 'id', 'body' e 'org_id' do novo registro.
  SELECT INTO request_id
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-embeddings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_secret() -- Usa uma chave segura para autenticar a chamada
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'org_id', NEW.org_id,
          'body', NEW.body,
          'title', NEW.title,
          'excerpt', NEW.excerpt
        )
      )
    );

  -- Log da operação (opcional, para debug)
  INSERT INTO audit_log (
    org_id,
    table_name,
    row_pk,
    action,
    actor_user_id,
    diff
  ) VALUES (
    NEW.org_id,
    'content_items',
    NEW.id::text,
    'EMBEDDING_TRIGGER',
    NEW.created_by,
    jsonb_build_object(
      'trigger_fired', true,
      'request_id', request_id,
      'content_length', length(NEW.body)
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, log o erro mas não falha a operação principal
    INSERT INTO audit_log (
      org_id,
      table_name,
      row_pk,
      action,
      actor_user_id,
      diff
    ) VALUES (
      NEW.org_id,
      'content_items',
      NEW.id::text,
      'EMBEDDING_TRIGGER_ERROR',
      NEW.created_by,
      jsonb_build_object(
        'error', SQLERRM,
        'error_code', SQLSTATE
      )
    );
    
    -- Retorna NEW para não falhar a operação principal
    RETURN NEW;
END;
$$;

-- =============================================
-- PARTE 3: O TRIGGER
-- =============================================
-- Este é o "vigia" que monitora a tabela 'content_items'.
-- Ele é disparado DEPOIS ('AFTER') que um item é inserido ou atualizado.

-- Remove o trigger existente se houver
DROP TRIGGER IF EXISTS on_content_item_change ON content_items;

-- Cria o trigger
CREATE TRIGGER on_content_item_change
  AFTER INSERT OR UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION generate_embeddings_for_content();

-- =============================================
-- PARTE 4: CONFIGURAÇÃO DE SETTINGS
-- =============================================
-- Configura a URL do Supabase para uso nas funções
-- Esta configuração será definida via variável de ambiente

-- Função para obter a URL do Supabase
CREATE OR REPLACE FUNCTION get_supabase_url()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('app.settings.supabase_url', true),
    'https://ygnxdxkykkdflaswegwn.supabase.co' -- URL padrão do projeto
  );
$$;

-- =============================================
-- PARTE 5: FUNÇÃO DE TESTE
-- =============================================
-- Função para testar o trigger manualmente

CREATE OR REPLACE FUNCTION test_embedding_trigger(content_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  content_record content_items%ROWTYPE;
  request_id bigint;
  result jsonb;
BEGIN
  -- Busca o registro de conteúdo
  SELECT * INTO content_record
  FROM content_items
  WHERE id = content_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Content item not found'
    );
  END IF;
  
  -- Chama a função de geração de embeddings
  SELECT INTO request_id
    net.http_post(
      url := get_supabase_url() || '/functions/v1/generate-embeddings',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || supabase_secret()
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', content_record.id,
          'org_id', content_record.org_id,
          'body', content_record.body,
          'title', content_record.title,
          'excerpt', content_record.excerpt
        )
      )
    );
  
  RETURN jsonb_build_object(
    'success', true,
    'request_id', request_id,
    'content_id', content_id,
    'message', 'Embedding generation triggered successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$;

-- =============================================
-- PARTE 6: COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================

COMMENT ON FUNCTION generate_embeddings_for_content() IS 
'Função trigger que automaticamente gera embeddings quando conteúdo é inserido ou atualizado';

COMMENT ON FUNCTION supabase_secret() IS 
'Função auxiliar para obter a chave de serviço do Supabase de forma segura';

COMMENT ON FUNCTION test_embedding_trigger(UUID) IS 
'Função para testar manualmente a geração de embeddings para um conteúdo específico';

COMMENT ON TRIGGER on_content_item_change ON content_items IS 
'Trigger que monitora mudanças na tabela content_items e gera embeddings automaticamente';

-- =============================================
-- PARTE 7: PERMISSÕES
-- =============================================

-- Concede permissões necessárias
GRANT EXECUTE ON FUNCTION generate_embeddings_for_content() TO authenticated;
GRANT EXECUTE ON FUNCTION supabase_secret() TO authenticated;
GRANT EXECUTE ON FUNCTION test_embedding_trigger(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_supabase_url() TO authenticated;
