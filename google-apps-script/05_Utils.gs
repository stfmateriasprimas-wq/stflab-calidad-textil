/**
 * =========================================================================================
 * STFLAB - MÓDULO 05: UTILIDADES Y HERRAMIENTAS AUXILIARES
 * STF GROUP S.A.
 * =========================================================================================
 */

/**
 * Función auxiliar para detectar años en nombres de carpetas o archivos (ej. 2022, 2023, 2024, 2025, 2026)
 */
function extractYearFromText(text) {
  if (!text) return null;
  var match = text.match(/(202[0-9])/);
  return match ? match[1] : null;
}

/**
 * Obtiene o crea la Hoja de Cálculo maestra en Google Drive
 */
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

/**
 * Obtiene o crea la carpeta raíz corporativa en Google Drive
 */
function getOrCreateRootFolder() {
  var folders = DriveApp.getFoldersByName(NOMBRE_CARPETA_RAIZ);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(NOMBRE_CARPETA_RAIZ);
}

/**
 * Obtiene o crea una subcarpeta dentro de una carpeta padre
 */
function getOrCreateSubFolder(parentFolder, subFolderName) {
  var subs = parentFolder.getFoldersByName(subFolderName);
  if (subs.hasNext()) {
    return subs.next();
  }
  return parentFolder.createFolder(subFolderName);
}

/**
 * Aplica estilos y encabezados oficiales a las pestañas de Google Sheets
 */
function setupSheetHeaders(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Estilo visual corporativo (Fondo grafito oscuro, texto dorado/blanco, negrita)
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#111827");
  headerRange.setFontColor("#FBBF24");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

/**
 * Genera respuesta HTTP estándar en formato JSON
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
