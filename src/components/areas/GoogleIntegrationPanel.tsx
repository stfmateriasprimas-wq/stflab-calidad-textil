import React, { useState } from 'react';
import { useQuality } from '../../context/QualityContext';
import { 
  Database, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Folder, 
  FolderPlus, 
  FileSpreadsheet, 
  Upload, 
  Copy, 
  Check, 
  Code2, 
  ChevronDown, 
  ChevronUp, 
  HardDrive, 
  FileText, 
  Sparkles, 
  Eye,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { subirArchivoAGoogleDrive } from '../../services/googleDatabaseService';

// Código de Google Apps Script para copiar directamente al portapapeles
const APPS_SCRIPT_SOURCE_CODE = `/**
 * =========================================================================================
 * STFLAB - SISTEMA DE BASE DE DATOS EN GOOGLE SHEETS & GOOGLE DRIVE
 * STF GROUP S.A. (Studio F, ELA, STF MAN)
 * =========================================================================================
 * 
 * Este script actúa como la API Backend Serverless en Google Workspace para STFLab.
 * Permite:
 * 1. Sincronizar y persistir Solicitudes de Telas y Accesorios / Insumos en Google Sheets.
 * 2. Almacenar y organizar archivos adjuntos (PDFs de Fichas Técnicas, fotos de ensayos) en Google Drive.
 * 3. Proporcionar enlaces públicos o compartidos de Drive directamente en la aplicación.
 * 
 * GUÍA RÁPIDA DE INSTALACIÓN Y DESPLIEGUE:
 * 1. Entra a Google Drive (https://drive.google.com) con tu cuenta corporativa.
 * 2. Crea una Hoja de Cálculo nueva llamada "STFLAB - Base de Datos Calidad Textil".
 * 3. En el menú superior de la hoja, haz clic en: Extensiones > Apps Script.
 * 4. Borra todo el código que aparezca y pega TODO este archivo.
 * 5. Haz clic en "Guardar" (ícono de disquete).
 * 6. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 7. Selecciona el tipo (ícono de engranaje) > "Aplicación web".
 * 8. Configura:
 *    - Descripción: "STFLAB API v1"
 *    - Ejecutar como: "Yo" (tu cuenta de correo)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone) -> IMPORTANTE para permitir que la app envíe datos.
 * 9. Haz clic en "Implementar" y autoriza los permisos requeridos de Google.
 * 10. Copia la "URL de la aplicación web" (termina en /exec) y pégala en STFLAB > Configuración > Google Workspace.
 * =========================================================================================
 */

// Constantes de configuración
var NOMBRE_HOJA_CALCULO = "STFLAB - Base de Datos Calidad Textil";
var NOMBRE_CARPETA_RAIZ = "STFLAB_Calidad_Textil";
var SUB_CARPETA_FICHAS = "01_Fichas_Tecnicas";
var SUB_CARPETA_ENSAYOS = "02_Ensayos_Fotos";
var SUB_CARPETA_SOLICITUDES = "03_Solicitudes_Adjuntos";

// Carpeta Oficial Vinculada de Google Drive para Biblioteca Técnica
var CARPETA_BIBLIOTECA_DEFAULT_ID = "1j2VLcwxEur3GNMtP3NIh08ncDtMCqUYA";

var HOJA_TELAS = "SOLICITUDES_TELAS";
var HOJA_ACCESORIOS = "SOLICITUDES_ACCESORIOS";
var HOJA_FICHAS = "FICHAS_TECNICAS";
var HOJA_AUDITORIA = "AUDITORIA_LOGS";

/**
 * Manejador de peticiones GET (Ping y lectura)
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};
    var action = params.action || 'ping';

    if (action === 'ping') {
      return handlePing();
    }
    if (action === 'getData') {
      return handleGetAllData();
    }
    if (action === 'listFolder') {
      return handleListDriveFolder(params);
    }

    return createJsonResponse({
      success: true,
      message: "API Google Apps Script de STFLab activa y respondiendo correctamente.",
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

/**
 * Manejador de peticiones POST (Inserción, sincronización, subida de archivos)
 */
function doPost(e) {
  try {
    var contents = e.postData ? e.postData.contents : '{}';
    var payload = {};
    try {
      payload = JSON.parse(contents);
    } catch (parseErr) {
      return createJsonResponse({
        success: false,
        error: "Error al decodificar JSON del cuerpo de la petición: " + parseErr.toString()
      });
    }

    var action = payload.action || 'ping';

    if (action === 'ping') {
      return handlePing();
    } else if (action === 'initStructure') {
      return handleInitStructure();
    } else if (action === 'syncTelas') {
      return handleSyncTelas(payload.data);
    } else if (action === 'syncAccesorios') {
      return handleSyncAccesorios(payload.data);
    } else if (action === 'syncAll') {
      return handleSyncAll(payload.data);
    } else if (action === 'uploadFile') {
      return handleUploadFile(payload);
    } else if (action === 'getAllData') {
      return handleGetAllData();
    } else if (action === 'listDriveFolder') {
      return handleListDriveFolder(payload);
    } else if (action === 'readDriveFile') {
      return handleReadDriveFile(payload);
    } else {
      return createJsonResponse({
        success: false,
        error: "Acción no reconocida: " + action
      });
    }
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString(),
      stack: err.stack
    });
  }
}


/**
 * Responde con Ping y metadatos de conexión
 */
function handlePing() {
  var ss = getOrCreateSpreadsheet();
  var rootFolder = getOrCreateRootFolder();
  var userEmail = Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();

  return createJsonResponse({
    success: true,
    message: "Conexión exitosa con Google Workspace STFLab",
    timestamp: new Date().toISOString(),
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    rootFolderId: rootFolder.getId(),
    rootFolderUrl: rootFolder.getUrl(),
    userEmail: userEmail
  });
}

/**
 * Inicializa la estructura de hojas y carpetas en Drive con formato profesional
 */
function handleInitStructure() {
  var ss = getOrCreateSpreadsheet();
  var rootFolder = getOrCreateRootFolder();
  var fichasFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_FICHAS);
  var ensayosFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_ENSAYOS);
  var solFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_SOLICITUDES);

  // Inicializar pestañas con encabezados y estilos corporativos STF
  setupSheetHeaders(ss, HOJA_TELAS, [
    "ID_SOLICITUD", "NUMERO_SOLICITUD", "FECHA_SOLICITUD", "SOLICITANTE", "PROVEEDOR",
    "ORDEN_COMPRA", "ESTADO_FLUJO", "ID_TELA", "SOLICITUD_COMPRA", "REFERENCIA",
    "COLOR", "OC_COL", "OBSERVACION", "DICTAMEN_LAB", "RESULTADO_LAB",
    "RESPONSABLE_LAB", "FECHA_RESPUESTA_LAB", "DECISION_COMPRA", "FECHA_DECISION_COMPRA",
    "RESPONSABLE_COMPRA", "DESCUENTO_NEGOCIADO", "ARCHIVO_ADJUNTO_URL", "FECHA_SINCRONIZACION"
  ]);

  setupSheetHeaders(ss, HOJA_ACCESORIOS, [
    "ID_SOLICITUD", "NUMERO_SOLICITUD", "FECHA_SOLICITUD", "SOLICITANTE", "PROVEEDOR",
    "PRIORIDAD", "ESTADO_FLUJO", "ID_MUESTRA", "REFERENCIA", "COLOR",
    "TALLA", "CANTIDAD_QTY", "DESCRIPCION_INSUMO", "DICTAMEN_LAB", "RESULTADO_LAB",
    "OBSERVACION_LAB", "RESPONSABLE_LAB", "FECHA_RESPUESTA", "CALIFICACION",
    "ARCHIVO_ADJUNTO_URL", "FECHA_SINCRONIZACION"
  ]);

  setupSheetHeaders(ss, HOJA_FICHAS, [
    "ID_FICHA", "CODIGO_FT", "REFERENCIA", "PROVEEDOR", "REF_PROVEEDOR",
    "COMPOSICION", "PESO_G_M2", "ANCHO_UTIL_CM", "TIPO_TEJIDO", "VERSION_ACTUAL",
    "FECHA_VERSION", "USUARIO_CREADOR", "URL_DRIVE_ARCHIVO", "FECHA_SINCRONIZACION"
  ]);

  setupSheetHeaders(ss, HOJA_AUDITORIA, [
    "ID_LOG", "FECHA", "HORA", "COLECCION", "DOCUMENTO_ID",
    "ACCION", "USUARIO", "ROL", "AREA", "DETALLES", "CAMPO_AFECTADO"
  ]);

  return createJsonResponse({
    success: true,
    message: "Estructura de Google Sheets y Google Drive inicializada con éxito.",
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    rootFolderId: rootFolder.getId(),
    rootFolderUrl: rootFolder.getUrl(),
    fichasFolderUrl: fichasFolder.getUrl(),
    ensayosFolderUrl: ensayosFolder.getUrl(),
    solicitudesFolderUrl: solFolder.getUrl()
  });
}

/**
 * Sincroniza Solicitudes de Telas (Upsert / Reemplazo completo)
 */
function handleSyncTelas(data) {
  if (!data || !Array.isArray(data)) {
    return createJsonResponse({ success: false, error: "Datos de telas inválidos o vacíos" });
  }

  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_TELAS);
  if (!sheet) {
    handleInitStructure();
    sheet = ss.getSheetByName(HOJA_TELAS);
  }

  var rows = [];
  var timestamp = new Date().toLocaleString("es-CO");

  data.forEach(function(sol) {
    var telas = (sol.telas && sol.telas.length > 0) ? sol.telas : [{}];
    telas.forEach(function(tela) {
      rows.push([
        sol.id || '',
        sol.numeroSolicitud || '',
        sol.fechaSolicitud || '',
        sol.solicitante || '',
        sol.proveedor || tela.proveedor || '',
        sol.ordenCompra || tela.ocCol || '',
        sol.estadoFlujo || '',
        tela.id || '',
        tela.solicitudCompra || '',
        tela.referencia || '',
        tela.color || '',
        tela.ocCol || '',
        tela.observacion || sol.observacionesGenerales || '',
        tela.dictamen || sol.dictamenGlobal || 'PENDIENTE',
        tela.resultadoLab || '',
        tela.responsableLab || '',
        tela.fechaRespuestaLab || tela.fechaEntrega || '',
        (tela.decisionCompra && tela.decisionCompra.decision) || 'PENDIENTE',
        (tela.decisionCompra && tela.decisionCompra.fechaDecision) || '',
        (tela.decisionCompra && tela.decisionCompra.responsable) || '',
        (tela.decisionCompra && tela.decisionCompra.descuentoNegociadoPorc) || '',
        (sol.documentoOriginal && sol.documentoOriginal.urlData) || '',
        timestamp
      ]);
    });
  });

  // Limpiar datos anteriores (excepto encabezado) e insertar filas actualizadas
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  return createJsonResponse({
    success: true,
    message: "Sincronización de solicitudes de telas completada exitosamente.",
    telasProcesadas: rows.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * Sincroniza Solicitudes de Accesorios / Insumos
 */
function handleSyncAccesorios(data) {
  if (!data || !Array.isArray(data)) {
    return createJsonResponse({ success: false, error: "Datos de accesorios inválidos o vacíos" });
  }

  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_ACCESORIOS);
  if (!sheet) {
    handleInitStructure();
    sheet = ss.getSheetByName(HOJA_ACCESORIOS);
  }

  var rows = [];
  var timestamp = new Date().toLocaleString("es-CO");

  data.forEach(function(sol) {
    var muestras = (sol.muestras && sol.muestras.length > 0) ? sol.muestras : [{}];
    muestras.forEach(function(m) {
      var calif = (m.reporteEvaluacion && m.reporteEvaluacion.calificacion) || '';
      rows.push([
        sol.id || '',
        sol.numeroSolicitud || '',
        sol.fechaSolicitud || '',
        sol.solicitante || '',
        sol.proveedor || '',
        sol.prioridad || 'Normal',
        sol.estadoFlujo || '',
        m.id || '',
        m.referencia || '',
        m.color || '',
        m.talla || '',
        m.qty || '',
        m.descripcionInsumo || '',
        m.dictamen || 'PENDIENTE',
        m.resultado || '',
        m.observacion || '',
        m.responsableLab || '',
        m.fechaRespuestaACompras || m.fechaEntrega || '',
        calif,
        (sol.documentoOriginal && sol.documentoOriginal.urlData) || '',
        timestamp
      ]);
    });
  });

  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  return createJsonResponse({
    success: true,
    message: "Sincronización de solicitudes de accesorios completada.",
    accesoriosProcesados: rows.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * Sincroniza tanto Telas como Accesorios en una sola operación
 */
function handleSyncAll(data) {
  if (!data) return createJsonResponse({ success: false, error: "Sin datos para sincronizar" });

  var respTelas = data.telas ? handleSyncTelas(data.telas) : null;
  var respAcc = data.accesorios ? handleSyncAccesorios(data.accesorios) : null;

  return createJsonResponse({
    success: true,
    message: "Sincronización total con Google Sheets ejecutada exitosamente.",
    telas: respTelas ? JSON.parse(respTelas.getContent()) : null,
    accesorios: respAcc ? JSON.parse(respAcc.getContent()) : null,
    timestamp: new Date().toISOString()
  });
}

/**
 * Almacena archivos adjuntos (PDFs, fotos, documentos) en carpetas de Google Drive
 */
function handleUploadFile(payload) {
  var fileName = payload.fileName || ("STFLab_Archivo_" + new Date().getTime());
  var mimeType = payload.mimeType || "application/octet-stream";
  var base64Data = payload.base64Data || "";
  var folderCategory = payload.folderCategory || "general"; // 'fichas' | 'ensayos' | 'solicitudes'
  var targetFolderId = payload.targetFolderId || CARPETA_BIBLIOTECA_DEFAULT_ID;

  if (!base64Data) {
    return createJsonResponse({ success: false, error: "No se proporcionó el contenido base64 del archivo" });
  }

  var targetFolder = null;
  // 1. Si se especificó un ID de carpeta puntual (como la carpeta vinculada de Biblioteca Técnica)
  if (targetFolderId) {
    try {
      targetFolder = DriveApp.getFolderById(targetFolderId);
    } catch (fErr) {
      targetFolder = null;
    }
  }

  // 2. Si no se encontró por ID, resolver según categoría en la carpeta raíz
  if (!targetFolder) {
    var rootFolder = getOrCreateRootFolder();
    targetFolder = rootFolder;
    if (folderCategory === 'fichas') {
      targetFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_FICHAS);
    } else if (folderCategory === 'ensayos') {
      targetFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_ENSAYOS);
    } else if (folderCategory === 'solicitudes') {
      targetFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_SOLICITUDES);
    }
  }

  // Decodificar Base64 y crear archivo en Google Drive
  var decodedBytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
  var file = targetFolder.createFile(blob);

  // Hacer el archivo visible mediante enlace
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (shareErr) {
    try {
      file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e2) {}
  }

  var fileId = file.getId();
  var fileUrl = file.getUrl();
  var downloadUrl = "https://drive.google.com/uc?export=download&id=" + fileId;
  var previewUrl = "https://drive.google.com/file/d/" + fileId + "/preview";

  return createJsonResponse({
    success: true,
    message: "Archivo subido exitosamente a Google Drive.",
    fileId: fileId,
    fileName: fileName,
    fileUrl: fileUrl,
    downloadUrl: downloadUrl,
    previewUrl: previewUrl,
    folderId: targetFolder.getId(),
    folderName: targetFolder.getName(),
    folderCategory: folderCategory
  });
}

/**
 * Lista todos los archivos de una carpeta de Google Drive (por defecto la de Biblioteca Técnica)
 */
function handleListDriveFolder(payload) {
  var folderId = (payload && payload.folderId) || CARPETA_BIBLIOTECA_DEFAULT_ID;
  try {
    var rootFolder = DriveApp.getFolderById(folderId);
    var filesList = [];
    var subfoldersList = [];

    // 1. Archivos en la carpeta actual
    var filesIter = rootFolder.getFiles();
    while (filesIter.hasNext()) {
      var f = filesIter.next();
      filesList.push({
        id: f.getId(),
        name: f.getName(),
        mimeType: f.getMimeType(),
        size: f.getSize(),
        url: f.getUrl(),
        downloadUrl: "https://drive.google.com/uc?export=download&id=" + f.getId(),
        updated: f.getLastUpdated().toISOString(),
        folderId: rootFolder.getId(),
        folderName: rootFolder.getName(),
        year: extractYearFromText(f.getName()) || extractYearFromText(rootFolder.getName()) || 'Raíz'
      });
    }

    // 2. Subcarpetas (Años, Fichas Técnicas Base, etc.)
    var foldersIter = rootFolder.getFolders();
    while (foldersIter.hasNext()) {
      var sub = foldersIter.next();
      var yearMatch = extractYearFromText(sub.getName());
      
      // Contar archivos de la subcarpeta
      var subFiles = sub.getFiles();
      var count = 0;
      while (subFiles.hasNext()) {
        var subF = subFiles.next();
        count++;
        // Incluir también los archivos de la subcarpeta en la lista global
        filesList.push({
          id: subF.getId(),
          name: subF.getName(),
          mimeType: subF.getMimeType(),
          size: subF.getSize(),
          url: subF.getUrl(),
          downloadUrl: "https://drive.google.com/uc?export=download&id=" + subF.getId(),
          updated: subF.getLastUpdated().toISOString(),
          folderId: sub.getId(),
          folderName: sub.getName(),
          year: yearMatch || extractYearFromText(subF.getName()) || 'General'
        });
      }

      subfoldersList.push({
        id: sub.getId(),
        name: sub.getName(),
        url: sub.getUrl(),
        year: yearMatch,
        fileCount: count
      });
    }

    return createJsonResponse({
      success: true,
      folderId: folderId,
      folderName: rootFolder.getName(),
      folderUrl: rootFolder.getUrl(),
      folders: subfoldersList,
      files: filesList,
      totalFiles: filesList.length,
      totalFolders: subfoldersList.length
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "Error accediendo a la carpeta de Google Drive (" + folderId + "): " + err.toString()
    });
  }
}

/**
 * Función auxiliar para detectar años en nombres de carpetas o archivos (ej. 2022, 2023, 2024, 2025, 2026)
 */
function extractYearFromText(text) {
  if (!text) return null;
  var match = text.match(/(202[0-9])/);
  return match ? match[1] : null;
}

/**
 * Lee el contenido codificado en Base64 de un archivo en Google Drive para procesarlo con Lectura Inteligente
 */
function handleReadDriveFile(payload) {
  var fileId = payload && payload.fileId;
  if (!fileId) {
    return createJsonResponse({ success: false, error: "ID de archivo no especificado" });
  }

  try {
    var file = DriveApp.getFileById(fileId);
    var blob = file.getBlob();
    var bytes = blob.getBytes();
    var base64Data = Utilities.base64Encode(bytes);

    return createJsonResponse({
      success: true,
      fileId: fileId,
      fileName: file.getName(),
      mimeType: file.getMimeType(),
      size: file.getSize(),
      url: file.getUrl(),
      base64Data: base64Data
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "Error leyendo archivo de Google Drive: " + err.toString()
    });
  }
}


/**
 * Recupera todas las filas de Google Sheets para consulta
 */
function handleGetAllData() {
  var ss = getOrCreateSpreadsheet();
  var sheetTelas = ss.getSheetByName(HOJA_TELAS);
  var sheetAcc = ss.getSheetByName(HOJA_ACCESORIOS);

  var telas = [];
  if (sheetTelas && sheetTelas.getLastRow() > 1) {
    var valsT = sheetTelas.getRange(2, 1, sheetTelas.getLastRow() - 1, sheetTelas.getLastColumn()).getValues();
    telas = valsT;
  }

  var accesorios = [];
  if (sheetAcc && sheetAcc.getLastRow() > 1) {
    var valsA = sheetAcc.getRange(2, 1, sheetAcc.getLastRow() - 1, sheetAcc.getLastColumn()).getValues();
    accesorios = valsA;
  }

  return createJsonResponse({
    success: true,
    telas: telas,
    accesorios: accesorios,
    timestamp: new Date().toISOString()
  });
}

// =========================================================================================
// UTILIDADES Y AYUDAS
// =========================================================================================

function getOrCreateSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}

  var files = DriveApp.getFilesByName(NOMBRE_HOJA_CALCULO);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  var ss = SpreadsheetApp.create(NOMBRE_HOJA_CALCULO);
  var rootFolder = getOrCreateRootFolder();
  var file = DriveApp.getFileById(ss.getId());
  rootFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);
  return ss;
}

function getOrCreateRootFolder() {
  var folders = DriveApp.getFoldersByName(NOMBRE_CARPETA_RAIZ);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(NOMBRE_CARPETA_RAIZ);
}

function getOrCreateSubFolder(parentFolder, subFolderName) {
  var subs = parentFolder.getFoldersByName(subFolderName);
  if (subs.hasNext()) {
    return subs.next();
  }
  return parentFolder.createFolder(subFolderName);
}

function setupSheetHeaders(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Establecer encabezados
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Estilo visual corporativo (Fondo grafito oscuro, texto dorado/blanco, negrita)
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#111827");
  headerRange.setFontColor("#FBBF24");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const GoogleIntegrationPanel: React.FC = () => {
  const {
    googleConfig,
    actualizarGoogleConfig,
    probarConexionGoogleActiva,
    inicializarEstructuraGoogleActiva,
    sincronizarConGoogleManual,
    sincronizandoGoogle,
    solicitudesTelas,
    solicitudesAccesorios
  } = useQuality();

  const [inputUrl, setInputUrl] = useState(googleConfig.webAppUrl || '');
  const [probando, setProbando] = useState(false);
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [mostrarGuia, setMostrarGuia] = useState(true);
  const [mostrarCodigo, setMostrarCodigo] = useState(false);

  // Estados para prueba de subida a Drive
  const [archivoPrueba, setArchivoPrueba] = useState<File | null>(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [resultadoSubida, setResultadoSubida] = useState<{ url: string; nombre: string } | null>(null);
  const [categoriaSubida, setCategoriaSubida] = useState<'fichas' | 'ensayos' | 'solicitudes'>('fichas');

  const estaConectado = Boolean(googleConfig.webAppUrl && googleConfig.lastSyncStatus === 'success');

  const handleGuardarYProbar = async () => {
    if (!inputUrl.trim()) {
      setMensajeEstado({ tipo: 'error', texto: 'Por favor ingresa la URL de la aplicación web de Google Apps Script.' });
      return;
    }

    if (!inputUrl.startsWith('https://script.google.com/macros/s/')) {
      setMensajeEstado({
        tipo: 'error',
        texto: 'La URL debe ser de un despliegue de Apps Script: https://script.google.com/macros/s/.../exec'
      });
      return;
    }

    setProbando(true);
    setMensajeEstado({ tipo: 'info', texto: 'Conectando con Google Workspace...' });

    actualizarGoogleConfig({ webAppUrl: inputUrl.trim() });
    const res = await probarConexionGoogleActiva(inputUrl.trim());

    setProbando(false);
    if (res.success) {
      setMensajeEstado({ tipo: 'exito', texto: res.message });
    } else {
      setMensajeEstado({ tipo: 'error', texto: res.message });
    }
  };

  const handleInicializarEstructura = async () => {
    if (!googleConfig.webAppUrl) {
      setMensajeEstado({ tipo: 'error', texto: 'Primero debes guardar y verificar la URL del Apps Script.' });
      return;
    }

    setMensajeEstado({ tipo: 'info', texto: 'Creando carpetas en Google Drive y hojas de cálculo...' });
    const res = await inicializarEstructuraGoogleActiva();

    if (res.success) {
      setMensajeEstado({ tipo: 'exito', texto: res.message || 'Estructura en Sheets y Drive configurada con éxito.' });
    } else {
      setMensajeEstado({ tipo: 'error', texto: res.error || 'Error al inicializar estructura.' });
    }
  };

  const handleSincronizarAhora = async () => {
    if (!googleConfig.webAppUrl) {
      setMensajeEstado({ tipo: 'error', texto: 'Google Workspace no está configurado aún.' });
      return;
    }

    setMensajeEstado({ tipo: 'info', texto: 'Sincronizando todas las solicitudes con Google Sheets...' });
    const res = await sincronizarConGoogleManual();

    if (res.success) {
      setMensajeEstado({
        tipo: 'exito',
        texto: `✓ Sincronización exitosa: ${solicitudesTelas.length} telas y ${solicitudesAccesorios.length} insumos respaldados.`
      });
    } else {
      setMensajeEstado({ tipo: 'error', texto: res.error || 'Fallo en la sincronización.' });
    }
  };

  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE_CODE);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleSubirArchivoPrueba = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!googleConfig.webAppUrl) {
      setMensajeEstado({ tipo: 'error', texto: 'Configura la URL de Google Apps Script antes de subir archivos.' });
      return;
    }

    setArchivoPrueba(file);
    setSubiendoArchivo(true);
    setResultadoSubida(null);

    const res = await subirArchivoAGoogleDrive(file, file.name, categoriaSubida);
    setSubiendoArchivo(false);

    if (res.success && res.fileUrl) {
      setResultadoSubida({ url: res.fileUrl, nombre: file.name });
      setMensajeEstado({ tipo: 'exito', texto: `✓ Archivo "${file.name}" subido a Google Drive exitosamente.` });
    } else {
      setMensajeEstado({ tipo: 'error', texto: res.error || 'Error al subir archivo a Google Drive.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#2D2D30] border border-[#424246] p-6 rounded-3xl shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
            <HardDrive className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-[#FBF8F2] tracking-tight">
                Base de Datos en Google Workspace
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1.5 ${
                estaConectado 
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' 
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
              }`}>
                {estaConectado ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    <span>Conectado</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-amber-400" />
                    <span>Requiere Conexión</span>
                  </>
                )}
              </span>
            </div>
            <p className="text-xs text-[#AA9E80] mt-1 max-w-2xl">
              Almacena en tiempo real todas las solicitudes y ensayos en <strong className="text-emerald-300">Google Sheets</strong>, 
              y guarda fotos de ensayos, PDFs de fichas técnicas y documentos en carpetas organizadas de <strong className="text-blue-300">Google Drive</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleSincronizarAhora}
            disabled={!googleConfig.webAppUrl || sincronizandoGoogle}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${sincronizandoGoogle ? 'animate-spin' : ''}`} />
            <span>{sincronizandoGoogle ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
          </button>
        </div>
      </div>

      {/* Notificación de Estado */}
      {mensajeEstado && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all ${
          mensajeEstado.tipo === 'exito'
            ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
            : mensajeEstado.tipo === 'error'
            ? 'bg-red-950/50 border-red-500/40 text-red-300'
            : 'bg-blue-950/50 border-blue-500/40 text-blue-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {mensajeEstado.tipo === 'exito' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />}
            {mensajeEstado.tipo === 'error' && <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />}
            {mensajeEstado.tipo === 'info' && <RefreshCw className="h-4 w-4 shrink-0 text-blue-400 animate-spin" />}
            <span>{mensajeEstado.texto}</span>
          </div>
          <button 
            onClick={() => setMensajeEstado(null)} 
            className="text-[10px] opacity-70 hover:opacity-100 cursor-pointer ml-3 font-mono"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Tarjetas de Acceso Directo a Google Sheets & Drive */}
      {googleConfig.spreadsheetUrl && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Google Sheets */}
          <div className="bg-[#2D2D30] border border-emerald-500/30 p-5 rounded-3xl relative overflow-hidden group hover:border-emerald-500/60 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FBF8F2]">Google Sheets (Base de Datos)</h3>
                  <p className="text-[11px] text-[#AA9E80]">STFLAB - Base de Datos Calidad Textil</p>
                </div>
              </div>
              <a
                href={googleConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-[11px] rounded-xl transition-all shadow-sm"
              >
                <span>Abrir Hoja</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="mt-4 pt-3 border-t border-[#424246] flex items-center justify-between text-[11px]">
              <span className="text-[#AA9E80]">Pestañas sincronizadas:</span>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#1F1F22] text-emerald-300 font-mono text-[10px]">Telas ({solicitudesTelas.length})</span>
                <span className="px-2 py-0.5 rounded-md bg-[#1F1F22] text-emerald-300 font-mono text-[10px]">Insumos ({solicitudesAccesorios.length})</span>
              </div>
            </div>
          </div>

          {/* Card Google Drive */}
          <div className="bg-[#2D2D30] border border-blue-500/30 p-5 rounded-3xl relative overflow-hidden group hover:border-blue-500/60 transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-blue-400">
                  <Folder className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#FBF8F2]">Google Drive (Almacenamiento)</h3>
                  <p className="text-[11px] text-[#AA9E80]">Carpeta: STFLAB_Calidad_Textil</p>
                </div>
              </div>
              {googleConfig.rootFolderUrl && (
                <a
                  href={googleConfig.rootFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] rounded-xl transition-all shadow-sm"
                >
                  <span>Abrir Carpeta</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#424246] flex items-center gap-2 overflow-x-auto text-[10px]">
              {googleConfig.fichasFolderUrl && (
                <a
                  href={googleConfig.fichasFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#1F1F22] hover:bg-[#38383C] text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <FileText className="h-3 w-3" /> Fichas Técnicas
                </a>
              )}
              {googleConfig.ensayosFolderUrl && (
                <a
                  href={googleConfig.ensayosFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#1F1F22] hover:bg-[#38383C] text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Folder className="h-3 w-3" /> Ensayos y Fotos
                </a>
              )}
              {googleConfig.solicitudesFolderUrl && (
                <a
                  href={googleConfig.solicitudesFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-[#1F1F22] hover:bg-[#38383C] text-purple-300 flex items-center gap-1 transition-colors"
                >
                  <Folder className="h-3 w-3" /> Solicitudes Compras
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Panel de Configuración de la Conexión */}
      <div className="bg-[#2D2D30] border border-[#424246] p-6 rounded-3xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#424246] pb-4">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-amber-400" />
            <h3 className="text-sm font-bold text-[#FBF8F2]">Configuración del Endpoint de Google Apps Script</h3>
          </div>
          {googleConfig.userAccountEmail && (
            <span className="text-[11px] text-[#AA9E80] flex items-center gap-1.5 font-mono">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              {googleConfig.userAccountEmail}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#AA9E80] uppercase tracking-wider mb-2">
              URL de la Aplicación Web (Google Apps Script Web App)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 bg-[#1F1F22] border border-[#424246] focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs text-[#FBF8F2] font-mono outline-none transition-colors"
              />
              <button
                type="button"
                onClick={handleGuardarYProbar}
                disabled={probando}
                className="px-5 py-2.5 bg-[#C6A466] hover:bg-[#B39355] text-black font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${probando ? 'animate-spin' : ''}`} />
                <span>{probando ? 'Verificando...' : 'Guardar y Probar'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#AA9E80] mt-1.5">
              Esta URL se obtiene al hacer clic en <em>Implementar &gt; Nueva implementación &gt; Aplicación web</em> dentro del editor de Apps Script.
            </p>
          </div>

          {/* Opciones y Acciones adicionales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-[#1F1F22] border border-[#424246] rounded-2xl">
              <div>
                <p className="text-xs font-bold text-[#FBF8F2]">Sincronización Automática</p>
                <p className="text-[10px] text-[#AA9E80]">Actualiza Google Sheets en segundo plano al modificar solicitudes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleConfig.autoSyncEnabled}
                  onChange={(e) => actualizarGoogleConfig({ autoSyncEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <button
              type="button"
              onClick={handleInicializarEstructura}
              disabled={!googleConfig.webAppUrl || sincronizandoGoogle}
              className="p-3.5 bg-[#1F1F22] hover:bg-[#38383C] border border-[#424246] hover:border-amber-400/50 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer disabled:opacity-50"
            >
              <div>
                <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <FolderPlus className="h-4 w-4" />
                  <span>Inicializar Estructura</span>
                </p>
                <p className="text-[10px] text-[#AA9E80]">Crea encabezados, formato y carpetas en Drive si faltan</p>
              </div>
              <ChevronDown className="h-4 w-4 text-[#AA9E80] -rotate-90" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Probador de Subida de Archivos a Google Drive */}
      <div className="bg-[#2D2D30] border border-[#424246] p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#424246] pb-3">
          <div className="flex items-center gap-2.5">
            <Upload className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-bold text-[#FBF8F2]">Prueba de Almacenamiento en Google Drive</h3>
          </div>
          <span className="text-[11px] text-[#AA9E80]">Sube cualquier PDF, foto o Excel directamente a Drive</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-[11px] font-bold text-[#AA9E80] uppercase tracking-wider mb-1.5">
              Subcarpeta Destino
            </label>
            <select
              value={categoriaSubida}
              onChange={(e) => setCategoriaSubida(e.target.value as any)}
              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-2 text-xs text-[#FBF8F2] outline-none"
            >
              <option value="fichas">01_Fichas_Tecnicas</option>
              <option value="ensayos">02_Ensayos_Fotos</option>
              <option value="solicitudes">03_Solicitudes_Adjuntos</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end">
            <label className="w-full flex items-center justify-center gap-2.5 px-4 py-2 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md border border-blue-400/30 transition-all cursor-pointer">
              <Upload className={`h-4 w-4 ${subiendoArchivo ? 'animate-bounce' : ''}`} />
              <span>{subiendoArchivo ? 'Subiendo a Google Drive...' : 'Seleccionar Archivo y Subir a Drive'}</span>
              <input
                type="file"
                onChange={handleSubirArchivoPrueba}
                disabled={subiendoArchivo || !googleConfig.webAppUrl}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {resultadoSubida && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300">
              <FileCheck className="h-4 w-4" />
              <span>Archivo guardado en Drive: <strong>{resultadoSubida.nombre}</strong></span>
            </div>
            <a
              href={resultadoSubida.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-black font-extrabold text-[11px] rounded-lg transition-colors flex items-center gap-1"
            >
              <Eye className="h-3 w-3" /> Ver en Drive
            </a>
          </div>
        )}
      </div>

      {/* 5. Guía Paso a Paso para Despliegue en Google Apps Script */}
      <div className="bg-[#2D2D30] border border-[#424246] rounded-3xl overflow-hidden shadow-lg">
        <button
          type="button"
          onClick={() => setMostrarGuia(!mostrarGuia)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-[#38383C] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#FBF8F2]">Guía Rápida de Despliegue en Google (3 Minutos)</h3>
              <p className="text-xs text-[#AA9E80]">Instrucciones paso a paso para crear el script sin costo de servidor</p>
            </div>
          </div>
          {mostrarGuia ? <ChevronUp className="h-5 w-5 text-[#AA9E80]" /> : <ChevronDown className="h-5 w-5 text-[#AA9E80]" />}
        </button>

        {mostrarGuia && (
          <div className="p-6 pt-2 border-t border-[#424246] space-y-4 text-xs text-[#FBF8F2]">
            <ol className="space-y-3 list-decimal list-inside text-[#AA9E80] leading-relaxed">
              <li className="pl-1">
                <strong className="text-[#FBF8F2]">Crear la Hoja de Google:</strong> Abre{' '}
                <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">
                  Google Drive
                </a>{' '}
                y crea una Hoja de Cálculo llamada <span className="text-emerald-300 font-mono">"STFLAB - Base de Datos Calidad Textil"</span>.
              </li>
              <li className="pl-1">
                <strong className="text-[#FBF8F2]">Abrir Apps Script:</strong> En el menú superior de esa hoja, ve a{' '}
                <span className="text-amber-300">Extensiones &gt; Apps Script</span>.
              </li>
              <li className="pl-1">
                <strong className="text-[#FBF8F2]">Pegar el Código:</strong> Borra todo el código que aparezca por defecto y pega el código de STFLab.
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleCopiarCodigo}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer active:scale-95"
                  >
                    {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiado ? '¡Código Copiado al Portapapeles!' : 'Copiar Código de Apps Script'}</span>
                  </button>
                </div>
              </li>
              <li className="pl-1">
                <strong className="text-[#FBF8F2]">Implementar como Web App:</strong>
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-[#AA9E80]">
                  <li>Haz clic en el botón azul <strong className="text-white">Implementar &gt; Nueva implementación</strong>.</li>
                  <li>Selecciona el engranaje ⚙️ y elige <strong className="text-white">Aplicación web</strong>.</li>
                  <li>En <em>Ejecutar como</em>: Selecciona <strong className="text-white">Yo (tu correo)</strong>.</li>
                  <li>En <em>Quién tiene acceso</em>: Selecciona <strong className="text-amber-400 font-bold">Cualquier usuario</strong> (necesario para recibir peticiones de la app).</li>
                  <li>Haz clic en <strong className="text-white">Implementar</strong> y autoriza los permisos de Google.</li>
                </ul>
              </li>
              <li className="pl-1">
                <strong className="text-[#FBF8F2]">Vincular a STFLab:</strong> Copia la <em>URL de la aplicación web</em> generada (termina en <span className="font-mono text-amber-300">/exec</span>) y pégala en el campo de arriba.
              </li>
            </ol>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setMostrarCodigo(!mostrarCodigo)}
                className="text-xs text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <Code2 className="h-4 w-4" />
                <span>{mostrarCodigo ? 'Ocultar código fuente del script' : 'Ver código fuente del script'}</span>
              </button>

              {mostrarCodigo && (
                <div className="mt-3 relative">
                  <pre className="bg-[#1F1F22] border border-[#424246] rounded-2xl p-4 font-mono text-[10px] text-[#AA9E80] overflow-x-auto max-h-80 leading-relaxed">
                    {APPS_SCRIPT_SOURCE_CODE}
                  </pre>
                  <button
                    onClick={handleCopiarCodigo}
                    className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500 text-black font-bold text-[10px] rounded-lg shadow"
                  >
                    {copiado ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
