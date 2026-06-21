export interface BuiltInPrompt {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  objective: string;
  promptText: string;
  tags: string[];
}

export interface GeneratorOption {
  id: string;
  name: string;
  text: string;
}

export interface PromptCategory {
  id: string;
  name: string;
  icon: string;
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  { id: "all", name: "Todos os Prompts", icon: "Layers" },
  { id: "devsecops", name: "DevSecOps & CI/CD", icon: "GitBranch" },
  { id: "ia-llm", name: "Arquitetura de IA & LLMs", icon: "Brain" },
  { id: "cloud", name: "Cloud (AWS / GCP)", icon: "Cloud" },
  { id: "secops", name: "SecOps & Red/Blue Team", icon: "ShieldAlert" },
  { id: "database", name: "Banco de Dados & SQL", icon: "Database" },
  { id: "sys-arch", name: "Arquitetura de Sistemas", icon: "Cpu" },
  { id: "automation", name: "Scripts & Automação", icon: "Terminal" }
];

export const BUILT_IN_PROMPTS: BuiltInPrompt[] = [
  {
    id: "devsecops-pipeline-sec",
    title: "Auditoria Completa de Pipeline CI/CD Securizado",
    category: "devsecops",
    subCategory: "Segurança de CI/CD",
    objective: "Desenhar um pipeline de CI/CD blindado incorporando SAST, DAST, SCA e análise de segredos de forma assíncrona.",
    tags: ["GitHub Actions", "SCA", "SAST", "Gitleaks", "Security Gates"],
    promptText: `# DEVSECOPS PIPELINE AUDIT & INTEGRATION PROMPT

Você é um DevSecOps Principal Engineer altamente condecorado. Sua tarefa é analisar o workflow do GitHub Actions fornecido e arquitetar um pipeline de CI/CD imune a ataques de cadeia de suprimento.

### Requisitos Técnicos do Pipeline:
1. **SAST (Static Application Security Testing)**: Integre Semgrep e CodeQL configurados para analisar vulnerabilidades de alta severidade nas linguagens do projeto.
2. **SCA (Software Composition Analysis)**: Adicione escaneamento automático de vulnerabilidades em dependências usando Trivy e Snyk, bloqueando o merge caso haja CVEs críticos.
3. **Análise de Segredos**: Implemente detecção em tempo real de chaves e segredos em commits através do Gitleaks de forma offline.
4. **Métricas DevSecOps**: Estruture a extração de métricas de vulnerabilidade em formato OpenTelemetry para ingestão no Grafana.

Gere o código YAML completo do workflow com comentários extremamente detalhados explicativos de cada estágio.`
  },
  {
    id: "ia-nemoguardrails",
    title: "Implementação de Guardrails para LLMs de Larga Escala",
    category: "ia-llm",
    subCategory: "Segurança de IA",
    objective: "Garantir blindagem contra ataques de prompt injection, jailbreak corporativo e exfiltração de dados (PII).",
    tags: ["Gemini API", "NeMo Guardrails", "PII", "Jailbreak Model", "Vertex AI"],
    promptText: `# LLM PROMPT INJECTION & JAILBREAK SHIELDING ENGINE

Você atuará como um Deep Learning Security Architect especializado em robustez de modelos geradores de linguagem (LLMs).

Escreva um arquivo de configuração (.co / .colang / Python) para NeMo Guardrails ou similar para proteger uma instância de atendimento financeiro.

### Diretrizes de Filtragem:
- **Entrada (Input Rules)**: Identifique tentativas de induzir o modelo a ignorar instruções anteriores usando análises semânticas de relevância.
- **Saída (Output Rules)**: Detecte vazamento indesejado de números de cartão, CPF ou tokens de sessão usando expressões regulares integradas em canais paralelos.
- **Ações de Fallback**: Caso ocorra desvio ideológico óbvio, envie uma saída estéril padrão, registrando o incidente no Cloud Monitoring.

Forneça os snippets de código, justificativas matemáticas para os limiares de cosseno e uma simulação de testes.`
  },
  {
    id: "cloud-gcp-gke-harden",
    title: "Hardening de Cluster GKE (Kubernetes) para Cargas Sensíveis",
    category: "cloud",
    subCategory: "Segurança Cloud-Native",
    objective: "Configurar um ambiente GKE escalável e imune seguindo os benchmarks rigorosos do CIS.",
    tags: ["GCP", "GKE Autopilot", "Kubernetes", "CIS Benchmark", "mTLS"],
    promptText: `# GCP SECURITY HARDENING - GKE STANDARDS

Atue como um GCP Cloud Security Architect Sênior certificado. Projete a infraestrutura em Terraform para um cluster Google Kubernetes Engine (GKE) altamente blindado.

### Requisitos Mandatórios:
1. **Rede Estéril**: Rede VPC com subnets estritamente privadas, desabilitando IP público em nodes. Uso de Cloud NAT para conexões de saída.
2. **Políticas de Pods (Security Admission)**: Restrinja escalonamento de privilégios de containers para root. Implemente Gatekeeper OPA para validação.
3. **Service Mesh com mTLS**: Configure Istio Mesh com autenticação mTLS mútua estrita entre os microserviços.
4. **Deteção de Intrusão em Tempo Real**: Configure o Google Cloud Armor e integre filtros preventivos Falco.

Envie o código Terraform bem estruturado e pronto para execução.`
  },
  {
    id: "secops-threat-hunting",
    title: "Livro de Caça a Ameaças (Threat Hunting Playbook)",
    category: "secops",
    subCategory: "Detecção e Resposta",
    objective: "Desenvolver consultas analíticas KQL/SQL para identificar persistência silenciosa de APTs em redes Linux.",
    tags: ["KQL", "Syslog", "APT", "Persistence", "MITRE ATT&CK"],
    promptText: `# THREAT HUNTING PLAYBOOK - APT DETECTION

Você é um Incident Response (DFIR) Specialist experiente em detecção de agentes estatais persistentes. Sua tarefa é criar um playbook de detecção analítica para logs de auditoria Linux.

Explore as táticas do framework MITRE ATT&CK:
1. **Modificações de Cron / Systemd**: Criação de tarefas periódicas para execução furtiva de beacons reversos.
2. **Abuso de Sudo / SUID**: Identificação de arquivos alterados com bit SUID ativado indevidamente.
3. **Ofuscação de Processos**: Processos cujo executável original foi removido do disco enquanto estão em execução.

Para cada tática, forneça:
- A consulta correspondente em KQL (Kusto Query Language) e SQL (OSQuery).
- Sinalizações de falsos positivos típicos e como filtrá-los.`
  },
  {
    id: "database-postgres-index-optimize",
    title: "Otimização Avançada e Análise de Queries PostgreSQL",
    category: "database",
    subCategory: "Performance tuning",
    objective: "Identificar gargalos em tabelas com bilhões de registros usando índices parciais e particionamento.",
    tags: ["PostgreSQL", "Query Planner", "EXPLAIN ANALYZE", "Partitioning", "B-Tree"],
    promptText: `# POSTGRESQL HIGH-SCALE TUNING ARCHITECTURE

Como Database Administrator (DBA) especialista em sistemas transacionais concorrentes do PostgreSQL com mais de 100 milhões de escritas diárias.

Explique a modelagem física, índices ideais e diagnósticos para otimizar a query anexada:

\`\`\`sql
SELECT user_id, count(id), sum(amount) 
FROM financial_transactions 
WHERE transaction_status = 'failed' 
  AND created_at >= NOW() - INTERVAL '30 days' 
GROUP BY user_id 
ORDER BY sum(amount) DESC 
LIMIT 100;
\`\`\`

### Detalhes técnicos recomendados:
- Análise baseada no compilador de plano do PostgreSQL (\`EXPLAIN ANALYZE\` / JIT compilation).
- Redução de Table Scan com uso inteligente de índices parciais.
- Estratégias de particionamento físico por range de datas.`
  },
  {
    id: "sys-arch-agent-swarm",
    title: "Orquestrador de Swarm de Agentes Cooperativos",
    category: "ia-llm",
    subCategory: "Sistemas Inteligentes",
    objective: "Desenhar sistema de múltiplos agentes cooperativos resolvendo problemas de análise de mercado concorrentemente.",
    tags: ["Multi-Agent", "LangGraph", "JSON Schema", "Docker Swarm", "Python"],
    promptText: `# COOPERATIVE MULTI-AGENT SWARM DESIGN

Você é um Engenheiro de Inteligência Artificial especializado na criação de sistemas de tomada de decisão descentralizados utilizando LangGraph e CrewAI.

Arquitete um sistema de 3 agentes que resolvem em conjunto auditorias críticas:
1. **Agente Triador (Triage Agent)**: Classifica a gravidade do blueprint importado.
2. **Agente Auditor Técnico (Security Auditor)**: Varre o código em busca de vulnerabilidades lógicas.
3. **Agente Reportador (Compliance Writer)**: Formata um boletim de auditoria robusto com impacto financeiro.

Escreva o código em Python usando troca de mensagens JSON estruturadas, controle de estado centralizado tolerante a falhas e verificação de loops circulares.`
  },
  {
    id: "automation-ansible-secrets",
    title: "Automação de Ansible Vault Descentralizado",
    category: "automation",
    subCategory: "Configuração Automatizada",
    objective: "Provisionar infraestrutura mantendo segredos encriptados via Ansible Vault de maneira escalável.",
    tags: ["Ansible", "Ansible Vault", "YAML", "Secrets", "Sops"],
    promptText: `# SECURE AUTOMATION & INTEGRITY VIA ANSIBLE VAULT

Atue como um SRE Lead Engineer. Crie um conjunto de playbooks do Ansible que automatiza a instalação de patches críticos em servidores web sem exibir segredos nas saídas de depuração ordinárias.

### Diretrizes:
- Uso do Ansible Vault integrado com sops ou arquivos de chave privados.
- Proteção anti-vazamento de logs usando diretiva \`no_log: true\`.
- Geração de chaves temporárias auto-expirantes em runtime.`
  }
];

