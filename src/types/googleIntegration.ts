/**
 * STFLAB - Tipos y Esquemas para la Integración con Google Workspace (Drive & Sheets)
 * STF GROUP S.A.
 */

export type GoogleSyncStatus = 'disconnected' | 'connected' | 'syncing' | 'error' | 'testing';

export interface GoogleIntegrationConfig {
  webAppUrl: string;                // URL del Web App de Google Apps Script (script.google.com/macros/s/.../exec)
  spreadsheetId?: string;           // ID del Google Spreadsheet
  spreadsheetUrl?: string;          // Enlace directo al Google Spreadsheet
  rootFolderId?: string;            // ID de la carpeta principal en Google Drive
  rootFolderUrl?: string;           // Enlace directo a la carpeta en Google Drive
  fichasFolderUrl?: string;         // Enlace a subcarpeta Fichas Técnicas
  ensayosFolderUrl?: string;        // Enlace a subcarpeta Ensayos / Fotos
  solicitudesFolderUrl?: string;    // Enlace a subcarpeta Solicitudes
  driveFolderBibliotecaId?: string; // ID específico de la carpeta de Drive vinculada a Biblioteca Técnica
  driveFolderBibliotecaUrl?: string;// URL completa de la carpeta de Drive vinculada a Biblioteca Técnica
  autoSyncEnabled: boolean;         // Si es true, sincroniza en segundo plano al crear/responder solicitudes
  lastSyncTimestamp?: string;       // ISO Date del último respaldo exitoso
  lastSyncStatus?: 'success' | 'warning' | 'error';
  lastSyncMessage?: string;
  totalSyncedTelas?: number;
  totalSyncedAccesorios?: number;
  totalSyncedForros?: number;
  totalSyncedFichas?: number;
  totalSyncedProveedores?: number;
  userAccountEmail?: string;        // Email de la cuenta Google que desplegó el script
}

export interface DriveSubfolder {
  id: string;
  name: string;
  url: string;
  year?: string | null;
  fileCount?: number;
}

export interface DriveFolderFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  url: string;
  downloadUrl?: string;
  updated?: string;
  folderId?: string;
  folderName?: string;
  year?: string;
}

export interface GoogleDriveUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  fileUrl?: string;                 // URL para ver en Google Drive
  downloadUrl?: string;             // URL de descarga directa
  thumbnailUrl?: string;            // URL de miniatura (si aplica)
  folderCategory?: 'fichas' | 'ensayos' | 'solicitudes' | 'general';
  targetFolderId?: string;
  error?: string;
}

export interface GoogleSyncResponse {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  rootFolderId?: string;
  rootFolderUrl?: string;
  fichasFolderUrl?: string;
  ensayosFolderUrl?: string;
  solicitudesFolderUrl?: string;
  driveFolderBibliotecaUrl?: string;
  userEmail?: string;
  telasProcesadas?: number;
  accesoriosProcesados?: number;
  fichasProcesadas?: number;
  forrosProcesados?: number;
  proveedoresProcesados?: number;
  pestañas?: string[];
  telas?: any;
  accesorios?: any;
  forros?: any;
  fichas?: any;
  proveedores?: any;
  folders?: DriveSubfolder[];
  files?: DriveFolderFile[];
  totalFiles?: number;
  totalFolders?: number;
}

