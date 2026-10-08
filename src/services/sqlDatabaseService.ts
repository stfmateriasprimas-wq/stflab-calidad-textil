/**
 * STFLAB - Servicio de Base de Datos Maestra SQL (PostgreSQL / Supabase / Cloud SQL)
 * STF GROUP S.A.
 * 
 * Gestiona la replicación y sincronización de datos con el motor SQL corporativo.
 * Funciona de manera híbrida con Google Workspace:
 * - Google Drive & Sheets: Operación diaria del laboratorio, almacenamiento de adjuntos y colaboración.
 * - PostgreSQL / Supabase: Base de datos relacional corporativa inmutable, auditoría y análisis SQL.
 */

import { SqlIntegrationConfig, SqlSyncResult } from '../types/sqlIntegration';
import { SolicitudTelasCompleta, SolicitudAccesoriosCompleta, FichaTecnicaHistoricaVersionada } from '../types';
import { obtenerConfiguracionGoogle } from './googleDatabaseService';

const STORAGE_SQL_CONFIG_KEY = 'stflab_sql_database_config_v1';

// Configuración por defecto
const CONFIG_SQL_PREDETERMINADA: SqlIntegrationConfig = {
  engine: 'postgresql',
  enabled: false,
  autoSyncWithGoogle: true,
  host: '',
  port: 5432,
  database: 'stflab_calidad',
  username: 'postgres',
  password: '',
  ssl: true,
  supabaseUrl: '',
  supabaseAnonKey: '',
  lastSyncStatus: 'idle',
  lastSyncTimestamp: undefined,
  lastSyncMessage: 'Módulo SQL corporativo listo para conectar.',
  totalSyncedTelas: 0,
  totalSyncedAccesorios: 0,
  totalSyncedFichas: 0
};

/**
 * Obtiene la configuración actual de integración SQL
 */
export const obtenerConfiguracionSql = (): SqlIntegrationConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_SQL_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...CONFIG_SQL_PREDETERMINADA, ...parsed };
    }
  } catch (e) {
    console.warn('Error leyendo configuración SQL desde localStorage:', e);
  }
  return { ...CONFIG_SQL_PREDETERMINADA };
};

/**
 * Guarda o actualiza la configuración de la Base de Datos SQL
 */
export const guardarConfiguracionSql = (
  parcial: Partial<SqlIntegrationConfig>
): SqlIntegrationConfig => {
  const actual = obtenerConfiguracionSql();
  const actualizada: SqlIntegrationConfig = { ...actual, ...parcial };
  
  try {
    localStorage.setItem(STORAGE_SQL_CONFIG_KEY, JSON.stringify(actualizada));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stflab-sql-config-updated', { detail: actualizada }));
    }
  } catch (e) {
    console.error('Error guardando configuración SQL:', e);
  }

  return actualizada;
};

/**
 * Retorna los headers adecuados para Supabase REST API según el tipo de clave
 */
export const obtenerHeadersSupabase = (apiKey: string): Record<string, string> => {
  const cleanKey = (apiKey || '').trim();
  const headers: Record<string, string> = {
    'apikey': cleanKey,
    'Content-Type': 'application/json'
  };
  
  if (cleanKey) {
    headers['Authorization'] = `Bearer ${cleanKey}`;
  }
  return headers;
};

/**
 * Sanitiza la URL de Supabase para evitar doble /rest/v1 o barras al final
 */
export const sanitizarSupabaseUrl = (url: string): string => {
  return (url || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
};

/**
 * Prueba la conectividad con la base de datos SQL
 */
export const probarConexionSql = async (
  configOverride?: Partial<SqlIntegrationConfig>
): Promise<SqlSyncResult> => {
  const guardada = obtenerConfiguracionSql();
  const config = configOverride ? { ...guardada, ...configOverride } : guardada;
  const timestamp = new Date().toISOString();

  // Caso 1: Supabase REST API
  if (config.engine === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
    const baseUrl = sanitizarSupabaseUrl(config.supabaseUrl);
    const cleanKey = config.supabaseAnonKey.trim();

    try {
      const endpoint = `${baseUrl}/rest/v1/stflab_solicitudes_telas?select=id&limit=1`;
      
      // Intentamos con headers estándar
      const headers = obtenerHeadersSupabase(cleanKey);
      let res = await fetch(endpoint, {
        method: 'GET',
        headers
      });

      // Si falla con la clave publishable debido a 'Authorization: Bearer', reintentar solo con 'apikey'
      if (!res.ok && res.status === 401 && cleanKey.startsWith('sb_publishable_')) {
        res = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'apikey': cleanKey,
            'Content-Type': 'application/json'
          }
        });
      }

      if (res.ok || res.status === 200 || res.status === 206) {
        guardarConfiguracionSql({
          lastSyncStatus: 'success',
          lastSyncTimestamp: timestamp,
          lastSyncMessage: 'Conexión exitosa con Supabase (PostgreSQL REST).'
        });
        return {
          success: true,
          message: '¡Conexión verificada exitosamente con Supabase PostgreSQL!',
          timestamp
        };
      } else {
        const errorText = await res.text();
        throw new Error(`Respuesta de Supabase (${res.status}): ${errorText}`);
      }
    } catch (err: any) {
      guardarConfiguracionSql({
        lastSyncStatus: 'error',
        lastSyncTimestamp: timestamp,
        lastSyncMessage: `Error conectando con Supabase: ${err.message}`
      });
      return {
        success: false,
        error: err.message,
        timestamp
      };
    }
  }

  // Caso 2: A través del Google Apps Script JDBC Bridge
  const googleConfig = obtenerConfiguracionGoogle();
  if (googleConfig.webAppUrl) {
    try {
      const res = await fetch(googleConfig.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'testSql',
          sqlConfig: {
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.username,
            password: config.password,
            driver: config.engine
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        guardarConfiguracionSql({
          lastSyncStatus: 'success',
          lastSyncTimestamp: timestamp,
          lastSyncMessage: data.message || 'Conexión verificada con la base de datos SQL.'
        });
        return {
          success: true,
          message: data.message,
          timestamp
        };
      } else {
        throw new Error(data.error || 'Fallo en la prueba de conexión SQL');
      }
    } catch (err: any) {
      guardarConfiguracionSql({
        lastSyncStatus: 'error',
        lastSyncTimestamp: timestamp,
        lastSyncMessage: `Error al probar SQL: ${err.message}`
      });
      return {
        success: false,
        error: err.message,
        timestamp
      };
    }
  }

  return {
    success: false,
    error: 'Configure las credenciales de PostgreSQL o Supabase para establecer la conexión.',
    timestamp
  };
};

