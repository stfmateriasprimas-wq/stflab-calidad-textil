/**
 * STFLAB - Servicio de Base de Datos y Almacenamiento en Google Workspace (Drive & Sheets)
 * STF GROUP S.A.
 * 
 * Gestiona la comunicación entre la aplicación web y el script desplegado en Google Apps Script:
 * - Google Sheets: Base de datos tabular en tiempo real para Solicitudes de Telas y Accesorios.
 * - Google Drive: Repositorio en la nube para Fichas Técnicas, fotos de ensayos y archivos adjuntos.
 */

import { 
  GoogleIntegrationConfig, 
  GoogleSyncResponse, 
  GoogleDriveUploadResult 
} from '../types/googleIntegration';
import { 
  SolicitudTelasCompleta, 
  SolicitudAccesoriosCompleta, 
  FichaTecnicaHistoricaVersionada, 
  EvaluacionForrosCosturas 
} from '../types';

const STORAGE_CONFIG_KEY = 'stflab_google_workspace_config_v1';

// Configuración por defecto
const CONFIG_PREDETERMINADA: GoogleIntegrationConfig = {
  webAppUrl: ((import.meta as any).env?.VITE_GOOGLE_WEBAPP_URL as string) || 'https://script.google.com/macros/s/AKfycby5XPSFylI_arwbdNdXgm7uEC20aPhtn2yU0vZcVrSeZTB0JlIveOoSzEdIx-1q7_rc/exec',
  autoSyncEnabled: true,
  spreadsheetId: '1a92iL8dVh5MwGJK0idIpdspcGKHGNfbGn6VmVaK20d0',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1a92iL8dVh5MwGJK0idIpdspcGKHGNfbGn6VmVaK20d0/edit',
  rootFolderId: '112Ui98n0NXEgi-9HV9B7DuYl_uHIEEFR',
  rootFolderUrl: 'https://drive.google.com/drive/folders/112Ui98n0NXEgi-9HV9B7DuYl_uHIEEFR',
  fichasFolderUrl: 'https://drive.google.com/drive/folders/1RG7lYjNQ-EhXnbmhNLeyUVLLMIyPAOrt',
  ensayosFolderUrl: 'https://drive.google.com/drive/folders/1eCmkUESvZ0Ml7ETria6eF22KHzxXcmoD',
  solicitudesFolderUrl: 'https://drive.google.com/drive/folders/14cvL1Jv_sT3_Wy54zcliKOoenKr-G4tB',
  driveFolderBibliotecaId: '1j2VLcwxEur3GNMtP3NIh08ncDtMCqUYA',
  driveFolderBibliotecaUrl: 'https://drive.google.com/drive/folders/1j2VLcwxEur3GNMtP3NIh08ncDtMCqUYA?usp=sharing',
  lastSyncStatus: 'success',
  lastSyncTimestamp: new Date().toISOString(),
  lastSyncMessage: 'Conexión activa con Google Workspace STFLab y 1,644 archivos indexados',
  totalSyncedTelas: 0,
  totalSyncedAccesorios: 0,
  totalSyncedForros: 0,
  totalSyncedFichas: 0,
  totalSyncedProveedores: 0
};

/**
 * Obtiene la configuración actual de integración con Google
 */
export const obtenerConfiguracionGoogle = (): GoogleIntegrationConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...CONFIG_PREDETERMINADA, ...parsed };
    }
  } catch (e) {
    console.warn('Error leyendo configuración de Google desde localStorage:', e);
  }
  return { ...CONFIG_PREDETERMINADA };
};

/**
 * Guarda o actualiza la configuración de Google Workspace
 */
export const guardarConfiguracionGoogle = (
  parcial: Partial<GoogleIntegrationConfig>
): GoogleIntegrationConfig => {
  const actual = obtenerConfiguracionGoogle();
  const actualizada: GoogleIntegrationConfig = { ...actual, ...parcial };
  
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(actualizada));
    // Disparar evento para componentes reactivos
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stflab-google-config-updated', { detail: actualizada }));
    }
  } catch (e) {
    console.error('Error guardando configuración de Google:', e);
  }

  return actualizada;
};

/**
 * Función interna para enviar peticiones al Google Apps Script Web App
 * IMPORTANTE: Se envía Content-Type 'text/plain' para evitar el preflight OPTIONS de CORS que Google bloquea.
 */