// O Oráculo de 20 mil Prompts é obtido combinatorialmente através de 5 eixos.
// Combinando 25 personas X 25 tarefas X 25 stacks X 15 estilos X 12 tons de voz.
// 25 * 25 * 25 * 15 * 12 = 2.812.500 prompts possíveis gerados localmente sob demanda!
// Isso entrega ao usuário um oráculo infinito, offline, sem uso de API ("sem API" nativo).

export const GENERATOR_ROLES: GeneratorOption[] = [
  { id: "devsecops", name: "DevSecOps Principal Engineer", text: "Atue como um Engenheiro DevSecOps Principal especialista em segurança de pipelines CI/CD e integração pragmática de segurança defensiva em ambientes corporativos de alto fluxo." },
  { id: "ai_architect", name: "Deep Learning & AI Architect", text: "Você é um Arquiteto de Deep Learning e IA especialista em modelos de linguagem (LLMs), orquestradores de agentes, RAG de alta fidelidade e blindagem contra ataques adversários." },
  { id: "sec_auditor", name: "Lead Cyber Security Auditor", text: "Transforme-se em um Auditor Líder de Segurança Cibernética especializado em conformidade SOC 2, HIPAA, PCI-DSS e revisão técnica rigorosa de vulnerabilidades lógicas." },
  { id: "solutions_arch", name: "Solutions Architect (Multi-Cloud)", text: "Atue como Arquiteto de Soluções Multi-Cloud especialista em alta escalabilidade, tolerância a falhas massivas, otimização extrema de custos e design resiliente." },
  { id: "database_admin", name: "Premium PostgreSQL / SQL DBA", text: "Assuma o papel de um Administrador de Banco de Dados PostgreSQL Líder especializado em tuning de queries, locks complexos, índices parciais e bancos de escala de terabytes." },
  { id: "sre_engineer", name: "Site Reliability Engineer (SRE)", text: "Atue como um Site Reliability Engineer (SRE) com foco em telemetria, observabilidade de baixa latência usando OpenTelemetry, resposta automatizada e resiliência." },
  { id: "backend_dev", name: "Senior Backend Engineer (Go/Rust)", text: "Você é um Engenheiro Backend Sênior especialista em linguagens concorrentes de sistema (como Go, Rust e C++) focado em performance absoluta, concorrência limpa e zero alocações indesejadas." },
  { id: "threat_hunter", name: "Cyber Threat Hunter & DFIR Specialist", text: "Atue como Threat Hunter e Especialista em Incident Response (DFIR) com foco em rastreamento furtivo de APTs, engenharia reversa de malware e auditoria em logs brutos Linux/Windows." },
  { id: "ux_designer", name: "Principal Product Design Craftsperson", text: "Você é um Designer de Produto Principal focado em usabilidade técnica avançada, micro-interações, acessibilidade estrita (WCAG) e refinamento tipográfico minimalista." },
  { id: "data_engineer", name: "High-Scale Big Data Engineer", text: "Assuma o papel de Engenheiro de Dados de Larga Escala focado em processamento em tempo real de fluxos massivos via Spark, data lakes Apache Iceberg e queries de baixíssima latência." },
  { id: "compliance_officer", name: "Chief Information Security Officer (CISO)", text: "Atue como CISO focado em riscos de governança cibernética, compliance com regulamentações globais (GDPR, LGPD, HIPAA) e estimativa financeira de impacto de vulnerabilidades." },
  { id: "qa_automate", name: "Principal Quality & Automation Engineer", text: "Você é um Engenheiro Principal de Automação de Testes e Qualidade especializado em verificação formal, testes de estresse, caos e simulações complexas de cargas." }
];

