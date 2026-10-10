/**
 * =========================================================================================
 * STFLAB - MÓDULO 02: SERVICIO DE GOOGLE SHEETS (ARQUITECTURA DE 7 PESTAÑAS MAESTRAS)
 * STF GROUP S.A. (Studio F, ELA, STF MAN)
 * =========================================================================================
 */

/**
 * 1. Inicializa la estructura completa de las 7 pestañas maestras con formato corporativo,
 * fórmulas de Dashboard y reglas de formato condicional.
 */
function handleInitStructure() {
  var ss = getOrCreateSpreadsheet();
  var rootFolder = getOrCreateRootFolder();
  var fichasFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_FICHAS);
  var ensayosFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_ENSAYOS);
  var solFolder = getOrCreateSubFolder(rootFolder, SUB_CARPETA_SOLICITUDES);

  // 1. DASHBOARD_RESUMEN (Panel Ejecutivo con KPIs en vivo)
  setupDashboardSheet(ss);

  // 2. SOLICITUDES_TELAS (Compras <-> Laboratorio)
  setupSheetHeaders(ss, HOJA_TELAS, [
    "ID_SOLICITUD", "NUMERO_SOLICITUD", "FECHA_SOLICITUD", "SOLICITANTE", "PROVEEDOR",
    "ORDEN_COMPRA", "ESTADO_FLUJO", "ID_TELA", "SOLICITUD_COMPRA", "REFERENCIA",
    "COLOR", "OC_COL", "OBSERVACION", "DICTAMEN_LAB", "RESULTADO_LAB",
    "RESPONSABLE_LAB", "FECHA_RESPUESTA_LAB", "DECISION_COMPRA", "FECHA_DECISION_COMPRA",
    "RESPONSABLE_COMPRA", "DESCUENTO_NEGOCIADO", "ARCHIVO_ADJUNTO_URL", "FECHA_SINCRONIZACION"
  ]);
  applyConditionalFormatting(ss, HOJA_TELAS, 14); // Columna 14: DICTAMEN_LAB
  applyConditionalFormatting(ss, HOJA_TELAS, 18); // Columna 18: DECISION_COMPRA

  // 3. SOLICITUDES_ACCESORIOS (Insumos de Confección)
  setupSheetHeaders(ss, HOJA_ACCESORIOS, [
    "ID_SOLICITUD", "NUMERO_SOLICITUD", "FECHA_SOLICITUD", "SOLICITANTE", "PROVEEDOR",
    "PRIORIDAD", "ESTADO_FLUJO", "ID_MUESTRA", "REFERENCIA", "COLOR",
    "TALLA", "CANTIDAD_QTY", "DESCRIPCION_INSUMO", "DICTAMEN_LAB", "RESULTADO_LAB",
    "OBSERVACION_LAB", "RESPONSABLE_LAB", "FECHA_RESPUESTA", "CALIFICACION",
    "ARCHIVO_ADJUNTO_URL", "FECHA_SINCRONIZACION"
  ]);
  applyConditionalFormatting(ss, HOJA_ACCESORIOS, 14); // Columna 14: DICTAMEN_LAB

  // 4. FORROS_Y_COSTURAS (Pipin vs Shipping)
  setupSheetHeaders(ss, HOJA_FORROS_COSTURAS, [
    "ID_REPORTE", "CODIGO_REPORTE", "FECHA_EVALUACION", "REFERENCIA", "PROVEEDOR",
    "TIPO_PRENDA", "COLOR", "RESULTADO_GLOBAL", "DICTAMEN", "DESLIZAMIENTO_COSTURAS",
    "ROTURA_TELA", "ELONGACION", "OBSERVACION_TECNICA", "RESPONSABLE_LAB",
    "CORREOS_NOTIFICADOS", "FECHA_SINCRONIZACION"
  ]);
  applyConditionalFormatting(ss, HOJA_FORROS_COSTURAS, 9); // Columna 9: DICTAMEN

  // 5. FICHAS_TECNICAS (Biblioteca Maestra de Especificaciones)
  setupSheetHeaders(ss, HOJA_FICHAS, [
    "ID_FICHA", "CODIGO_FT", "REFERENCIA", "PROVEEDOR", "REF_PROVEEDOR",
    "COMPOSICION", "PESO_G_M2", "ANCHO_UTIL_CM", "TIPO_TEJIDO", "VERSION_ACTUAL",
    "FECHA_VERSION", "USUARIO_CREADOR", "URL_DRIVE_ARCHIVO", "FECHA_SINCRONIZACION"
  ]);

  // 6. DIRECTORIO_PROVEEDORES (Catálogo y Evaluación de Desempeño)
  setupSheetHeaders(ss, HOJA_PROVEEDORES, [
    "ID_PROVEEDOR", "CODIGO_PROVEEDOR", "RAZON_SOCIAL", "TIPO_PROVEEDOR", "CONTACTO",
    "CORREO", "TELEFONO", "PAIS_CIUDAD", "CALIFICACION_PROMEDIO", "ACTIVO", "FECHA_SINCRONIZACION"
  ]);

  // 7. AUDITORIA_LOGS (Trazabilidad y Seguridad Inmutable)
  setupSheetHeaders(ss, HOJA_AUDITORIA, [
    "ID_LOG", "FECHA", "HORA", "COLECCION", "DOCUMENTO_ID",
    "ACCION", "USUARIO", "ROL", "AREA", "DETALLES", "CAMPO_AFECTADO"
  ]);

  return createJsonResponse({
    success: true,
    message: "Base de datos en Google Sheets organizada exitosamente con las 7 pestañas maestras.",
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    rootFolderId: rootFolder.getId(),
    rootFolderUrl: rootFolder.getUrl(),
    fichasFolderUrl: fichasFolder.getUrl(),
    ensayosFolderUrl: ensayosFolder.getUrl(),
    solicitudesFolderUrl: solFolder.getUrl(),
    pestañas: [
      HOJA_DASHBOARD,
      HOJA_TELAS,
      HOJA_ACCESORIOS,
      HOJA_FORROS_COSTURAS,
      HOJA_FICHAS,
      HOJA_PROVEEDORES,
      HOJA_AUDITORIA
    ]
  });
}

