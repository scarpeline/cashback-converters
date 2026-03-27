/**
 * Módulo de Segurança — Hook React
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getSecurityLogs,
  runVulnerabilityScan,
  logSecurityEvent,
} from '../services/securityService';
import type { SecurityLog, SecurityScanResult, SecuritySeverity, SecurityEventType } from '../types';

export function useSecurityLogs(params?: {
  severity?: SecuritySeverity;
  event_type?: SecurityEventType;
  autoLoad?: boolean;
}) {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSecurityLogs({
        severity: params?.severity,
        event_type: params?.event_type,
      });
      setLogs(data);
    } catch (err) {
      setError('Erro ao carregar logs de segurança');
    } finally {
      setLoading(false);
    }
  }, [params?.severity, params?.event_type]);

  useEffect(() => {
    if (params?.autoLoad !== false) {
      loadLogs();
    }
  }, [loadLogs, params?.autoLoad]);

  return { logs, loading, error, reload: loadLogs };
}

export function useSecurityScan() {
  const [result, setResult] = useState<SecurityScanResult | null>(null);
  const [scanning, setScanning] = useState(false);

  const startScan = useCallback(async () => {
    setScanning(true);
    try {
      const scanResult = await runVulnerabilityScan();
      setResult(scanResult);

      await logSecurityEvent({
        event_type: 'vulnerability_scan' as any,
        severity: 'low',
        details: { findings_count: scanResult.findings.length },
        blocked: false,
      });

      return scanResult;
    } finally {
      setScanning(false);
    }
  }, []);

  return { result, scanning, startScan };
}