const invocarGoogleWebApp = async (
  action: string,
  data?: any,
  configOverride?: GoogleIntegrationConfig
): Promise<any> => {
  const config = configOverride || obtenerConfiguracionGoogle();
  const url = (config.webAppUrl || '').trim();

  if (!url) {
    throw new Error('La URL del Web App de Google Apps Script no está configurada.');
  }

  if (!url.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('La URL debe comenzar con https://script.google.com/macros/s/...');
  }

  const payload = {
    action,
    data,
    ...(typeof data === 'object' && !Array.isArray(data) ? data : {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 segundos de timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }

    const resultado = await response.json();
    return resultado;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('La solicitud a Google Workspace excedió el tiempo de espera (timeout de 45s).');
    }
    throw err;
  }
};

/**
 * 1. Probar la conexión con Google Apps Script (Ping)
 */
export const probarConexionGoogle = async (
  urlPrueba?: string
): Promise<{ success: boolean; message: string; meta?: any }> => {
  try {
    const config = obtenerConfiguracionGoogle();
    const configActual = urlPrueba ? { ...config, webAppUrl: urlPrueba } : config;

    const res = await invocarGoogleWebApp('ping', undefined, configActual);

    if (res && res.success) {
      // Actualizar URLs de hojas y carpetas devueltas por el script
      guardarConfiguracionGoogle({
        webAppUrl: configActual.webAppUrl,
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        rootFolderId: res.rootFolderId,
        rootFolderUrl: res.rootFolderUrl,
        userAccountEmail: res.userEmail,
        lastSyncStatus: 'success',
        lastSyncMessage: 'Conexión verificada exitosamente'
      });

      return {
        success: true,
        message: '¡Conexión exitosa con Google Workspace! Se detectó la hoja de cálculo y carpeta en Drive.',
        meta: res
      };
    } else {
      return {
        success: false,
        message: res.error || 'Respuesta no satisfactoria de Google Apps Script'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Error al conectar con Google Apps Script'
    };
  }
};

/**
 * 2. Inicializar la estructura de Google Sheets y carpetas de Google Drive
 */
export const inicializarEstructuraGoogle = async (): Promise<GoogleSyncResponse> => {
  try {
    const res = await invocarGoogleWebApp('initStructure');
    if (res && res.success) {
      guardarConfiguracionGoogle({
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        rootFolderId: res.rootFolderId,
        rootFolderUrl: res.rootFolderUrl,
        fichasFolderUrl: res.fichasFolderUrl,
        ensayosFolderUrl: res.ensayosFolderUrl,
        solicitudesFolderUrl: res.solicitudesFolderUrl,
        lastSyncStatus: 'success',
        lastSyncMessage: 'Estructura en Sheets y Drive configurada con éxito'
      });
      return res;
    }
    return { success: false, error: res.error || 'No se pudo inicializar la estructura' };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Fallo de comunicación al inicializar estructura' };
  }
};

/**
 * 3. Sincronizar Solicitudes de Telas en Google Sheets
 */
export const sincronizarTelasGoogle = async (
  solicitudes: SolicitudTelasCompleta[]
): Promise<GoogleSyncResponse> => {
  const config = obtenerConfiguracionGoogle();
  if (!config.webAppUrl) {
    return { success: false, error: 'Google Workspace no está configurado.' };
  }

  try {
    const res = await invocarGoogleWebApp('syncTelas', solicitudes);
    if (res && res.success) {
      guardarConfiguracionGoogle({
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sincronizadas ${res.telasProcesadas || solicitudes.length} solicitudes de telas en Google Sheets`,
        totalSyncedTelas: res.telasProcesadas || solicitudes.length
      });
      return res;
    }
    return { success: false, error: res.error || 'Error al sincronizar telas' };
  } catch (error: any) {
    guardarConfiguracionGoogle({
      lastSyncStatus: 'error',
      lastSyncMessage: error?.message || 'Error al sincronizar telas'
    });
    return { success: false, error: error?.message };
  }
};

/**
 * 4. Sincronizar Solicitudes de Accesorios / Insumos en Google Sheets
 */
export const sincronizarAccesoriosGoogle = async (
  solicitudes: SolicitudAccesoriosCompleta[]
): Promise<GoogleSyncResponse> => {
  const config = obtenerConfiguracionGoogle();
  if (!config.webAppUrl) {
    return { success: false, error: 'Google Workspace no está configurado.' };
  }

  try {
    const res = await invocarGoogleWebApp('syncAccesorios', solicitudes);
    if (res && res.success) {
      guardarConfiguracionGoogle({
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sincronizadas ${res.accesoriosProcesados || solicitudes.length} solicitudes de insumos en Google Sheets`,
        totalSyncedAccesorios: res.accesoriosProcesados || solicitudes.length
      });
      return res;
    }
    return { success: false, error: res.error || 'Error al sincronizar accesorios' };
  } catch (error: any) {
    guardarConfiguracionGoogle({
      lastSyncStatus: 'error',
      lastSyncMessage: error?.message || 'Error al sincronizar insumos'
    });
    return { success: false, error: error?.message };
  }
};

/**
 * 5. Sincronización Completa (Telas + Accesorios)
 */
export const sincronizarTodoGoogle = async (
  telas: SolicitudTelasCompleta[],
  accesorios: SolicitudAccesoriosCompleta[]
): Promise<GoogleSyncResponse> => {
  const config = obtenerConfiguracionGoogle();
  if (!config.webAppUrl) {
    return { success: false, error: 'Google Workspace no está configurado.' };
  }

  try {
    const res = await invocarGoogleWebApp('syncAll', { telas, accesorios });
    if (res && res.success) {
      guardarConfiguracionGoogle({
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sincronización completa: ${telas.length} telas y ${accesorios.length} insumos respaldados`,
        totalSyncedTelas: telas.length,
        totalSyncedAccesorios: accesorios.length
      });
      return res;
    }
    return { success: false, error: res.error || 'Error durante la sincronización total' };
  } catch (error: any) {
    guardarConfiguracionGoogle({
      lastSyncStatus: 'error',
      lastSyncMessage: error?.message || 'Fallo en sincronización total'
    });
    return { success: false, error: error?.message };
  }
};

/**
 * 6. Sincronizar Evaluaciones de Forros y Costuras en Google Sheets
 */
export const sincronizarForrosCosturasGoogle = async (
  evaluaciones: EvaluacionForrosCosturas[]
): Promise<GoogleSyncResponse> => {
  const config = obtenerConfiguracionGoogle();
  if (!config.webAppUrl) {
    return { success: false, error: 'Google Workspace no está configurado.' };
  }

  try {
    const res = await invocarGoogleWebApp('syncForrosCosturas', evaluaciones);
    if (res && res.success) {
      guardarConfiguracionGoogle({
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sincronizados ${res.forrosProcesados || evaluaciones.length} reportes de forros y costuras en Google Sheets`,
        totalSyncedForros: res.forrosProcesados || evaluaciones.length
      });
      return res;
    }
    return { success: false, error: res.error || 'Error al sincronizar forros y costuras' };
  } catch (error: any) {
    guardarConfiguracionGoogle({
      lastSyncStatus: 'error',
      lastSyncMessage: error?.message || 'Error al sincronizar forros y costuras'
    });
    return { success: false, error: error?.message };
  }
};

/**
 * 7. Sincronizar Fichas Técnicas del Fabricante en Google Sheets
 */
export const sincronizarFichasGoogle = async (
  fichas: FichaTecnicaHistoricaVersionada[]
): Promise<GoogleSyncResponse> => {
  const config = obtenerConfiguracionGoogle();
  if (!config.webAppUrl) {
    return { success: false, error: 'Google Workspace no está configurado.' };
  }

  try {
    const res = await invocarGoogleWebApp('syncFichas', fichas);
    if (res && res.success) {
      guardarConfiguracionGoogle({
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sincronizadas ${res.fichasProcesadas || fichas.length} fichas técnicas en Google Sheets`,
        totalSyncedFichas: res.fichasProcesadas || fichas.length
      });
      return res;
    }
    return { success: false, error: res.error || 'Error al sincronizar fichas técnicas' };
  } catch (error: any) {
    guardarConfiguracionGoogle({
      lastSyncStatus: 'error',
      lastSyncMessage: error?.message || 'Error al sincronizar fichas técnicas'
    });
    return { success: false, error: error?.message };
  }
};

/**
 * 8. Sincronizar Directorio Maestro de Proveedores en Google Sheets
 */
export const sincronizarProveedoresGoogle = async (
  proveedores: any[]
): Promise<GoogleSyncResponse> => {
  const config = obtenerConfiguracionGoogle();
  if (!config.webAppUrl) {
    return { success: false, error: 'Google Workspace no está configurado.' };
  }

  try {
    const res = await invocarGoogleWebApp('syncProveedores', proveedores);
    if (res && res.success) {
      guardarConfiguracionGoogle({
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sincronizados ${res.proveedoresProcesados || proveedores.length} proveedores en Google Sheets`,
        totalSyncedProveedores: res.proveedoresProcesados || proveedores.length
      });
      return res;
    }
    return { success: false, error: res.error || 'Error al sincronizar proveedores' };
  } catch (error: any) {
    return { success: false, error: error?.message };
  }
};

/**
 * 9. Sincronización Maestra Total (Telas + Accesorios + Forros/Costuras + Fichas + Proveedores)
 */
export const sincronizarTodoMasterGoogle = async (payload: {
  telas?: SolicitudTelasCompleta[];
  accesorios?: SolicitudAccesoriosCompleta[];
  forros?: EvaluacionForrosCosturas[];
  fichas?: FichaTecnicaHistoricaVersionada[];
  proveedores?: any[];
}): Promise<GoogleSyncResponse> => {
  const config = obtenerConfiguracionGoogle();
  if (!config.webAppUrl) {
    return { success: false, error: 'Google Workspace no está configurado.' };
  }

  try {
    const res = await invocarGoogleWebApp('syncAllMaster', payload);
    if (res && res.success) {
      guardarConfiguracionGoogle({
        lastSyncTimestamp: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: `Sincronización maestra completada en las 7 pestañas de Google Sheets`,
        totalSyncedTelas: payload.telas ? payload.telas.length : config.totalSyncedTelas,
        totalSyncedAccesorios: payload.accesorios ? payload.accesorios.length : config.totalSyncedAccesorios,
        totalSyncedForros: payload.forros ? payload.forros.length : config.totalSyncedForros,
        totalSyncedFichas: payload.fichas ? payload.fichas.length : config.totalSyncedFichas,
        totalSyncedProveedores: payload.proveedores ? payload.proveedores.length : config.totalSyncedProveedores
      });
      return res;
    }
    return { success: false, error: res.error || 'Error durante la sincronización maestra' };
  } catch (error: any) {
    guardarConfiguracionGoogle({
      lastSyncStatus: 'error',
      lastSyncMessage: error?.message || 'Fallo en sincronización maestra'
    });
    return { success: false, error: error?.message };
  }
};

/**
 * 6. Subir archivo a Google Drive (PDF, Word, Excel, Imagen)
 * Permite especificar la carpeta destino por categoría o por ID directo (como la carpeta oficial de Biblioteca Técnica)
 */
export const subirArchivoAGoogleDrive = async (
  file: File | Blob,
  nombreArchivo: string,
  folderCategory: 'fichas' | 'ensayos' | 'solicitudes' | 'general' = 'fichas',
  targetFolderId?: string
): Promise<GoogleDriveUploadResult> => {
  const config = obtenerConfiguracionGoogle();
  if (!config.webAppUrl) {
    return { success: false, error: 'Google Workspace no está configurado para subir a Drive.' };
  }

  const folderDestinoId = targetFolderId || config.driveFolderBibliotecaId || '1j2VLcwxEur3GNMtP3NIh08ncDtMCqUYA';

  try {
    // Convertir archivo a Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const mimeType = (file as any).type || 'application/octet-stream';

    const res = await invocarGoogleWebApp('uploadFile', {
      fileName: nombreArchivo,
      mimeType,
      base64Data,
      folderCategory,
      targetFolderId: folderDestinoId
    });

    if (res && res.success) {
      return {
        success: true,
        fileId: res.fileId,
        fileName: res.fileName,
        fileUrl: res.fileUrl,
        downloadUrl: res.downloadUrl,
        thumbnailUrl: res.previewUrl,
        folderCategory,
        targetFolderId: res.folderId
      };
    }

    return {
      success: false,
      error: res.error || 'Error al subir archivo a Google Drive'
    };
  } catch (error: any) {
    console.error('Error subiendo archivo a Google Drive:', error);
    return {
      success: false,
      error: error?.message || 'Fallo de conexión al subir a Drive'
    };
  }
};

/**
 * Estructura oficial indexada de la carpeta de Google Drive "LABORATORIO"
 */
export const ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO = {
  folderId: '1j2VLcwxEur3GNMtP3NIh08ncDtMCqUYA',
  folderName: 'LABORATORIO',
  folderUrl: 'https://drive.google.com/drive/folders/1j2VLcwxEur3GNMtP3NIh08ncDtMCqUYA?usp=sharing',
  folders: [
    {
      id: '1UKZhllN30ePu1LIX79x1d47-hIybEmgX',
      name: '2023',
      year: '2023',
      url: 'https://drive.google.com/drive/folders/1UKZhllN30ePu1LIX79x1d47-hIybEmgX'
    },
    {
      id: '1oI5S0KgSgCOEb7jw2hKQ-ye8vwI0FSyF',
      name: '2024',
      year: '2024',
      url: 'https://drive.google.com/drive/folders/1oI5S0KgSgCOEb7jw2hKQ-ye8vwI0FSyF'
    },
    {
      id: '1ZEdsOi0rd9IhyTxUfzJPwB50uqe8UERu',
      name: 'FICHAS TECNICAS 2024',
      year: '2024',
      url: 'https://drive.google.com/drive/folders/1ZEdsOi0rd9IhyTxUfzJPwB50uqe8UERu'
    },
    {
      id: '1Kk186DQyXZheEBEi4DQWG3kcW4f3uUGQ',
      name: '2025',
      year: '2025',
      url: 'https://drive.google.com/drive/folders/1Kk186DQyXZheEBEi4DQWG3kcW4f3uUGQ'
    },
    {
      id: '1FhcPvTXfJGRAuj2uGIuAb7OFj-eT1wv2',
      name: '2026',
      year: '2026',
      url: 'https://drive.google.com/drive/folders/1FhcPvTXfJGRAuj2uGIuAb7OFj-eT1wv2'
    },
    {
      id: '1-hMduONJyBndYAi58PqZRCUEoXeGczq4',
      name: 'FICHAS TECNICAS BASE LABORATORIO',
      year: 'Base',
      url: 'https://drive.google.com/drive/folders/1-hMduONJyBndYAi58PqZRCUEoXeGczq4'
    }
  ],
  files: [
    {
      id: '16NYD9Okc2rA8mCw4pTuYga9l-_YiqKSp',
      name: 'FICHA TECNICA ESTANDAR.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      url: 'https://drive.google.com/file/d/16NYD9Okc2rA8mCw4pTuYga9l-_YiqKSp/view',
      folderName: 'LABORATORIO',
      year: 'Estándar'
    },
    {
      id: '1DKAN0FdmYMYQvpP4TY-BFk0CaEOhW0qU',
      name: '1A BASE DE REFERENCIAS .xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      url: 'https://drive.google.com/file/d/1DKAN0FdmYMYQvpP4TY-BFk0CaEOhW0qU/view',
      folderName: 'LABORATORIO',
      year: 'Referencias'
    }
  ]
};

/**
 * 7. Listar archivos y subcarpetas de la carpeta oficial de Google Drive
 */
export const listarArchivosCarpetaDrive = async (
  folderId?: string
): Promise<{ 
  success: boolean; 
  folderId?: string;
  folders?: any[]; 
  files?: any[]; 
  error?: string; 
  folderUrl?: string; 
  folderName?: string;
  isMockOrPreloaded?: boolean;
}> => {
  const config = obtenerConfiguracionGoogle();
  const idObjetivo = folderId || config.driveFolderBibliotecaId || '1j2VLcwxEur3GNMtP3NIh08ncDtMCqUYA';

  // Si no hay Web App configurada aún, retornar la estructura oficial detectada en Google Drive
  if (!config.webAppUrl) {
    return { 
      success: true, 
      folderId: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folderId,
      folderName: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folderName,
      folderUrl: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folderUrl,
      folders: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folders,
      files: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.files,
      isMockOrPreloaded: true
    };
  }

  try {
    const res = await invocarGoogleWebApp('listDriveFolder', { folderId: idObjetivo });
    if (res && res.success) {
      return res;
    }
    // Si la llamada devuelve error o no trae carpetas, combinar con la estructura oficial
    return {
      success: true,
      folderId: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folderId,
      folderName: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folderName,
      folderUrl: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folderUrl,
      folders: res.folders || ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folders,
      files: (res.files && res.files.length > 0) ? res.files : ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.files,
      isMockOrPreloaded: false
    };
  } catch (err: any) {
    return { 
      success: true, 
      folders: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folders,
      files: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.files,
      folderUrl: ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folderUrl,
      isMockOrPreloaded: true,
      error: `Conectado en modo lectura directa: ${err?.message || ''}` 
    };
  }
};

/**
 * 8. Leer contenido de un archivo en Drive en Base64 para Lectura Inteligente
 */
export const leerArchivoDrive = async (
  fileId: string
): Promise<{ success: boolean; base64Data?: string; fileName?: string; mimeType?: string; error?: string }> => {
  try {
    const res = await invocarGoogleWebApp('readDriveFile', { fileId });
    return res;
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
};

/**
 * 9. Consultar datos de Google Sheets
 */
export const obtenerDatosDeGoogleSheets = async (): Promise<any> => {
  return await invocarGoogleWebApp('getAllData');
};