/**
 * 2. Configura la pestaña DASHBOARD_RESUMEN con diseño visual y fórmulas automáticas
 */
function setupDashboardSheet(ss) {
  var sheet = ss.getSheetByName(HOJA_DASHBOARD);
  if (!sheet) {
    sheet = ss.insertSheet(HOJA_DASHBOARD, 0);
  }

  // Título del Dashboard
  sheet.getRange("A1:E1").merge();
  sheet.getRange("A1").setValue("STFLAB 2.0 - TABLERO DE CONTROL EJECUTIVO Y CALIDAD TEXTIL");
  sheet.getRange("A1").setBackground("#0F172A").setFontColor("#FBBF24").setFontWeight("bold").setFontSize(14).setHorizontalAlignment("center");

  sheet.getRange("A2:E2").merge();
  sheet.getRange("A2").setValue("STF GROUP S.A. | Indicadores en vivo conectados a las bases de datos maestras de Telas, Insumos y Laboratorio");
  sheet.getRange("A2").setBackground("#1E293B").setFontColor("#94A3B8").setFontSize(10).setHorizontalAlignment("center");

  // Encabezados de métricas
  sheet.getRange("A4:B4").setValues([["INDICADOR CLAVE (KPI)", "VALOR EN TIEMPO REAL"]]);
  sheet.getRange("A4:B4").setBackground("#334155").setFontColor("#FFFFFF").setFontWeight("bold");

  var metricas = [
    ["🧵 Total Solicitudes de Telas Registradas", '=IFERROR(COUNTA(SOLICITUDES_TELAS!B2:B), 0)'],
    ["✅ Telas Aprobadas por Laboratorio", '=COUNTIF(SOLICITUDES_TELAS!N2:N, "APROBADO")'],
    ["❌ Telas Rechazadas por Laboratorio", '=COUNTIF(SOLICITUDES_TELAS!N2:N, "RECHAZADO")'],
    ["⚠️ Telas con Hallazgos Técnicos", '=COUNTIF(SOLICITUDES_TELAS!N2:N, "HALLAZGO")'],
    ["⏳ Telas Pendientes / En Proceso", '=COUNTIF(SOLICITUDES_TELAS!N2:N, "PENDIENTE") + COUNTIF(SOLICITUDES_TELAS!N2:N, "EN_PROCESO")'],
    ["📈 % Efectividad / Aprobación Telas", '=IFERROR(B6 / (B6 + B7 + B8), 100%)'],
    ["--------------------------------------------", "------------------------"],
    ["🔩 Total Solicitudes de Insumos Registradas", '=IFERROR(COUNTA(SOLICITUDES_ACCESORIOS!B2:B), 0)'],
    ["✅ Insumos Aprobados por Laboratorio", '=COUNTIF(SOLICITUDES_ACCESORIOS!N2:N, "APROBADO")'],
    ["❌ Insumos Rechazados por Laboratorio", '=COUNTIF(SOLICITUDES_ACCESORIOS!N2:N, "RECHAZADO")'],
    ["⏳ Insumos Pendientes de Calificación", '=COUNTIF(SOLICITUDES_ACCESORIOS!N2:N, "PENDIENTE") + COUNTIF(SOLICITUDES_ACCESORIOS!N2:N, "EN_PROCESO")'],
    ["--------------------------------------------", "------------------------"],
    ["🪡 Total Reportes de Forros y Costuras", '=IFERROR(COUNTA(FORROS_Y_COSTURAS!B2:B), 0)'],
    ["📄 Total Fichas Técnicas Activas", '=IFERROR(COUNTA(FICHAS_TECNICAS!B2:B), 0)'],
    ["🏢 Total Proveedores en Directorio", '=IFERROR(COUNTA(DIRECTORIO_PROVEEDORES!B2:B), 0)'],
    ["🕒 Última Sincronización Registrada", '=NOW()']
  ];

  sheet.getRange(5, 1, metricas.length, 2).setValues(metricas);
  sheet.getRange("B5:B20").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("B10").setNumberFormat("0.0%"); // % Aprobación
  sheet.getRange("B20").setNumberFormat("yyyy-mm-dd hh:mm:ss");

  sheet.setColumnWidth(1, 380);
  sheet.setColumnWidth(2, 220);
  sheet.setFrozenRows(4);
}