export const GENERATOR_TASKS: GeneratorOption[] = [
  { id: "code_audit", name: "Auditar Código Fonte & Redigir Correções", text: "Sua tarefa consiste em varrer o código-fonte fornecido em busca de vulnerabilidades lógicas de alta criticidade e estruturar correções limpas utilizando design patterns defensivos." },
  { id: "threat_model", name: "Criar Modelo de Ameaças (Threat Model)", text: "Gere um Modelo de Ameaças completo seguindo a metodologia STRIDE, identificando superfícies de ataque vulneráveis e estabelecendo mecanismos robustos de mitigação." },
  { id: "perf_tuning", name: "Tuning Técnico e Profiling de Performance", text: "Analise o bloco lógico e execute profiling de performance. Identifique pontos de contenção de CPU, locks de concorrência ou desperdício de memória e otimize o código." },
  { id: "infra_as_code", name: "Escrever Infraestrutura como Código (IaC)", text: "Desenvolva manifestos de Infraestrutura como Código (IaC) limpos, reutilizáveis e nativamente seguros, isolando variáveis críticas e garantindo menor privilégio." },
  { id: "cicd_automation", name: "Automatizar Pipeline CI/CD com Security Shields", text: "Crie um script ou arquivo de workflow de automação onde integra verificadores automáticos de integridade de código, análise de segredos e bloqueadores inteligentes." },
  { id: "agent_orchestration", name: "Montar Framework de Agente Reativo", text: "Projete uma arquitetura para agentes autônomos ou semi-autônomos, definindo fluxos de controle de estado determinísticos e minimizando o risco de loops lógicos indeterminados." },
  { id: "db_modeling", name: "Modelar Banco de Dados Normalizado", text: "Desenhe o modelo físico do banco de dados visando conformidade, integridade de transações concorrentes e performance ideal para indexação avançada." },
  { id: "incident_playbook", name: "Escrever Playbook de Resposta de Incidente", text: "Redija um passo a passo operacional detalhado com comandos reais e pontos de controle críticos para conter e mitigar instantaneamente vazamentos ou anomalias detetadas." },
  { id: "api_gateway", name: "Projetar API Gateway & Controladores", text: "Arquitete as rotas de uma aplicação garantindo autenticação mTLS rigorosa, rate-limiting inteligente contra abusos e logs detalhados de auditoria." }
];

