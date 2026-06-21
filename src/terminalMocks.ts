export interface TerminalLine {
  text: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'neutral' | 'input';
  delay: number; // delay in ms before displaying this line
}

export function getTerminalSimulation(
  projectName: string,
  cliToolName: string,
  banner?: string,
  target?: string
): TerminalLine[] {
  const selectedTarget = target || 'google.com';
  
  if (projectName.includes('Auditor') || cliToolName.includes('auditor')) {
    return [
      { text: `python3 auditor_integridade.py --target ${selectedTarget} --porta 443`, type: 'input', delay: 100 },
      { text: banner || 'AUDITOR DE SEGURANÇA', type: 'neutral', delay: 400 },
      { text: `[*] Local time: ${new Date().toISOString()}`, type: 'info', delay: 200 },
      { text: `[*] Initializing Network Socket Verification to ${selectedTarget}...`, type: 'info', delay: 300 },
      { text: `[+] SUCCESS: Connection established with ${selectedTarget}:443`, type: 'success', delay: 500 },
      { text: `[*] Fetching HTTP headers policy for compliance check...`, type: 'info', delay: 300 },
      { text: `[*] Inspecting response headers (OWASP security standards):`, type: 'neutral', delay: 400 },
      { text: `    ✓ X-Frame-Options: SAMEORIGIN (Proteção anti-clickjacking ALTA)`, type: 'success', delay: 200 },
      { text: `    ✓ Strict-Transport-Security: max-age=31536000 (HSTS Forçado CRÍTICA)`, type: 'success', delay: 200 },
      { text: `    ✓ X-Content-Type-Options: nosniff (Proteção MIME sniffing MÉDIA)`, type: 'success', delay: 200 },
      { text: `    ⚠ Content-Security-Policy: AUSENTE (Risco: CRÍTICO - Permite injeções de scripts)`, type: 'error', delay: 400 },
      { text: `    ⚠ Referrer-Policy: AUSENTE (Risco: MÉDIO)`, type: 'warn', delay: 200 },
      { text: `[*] Extracting metadata of SSL certificate...`, type: 'info', delay: 300 },
      { text: `[+] SSL Certificate is valid (Issuer: Let's Encrypt / Expires in 89 days)`, type: 'success', delay: 150 },
      { text: `[*] Persisting audit details into SQLite: database/auditoria.db`, type: 'info', delay: 400 },
      { text: `[+] Row added to sqlite3 table 'auditorias' (id: 147)`, type: 'success', delay: 150 },
      { text: `[+] Row added to sqlite3 table 'cabecalhos_auditados' (CSP: Missing, STS: Present)`, type: 'success', delay: 150 },
      { text: `\n=============================================================`, type: 'neutral', delay: 100 },
      { text: `AUDIT COMPLETED. Criticidade Geral: ALTA`, type: 'warn', delay: 150 },
      { text: `Recomendação: Configurar cabeçalho Content-Security-Policy imediatamente.`, type: 'info', delay: 100 },
      { text: `=============================================================`, type: 'neutral', delay: 100 }
    ];
  }

  if (projectName.includes('Gateway') || cliToolName.includes('npm')) {
    return [
      { text: `npm run start`, type: 'input', delay: 100 },
      { text: `> security-api-gateway@1.2.0 start\n> node server.js`, type: 'neutral', delay: 300 },
      { text: `\n=== API Gateway rodando na porta 8080 ===`, type: 'success', delay: 400 },
      { text: `- Rota de testes: http://localhost:8080/api/health`, type: 'info', delay: 100 },
      { text: `- Rota protegida: http://localhost:8080/api/secure/data`, type: 'info', delay: 100 },
      { text: `[Gateway] Database connection to logs.db established.`, type: 'success', delay: 300 },
      { text: `\n[MOCK TRAFFIC SIMULATOR ACTIVE - Listening for requests]`, type: 'neutral', delay: 500 },
      { text: `[13:00:15] GET /api/health - IP: 192.168.1.42 - Status: 200 (OK) - User-Agent: Chromium`, type: 'success', delay: 600 },
      { text: `[13:00:22] GET /api/secure/data - IP: 192.168.1.100 - Status: 401 (Token JWT ausente) - BLOCADO`, type: 'error', delay: 800 },
      { text: `[13:00:28] POST /api/login - IP: 192.168.1.42 - Status: 200 (Assinado Token id: admin_0) - OK`, type: 'success', delay: 500 },
      { text: `[13:00:35] GET /api/secure/data - IP: 192.168.1.42 - Status: 200 (Autenticado via Bearer JWT) - LIBERADO`, type: 'success', delay: 700 },
      { text: `[13:00:44] POST /api/secure/data - IP: 203.0.113.8 - Limite excedido! (Rate Limit Triggered)`, type: 'warn', delay: 900 }
    ];
  }

  // Fallback simulation for general projects
  return [
    { text: `${cliToolName || 'npm run dev'}`, type: 'input', delay: 100 },
    { text: `[System] Starting ${projectName}...`, type: 'info', delay: 400 },
    { text: `[System] Parsing environment variables ... OK`, type: 'success', delay: 200 },
    { text: `[System] Loading physical configurations ... OK`, type: 'success', delay: 250 },
    { text: banner || 'PRODUTO AUTOMÁTICO', type: 'neutral', delay: 300 },
    { text: `[Execution] Running test files against project guidelines...`, type: 'info', delay: 350 },
    { text: `[✓] Check integrity test: SUCCESS`, type: 'success', delay: 200 },
    { text: `[✓] DB mapping test: SUCCESS`, type: 'success', delay: 150 },
    { text: `[+] Success: Application launched and terminated in compliance mode.`, type: 'success', delay: 400 }
  ];
}
