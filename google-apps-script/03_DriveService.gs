/**
 * =========================================================================================
 * STFLAB - MÓDULO 03: SERVICIO DE GOOGLE DRIVE (FICHAS, AÑOS Y LECTURA IA)
 * STF GROUP S.A.
 * =========================================================================================
 */

/**
 * Almacena archivos adjuntos (PDFs, fotos, documentos) en carpetas de Google Drive
 */
function handleUploadFile(payload) {
  var fileName = payload.fileName || ("STFLab_Archivo_" + new Date().getTime());
  var mimeType = payload.mimeType || "application/octet-stream";
  var base64Data = payload.base64Data || "";
  var folderCategory = payload.folderCategory || "general";
  var targetFolderId = payload.targetFolderId || CARPETA_BIBLIOTECA_DEFAULT_ID;

  if (!base64Data) {
    return createJsonResponse({ success: false, error: "No se proporcionó el contenido base64 del archivo" });
  }

  var targetFolder = null;
  if (targetFolderId) {
    try {
      targetFolder = DriveApp.getFolderById(targetFolderId);
    } catch (fErr) {
      targetFolder = null;
    }
  }

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

  var decodedBytes = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
  var file = targetFolder.createFile(blob);

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
 * Lista todos los archivos y subcarpetas de años de forma recursiva
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
      
      var subFiles = sub.getFiles();
      var count = 0;
      while (subFiles.hasNext()) {
        var subF = subFiles.next();
        count++;
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
 * Lee el archivo de Google Drive en Base64 para procesarlo con Lectura Inteligente IA
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