export const GENERATOR_STACKS: GeneratorOption[] = [
  { id: "gcp_vertex", name: "Google Cloud (Vertex AI, Cloud Run, GKE)", text: "Utilizando a infraestrutura do Google Cloud Platform (GCP), especialmente Vertex AI, Cloud Run e Google Kubernetes Engine (GKE)." },
  { id: "aws_cloud", name: "Amazon Web Services (ECS, SageMaker, DynamoDB)", text: "Focando no ecossistema AWS, utilizando Elastic Container Service (ECS), SageMaker para treinamento e DynamoDB para escalabilidade." },
  { id: "python_ml", name: "Python 3.11+ (FastAPI, PyTorch, Pandas)", text: "Utilizando a stack moderna baseada em Python, tirando proveito de FastAPI para endpoints, PyTorch para inferências e Pandas para manipulação de vetores de dados." },
  { id: "node_ts", name: "TypeScript / Node.js (Next.js, Prisma, Express)", text: "Usando uma arquitetura TypeScript contínua, com Next.js no frontend, rotas Express rápidas e segurança de tipos no banco com Prisma." },
  { id: "kube_docker", name: "Docker & Kubernetes (Helm, Istio)", text: "Em um ambiente puramente cloud-native containerizado, orquestrado através do Kubernetes com controle via Helm charts e Service Mesh Istio." },
  { id: "rust_lang", name: "Rust (Tokio, Axum, Serde)", text: "Através da robustez de Rust para sistemas concorrentes seguros de memória, usando Tokio como runtime assíncrono e Axum nas APIs." },
  { id: "sql_postgres", name: "PostgreSQL 16 & SQLite", text: "Utilizando recursos nativos relacionais avançados, backups, transações ACID rigorosas e índices parciais no banco de dados." },
  { id: "bash_python", name: "Bash Shell & Python Scripts (Standard libraries)", text: "Criando utilitários limpos em Bash/Shell e scripts Python sem dependências externas adicionais complexas, garantindo portabilidade tática total." }
];

