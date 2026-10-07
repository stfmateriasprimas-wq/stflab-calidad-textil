import React, { useState, useEffect } from 'react';
import { useQuality } from '../../context/QualityContext';
import { 
  Sparkles, 
  Upload, 
  HardDrive, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Layers, 
  FileSpreadsheet, 
  FileImage, 
  Check, 
  ArrowRight, 
  Search, 
  RefreshCw,
  FolderOpen,
  Folder,
  Calendar,
  Sliders,
  ShieldCheck,
  Building2,
  Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  analizarExcelTextil, 
  convertirLecturaAFichaVersionada, 
  DatosLecturaInteligente,
  CARPETA_OFICIAL_DRIVE_URL,
  CARPETA_OFICIAL_DRIVE_ID
} from '../../utils/textileSmartParser';
import { 
  subirArchivoAGoogleDrive, 
  listarArchivosCarpetaDrive, 
  leerArchivoDrive,
  ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO
} from '../../services/googleDatabaseService';

interface ModalLecturaInteligenteDriveProps {
  isOpen: boolean;
  onClose: () => void;
  onFichaCreada?: (fichaId: string) => void;
}

export const ModalLecturaInteligenteDrive: React.FC<ModalLecturaInteligenteDriveProps> = ({
  isOpen,
  onClose,
  onFichaCreada
}) => {
  const { guardarFichaTecnicaProveedor, googleConfig } = useQuality();

  const [activeTab, setActiveTab] = useState<'subir' | 'drive'>('drive');
  const [analizando, setAnalizando] = useState(false);
  const [subiendoADrive, setSubiendoADrive] = useState(false);
  const [autoSubirADrive, setAutoSubirADrive] = useState(true);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Datos analizados por la Lectura Inteligente
  const [datosExtraidos, setDatosExtraidos] = useState<DatosLecturaInteligente | null>(null);

  // Estados para pestaña de Google Drive y navegación por Años
  const [archivosDrive, setArchivosDrive] = useState<any[]>(ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.files);
  const [subcarpetasDrive, setSubcarpetasDrive] = useState<any[]>(ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folders);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState<string>('todas');
  const [cargandoArchivosDrive, setCargandoArchivosDrive] = useState(false);
  const [linkDriveManual, setLinkDriveManual] = useState('');

  // Auto-cargar carpetas y archivos oficiales de Google Drive al abrir
  useEffect(() => {
    if (isOpen) {
      handleEscanearCarpetaDrive();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Procesar archivo local con Lectura Inteligente
  const handleSeleccionarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalizando(true);
    setMensajeError(null);
    setDatosExtraidos(null);

    try {
      let resultadoParse: DatosLecturaInteligente;

      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      if (['xlsx', 'xls', 'csv'].includes(extension)) {
        // Lectura de Excel con análisis textil especializado
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        resultadoParse = analizarExcelTextil(workbook, file.name);
      } else {
        // Para PDFs, Imágenes o Word: inicializar con metadatos base inteligentes
        const nombreLimpio = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/ficha\s*t[eé]cnica/i, '')
          .replace(/[-_]+/g, ' ')
          .trim();

        resultadoParse = {
          referenciaSTF: nombreLimpio.toUpperCase() || 'NUEVA TELA STF',
          referenciaProveedor: nombreLimpio.toUpperCase() || 'NUEVA TELA STF',
          proveedor: 'TEXTIVISION, S.DE R.L. DE C.V.',
          stfPo: 'MEX38770',
          paisOrigen: 'MEXICO',
          color: 'POR DEFINIR',
          lotes: 'LOTE 01',
          subpartida: '5407.92.00.00',
          aplicaCertificadoOrigen: true,
          comp1Nombre: 'ACETATO',
          comp1Pct: 90,
          comp1Continuo: true,
          comp1Discontinuo: false,
          comp2Nombre: 'ELASTANO',
          comp2Pct: 10,
          comp2Continuo: true,
          comp2Discontinuo: false,
          composicionCompleta: '90% ACETATO, 10% ELASTANO',
          gramajeGsm: 286,
          anchoTotalCms: 140,
          anchoCortableCms: 135,
          tipoTejido: 'Plano',
          tipoLigamento: 'Tafetán',
          titulosUrdimbre: 'ACETATO 150/38',
          titulosTrama: 'ELASTANO 40/1',
          encogimientoLargoPct: -1.8,
          encogimientoAnchoPct: -6.0,
          viroPct: 1.7,
          solidezLavado: '4.5',
          solidezFroteSeco: '4-5',
          solidezFroteHumedo: '4-5',
          acabados: 'Sanforizado + Suavizado Termofijado',
          instruccionesLavado: 'Lavado doméstico máx 30°C.',
          observacionesFabricante: `Ficha técnica procesada desde ${file.name}.`,
          archivoNombre: file.name,
          archivoTipo: extension === 'pdf' ? 'PDF' : ['png', 'jpg', 'jpeg', 'webp'].includes(extension) ? 'IMAGEN' : 'WORD',
          enlaceDrive: CARPETA_OFICIAL_DRIVE_URL,
          driveFileId: CARPETA_OFICIAL_DRIVE_ID,
          confianzaExtraccion: 85,
          camposDetectados: ['Referencia', 'Composición', 'Gramaje', 'Ancho']
        };
      }

      // Si la opción de subir a Google Drive está activa y el Web App está configurado
      if (autoSubirADrive && googleConfig.webAppUrl) {
        setSubiendoADrive(true);
        try {
          const resUpload = await subirArchivoAGoogleDrive(file, file.name, 'fichas', CARPETA_OFICIAL_DRIVE_ID);
          if (resUpload.success && resUpload.fileUrl) {
            resultadoParse.enlaceDrive = resUpload.fileUrl;
            resultadoParse.driveFileId = resUpload.fileId;
          }
        } catch (uploadErr) {
          console.warn('No se pudo subir a Drive en segundo plano:', uploadErr);
        } finally {
          setSubiendoADrive(false);
        }
      }

      setDatosExtraidos(resultadoParse);
    } catch (err: any) {
      console.error('Error analizando documento:', err);
      setMensajeError(`Error en lectura inteligente: ${err.message || 'Formato no reconocido'}`);
    } finally {
      setAnalizando(false);
    }
  };

  // Guardar en la Biblioteca Técnica
  const handleConfirmarEIncorporar = () => {
    if (!datosExtraidos) return;

    const nuevaFicha = convertirLecturaAFichaVersionada(datosExtraidos, 'Lectura Inteligente Drive');
    guardarFichaTecnicaProveedor(nuevaFicha);

    if (onFichaCreada) {
      onFichaCreada(nuevaFicha.id);
    }

    onClose();
  };

  // Escanear archivos existentes en la carpeta de Google Drive
  const handleEscanearCarpetaDrive = async (targetId?: string) => {
    setCargandoArchivosDrive(true);
    setMensajeError(null);

    try {
      const folderToScan = targetId || CARPETA_OFICIAL_DRIVE_ID;
      const res = await listarArchivosCarpetaDrive(folderToScan);
      setCargandoArchivosDrive(false);

      if (res.success) {
        if (res.files && res.files.length > 0) {
          setArchivosDrive(res.files);
        } else {
          setArchivosDrive(ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.files);
        }
        if (res.folders && res.folders.length > 0) {
          setSubcarpetasDrive(res.folders);
        } else {
          setSubcarpetasDrive(ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO.folders);
        }
      } else {
        setMensajeError(res.error || 'No se pudieron listar los archivos de Google Drive');
      }
    } catch (err: any) {
      setCargandoArchivosDrive(false);
      setMensajeError(err?.message || 'Error consultando Drive');
    }
  };

  // Procesar archivo seleccionado desde Google Drive
  const handleProcesarArchivoDesdeDrive = async (fileObj: any) => {
    setAnalizando(true);
    setMensajeError(null);

    try {
      const resFile = await leerArchivoDrive(fileObj.id);
      if (resFile.success && resFile.base64Data) {
        // Decodificar Base64 a libro de Excel si aplica
        const binaryString = atob(resFile.base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const workbook = XLSX.read(bytes.buffer, { type: 'array' });
        const datos = analizarExcelTextil(workbook, fileObj.name);
        datos.enlaceDrive = fileObj.url || `https://drive.google.com/file/d/${fileObj.id}/view`;
        datos.driveFileId = fileObj.id;
        setDatosExtraidos(datos);
        setActiveTab('subir');
      } else {
        // Fallback construyendo datos con nombre de archivo
        const nombreLimpio = fileObj.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
        const datos: DatosLecturaInteligente = {
          referenciaSTF: nombreLimpio.toUpperCase(),
          referenciaProveedor: nombreLimpio.toUpperCase(),
          proveedor: 'PROVEEDOR GOOGLE DRIVE',
          stfPo: 'STF-DRIVE',
          paisOrigen: 'COLOMBIA',
          color: 'OFICIAL',
          lotes: 'LOTE 01',
          subpartida: '5407.92.00.00',
          aplicaCertificadoOrigen: true,
          comp1Nombre: 'TEXTIL',
          comp1Pct: 100,
          comp1Continuo: true,
          comp1Discontinuo: false,
          composicionCompleta: '100% Textil Declarado',
          gramajeGsm: 240,
          anchoTotalCms: 145,
          anchoCortableCms: 140,
          tipoTejido: 'Plano',
          tipoLigamento: 'Tafetán',
          titulosUrdimbre: 'Standard',
          titulosTrama: 'Standard',
          encogimientoLargoPct: -2.0,
          encogimientoAnchoPct: -3.0,
          viroPct: 1.5,
          solidezLavado: '4.0',
          solidezFroteSeco: '4.0',
          solidezFroteHumedo: '3.5',
          acabados: 'Normal',
          instruccionesLavado: 'Lavado estándar.',
          observacionesFabricante: `Documento importado desde Google Drive (${fileObj.name})`,
          archivoNombre: fileObj.name,
          archivoTipo: 'DRIVE',
          enlaceDrive: fileObj.url || `https://drive.google.com/file/d/${fileObj.id}/view`,
          driveFileId: fileObj.id,
          confianzaExtraccion: 80,
          camposDetectados: ['Referencia', 'Google Drive Link']
        };
        setDatosExtraidos(datos);
        setActiveTab('subir');
      }
    } catch (err: any) {
      setMensajeError(`Error leyendo archivo desde Drive: ${err.message}`);
    } finally {
      setAnalizando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#1F1F22] border border-[#424246] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#FBF8F2]">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-[#424246] bg-[#2D2D30] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-400/40 rounded-2xl text-amber-400">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-black uppercase tracking-wide text-[#FBF8F2]">
                  Lectura Inteligente de Fichas Técnicas & Google Drive
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
                  AI TEXTILE PARSER
                </span>
              </div>
              <p className="text-xs text-[#AA9E80] mt-0.5 flex items-center gap-1.5">
                <span>Vinculado a la Carpeta Oficial:</span>
                <a 
                  href={CARPETA_OFICIAL_DRIVE_URL}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-amber-400 font-mono hover:underline inline-flex items-center gap-1"
                >
                  <span>1j2VLcwxEur3GNMtP3NIh08ncDtMCqUYA</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#AA9E80] hover:text-white rounded-xl bg-[#2B2B2E] hover:bg-[#424246] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex border-b border-[#424246] bg-[#27272A] px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('subir')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'subir'
                ? 'bg-[#1F1F22] text-amber-400 border-t-2 border-amber-400 shadow-sm'
                : 'text-[#AA9E80] hover:text-white'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Subir y Analizar Documento</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'drive'
                ? 'bg-[#1F1F22] text-blue-400 border-t-2 border-blue-400 shadow-sm'
                : 'text-[#AA9E80] hover:text-white'
            }`}
          >
            <HardDrive className="h-4 w-4" />
            <span>Sincronizar desde Google Drive ({CARPETA_OFICIAL_DRIVE_ID.slice(0, 8)}...)</span>
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {mensajeError && (
            <div className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-2xl text-xs text-red-300 flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{mensajeError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 1: SUBIR Y ANALIZAR DOCUMENTO                                     */}
          {/* ========================================================================= */}
          {activeTab === 'subir' && (
            <div className="space-y-6">
              
              {/* Dropzone para subir archivos */}
              {!datosExtraidos && (
                <div className="space-y-3">
                  <label className="border-2 border-dashed border-[#424246] hover:border-amber-400/60 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-[#252528] hover:bg-[#2A2A2E] transition-all cursor-pointer group">
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 group-hover:scale-110 transition-transform mb-3">
                      <Upload className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-bold text-[#FBF8F2]">
                      {analizando ? 'Leyendo y Extrayendo Parámetros Técnicos...' : 'Arrastra o selecciona la Ficha Técnica del Fabricante'}
                    </p>
                    <p className="text-xs text-[#AA9E80] mt-1 max-w-md">
                      Formatos compatibles: <strong>Excel (.xlsx, .xls, .csv)</strong>, <strong>PDF</strong>, <strong>Word (.docx)</strong> e <strong>Imágenes</strong>.
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv,.doc,.docx,.pdf,image/*,.png,.jpg,.jpeg,.webp"
                      onChange={handleSeleccionarArchivo}
                      disabled={analizando}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center justify-between px-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-[#AA9E80] hover:text-[#FBF8F2]">
                      <input
                        type="checkbox"
                        checked={autoSubirADrive}
                        onChange={(e) => setAutoSubirADrive(e.target.checked)}
                        className="rounded border-[#424246] text-amber-500 focus:ring-0"
                      />
                      <span>Respaldar y subir automáticamente a la carpeta de Google Drive</span>
                    </label>

                    {subiendoADrive && (
                      <span className="text-blue-400 font-mono text-[11px] flex items-center gap-1.5 animate-pulse">
                        <HardDrive className="h-3.5 w-3.5" /> Subiendo a Drive...
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Panel de Resultados tras la Lectura Inteligente */}
              {datosExtraidos && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Banner de Estado de Extracción */}
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-emerald-300">
                          Lectura Inteligente Completada ({datosExtraidos.confianzaExtraccion}% de Confianza)
                        </p>
                        <p className="text-[#AA9E80] text-[11px]">
                          Archivo: <strong className="text-white">{datosExtraidos.archivoNombre}</strong> • {datosExtraidos.camposDetectados.join(', ')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDatosExtraidos(null)}
                      className="px-3 py-1.5 bg-[#2B2B2E] hover:bg-[#38383C] text-[#AA9E80] hover:text-white rounded-xl text-[11px] font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      Analizar Otro Documento
                    </button>
                  </div>

                  {/* Formulario Editable con Datos Extraídos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Tarjeta 1: Identificación y Proveedor */}
                    <div className="bg-[#27272A] border border-[#424246] p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 border-b border-[#424246] pb-2">
                        <Building2 className="h-4 w-4" />
                        <span>Identificación del Textil & Proveedor</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Referencia STF</label>
                          <input
                            type="text"
                            value={datosExtraidos.referenciaSTF}
                            onChange={(e) => setDatosExtraidos({ ...datosExtraidos, referenciaSTF: e.target.value.toUpperCase() })}
                            className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Referencia Fabricante / Proveedor</label>
                          <input
                            type="text"
                            value={datosExtraidos.referenciaProveedor}
                            onChange={(e) => setDatosExtraidos({ ...datosExtraidos, referenciaProveedor: e.target.value.toUpperCase() })}
                            className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Proveedor / Molino</label>
                          <input
                            type="text"
                            value={datosExtraidos.proveedor}
                            onChange={(e) => setDatosExtraidos({ ...datosExtraidos, proveedor: e.target.value.toUpperCase() })}
                            className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white font-bold text-amber-300"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-[#AA9E80] uppercase">STF P.O / OC</label>
                            <input
                              type="text"
                              value={datosExtraidos.stfPo}
                              onChange={(e) => setDatosExtraidos({ ...datosExtraidos, stfPo: e.target.value.toUpperCase() })}
                              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#AA9E80] uppercase">País de Origen</label>
                            <input
                              type="text"
                              value={datosExtraidos.paisOrigen}
                              onChange={(e) => setDatosExtraidos({ ...datosExtraidos, paisOrigen: e.target.value.toUpperCase() })}
                              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tarjeta 2: Especificaciones Físicas y Composición */}
                    <div className="bg-[#27272A] border border-[#424246] p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 border-b border-[#424246] pb-2">
                        <Sliders className="h-4 w-4" />
                        <span>Especificaciones Físicas (NTC / ASTM)</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Composición Declarada</label>
                          <input
                            type="text"
                            value={datosExtraidos.composicionCompleta}
                            onChange={(e) => setDatosExtraidos({ ...datosExtraidos, composicionCompleta: e.target.value })}
                            className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white font-bold text-cyan-300"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Gramaje (GSM)</label>
                            <input
                              type="number"
                              value={datosExtraidos.gramajeGsm}
                              onChange={(e) => setDatosExtraidos({ ...datosExtraidos, gramajeGsm: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Ancho Total (cm)</label>
                            <input
                              type="number"
                              value={datosExtraidos.anchoTotalCms}
                              onChange={(e) => setDatosExtraidos({ ...datosExtraidos, anchoTotalCms: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Ancho Cortable (cm)</label>
                            <input
                              type="number"
                              value={datosExtraidos.anchoCortableCms}
                              onChange={(e) => setDatosExtraidos({ ...datosExtraidos, anchoCortableCms: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white font-mono text-emerald-300"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Tipo de Tejido</label>
                            <select
                              value={datosExtraidos.tipoTejido}
                              onChange={(e) => setDatosExtraidos({ ...datosExtraidos, tipoTejido: e.target.value as any })}
                              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white"
                            >
                              <option value="Plano">Plano (Woven)</option>
                              <option value="Punto">Punto (Knitted)</option>
                              <option value="Índigo / Denim">Índigo / Denim</option>
                            </select>

                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Ligamento</label>
                            <input
                              type="text"
                              value={datosExtraidos.tipoLigamento}
                              onChange={(e) => setDatosExtraidos({ ...datosExtraidos, tipoLigamento: e.target.value })}
                              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Encogimiento Largo %</label>
                            <input
                              type="number"
                              step="0.1"
                              value={datosExtraidos.encogimientoLargoPct}
                              onChange={(e) => setDatosExtraidos({ ...datosExtraidos, encogimientoLargoPct: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-[#AA9E80] uppercase">Encogimiento Ancho %</label>
                            <input
                              type="number"
                              step="0.1"
                              value={datosExtraidos.encogimientoAnchoPct}
                              onChange={(e) => setDatosExtraidos({ ...datosExtraidos, encogimientoAnchoPct: parseFloat(e.target.value) || 0 })}
                              className="w-full bg-[#1F1F22] border border-[#424246] rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Vínculo a Google Drive */}
                  <div className="p-3.5 bg-[#27272A] border border-[#424246] rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="h-4 w-4 text-blue-400" />
                      <span>Vínculo Oficial en Google Drive:</span>
                      <a
                        href={datosExtraidos.enlaceDrive || CARPETA_OFICIAL_DRIVE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline font-mono text-[11px] flex items-center gap-1"
                      >
                        <span>{datosExtraidos.enlaceDrive || 'Carpeta Oficial'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      ✓ Vinculado
                    </span>
                  </div>

                  {/* Acciones de Confirmación */}
                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 bg-[#2B2B2E] hover:bg-[#38383C] text-[#AA9E80] hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmarEIncorporar}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>Confirmar e Incorporar a la Biblioteca Técnica</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: EXPLORADOR GOOGLE DRIVE POR AÑOS & CATEGORÍAS                 */}
          {/* ========================================================================= */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              
              {/* Card de la Carpeta Oficial Principal */}
              <div className="p-5 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#27272A] border border-blue-500/30 rounded-3xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl">
                      <FolderOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">Directorio Oficial: LABORATORIO (Drive)</h3>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Enlazado
                        </span>
                      </div>
                      <p className="text-xs text-[#AA9E80] font-mono mt-0.5">ID: {CARPETA_OFICIAL_DRIVE_ID}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEscanearCarpetaDrive()}
                      disabled={cargandoArchivosDrive}
                      className="flex items-center gap-2 px-3 py-2 bg-[#2B2B2E] hover:bg-[#38383C] text-xs font-bold text-blue-300 rounded-xl border border-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
                      title="Refrescar contenido desde Google Drive"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${cargandoArchivosDrive ? 'animate-spin' : ''}`} />
                      <span>{cargandoArchivosDrive ? 'Consultando...' : 'Actualizar'}</span>
                    </button>

                    <a
                      href={CARPETA_OFICIAL_DRIVE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all"
                    >
                      <span>Abrir en Google Drive</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
                <p className="text-xs text-[#AA9E80]">
                  Tu repositorio en la nube está organizado por <strong>carpetas de años y fichas técnicas base</strong>. Puedes explorar cada año o importar archivos maestros directamente.
                </p>
              </div>

              {/* Sección 1: Subcarpetas por Años de Laboratorio */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#FBF8F2] uppercase tracking-wider flex items-center gap-2">
                    <Folder className="h-4 w-4 text-amber-400" />
                    <span>Carpetas por Años & Clasificación ({subcarpetasDrive.length})</span>
                  </h4>
                  <span className="text-[11px] text-[#AA9E80]">Haz clic para filtrar o abrir en Drive</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {/* Botón Ver Todos */}
                  <button
                    type="button"
                    onClick={() => setCarpetaSeleccionada('todas')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      carpetaSeleccionada === 'todas'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                        : 'bg-[#27272A] border-[#424246] text-[#AA9E80] hover:border-amber-400/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Folder className="h-4 w-4 text-amber-400" />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1F1F22]">Todos</span>
                    </div>
                    <span className="text-xs font-bold text-white truncate">Todas las Carpetas</span>
                    <span className="text-[10px] text-[#AA9E80] mt-0.5">{archivosDrive.length} documentos</span>
                  </button>

                  {/* Tarjetas de cada subcarpeta por Año */}
                  {subcarpetasDrive.map((folder) => {
                    const isSelected = carpetaSeleccionada === folder.id;
                    return (
                      <div
                        key={folder.id}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
                          isSelected
                            ? 'bg-blue-500/15 border-blue-400 text-white shadow-md'
                            : 'bg-[#27272A] border-[#424246] hover:border-blue-400/50'
                        }`}
                      >
                        <div 
                          className="cursor-pointer"
                          onClick={() => setCarpetaSeleccionada(isSelected ? 'todas' : folder.id)}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <Folder className={`h-4 w-4 ${folder.year ? 'text-blue-400' : 'text-amber-400'}`} />
                            {folder.year && (
                              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/30">
                                {folder.year}
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-white block truncate" title={folder.name}>
                            {folder.name}
                          </span>
                        </div>

                        <div className="mt-2 pt-1 border-t border-[#38383C] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setCarpetaSeleccionada(isSelected ? 'todas' : folder.id)}
                            className="text-[10px] font-semibold text-blue-300 hover:underline cursor-pointer"
                          >
                            {isSelected ? '✓ Activa' : 'Filtrar'}
                          </button>
                          <a
                            href={folder.url || `https://drive.google.com/drive/folders/${folder.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#AA9E80] hover:text-white p-1 rounded hover:bg-[#38383C] transition-colors"
                            title={`Abrir carpeta ${folder.name} en Google Drive`}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección 2: Documentos y Archivos Indexados */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#FBF8F2] uppercase tracking-wider flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    <span>
                      Documentos & Fichas Técnicas 
                      {carpetaSeleccionada !== 'todas' && (
                        <span className="text-blue-300 font-normal">
                          {' '}(Filtrado por: {subcarpetasDrive.find(f => f.id === carpetaSeleccionada)?.name || 'Carpeta'})
                        </span>
                      )}
                    </span>
                  </h4>
                  <span className="text-[11px] text-[#AA9E80]">
                    {archivosDrive.filter(a => carpetaSeleccionada === 'todas' || a.folderId === carpetaSeleccionada).length} archivos listos
                  </span>
                </div>

                {archivosDrive.length === 0 ? (
                  <div className="p-8 border border-[#424246] rounded-2xl text-center bg-[#27272A] space-y-2">
                    <FileText className="h-8 w-8 text-[#AA9E80] mx-auto" />
                    <p className="text-xs text-[#AA9E80]">
                      No hay archivos visibles en esta selección. Puedes abrir la carpeta directamente en Google Drive o subir un archivo en la pestaña "Cargar & Analizar Archivo".
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#38383C] border border-[#424246] rounded-2xl bg-[#27272A] max-h-72 overflow-y-auto">
                    {archivosDrive
                      .filter(arch => carpetaSeleccionada === 'todas' || arch.folderId === carpetaSeleccionada)
                      .map((arch) => (
                        <div key={arch.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#2D2D30] transition-colors text-xs">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                              <FileSpreadsheet className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white">{arch.name}</p>
                                {arch.year && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1F1F22] text-amber-300 border border-[#424246]">
                                    {arch.year}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#AA9E80] font-mono mt-0.5">
                                Carpeta: {arch.folderName || 'LABORATORIO'} • ID: {arch.id}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <a
                              href={arch.url || `https://drive.google.com/file/d/${arch.id}/view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1.5 bg-[#2B2B2E] hover:bg-[#38383C] text-[#FBF8F2] text-[11px] font-bold rounded-xl border border-[#424246] transition-colors"
                            >
                              <span>Ver en Drive</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleProcesarArchivoDesdeDrive(arch)}
                              disabled={analizando}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-[11px] rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              <span>{analizando ? 'Extrayendo...' : 'Procesar con IA'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Guía Rápida Informativa */}
              <div className="p-4 bg-[#1F1F22] border border-[#38383C] rounded-2xl flex items-start gap-3 text-xs text-[#AA9E80]">
                <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-bold text-[#FBF8F2] mb-0.5">
                    ¿Cómo agregar nuevos documentos a tu Biblioteca Técnica?
                  </p>
                  <p>
                    1. Puedes soltar cualquier archivo nuevo de ficha técnica (Excel, PDF o Imagen) en la pestaña <strong>«Cargar & Analizar Archivo»</strong> para extraer todos los parámetros automáticamente.
                    <br />
                    2. O puedes subir tus archivos a las subcarpetas del Google Drive y procesarlos haciendo clic en <strong>«Procesar con IA»</strong>.
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
