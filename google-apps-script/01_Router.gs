/**
 * =========================================================================================
 * STFLAB - MÓDULO 01: ENRUTADOR PRINCIPAL (doGet & doPost)
 * STF GROUP S.A.
 * =========================================================================================
 */

/**
 * Manejador de peticiones GET (Ping, lecturas y exploraciones)
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
 * Manejador de peticiones POST (Inserción, sincronización, subida de archivos y lectura IA)
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

    // Rutas de administración y ping
    if (action === 'ping') return handlePing();
    if (action === 'initStructure') return handleInitStructure();

    // Rutas de Google Sheets (7 Pestañas Maestras)
    if (action === 'syncTelas') return handleSyncTelas(payload.data);
    if (action === 'syncAccesorios') return handleSyncAccesorios(payload.data);
    if (action === 'syncForrosCosturas') return handleSyncForrosCosturas(payload.data);
    if (action === 'syncFichas') return handleSyncFichas(payload.data);
    if (action === 'syncProveedores') return handleSyncProveedores(payload.data);
    if (action === 'syncAuditoria') return handleSyncAuditoria(payload.data);
    if (action === 'syncAllMaster') return handleSyncAllMaster(payload.data || payload);
    if (action === 'syncAll') return handleSyncAll(payload.data || payload);
    if (action === 'getAllData') return handleGetAllData();

    // Rutas de Google Drive
    if (action === 'uploadFile') return handleUploadFile(payload);
    if (action === 'listDriveFolder') return handleListDriveFolder(payload);
    if (action === 'readDriveFile') return handleReadDriveFile(payload);

    // Rutas de Conexión SQL (Fase de integración SQL)
    if (action === 'testSql') return handleTestSqlConnection(payload);
    if (action === 'syncSql') return handleSyncToSql(payload);

    return createJsonResponse({
      success: false,
      error: "Acción no reconocida: " + action
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString(),
      stack: err.stack
    });
  }
}

/**
 * Responde con Ping y metadatos de conexión activa
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
