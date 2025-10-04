# 🏗️ DIAGRAMAS DE ARQUITETURA - PORTAL MANDUVI BACKEND

## 📊 Visão Geral da Arquitetura

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Portal Manduvi Frontend]
        B[Admin Dashboard]
        C[Mobile App]
    end
    
    subgraph "API Layer"
        D[Supabase REST API]
        E[Supabase GraphQL API]
        F[Edge Functions]
    end
    
    subgraph "Authentication Layer"
        G[Supabase Auth]
        H[Row Level Security]
        I[Role Management]
    end
    
    subgraph "Business Logic Layer"
        J[Content Management]
        K[AI Processing]
        L[Data Analysis]
        M[Audit System]
    end
    
    subgraph "Data Layer"
        N[PostgreSQL Database]
        O[Vector Database]
        P[File Storage]
    end
    
    subgraph "External Services"
        Q[OpenAI API]
        R[Email Service]
        S[Analytics]
    end
    
    A --> D
    B --> D
    C --> D
    D --> G
    E --> G
    F --> G
    G --> H
    H --> I
    I --> J
    J --> N
    K --> Q
    K --> O
    L --> N
    M --> N
    F --> Q
    D --> P
```

## 🔐 Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase Auth
    participant D as Database
    participant R as RLS Policies

    U->>F: Login Request
    F->>S: Authenticate
    S->>S: Validate Credentials
    S->>F: JWT Token
    F->>D: API Request with JWT
    D->>R: Check RLS Policies
    R->>D: Allow/Deny
    D->>F: Response
    F->>U: Data/Error
```

## 🤖 Sistema de IA

```mermaid
graph TB
    subgraph "Input Layer"
        A[Content Items]
        B[User Queries]
        C[Analysis Requests]
    end
    
    subgraph "Processing Layer"
        D[Text Chunking]
        E[Embedding Generation]
        F[Vector Storage]
        G[Similarity Search]
    end
    
    subgraph "AI Services"
        H[OpenAI API]
        I[Text Analysis]
        J[Content Categorization]
        K[Sentiment Analysis]
    end
    
    subgraph "Output Layer"
        L[Search Results]
        M[Content Recommendations]
        N[Analytics Reports]
        O[Insights Dashboard]
    end
    
    A --> D
    B --> G
    C --> I
    D --> E
    E --> F
    F --> G
    G --> L
    E --> H
    I --> H
    J --> H
    K --> H
    L --> M
    I --> N
    N --> O
```

## 🗄️ Estrutura do Banco de Dados

```mermaid
erDiagram
    content_items {
        uuid id PK
        uuid org_id FK
        text type
        text slug
        text title
        text excerpt
        text body
        text cover_url
        timestamptz published_at
        boolean is_public
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }
    
    content_tags {
        uuid id PK
        uuid org_id FK
        text name
        text slug
    }
    
    content_item_tags {
        uuid item_id FK
        uuid tag_id FK
    }
    
    profiles {
        uuid user_id PK,FK
        uuid org_id FK
        text full_name
        text avatar_url
        text locale
        timestamptz created_at
    }
    
    roles {
        uuid id PK
        text code UK
        text name
    }
    
    role_assignments {
        uuid id PK
        uuid user_id FK
        uuid org_id FK
        uuid role_id FK
        timestamptz created_at
    }
    
    ai_embeddings {
        uuid id PK
        uuid org_id FK
        text content
        vector embedding
        text model
        int dim
        text chunk_id
        int chunk_ix
        text source_table
        text source_field
        uuid source_record_id FK
        timestamptz created_at
    }
    
    ai_agent_tasks {
        uuid id PK
        uuid org_id FK
        uuid created_by FK
        text prompt
        text status
        timestamptz created_at
        timestamptz updated_at
    }
    
    audit_log {
        bigserial id PK
        uuid org_id FK
        text table_name
        text row_pk
        text action
        uuid actor_user_id FK
        jsonb diff
        timestamptz created_at
    }
    
    content_items ||--o{ content_item_tags : "has"
    content_tags ||--o{ content_item_tags : "tagged"
    content_items ||--o{ ai_embeddings : "generates"
    profiles ||--o{ role_assignments : "assigned"
    roles ||--o{ role_assignments : "defines"
    ai_agent_tasks ||--o{ ai_agent_task_runs : "executes"
```

## 🔄 Fluxo de Geração de Embeddings

```mermaid
flowchart TD
    A[Content Created/Updated] --> B[Trigger Activated]
    B --> C[Edge Function: generate-embeddings]
    C --> D[Text Chunking]
    D --> E[OpenAI API Call]
    E --> F[Embedding Generation]
    F --> G[Clean Old Embeddings]
    G --> H[Store New Embeddings]
    H --> I[Vector Index Update]
    I --> J[Ready for Search]
    
    K[User Search Query] --> L[Generate Query Embedding]
    L --> M[Vector Similarity Search]
    M --> N[Rank Results by Similarity]
    N --> O[Return Search Results]
```

## 🛡️ Sistema de Segurança