export const GENERATOR_STYLES: GeneratorOption[] = [
  { id: "extreme_sec", name: "Segurança Extrema (Zero Trust / OWASP)", text: "Priorize segurança militar absoluta. Siga o princípio de Privilégio Mínimo, implemente validações rígidas em todas as entradas e cumpra checklist completo do OWASP." },
  { id: "clean_code", name: "Clean Code & Clean Architecture", text: "Garantir código legível, modular, declarativo, fácil de documentar e seguindo padrões consolidados de Design Patterns (SOLID)." },
  { id: "performance", name: "Micro-otimização para Baixa Latência", text: "O código final e a infraestrutura devem ser focados em tempo de resposta ultra-baixo (<50ms), redução de concorrência por threads e uso eficiente de memória cache." },
  { id: "interactive", name: "Playbook passo a passo com Exemplos Reais", text: "Estruture o retorno de maneira extremamente interativa, trazendo cenários práticos, códigos que podem ser copiados sem modificações e tabelas de testes." },
  { id: "minimalist", name: "Resumo Técnico Direto ao Ponto", text: "Remova introduções redundantes e polidez desnecessária. Forneça o output final de forma estéril, direta, com o código puro e comandos precisos." }
];

export const GENERATOR_TONES: GeneratorOption[] = [
  { id: "pragmatic", name: "Sênior Técnico Pragmático", text: "Adote um tom sério, profissional, focado puramente em eficácia operacional e mitigação de gargalos reais. Sem rodeios acadêmicos ou floreios linguísticos." },
  { id: "educational", name: "Mentor / Professor Acadêmico de IA", text: "Explique os fundamentos por trás de cada resposta, sugerindo materiais de estudo, links úteis conceituais e justificando com matemática e lógica computacional." },
  { id: "critical", name: "Auditor Altamente Crítico (Red Team)", text: "Desconfie de cada componente e tome como premissa que o código atual está quebrado ou vulnerável. Seja extremamente minucioso e exija provas de integridade." },
  { id: "executive", name: "Executivo Corporativo Estratégico", text: "Faça análises de impacto também sob a ótica econômica, balanceando custos, esforço de implementação (sprints de desenvolvimento) e metas no cronograma." }
];