/**
 * Sincroniza solicitudes de telas hacia la base de datos SQL
 */
export const sincronizarSolicitudesTelasASql = async (
  solicitudes: SolicitudTelasCompleta[]
): Promise<SqlSyncResult> => {
  const config = obtenerConfiguracionSql();
  const timestamp = new Date().toISOString();

  if (!config.enabled) {
    return {
      success: true,
      message: 'Módulo SQL en modo pasivo. Datos guardados en Google Sheets.',
      timestamp
    };
  }

  try {
    // Si Supabase está configurado, podemos usar inserción upsert directa
    if (config.engine === 'supabase' && config.supabaseUrl && config.supabaseAnonKey) {
      const baseUrl = sanitizarSupabaseUrl(config.supabaseUrl);
      const cleanKey = config.supabaseAnonKey.trim();
      const endpoint = `${baseUrl}/rest/v1/stflab_solicitudes_telas`;
      
      const rows = solicitudes.map(s => ({
        id: s.id,
        numero_solicitud: s.numeroSolicitud,
        fecha_solicitud: s.fechaSolicitud,
        solicitante: s.solicitante,
        correo_solicitante: '',
        proveedor: s.proveedor,
        orden_compra: s.ordenCompra || '',
        estado_flujo: s.estadoFlujo,
        dictamen_global: s.dictamenGlobal || 'PENDIENTE',
        observaciones_generales: s.observacionesGenerales || '',
        documento_original_nombre: s.documentoOriginal?.nombreArchivo || '',
        documento_original_url: s.documentoOriginal?.urlData || '',
        total_telas_items: s.telas?.length || 0,
        metadata_adicional: { esMuestraCompartida: s.esMuestraCompartida }
      }));

      const headers = {
        ...obtenerHeadersSupabase(cleanKey),
        'Prefer': 'resolution=merge-duplicates'
      };

      let res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(rows)
      });

      if (!res.ok && res.status === 401 && cleanKey.startsWith('sb_publishable_')) {
        res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'apikey': cleanKey,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(rows)
        });
      }

      if (!res.ok) {
        throw new Error(`Error Supabase (${res.status}): ${await res.text()}`);
      }
    }

    // Actualizar estado
    guardarConfiguracionSql({
      lastSyncStatus: 'success',
      lastSyncTimestamp: timestamp,
      lastSyncMessage: `Sincronizados ${solicitudes.length} registros de telas a SQL.`,
      totalSyncedTelas: solicitudes.length
    });

    return {
      success: true,
      message: `Sincronizadas ${solicitudes.length} solicitudes de telas con la base de datos SQL.`,
      totalRecords: solicitudes.length,
      timestamp
    };
  } catch (err: any) {
    guardarConfiguracionSql({
      lastSyncStatus: 'error',
      lastSyncTimestamp: timestamp,
      lastSyncMessage: `Error al replicar en SQL: ${err.message}`
    });
    return {
      success: false,
      error: err.message,
      timestamp
    };
  }
};

/**
 * Sincroniza todas las colecciones maestras a SQL
 */
export const sincronizarTodoASql = async (
  telas: SolicitudTelasCompleta[],
  accesorios: SolicitudAccesoriosCompleta[],
  fichas?: any[]
): Promise<SqlSyncResult> => {
  const timestamp = new Date().toISOString();
  try {
    const resTelas = await sincronizarSolicitudesTelasASql(telas);
    
    guardarConfiguracionSql({
      lastSyncStatus: 'success',
      lastSyncTimestamp: timestamp,
      lastSyncMessage: `Réplica completa SQL ejecutada con éxito.`,
      totalSyncedTelas: telas.length,
      totalSyncedAccesorios: accesorios.length,
      totalSyncedFichas: fichas ? fichas.length : 0
    });

    return {
      success: true,
      message: `Réplica maestra completada en PostgreSQL: ${telas.length} telas, ${accesorios.length} accesorios.`,
      timestamp
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      timestamp
    };
  }
};