```mermaid
graph TB
    subgraph "Authentication"
        A[User Login]
        B[JWT Token]
        C[Session Management]
    end
    
    subgraph "Authorization"
        D[Role Check]
        E[Permission Validation]
        F[Organization Isolation]
    end
    
    subgraph "Data Protection"
        G[Row Level Security]
        H[Data Encryption]
        I[Audit Logging]
    end
    
    subgraph "Compliance"
        J[LGPD Compliance]
        K[Data Consent]
        L[PII Protection]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
```

## 📊 Monitoramento e Observabilidade

```mermaid
graph TB
    subgraph "Application Metrics"
        A[API Response Times]
        B[Error Rates]
        C[User Activity]
        D[Function Performance]
    end
    
    subgraph "Infrastructure Metrics"
        E[Database Performance]
        F[Memory Usage]
        G[CPU Utilization]
        H[Network I/O]
    end
    
    subgraph "Business Metrics"
        I[Content Views]
        J[Search Queries]
        K[AI Processing]
        L[User Engagement]
    end
    
    subgraph "Alerting"
        M[Error Alerts]
        N[Performance Alerts]
        O[Security Alerts]
        P[Business Alerts]
    end
    
    A --> M
    B --> M
    C --> L
    D --> N
    E --> N
    F --> N
    G --> N
    H --> N
    I --> P
    J --> P
    K --> P
    L --> P
```

## 🚀 Pipeline de Deploy

```mermaid
graph LR
    A[Code Commit] --> B[CI/CD Pipeline]
    B --> C[Run Tests]
    C --> D[Build Functions]
    D --> E[Deploy Migrations]
    E --> F[Deploy Functions]
    F --> G[Update Config]
    G --> H[Health Check]
    H --> I[Production Ready]
    
    J[Rollback] --> K[Previous Version]
    K --> L[Database Restore]
    L --> M[Function Restore]
```

## 🔧 Scripts de Verificação

```mermaid
graph TB
    subgraph "Schema Verification"
        A[verify_schema.mjs]
        B[Check Tables]
        C[Check Extensions]
        D[Check Functions]
        E[Check RLS Policies]
    end
    
    subgraph "Security Testing"
        F[verify_rls.mjs]
        G[Test Anonymous Access]
        H[Test Unauthorized Write]
        I[Test Organization Policies]
    end
    
    subgraph "Function Testing"
        J[verify_function.mjs]
        K[Test Edge Functions]
        L[Test OpenAI Integration]
        M[Test Embedding Generation]
    end
    
    subgraph "Configuration Testing"
        N[test_verify.mjs]
        O[Check Environment]
        P[Check Dependencies]
        Q[Check Connectivity]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    
    F --> G
    G --> H
    H --> I
    
    J --> K
    K --> L
    L --> M
    
    N --> O
    O --> P
    P --> Q
```

## 📈 Roadmap de Desenvolvimento

```mermaid
gantt
    title Portal Manduvi Backend Roadmap
    dateFormat  YYYY-MM-DD
    section Fase 1: Core
    Estrutura Base           :done,    core1, 2024-01-01, 2024-02-01
    Autenticação            :done,    core2, 2024-01-15, 2024-02-15
    RLS Policies            :done,    core3, 2024-02-01, 2024-03-01
    Edge Functions          :done,    core4, 2024-02-15, 2024-03-15
    Scripts Verificação     :done,    core5, 2024-03-01, 2024-03-31
    
    section Fase 2: IA Avançada
    Busca Semântica         :active,  ai1,   2024-04-01, 2024-05-01
    Análise Sentimento      :         ai2,   2024-04-15, 2024-05-15
    Categorização Auto      :         ai3,   2024-05-01, 2024-06-01
    Recomendações           :         ai4,   2024-05-15, 2024-06-15
    Dashboard Insights      :         ai5,   2024-06-01, 2024-07-01
    
    section Fase 3: Integrações
    Sistema Email           :         int1,  2024-07-01, 2024-08-01
    Google Analytics        :         int2,  2024-07-15, 2024-08-15
    API Terceiros           :         int3,  2024-08-01, 2024-09-01
    Webhooks                :         int4,  2024-08-15, 2024-09-15
    Exportação Dados        :         int5,  2024-09-01, 2024-10-01
    
    section Fase 4: Escalabilidade
    Cache Redis             :         scale1, 2024-10-01, 2024-11-01
    CDN Assets              :         scale2, 2024-10-15, 2024-11-15
    Load Balancing          :         scale3, 2024-11-01, 2024-12-01
    Monitoramento Avançado  :         scale4, 2024-11-15, 2024-12-15
    Backup Automatizado     :         scale5, 2024-12-01, 2025-01-01
```

## 🎯 Conclusão

Estes diagramas fornecem uma visão visual completa da arquitetura do Portal Manduvi Backend, mostrando:

- **Fluxos de dados** entre componentes
- **Relacionamentos** entre entidades do banco
- **Processos** de autenticação e autorização
- **Integrações** com serviços externos
- **Pipeline** de desenvolvimento e deploy
- **Roadmap** de evolução da plataforma

Cada diagrama pode ser usado para:
- **Documentação** técnica
- **Apresentações** para stakeholders
- **Planejamento** de desenvolvimento
- **Troubleshooting** de problemas
- **Onboarding** de novos desenvolvedores
