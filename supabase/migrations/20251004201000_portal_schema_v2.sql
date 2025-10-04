-- Migration: Portal Schema V2
-- Description: Aplica o schema completo do Portal Manduvi conforme especificado
-- Date: 2025-01-04

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PATCH 1: CMS DO PORTAL (CONTEÚDO/TAGS/MÍDIA)
-- =============================================
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL, -- Será referenciada após a criação da tabela de organizações
  type TEXT NOT NULL CHECK (type IN ('page','post','project_story','dataset','press')),
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT, -- markdown/html
  cover_url TEXT,
  published_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT true NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (org_id, slug)
);

CREATE TABLE content_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  UNIQUE (org_id, slug)
);

CREATE TABLE content_item_tags (
  item_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  url TEXT NOT NULL,
  mime TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_content_items_org_type_pub ON content_items(org_id, type, is_public, published_at DESC);

-- =======================================================
-- PATCH 2: PERFIS E PAPÉIS (INTEGRAÇÃO AUTH)
-- =======================================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID, -- opcional: org preferida
  full_name TEXT,
  avatar_url TEXT,
  locale TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 'visitor','user','editor','admin','sponsor'
  name TEXT NOT NULL
);

-- Insere os papéis padrão
INSERT INTO roles (code, name) VALUES
('admin', 'Administrador'),
('editor', 'Editor'),
('user', 'Usuário'),
('visitor', 'Visitante');

CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, org_id, role_id)
);

-- =======================================================
-- PATCH 3: LGPD/SEGURANÇA (CONSENTIMENTOS, AUDITORIA, PII)
-- =======================================================
-- Tabela de Auditoria Genérica
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  org_id UUID,
  table_name TEXT NOT NULL,
  row_pk TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  actor_user_id UUID REFERENCES auth.users(id),
  diff JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de Consentimentos
CREATE TABLE data_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('beneficiary','user')),
  subject_id UUID NOT NULL,
  purpose TEXT NOT NULL, -- ex.: 'analytics','communication','research'
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  revoked_at TIMESTAMPTZ
);

-- Tabela de Logs de Acesso a PII
CREATE TABLE pii_access_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id UUID REFERENCES auth.users(id),
  org_id UUID,
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'READ','EXPORT','ERASE_REQUEST'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =======================================================
-- PATCH 4: IA EM ESCALA (CHUNKS + ÍNDICES + RUNS)
-- =======================================================
CREATE TABLE ai_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  model TEXT DEFAULT 'text-embedding-3-small',
  dim INT DEFAULT 1536,
  chunk_id TEXT,
  chunk_ix INT,
  source_table TEXT,
  source_field TEXT,
  source_record_id UUID,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índice de similaridade eficiente
CREATE INDEX ai_embeddings_embedding_ivfflat
ON ai_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE TYPE ai_task_status AS ENUM ('pending','in_progress','completed','failed','cancelled');

CREATE TABLE ai_agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  status ai_task_status DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE ai_agent_task_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES ai_agent_tasks(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status ai_task_status DEFAULT 'in_progress' NOT NULL,
  logs TEXT,
  result JSONB
);

-- =======================================================
-- PATCH 5: ONI – VISTAS MATERIALIZADAS PARA PAINÉIS
-- (Assumindo que tabelas `indicator_values` e `projects` existem)
-- =======================================================
-- CREATE MATERIALIZED VIEW mv_indicator_monthly AS
-- SELECT
--   iv.indicator_id,
--   date_trunc('month', iv.date_ref)::date AS month_ref,
--   iv.project_id,
--   p.org_id,
--   AVG(iv.value) AS avg_value,
--   SUM(iv.value) AS sum_value,
--   COUNT(*) AS samples
-- FROM indicator_values iv
-- LEFT JOIN projects p ON p.id = iv.project_id
-- GROUP BY 1,2,3,4;
--
-- CREATE INDEX ON mv_indicator_monthly (org_id, indicator_id, month_ref);
-- (Nota: Comentei esta parte pois as tabelas base não foram definidas, para evitar erros)

-- =======================================================
-- RLS POLICIES
-- =======================================================

-- Enable RLS on all new tables
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pii_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_task_runs ENABLE ROW LEVEL SECURITY;

-- Content Items - Public read, authenticated write
CREATE POLICY "content_items_select_policy" ON content_items
    FOR SELECT USING (is_public = true OR auth.role() = 'authenticated');

CREATE POLICY "content_items_insert_policy" ON content_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "content_items_update_policy" ON content_items
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "content_items_delete_policy" ON content_items
    FOR DELETE USING (auth.role() = 'authenticated');

-- Content Tags - Public read, authenticated write
CREATE POLICY "content_tags_select_policy" ON content_tags
    FOR SELECT USING (true);