/**
 * 3. Aplica formato condicional inteligente a una columna de dictámenes
 */
function applyConditionalFormatting(ss, sheetName, colIndex) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var range = sheet.getRange(2, colIndex, 1000, 1);
  var rules = sheet.getConditionalFormatRules();

  // APROBADO -> Verde suave
  var ruleAprobado = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("APROBADO")
    .setBackground("#D1FAE5")
    .setFontColor("#065F46")
    .setRanges([range])
    .build();

  // RECHAZADO -> Rojo suave
  var ruleRechazado = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("RECHAZADO")
    .setBackground("#FEE2E2")
    .setFontColor("#991B1B")
    .setRanges([range])
    .build();

  // HALLAZGO o EN_PROCESO -> Amarillo suave
  var ruleHallazgo = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("HALLAZGO")
    .setBackground("#FEF3C7")
    .setFontColor("#92400E")
    .setRanges([range])
    .build();

  var ruleProceso = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("EN_PROCESO")
    .setBackground("#FEF3C7")
    .setFontColor("#92400E")
    .setRanges([range])
    .build();

  // PENDIENTE -> Gris suave
  var rulePendiente = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo("PENDIENTE")
    .setBackground("#F3F4F6")
    .setFontColor("#4B5563")
    .setRanges([range])
    .build();

  rules.push(ruleAprobado, ruleRechazado, ruleHallazgo, ruleProceso, rulePendiente);
  sheet.setConditionalFormatRules(rules);
}