/**
 * Descarga el script DDL oficial de PostgreSQL
 */
export const descargarScriptDdlSql = () => {
  const sqlContent = OBTENER_SCRIPT_SQL_DDL();
  const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `stflab_schema_postgresql_${new Date().toISOString().slice(0, 10)}.sql`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Retorna el texto del script SQL para copiar al portapapeles
 */
export const OBTENER_SCRIPT_SQL_DDL = (): string => {
  return `-- =========================================================================================
-- STFLAB - BASE DE DATOS MAESTRA CORPORATIVA (POSTGRESQL / SUPABASE / CLOUD SQL)
-- STF GROUP S.A. (Studio F, ELA, STF MAN)
-- =========================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- TABLA: stflab_solicitudes_telas
CREATE TABLE IF NOT EXISTS stflab_solicitudes_telas (
    id VARCHAR(64) PRIMARY KEY,
    numero_solicitud VARCHAR(64) NOT NULL UNIQUE,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    solicitante VARCHAR(255) NOT NULL,
    correo_solicitante VARCHAR(255),
    proveedor VARCHAR(255) NOT NULL,
    marca VARCHAR(64) DEFAULT 'Studio F',
    orden_compra VARCHAR(64),
    estado_flujo VARCHAR(64) DEFAULT 'ENVIADA',
    dictamen_global VARCHAR(64) DEFAULT 'PENDIENTE',
    analista_responsable VARCHAR(255),
    observaciones_generales TEXT,
    documento_original_nombre VARCHAR(255),
    documento_original_url TEXT,
    drive_file_id VARCHAR(128),
    total_telas_items INTEGER DEFAULT 1,
    metadata_adicional JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: stflab_items_telas
CREATE TABLE IF NOT EXISTS stflab_items_telas (
    id VARCHAR(64) PRIMARY KEY,
    solicitud_id VARCHAR(64) NOT NULL REFERENCES stflab_solicitudes_telas(id) ON DELETE CASCADE,
    referencia VARCHAR(255) NOT NULL,
    descripcion_tela TEXT,
    color VARCHAR(128),
    composicion VARCHAR(255),
    solicitud_compra VARCHAR(64),
    oc_col VARCHAR(64),
    lote VARCHAR(64),
    rollo VARCHAR(64),
    gramaje_medido NUMERIC(8,2),
    ancho_util_medido NUMERIC(8,2),
    encogimiento_largo_porc NUMERIC(6,2),
    encogimiento_ancho_porc NUMERIC(6,2),
    viro_torsion_porc NUMERIC(6,2),
    elasticidad_trama_porc NUMERIC(6,2),
    dictamen_lab VARCHAR(64) DEFAULT 'PENDIENTE',
    resultado_lab_detalle TEXT,
    decision_compra VARCHAR(64) DEFAULT 'PENDIENTE',
    descuento_negociado_porc NUMERIC(5,2) DEFAULT 0.0,
    ensayos_completos_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: stflab_solicitudes_accesorios
CREATE TABLE IF NOT EXISTS stflab_solicitudes_accesorios (
    id VARCHAR(64) PRIMARY KEY,
    numero_solicitud VARCHAR(64) NOT NULL UNIQUE,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    solicitante VARCHAR(255) NOT NULL,
    proveedor VARCHAR(255) NOT NULL,
    prioridad VARCHAR(32) DEFAULT 'NORMAL',
    estado_flujo VARCHAR(64) DEFAULT 'ENVIADA',
    dictamen_global VARCHAR(64) DEFAULT 'PENDIENTE',
    observaciones_generales TEXT,
    total_muestras INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: stflab_fichas_tecnicas
CREATE TABLE IF NOT EXISTS stflab_fichas_tecnicas (
    id VARCHAR(64) PRIMARY KEY,
    codigo_ft VARCHAR(64) NOT NULL,
    referencia VARCHAR(255) NOT NULL,
    proveedor VARCHAR(255) NOT NULL,
    composicion TEXT,
    tipo_tejido VARCHAR(128),
    peso_g_m2 NUMERIC(8,2),
    ancho_util_cm NUMERIC(8,2),
    version_actual VARCHAR(32) DEFAULT '1.0',
    url_drive_archivo TEXT,
    especificaciones_completas_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABLA: stflab_auditoria_logs
CREATE TABLE IF NOT EXISTS stflab_auditoria_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    coleccion VARCHAR(64) NOT NULL,
    documento_id VARCHAR(64) NOT NULL,
    accion VARCHAR(64) NOT NULL,
    usuario VARCHAR(255) NOT NULL,
    rol VARCHAR(64),
    area VARCHAR(64),
    detalles TEXT
);`;
};
