import { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FolderOpen, 
  File, 
  FileCode, 
  Terminal, 
  Database, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  Sparkles, 
  Cpu, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Square, 
  Copy, 
  Check, 
  FileJson, 
  HelpCircle, 
  Edit3, 
  FileText, 
  ExternalLink,
  ChevronRight,
  Info,
  Github,
  BookOpen,
  Search,
  Sliders,
  BookMarked
} from 'lucide-react';
import JSZip from 'jszip';

import { ProjectBlueprint } from './types';
import { 
  pythonCliAuditorBlueprint, 
  nodejsApiGatewayBlueprint, 
  emptyCustomBlueprintTemplate 
} from './templates';
import { flattenDirectoryTree, sanitizeBlueprintFiles, FlatFileNode } from './utils';
import { getTerminalSimulation, TerminalLine } from './terminalMocks';

// Prompt Library Imports
import {
  BUILT_IN_PROMPTS,
  PROMPT_CATEGORIES,
  GENERATOR_ROLES,
  GENERATOR_TASKS,
  GENERATOR_STACKS,
  GENERATOR_STYLES,
  GENERATOR_TONES,
  BuiltInPrompt
} from './promptLibraryData';

export default function App() {
  // Preset Blueprints
  const presets: Record<string, typeof pythonCliAuditorBlueprint> = {
    auditor: pythonCliAuditorBlueprint,
    gateway: nodejsApiGatewayBlueprint,
    custom: emptyCustomBlueprintTemplate
  };

  // State Management
  const [activePreset, setActivePreset] = useState<string>('auditor');
  const [blueprint, setBlueprint] = useState<ProjectBlueprint>(pythonCliAuditorBlueprint.blueprint);
  const [inputJson, setInputJson] = useState<string>(JSON.stringify(pythonCliAuditorBlueprint, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  // Custom Workspace States
  const [activeTab, setActiveTab] = useState<'intro' | 'code' | 'database' | 'security' | 'terminal' | 'tech' | 'library' | 'zip_importer'>('intro');
  const [activeFile, setActiveFile] = useState<string>('auditor_integridade.py');
  const [filesContent, setFilesContent] = useState<Record<string, string>>({});
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Prompt Library & Generator States
  const [promptSearch, setPromptSearch] = useState<string>('');
  const [promptCategory, setPromptCategory] = useState<string>('all');
  const [selectedPromptId, setSelectedPromptId] = useState<string>(BUILT_IN_PROMPTS[0].id);
  const [librarySubMode, setLibrarySubMode] = useState<'browse' | 'generator'>('browse');

  // Combinatorial Generator States
  const [genRole, setGenRole] = useState<string>(GENERATOR_ROLES[0].id);
  const [genTask, setGenTask] = useState<string>(GENERATOR_TASKS[0].id);
  const [genStack, setGenStack] = useState<string>(GENERATOR_STACKS[0].id);
  const [genStyle, setGenStyle] = useState<string>(GENERATOR_STYLES[0].id);
  const [genTone, setGenTone] = useState<string>(GENERATOR_TONES[0].id);
  const [customParams, setCustomParams] = useState<string>('Auditar integridade de endpoints e conformidade OWASP');
  
  // Inline Code Editing State
  const [editingCode, setEditingCode] = useState<string>('');
  const [isEdited, setIsEdited] = useState<boolean>(false);
  
  // AI Generator Fields
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [aiStep, setAiStep] = useState<string>('');

  // Terminal Simulator States
  const [isRunningTerminal, setIsRunningTerminal] = useState<boolean>(false);
  const [terminalLogs, setTerminalLogs] = useState<{ text: string; type: string }[]>([]);
  const [targetUrl, setTargetUrl] = useState<string>('site-publico-auditar.gov.br');
  const terminalLogsEndRef = useRef<HTMLDivElement | null>(null);

  // Copy Feedback state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // GitHub Integration States
  const [githubToken, setGithubToken] = useState<string | null>(() => localStorage.getItem('github_token'));
  const [showGithubModal, setShowGithubModal] = useState<boolean>(false);
  const [githubRepoName, setGithubRepoName] = useState<string>('');
  const [githubRepoDesc, setGithubRepoDesc] = useState<string>('');
  const [githubRepoPrivate, setGithubRepoPrivate] = useState<boolean>(false);
  const [isExportingGithub, setIsExportingGithub] = useState<boolean>(false);
  const [githubExportResult, setGithubExportResult] = useState<{ success: boolean; repoUrl?: string; error?: string } | null>(null);
  const [copiedCallback, setCopiedCallback] = useState<boolean>(false);

  // Dynamic local storage for custom client credentials
  const [customClientId, setCustomClientId] = useState<string>(() => localStorage.getItem('github_custom_client_id') || '');
  const [customClientSecret, setCustomClientSecret] = useState<string>(() => localStorage.getItem('github_custom_client_secret') || '');

  // ZIP Importer Integration States
  const [zipFiles, setZipFiles] = useState<Record<string, string>>({});
  const [zipFileName, setZipFileName] = useState<string>('');
  const [zipLoading, setZipLoading] = useState<boolean>(false);
  const [zipError, setZipError] = useState<string | null>(null);
  const [zipProjectName, setZipProjectName] = useState<string>('');
  const [zipProjectDesc, setZipProjectDesc] = useState<string>('');
  const [zipDetectedLang, setZipDetectedLang] = useState<string>('');
  const [zipGeneratedReadme, setZipGeneratedReadme] = useState<string>('');
  const [zipSelectedFile, setZipSelectedFile] = useState<string>('');
  const [isExportingZipGithub, setIsExportingZipGithub] = useState<boolean>(false);
  const [zipGithubExportResult, setZipGithubExportResult] = useState<{ success: boolean; repoUrl?: string; error?: string } | null>(null);
  const [zipRepoName, setZipRepoName] = useState<string>('');
  const [zipRepoDesc, setZipRepoDesc] = useState<string>('');
  const [zipRepoPrivate, setZipRepoPrivate] = useState<boolean>(false);

  const analyzeZipProject = (fileName: string, files: Record<string, string>) => {
    const filePaths = Object.keys(files);
    let detectedLang = 'Desconhecida';
    let systemType = 'Projeto Geral / Script';
    const techStack: string[] = [];

    const hasPackageJson = filePaths.some(p => p.endsWith('package.json'));
    const hasRequirementsTxt = filePaths.some(p => p.endsWith('requirements.txt'));
    const hasPyProject = filePaths.some(p => p.endsWith('pyproject.toml') || p.endsWith('setup.py'));
    const hasGoMod = filePaths.some(p => p.endsWith('go.mod') || p.endsWith('main.go'));
    const hasCargoToml = filePaths.some(p => p.endsWith('Cargo.toml'));
    const hasPomXml = filePaths.some(p => p.endsWith('pom.xml') || p.endsWith('build.gradle'));

    if (hasPackageJson) {
      detectedLang = 'TypeScript / JavaScript (Node.js)';
      systemType = 'Serviço Backend, Web App ou API';
      techStack.push('Node.js', 'npm');
      const pkgPath = filePaths.find(p => p.endsWith('package.json'));
      if (pkgPath && files[pkgPath]) {
        try {
          const pkg = JSON.parse(files[pkgPath]);
          if (pkg.dependencies) {
            Object.keys(pkg.dependencies).forEach(dep => techStack.push(dep));
          }
        } catch (e) {}
      }
    } else if (hasRequirementsTxt || hasPyProject) {
      detectedLang = 'Python';
      systemType = 'Script CLI, API FastAPI/Flask, ou Script de Auditoria';
      techStack.push('Python 3');
      const reqPath = filePaths.find(p => p.endsWith('requirements.txt'));
      if (reqPath && files[reqPath]) {
        const lines = files[reqPath].split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        lines.slice(0, 8).forEach(l => {
          const nameOnly = l.split('==')[0].split('>=')[0].trim();
          techStack.push(nameOnly);
        });
      }
    } else if (hasGoMod) {
      detectedLang = 'Go (Golang)';
      systemType = 'Microsserviço de Alta Performance, CLI ou Gateway de Segurança';
      techStack.push('Go Lang');
    } else if (hasCargoToml) {
      detectedLang = 'Rust';
      systemType = 'Sistemas de Alta Performance, Engine Criptográfica ou Driver de Rede';
      techStack.push('Rust Cargo');
    } else if (hasPomXml) {
      detectedLang = 'Java / Kotlin';
      systemType = 'Aplicação Corporativa, API Spring Boot ou Suite Integrada';
      techStack.push('JVM-based');
    }

    let projectNameGuess = fileName.replace(/\.zip$/i, '')
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();

    if (!projectNameGuess || projectNameGuess.toLowerCase() === 'archive') {
      projectNameGuess = 'Plataforma Inteligente de Segurança';
    }

    const fileCount = filePaths.length;
    const projectDesc = `Este software foi detectado como sendo do tipo [${systemType}]. Ele compreende um total de ${fileCount} arquivos/módulos mapeados fisicamente, permitindo auditoria detalhada, integrações eficientes e implantação facilitada.`;

    setZipProjectName(projectNameGuess);
    setZipProjectDesc(projectDesc);
    setZipDetectedLang(detectedLang);

    setZipRepoName(
      projectNameGuess
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_.-]+/g, '-')
        .substring(0, 80)
        .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
    );
    setZipRepoDesc(`Análise estruturada do projeto ${projectNameGuess} importado e auditado via ZIP de forma automatizada.`);

    let readmeText = ``;
    readmeText += `==========================================================\n`;
    readmeText += `   PROJETO RECONHECIDO AUTOMATICAMENTE - IMPORTE ZIP\n`;
    readmeText += `==========================================================\n\n`;
    readmeText += `# ${projectNameGuess}\n\n`;
    readmeText += `## 👁️ Visão Geral e Objetivo\n`;
    readmeText += `> **Linguagem Principal Detectada:** \`${detectedLang}\`\n`;
    readmeText += `> **Categoria Operacional:** \`${systemType}\`\n\n`;
    readmeText += `${projectDesc}\n\n`;

    readmeText += `## 🛠️ Tecnologias Identificadas & Ecossistema\n`;
    if (techStack.length > 0) {
      readmeText += `O projeto utiliza o seguinte conjunto de bibliotecas, runtimes e ferramentas estruturadas:\n\n`;
      techStack.forEach(t => {
        readmeText += `- **${t}**\n`;
      });
    } else {
      readmeText += `- **Tecnologia Padrão de Sistemas**\n`;
    }
    readmeText += `\n`;

    readmeText += `## 📂 Árvore de Arquivos e Diretórios Reconhecida\n`;
    readmeText += `Foram extraídos e catalogados ${fileCount} arquivos legíveis na árvore de exportação:\n\n`;

    const sortedPaths = [...filePaths].sort();
    sortedPaths.forEach(p => {
      readmeText += `- \`${p}\`\n`;
    });
    readmeText += `\n`;

    readmeText += `## 🚀 Guia de Configuração e Execução Inicial\n\n`;
    if (detectedLang.includes('Node.js') || hasPackageJson) {
      readmeText += `### Passo a Passo (Node.js):\n`;
      readmeText += `1. **Instalação das dependências:**\n   \`\`\`bash\n   npm install\n   \`\`\`\n`;
      readmeText += `2. **Executar em modo desenvolvimento:**\n   \`\`\`bash\n   npm run dev\n   \`\`\`\n`;
    } else if (detectedLang.includes('Python') || hasRequirementsTxt) {
      readmeText += `### Passo a Passo (Python):\n`;
      readmeText += `1. **Inicialize um ambiente virtual (Venv):**\n   \`\`\`bash\n   python3 -m venv venv\n   source venv/bin/activate\n   \`\`\`\n`;
      readmeText += `2. **Instale as dependências requisitadas:**\n   \`\`\`bash\n   pip install -r requirements.txt\n   \`\`\`\n`;
    } else {
      readmeText += `### Execução Genérica:\n`;
      readmeText += `1. Verifique se possui os runtimes de \`${detectedLang}\` instalados globalmente no sistema operacional.\n`;
    }

    readmeText += `\n---\n*README.md dinâmico gerado de forma totalmente autônoma pelo motor corretivo do Oráculo de Projetos.*`;

    setZipGeneratedReadme(readmeText);
  };

  const handleZipUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setZipFileName(file.name);
    setZipLoading(true);
    setZipError(null);
    setZipFiles({});
    setZipGeneratedReadme('');
    setZipProjectName('');
    setZipProjectDesc('');
    setZipDetectedLang('');
    setZipGithubExportResult(null);

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const parsedFiles: Record<string, string> = {};

      for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir) {
          try {
            const text = await zipEntry.async('string');
            parsedFiles[relativePath] = text;
          } catch (e) {
            console.warn(`Could not read file ${relativePath} as string.`);
          }
        }
      }

      if (Object.keys(parsedFiles).length === 0) {
        throw new Error('O arquivo ZIP está vazio ou não possui arquivos legíveis por texto.');
      }

      setZipFiles(parsedFiles);

      const firstFile = Object.keys(parsedFiles)[0];
      setZipSelectedFile(firstFile || '');

      analyzeZipProject(file.name, parsedFiles);

    } catch (err: any) {
      console.error(err);
      setZipError(err?.message || 'Erro ao descompactar ou ler o arquivo ZIP.');
    } finally {
      setZipLoading(false);
    }
  };

  const handleZipExportGitHub = async () => {
    if (!githubToken) return;
    setIsExportingZipGithub(true);
    setZipGithubExportResult(null);

    const zipBlueprintForExport = {
      projectName: zipProjectName || 'custom-imported-zip-project',
      objective: zipProjectDesc || 'Projeto importado por ZIP',
      bannerAscii: `   ______  _                 _ \n  |___  / (_)               | |\n     / /   _   _ __         | |\n    / /   | | | '_ \\     _  | |\n   / /__  | | | |_) |   | |_| |\n  /_____| |_| | .__/     \\___/ \n              | |              \n              |_|              `,
      technologies: {
        primaryLanguages: [zipDetectedLang || 'JavaScript/TypeScript'],
        databases: [],
        libraries: {
          standardLibrary: [],
          thirdParty: []
        }
      },
      filesContent: {
        ...zipFiles,
        'README.md': zipGeneratedReadme
      }
    };

    try {
      const response = await fetch('/api/github/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: githubToken,
          repoName: zipRepoName.trim(),
          description: zipRepoDesc.trim(),
          isPrivate: zipRepoPrivate,
          blueprint: zipBlueprintForExport
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || resData.details || 'Falha ao realizar a exportação para o GitHub.');
      }

      setZipGithubExportResult({
        success: true,
        repoUrl: resData.repoUrl
      });
    } catch (error: any) {
      console.error(error);
      setZipGithubExportResult({
        success: false,
        error: error.message || String(error)
      });
    } finally {
      setIsExportingZipGithub(false);
    }
  };

  // Landing Page and Domain Entry states
  const [isLandingPage, setIsLandingPage] = useState<boolean>(true);
  const [mainDomain, setMainDomain] = useState<string>(() => {
    const saved = localStorage.getItem('main_domain');
    return saved || window.location.origin;
  });

  // Sync Repo Name when blueprint changes
  useEffect(() => {
    if (blueprint && blueprint.projectName) {
      const normalized = blueprint.projectName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9_.-]+/g, '-')
        .replace(/-+/g, '-') // Reduz hifens múltiplos
        .substring(0, 80) // Limita a 80 caracteres para segurança no GitHub
        .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ''); // Remove símbolos das pontas (e.g. pontos ou hifens órfãos)
      setGithubRepoName(normalized);
      setGithubRepoDesc(blueprint.objective || blueprint.description || `Blueprint do projeto ${blueprint.projectName}`);
    }
  }, [blueprint]);

  // OAuth Popup Handler
  const handleConnectGitHub = async () => {
    try {
      // Build callback URI
      const callbackUri = `${window.location.origin}/auth/callback`;
      let url = `/api/auth/github/url?redirectUri=${encodeURIComponent(callbackUri)}`;
      if (customClientId) {
        url += `&clientId=${encodeURIComponent(customClientId)}`;
      }
      if (customClientSecret) {
        url += `&clientSecret=${encodeURIComponent(customClientSecret)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Não foi possível obter a URL de autorização do GitHub. Certifique-se de que o GITHUB_CLIENT_ID e GITHUB_CLIENT_SECRET estejam configurados.');
      }
      
      const { url: authUrl } = await response.json();
      
      // Open direct GitHub OAuth provider window
      const authWindow = window.open(
        authUrl,
        'github_oauth_popup',
        'width=600,height=750,resizable=yes,scrollbars=yes,status=yes'
      );

      if (!authWindow) {
        alert('O popup foi bloqueado pelo seu navegador. Por favor, autorize popups para este domínio para permitir a autenticação com o GitHub.');
      }
    } catch (error: any) {
      console.error(error);
      alert(`Falha ao conectar com o GitHub:\n${error.message}`);
    }
  };

  const handleDisconnectGitHub = () => {
    setGithubToken(null);
    localStorage.removeItem('github_token');
    setGithubExportResult(null);
  };

  // Helper compiler for Combinatorial Prompts (offline engine)
  const getCompiledPrompt = () => {
    const roleOpt = GENERATOR_ROLES.find(r => r.id === genRole) || GENERATOR_ROLES[0];
    const taskOpt = GENERATOR_TASKS.find(t => t.id === genTask) || GENERATOR_TASKS[0];
    const stackOpt = GENERATOR_STACKS.find(s => s.id === genStack) || GENERATOR_STACKS[0];
    const styleOpt = GENERATOR_STYLES.find(st => st.id === genStyle) || GENERATOR_STYLES[0];
    const toneOpt = GENERATOR_TONES.find(to => to.id === genTone) || GENERATOR_TONES[0];

    return `# ORÁCULO INTERATIVO DE PROMPTS — FÓRMULA COMPOSTA
# ID de Combinação: ORCL-${genRole.toUpperCase()}-${genTask.toUpperCase()}-${genStack.toUpperCase()}

## 1. DIRETRIZ DE IDENTIDADE & ENQUADRAMENTO
- **Role/Atuação**: ${roleOpt.name}
- ${roleOpt.text}

## 2. MISSÃO / OBJETIVO OPERACIONAL
- ${taskOpt.text}
${customParams ? `\n### PARÂMETROS / CONTEXTO ADICIONAL:\n> ${customParams}\n` : ''}
## 3. AMBIENTE TECNOLÓGICO & RESTRIÇÕES
- ${stackOpt.text}

## 4. DIRETRIZ DE ENTREGA E CONFIGURAÇÃO
- **Estilo**: ${styleOpt.text}
- **Tom de Execução**: ${toneOpt.text}

## 5. REQUISITO ADICIONAL DE SEGURANÇA
- Use exclusivamente ferramentas offline de verificação estática de código (SAST, SCA e linters).
- Garanta proteção rígida para chaves e variáveis sensíveis do ambiente, nunca revelando caminhos internos sensíveis.`;
  };

  const filteredPrompts = BUILT_IN_PROMPTS.filter(p => {
    const matchesCategory = promptCategory === 'all' || p.category === promptCategory;
    const matchesSearch = p.title.toLowerCase().includes(promptSearch.toLowerCase()) || 
                          p.objective.toLowerCase().includes(promptSearch.toLowerCase()) ||
                          p.tags.some(t => t.toLowerCase().includes(promptSearch.toLowerCase())) ||
                          p.promptText.toLowerCase().includes(promptSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedPrompt = BUILT_IN_PROMPTS.find(p => p.id === selectedPromptId) || BUILT_IN_PROMPTS[0];

  const handleExportGitHub = async () => {
    if (!githubToken) return;
    setIsExportingGithub(true);
    setGithubExportResult(null);

    try {
      const response = await fetch('/api/github/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: githubToken,
          repoName: githubRepoName.trim(),
          description: githubRepoDesc.trim(),
          isPrivate: githubRepoPrivate,
          blueprint
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || resData.details || 'Falha ao realizar a exportação para o GitHub.');
      }

      setGithubExportResult({
        success: true,
        repoUrl: resData.repoUrl
      });
    } catch (error: any) {
      console.error(error);
      setGithubExportResult({
        success: false,
        error: error.message || String(error)
      });
    } finally {
      setIsExportingGithub(false);
    }
  };

  // Listen for popup callback events
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const token = event.data?.accessToken;
        if (token) {
          setGithubToken(token);
          localStorage.setItem('github_token', token);
          setShowGithubModal(true); // Auto-open the configuration form overlay upon login
        }
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Load preset on initial mount and when preset changes
  useEffect(() => {
    const selected = presets[activePreset];
    if (selected) {
      setBlueprint(selected.blueprint);
      setInputJson(JSON.stringify(selected, null, 2));
      const sanitized = sanitizeBlueprintFiles(selected.blueprint);
      setFilesContent(sanitized);
      
      // Auto-set first available file
      const filePaths = Object.keys(sanitized);
      if (filePaths.length > 0) {
        setActiveFile(filePaths[0]);
        setEditingCode(sanitized[filePaths[0]] || '');
      }
      setJsonError(null);
    }
  }, [activePreset]);

  // Update active file editing code when switching files
  useEffect(() => {
    if (filesContent[activeFile] !== undefined) {
      setEditingCode(filesContent[activeFile]);
      setIsEdited(false);
    }
  }, [activeFile, filesContent]);

  // Scroll terminal logs to bottom
  useEffect(() => {
    if (terminalLogsEndRef.current) {
      terminalLogsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Sync editor back to filesContent state
  const handleSaveCodeCell = () => {
    setFilesContent(prev => ({
      ...prev,
      [activeFile]: editingCode
    }));
    setIsEdited(false);
    
    // Also inject back to the blueprint so download is updated
    setBlueprint(prev => {
      const updatedFiles = { ...prev.filesContent, [activeFile]: editingCode };
      return {
        ...prev,
        filesContent: updatedFiles
      };
    });
  };

  // Live JSON validation and loading
  const handleLoadCustomJson = (txt: string) => {
    setInputJson(txt);
    try {
      if (!txt.trim()) {
        setJsonError('O campo de JSON está vazio.');
        return;
      }
      const parsed = JSON.parse(txt);
      const targetBlueprint = parsed.blueprint || parsed;
      
      if (!targetBlueprint || !targetBlueprint.projectName) {
        setJsonError('JSON válido, mas não possui a chave primordial blueprint.projectName ou estrutura esperada.');
        return;
      }

      setBlueprint(targetBlueprint);
      const sanitized = sanitizeBlueprintFiles(targetBlueprint);
      setFilesContent(sanitized);
      
      const filePaths = Object.keys(sanitized);
      if (filePaths.length > 0) {
        setActiveFile(filePaths[0]);
        setEditingCode(sanitized[filePaths[0]] || '');
      }
      setJsonError(null);
    } catch (e: any) {
      setJsonError(`Erro de sintaxe JSON: ${e.message}`);
    }
  };

  // AI-Powered Blueprint Generation via local Server.ts + Gemini API Route
  const handleGenerateWithAi = async (offline: boolean = false) => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setAiStep(offline ? 'Acionando compilador local de alta robustez...' : 'Acionando o arquiteto inteligente...');
    
    try {
      setAiStep(offline ? 'Gerando chassi local estruturado...' : 'Consultando Gemini-3.5-Flash para projetar a infraestrutura...');
      const response = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt, offline })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errorMessage = errData.error && errData.details
          ? `${errData.error}\nDetalhes: ${errData.details}`
          : (errData.error || errData.details || 'Falha na comunicação.');
        throw new Error(errorMessage);
      }

      setAiStep('Recebendo e higienizando a árvore de diretórios do projeto...');
      const data = await response.json();
      
      const targetBlueprint = data.blueprint || data;
      if (!targetBlueprint || !targetBlueprint.projectName) {
        throw new Error('O modelo não retornou um blueprint estruturado de forma legível.');
      }

      setBlueprint(targetBlueprint);
      setInputJson(JSON.stringify(data, null, 2));
      
      const sanitized = sanitizeBlueprintFiles(targetBlueprint);
      setFilesContent(sanitized);
      
      const filePaths = Object.keys(sanitized);
      if (filePaths.length > 0) {
        setActiveFile(filePaths[0]);
        setEditingCode(sanitized[filePaths[0]] || '');
      }
      
      setJsonError(null);
      setActivePreset('custom_ai'); // temporary dynamic selection
      setAiPrompt('');
      setActiveTab('code');
    } catch (error: any) {
      console.error(error);
      alert(`Erro na Geração Inteligente:\n${error.message}`);
    } finally {
      setIsGenerating(false);
      setAiStep('');
    }
  };

  // Download entire nested structure as a ZIP file!
  const handleDownloadZip = async () => {
    const zip = new JSZip();
    
    // Add all compiled files mapped in filesContent
    Object.entries(filesContent).forEach(([filePath, content]) => {
      // Create subdirectories seamlessly based on slashes
      zip.file(filePath, content as string);
    });

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const sanitizedProjectName = blueprint.projectName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_');
      
      const fileName = `${sanitizedProjectName || 'blueprint'}_project.zip`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Impossível gerar o arquivo compactado virtual localmente.');
    }
  };

  // Run mock physical command simulation
  const handleStartSimulation = () => {
    setIsRunningTerminal(true);
    setTerminalLogs([]);
    
    const cliTool = blueprint.cli?.toolName || 'python3';
    const lines = getTerminalSimulation(
      blueprint.projectName,
      cliTool,
      blueprint.bannerAscii,
      targetUrl
    );

    let currentIndex = 0;

    const playNextLine = () => {
      if (currentIndex >= lines.length) {
        setIsRunningTerminal(false);
        return;
      }
      
      const nextLine = lines[currentIndex];
      setTerminalLogs(prev => [...prev, { text: nextLine.text, type: nextLine.type }]);
      currentIndex++;
      
      setTimeout(playNextLine, nextLine.delay);
    };

    playNextLine();
  };

  // Helper copy to clipboard
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Flatten active directory tree representation
  const directoryItems: FlatFileNode[] = blueprint.directoryTree 
    ? flattenDirectoryTree(blueprint.directoryTree) 
    : [];

  // Toggle collapses for paths
  const toggleFolder = (path: string) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Determine file-icon based on extension
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'py') return <FileCode className="w-4 h-4 text-emerald-400" />;
    if (ext === 'sh') return <Terminal className="w-4 h-4 text-amber-400" />;
    if (ext === 'js' || ext === 'ts' || ext === 'tsx') return <FileCode className="w-4 h-4 text-blue-400" />;
    if (ext === 'json') return <FileJson className="w-4 h-4 text-purple-400" />;
    if (ext === 'md') return <FileText className="w-4 h-4 text-cyan-400" />;
    if (ext === 'db' || ext === 'sqlite') return <Database className="w-4 h-4 text-emerald-500" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  if (isLandingPage) {
    return (
      <div className="min-h-screen bg-[#070b16] text-slate-100 selection:bg-indigo-500 selection:text-white flex flex-col font-sans">
        
        {/* LANDING TOP BAR */}
        <header className="border-b border-slate-800/80 bg-[#0c1225]/90 backdrop-blur md:sticky top-0 z-50 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg shadow-lg shadow-indigo-500/20">
                <Layers className="w-6 h-6 text-indigo-100" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-semibold">
                  Executor & Visualizador
                </span>
                <h1 className="text-lg font-display font-bold text-white tracking-tight -mt-0.5">
                  Blueprint Project Engine
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border border-slate-800 bg-slate-900/60 px-3 py-1.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-300">Status: Ativo</span>
              </div>
              <button
                id="launch-panel-top-btn"
                onClick={() => setIsLandingPage(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md shadow-indigo-950/40"
              >
                <span>Acessar Painel</span>
                <ChevronRight className="w-4 h-4 text-indigo-200" />
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION with main domain entry */}
        <section className="relative overflow-hidden py-14 border-b border-slate-800/50 bg-gradient-to-b from-[#0e162d]/45 to-transparent">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />

          <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/25 rounded-full text-indigo-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Desenvolvido de Forma Técnica por Ana Caroline Lamas
            </div>

            <h1 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto">
              Chassi de Código & Central de Auditoria <br />
              <span className="bg-gradient-to-r from-indigo-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent italic font-black">
                Executor & Blueprint Project Engine
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-350 max-w-3xl mx-auto leading-relaxed">
              Uma ferramenta pioneira e de alto rendimento projetada para orquestrar diretórios, chassis de código e logs de auditoria em conformidade cibernética sob o formato estruturado Blueprint.
            </p>

            {/* MAIN DOMAIN CONFIGURATION PANEL */}
            <div className="max-w-3xl mx-auto bg-slate-900/95 border border-indigo-950/60 rounded-2xl p-6 shadow-2xl mt-8 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                      Configurador de Domínio Ativo (OAuth GitHub)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Insira o link atual para gerar as credenciais exatas para preencher o formulário do desenvolvedor GitHub
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-500/30 font-mono">
                  Mapeamento Dinâmico
                </span>
              </div>

              <div className="space-y-4">
                {/* Domain Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 block">Insira o endereço (URL) da página atual:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mainDomain}
                      onChange={e => {
                        const val = e.target.value.trim();
                        setMainDomain(val);
                        localStorage.setItem('main_domain', val);
                      }}
                      placeholder="Ex: https://ais-dev-...us-west2.run.app"
                      className="flex-1 bg-[#0b0f19] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500 select-all"
                    />
                    <button
                      onClick={() => {
                        setMainDomain(window.location.origin);
                        localStorage.setItem('main_domain', window.location.origin);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-xs font-semibold border border-slate-750 transition"
                    >
                      Usar Link Atual
                    </button>
                  </div>
                </div>

                {/* Generated Fields Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* Homepage URL Card */}
                  <div className="bg-[#090d18] border border-slate-850 p-3.5 rounded-xl flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider block">Home URL (Página Inicial)</span>
                      <button
                        onClick={() => handleCopyToClipboard(mainDomain, 'homepage_copied')}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono transition"
                      >
                        {copiedText === 'homepage_copied' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'homepage_copied' ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <code className="text-xs text-slate-300 block truncate select-all bg-[#050810] p-2 border border-slate-900 rounded font-mono">
                      {mainDomain || 'Insira o link acima...'}
                    </code>
                  </div>

                  {/* Authorization Callback URL Card */}
                  <div className="bg-[#090d1b]/80 border border-emerald-950 p-3.5 rounded-xl flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">Authorization callback URL (Retorno)</span>
                      <button
                        onClick={() => handleCopyToClipboard(mainDomain ? `${mainDomain}/auth/callback` : '', 'callback_copied')}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition"
                      >
                        {copiedText === 'callback_copied' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'callback_copied' ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <code className="text-xs text-emerald-400 block truncate select-all bg-[#050810] p-2 border border-slate-900 rounded font-mono">
                      {mainDomain ? `${mainDomain}/auth/callback` : 'Insira o link acima...'}
                    </code>
                  </div>

                </div>

                <p className="text-[10.5px] text-slate-450 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-850">
                  💡 No cadastro do GitHub Developer (OAuth App), basta preencher os dois campos acima exatamente como calculados para evitar o erro de redirecionamento no fluxo de popups.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* DETAILED SALES & EXPLANATION CONTENT GIRD */}
        <section className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          
          {/* LEFT CHASSIS: VALUE PROPOSITION, WHY AND USE CASES */}
          <div className="md:col-span-7 space-y-8">
            
            {/* Why I Created This Tool */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <Cpu className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold font-display text-white">Por que criei esta ferramenta?</h2>
              </div>
              <p className="text-xs md:text-sm text-slate-350 leading-relaxed">
                Durante as minhas atividades de engenharia de software e modelagem lógica de segurança cibernética corporativa, a criação e verificação mecânica de chassis de código (scripts auxiliares estruturados com caminhos corretos, portas estritas e arquivos de rotas prontas) consome valiosas horas improdutivas.
              </p>
              <p className="text-xs md:text-sm text-slate-350 leading-relaxed">
                Eu desenvolvi o <strong>Executor & Blueprint Project Engine</strong> para solucionar esses gargalos táticos diários, permitindo que qualquer diagrama conceitual seja traduzido, simulado no terminal e exportado de forma estéril e descompactada em segundos sem riscos operacionais.
              </p>
            </div>

            {/* Learning Process & Insights */}
            <div className="space-y-3 border-t border-slate-850 pt-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold font-display text-white">Meus Maiores Aprendizados no Projeto</h2>
              </div>
              <div className="space-y-3.5 text-xs md:text-sm text-slate-350 leading-relaxed">
                <p>
                  A estruturação desta ferramenta exigiu consolidar múltiplos conceitos de ponta em engenharia full-stack e resiliência cibernética:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-400 text-xs">
                  <li>
                    <strong className="text-slate-200">Isomorfismo e Árvores JSON:</strong> Mapear recursões em árvores planas para renderizar arquivos locais e estruturar o gerador de arquivos instantâneo (.ZIP).
                  </li>
                  <li>
                    <strong className="text-slate-200">Segurança Ativa & Diretrizes OWASP:</strong> Criação de firewalls simulados, proxy APIs resilientes em Node/Python e gateways de contingência corporativos.
                  </li>
                  <li>
                    <strong className="text-slate-200">Fluxos Estritos de Popup OAuth:</strong> Integração sem estado do login com GitHub, contornando limitações de iFrames por meio de links dinâmicamente calculados e portas reversas estritas.
                  </li>
                </ul>
              </div>
            </div>

            {/* Daily Practical Value */}
            <div className="space-y-3 border-t border-slate-850 pt-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                  <Terminal className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold font-display text-white">Uso Diário no Trabalho (Ganho de Produtividade)</h2>
              </div>
              <p className="text-xs md:text-sm text-slate-350 leading-relaxed">
                No cotidiano corporativo, a plataforma substitui processos repetitivos de modelagem. Você pode carregar presets de fábrica (como o Auditor CLI Python ou API Proxy Gateway Node), acionar simulações físicas no console para depuração rápida e arquivar o chassi limpo para entrega de blueprints sem fricção.
              </p>
            </div>

          </div>

          {/* RIGHT CHASSIS: WHAT THE TOOL CAN DO, BIO, CTA BAR */}
          <div className="md:col-span-5 space-y-6">
            
            {/* What the Tool Can Do (Vantagens) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
              <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Capacidades Corporativas
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="text-indigo-400 font-bold mt-0.5">✔</span>
                  <div>
                    <strong className="text-slate-200 block">Navegação Gráfica de Tabelas SQL</strong>
                    <span className="text-slate-400">Inspeção instantânea de tabelas PostgreSQL/SQLite e colunas tipadas.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-indigo-400 font-bold mt-0.5">✔</span>
                  <div>
                    <strong className="text-slate-200 block">Auditorias de Linha de Comando Simuladas</strong>
                    <span className="text-slate-400">Terminal interativo para depurar segurança de URLs remotas em tempo real.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-indigo-400 font-bold mt-0.5">✔</span>
                  <div>
                    <strong className="text-slate-200 block">Exportação Descompactada Tática</strong>
                    <span className="text-slate-400">Download imediato de .ZIP ou deploy direto de repositórios ao GitHub em nuvem.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="text-indigo-400 font-bold mt-0.5">✔</span>
                  <div>
                    <strong className="text-slate-200 block">Motor Generativo IA</strong>
                    <span className="text-slate-400">Cria novos Blueprints do completo zero com pastas estruturadas a partir de simples prompts.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Author Portrait/Bio Contact */}
            <div className="bg-[#0b1022] border border-indigo-950/80 rounded-xl p-5 space-y-4 shadow-lg text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-emerald-400 p-0.5 shadow-xl flex items-center justify-center font-display font-black text-xl text-indigo-900">
                AL
              </div>
              
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white tracking-tight">Ana Caroline Lamas</h4>
                <p className="text-[11px] text-indigo-300 font-mono">Desenvolvedora Sênior de Projetos</p>
              </div>

              <div className="text-xs text-slate-400 leading-normal bg-slate-950/45 p-3 rounded-lg border border-slate-900">
                Entre em contato pelo WhatsApp oficial para suporte técnico, arquivamento de Blueprints ou customizações de software sob demanda.
              </div>

              <a 
                href="https://wa.me/5531972442973" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition active:scale-95 shadow-md shadow-emerald-950/20"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-250 inline-block animate-ping" />
                Falar no WhatsApp (+55 31 97244-2973)
              </a>
            </div>

          </div>

        </section>

        {/* BOTTOM ACTION WRAPPER TO LAUNCH THE TOOL */}
        <div className="bg-[#090d18] border-t border-slate-800/80 py-12 px-4 mt-auto">
          <div className="max-w-4xl mx-auto text-center space-y-5">
            <h3 className="text-lg md:text-xl font-bold text-white font-display">Tudo pronto para validar os seus chassis e arquiteturas?</h3>
            <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto">
              Acesse agora o painel integrado do motor e comece a exportar instantaneamente seus projetos.
            </p>
            
            <button
              id="landing-cta-btn"
              onClick={() => setIsLandingPage(false)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold font-display px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-950/50 active:scale-97 transition text-sm"
            >
              <span>INICIAR MOTOR DE PROJETO INTEGRADO</span>
              <span className="text-indigo-200">→</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-[#050810] px-4 py-4 text-center text-[11px] text-slate-500">
          <div>© 2026 Blueprint Project Engine • Ana Caroline Lamas (+55 31 97244-2973)</div>
        </footer>

      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. TOP BRAND HEADER */}
      <header className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur md:sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLandingPage(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 active:scale-95 shrink-0"
              title="Voltar para a página de Apresentação"
            >
              <span className="text-indigo-400 font-bold font-sans">←</span> Apresentação
            </button>
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-lg shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-semibold">
                  Executor & Visualizador de Projetos
                </span>
                <span className="bg-indigo-500/15 border border-indigo-500/30 text-[10px] font-mono px-1.5 py-0.2 rounded text-indigo-300">
                  v1.2.0
                </span>
              </div>
              <h1 className="text-xl font-display font-bold text-white tracking-tight -mt-0.5">
                Blueprint Project Engine
              </h1>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs text-slate-400 mr-2 uppercase font-mono tracking-wider hidden lg:block">Presets de fábrica:</span>
            <div className="flex gap-1.5 bg-slate-900/80 p-1 border border-slate-800 rounded-lg">
              <button
                id="preset-auditor-btn"
                onClick={() => setActivePreset('auditor')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activePreset === 'auditor' 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🛡️ Auditor CLI (Python)
              </button>
              <button
                id="preset-gateway-btn"
                onClick={() => setActivePreset('gateway')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activePreset === 'gateway' 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🕸️ API Proxy Gateway
              </button>
              <button
                id="preset-custom-btn"
                onClick={() => setActivePreset('custom')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  activePreset === 'custom' 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚙️ Estrutura Vazia
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CORE WORKSPACE */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT DECK (COLUMNS 1 TO 4): INPUT JSON & AI POWER */}
        <section className="lg:col-span-4 flex flex-col gap-5">
          
          {/* Categoria do Sistema Ativo */}
          <div className="bg-slate-900 border-2 border-indigo-500/30 rounded-xl p-4.5 shadow-xl flex flex-col gap-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 blur-xl pointer-events-none rounded-full" />
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">Classificação & Atributos</span>
              </div>
              <span className="text-[9.5px] bg-[#1a1236]/80 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded font-mono font-extrabold uppercase">
                {blueprint.metadata?.version || "v1.0.0"}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block tracking-wider mb-1">📂 Categoria do Sistema</span>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-2 leading-snug">
                  <span className="text-indigo-400 text-base">📌</span>
                  {blueprint.metadata?.classification || "MENU 02 — BLUEPRINT ACTOR"}
                </div>
              </div>

              {blueprint.metadata?.reclassification && (
                <div className="pt-2.5 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block tracking-wider mb-1">🏷️ Reclassificação</span>
                  <div className="text-xs font-semibold text-emerald-400 flex items-center gap-2">
                    <span className="text-sm">🏷️</span>
                    {blueprint.metadata.reclassification}
                  </div>
                </div>
              )}
            </div>

            {/* Local Fallback Contingency Alert */}
            {blueprint.metadata?.isLocalFallback && (
              <div className="mt-1 bg-amber-950/30 border border-amber-800/30 p-2.5 rounded-lg text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
                <span className="text-sm select-none mt-0.5">💡</span>
                <div>
                  <strong className="block text-amber-200">Geração de Contingência Ativa (Local)</strong>
                  {blueprint.metadata.fallbackExplanation || "Chassi local dinâmico ativado para contornar quotas temporárias."}
                </div>
              </div>
            )}
          </div>
          
          {/* AI Generator Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-xl pointer-events-none rounded-full" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-sm font-display font-semibold text-white">Geração Inteligente & Chassi de Alta Robustez</h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Você pode gerar uma ferramenta defensiva completa de duas formas. Use a inteligência artificial para flexibilidade e customizações, ou dispare o <strong>Compilador de Conformidade Offline (Sem IA)</strong> para gerar chassis cibernéticos instantâneos com arquivos cheios de códigos lógicos reais, URLs com barras, slashes e tabelas relacionais organizadas.
            </p>
            <div className="flex flex-col gap-2.5">
              <input
                id="prompt-ia-input"
                type="text"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Exemplo: Scanner de vulnerabilidades de portas, cofre de chaves..."
                disabled={isGenerating}
                onKeyDown={e => e.key === 'Enter' && handleGenerateWithAi(false)}
                className="w-full text-xs bg-[#0b0f19] border border-slate-800 rounded-lg px-3.5 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              
              <div className="flex flex-wrap gap-2.5">
                <button
                  id="generate-ia-btn"
                  onClick={() => handleGenerateWithAi(false)}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex-1 min-w-[130px] bg-indigo-600 hover:bg-indigo-505 text-indigo-100 px-4 py-2 text-xs font-semibold rounded-lg shadow disabled:opacity-40 flex items-center justify-center gap-2 transition"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-300" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-100" />
                  )}
                  Gerar com IA
                </button>
                
                <button
                  id="generate-offline-btn"
                  onClick={() => handleGenerateWithAi(true)}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className="flex-1 min-w-[170px] bg-slate-800 hover:bg-slate-705 border border-slate-700 hover:border-indigo-500/30 text-emerald-400 px-4 py-2 text-xs font-semibold rounded-lg shadow disabled:opacity-40 flex items-center justify-center gap-2 transition"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300" />
                  ) : (
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  Gerar Sem IA (Alta Robustez)
                </button>
              </div>
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2 bg-[#0b0f19]/80 border border-indigo-500/25 p-2.5 rounded-lg">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                <span className="text-[11px] font-mono text-indigo-300">{aiStep}</span>
              </div>
            )}
          </div>

          {/* Paste Real JSON Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4.5 h-4.5 text-indigo-400" />
                <h2 className="text-sm font-display font-semibold text-white">JSON Blueprint Direto</h2>
              </div>
              <button
                id="copy-json-btn"
                onClick={() => handleCopyToClipboard(inputJson, 'raw_json')}
                className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 transition"
                title="Copiar JSON Blueprint"
              >
                {copiedText === 'raw_json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px] font-mono">{copiedText === 'raw_json' ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modifique ou cole o JSON Blueprint gerado pelo seu assistente para renderizar suas especificações operacionais em tempo real.
            </p>
            <div className="relative">
              <textarea
                id="json-blueprint-textarea"
                rows={16}
                value={inputJson}
                onChange={e => handleLoadCustomJson(e.target.value)}
                placeholder="Insira o seu JSON de Blueprint aqui..."
                className="w-full text-[11px] font-mono bg-[#0b0f19] border border-slate-800 rounded-lg p-3 text-slate-300 placeholder:text-slate-700 leading-relaxed focus:outline-none focus:border-indigo-500"
              />
              {jsonError && (
                <div className="absolute bottom-2 left-2 right-2 bg-rose-950/90 border border-rose-800 rounded p-2 text-[10px] font-mono text-rose-300">
                  <div className="font-bold flex items-center gap-1 mb-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Detectamos inconsistências:
                  </div>
                  <p>{jsonError}</p>
                </div>
              )}
            </div>
            {!jsonError && (
              <div className="bg-emerald-950/30 border border-emerald-900/30 px-3 py-2 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-mono text-emerald-400">Blueprint verificado e ativo</span>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT DECK (COLUMNS 5 TO 12): THE INTERACTIVE ENGINE WORKSPACE */}
        <section className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col min-h-[700px]">
          
          {/* Workspace Title Ribbon */}
          <div className="bg-[#131b2e] border-b border-slate-800 px-5 py-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {blueprint.metadata?.classification && (
                  <div className="text-[10px] font-mono px-2 py-0.5 bg-indigo-950/80 border border-indigo-800/40 text-indigo-300 rounded shadow-sm uppercase font-semibold">
                    📌 Categoria: {blueprint.metadata.classification}
                  </div>
                )}
                {blueprint.metadata?.reclassification && (
                  <div className="text-[10px] font-mono px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/40 text-emerald-300 rounded shadow-sm uppercase font-semibold">
                    🏷️ Reclassificação: {blueprint.metadata.reclassification}
                  </div>
                )}
                {!blueprint.metadata?.classification && (
                  <div className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded shadow-sm uppercase font-semibold">
                    📌 CATEGORIA GERAL
                  </div>
                )}
              </div>
              <h2 className="text-md font-display font-bold text-white tracking-tight">
                {blueprint.projectName || "Projeto Ativo"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {blueprint.metadata?.projectType || "Tipo desconhecido"} • Versão {blueprint.metadata?.version || "1.0.0"}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                id="github-export-modal-btn"
                onClick={() => {
                  setGithubExportResult(null);
                  setShowGithubModal(true);
                }}
                className="bg-[#24292e] hover:bg-[#2f363d] text-white px-4 py-2 font-semibold rounded-lg text-xs flex items-center gap-2 transition duration-150 border border-[#444c56] shadow-md active:scale-95 shrink-0"
              >
                <Github className="w-4 h-4 text-slate-200" />
                <span>{githubToken ? "Exportar para o GitHub" : "Conectar GitHub"}</span>
              </button>

              <button
                id="zip-download-btn"
                onClick={handleDownloadZip}
                className="bg-emerald-600 hover:bg-emerald-500 text-emerald-50 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition"
              >
                <Download className="w-4 h-4 text-emerald-50" />
                Baixar Projeto Completo (.ZIP)
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-slate-800 bg-slate-900/50 flex overflow-x-auto whitespace-nowrap scrollbar-none">
            <button
              id="tab-intro-btn"
              onClick={() => setActiveTab('intro')}
              className={`px-5 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'intro' 
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Info className="w-4 h-4 text-indigo-500" />
              0. Apresentação & Configuração
            </button>
            <button
              id="tab-code-btn"
              onClick={() => setActiveTab('code')}
              className={`px-5 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
                activeTab === 'code' 
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              1. Navegador de Arquivos & Editor
            </button>
            <button
              id="tab-terminal-btn"
              onClick={() => setActiveTab('terminal')}
              className={`px-5 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
                activeTab === 'terminal' 
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              2. Terminal Simulado
            </button>
            <button
              id="tab-database-btn"
              onClick={() => setActiveTab('database')}
              className={`px-5 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
                activeTab === 'database' 
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
              disabled={!blueprint.database}
            >
              <Database className="w-4 h-4" />
              3. Esquema do Banco
              {!blueprint.database && <span className="text-[9px] text-slate-600">(Indisponível)</span>}
            </button>
            <button
              id="tab-security-btn"
              onClick={() => setActiveTab('security')}
              className={`px-5 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
                activeTab === 'security' 
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              4. Diretrizes & Segurança
            </button>
            <button
              id="tab-tech-btn"
              onClick={() => setActiveTab('tech')}
              className={`px-5 py-3 text-xs font-medium border-b-2 flex items-center gap-2 transition ${
                activeTab === 'tech' 
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              5. Pilha & Meta
            </button>
            <button
              id="tab-library-btn"
              onClick={() => setActiveTab('library')}
              className={`px-5 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'library' 
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              6. Biblioteca de Prompts (17k+)
            </button>
            <button
              id="tab-zip-importer-btn"
              onClick={() => setActiveTab('zip_importer')}
              className={`px-5 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition ${
                activeTab === 'zip_importer' 
                  ? 'border-indigo-500 text-indigo-400 bg-slate-800/40 font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Download className="w-4 h-4 text-sky-400 rotate-180" />
              7. Importador ZIP & README
            </button>
          </div>

          {/* 3. TAB WORKSPACES CONTENT */}
          <div className="flex-1 flex flex-col bg-[#0d1326]/35 rounded-b-xl overflow-hidden">
            
            {/* TAB 0: INTRO & APRESENTAÇÃO */}
            {activeTab === 'intro' && (
              <div className="flex-1 p-6 space-y-6 animate-fade-in text-left overflow-y-auto max-h-[680px]">
                
                {/* Hero Feature Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-[#111e3b] to-slate-900 border border-indigo-950/60 rounded-xl p-6 relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                  
                  <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                          Versão Estável 1.2
                        </span>
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3" /> Sistema Ativo
                        </span>
                      </div>
                      
                      <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
                        <Layers className="w-6 h-6 text-indigo-400" />
                        Executor & Blueprint Project Engine
                      </h1>
                      <p className="text-sm text-slate-350 max-w-2xl leading-relaxed">
                        Uma plataforma corporativa avançada desenvolvida para arquitetar, simular, depurar e exportar blueprints de sistemas robustos e auditorias de seguranças de alta criticidade.
                      </p>
                    </div>

                    <div className="bg-[#0c1221] border border-slate-800 p-4 rounded-xl min-w-[240px] shadow-md shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block mb-1">Autor da Ferramenta</span>
                      <div className="font-semibold text-indigo-300">Ana Caroline Lamas</div>
                      <a 
                        href="https://wa.me/5531972442973" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1.5 mt-2 transition hover:underline"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        +55 (31) 97244-2973
                        <ExternalLink className="w-3" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Extensive info of the tool */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                      <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide flex items-center gap-2 border-b border-slate-800 pb-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Capacidades Operacionais da Central
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 bg-[#0b0f19]/80 p-3.5 border border-slate-850/55 rounded-lg">
                          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5" />
                            1. Motor de Blueprint
                          </span>
                          <p className="text-[11.5px] text-slate-400 leading-relaxed">
                            Interpreta e sanitiza árvores recursivas estruturadas em formato JSON, gerando scripts funcionais, dependências de pacotes e bancos de dados locais.
                          </p>
                        </div>

                        <div className="space-y-1 bg-[#0b0f19]/80 p-3.5 border border-slate-850/55 rounded-lg">
                          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5" />
                            2. Terminal Executável
                          </span>
                          <p className="text-[11.5px] text-slate-400 leading-relaxed">
                            Simula a telemetria, logs de auditoria e contingências do CLI, permitindo inspecionar o comportamento tático em tempo de execução virtual.
                          </p>
                        </div>

                        <div className="space-y-1 bg-[#0b0f19]/80 p-3.5 border border-slate-850/55 rounded-lg">
                          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5" />
                            3. Inspetor de Esquemas
                          </span>
                          <p className="text-[11.5px] text-slate-400 leading-relaxed">
                            Visualize de forma gráfica todas as tabelas fisicas, colunas tipadas, restrições estruturais de integridade e índices rápidos em conformidade corporativa.
                          </p>
                        </div>

                        <div className="space-y-1 bg-[#0b0f19]/80 p-3.5 border border-slate-850/55 rounded-lg">
                          <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            4. Defesas e OWASP
                          </span>
                          <p className="text-[11.5px] text-slate-400 leading-relaxed">
                            Estruturação de defesas ativas de segurança contra vulnerabilidades em APIs públicas e alinhamento de headers de resiliência e criptografia.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Developer Statement Card */}
                    <div className="bg-slate-900/40 border border-slate-850 p-5 rounded-xl space-y-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-950/60 border border-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold font-mono rounded-lg">
                          CL
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Engenharia e Arquitetura de Software</div>
                          <div className="text-[11px] text-indigo-400 font-bold font-mono">Ana Caroline Lamas — Desenvolvedor Sênior</div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-400 leading-relaxed">
                        "O <strong>Executor & Blueprint Project Engine</strong> representa a convergência entre a governança cibernética estrita e o provisionamento ágil de arquitetura. Através desta ferramenta, garantimos que cada chassi de código, script secundário, rota e esquema de persistência seja formatado de acordo com as mais exigentes políticas de conformidade da atualidade."
                      </p>
                    </div>

                  </div>

                  {/* Right Column: Exact parameters for GitHub OAuth Application config */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-slate-900/90 border border-indigo-900/30 rounded-xl p-5 space-y-4">
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Github className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wide">
                            Registro de Aplicativo OAuth
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-450 leading-normal">
                          Para configurar os segredos com sucesso nas configurações do AI Studio ou locais, registre um novo aplicativo em <a href="https://github.com/settings/developers" target="_blank" rel="noopener" className="text-indigo-400 hover:underline inline-flex items-center gap-0.5">Developer Settings <ExternalLink className="w-2.5 h-2.5" /></a> informando exatamente os campos abaixo:
                        </p>
                      </div>

                      <div className="space-y-4">
                        
                        {/* 1. App Name */}
                        <div className="space-y-1 bg-[#090d18] border border-slate-850 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-slate-450 uppercase">Nome do aplicativo</span>
                            <button
                              onClick={() => handleCopyToClipboard('Executor & Blueprint Project Engine', 'app_name')}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              {copiedText === 'app_name' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              <span>{copiedText === 'app_name' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                          <div className="font-mono text-xs text-slate-200 mt-1 select-all break-all selection:bg-indigo-700">
                            Executor & Blueprint Project Engine
                          </div>
                        </div>

                        {/* 2. Homepage URL */}
                        <div className="space-y-1 bg-[#090d18] border border-slate-850 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-slate-450 uppercase">URL de Página Inicial (Homepage)</span>
                            <button
                              onClick={() => handleCopyToClipboard(window.location.origin, 'homepage_url')}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              {copiedText === 'homepage_url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              <span>{copiedText === 'homepage_url' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                          <div className="font-mono text-xs text-indigo-300 mt-1 select-all break-all selection:bg-indigo-700">
                            {window.location.origin}
                          </div>
                        </div>

                        {/* 3. Description (Optional but complete) */}
                        <div className="space-y-1 bg-[#090d18] border border-slate-850 p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-slate-450 uppercase">Descrição do aplicativo</span>
                            <button
                              onClick={() => handleCopyToClipboard('Plataforma modular de projeto, teste e empacotamento de Blueprints de Arquitetura de Software criados por Ana Caroline Lamas.', 'app_description')}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                            >
                              {copiedText === 'app_description' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              <span>{copiedText === 'app_description' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                          <div className="font-mono text-[11px] text-slate-300 mt-1 select-all selection:bg-indigo-700">
                            Plataforma modular de projeto, teste e empacotamento de Blueprints de Arquitetura de Software criados por Ana Caroline Lamas.
                          </div>
                        </div>

                        {/* 4. Callback URL (Critical!) */}
                        <div className="space-y-1 bg-[#090d1b] border border-emerald-950 p-3 rounded-lg ring-1 ring-emerald-500/10">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">URL de Retorno de Autorização</span>
                            <button
                              onClick={() => handleCopyToClipboard(`${window.location.origin}/auth/callback`, 'callback_url')}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                              {copiedText === 'callback_url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              <span>{copiedText === 'callback_url' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                          <div className="font-mono text-xs text-emerald-400 mt-1 select-all break-all selection:bg-emerald-800">
                            {window.location.origin}/auth/callback
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
                            ⚠️ Use exatamente o endereço acima no campo <strong>Authorization callback URL</strong> para que o login do popup retorne sem discrepâncias.
                          </p>
                        </div>

                      </div>

                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 1: FILE EXPLORER + INLINE SOURCE CODE EDITOR */}
            {activeTab === 'code' && (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
                
                {/* EXPLORER COLUMN (3 cols) */}
                <div className="md:col-span-4 border-r border-slate-800 bg-slate-900/60 flex flex-col justify-between">
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono tracking-wider text-slate-400 uppercase font-bold">Navegador de Pastas</span>
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-400 font-mono">
                      {Object.keys(filesContent).length} {Object.keys(filesContent).length === 1 ? 'arquivo' : 'arquivos'}
                    </span>
                  </div>

                  <div className="flex-1 p-2 overflow-y-auto space-y-1">
                    {directoryItems.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">Nenhum arquivo estruturado.</div>
                    ) : (
                      directoryItems.map((item, index) => {
                        const isSelected = activeFile === item.path;
                        const isDir = item.type === 'directory';
                        const isCollapsed = collapsedFolders[item.path];
                        
                        // Simple hide nested children of collapsed directories
                        let isParentCollapsed = false;
                        const parts = item.path.split('/');
                        if (parts.length > 1) {
                          for (let i = 1; i < parts.length; i++) {
                            const parentKey = parts.slice(0, i).join('/');
                            if (collapsedFolders[parentKey]) {
                              isParentCollapsed = true;
                              break;
                            }
                          }
                        }

                        if (isParentCollapsed) return null;

                        return (
                          <div
                            key={item.path}
                            style={{ paddingLeft: `${item.level * 12 + 6}px` }}
                            onClick={() => {
                              if (isDir) {
                                toggleFolder(item.path);
                              } else {
                                setActiveFile(item.path);
                              }
                            }}
                            className={`flex items-center gap-2 py-1.5 px-2 rounded text-xs cursor-pointer select-none transition group ${
                              isSelected 
                                ? 'bg-indigo-950/50 border border-indigo-900/50 text-indigo-300 font-medium' 
                                : isDir ? 'text-slate-300 hover:bg-slate-850/40' : 'text-slate-400 hover:bg-slate-850/40 hover:text-slate-200'
                            }`}
                          >
                            <span className="shrink-0">
                              {isDir ? (
                                isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 rotate-90 transition-transform" />
                              ) : (
                                <span className="w-3.5" />
                              )}
                            </span>
                            
                            <span className="shrink-0 -ml-1">
                              {isDir ? (
                                isCollapsed ? <Folder className="w-4 h-4 text-indigo-400" /> : <FolderOpen className="w-4 h-4 text-indigo-400" />
                              ) : (
                                getFileIcon(item.name)
                              )}
                            </span>

                            <div className="flex-1 truncate">
                              <div className="truncate font-mono">{item.name}</div>
                              {item.description && (
                                <div className="text-[10px] text-slate-500 truncate group-hover:text-slate-400 hidden md:block">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  <div className="p-3.5 bg-slate-900 border-t border-slate-850/65">
                    <div className="flex items-center gap-2 text-xs text-indigo-400">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      <span>Configure o arquivo clicando nele e baixando o zip!</span>
                    </div>
                  </div>
                </div>

                {/* EDITOR COLUMN (8 cols) */}
                <div className="md:col-span-8 flex flex-col bg-[#0b101e]/85">
                  
                  {/* Editor File Ribbon */}
                  <div className="bg-[#111827] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      {getFileIcon(activeFile)}
                      <span className="text-xs font-mono text-slate-200 font-semibold">{activeFile}</span>
                      {isEdited && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" title="Modificado - não salvo" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isEdited && (
                        <button
                          id="save-code-btn"
                          onClick={handleSaveCodeCell}
                          className="bg-indigo-600 hover:bg-indigo-500 text-indigo-100 text-[11px] px-2.5 py-1.5 rounded font-semibold flex items-center gap-1 transition"
                        >
                          <Edit3 className="w-3 h-3" />
                          Salvar Modificação
                        </button>
                      )}
                      <button
                        id="copy-file-btn"
                        onClick={() => handleCopyToClipboard(editingCode, 'active_code')}
                        className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1.5 border border-slate-800 rounded hover:bg-slate-800 transition flex items-center gap-1"
                        title="Copiar código"
                      >
                        {copiedText === 'active_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="text-[11px] font-mono">{copiedText === 'active_code' ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Editor Workspace */}
                  <div className="flex-1 flex flex-col relative overflow-hidden">
                    <div className="text-[10px] text-indigo-300/80 bg-slate-900/70 border-b border-slate-800/40 px-4 py-1.5 flex items-center gap-2 font-mono">
                      <span>✓ Edição ao vivo ativa: Sinta-se livre para customizar os códigos fonte do gerador!</span>
                    </div>

                    <div className="flex-1 flex overflow-y-auto">
                      {/* Simulated line numbers */}
                      <div className="bg-[#0b0f19] text-right font-mono text-[11px] text-slate-650 px-3 py-4 select-none border-r border-slate-850/60 flex flex-col sticky top-0 h-full w-12">
                        {Array.from({ length: Math.max(1, editingCode.split('\n').length) }).map((_, i) => (
                          <div key={i} className="leading-6 h-6">{i + 1}</div>
                        ))}
                      </div>

                      {/* Code Textarea Input */}
                      <textarea
                        id="code-editor-textarea"
                        value={editingCode}
                        onChange={e => {
                          setEditingCode(e.target.value);
                          setIsEdited(true);
                        }}
                        className="flex-1 bg-transparent border-0 outline-none text-[11px] font-mono text-slate-200 p-4 resize-none leading-6 min-h-[400px] h-full focus:ring-0 leading-relaxed overflow-x-auto w-full max-w-full block"
                        style={{ whiteSpace: "pre", wordBreak: "normal" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TERMINAL SIMULATOR */}
            {activeTab === 'terminal' && (
              <div className="flex-1 p-5 flex flex-col gap-4">
                
                {/* Terminal Controls Console */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-400">Instrução CMD:</div>
                    <code className="text-xs font-mono bg-slate-950 border border-slate-800 px-2 py-1.5 rounded text-indigo-300">
                      {blueprint.cli?.commandUsage || 'python auditor_integridade.py'}
                    </code>
                  </div>
                  
                  {blueprint.projectName.includes('Auditor') && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">Alvo IP/Host:</span>
                      <input
                        id="target-url-input"
                        type="text"
                        value={targetUrl}
                        onChange={e => setTargetUrl(e.target.value)}
                        placeholder="IP ou Domínio"
                        className="text-xs bg-[#0b0f19] border border-slate-850 px-2 py-1 rounded text-slate-200 focus:outline-none focus:border-indigo-500 w-44"
                      />
                    </div>
                  )}

                  <button
                    id="term-simulate-btn"
                    onClick={handleStartSimulation}
                    disabled={isRunningTerminal}
                    className="bg-indigo-600 hover:bg-indigo-500 text-indigo-50 text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 shadow transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 text-indigo-50 shrink-0" />
                    Executar Simulação
                  </button>
                </div>

                {/* Simulated Screen */}
                <div className="bg-[#040815] border border-slate-950 shadow-inner rounded-xl p-4 flex-1 font-mono text-xs flex flex-col justify-between overflow-hidden min-h-[380px]">
                  
                  <div className="space-y-1.5 overflow-y-auto max-h-[420px] flex-1">
                    {/* Shell Prompt Header if stagnant */}
                    {terminalLogs.length === 0 && (
                      <div className="text-slate-655 italic">
                        Clique em "Executar Simulação" acima para testar e validar o comportamento operacional da ferramenta em lote.
                      </div>
                    )}
                    
                    {terminalLogs.map((log, i) => {
                      let colorClass = 'text-slate-300';
                      if (log.type === 'input') colorClass = 'text-indigo-400 font-bold';
                      else if (log.type === 'success') colorClass = 'text-emerald-400';
                      else if (log.type === 'warn') colorClass = 'text-amber-400';
                      else if (log.type === 'error') colorClass = 'text-rose-400';
                      else if (log.type === 'info') colorClass = 'text-cyan-400';

                      return (
                        <div key={i} className={`whitespace-pre-wrap leading-relaxed ${colorClass}`}>
                          {log.type === 'input' && <span className="text-indigo-500 font-extrabold mr-1.5">~ $</span>}
                          {log.text}
                        </div>
                      );
                    })}

                    <div ref={terminalLogsEndRef} />
                  </div>

                  <div className="border-t border-slate-950/70 pt-2.5 mt-4 flex items-center justify-between text-[11px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Console virtual pronto</span>
                    </div>
                    <span>UTC: {new Date().toISOString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DATABASE SCHEMA VISUALIZER */}
            {activeTab === 'database' && blueprint.database && (
              <div className="flex-1 p-5 space-y-6 overflow-y-auto max-h-[680px]">
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Database className="w-7 h-7 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-display font-medium text-white">Relatório Técnico - Banco de Dados</h3>
                      <p className="text-xs text-slate-450 mt-1">
                        Especificações físicas das tabelas no SQLite local preenchidas no chassi.
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs bg-slate-950/80 border border-slate-850/50 p-2.5 rounded-lg space-y-1 font-mono text-slate-400 shrink-0">
                    <div><span className="text-indigo-400">Motor:</span> {blueprint.database.type} ({blueprint.database.engine})</div>
                    <div><span className="text-indigo-400">Aquivamento:</span> {blueprint.database.filePath}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {Object.entries((blueprint.database.tables || {}) as Record<string, any>).map(([tableName, table]) => (
                    <div key={tableName} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
                      
                      <div className="bg-[#131d35] border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-mono font-bold text-white uppercase">{tableName}</span>
                        </div>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                          {table.columns.length} colunas
                        </span>
                      </div>

                      <div className="p-3">
                        <p className="text-xs text-slate-400 mb-3 italic">{table.description}</p>
                        
                        <div className="space-y-2">
                          {table.columns.map((col, idx) => (
                            <div key={idx} className="bg-[#0b0f19] border border-slate-950 rounded p-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:border-slate-800/80 transition">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono font-semibold text-slate-200">{col.name}</span>
                                  <span className="text-[9px] bg-indigo-950 hover:bg-indigo-900 border border-indigo-900/40 text-indigo-300 font-mono px-1 rounded-sm">
                                    {col.type}
                                  </span>
                                  {col.constraints && (
                                    <span className="text-[9px] border border-amber-500/20 text-amber-500 font-mono px-1 rounded-sm">
                                      {col.constraints}
                                    </span>
                                  )}
                                </div>
                                {col.description && (
                                  <div className="text-[10px] text-slate-550 mt-0.5">{col.description}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {table.indexes && table.indexes.length > 0 && (
                        <div className="border-t border-slate-850 bg-slate-950/20 px-4 py-2.5 flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Índices rápidos:</span>
                          <div className="flex flex-wrap gap-1">
                            {table.indexes.map((idxName, i) => (
                              <span key={i} className="text-[9px] bg-slate-800/85 text-slate-400 font-mono px-1.5 py-0.2 rounded">
                                {idxName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: COMPLIANCE & SECURITY POLICIES */}
            {activeTab === 'security' && (
              <div className="flex-1 p-5 space-y-6 overflow-y-auto max-h-[680px]">
                
                {/* Header Summary */}
                <div className="bg-slate-900 border border-slate-840 rounded-xl p-4 flex items-center gap-3">
                  <ShieldAlert className="w-8 h-8 text-indigo-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-display font-medium text-white">Práticas de Higiene Digital e Conformidade</h3>
                    <p className="text-xs text-slate-450 mt-1">
                      Mapeamento das vulnerabilidades de rede investigadas pelo projeto, em conformidade com o framework defensivo do blueprint.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  {/* Controlled Vulnerabilities Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Vulns Mapeadas na Auditoria</h4>
                    <div className="space-y-2">
                      {blueprint.security?.controlledVulnerabilities ? (
                        blueprint.security.controlledVulnerabilities.map((vuln, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <span>{vuln}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 text-xs font-mono">Nenhuma vulnerabilidade cadastrada no blueprint.</div>
                      )}
                    </div>
                  </div>

                  {/* Mitigations Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Mapeamento de Remediações</h4>
                    <div className="space-y-2.5">
                      {blueprint.security?.mitigations ? (
                        blueprint.security.mitigations.map((nit, i) => (
                          <div key={i} className="bg-[#0b0f19] border border-slate-850 p-2.5 rounded-lg text-xs hover:border-slate-800 transition">
                            <div className="font-semibold text-slate-200">Ameaça: {nit.threat}</div>
                            <div className="text-emerald-400 mt-0.5 font-mono text-[11px]">Mitigação: {nit.mitigation}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 text-xs font-mono">Sem dados de mitigação listados no blueprint.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expected Response Headers Compliance Table */}
                {blueprint.security?.securityHeaders && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
                    <div className="bg-[#111c34] px-4 py-3 border-b border-slate-800">
                      <h4 className="text-xs font-mono font-bold uppercase text-white">OWASP Headers Exigidos e Alinhados</h4>
                    </div>
                    <div className="divide-y divide-slate-850">
                      {Object.entries((blueprint.security.securityHeaders || {}) as Record<string, any>).map(([headerName, header]) => (
                        <div key={headerName} className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 hover:bg-slate-850/15 transition">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-200">{headerName}</span>
                              {header.required && (
                                <span className="text-[9px] bg-red-950 border border-red-900/50 text-red-400 px-1.5 rounded-sm font-semibold uppercase">
                                  Obrigatório
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-450">{header.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {header.criticality && (
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                                header.criticality === 'CRITICA' || header.criticality === 'ALTA'
                                  ? 'bg-rose-950 text-rose-400'
                                  : 'bg-amber-950 text-amber-500'
                              }`}>
                                Criticidade {header.criticality}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: TECHSTACK METADATA */}
            {activeTab === 'tech' && (
              <div className="flex-1 p-5 space-y-6 overflow-y-auto max-h-[680px]">
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h3 className="text-sm font-display font-medium text-white mb-3">Especificações Tecnológicas</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    
                    <div className="bg-[#0b0f19] border border-slate-850 p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 tracking-wider font-mono uppercase font-semibold">Linguagens Primárias</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {blueprint.technologies?.primaryLanguages?.map((lang, idx) => (
                          <span key={idx} className="text-xs bg-slate-850 px-2 py-0.8 rounded font-mono text-slate-300">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#0b0f19] border border-slate-850 p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 tracking-wider font-mono uppercase font-semibold">Tecnologias de Banco</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {blueprint.technologies?.databases?.map((db, idx) => (
                          <span key={idx} className="text-xs bg-slate-850 px-2 py-0.8 rounded font-mono text-slate-300">
                            {db}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#0b0f19] border border-slate-850 p-3 rounded-lg flex flex-col gap-1">
                      <span className="text-[10px] text-slate-500 tracking-wider font-mono uppercase font-semibold">Frame / Concorrência</span>
                      <div className="text-xs font-mono font-medium text-indigo-400 mt-2">
                        {blueprint.technologies?.cliFramework ? `${blueprint.technologies.cliFramework} CLI` : 'N/A'} • {blueprint.technologies?.concurrencyModel || 'ThreadPoolExecutor'}
                      </div>
                    </div>
                  </div>
                </div>

                {blueprint.technologies?.libraries?.thirdParty && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow">
                    <div className="bg-[#111c34] px-4 py-3 border-b border-slate-850">
                      <h4 className="text-xs font-mono font-bold uppercase text-white">Dependências de Terceiros Alinhadas</h4>
                    </div>

                    <div className="divide-y divide-slate-850">
                      {blueprint.technologies.libraries.thirdParty.map((lib, idx) => (
                        <div key={idx} className="p-3 bg-[#0d1326]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-850/15 transition">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-200">{lib.name}</span>
                              <span className="text-[10px] bg-indigo-950/40 text-indigo-400 font-mono px-1.5 rounded">
                                {lib.version}
                              </span>
                            </div>
                            <p className="text-xs text-slate-450 mt-1">{lib.purpose}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Standard libraries */}
                {blueprint.technologies?.libraries?.standardLibrary && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 mb-3">Módulos Nativos Cooptados</h4>
                    <div className="flex flex-wrap gap-2">
                      {blueprint.technologies.libraries.standardLibrary.map((mod, i) => (
                        <span key={i} className="text-xs bg-[#0b0f19] border border-slate-850 text-slate-400 px-3 py-1 rounded font-mono">
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: BIBLIOTECA DE PROMPTS (17k+ COMBINAÇÕES) */}
            {activeTab === 'library' && (
              <div className="flex-grow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-850 h-auto md:h-[680px] overflow-visible md:overflow-hidden text-left bg-slate-950/20">
                {/* Lateral Control Panel */}
                <div className="w-full md:w-80 flex flex-col bg-[#080d19]/80 shrink-0 h-[400px] md:h-full">
                  <div className="p-4 border-b border-slate-850">
                    <div className="flex items-center gap-2 text-white mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider">Modo de Operação</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-850 rounded-lg">
                      <button
                        onClick={() => setLibrarySubMode('browse')}
                        className={`py-1.5 text-[11px] font-semibold rounded transition flex items-center justify-center gap-1.5 ${
                          librarySubMode === 'browse'
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <BookMarked className="w-3.5 h-3.5" />
                        Curados
                      </button>
                      <button
                        onClick={() => setLibrarySubMode('generator')}
                        className={`py-1.5 text-[11px] font-semibold rounded transition flex items-center justify-center gap-1.5 ${
                          librarySubMode === 'generator'
                            ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Super Gerador
                      </button>
                    </div>
                  </div>

                  {librarySubMode === 'browse' ? (
                    /* BROWSE MODE CONTROLS */
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Search Bar */}
                      <div className="p-3 border-b border-slate-850 bg-slate-900/10">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar prompts ou tags..."
                            value={promptSearch}
                            onChange={(e) => setPromptSearch(e.target.value)}
                            className="w-full bg-[#05080f] border border-slate-800 rounded-lg text-xs py-1.5 pl-8 pr-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500/70"
                          />
                        </div>
                      </div>

                      {/* Categories List */}
                      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 scrollbar-thin">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500 p-2 block mr-auto">Categorias</span>
                        {PROMPT_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setPromptCategory(cat.id)}
                            className={`w-full text-left px-2.5 py-2 text-xs rounded-lg flex items-center justify-between gap-2 transition ${
                              promptCategory === cat.id
                                ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/30 font-medium'
                                : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              {cat.id === 'all' && <Layers className="w-3.5 h-3.5" />}
                              {cat.id === 'devsecops' && <FolderOpen className="w-3.5 h-3.5" />}
                              {cat.id === 'ia-llm' && <Cpu className="w-3.5 h-3.5" />}
                              {cat.id === 'cloud' && <Cpu className="w-3.5 h-3.5 text-sky-400" />}
                              {cat.id === 'secops' && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                              {cat.id === 'database' && <Database className="w-3.5 h-3.5 text-emerald-400" />}
                              {cat.id === 'sys-arch' && <Cpu className="w-3.5 h-3.5 text-amber-400" />}
                              {cat.id === 'automation' && <Terminal className="w-3.5 h-3.5" />}
                              {cat.name}
                            </span>
                            <span className="text-[10px] bg-slate-950/80 px-1.5 py-0.2 rounded font-mono text-slate-500">
                              {cat.id === 'all' 
                                ? BUILT_IN_PROMPTS.length
                                : BUILT_IN_PROMPTS.filter(p => p.category === cat.id).length
                              }
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* GENERATOR MODE CONTROLS */
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">1. Persona / Papel</label>
                        <select
                          value={genRole}
                          onChange={(e) => setGenRole(e.target.value)}
                          className="w-full bg-[#05080f] border border-slate-800 rounded-lg text-xs p-2 text-white outline-none focus:border-emerald-500/70 font-display"
                        >
                          {GENERATOR_ROLES.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">2. Objetivo Operacional</label>
                        <select
                          value={genTask}
                          onChange={(e) => setGenTask(e.target.value)}
                          className="w-full bg-[#05080f] border border-slate-800 rounded-lg text-xs p-2 text-white outline-none focus:border-emerald-500/70 font-display"
                        >
                          {GENERATOR_TASKS.map(task => (
                            <option key={task.id} value={task.id}>{task.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">3. Stack de Tecnologia</label>
                        <select
                          value={genStack}
                          onChange={(e) => setGenStack(e.target.value)}
                          className="w-full bg-[#05080f] border border-slate-800 rounded-lg text-xs p-2 text-white outline-none focus:border-emerald-500/70 font-display"
                        >
                          {GENERATOR_STACKS.map(stack => (
                            <option key={stack.id} value={stack.id}>{stack.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">4. Filosofia de Entrega</label>
                        <select
                          value={genStyle}
                          onChange={(e) => setGenStyle(e.target.value)}
                          className="w-full bg-[#05080f] border border-slate-800 rounded-lg text-xs p-2 text-white outline-none focus:border-emerald-500/70 font-display"
                        >
                          {GENERATOR_STYLES.map(st => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">5. Tom do Consultor</label>
                        <select
                          value={genTone}
                          onChange={(e) => setGenTone(e.target.value)}
                          className="w-full bg-[#05080f] border border-slate-800 rounded-lg text-xs p-2 text-white outline-none focus:border-emerald-500/70 font-display"
                        >
                          {GENERATOR_TONES.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450 block">Customizar Escopo (Variável)</label>
                        <textarea
                          rows={2}
                          value={customParams}
                          onChange={(e) => setCustomParams(e.target.value)}
                          placeholder="Ex: Auditoria do microsserviço de autenticação ou banco de dados..."
                          className="w-full bg-[#05080f] border border-slate-800 rounded-lg text-xs p-2 text-white outline-none focus:border-emerald-500/70 resize-none placeholder-slate-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Content Area */}
                <div className="flex-grow flex flex-col md:flex-row overflow-hidden bg-[#060a13]/90 h-[550px] md:h-full">
                  {librarySubMode === 'browse' ? (
                    <>
                      {/* List of Filtered Prompts */}
                      <div className="w-full md:w-80 border-r border-slate-850 flex flex-col h-1/2 md:h-full overflow-hidden shrink-0">
                        <div className="p-3 bg-slate-900/30 border-b border-slate-850 shrink-0 flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase mr-auto">Modelos Curados ({filteredPrompts.length})</span>
                        </div>
                        <div className="flex-grow overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                          {filteredPrompts.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-500 italic mt-8">
                              Nenhum prompt condizente encontrado.
                            </div>
                          ) : (
                            filteredPrompts.map(p => (
                              <button
                                key={p.id}
                                onClick={() => setSelectedPromptId(p.id)}
                                className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 ${
                                  selectedPromptId === p.id
                                    ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md'
                                    : 'bg-slate-900/10 border-slate-850/40 hover:border-slate-850'
                                }`}
                              >
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                  selectedPromptId === p.id ? 'text-indigo-400' : 'text-slate-400'
                                }`}>
                                  {p.subCategory}
                                </span>
                                <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2">
                                  {p.title}
                                </h4>
                                <p className="text-[10.5px] text-slate-400 line-clamp-2 leading-relaxed">
                                  {p.objective}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {p.tags.slice(0, 3).map((tag, i) => (
                                    <span key={i} className="text-[8.5px] font-mono px-1.5 py-0.2 bg-slate-950 text-slate-500 rounded border border-slate-900">
                                      {tag}
                                    </span>
                                  ))}
                                  {p.tags.length > 3 && (
                                    <span className="text-[8.5px] font-mono text-indigo-400 self-center">+{p.tags.length - 3}</span>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Prompt Viewer Screen */}
                      <div className="flex-1 flex flex-col overflow-hidden h-1/2 md:h-full bg-slate-950/30">
                        {selectedPrompt ? (
                          <div className="flex-grow flex flex-col overflow-hidden">
                            {/* Card Header Info */}
                            <div className="p-5 border-b border-slate-850 bg-slate-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                                    {selectedPrompt.category.toUpperCase()}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {selectedPrompt.subCategory}
                                  </span>
                                </div>
                                <h3 className="text-sm font-bold text-white font-display leading-tight">{selectedPrompt.title}</h3>
                                <p className="text-xs text-slate-450 leading-relaxed max-w-2xl">{selectedPrompt.objective}</p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedPrompt.promptText);
                                    setCopiedText(`prompt-${selectedPrompt.id}`);
                                    setTimeout(() => setCopiedText(null), 2500);
                                  }}
                                  className="px-3 py-1.5 rounded bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-xs text-indigo-300 font-semibold flex items-center gap-1.5 transition active:scale-95"
                                >
                                  {copiedText === `prompt-${selectedPrompt.id}` ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-emerald-400">Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setAiPrompt(selectedPrompt.promptText);
                                    setActiveTab('intro');
                                  }}
                                  className="px-3 py-1.5 rounded bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-xs text-emerald-300 font-semibold flex items-center gap-1.5 transition active:scale-95"
                                  title="Carrega este prompt no gerador do assistente"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Carregar</span>
                                </button>
                              </div>
                            </div>

                            {/* Prompt Render Slate */}
                            <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                              <div className="bg-[#040810] border border-slate-850/50 rounded-xl p-5 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all relative group max-w-4xl mx-auto shadow-inner">
                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] bg-slate-900 border border-slate-850 px-2 py-1 text-slate-500 rounded">Duplo clique seleciona tudo</span>
                                </div>
                                {selectedPrompt.promptText}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-grow flex items-center justify-center p-6 text-slate-500 text-xs italic">
                            Selecione um prompt na lista lateral para visualizar as diretivas completas.
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    /* DYNAMIC ENGINE WRAPPER */
                    <div className="flex-grow flex flex-col overflow-hidden">
                      {/* Generator Heading Header */}
                      <div className="p-5 border-b border-slate-850 bg-slate-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                              Motor Combinatório
                            </span>
                            <span className="text-[10.5px] text-slate-450 font-mono">
                              17.280+ composições possíveis
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-white font-display">Gerador de Prompt Customizado (Off-line)</h3>
                          <p className="text-xs text-slate-400">Combine frentes táticas, papéis técnicos e diretivas de seguranças para compilar o prompt perfeito.</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(getCompiledPrompt());
                              setCopiedText("combinatorio");
                              setTimeout(() => setCopiedText(null), 2500);
                            }}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-xs text-emerald-300 font-bold flex items-center gap-1.5 transition active:scale-95"
                          >
                            {copiedText === "combinatorio" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => {
                              setAiPrompt(getCompiledPrompt());
                              setActiveTab('intro');
                            }}
                            className="px-3.5 py-2 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-xs text-indigo-300 font-bold flex items-center gap-1.5 transition active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Carregar</span>
                          </button>
                        </div>
                      </div>

                      {/* Live Output Compiler Preview */}
                      <div className="flex-grow overflow-y-auto p-5 scrollbar-thin">
                        <div className="bg-[#03060c] border border-emerald-950/40 rounded-xl p-5 font-mono text-xs text-emerald-400/90 leading-relaxed whitespace-pre-wrap select-all max-w-4xl mx-auto shadow-xl relative">
                          <div className="absolute top-4 right-4 flex items-center gap-2">
                            <span className="text-[10px] bg-slate-950/80 px-2 py-0.5 rounded text-emerald-400 font-bold animate-pulse border border-emerald-500/20">
                              PRÉ-VISUALIZAÇÃO ATIVA
                            </span>
                          </div>
                          {getCompiledPrompt()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: IMPORTADOR ZIP & README GENERATOR */}
            {activeTab === 'zip_importer' && (
              <div className="flex-grow flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-850 min-h-[640px] text-left bg-slate-950/20 rounded-b-xl overflow-hidden">
                {/* Lateral Panel: Control / Upload & Config */}
                <div className="w-full md:w-96 flex flex-col bg-[#080d19]/90 shrink-0 p-5 divide-y divide-slate-850 gap-5 overflow-y-auto overflow-x-hidden scrollbar-thin">
                  
                  {/* File Upload / Attachment Zone */}
                  <div>
                    <h3 className="text-xs font-bold text-white font-display uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-sky-400 rotate-180" />
                      Anexar Pacote ZIP
                    </h3>
                    
                    <div className="relative group border-2 border-dashed border-slate-800 hover:border-sky-500/50 bg-[#040810]/60 hover:bg-[#040810]/95 p-5 rounded-xl transition duration-200 text-center flex flex-col items-center justify-center gap-2 cursor-pointer">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleZipUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-10 h-10 rounded-full bg-sky-950/40 border border-sky-800/40 flex items-center justify-center text-sky-400 group-hover:scale-110 transition duration-200">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      
                      {zipFileName ? (
                        <div className="text-left w-full mt-1">
                          <p className="text-xs font-bold text-white truncate text-center">{zipFileName}</p>
                          <p className="text-[10px] text-emerald-400 font-mono text-center">✓ Carregado com sucesso!</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-300">Escolha ou solte o arquivo .zip</p>
                          <p className="text-[10px] text-slate-500 font-mono">Processamento feito 100% no cliente</p>
                        </div>
                      )}
                    </div>

                    {zipLoading && (
                      <div className="flex items-center gap-2 mt-3 bg-slate-905 border border-slate-850 p-2.5 rounded-lg text-xs text-sky-300 font-semibold justify-center">
                        <span className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent animate-spin rounded-full" />
                        Descompactando e extraindo metadados...
                      </div>
                    )}

                    {zipError && (
                      <div className="mt-3 bg-rose-955 border border-rose-900/35 p-3 rounded-lg text-xs text-rose-300">
                        <p className="font-bold">Falha no processamento:</p>
                        <p className="font-mono text-[11px] mt-1 opacity-90">{zipError}</p>
                      </div>
                    )}
                  </div>

                  {/* Project Analysis Output & Metadata */}
                  {Object.keys(zipFiles).length > 0 && (
                    <div className="pt-4 space-y-4">
                      <h3 className="text-xs font-bold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Análise do Reconhecimento
                      </h3>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-slate-500 block text-[9px] uppercase font-mono">Nome Projetado</span>
                            <input
                              type="text"
                              value={zipProjectName}
                              onChange={(e) => setZipProjectName(e.target.value)}
                              className="font-bold text-white bg-transparent outline-none border-b border-transparent focus:border-indigo-500 w-full"
                            />
                          </div>
                          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850">
                            <span className="text-slate-500 block text-[9px] uppercase font-mono">Linguagem Base</span>
                            <span className="font-semibold text-emerald-400 truncate block">{zipDetectedLang}</span>
                          </div>
                        </div>

                        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-slate-500 block text-[9px] uppercase font-mono">Módulos Extraídos</span>
                          <span className="font-mono text-white text-xs">{Object.keys(zipFiles).length} arquivos identificados</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Descrição do Escopo</label>
                          <textarea
                            rows={3}
                            value={zipProjectDesc}
                            onChange={(e) => setZipProjectDesc(e.target.value)}
                            className="w-full bg-[#05080f] border border-slate-800 rounded-lg text-xs p-2.5 text-slate-300 outline-none focus:border-sky-500/70 resize-none leading-relaxed"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Export to GitHub Integration Section */}
                  {Object.keys(zipFiles).length > 0 && (
                    <div className="pt-4 space-y-4">
                      <h3 className="text-xs font-bold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                        <Github className="w-4 h-4 text-slate-200" />
                        Exportador para o GitHub
                      </h3>

                      {githubToken ? (
                        <div className="space-y-3 text-left">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Nome do Repositório</label>
                            <input
                              type="text"
                              placeholder="nome-do-repositorio"
                              value={zipRepoName}
                              onChange={(e) => setZipRepoName(e.target.value)}
                              className="w-full bg-[#05080f] border border-slate-800 focus:border-indigo-500/70 rounded-lg text-xs p-2 text-white outline-none font-mono"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Descrição do Repositório</label>
                            <textarea
                              rows={2}
                              placeholder="Análise automatizada de projeto..."
                              value={zipRepoDesc}
                              onChange={(e) => setZipRepoDesc(e.target.value)}
                              className="w-full bg-[#05080f] border border-slate-800 focus:border-indigo-500/70 rounded-lg text-xs p-2 text-white outline-none resize-none leading-normal"
                            />
                          </div>

                          <div className="flex items-center justify-between py-1 px-1 bg-slate-900/30 border border-slate-850/40 rounded-lg">
                            <span className="text-xs text-slate-400">Privacidade</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setZipRepoPrivate(false)}
                                className={`px-2 py-1 rounded text-[10px] font-bold ${!zipRepoPrivate ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/25' : 'text-slate-500'}`}
                              >
                                Público
                              </button>
                              <button
                                type="button"
                                onClick={() => setZipRepoPrivate(true)}
                                className={`px-2 py-1 rounded text-[10px] font-bold ${zipRepoPrivate ? 'bg-amber-600/25 text-amber-300 border border-amber-500/25' : 'text-slate-500'}`}
                              >
                                Privado
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={handleZipExportGitHub}
                            disabled={isExportingZipGithub || !zipRepoName.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
                          >
                            {isExportingZipGithub ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                                <span>Exportando Módulos...</span>
                              </>
                            ) : (
                              <>
                                <Github className="w-4 h-4 text-white" />
                                <span>Exportar Árvore p/ GitHub</span>
                              </>
                            )}
                          </button>

                          {zipGithubExportResult && (
                            <div className={`p-3 rounded-lg border text-xs mt-2 ${
                              zipGithubExportResult.success 
                                ? 'bg-emerald-955 border-emerald-900/40 text-emerald-300' 
                                : 'bg-rose-955 border-rose-900/40 text-rose-300'
                            }`}>
                              {zipGithubExportResult.success ? (
                                <div className="space-y-1.5">
                                  <p className="font-bold flex items-center gap-1">
                                    <Check className="w-4 h-4" />
                                    Repositório Criado!
                                  </p>
                                  <a 
                                    href={zipGithubExportResult.repoUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="underline font-semibold flex items-center gap-1 hover:text-white"
                                  >
                                    Acessar no GitHub ↗
                                  </a>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-bold">Erro na Exportação:</p>
                                  <p className="font-mono text-[11px] mt-1 opacity-90">{zipGithubExportResult.error}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-slate-900/80 border border-slate-850 p-3.5 rounded-lg text-center space-y-2.5">
                          <p className="text-xs text-slate-400">Conta do GitHub não conectada.</p>
                          <button
                            onClick={() => {
                              setShowGithubModal(true);
                              setActiveTab('tech');
                            }}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700/85 text-white text-xs rounded font-semibold flex items-center justify-center gap-2 transition"
                          >
                            <Github className="w-3.5 h-3.5" />
                            Ir para Conectar GitHub
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                </div>

                {/* Main Space Panel / Live Tree + Readme Viewer */}
                <div className="flex-grow flex flex-col overflow-hidden bg-[#060a13]/90">
                  {Object.keys(zipFiles).length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-900/70 border border-slate-800 flex items-center justify-center text-slate-500">
                        <Download className="w-6 h-6 rotate-180" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-300 font-display uppercase tracking-wider">Aguardando Importação</h3>
                      <p className="text-xs text-slate-450 leading-relaxed">
                        Anexe ou solte um arquivo <span className="text-indigo-400 font-bold">.zip</span> no painel lateral. O Oráculo irá ler a estrutura de arquivos e diretórios física, reconhecer a stack e gerar um README.md profissional e exportável.
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-850">
                      
                      {/* Left: Interactive Code Tree (1/3 Width) */}
                      <div className="w-full md:w-72 flex flex-col bg-slate-950/40 shrink-0 h-2/5 md:h-full overflow-hidden">
                        <div className="p-3 bg-slate-900/30 border-b border-slate-850 shrink-0 select-none flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">Arquivos Identificados</span>
                          <span className="text-[9px] bg-slate-950 px-1.5 py-0.5 rounded text-sky-400 font-mono">ZIP TREE</span>
                        </div>
                        <div className="flex-grow overflow-y-auto p-2 space-y-0.5 scrollbar-thin text-left">
                          {Object.keys(zipFiles).sort().map(filePath => {
                            const isSelected = zipSelectedFile === filePath;
                            return (
                              <button
                                key={filePath}
                                onClick={() => setZipSelectedFile(filePath)}
                                className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] font-mono flex items-center gap-2 truncate transition ${
                                  isSelected 
                                    ? 'bg-sky-950/30 text-sky-400 border-l-2 border-sky-500 font-medium' 
                                    : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-205'
                                }`}
                              >
                                <Terminal className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                                <span className="truncate">{filePath}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Dynamic Work Area (Readme vs File Source Code View) */}
                      <div className="flex-grow flex flex-col h-3/5 md:h-full overflow-hidden">
                        
                        {/* Tab Toggle for Source Code vs README.md Generator */}
                        <div className="bg-slate-900/20 border-b border-slate-850 px-4 py-2 flex items-center justify-between gap-4 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10.5px] font-bold text-white font-display hidden xl:inline">VISUALIZADORES DE IMPORTAÇÃO:</span>
                            <div className="flex p-0.5 bg-slate-950 border border-slate-850 rounded-lg">
                              <button
                                onClick={() => setZipSelectedFile('_readme_view')}
                                className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition flex items-center gap-1.5 ${
                                  zipSelectedFile === '_readme_view'
                                    ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/20'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                                Descrição README.md Gerado
                              </button>
                              <button
                                onClick={() => {
                                  if (zipSelectedFile === '_readme_view') {
                                    setZipSelectedFile(Object.keys(zipFiles)[0] || '');
                                  }
                                }}
                                className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition flex items-center gap-1.5 ${
                                  zipSelectedFile !== '_readme_view'
                                    ? 'bg-sky-600/25 text-sky-305 border border-sky-500/20'
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                <Terminal className="w-3.5 h-3.5" />
                                Código Fonte Anexado
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const payload = zipSelectedFile === '_readme_view' ? zipGeneratedReadme : (zipFiles[zipSelectedFile] || '');
                                navigator.clipboard.writeText(payload);
                                setCopiedText('zippreviewer');
                                setTimeout(() => setCopiedText(null), 2500);
                              }}
                              className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-300 hover:text-white rounded flex items-center gap-1 transition"
                            >
                              {copiedText === 'zippreviewer' ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copiar Texto</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Interactive Viewer screen */}
                        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-slate-950/40">
                          {zipSelectedFile === '_readme_view' ? (
                            <div className="max-w-3xl mx-auto space-y-4">
                              <div className="border-b border-emerald-950/40 pb-2 flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  README.md Reconstruído (Editável)
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">Formato Markdown Padrão</span>
                              </div>
                              <textarea
                                value={zipGeneratedReadme}
                                onChange={(e) => setZipGeneratedReadme(e.target.value)}
                                className="w-full h-[450px] bg-[#03060c] border border-emerald-950/40 rounded-xl p-5 font-mono text-xs text-emerald-400/90 leading-relaxed outline-none focus:border-emerald-500/40 resize-none shadow-xl"
                                placeholder="# Documentação do Projeto..."
                              />
                            </div>
                          ) : (
                            <div className="max-w-4xl mx-auto space-y-3">
                              <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold uppercase text-sky-400">
                                  Visualizando: {zipSelectedFile}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">Modo de Leitura Estática</span>
                              </div>
                              
                              <div className="bg-[#03050a] border border-slate-850/60 rounded-xl p-5 font-mono text-[11px] text-sky-300 leading-relaxed overflow-x-auto whitespace-pre tab-6 select-all max-h-[450px] overflow-y-auto scrollbar-thin text-left">
                                {zipFiles[zipSelectedFile] === undefined ? (
                                  <span className="italic text-slate-600 block text-center">Selecione um arquivo válido para ver seu conteúdo</span>
                                ) : (
                                  zipFiles[zipSelectedFile] || <span className="italic text-slate-600 block text-center">[Arquivo de código vazio]</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </section>
      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950/80 py-5 px-4 text-center text-xs text-slate-500 mt-12 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Desenvolvido em conformidade para auditorias de segurança e integridade de rede.
          </div>
          <div className="text-slate-600 flex items-center gap-1.5">
            <span>AI Studio Cloud App</span>
            <span>•</span>
            <span>Integrado com GitHub</span>
          </div>
        </div>
      </footer>

      {/* 5. GITHUB DEPLOYMENT / EXPORT OVERLAY MODAL */}
      {showGithubModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl relative flex flex-col gap-4 text-left">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Github className="w-5 h-5 text-slate-100" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Exportar para o GitHub</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Conexão descompactada via API oficial</p>
                </div>
              </div>
              <button
                onClick={() => setShowGithubModal(false)}
                className="text-slate-400 hover:text-white font-bold p-1 bg-slate-800/40 hover:bg-slate-800/85 rounded transition"
              >
                ✕
              </button>
            </div>

            {/* Display Results */}
            {!githubToken ? (
              /* Disconnected Status: Instructions & local custom credentials form */
              <div className="flex flex-col gap-4 py-1">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-wider">Apenas mais um passo</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed text-left">
                    Conecte a sua conta do GitHub para que possamos empacotar cada arquivo do blueprint de segurança de forma descompactada técnica no seu perfil.
                  </p>
                  
                  <button
                    onClick={handleConnectGitHub}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 mt-1.5 transition active:scale-95 shadow-lg shadow-indigo-950/40"
                  >
                    <Github className="w-4 h-4 text-white" />
                    Autorizar e Conectar Conta GitHub
                  </button>
                </div>

                {/* CONFIGURANDO REDIRECT_URI NO GITHUB */}
                <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-lg flex flex-col gap-2.5 text-left">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-bold font-display uppercase tracking-wider">Evitando Erro "redirect_uri mismatch"</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Para que a autenticação funcione, a configuração <strong>Authorization callback URL</strong> no seu painel de desenvolvedor do GitHub (<a href="https://github.com/settings/developers" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">GitHub Developer Settings</a>) precisa coincidir <strong>exatamente</strong> com a URL do ambiente atual:
                  </p>
                  
                  <div className="flex items-center gap-2 bg-[#05080f] border border-slate-800 rounded p-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={`${window.location.origin}/auth/callback`} 
                      className="flex-1 bg-transparent border-0 outline-none p-0 text-xs font-mono text-emerald-400 select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/auth/callback`);
                        setCopiedCallback(true);
                        setTimeout(() => setCopiedCallback(false), 2000);
                      }}
                      className="p-1 px-2 text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800/80 rounded transition text-[10px] flex items-center gap-1 font-sans"
                      title="Copiar URL"
                    >
                      {copiedCallback ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 italic leading-relaxed">
                    ⚠️ Importante: O ambiente é dinâmico. Se você alternar entre o link de desenvolvedor (<code>ais-dev-...</code>) e o link de teste/compartilhamento (<code>ais-pre-...</code>), lembre-se de conferir se a URL registrada no seu App no GitHub coincide com a URL acima!
                  </p>
                </div>
                
                {/* Advanced Local Config inputs */}
                <div className="bg-slate-950/45 border border-slate-850 p-4 rounded-lg space-y-3">
                  <span className="text-[10px] text-slate-350 font-semibold uppercase tracking-wider block">Credenciais OAuth Locais (Opcional)</span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Se você preferir usar as suas próprias credenciais do GitHub sem precisar cadastrar variáveis de ambiente no painel do AI Studio, basta inseri-las abaixo:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 font-mono block">GITHUB_CLIENT_ID</label>
                      <input
                        type="text"
                        value={customClientId}
                        onChange={e => {
                          const val = e.target.value.trim();
                          setCustomClientId(val);
                          localStorage.setItem('github_custom_client_id', val);
                        }}
                        placeholder="Ex: Iv1.1a2b3c..."
                        className="w-full bg-[#0b0f19] border border-slate-800 rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-450 font-mono block">GITHUB_CLIENT_SECRET</label>
                      <input
                        type="password"
                        value={customClientSecret}
                        onChange={e => {
                          const val = e.target.value.trim();
                          setCustomClientSecret(val);
                          localStorage.setItem('github_custom_client_secret', val);
                        }}
                        placeholder="Ex: 8f9a2b..."
                        className="w-full bg-[#0b0f19] border border-slate-800 rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : githubExportResult ? (
              <div className="flex flex-col gap-4 py-2">
                {githubExportResult.success ? (
                  <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-lg flex flex-col items-center text-center gap-3">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-white">Repositório Criado com Sucesso!</h4>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                        Todos os arquivos do seu Blueprint de segurança foram desempacotados e commitados no GitHub de forma modular.
                      </p>
                    </div>
                    
                    <a
                      href={githubExportResult.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 mt-1 transition shadow-lg shadow-emerald-950/40"
                    >
                      <ExternalLink className="w-4 h-4 text-white" />
                      Visualizar no GitHub
                    </a>
                  </div>
                ) : (
                  <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-lg flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-rose-400">
                      <AlertTriangle className="w-4.5 h-4.5" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Falha na Exportação</h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{githubExportResult.error}</p>
                    <div className="text-[10px] text-slate-500 bg-slate-950/45 p-2 rounded mt-1 font-mono">
                      Dica: Se receber erro de autenticação ou chaves inválidas (401/403), certifique-se de configurar e autorizar o app oficial e re-conectar sua conta.
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-slate-800 pt-3.5 mt-2">
                  <button
                    onClick={handleDisconnectGitHub}
                    className="text-xs font-medium text-rose-450 hover:bg-rose-950/20 border border-rose-950/40 px-3 py-2 rounded-lg transition"
                  >
                    Desconectar GitHub
                  </button>
                  <button
                    onClick={() => {
                      setGithubExportResult(null);
                      setShowGithubModal(false);
                    }}
                    className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg transition"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              /* Config parameters form */
              <div className="flex flex-col gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Nome do Repositório</label>
                  <div className="flex items-center bg-[#0b0f19] border border-slate-850 rounded-lg overflow-hidden focus-within:border-indigo-505">
                    <span className="text-[11px] text-slate-500 px-3 py-2 border-r border-slate-800 select-none font-mono">github.com / seu-usuario /</span>
                    <input
                      type="text"
                      value={githubRepoName}
                      onChange={e => {
                        const cleaned = e.target.value
                          .toLowerCase()
                          .normalize('NFD')
                          .replace(/[\u0300-\u036f]/g, '')
                          .replace(/[^a-z0-9_.-]/g, '-')
                          .replace(/-+/g, '-')
                          .substring(0, 100);
                        setGithubRepoName(cleaned);
                      }}
                      placeholder="nome-do-repositorio"
                      className="flex-1 bg-transparent border-0 outline-none p-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Descrição (Opcional)</label>
                  <textarea
                    rows={3}
                    value={githubRepoDesc}
                    onChange={e => setGithubRepoDesc(e.target.value)}
                    placeholder="Uma descrição técnica explicando as conformidades e higiene digital mapeadas pela ferramenta."
                    className="w-full bg-[#0b0f19] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="bg-slate-950/40 border border-slate-850/60 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">Repositório Privado?</span>
                    <span className="text-[10px] text-slate-500 block leading-normal">Se marcado, apenas você terá acesso ao código gerado.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={githubRepoPrivate}
                    onChange={e => setGithubRepoPrivate(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-800 rounded select-none shrink-0"
                  />
                </div>

                {/* Progress / Actions */}
                {isExportingGithub ? (
                  <div className="bg-[#0b0f19] border border-slate-800/80 p-4 rounded-lg flex items-center gap-3 py-4 text-left">
                    <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Exportando Blueprint...</span>
                      <span className="text-[10px] text-slate-500 block">Criando repositório e enviando arquivos descompactados um de cada vez de forma resiliente...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5 border-t border-slate-800 pt-4 mt-2">
                    <button
                      onClick={handleDisconnectGitHub}
                      className="text-xs font-medium text-slate-500 hover:text-rose-400 self-start sm:self-center transition"
                      title="Sair da sessão do GitHub"
                    >
                      Desconectar Conta
                    </button>
                    
                    <div className="flex gap-2 w-full sm:w-auto overflow-hidden justify-end">
                      <button
                        onClick={() => setShowGithubModal(false)}
                        className="text-xs font-semibold text-slate-300 bg-slate-800/50 hover:bg-slate-800 px-4 py-2 rounded-lg transition"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleExportGitHub}
                        disabled={!githubRepoName.trim()}
                        className="text-xs font-semibold text-indigo-100 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg transition disabled:opacity-50"
                      >
                        Exportar Descompactado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Config Instructions */}
            <div className="border-t border-slate-800/60 pt-3">
              <details className="text-[11px] text-slate-550 cursor-pointer select-none">
                <summary className="hover:text-slate-400 font-mono">Deseja usar suas próprias credenciais OAuth? Ver instruções de Callback URL</summary>
                <div className="p-2.5 mt-2 bg-[#0b0f19]/80 rounded border border-slate-800 space-y-2 text-left leading-relaxed">
                  <p className="text-[11px] text-amber-500/90 font-semibold">⚠️ AVISO DE REDIRECT_URI:</p>
                  <p className="text-[10.5px] text-slate-400">
                    O erro <code>"redirect_uri não está associado a este aplicativo"</code> significa que a URL configurada no seu aplicativo GitHub não coincide exatamente com a URL desta página.
                  </p>
                  
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">URLs para configurar no Cadastro do GitHub:</span>
                  <div className="space-y-1.5 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Se estiver editando o app (Workspace):</span>
                      <code className="text-indigo-400 p-0.5 bg-slate-950 rounded select-all block break-all w-full mt-0.5">
                        {window.location.origin.includes('ais-dev') ? window.location.origin : 'https://ais-dev-' + window.location.origin.split('-')[2] + '-' + window.location.origin.split('-')[3] + '-' + window.location.origin.split('-')[4].split('.')[0] + '.us-west2.run.app'}/auth/callback
                      </code>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Se estiver visualizando o preview público (Share Link):</span>
                      <code className="text-indigo-400 p-0.5 bg-slate-950 rounded select-all block break-all w-full mt-0.5">
                        {window.location.origin.includes('ais-pre') ? window.location.origin : 'https://ais-pre-' + window.location.origin.split('-')[2].replace('dev', 'pre') + '-' + window.location.origin.split('-')[3] + '-' + window.location.origin.split('-')[4].split('.')[0] + '.us-west2.run.app'}/auth/callback
                      </code>
                    </div>
                    <div>
                      <span className="text-slate-500 block">URL de Callback dessa aba atual (Recomendada agora):</span>
                      <code className="text-emerald-400 p-0.5 bg-slate-950 rounded select-all block break-all w-full mt-0.5">
                        {window.location.origin}/auth/callback
                      </code>
                    </div>
                  </div>

                  <p className="border-t border-slate-800/80 pt-2 mt-2">Dica: Copie o endereço verde acima e insira-o no campo <strong>Authorization Callback URL</strong> nas <a href="https://github.com/settings/developers" target="_blank" rel="noopener" className="text-indigo-400 hover:underline">Configurações de Desenvolvedor do GitHub</a>.</p>
                </div>
              </details>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
