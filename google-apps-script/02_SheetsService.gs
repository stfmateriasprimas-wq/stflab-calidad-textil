/**
 * =========================================================================================
 * STFLAB - MÓDULO 02: SERVICIO DE GOOGLE SHEETS
 * STF GROUP S.A.
 * =========================================================================================
 */

/**
 * Inicializa la estructura de pestañas y encabezados con formato oficial
 */
function handleInitStructure() {
  var ss = getOrCreateSpreadsheet();
  var rootFolder = getOrCreateRootFolder();
  var fichasFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_FICHAS);
  var ensayosFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_ENSAYOS);
  var solFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_SOLICITUDES);

  // 1. SOLICITUDES_TELAS
  setupSheetHeaders(ss, HOJA_TELAS, [
    "ID_SOLICITUD", "NUMERO_SOLICITUD", "FECHA_SOLICITUD", "SOLICITANTE", "PROVEEDOR",
    "ORDEN_COMPRA", "ESTADO_FLUJO", "ID_TELA", "SOLICITUD_COMPRA", "REFERENCIA",
    "COLOR", "OC_COL", "OBSERVACION", "DICTAMEN_LAB", "RESULTADO_LAB",
    "RESPONSABLE_LAB", "FECHA_RESPUESTA_LAB", "DECISION_COMPRA", "FECHA_DECISION_COMPRA",
    "RESPONSABLE_COMPRA", "DESCUENTO_NEGOCIADO", "ARCHIVO_ADJUNTO_URL", "FECHA_SINCRONIZACION"
  ]);

  // 2. SOLICITUDES_ACCESORIOS
  setupSheetHeaders(ss, HOJA_ACCESORIOS, [
    "ID_SOLICITUD", "NUMERO_SOLICITUD", "FECHA_SOLICITUD", "SOLICITANTE", "PROVEEDOR",
    "PRIORIDAD", "ESTADO_FLUJO", "ID_MUESTRA", "REFERENCIA", "COLOR",
    "TALLA", "CANTIDAD_QTY", "DESCRIPCION_INSUMO", "DICTAMEN_LAB", "RESULTADO_LAB",
    "OBSERVACION_LAB", "RESPONSABLE_LAB", "FECHA_RESPUESTA", "CALIFICACION",
    "ARCHIVO_ADJUNTO_URL", "FECHA_SINCRONIZACION"
  ]);

  // 3. FICHAS_TECNICAS
  setupSheetHeaders(ss, HOJA_FICHAS, [
    "ID_FICHA", "CODIGO_FT", "REFERENCIA", "PROVEEDOR", "REF_PROVEEDOR",
    "COMPOSICION", "PESO_G_M2", "ANCHO_UTIL_CM", "TIPO_TEJIDO", "VERSION_ACTUAL",
    "FECHA_VERSION", "USUARIO_CREADOR", "URL_DRIVE_ARCHIVO", "FECHA_SINCRONIZACION"
  ]);

  // 4. AUDITORIA_LOGS
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
 * Sincroniza Solicitudes de Telas en Google Sheets
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
 * Sincroniza Solicitudes de Accesorios / Insumos en Google Sheets
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
 * Sincroniza tanto Telas como Accesorios
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
 * Recupera todas las filas de Google Sheets para consulta en tiempo real
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
