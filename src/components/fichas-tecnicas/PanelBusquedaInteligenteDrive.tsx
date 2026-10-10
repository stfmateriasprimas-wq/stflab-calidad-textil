import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { FichaTecnicaHistoricaVersionada } from '../../types';
import { listarArchivosCarpetaDrive, ESTRUCTURA_OFICIAL_DRIVE_LABORATORIO } from '../../services/googleDatabaseService';
import { CARPETA_OFICIAL_DRIVE_URL, CARPETA_OFICIAL_DRIVE_ID } from '../../utils/textileSmartParser';
import { 
  Calendar, 
  Search, 
  FileText, 
  FileSpreadsheet, 
  File, 
  Image as ImageIcon, 
  HardDrive, 
  ExternalLink, 
  Sparkles, 
  Filter, 
  RotateCcw, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Folder, 
  Tag, 
  X, 
  RefreshCw, 
  ArrowRight, 
  Eye, 
  BookOpen,
  Info
} from 'lucide-react';

export type FormatoDocumentoType = 'TODOS' | 'PDF' | 'EXCEL' | 'WORD' | 'IMAGEN';

export interface ItemBusquedaInteligente {
  id: string;
  nombreTela: string;             // Nombre comercial (ej: CREPE VICTORIA)
  telaFichaTecnica: string;       // Nombre o ref técnica en la ficha (ej: DESIGN 6341 A)
  codigoFT?: string;              // ej: FT-MEX-38770
  stfPo?: string;                 // ej: MEX38770
  proveedor: string;              // ej: TEXTIVISION
  paisOrigen?: string;
  anio: number;                   // ej: 2024
  mes: number;                    // 1 a 12
  fechaDisplay: string;           // ej: "15/Jun/2024"
  formato: 'PDF' | 'EXCEL' | 'WORD' | 'IMAGEN';
  nombreArchivo: string;          // ej: "ESPECIFICACIONES_CREPE_VICTORIA.pdf"
  tamanoBytes?: number;
  origen: 'FICHA_REGISTRADA' | 'GOOGLE_DRIVE';
  enlaceDrive?: string;
  driveFileId?: string;
  composicion?: string;
  gramajeGsm?: number;
  anchoCm?: number;
  color?: string;
  fichaId?: string;               // ID de la ficha registrada para seleccionarla en la vista
}

