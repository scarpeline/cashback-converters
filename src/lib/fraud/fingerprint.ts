/**
 * Device Fingerprint & Anti-Fraud Collection
 * Coleta sinais do dispositivo para detecção de fraude em afiliação
 */

export interface DeviceFingerprint {
  // Navegador e SO
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  hardwareConcurrency: number;
  deviceMemory: number | null;
  maxTouchPoints: number;
  
  // Tela
  screenWidth: number;
  screenHeight: number;
  colorDepth: number;
  pixelRatio: number;
  
  // Timezone
  timezone: string;
  timezoneOffset: number;
  
  // Canvas fingerprint (hash)
  canvasHash: string;
  
  // WebGL info
  webglVendor: string;
  webglRenderer: string;
  
  // Fontes detectadas (simplificado)
  installedFonts: string[];
  
  // Storage
  cookieEnabled: boolean;
  localStorageAvailable: boolean;
  sessionStorageAvailable: boolean;
  
  // Conexão
  connectionType: string | null;
  
  // Hash combinado
  combinedHash: string;
}

/**
 * Gera hash simples de uma string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Canvas fingerprint - gera um hash baseado no rendering do canvas
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "no-canvas";
    
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("FraudCheck2026", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("AntiBot", 4, 17);
    
    return simpleHash(canvas.toDataURL());
  } catch {
    return "canvas-error";
  }
}

/**
 * WebGL info
 */
function getWebGLInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { vendor: "none", renderer: "none" };
    
    const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
    if (!debugInfo) return { vendor: "unknown", renderer: "unknown" };
    
    return {
      vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "unknown",
      renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "unknown",
    };
  } catch {
    return { vendor: "error", renderer: "error" };
  }
}

/**
 * Detecta fontes instaladas (subset)
 */
function detectFonts(): string[] {
  const testFonts = [
    "Arial", "Verdana", "Helvetica", "Times New Roman", "Courier New",
    "Georgia", "Impact", "Comic Sans MS", "Trebuchet MS", "Palatino",
    "Lucida Console", "Tahoma", "Segoe UI", "Ubuntu", "Roboto"
  ];
  
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const testStr = "mmmmmmmmmmlli";
    const testSize = "72px";
    
    const baseWidths: Record<string, number> = {};
    baseFonts.forEach(f => {
      ctx.font = `${testSize} ${f}`;
      baseWidths[f] = ctx.measureText(testStr).width;
    });
    
    return testFonts.filter(font => {
      return baseFonts.some(base => {
        ctx.font = `${testSize} '${font}', ${base}`;
        return ctx.measureText(testStr).width !== baseWidths[base];
      });
    });
  } catch {
    return [];
  }
}

/**
 * Coleta fingerprint completo do dispositivo
 */
export function collectDeviceFingerprint(): DeviceFingerprint {
  const webgl = getWebGLInfo();
  const canvasHash = getCanvasFingerprint();
  const fonts = detectFonts();
  
  const nav = navigator as any;
  
  const fp: Omit<DeviceFingerprint, "combinedHash"> = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: [...navigator.languages],
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    deviceMemory: nav.deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    screenWidth: screen.width,
    screenHeight: screen.height,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    canvasHash,
    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,
    installedFonts: fonts,
    cookieEnabled: navigator.cookieEnabled,
    localStorageAvailable: (() => { try { localStorage.setItem("_t", "1"); localStorage.removeItem("_t"); return true; } catch { return false; } })(),
    sessionStorageAvailable: (() => { try { sessionStorage.setItem("_t", "1"); sessionStorage.removeItem("_t"); return true; } catch { return false; } })(),
    connectionType: nav.connection?.effectiveType || null,
  };
  
  // Hash combinado de sinais estáveis
  const stableSignals = [
    fp.platform, fp.language, fp.hardwareConcurrency, fp.deviceMemory,
    fp.screenWidth, fp.screenHeight, fp.colorDepth, fp.pixelRatio,
    fp.timezone, fp.canvasHash, fp.webglVendor, fp.webglRenderer,
    fp.installedFonts.join(","), fp.maxTouchPoints,
  ].join("|");
  
  return { ...fp, combinedHash: simpleHash(stableSignals) };
}

/**
 * Obtém IP público via API pública
 */
export async function getPublicIP(): Promise<string> {
  try {
    const resp = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(5000) });
    const data = await resp.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Verifica se é provável uso de VPN/proxy (heurística)
 */
export function detectVPNHeuristics(): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // WebRTC leak check (simplificado)
  if (navigator.userAgent.includes("HeadlessChrome")) reasons.push("headless_browser");
  if ((navigator as any).webdriver) reasons.push("webdriver_detected");
  if (!navigator.cookieEnabled) reasons.push("cookies_disabled");
  
  // Tela muito pequena (bot/emulador)
  if (screen.width < 300 || screen.height < 300) reasons.push("suspicious_screen_size");
  
  // Sem timezone (bot)
  if (!tz || tz === "UTC") reasons.push("utc_timezone_suspicious");
  
  return { suspicious: reasons.length > 0, reasons };
}