/**
 * 4. Sincroniza Solicitudes de Telas en Google Sheets
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
      var adjuntoUrl = (sol.documentoOriginal && sol.documentoOriginal.urlData) || '';
      var urlFormula = adjuntoUrl ? '=HYPERLINK("' + adjuntoUrl + '", "Ver en Drive")' : '';

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
        urlFormula || adjuntoUrl,
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
 * 5. Sincroniza Solicitudes de Accesorios / Insumos en Google Sheets
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
      var adjuntoUrl = (sol.documentoOriginal && sol.documentoOriginal.urlData) || '';
      var urlFormula = adjuntoUrl ? '=HYPERLINK("' + adjuntoUrl + '", "Ver en Drive")' : '';

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
        urlFormula || adjuntoUrl,
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
 * 6. Sincroniza Evaluaciones de Forros y Costuras (Pipin vs Shipping)
 */
function handleSyncForrosCosturas(data) {
  if (!data || !Array.isArray(data)) {
    return createJsonResponse({ success: false, error: "Datos de forros y costuras inválidos o vacíos" });
  }

  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_FORROS_COSTURAS);
  if (!sheet) {
    handleInitStructure();
    sheet = ss.getSheetByName(HOJA_FORROS_COSTURAS);
  }

  var rows = [];
  var timestamp = new Date().toLocaleString("es-CO");

  data.forEach(function(item) {
    var correos = (item.correosEnviados || []).map(function(c) { return c.destinatario; }).join(', ');
    rows.push([
      item.id || '',
      item.codigoReporte || '',
      item.createdAt || item.fecha || '',
      item.referencia || '',
      item.proveedor || '',
      item.tipoPrenda || '',
      item.color || '',
      item.resultadoGlobal || item.dictamen || '',
      item.dictamen || 'APROBADO',
      item.deslizamientoCosturas || '',
      item.roturaTela || '',
      item.elongacion || '',
      item.observacionTecnica || item.observaciones || '',
      item.responsableLab || item.enviadoPor || '',
      correos,
      timestamp
    ]);
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
    message: "Sincronización de evaluaciones de forros y costuras completada.",
    forrosProcesados: rows.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * 7. Sincroniza Fichas Técnicas del Fabricante
 */
function handleSyncFichas(data) {
  if (!data || !Array.isArray(data)) {
    return createJsonResponse({ success: false, error: "Datos de fichas técnicas inválidos o vacíos" });
  }

  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_FICHAS);
  if (!sheet) {
    handleInitStructure();
    sheet = ss.getSheetByName(HOJA_FICHAS);
  }

  var rows = [];
  var timestamp = new Date().toLocaleString("es-CO");

  data.forEach(function(f) {
    var driveUrl = f.archivoAdjuntoUrl || f.urlDrive || '';
    var urlFormula = driveUrl ? '=HYPERLINK("' + driveUrl + '", "Ver Ficha en Drive")' : '';

    rows.push([
      f.id || '',
      f.codigoFT || f.referencia || '',
      f.referencia || '',
      f.proveedor || '',
      f.refProveedor || '',
      f.composicion || '',
      (f.especificaciones && f.especificaciones.pesoGM2) || f.pesoGM2 || '',
      (f.especificaciones && f.especificaciones.anchoUtilCm) || f.anchoUtilCm || '',
      (f.especificaciones && f.especificaciones.tipoTejido) || f.tipoTejido || '',
      f.versionActual || 'v1.0',
      f.fechaVersion || f.updatedAt || '',
      f.usuarioCreador || '',
      urlFormula || driveUrl,
      timestamp
    ]);
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
    message: "Sincronización de fichas técnicas completada.",
    fichasProcesadas: rows.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * 8. Sincroniza Directorio Maestro de Proveedores
 */
function handleSyncProveedores(data) {
  if (!data || !Array.isArray(data)) {
    return createJsonResponse({ success: false, error: "Datos de proveedores inválidos" });
  }

  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_PROVEEDORES);
  if (!sheet) {
    handleInitStructure();
    sheet = ss.getSheetByName(HOJA_PROVEEDORES);
  }

  var rows = [];
  var timestamp = new Date().toLocaleString("es-CO");

  data.forEach(function(p) {
    rows.push([
      p.id || '',
      p.codigoProveedor || '',
      p.razonSocial || p.nombre || '',
      p.tipoProveedor || 'TELA',
      p.contacto || '',
      p.correo || '',
      p.telefono || '',
      (p.ciudad ? p.ciudad + ', ' : '') + (p.pais || 'Colombia'),
      p.calificacionPromedio || 5.0,
      p.activo !== false ? 'SI' : 'NO',
      timestamp
    ]);
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
    message: "Directorio de proveedores sincronizado en Google Sheets.",
    proveedoresProcesados: rows.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * 9. Sincroniza Bitácora de Auditoría
 */
function handleSyncAuditoria(data) {
  if (!data || !Array.isArray(data)) {
    return createJsonResponse({ success: false, error: "Datos de auditoría inválidos" });
  }

  var ss = getOrCreateSpreadsheet();
  var sheet = ss.getSheetByName(HOJA_AUDITORIA);
  if (!sheet) {
    handleInitStructure();
    sheet = ss.getSheetByName(HOJA_AUDITORIA);
  }

  var rows = [];
  data.forEach(function(log) {
    rows.push([
      log.id || '',
      log.fecha || '',
      log.hora || '',
      log.coleccion || '',
      log.documentoId || '',
      log.accion || '',
      log.usuario || '',
      log.rol || '',
      log.area || '',
      log.detalles || '',
      log.campoAfectado || ''
    ]);
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
    message: "Logs de auditoría sincronizados en Google Sheets.",
    logsProcesados: rows.length,
    timestamp: new Date().toISOString()
  });
}

/**
 * 10. Sincronización Maestra Total (Telas, Accesorios, Forros, Fichas, Proveedores)
 */
function handleSyncAllMaster(payload) {
  if (!payload) return createJsonResponse({ success: false, error: "Sin datos para sincronizar" });

  var respTelas = payload.telas ? JSON.parse(handleSyncTelas(payload.telas).getContent()) : null;
  var respAcc = payload.accesorios ? JSON.parse(handleSyncAccesorios(payload.accesorios).getContent()) : null;
  var respForros = payload.forros ? JSON.parse(handleSyncForrosCosturas(payload.forros).getContent()) : null;
  var respFichas = payload.fichas ? JSON.parse(handleSyncFichas(payload.fichas).getContent()) : null;
  var respProv = payload.proveedores ? JSON.parse(handleSyncProveedores(payload.proveedores).getContent()) : null;

  return createJsonResponse({
    success: true,
    message: "Sincronización maestra total con Google Sheets ejecutada exitosamente.",
    telas: respTelas,
    accesorios: respAcc,
    forros: respForros,
    fichas: respFichas,
    proveedores: respProv,
    timestamp: new Date().toISOString()
  });
}

/**
 * 11. Sincroniza tanto Telas como Accesorios (Retrocompatibilidad)
 */
function handleSyncAll(data) {
  return handleSyncAllMaster(data);
}

/**
 * 12. Recupera todos los datos maestros de Google Sheets para consulta
 */
function handleGetAllData() {
  var ss = getOrCreateSpreadsheet();
  var sheetTelas = ss.getSheetByName(HOJA_TELAS);
  var sheetAcc = ss.getSheetByName(HOJA_ACCESORIOS);
  var sheetForros = ss.getSheetByName(HOJA_FORROS_COSTURAS);
  var sheetFichas = ss.getSheetByName(HOJA_FICHAS);

  var telas = (sheetTelas && sheetTelas.getLastRow() > 1) ? sheetTelas.getRange(2, 1, sheetTelas.getLastRow() - 1, sheetTelas.getLastColumn()).getValues() : [];
  var accesorios = (sheetAcc && sheetAcc.getLastRow() > 1) ? sheetAcc.getRange(2, 1, sheetAcc.getLastRow() - 1, sheetAcc.getLastColumn()).getValues() : [];
  var forros = (sheetForros && sheetForros.getLastRow() > 1) ? sheetForros.getRange(2, 1, sheetForros.getLastRow() - 1, sheetForros.getLastColumn()).getValues() : [];
  var fichas = (sheetFichas && sheetFichas.getLastRow() > 1) ? sheetFichas.getRange(2, 1, sheetFichas.getLastRow() - 1, sheetFichas.getLastColumn()).getValues() : [];

  return createJsonResponse({
    success: true,
    telas: telas,
    accesorios: accesorios,
    forros: forros,
    fichas: fichas,
    timestamp: new Date().toISOString()
  });
}