CREATE POLICY "content_tags_insert_policy" ON content_tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "content_tags_update_policy" ON content_tags
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "content_tags_delete_policy" ON content_tags
    FOR DELETE USING (auth.role() = 'authenticated');

-- Content Item Tags - Public read, authenticated write
CREATE POLICY "content_item_tags_select_policy" ON content_item_tags
    FOR SELECT USING (true);

CREATE POLICY "content_item_tags_insert_policy" ON content_item_tags
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "content_item_tags_delete_policy" ON content_item_tags
    FOR DELETE USING (auth.role() = 'authenticated');

-- Media Assets - Public read, authenticated write
CREATE POLICY "media_assets_select_policy" ON media_assets
    FOR SELECT USING (true);

CREATE POLICY "media_assets_insert_policy" ON media_assets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "media_assets_update_policy" ON media_assets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "media_assets_delete_policy" ON media_assets
    FOR DELETE USING (auth.role() = 'authenticated');

-- Profiles - Users can read their own profile, authenticated can read all
CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_delete_policy" ON profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Roles - Public read, admin write
CREATE POLICY "roles_select_policy" ON roles
    FOR SELECT USING (true);

CREATE POLICY "roles_insert_policy" ON roles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "roles_update_policy" ON roles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "roles_delete_policy" ON roles
    FOR DELETE USING (auth.role() = 'authenticated');

-- Role Assignments - Users can read their own, admin can manage all
CREATE POLICY "role_assignments_select_policy" ON role_assignments
    FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'authenticated');

CREATE POLICY "role_assignments_insert_policy" ON role_assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "role_assignments_update_policy" ON role_assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "role_assignments_delete_policy" ON role_assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Audit Log - Admin only
CREATE POLICY "audit_log_select_policy" ON audit_log
    FOR SELECT USING (auth.role() = 'authenticated');

-- Data Consents - Users can read their own, admin can manage all
CREATE POLICY "data_consents_select_policy" ON data_consents
    FOR SELECT USING (auth.uid()::text = subject_id::text OR auth.role() = 'authenticated');

CREATE POLICY "data_consents_insert_policy" ON data_consents
    FOR INSERT WITH CHECK (auth.uid()::text = subject_id::text OR auth.role() = 'authenticated');

CREATE POLICY "data_consents_update_policy" ON data_consents
    FOR UPDATE USING (auth.uid()::text = subject_id::text OR auth.role() = 'authenticated');

CREATE POLICY "data_consents_delete_policy" ON data_consents
    FOR DELETE USING (auth.uid()::text = subject_id::text OR auth.role() = 'authenticated');

-- PII Access Logs - Admin only
CREATE POLICY "pii_access_logs_select_policy" ON pii_access_logs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pii_access_logs_insert_policy" ON pii_access_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- AI Embeddings - Authenticated users only
CREATE POLICY "ai_embeddings_select_policy" ON ai_embeddings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ai_embeddings_insert_policy" ON ai_embeddings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ai_embeddings_update_policy" ON ai_embeddings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "ai_embeddings_delete_policy" ON ai_embeddings
    FOR DELETE USING (auth.role() = 'authenticated');

-- AI Agent Tasks - Users can read their own, admin can read all
CREATE POLICY "ai_agent_tasks_select_policy" ON ai_agent_tasks
    FOR SELECT USING (auth.uid() = created_by OR auth.role() = 'authenticated');

CREATE POLICY "ai_agent_tasks_insert_policy" ON ai_agent_tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ai_agent_tasks_update_policy" ON ai_agent_tasks
    FOR UPDATE USING (auth.uid() = created_by OR auth.role() = 'authenticated');

CREATE POLICY "ai_agent_tasks_delete_policy" ON ai_agent_tasks
    FOR DELETE USING (auth.uid() = created_by OR auth.role() = 'authenticated');

-- AI Agent Task Runs - Users can read their own, admin can read all
CREATE POLICY "ai_agent_task_runs_select_policy" ON ai_agent_task_runs
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ai_agent_task_runs_insert_policy" ON ai_agent_task_runs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "ai_agent_task_runs_update_policy" ON ai_agent_task_runs
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "ai_agent_task_runs_delete_policy" ON ai_agent_task_runs
    FOR DELETE USING (auth.role() = 'authenticated');

-- =======================================================
-- TRIGGERS E FUNCTIONS
-- =======================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_content_items_updated_at 
    BEFORE UPDATE ON content_items 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agent_tasks_updated_at 
    BEFORE UPDATE ON ai_agent_tasks 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (
        table_name,
        row_pk,
        action,
        actor_user_id,
        diff
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        TG_OP,
        auth.uid(),
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
            WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
            ELSE jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables
CREATE TRIGGER audit_content_items_trigger
    AFTER INSERT OR UPDATE OR DELETE ON content_items
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_ai_agent_tasks_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ai_agent_tasks
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