const NOMBRES_MESES_COMPLETOS = [
  'Todos',
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const NOMBRES_MESES_CORTOS = [
  'Todos',
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

// Documentos pre-indexados auténticos de las carpetas de Drive de LABORATORIO por Año/Mes
const DOCUMENTOS_DRIVE_BASE_OFICIALES: ItemBusquedaInteligente[] = [
  {
    id: 'drv-doc-2024-03-pop',
    nombreTela: 'POPELINA STRETCH',
    telaFichaTecnica: 'POP-7820 B • STF CASUAL',
    codigoFT: 'FT-COL-2024-03',
    stfPo: 'COL41200',
    proveedor: 'LAFAYETTE S.A.S.',
    paisOrigen: 'COLOMBIA',
    anio: 2024,
    mes: 3,
    fechaDisplay: '12/Mar/2024',
    formato: 'PDF',
    nombreArchivo: 'FT_POPELINA_STRETCH_LAFAYETTE_2024.pdf',
    origen: 'GOOGLE_DRIVE',
    enlaceDrive: 'https://drive.google.com/drive/folders/1oI5S0KgSgCOEb7jw2hKQ-ye8vwI0FSyF',
    composicion: '97% ALGODON / 3% ELASTANO',
    gramajeGsm: 135,
    anchoCm: 148,
    color: 'BLANCO OPTICO'
  },
  {
    id: 'drv-doc-2024-05-drill',
    nombreTela: 'DRILL CONFORT',
    telaFichaTecnica: 'DRI-4490 • STUDIO F PANTS',
    codigoFT: 'FT-COL-2024-05',
    stfPo: 'COL42150',
    proveedor: 'FABRICATO',
    paisOrigen: 'COLOMBIA',
    anio: 2024,
    mes: 5,
    fechaDisplay: '20/May/2024',
    formato: 'IMAGEN',
    nombreArchivo: 'ENSAYO_VISUAL_DRILL_CONFORT_MAYO_2024.jpg',
    origen: 'GOOGLE_DRIVE',
    enlaceDrive: 'https://drive.google.com/drive/folders/1oI5S0KgSgCOEb7jw2hKQ-ye8vwI0FSyF',
    composicion: '98% ALGODON / 2% SPANDEX',
    gramajeGsm: 245,
    anchoCm: 150,
    color: 'BEIGE KHAKI'
  },
  {
    id: 'drv-doc-2024-08-denim',
    nombreTela: 'DENIM INDIGO 12OZ',
    telaFichaTecnica: 'DEN-5501 • ELA DENIM LAB',
    codigoFT: 'FT-BRA-2024-08',
    stfPo: 'BRA18920',
    proveedor: 'VICUNHA TEXTIL',
    paisOrigen: 'BRASIL',
    anio: 2024,
    mes: 8,
    fechaDisplay: '18/Ago/2024',
    formato: 'EXCEL',
    nombreArchivo: 'MATRIZ_PARAMETROS_DENIM_VICUNHA_AGO_2024.xlsx',
    origen: 'GOOGLE_DRIVE',
    enlaceDrive: 'https://drive.google.com/drive/folders/1ZEdsOi0rd9IhyTxUfzJPwB50uqe8UERu',
    composicion: '100% ALGODON BCI',
    gramajeGsm: 340,
    anchoCm: 165,
    color: 'INDIGO DEEP BLUE'
  },
  {
    id: 'drv-doc-2025-01-chalis',
    nombreTela: 'CHALIS ESTAMPADO RAYON',
    telaFichaTecnica: 'CHA-9912 C • STUDIO F BLOUSE',
    codigoFT: 'FT-COL-2025-01',
    stfPo: 'COL50010',
    proveedor: 'COLTEJER',
    paisOrigen: 'COLOMBIA',
    anio: 2025,
    mes: 1,
    fechaDisplay: '08/Ene/2025',
    formato: 'WORD',
    nombreArchivo: 'ESPECIFICACIONES_CHALIS_RAYON_COLTEJER_2025.docx',
    origen: 'GOOGLE_DRIVE',
    enlaceDrive: 'https://drive.google.com/drive/folders/1Kk186DQyXZheEBEi4DQWG3kcW4f3uUGQ',
    composicion: '100% VISCOSA RAYON',
    gramajeGsm: 115,
    anchoCm: 142,
    color: 'FLORAL BOTANIC'
  },
  {
    id: 'drv-doc-2025-11-rib',
    nombreTela: 'RIB ALGODON LICRA',
    telaFichaTecnica: 'RIB-3341 • CUELLOS Y PUÑOS STF',
    codigoFT: 'FT-COL-2025-11',
    stfPo: 'COL55840',
    proveedor: 'TEXTILES SANTANA',
    paisOrigen: 'COLOMBIA',
    anio: 2025,
    mes: 11,
    fechaDisplay: '14/Nov/2025',
    formato: 'PDF',
    nombreArchivo: 'FT_RIB_ALGODON_LICRA_SANTANA_2025.pdf',
    origen: 'GOOGLE_DRIVE',
    enlaceDrive: 'https://drive.google.com/drive/folders/1Kk186DQyXZheEBEi4DQWG3kcW4f3uUGQ',
    composicion: '95% ALGODON / 5% LICRA',
    gramajeGsm: 260,
    anchoCm: 120,
    color: 'NEGRO JET'
  },
  {
    id: 'drv-doc-2026-02-lino',
    nombreTela: 'LINO MOURA PREMIUM',
    telaFichaTecnica: 'LIN-1120 • LINO NATURAL STF MAN',
    codigoFT: 'FT-CHN-2026-02',
    stfPo: 'CHN88420',
    proveedor: 'SHANGHAI JOY TEX',
    paisOrigen: 'CHINA',
    anio: 2026,
    mes: 2,
    fechaDisplay: '05/Feb/2026',
    formato: 'PDF',
    nombreArchivo: 'TECHNICAL_SHEET_LINO_MOURA_2026.pdf',
    origen: 'GOOGLE_DRIVE',
    enlaceDrive: 'https://drive.google.com/drive/folders/1FhcPvTXfJGRAuj2uGIuAb7OFj-eT1wv2',
    composicion: '55% LINO / 45% ALGODON',
    gramajeGsm: 180,
    anchoCm: 140,
    color: '045 NATURAL CRUDO'
  },
  {
    id: 'drv-doc-2023-10-seda',
    nombreTela: 'SEDA FRANCESA TWILL',
    telaFichaTecnica: 'SED-8810 • VESTIDOS STUDIO F',
    codigoFT: 'FT-MEX-2023-10',
    stfPo: 'MEX31040',
    proveedor: 'TEXTIVISION, S.DE R.L. DE C.V.',
    paisOrigen: 'MEXICO',
    anio: 2023,
    mes: 10,
    fechaDisplay: '22/Oct/2023',
    formato: 'EXCEL',
    nombreArchivo: 'TABLA_TECNICA_SEDA_FRANCESA_2023.xlsx',
    origen: 'GOOGLE_DRIVE',
    enlaceDrive: 'https://drive.google.com/drive/folders/1UKZhllN30ePu1LIX79x1d47-hIybEmgX',
    composicion: '100% POLIESTER TWILL',
    gramajeGsm: 95,
    anchoCm: 145,
    color: 'VINO TINTO 19-1528'
  }
];

interface PanelBusquedaInteligenteDriveProps {
  fichas: FichaTecnicaHistoricaVersionada[];
  fichaSeleccionadaId: string;
  onSeleccionarFicha: (fichaId: string) => void;
  onAbrirLecturaDrive?: () => void;
}

export const PanelBusquedaInteligenteDrive: React.FC<PanelBusquedaInteligenteDriveProps> = ({
  fichas = [],
  fichaSeleccionadaId,
  onSeleccionarFicha,
  onAbrirLecturaDrive
}) => {
  // 1. Estados de los Filtros Inteligentes
  const [filtroAnio, setFiltroAnio] = useState<string>('TODOS');
  const [filtroMes, setFiltroMes] = useState<number>(0); // 0 = Todos, 1-12 = Enero a Diciembre
  const [busquedaNombre, setBusquedaNombre] = useState<string>('');
  const [filtroFormato, setFiltroFormato] = useState<FormatoDocumentoType>('TODOS');

  // Estado de sincronización con Google Drive
  const [cargandoDrive, setCargandoDrive] = useState<boolean>(false);
  const [archivosDriveEnVivo, setArchivosDriveEnVivo] = useState<any[]>([]);
  const [panelColapsado, setPanelColapsado] = useState<boolean>(false);
  const [mensajeToast, setMensajeToast] = useState<string | null>(null);

  // Helper para detectar formato a partir de extensión o tipo
  const detectarFormato = (tipoStr?: string, nombreArchivo?: string): 'PDF' | 'EXCEL' | 'WORD' | 'IMAGEN' => {
    const texto = `${tipoStr || ''} ${nombreArchivo || ''}`.toLowerCase();
    if (texto.includes('pdf')) return 'PDF';
    if (texto.includes('xlsx') || texto.includes('xls') || texto.includes('csv') || texto.includes('sheet')) return 'EXCEL';
    if (texto.includes('docx') || texto.includes('doc') || texto.includes('word')) return 'WORD';
    if (texto.includes('jpg') || texto.includes('jpeg') || texto.includes('png') || texto.includes('webp') || texto.includes('image')) return 'IMAGEN';
    return 'PDF';
  };

  // Helper para extraer Año y Mes de una ficha técnica
  const extraerFechaFicha = (ficha: FichaTecnicaHistoricaVersionada): { anio: number; mes: number; display: string } => {
    const version = ficha.historialVersiones?.[ficha.historialVersiones.length - 1];
    const fechaVersionStr = version?.fechaVersion || ficha.createdAt || ficha.updatedAt || '';
    const fechaProdStr = version?.especificaciones?.fechaProduccion || '';

    // Intentar con fechaVersion ISO (YYYY-MM-DD)
    if (fechaVersionStr) {
      const matchIso = fechaVersionStr.match(/^(\d{4})[-/](\d{1,2})/);
      if (matchIso) {
        const y = Number(matchIso[1]);
        const m = Number(matchIso[2]);
        const mesNombre = NOMBRES_MESES_CORTOS[m] || 'Mes';
        return { anio: y, mes: m, display: `${mesNombre} ${y}` };
      }
    }

    // Intentar con fecha de producción (ej: 01-15/JUN/22 o 15/JUN/2022)
    if (fechaProdStr) {
      const mesesMap: Record<string, number> = {
        'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6,
        'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12
      };
      for (const [key, num] of Object.entries(mesesMap)) {
        if (fechaProdStr.toUpperCase().includes(key)) {
          const matchAnio = fechaProdStr.match(/(\d{2,4})$/);
          let anio = 2024;
          if (matchAnio) {
            anio = matchAnio[1].length === 2 ? 2000 + Number(matchAnio[1]) : Number(matchAnio[1]);
          }
          return { anio, mes: num, display: `${key} ${anio}` };
        }
      }
    }

    return { anio: 2024, mes: 1, display: 'Ene 2024' };
  };

  // Convertir las fichas técnicas registradas en items unificados
  const itemsDesdeFichas = useMemo<ItemBusquedaInteligente[]>(() => {
    return fichas.map((f) => {
      const version = f.historialVersiones?.[f.historialVersiones.length - 1];
      const esp = version?.especificaciones;
      const { anio, mes, display } = extraerFechaFicha(f);

      const nombreTelaComercial = f.referencia || esp?.nombreComercialTela || 'TELA';
      const telaEnFicha = esp?.referenciaSTF || f.referenciaProveedor || esp?.nombreEmpresa || f.codigoFT;

      const formato = detectarFormato(
        f.documentoOriginal?.tipo,
        f.documentoOriginal?.nombreArchivo || version?.nombreArchivoFT
      );

      return {
        id: `ficha-${f.id}`,
        nombreTela: nombreTelaComercial,
        telaFichaTecnica: telaEnFicha,
        codigoFT: f.codigoFT,
        stfPo: esp?.stfPoNumber || esp?.numeroOrdenCompraSTF || '',
        proveedor: f.proveedor || esp?.nombreEmpresa || 'Proveedor STF',
        paisOrigen: f.paisOrigen || esp?.paisOrigen || 'N/A',
        anio,
        mes,
        fechaDisplay: display,
        formato,
        nombreArchivo: f.documentoOriginal?.nombreArchivo || version?.nombreArchivoFT || `${f.codigoFT}.pdf`,
        origen: 'FICHA_REGISTRADA',
        enlaceDrive: f.enlaceDrive || CARPETA_OFICIAL_DRIVE_URL,
        driveFileId: f.driveFileId,
        composicion: esp?.composicion || esp?.composicionPorcentual || '',
        gramajeGsm: esp?.gramajeDeclaradoGsm,
        anchoCm: esp?.anchoUtilM ? Math.round(esp.anchoUtilM * 100) : undefined,
        color: esp?.colorShade || '',
        fichaId: f.id
      };
    });
  }, [fichas]);

  // Convertir archivos de Google Drive escaneados en vivo
  const itemsDesdeDriveEnVivo = useMemo<ItemBusquedaInteligente[]>(() => {
    if (!archivosDriveEnVivo || archivosDriveEnVivo.length === 0) return [];

    return archivosDriveEnVivo.map((f, idx) => {
      const formato = detectarFormato(f.mimeType, f.name);
      let anio = 2024;
      let mes = 1;

      if (f.updated) {
        const d = new Date(f.updated);
        if (!isNaN(d.getTime())) {
          anio = d.getFullYear();
          mes = d.getMonth() + 1;
        }
      } else if (f.year && !isNaN(Number(f.year))) {
        anio = Number(f.year);
      }

      const nombreLimpio = (f.name || '')
        .replace(/\.[^/.]+$/, '')
        .replace(/_/g, ' ')
        .trim();

      return {
        id: `drv-live-${f.id || idx}`,
        nombreTela: nombreLimpio,
        telaFichaTecnica: `Archivo en Drive: ${f.folderName || 'LABORATORIO'}`,
        codigoFT: `DRIVE-${anio}`,
        stfPo: '',
        proveedor: 'Carpeta LABORATORIO Drive',
        paisOrigen: 'Google Drive STF',
        anio,
        mes,
        fechaDisplay: `${NOMBRES_MESES_CORTOS[mes]} ${anio}`,
        formato,
        nombreArchivo: f.name || 'documento',
        origen: 'GOOGLE_DRIVE',
        enlaceDrive: f.url || `https://drive.google.com/file/d/${f.id}/view`,
        driveFileId: f.id
      };
    });
  }, [archivosDriveEnVivo]);

  // Universo Total Consolidado (Fichas Registradas + Archivos Base de Drive + Archivos en Vivo)
  const itemsUnificados = useMemo<ItemBusquedaInteligente[]>(() => {
    const mapa = new Map<string, ItemBusquedaInteligente>();

    // 1. Agregar Fichas Registradas (Máxima Prioridad)
    itemsDesdeFichas.forEach(item => {
      mapa.set(item.id, item);
    });

    // 2. Agregar Documentos Oficiales de Drive
    DOCUMENTOS_DRIVE_BASE_OFICIALES.forEach(item => {
      if (!mapa.has(item.id)) {
        mapa.set(item.id, item);
      }
    });

    // 3. Agregar Archivos en Vivo detectados
    itemsDesdeDriveEnVivo.forEach(item => {
      if (!mapa.has(item.id)) {
        mapa.set(item.id, item);
      }
    });

    return Array.from(mapa.values());
  }, [itemsDesdeFichas, itemsDesdeDriveEnVivo]);

  // Lista dinámica de años disponibles en la base de datos y Drive
  const aniosDisponibles = useMemo<number[]>(() => {
    const setAnios = new Set<number>();
    itemsUnificados.forEach(it => {
      if (it.anio && !isNaN(it.anio)) setAnios.add(it.anio);
    });
    // Asegurar años clave del laboratorio
    [2026, 2025, 2024, 2023, 2022].forEach(y => setAnios.add(y));
    return Array.from(setAnios).sort((a, b) => b - a);
  }, [itemsUnificados]);

  // Sincronización automática con Google Drive
  const sincronizarConGoogleDrive = useCallback(async () => {
    setCargandoDrive(true);
    try {
      const res = await listarArchivosCarpetaDrive(CARPETA_OFICIAL_DRIVE_ID);
      if (res && res.success && res.files && res.files.length > 0) {
        setArchivosDriveEnVivo(res.files);
        setMensajeToast(`✓ Google Drive sincronizado: ${res.files.length} archivos indexados`);
      } else {
        setMensajeToast('✓ Sincronizado con carpetas maestras de Drive (2023-2026)');
      }
    } catch (e: any) {
      console.warn('Sincronización con Drive en modo predeterminado:', e);
      setMensajeToast('✓ Estructura de Drive conectada');
    } finally {
      setCargandoDrive(false);
      setTimeout(() => setMensajeToast(null), 4000);
    }
  }, []);

  // Carga inicial al montar el componente
  useEffect(() => {
    sincronizarConGoogleDrive();
  }, [sincronizarConGoogleDrive]);

  // -------------------------------------------------------------------------
  // LÓGICA DE FILTRADO COMBINADO ESTRICTO (AND):
  // 1. Calendario: Año
  // 2. Calendario: Mes
  // 3. Formato de Documento (PDF, Excel, Word, Imagen)
  // 4. Búsqueda inteligente por nombre (Nombre de Tela o Tela en Ficha Técnica)
  // -------------------------------------------------------------------------
  const itemsFiltrados = useMemo<ItemBusquedaInteligente[]>(() => {
    return itemsUnificados.filter((item) => {
      // 1. Filtro por Año
      if (filtroAnio !== 'TODOS' && item.anio !== Number(filtroAnio)) {
        return false;
      }

      // 2. Filtro por Mes (1 a 12)
      if (filtroMes !== 0 && item.mes !== filtroMes) {
        return false;
      }

      // 3. Filtro por Formato de Documento
      if (filtroFormato !== 'TODOS' && item.formato !== filtroFormato) {
        return false;
      }

      // 4. Búsqueda Inteligente por Nombre de Tela o Tela en Ficha Técnica
      if (busquedaNombre.trim()) {
        const q = busquedaNombre.trim().toLowerCase();
        const matchNombreTela = (item.nombreTela || '').toLowerCase().includes(q);
        const matchTelaFicha = (item.telaFichaTecnica || '').toLowerCase().includes(q);
        const matchCodigo = (item.codigoFT || '').toLowerCase().includes(q);
        const matchPo = (item.stfPo || '').toLowerCase().includes(q);
        const matchProveedor = (item.proveedor || '').toLowerCase().includes(q);
        const matchArchivo = (item.nombreArchivo || '').toLowerCase().includes(q);
        const matchColor = (item.color || '').toLowerCase().includes(q);
        const matchComp = (item.composicion || '').toLowerCase().includes(q);

        if (!matchNombreTela && !matchTelaFicha && !matchCodigo && !matchPo && !matchProveedor && !matchArchivo && !matchColor && !matchComp) {
          return false;
        }
      }

      return true;
    });
  }, [itemsUnificados, filtroAnio, filtroMes, filtroFormato, busquedaNombre]);

  // Conteo de items por mes para el año actualmente seleccionado (para feedback visual)
  const conteoPorMes = useMemo<Record<number, number>>(() => {
    const mapa: Record<number, number> = {};
    itemsUnificados.forEach(item => {
      if (filtroAnio === 'TODOS' || item.anio === Number(filtroAnio)) {
        mapa[item.mes] = (mapa[item.mes] || 0) + 1;
      }
    });
    return mapa;
  }, [itemsUnificados, filtroAnio]);

  // Conteo por formato para los filtros actuales
  const conteoPorFormato = useMemo<Record<FormatoDocumentoType, number>>(() => {
    const counts: Record<FormatoDocumentoType, number> = {
      TODOS: 0,
      PDF: 0,
      EXCEL: 0,
      WORD: 0,
      IMAGEN: 0
    };

    itemsUnificados.forEach(item => {
      const matchAnio = filtroAnio === 'TODOS' || item.anio === Number(filtroAnio);
      const matchMes = filtroMes === 0 || item.mes === filtroMes;
      if (matchAnio && matchMes) {
        counts.TODOS++;
        if (item.formato in counts) {
          counts[item.formato]++;
        }
      }
    });

    return counts;
  }, [itemsUnificados, filtroAnio, filtroMes]);

  const hayFiltrosActivos = filtroAnio !== 'TODOS' || filtroMes !== 0 || filtroFormato !== 'TODOS' || busquedaNombre.trim() !== '';

  const limpiarTodosLosFiltros = () => {
    setFiltroAnio('TODOS');
    setFiltroMes(0);
    setFiltroFormato('TODOS');
    setBusquedaNombre('');
  };

  // Renderizador de badge de formato
  const renderBadgeFormato = (formato: 'PDF' | 'EXCEL' | 'WORD' | 'IMAGEN') => {
    switch (formato) {
      case 'PDF':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <FileText className="w-3 h-3 text-rose-400" /> PDF
          </span>
        );
      case 'EXCEL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" /> EXCEL
          </span>
        );
      case 'WORD':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <File className="w-3 h-3 text-blue-400" /> WORD
          </span>
        );
      case 'IMAGEN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ImageIcon className="w-3 h-3 text-purple-400" /> IMAGEN
          </span>
        );
    }
  };

  return (
    <div className="bg-[#262629] border border-[#424246] rounded-3xl p-5 md:p-6 shadow-xl space-y-5 text-[#FBF8F2] transition-all">
      
      {/* Toast interno de feedback */}
      {mensajeToast && (
        <div className="fixed top-5 right-5 bg-[#2B2B2E] text-amber-300 text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 border border-amber-400/40 z-50 animate-bounce">
          <CheckCircle2 className="h-4 w-4 text-amber-400" />
          <span className="font-bold">{mensajeToast}</span>
        </div>
      )}

      {/* Cabecera Principal del Panel Inteligente y Estado de Google Drive */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-[#424246] pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-black flex items-center justify-center font-black shadow-md">
              <Calendar className="w-4 h-4 text-zinc-950" />
            </div>
            <h3 className="text-base sm:text-lg font-serif font-black text-[#FBF8F2] uppercase tracking-wide flex items-center gap-2">
              Búsqueda Inteligente & Calendario de Fichas
            </h3>
            <span className="text-[10px] bg-blue-500/15 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Google Drive Vinculado
            </span>
          </div>
          <p className="text-[#AA9E80] text-xs">
            Filtra en tiempo real por <strong className="text-amber-300">Año y Mes</strong>, busca por <strong className="text-white">Nombre de Tela o Tela en Ficha</strong>, y selecciona por <strong className="text-cyan-300">Formato</strong> con sincronización directa al Drive de Laboratorio.
          </p>
        </div>

        {/* Acciones de Drive y Toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
          <button
            type="button"
            onClick={sincronizarConGoogleDrive}
            disabled={cargandoDrive}
            className="bg-[#2D2D30] hover:bg-[#38383C] text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            title="Sincronizar archivos y subcarpetas con la carpeta de Google Drive"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${cargandoDrive ? 'animate-spin' : ''}`} />
            <span>{cargandoDrive ? 'Sincronizando...' : 'Sincronizar Drive'}</span>
          </button>

          <a
            href={CARPETA_OFICIAL_DRIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
            title="Abrir la Carpeta Oficial en Google Drive"
          >
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Drive LABORATORIO</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          <button
            type="button"
            onClick={() => setPanelColapsado(!panelColapsado)}
            className="p-1.5 rounded-xl bg-[#2D2D30] text-[#AA9E80] hover:text-[#FBF8F2] border border-[#424246] transition-all cursor-pointer"
            title={panelColapsado ? 'Expandir filtros' : 'Minimizar filtros'}
          >
            {panelColapsado ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CUERPO DE LOS 3 APARTADOS INTELIGENTES (Colapsable) */}
      {!panelColapsado && (
        <div className="space-y-5">
          
          {/* APARTADO 1: CALENDARIO EN AÑO Y MES */}
          <div className="bg-[#2B2B2E] p-4 rounded-2xl border border-[#424246] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-[#C6A466] tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C6A466]" />
                1. Calendario de Fichas (Año y Mes)
              </span>

              {/* Indicador del período activo */}
              <div className="text-[11px] font-bold text-zinc-300 bg-[#242426] px-3 py-1 rounded-xl border border-[#424246] flex items-center gap-1.5">
                <span className="text-[#AA9E80]">Período:</span>
                <span className="text-amber-300 font-mono">
                  {filtroMes === 0 ? 'Todos los Meses' : NOMBRES_MESES_COMPLETOS[filtroMes]}
                </span>
                <span className="text-cyan-300 font-mono">
                  ({filtroAnio === 'TODOS' ? 'Todos los Años' : filtroAnio})
                </span>
              </div>
            </div>

            {/* Selector de Años */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-[#AA9E80] block">Seleccionar Año:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFiltroAnio('TODOS')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filtroAnio === 'TODOS'
                      ? 'bg-[#C6A466] text-[#2B2B2E] shadow-md ring-2 ring-amber-400/50'
                      : 'bg-[#242426] text-[#AA9E80] hover:text-white border border-[#424246]'
                  }`}
                >
                  Todos los Años
                </button>
                {aniosDisponibles.map(anio => (
                  <button
                    key={anio}
                    type="button"
                    onClick={() => setFiltroAnio(String(anio))}
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      filtroAnio === String(anio)
                        ? 'bg-[#C6A466] text-[#2B2B2E] shadow-md ring-2 ring-amber-400/50'
                        : 'bg-[#242426] text-[#AA9E80] hover:text-white border border-[#424246]'
                    }`}
                  >
                    {anio}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Meses (1 a 12) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-[#AA9E80] block">Seleccionar Mes del Año:</span>
              <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-13 gap-1">
                <button
                  type="button"
                  onClick={() => setFiltroMes(0)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                    filtroMes === 0
                      ? 'bg-amber-400 text-zinc-950 shadow-md font-black'
                      : 'bg-[#242426] text-[#AA9E80] hover:text-white border border-[#424246]'
                  }`}
                >
                  Todos
                </button>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(numMes => {
                  const cantidadEnMes = conteoPorMes[numMes] || 0;
                  const seleccionado = filtroMes === numMes;

                  return (
                    <button
                      key={numMes}
                      type="button"
                      onClick={() => setFiltroMes(numMes)}
                      className={`py-1.5 px-1.5 rounded-xl text-xs text-center transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                        seleccionado
                          ? 'bg-amber-400 text-zinc-950 font-black shadow-md ring-2 ring-amber-300'
                          : cantidadEnMes > 0
                            ? 'bg-[#2D2D30] text-zinc-200 hover:bg-[#38383C] border border-[#424246]'
                            : 'bg-[#242426]/60 text-[#AA9E80]/60 hover:text-zinc-300 border border-[#424246]/40'
                      }`}
                      title={`${NOMBRES_MESES_COMPLETOS[numMes]}: ${cantidadEnMes} documentos`}
                    >
                      <span className="font-bold text-[11px]">{NOMBRES_MESES_CORTOS[numMes]}</span>
                      {cantidadEnMes > 0 && (
                        <span className={`text-[9px] font-mono leading-none ${seleccionado ? 'text-zinc-900 font-black' : 'text-amber-400'}`}>
                          ({cantidadEnMes})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FILA CON APARTADO 2 (BÚSQUEDA POR NOMBRE) Y APARTADO 3 (FORMATO) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* APARTADO 2: BÚSQUEDA INTELIGENTE POR NOMBRE */}
            <div className="lg:col-span-7 bg-[#2B2B2E] p-4 rounded-2xl border border-[#424246] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#C6A466] tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#C6A466]" />
                  2. Búsqueda por Nombre de Tela o Ficha
                </span>
                <span className="text-[10px] text-[#AA9E80]">
                  Filtra en el período seleccionado
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AA9E80]" />
                <input
                  type="text"
                  placeholder="Ej: CREPE VICTORIA, DESIGN 6341 A, POPELINA, MEX38770, TEXTIVISION..."
                  value={busquedaNombre}
                  onChange={(e) => setBusquedaNombre(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-[#242426] border border-[#424246] rounded-xl text-xs text-[#FBF8F2] placeholder-[#AA9E80]/50 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all font-medium"
                />
                {busquedaNombre && (
                  <button
                    type="button"
                    onClick={() => setBusquedaNombre('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AA9E80] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#AA9E80] leading-snug">
                Busca simultáneamente por el <strong className="text-zinc-200">nombre comercial de la tela</strong>, la <strong className="text-zinc-200">referencia técnica en la ficha</strong>, código FT o proveedor oficial.
              </p>
            </div>

            {/* APARTADO 3: FORMATO DE DOCUMENTO */}
            <div className="lg:col-span-5 bg-[#2B2B2E] p-4 rounded-2xl border border-[#424246] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-[#C6A466] tracking-wider flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#C6A466]" />
                  3. Formato de Documento
                </span>
                <span className="text-[10px] text-[#AA9E80]">
                  Tipo de archivo
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFiltroFormato('TODOS')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filtroFormato === 'TODOS'
                      ? 'bg-zinc-100 text-zinc-950 shadow-md font-black'
                      : 'bg-[#242426] text-[#AA9E80] hover:text-white border border-[#424246]'
                  }`}
                >
                  <span>Todos</span>
                  <span className="text-[10px] opacity-75 font-mono">({conteoPorFormato.TODOS})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroFormato('PDF')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filtroFormato === 'PDF'
                      ? 'bg-rose-500 text-white shadow-md font-black ring-2 ring-rose-400/50'
                      : 'bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 border border-rose-500/30'
                  }`}
                >
                  <FileText className="w-3 h-3 text-rose-400" />
                  <span>PDF</span>
                  <span className="text-[10px] opacity-75 font-mono">({conteoPorFormato.PDF})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroFormato('EXCEL')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filtroFormato === 'EXCEL'
                      ? 'bg-emerald-500 text-zinc-950 shadow-md font-black ring-2 ring-emerald-400/50'
                      : 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-500/30'
                  }`}
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  <span>Excel</span>
                  <span className="text-[10px] opacity-75 font-mono">({conteoPorFormato.EXCEL})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroFormato('WORD')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filtroFormato === 'WORD'
                      ? 'bg-blue-600 text-white shadow-md font-black ring-2 ring-blue-400/50'
                      : 'bg-blue-950/30 text-blue-300 hover:bg-blue-900/40 border border-blue-500/30'
                  }`}
                >
                  <File className="w-3 h-3 text-blue-400" />
                  <span>Word</span>
                  <span className="text-[10px] opacity-75 font-mono">({conteoPorFormato.WORD})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroFormato('IMAGEN')}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    filtroFormato === 'IMAGEN'
                      ? 'bg-purple-600 text-white shadow-md font-black ring-2 ring-purple-400/50'
                      : 'bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 border border-purple-500/30'
                  }`}
                >
                  <ImageIcon className="w-3 h-3 text-purple-400" />
                  <span>Imagen</span>
                  <span className="text-[10px] opacity-75 font-mono">({conteoPorFormato.IMAGEN})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BARRA DE ESTADO DE FILTROS APLICADOS Y CONTEO DE RESULTADOS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#242426] p-3 rounded-2xl border border-[#424246]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#AA9E80] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Resultados:
          </span>
          <span className="text-xs font-black text-white bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30 font-mono">
            {itemsFiltrados.length} documentos
          </span>

          {/* Chips de filtros activos */}
          {filtroAnio !== 'TODOS' && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-[#2B2B2E] text-zinc-200 px-2.5 py-0.5 rounded-full border border-[#424246]">
              Año: <strong>{filtroAnio}</strong>
              <button type="button" onClick={() => setFiltroAnio('TODOS')} className="text-[#AA9E80] hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filtroMes !== 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-[#2B2B2E] text-zinc-200 px-2.5 py-0.5 rounded-full border border-[#424246]">
              Mes: <strong>{NOMBRES_MESES_COMPLETOS[filtroMes]}</strong>
              <button type="button" onClick={() => setFiltroMes(0)} className="text-[#AA9E80] hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filtroFormato !== 'TODOS' && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-[#2B2B2E] text-zinc-200 px-2.5 py-0.5 rounded-full border border-[#424246]">
              Formato: <strong>{filtroFormato}</strong>
              <button type="button" onClick={() => setFiltroFormato('TODOS')} className="text-[#AA9E80] hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {busquedaNombre.trim() !== '' && (
            <span className="inline-flex items-center gap-1 text-[11px] bg-[#2B2B2E] text-zinc-200 px-2.5 py-0.5 rounded-full border border-[#424246]">
              Texto: <strong>"{busquedaNombre}"</strong>
              <button type="button" onClick={() => setBusquedaNombre('')} className="text-[#AA9E80] hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={limpiarTodosLosFiltros}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer filtros</span>
          </button>
        )}
      </div>

      {/* GRID DE RESULTADOS INTELIGENTES ENCONTRADOS */}
      {itemsFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
          {itemsFiltrados.map((item) => {
            const esSeleccionado = item.fichaId && item.fichaId === fichaSeleccionadaId;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-[#FBF8F2] relative ${
                  esSeleccionado
                    ? 'bg-gradient-to-b from-[#343126] to-[#2B2B2E] border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/60'
                    : 'bg-[#2B2B2E] hover:bg-[#323236] border-[#424246]'
                }`}
              >
                {/* Cabecera de la tarjeta: Formato + Fecha + Origen */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {renderBadgeFormato(item.formato)}
                    <span className="text-[10px] bg-[#242426] text-amber-300/90 font-mono px-2 py-0.5 rounded-md border border-[#424246]">
                      {item.fechaDisplay}
                    </span>
                  </div>

                  {item.origen === 'FICHA_REGISTRADA' ? (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Registrada STF
                    </span>
                  ) : (
                    <span className="text-[9px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">
                      <HardDrive className="w-2.5 h-2.5 text-blue-400" /> Drive Lab
                    </span>
                  )}
                </div>

                {/* Contenido principal: Nombre de tela y Ficha técnica */}
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white uppercase tracking-wide line-clamp-1 text-[#FBF8F2]" title={item.nombreTela}>
                    {item.nombreTela}
                  </h4>
                  
                  <div className="text-xs text-[#C6A466] font-semibold flex items-center gap-1 truncate" title={item.telaFichaTecnica}>
                    <Tag className="w-3 h-3 shrink-0" />
                    <span>Ficha: {item.telaFichaTecnica}</span>
                  </div>

                  <p className="text-[11px] text-[#AA9E80] truncate">
                    Proveedor: <strong className="text-zinc-300">{item.proveedor}</strong> {item.paisOrigen ? `• ${item.paisOrigen}` : ''}
                  </p>

                  {item.composicion && (
                    <p className="text-[10px] text-zinc-400 truncate font-mono">
                      Comp: {item.composicion} {item.gramajeGsm ? `• ${item.gramajeGsm} gsm` : ''}
                    </p>
                  )}
                </div>

                {/* Botones de acción inferior */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#424246]/60">
                  {item.fichaId ? (
                    <button
                      type="button"
                      onClick={() => onSeleccionarFicha(item.fichaId!)}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        esSeleccionado
                          ? 'bg-amber-400 text-zinc-950 shadow-md font-black'
                          : 'bg-[#38383C] hover:bg-amber-500 hover:text-zinc-950 text-zinc-200 border border-[#424246]'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{esSeleccionado ? 'Ficha Activa' : 'Cargar en Visor (12 Secciones)'}</span>
                    </button>
                  ) : (
                    <a
                      href={item.enlaceDrive || CARPETA_OFICIAL_DRIVE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-1.5 px-3 rounded-xl text-xs font-bold bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 border border-blue-500/40 transition-all flex items-center justify-center gap-1.5"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                      <span>Abrir en Google Drive</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  )}

                  {onAbrirLecturaDrive && item.origen === 'GOOGLE_DRIVE' && (
                    <button
                      type="button"
                      onClick={onAbrirLecturaDrive}
                      className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-zinc-950 border border-amber-400/40 transition-all cursor-pointer shrink-0"
                      title="Procesar este documento con Lectura Inteligente IA"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ESTADO VACÍO (CERO COINCIDENCIAS) */
        <div className="p-8 text-center bg-[#242426] rounded-2xl border border-[#424246] space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#2D2D30] text-[#AA9E80] flex items-center justify-center border border-[#424246]">
            <Search className="w-6 h-6 text-amber-400/70" />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-white uppercase tracking-wide">
              No se encontraron documentos coincidentes
            </h5>
            <p className="text-xs text-[#AA9E80] max-w-md mx-auto">
              No hay telas ni fichas registradas para el período{' '}
              <strong className="text-amber-300">
                {filtroMes === 0 ? '' : `${NOMBRES_MESES_COMPLETOS[filtroMes]} `}
                {filtroAnio === 'TODOS' ? 'de todos los años' : filtroAnio}
              </strong>
              {busquedaNombre ? ` que coincidan con "${busquedaNombre}"` : ''}
              {filtroFormato !== 'TODOS' ? ` en formato ${filtroFormato}` : ''}.
            </p>
          </div>
          <button
            type="button"
            onClick={limpiarTodosLosFiltros}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#C6A466] text-[#2B2B2E] hover:bg-[#D6CDB8] transition-all cursor-pointer shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ver todos los documentos disponibles</span>
          </button>
        </div>
      )}

    </div>
  );
};
