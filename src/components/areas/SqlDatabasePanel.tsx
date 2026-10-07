import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Table, 
  Key, 
  Globe, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { useQuality } from '../../context/QualityContext';
import { 
  obtenerConfiguracionSql, 
  guardarConfiguracionSql, 
  probarConexionSql, 
  sincronizarTodoASql, 
  descargarScriptDdlSql, 
  OBTENER_SCRIPT_SQL_DDL 
} from '../../services/sqlDatabaseService';
import { SqlIntegrationConfig } from '../../types/sqlIntegration';

export const SqlDatabasePanel: React.FC = () => {
  const { solicitudesTelas, solicitudesAccesorios, fichasTecnicasHistorial } = useQuality();
  
  const [sqlConfig, setSqlConfig] = useState<SqlIntegrationConfig>(() => obtenerConfiguracionSql());
  const [copiadoSql, setCopiadoSql] = useState(false);
  const [probandoConexion, setProbandoConexion] = useState(false);
  const [sincronizandoSql, setSincronizandoSql] = useState(false);
  const [pestanaSql, setPestanaSql] = useState<'conexion' | 'esquema' | 'tablas'>('conexion');
  const [toastNotif, setToastNotif] = useState<string | null>(null);

  const showToast = (msg: string, _tipo?: 'info' | 'error') => {
    setToastNotif(msg);
    setTimeout(() => setToastNotif(null), 4000);
  };

  // Formulario local
  const [engine, setEngine] = useState(sqlConfig.engine || 'postgresql');
  const [host, setHost] = useState(sqlConfig.host || '');
  const [port, setPort] = useState(sqlConfig.port || 5432);
  const [database, setDatabase] = useState(sqlConfig.database || 'stflab_calidad');
  const [username, setUsername] = useState(sqlConfig.username || 'postgres');
  const [password, setPassword] = useState(sqlConfig.password || '');
  const [supabaseUrl, setSupabaseUrl] = useState(sqlConfig.supabaseUrl || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(sqlConfig.supabaseAnonKey || '');
  const [autoSync, setAutoSync] = useState(sqlConfig.autoSyncWithGoogle ?? true);
  const [enabled, setEnabled] = useState(sqlConfig.enabled ?? false);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setSqlConfig(e.detail);
    };
    window.addEventListener('stflab-sql-config-updated', handleUpdate);
    return () => window.removeEventListener('stflab-sql-config-updated', handleUpdate);
  }, []);

  const handleGuardarConfig = () => {
    const actualizada = guardarConfiguracionSql({
      engine,
      host: host.trim(),
      port: Number(port) || 5432,
      database: database.trim(),
      username: username.trim(),
      password,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      autoSyncWithGoogle: autoSync,
      enabled
    });
    setSqlConfig(actualizada);
    showToast('Configuración de Base de Datos SQL guardada con éxito.');
  };

  const handleProbarConexion = async () => {
    // Primero guardar cambios actuales
    handleGuardarConfig();
    setProbandoConexion(true);
    try {
      const res = await probarConexionSql();
      if (res.success) {
        showToast(res.message || 'Conexión con PostgreSQL verificada exitosamente.');
      } else {
        showToast(`⚠️ ${res.error || 'No se pudo conectar con SQL'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error de conexión: ${err.message}`, 'error');
    } finally {
      setProbandoConexion(false);
    }
  };

  const handleSincronizarDatos = async () => {
    setSincronizandoSql(true);
    try {
      const res = await sincronizarTodoASql(solicitudesTelas, solicitudesAccesorios, fichasTecnicasHistorial);
      if (res.success) {
        showToast(res.message || 'Datos replicados en la Base de Datos SQL con éxito.');
      } else {
        showToast(`⚠️ ${res.error || 'Error al replicar en SQL'}`, 'error');
      }
    } catch (err: any) {
      showToast(`Error al replicar: ${err.message}`, 'error');
    } finally {
      setSincronizandoSql(false);
    }
  };

  const handleCopiarSql = () => {
    navigator.clipboard.writeText(OBTENER_SCRIPT_SQL_DDL());
    setCopiadoSql(true);
    showToast('Script SQL copiado al portapapeles.');
    setTimeout(() => setCopiadoSql(false), 2500);
  };

  const estadoBadge = () => {
    if (sqlConfig.lastSyncStatus === 'success') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="h-3.5 w-3.5" />
          CONECTADO Y REPLICANDO
        </span>
      );
    }
    if (sqlConfig.lastSyncStatus === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertCircle className="h-3.5 w-3.5" />
          ERROR DE CONEXIÓN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
        <Sparkles className="h-3.5 w-3.5" />
        EN ESPERA DE CREDENCIALES
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#FBF8F2]">
      
      {/* ALERTA DE TOAST FLOTANTE */}
      {toastNotif && (
        <div className="p-3 bg-[#1E293B] border border-cyan-500/40 rounded-xl flex items-center justify-between text-xs text-cyan-200 animate-slide-in shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="font-medium">{toastNotif}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastNotif(null)} 
            className="text-cyan-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#424246] pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
              <Database className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-[#FBF8F2] flex items-center gap-2">
                Base de Datos Maestra SQL (PostgreSQL / Supabase)
              </h3>
              <p className="text-[#AA9E80] text-[11px] mt-0.5">
                Arquitectura Híbrida: Google Workspace (operación diaria) + PostgreSQL Relacional (inmutable corporativo).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {estadoBadge()}
        </div>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS Y RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#2B2B2E] border border-[#424246] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#AA9E80] uppercase tracking-wider block">
              Telas en Cola SQL
            </span>
            <span className="text-xl font-bold font-mono text-[#FBF8F2] block mt-0.5">
              {solicitudesTelas.length} registros
            </span>
            <span className="text-[10px] text-emerald-400">
              {sqlConfig.totalSyncedTelas || 0} sincronizados
            </span>
          </div>
          <div className="p-3 bg-[#363639] rounded-xl text-indigo-400">
            <Table className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#2B2B2E] border border-[#424246] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#AA9E80] uppercase tracking-wider block">
              Accesorios / Insumos
            </span>
            <span className="text-xl font-bold font-mono text-[#FBF8F2] block mt-0.5">
              {solicitudesAccesorios.length} registros
            </span>
            <span className="text-[10px] text-emerald-400">
              {sqlConfig.totalSyncedAccesorios || 0} sincronizados
            </span>
          </div>
          <div className="p-3 bg-[#363639] rounded-xl text-amber-400">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#2B2B2E] border border-[#424246] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#AA9E80] uppercase tracking-wider block">
              Motor Activo
            </span>
            <span className="text-sm font-bold font-mono uppercase text-[#C6A466] block mt-0.5">
              {sqlConfig.engine === 'supabase' ? 'Supabase REST' : 'PostgreSQL 16'}
            </span>
            <span className="text-[10px] text-[#AA9E80] truncate max-w-[140px] block">
              {sqlConfig.database || 'stflab_calidad'}
            </span>
          </div>
          <div className="p-3 bg-[#363639] rounded-xl text-cyan-400">
            <Server className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* NAVEGACIÓN DE SUB-PESTAÑAS */}
      <div className="flex border-b border-[#424246] gap-2">
        <button
          type="button"
          onClick={() => setPestanaSql('conexion')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            pestanaSql === 'conexion'
              ? 'border-[#C6A466] text-[#FBF8F2]'
              : 'border-transparent text-[#AA9E80] hover:text-[#FBF8F2]'
          }`}
        >
          <Server className="h-3.5 w-3.5" />
          Configuración y Parámetros
        </button>

        <button
          type="button"
          onClick={() => setPestanaSql('tablas')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            pestanaSql === 'tablas'
              ? 'border-[#C6A466] text-[#FBF8F2]'
              : 'border-transparent text-[#AA9E80] hover:text-[#FBF8F2]'
          }`}
        >
          <Table className="h-3.5 w-3.5" />
          Estructura de Tablas (DDL)
        </button>

        <button
          type="button"
          onClick={() => setPestanaSql('esquema')}
          className={`pb-2.5 px-3 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
            pestanaSql === 'esquema'
              ? 'border-[#C6A466] text-[#FBF8F2]'
              : 'border-transparent text-[#AA9E80] hover:text-[#FBF8F2]'
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          Exportar Script SQL (.sql)
        </button>
      </div>

      {/* PESTAÑA 1: CONFIGURACIÓN DE CONEXIÓN */}
      {pestanaSql === 'conexion' && (
        <div className="space-y-5 bg-[#2B2B2E] border border-[#424246] rounded-2xl p-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#363639] p-3.5 rounded-xl border border-[#424246]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold block">Replicación Dual Automática (Sheets + SQL)</span>
                <span className="text-[10px] text-[#AA9E80]">
                  Al registrar o dictaminar en STFLab, los datos se guardan en Sheets y se replican al instante en PostgreSQL.
                </span>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled} 
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-[#424246] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Selector de Motor */}
          <div>
            <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wider mb-2">
              Tipo de Motor o Conexión Corporativa
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setEngine('postgresql')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  engine === 'postgresql'
                    ? 'border-indigo-500 bg-indigo-950/30 text-white font-bold'
                    : 'border-[#424246] bg-[#242426] text-[#AA9E80] hover:border-[#606066]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold block">PostgreSQL Nativo</span>
                  {engine === 'postgresql' && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                </div>
                <span className="text-[10px] opacity-75 mt-0.5 block">Servidor local / Cloud SQL / AWS RDS</span>
              </button>

              <button
                type="button"
                onClick={() => setEngine('supabase')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  engine === 'supabase'
                    ? 'border-emerald-500 bg-emerald-950/30 text-white font-bold'
                    : 'border-[#424246] bg-[#242426] text-[#AA9E80] hover:border-[#606066]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold block">Supabase (Postgres Cloud)</span>
                  {engine === 'supabase' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                </div>
                <span className="text-[10px] opacity-75 mt-0.5 block">REST API segura sin abrir puertos</span>
              </button>

              <button
                type="button"
                onClick={() => setEngine('cloudsql')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  engine === 'cloudsql'
                    ? 'border-amber-500 bg-amber-950/30 text-white font-bold'
                    : 'border-[#424246] bg-[#242426] text-[#AA9E80] hover:border-[#606066]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold block">Google Cloud SQL</span>
                  {engine === 'cloudsql' && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
                </div>
                <span className="text-[10px] opacity-75 mt-0.5 block">Instancia gestionada en GCP</span>
              </button>
            </div>
          </div>

          {/* Formulario según motor */}
          {engine === 'supabase' ? (
            <div className="space-y-4 pt-2 border-t border-[#424246]">
              <div>
                <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="w-full bg-[#242426] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">
                  Supabase Anon / Service Role Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="w-full bg-[#242426] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-[#424246]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">
                    Host del Servidor SQL
                  </label>
                  <input
                    type="text"
                    placeholder="db.stfgroup.com o 34.120.x.x"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    className="w-full bg-[#242426] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">
                    Puerto
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full bg-[#242426] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">
                    Nombre Base de Datos
                  </label>
                  <input
                    type="text"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className="w-full bg-[#242426] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-[#242426] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#242426] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#424246]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleProbarConexion}
                disabled={probandoConexion}
                className="px-4 py-2.5 bg-[#363639] hover:bg-[#424246] text-[#FBF8F2] font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer border border-[#525256]"
              >
                <RefreshCw className={`h-4 w-4 ${probandoConexion ? 'animate-spin text-indigo-400' : ''}`} />
                <span>{probandoConexion ? 'Comprobando...' : 'Probar Conexión SQL'}</span>
              </button>

              <button
                type="button"
                onClick={handleSincronizarDatos}
                disabled={sincronizandoSql}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Zap className={`h-4 w-4 ${sincronizandoSql ? 'animate-bounce' : ''}`} />
                <span>{sincronizandoSql ? 'Replicando Lote...' : 'Sincronizar Todo a SQL Ahora'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleGuardarConfig}
              className="px-5 py-2.5 bg-[#C6A466] hover:bg-[#D6CDB8] text-[#2B2B2E] font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
            >
              Guardar Configuración SQL
            </button>
          </div>

          {/* MENSAJE DE ESTADO */}
          {sqlConfig.lastSyncMessage && (
            <div className="p-3 bg-[#242426] rounded-xl border border-[#424246] text-[11px] text-[#AA9E80] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-[#C6A466] shrink-0" />
                <span>{sqlConfig.lastSyncMessage}</span>
              </div>
              {sqlConfig.lastSyncTimestamp && (
                <span className="font-mono text-[10px] text-[#707075] shrink-0">
                  {new Date(sqlConfig.lastSyncTimestamp).toLocaleTimeString('es-CO')}
                </span>
              )}
            </div>
          )}

        </div>
      )}

      {/* PESTAÑA 2: ESTRUCTURA DE TABLAS */}
      {pestanaSql === 'tablas' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-[#2B2B2E] border border-[#424246] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#424246] pb-2">
                <span className="text-xs font-mono font-bold text-indigo-400">stflab_solicitudes_telas</span>
                <span className="text-[10px] bg-indigo-950/40 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">Cabecera</span>
              </div>
              <p className="text-[11px] text-[#AA9E80]">
                Almacena el número de solicitud, solicitante, proveedor, orden de compra, estado del flujo y URLs de fichas adjuntas en Drive.
              </p>
            </div>

            <div className="bg-[#2B2B2E] border border-[#424246] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#424246] pb-2">
                <span className="text-xs font-mono font-bold text-amber-400">stflab_items_telas</span>
                <span className="text-[10px] bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Detalle & Ensayos</span>
              </div>
              <p className="text-[11px] text-[#AA9E80]">
                Contiene los rollos, gramaje, anchos, encogimientos, viro, solideces al lavado/frote, pilling, dictamen de laboratorio y decisión de compras con descuento.
              </p>
            </div>

            <div className="bg-[#2B2B2E] border border-[#424246] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#424246] pb-2">
                <span className="text-xs font-mono font-bold text-emerald-400">stflab_fichas_tecnicas</span>
                <span className="text-[10px] bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">Biblioteca Maestra</span>
              </div>
              <p className="text-[11px] text-[#AA9E80]">
                Base histórica y tolerancias maestras de laboratorio. Vinculada con los 1,644 archivos de fichas técnicas en Google Drive.
              </p>
            </div>

            <div className="bg-[#2B2B2E] border border-[#424246] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#424246] pb-2">
                <span className="text-xs font-mono font-bold text-cyan-400">stflab_auditoria_logs</span>
                <span className="text-[10px] bg-cyan-950/40 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">Inmutable</span>
              </div>
              <p className="text-[11px] text-[#AA9E80]">
                Registro inmutable de auditoría para cada dictamen emitido, aprobación con descuento, creación de usuario o modificación técnica.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* PESTAÑA 3: DESCARGA Y COPIA DE SCRIPT DDL */}
      {pestanaSql === 'esquema' && (
        <div className="space-y-4 bg-[#2B2B2E] border border-[#424246] rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase text-[#FBF8F2] tracking-wider">
                Script de Inicialización DDL (PostgreSQL)
              </h4>
              <p className="text-[11px] text-[#AA9E80] mt-0.5">
                Ejecuta este archivo en pgAdmin, DBeaver, Supabase SQL Editor o tu consola de Cloud SQL para crear el esquema en 1 segundo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopiarSql}
                className="px-3.5 py-2 bg-[#363639] hover:bg-[#424246] text-[#FBF8F2] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#525256]"
              >
                {copiadoSql ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-[#C6A466]" />}
                <span>{copiadoSql ? '¡Copiado!' : 'Copiar SQL'}</span>
              </button>

              <button
                type="button"
                onClick={descargarScriptDdlSql}
                className="px-4 py-2 bg-[#C6A466] hover:bg-[#D6CDB8] text-[#2B2B2E] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Descargar Archivo .sql</span>
              </button>
            </div>
          </div>

          <div className="bg-[#1C1C1E] rounded-xl p-4 border border-[#38383B] max-h-72 overflow-y-auto font-mono text-[11px] text-[#A8B3CF] leading-relaxed select-all">
            <pre className="whitespace-pre-wrap">{OBTENER_SCRIPT_SQL_DDL()}</pre>
          </div>
        </div>
      )}

    </div>
  );
};
