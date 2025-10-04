-- Migration: RLS Policies
-- Description: Enables Row Level Security and creates security policies for Portal Manduvi
-- Date: 2025-01-04

-- Enable RLS on all tables
ALTER TABLE public.instituto_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituto_founders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituto_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituto_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editais_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (all tables are publicly readable)
-- Instituto Sections
CREATE POLICY "instituto_sections_select_policy" ON public.instituto_sections
    FOR SELECT USING (true);

-- Instituto Founders
CREATE POLICY "instituto_founders_select_policy" ON public.instituto_founders
    FOR SELECT USING (true);

-- Instituto Values
CREATE POLICY "instituto_values_select_policy" ON public.instituto_values
    FOR SELECT USING (true);

-- Instituto Projects
CREATE POLICY "instituto_projects_select_policy" ON public.instituto_projects
    FOR SELECT USING (true);

-- Initiatives
CREATE POLICY "initiatives_select_policy" ON public.initiatives
    FOR SELECT USING (true);

-- Sources
CREATE POLICY "sources_select_policy" ON public.sources
    FOR SELECT USING (true);

-- Articles
CREATE POLICY "articles_select_policy" ON public.articles
    FOR SELECT USING (true);

-- Editais Categories
CREATE POLICY "editais_categories_select_policy" ON public.editais_categories
    FOR SELECT USING (true);

-- Editais
CREATE POLICY "editais_select_policy" ON public.editais
    FOR SELECT USING (true);

-- Services
CREATE POLICY "services_select_policy" ON public.services
    FOR SELECT USING (true);

-- Datasets
CREATE POLICY "datasets_select_policy" ON public.datasets
    FOR SELECT USING (true);

-- Dataset Indicators
CREATE POLICY "dataset_indicators_select_policy" ON public.dataset_indicators
    FOR SELECT USING (true);

-- Banners
CREATE POLICY "banners_select_policy" ON public.banners
    FOR SELECT USING (true);

-- Create policies for authenticated users (insert, update, delete)
-- These policies assume you have a role-based system where authenticated users can manage content

-- Instituto Sections - Admin only
CREATE POLICY "instituto_sections_insert_policy" ON public.instituto_sections
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "instituto_sections_update_policy" ON public.instituto_sections
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "instituto_sections_delete_policy" ON public.instituto_sections
    FOR DELETE USING (auth.role() = 'authenticated');

-- Instituto Founders - Admin only
CREATE POLICY "instituto_founders_insert_policy" ON public.instituto_founders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "instituto_founders_update_policy" ON public.instituto_founders
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "instituto_founders_delete_policy" ON public.instituto_founders
    FOR DELETE USING (auth.role() = 'authenticated');

-- Instituto Values - Admin only
CREATE POLICY "instituto_values_insert_policy" ON public.instituto_values
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "instituto_values_update_policy" ON public.instituto_values
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "instituto_values_delete_policy" ON public.instituto_values
    FOR DELETE USING (auth.role() = 'authenticated');

-- Instituto Projects - Admin only
CREATE POLICY "instituto_projects_insert_policy" ON public.instituto_projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "instituto_projects_update_policy" ON public.instituto_projects
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "instituto_projects_delete_policy" ON public.instituto_projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Initiatives - Admin only
CREATE POLICY "initiatives_insert_policy" ON public.initiatives
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "initiatives_update_policy" ON public.initiatives
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "initiatives_delete_policy" ON public.initiatives
    FOR DELETE USING (auth.role() = 'authenticated');

-- Sources - Admin only
CREATE POLICY "sources_insert_policy" ON public.sources
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sources_update_policy" ON public.sources
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "sources_delete_policy" ON public.sources
    FOR DELETE USING (auth.role() = 'authenticated');

-- Articles - Admin only
CREATE POLICY "articles_insert_policy" ON public.articles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "articles_update_policy" ON public.articles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "articles_delete_policy" ON public.articles
    FOR DELETE USING (auth.role() = 'authenticated');

-- Editais Categories - Admin only
CREATE POLICY "editais_categories_insert_policy" ON public.editais_categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "editais_categories_update_policy" ON public.editais_categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "editais_categories_delete_policy" ON public.editais_categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Editais - Admin only
CREATE POLICY "editais_insert_policy" ON public.editais
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "editais_update_policy" ON public.editais
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "editais_delete_policy" ON public.editais
    FOR DELETE USING (auth.role() = 'authenticated');

-- Services - Admin only
CREATE POLICY "services_insert_policy" ON public.services
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "services_update_policy" ON public.services
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "services_delete_policy" ON public.services
    FOR DELETE USING (auth.role() = 'authenticated');

-- Datasets - Admin only
CREATE POLICY "datasets_insert_policy" ON public.datasets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "datasets_update_policy" ON public.datasets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "datasets_delete_policy" ON public.datasets
    FOR DELETE USING (auth.role() = 'authenticated');

-- Dataset Indicators - Admin only
CREATE POLICY "dataset_indicators_insert_policy" ON public.dataset_indicators
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "dataset_indicators_update_policy" ON public.dataset_indicators
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "dataset_indicators_delete_policy" ON public.dataset_indicators
    FOR DELETE USING (auth.role() = 'authenticated');

-- Banners - Admin only
CREATE POLICY "banners_insert_policy" ON public.banners
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "banners_update_policy" ON public.banners
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "banners_delete_policy" ON public.banners
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create a function to check if user is admin (you can customize this based on your auth system)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, we'll use a simple check
    -- You can modify this to check against a users table or JWT claims
    RETURN auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get current user ID
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to log user actions (optional)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "audit_log_select_policy" ON public.audit_log
    FOR SELECT USING (public.is_admin());

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_log (
        table_name,
        operation,
        old_data,
        new_data,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        public.get_current_user_id()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to important tables (optional - uncomment if you want audit logging)
-- CREATE TRIGGER audit_instituto_sections_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON public.instituto_sections
--     FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- CREATE TRIGGER audit_editais_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON public.editais
--     FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- CREATE TRIGGER audit_initiatives_trigger
--     AFTER INSERT OR UPDATE OR DELETE ON public.initiatives
--     FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();
