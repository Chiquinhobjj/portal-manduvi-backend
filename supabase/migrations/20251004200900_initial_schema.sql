-- Migration: Initial Schema
-- Description: Creates the core database schema for Portal Manduvi
-- Date: 2025-01-04

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Instituto Sections Table
CREATE TABLE IF NOT EXISTS public.instituto_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instituto Founders Table
CREATE TABLE IF NOT EXISTS public.instituto_founders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instituto Values Table
CREATE TABLE IF NOT EXISTS public.instituto_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon_name TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instituto Projects Table
CREATE TABLE IF NOT EXISTS public.instituto_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    beneficiaries INTEGER,
    start_year INTEGER,
    end_year INTEGER,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    image_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initiatives Table
CREATE TABLE IF NOT EXISTS public.initiatives (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    long_description TEXT,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    beneficiaries INTEGER DEFAULT 0,
    start_year INTEGER,
    end_year INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    image_url TEXT,
    ods_goals TEXT[],
    locations TEXT[],
    partners TEXT[],
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sources Table
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('rss', 'scraper', 'api', 'manual')),
    region TEXT DEFAULT 'MT',
    reliability_score INTEGER DEFAULT 50 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    rss_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
    last_fetch_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Articles Table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    lead TEXT,
    body TEXT,
    source_id UUID REFERENCES public.sources(id),
    published_at TIMESTAMPTZ NOT NULL,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    image_url TEXT,
    hash TEXT NOT NULL UNIQUE,
    is_opinion BOOLEAN DEFAULT FALSE,
    lang TEXT DEFAULT 'pt',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Editais Categories Table
CREATE TABLE IF NOT EXISTS public.editais_categories (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    parent_slug TEXT REFERENCES public.editais_categories(slug),
    icon TEXT,
    color TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Editais Table
CREATE TABLE IF NOT EXISTS public.editais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT NOT NULL,
    full_content TEXT,
    type TEXT NOT NULL CHECK (type IN ('licitacao', 'pregao', 'concurso', 'chamamento', 'credenciamento', 'financiamento', 'parceria', 'selecao', 'outro')),
    category_slug TEXT REFERENCES public.editais_categories(slug),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled', 'archived')),
    organization_name TEXT NOT NULL,
    organization_type TEXT,
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    opening_date TIMESTAMPTZ,
    closing_date TIMESTAMPTZ NOT NULL,
    result_date TIMESTAMPTZ,
    value_min NUMERIC,
    value_max NUMERIC,
    currency TEXT DEFAULT 'BRL',
    region TEXT,
    city TEXT,
    state TEXT,
    country TEXT DEFAULT 'Brasil',
    eligibility_criteria TEXT,
    evaluation_criteria TEXT,
    submission_instructions TEXT,
    terms_and_conditions TEXT,
    external_url TEXT,
    reference_number TEXT,
    year INTEGER,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    organization_logo TEXT,
    cover_image TEXT,
    gallery_images TEXT[],
    organization_cnpj TEXT,
    organization_website TEXT
);

-- Services Table
CREATE TABLE IF NOT EXISTS public.services (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    description TEXT,
    steps JSONB DEFAULT '[]',
    faq JSONB DEFAULT '[]',
    owner_org TEXT,
    category TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datasets Table
CREATE TABLE IF NOT EXISTS public.datasets (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    description TEXT,
    schema JSONB DEFAULT '{}',
    source_url TEXT,
    category TEXT,
    region TEXT DEFAULT 'MT',
    frequency TEXT,
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dataset Indicators Table
CREATE TABLE IF NOT EXISTS public.dataset_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_slug TEXT REFERENCES public.datasets(slug),
    indicator_key TEXT NOT NULL,
    label TEXT NOT NULL,
    value NUMERIC,
    unit TEXT,
    reference_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    description TEXT,
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON public.articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON public.articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_lang ON public.articles(lang);
CREATE INDEX IF NOT EXISTS idx_articles_is_opinion ON public.articles(is_opinion);
CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON public.articles USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_editais_status ON public.editais(status);
CREATE INDEX IF NOT EXISTS idx_editais_category_slug ON public.editais(category_slug);
CREATE INDEX IF NOT EXISTS idx_editais_closing_date ON public.editais(closing_date);
CREATE INDEX IF NOT EXISTS idx_editais_featured ON public.editais(featured);
CREATE INDEX IF NOT EXISTS idx_editais_title_trgm ON public.editais USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_initiatives_status ON public.initiatives(status);
CREATE INDEX IF NOT EXISTS idx_initiatives_featured ON public.initiatives(featured);
CREATE INDEX IF NOT EXISTS idx_initiatives_category ON public.initiatives(category);

CREATE INDEX IF NOT EXISTS idx_sources_status ON public.sources(status);
CREATE INDEX IF NOT EXISTS idx_sources_type ON public.sources(type);

CREATE INDEX IF NOT EXISTS idx_banners_is_active ON public.banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON public.banners(display_order);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_instituto_sections_updated_at 
    BEFORE UPDATE ON public.instituto_sections 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instituto_projects_updated_at 
    BEFORE UPDATE ON public.instituto_projects 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_initiatives_updated_at 
    BEFORE UPDATE ON public.initiatives 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sources_updated_at 
    BEFORE UPDATE ON public.sources 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_editais_categories_updated_at 
    BEFORE UPDATE ON public.editais_categories 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_editais_updated_at 
    BEFORE UPDATE ON public.editais 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON public.services 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banners_updated_at 
    BEFORE UPDATE ON public.banners 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
