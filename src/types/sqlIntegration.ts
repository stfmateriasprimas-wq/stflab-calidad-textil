/**
 * STFLAB - Tipos y Modelos para Integración con Base de Datos SQL Maestra
 * STF GROUP S.A.
 */

export type SqlDatabaseEngine = 'postgresql' | 'supabase' | 'cloudsql' | 'mysql';

export interface SqlIntegrationConfig {
  engine: SqlDatabaseEngine;
  enabled: boolean;
  autoSyncWithGoogle: boolean; // Si está activo, cuando se sincroniza con Google Sheets también se replica a SQL
  
  // Parámetros de conexión directa o Supabase
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  
  // Parámetros JDBC / PostgreSQL tradicional
  host?: string;
  port?: number | string;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  
  // Estado de sincronización
  lastSyncStatus?: 'idle' | 'success' | 'error' | 'syncing';
  lastSyncTimestamp?: string;
  lastSyncMessage?: string;
  totalSyncedTelas?: number;
  totalSyncedAccesorios?: number;
  totalSyncedFichas?: number;
}

export interface SqlSyncResult {
  success: boolean;
  message?: string;
  error?: string;
  engine?: string;
  totalRecords?: number;
  timestamp: string;
}
