import React, { useState, useEffect, useRef } from 'react';
import { useQuality } from '../../context/QualityContext';
import { FichaTecnicaHistoricaVersionada, VersionFichaTecnica } from '../../types';
import { 
  BookOpen, 
  FileText, 
  Search, 
  Save, 
  Download, 
  FileSpreadsheet,
  CheckCircle,
  Eye,
  ChevronDown,
  Printer,
  Trash2,
  RefreshCw,
  Sparkles,
  HardDrive,
  ExternalLink,
  Layers,
  Upload,
  ShieldCheck,
  ShoppingCart,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { ExploradorFichasModal } from '../fichas-tecnicas/ExploradorFichasModal';
import { FichaTecnicaFormatoCompletoModal } from '../fichas-tecnicas/FichaTecnicaFormatoCompletoModal';
import { ModalLecturaInteligenteDrive } from '../fichas-tecnicas/ModalLecturaInteligenteDrive';
import { exportarFichaAWord, exportarFichaAPDF } from '../../utils/fichaTecnicaFormatters';
import { 
  STFGroupDocumentSheet, 
  STFGroupDocumentData, 
  mapVersionToSTFGroupDocumentData, 
  mapSTFGroupDocumentDataToVersion 
} from '../fichas-tecnicas/STFGroupDocumentSheet';
import { CARPETA_OFICIAL_DRIVE_URL, CARPETA_OFICIAL_DRIVE_ID } from '../../utils/textileSmartParser';

export const BibliotecaView: React.FC = () => {
  const { fichasTecnicasHistorial, guardarFichaTecnicaProveedor, limpiarBaseDatosFichas } = useQuality();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFichaId, setSelectedFichaId] = useState<string>('');
  const [showToast, setShowToast] = useState<string | null>(null);
  const [tabActiva, setTabActiva] = useState<'documento' | 'drive' | 'integracion'>('documento');

  const [isModalExploradorOpen, setIsModalExploradorOpen] = useState<boolean>(false);
  const [isModalFormatoCompletoOpen, setIsModalFormatoCompletoOpen] = useState<boolean>(false);
  const [isModalLecturaDriveOpen, setIsModalLecturaDriveOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const handleLimpiarBaseDatos = async () => {
    const confirmar = window.confirm(
      '¿Confirmas que deseas limpiar la base de datos de la Biblioteca Técnica?\n\n' +
      'Esta acción restablecerá la base de datos con la Ficha Técnica Oficial auténtica de STF GROUP (CREPE VICTORIA / TEXTIVISION).'
    );
    if (!confirmar) return;

    await limpiarBaseDatosFichas();
    setSelectedFichaId('ft-hist-001');
    triggerToast('Base de datos de Fichas Técnicas limpiada con éxito.');
  };

  // Cerrar menú de exportación al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado de Fichas Técnicas
  const filteredFichas = (fichasTecnicasHistorial || []).filter(f => 
    (f.referencia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.codigoFT || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.referenciaProveedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.proveedor || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentFicha = filteredFichas.find(f => f.id === selectedFichaId) || filteredFichas[0] || null;
  const currentVersion: VersionFichaTecnica | undefined = currentFicha?.historialVersiones?.[currentFicha.historialVersiones.length - 1];

  // Estado del documento oficial editable
  const [docData, setDocData] = useState<STFGroupDocumentData | null>(null);

  // Cargar datos oficiales exactos cuando cambie la ficha
  useEffect(() => {
    if (currentFicha && currentVersion) {
      setDocData(mapVersionToSTFGroupDocumentData(currentFicha, currentVersion));
    }
  }, [currentFicha?.id, currentVersion?.version]);

  const handleDocumentChange = (updated: Partial<STFGroupDocumentData>) => {
    setDocData(prev => prev ? { ...prev, ...updated } : null);
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 3500);
  };

  const handleSaveAll = () => {
    if (!currentFicha || !currentVersion || !docData) return;

    const versionActualizada = mapSTFGroupDocumentDataToVersion(currentVersion, docData);
    
    // Actualizar también metadatos de primer nivel de la ficha
    const fichaActualizada: FichaTecnicaHistoricaVersionada = {
      ...currentFicha,
      referencia: docData.refProv || currentFicha.referencia,
      referenciaProveedor: docData.refProv || currentFicha.referenciaProveedor,
      proveedor: docData.proveedorNombre || currentFicha.proveedor,
      paisOrigen: docData.paisOrigen || currentFicha.paisOrigen,
      updatedAt: new Date().toISOString()
    };

    guardarFichaTecnicaProveedor(fichaActualizada, versionActualizada);
    triggerToast('Especificaciones oficiales de STF GROUP guardadas con éxito en Base FT.');
  };

  const handleExportCSV = () => {
    if (!currentFicha || !docData) return;
    const csvContent = 
      `\"PARAMETRO TECNICO\",\"VALOR DECLARADO / RESULTADO\",\"METODO / NORMA\",\"TOLERANCIA\"\n` +
      `\"Referencia Tela / STF Reference\",\"${docData.stfRef}\",\"--\",\"--\"\n` +
      `\"Referencia Proveedor\",\"${docData.refProv}\",\"--\",\"--\"\n` +
      `\"Proveedor / Fabricante\",\"${docData.proveedorNombre}\",\"--\",\"--\"\n` +
      `\"Fecha Bulk / Producción\",\"${docData.fechaBulk}\",\"--\",\"--\"\n` +
      `\"STF P.O #\",\"${docData.stfPo}\",\"--\",\"--\"\n` +
      `\"País Origen\",\"${docData.paisOrigen}\",\"--\",\"--\"\n` +
      `\"Lotes\",\"${docData.lotes}\",\"--\",\"--\"\n` +
      `\"Subpartida Arancelaria\",\"${docData.subpartida || 'N/A'}\",\"--\",\"--\"\n` +
      `\"Certificado Origen Col/Mex\",\"${docData.aplicaCertOrigen ? 'SI' : 'NO'}\",\"--\",\"--\"\n` +
      `\"Composición 1\",\"${docData.comp1Nombre} ${docData.comp1Pct}% (Continuo: ${docData.comp1Continuo ? 'SI' : 'NO'})\",\"--\",\"--\"\n` +
      `\"Composición 2\",\"${docData.comp2Nombre ? `${docData.comp2Nombre} ${docData.comp2Pct}% (Continuo: ${docData.comp2Continuo ? 'SI' : 'NO'})` : 'N/A'}\",\"--\",\"--\"\n` +
      `\"Ancho Total\",\"${docData.anchoCms} cm\",\"--\",\"--\"\n` +
      `\"Ancho Cortable\",\"${docData.anchoCortableCms} cm\",\"--\",\"--\"\n` +
      `\"Peso / Gramaje\",\"${docData.pesoGsm} GSM\",\"--\",\"--\"\n` +
      `\"Solo Denim\",\"${docData.denimOz}\",\"--\",\"--\"\n` +
      `\"Acabados - Impregnado\",\"${docData.impregnadoPct} - ${docData.impregnadoDesc}\",\"--\",\"--\"\n` +
      `\"Títulos de Hilo Trama\",\"${docData.titulosTrama}\",\"--\",\"${docData.titulosTol}\"\n` +
      `\"Resistencia al Rasgado\",\"${docData.rasgadoTrama}\",\"${docData.rasgadoNorma}\",\"${docData.rasgadoTol}\"\n` +
      `\"Cambio Dimensional al Lavado\",\"${docData.cambioDimTrama}\",\"${docData.cambioDimNorma}\",\"${docData.cambioDimTol}\"\n` +
      `\"Pierna Virada (Viro)\",\"${docData.piernaViradaRes}\",\"${docData.piernaViradaNorma}\",\"${docData.piernaViradaTol}\"\n` +
      `\"Solidez Lavado Doméstico\",\"${docData.solLavadoRes}\",\"${docData.solLavadoNorma}\",\"${docData.solLavadoTol}\"\n` +
      `\"Solidez al Frote\",\"${docData.solFroteRes}\",\"${docData.solFroteNorma}\",\"${docData.solFroteTol}\"\n` +
      `\"Rendimiento M/KG\",\"${docData.rendimientoRes}\",\"Metros x Kilo\",\"${docData.rendimientoTol}\"\n` +
      `\"Elongación\",\"${docData.elongacionTrama}\",\"--\",\"${docData.elongacionTol}\"\n` +
      `\"% Recuperación\",\"${docData.recuperacionTrama}\",\"--\",\"${docData.recuperacionTol}\"\n` +
      `\"Desviación de Trama\",\"${docData.desviacionRes}\",\"${docData.desviacionNorma}\",\"${docData.desviacionTol}\"\n` +
      `\"Tipo de Tejido\",\"${docData.esTejidoPunto ? 'Tejido Punto (Knitted)' : 'Tejido Plano (Woven)'}\",\"--\",\"--\"\n` +
      `\"Tipo de Ligamento\",\"${docData.tipoLigamento}\",\"--\",\"--\"\n` +
      `\"Acabado Color\",\"${docData.acabadoColor} - ${docData.color}\",\"--\",\"--\"\n` +
      `\"Tipo Fibra\",\"${docData.tipoFibra}\",\"--\",\"--\"\n` +
      `\"Instrucciones Lavado\",\"${docData.lavadoInstrucciones}\",\"--\",\"--\"\n` +
      `\"Recomendaciones Planchado\",\"${docData.planchadoInstrucciones}\",\"--\",\"--\"\n` +
      `\"Observaciones Extra\",\"${docData.observacionesExtra || ''}\",\"--\",\"--\"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Matriz_STF_${docData.stfPo || 'FT'}_${(docData.refProv || 'TELA').replace(/\s+/g, '_')}.csv`;
    link.click();
    triggerToast('Matriz técnica exportada en CSV exitosamente.');
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed bottom-5 right-5 bg-[#2B2B2E] text-[#FBF8F2] text-xs px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 border border-[#94A786] z-50 animate-bounce">
          <CheckCircle className="h-4.5 w-4.5 text-[#485C3E]" />
          <span className="font-semibold">{showToast}</span>
        </div>
      )}

      {/* Header Panel Principal */}
      <div className="bg-[#2D2D30] p-6 rounded-3xl border border-[#424246] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-[#FBF8F2]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-bold text-[#FBF8F2] tracking-wide uppercase flex items-center">
              <BookOpen className="h-5.5 w-5.5 text-[#C6A466] mr-2" />
              Biblioteca Técnica de Fichas del Fabricante
            </h2>
          </div>
          <p className="text-[#AA9E80] text-xs">
            Especificaciones técnicas de tela (tejido plano / punto) con parámetros oficiales del fabricante sin datos inventados.
          </p>
        </div>

        {/* Buscador */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AA9E80]" />
            <input
              type="text"
              placeholder="Buscar referencia o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#2B2B2E] border border-[#424246] rounded-xl text-xs text-[#FBF8F2] placeholder-[#AA9E80]/50 focus:outline-none focus:border-[#C6A466] w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Selector rápido de Fichas Técnicas en Base de Datos */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[11px] font-bold text-[#AA9E80] uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-[#C6A466]" /> Fichas Registradas ({filteredFichas.length}):
        </span>
        {filteredFichas.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setSelectedFichaId(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              (currentFicha?.id === f.id)
                ? 'bg-[#C6A466] text-[#2B2B2E] shadow-md ring-2 ring-amber-400/50'
                : 'bg-[#2D2D30] text-[#AA9E80] hover:text-[#FBF8F2] hover:bg-[#38383C] border border-[#424246]'
            }`}
          >
            <span>{f.referencia}</span>
            <span className="text-[10px] opacity-75 font-mono">({f.codigoFT})</span>
          </button>
        ))}

      </div>

      {currentFicha && currentVersion && docData ? (
        <>
          {/* Banner de Identificación y Acciones de la Ficha Activa */}
          <div className="bg-[#2D2D30] border border-[#424246] text-[#FBF8F2] rounded-3xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#C6A466] bg-[#C6A466]/20 px-2 py-0.5 rounded-full border border-[#C6A466]/30">
                  {currentFicha.codigoFT}
                </span>
                <span className="text-[10px] bg-[#2B2B2E] text-[#AA9E80] font-bold px-2 py-0.5 rounded-full border border-[#424246]">
                  Versión v{currentFicha.versionActual}
                </span>
                <span className="text-[10px] bg-[#485C3E]/20 text-[#485C3E] font-bold px-2 py-0.5 rounded-full border border-[#485C3E]/30">
                  P.O: {docData.stfPo || 'N/A'}
                </span>
                <span className="text-[10px] bg-blue-500/15 text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-blue-400" />
                  Carpeta LABORATORIO
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 mt-2">
                <h3 className="text-xl font-serif font-black text-[#FBF8F2] uppercase tracking-wide">
                  {docData.refProv || currentFicha.referencia} • {docData.stfRef}
                </h3>
                
                {/* Botón Ver Formato Completo (Modal) */}
                <button
                  type="button"
                  onClick={() => setIsModalFormatoCompletoOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                  title="Ver formato oficial en ventana modal ampliada"
                >
                  <Eye className="h-3.5 w-3.5 text-zinc-950" />
                  <span>Ver Formato Completo</span>
                </button>


              </div>

              <p className="text-xs text-[#AA9E80] mt-1">
                Proveedor: <strong className="text-[#C6A466]">{docData.proveedorNombre}</strong> • Origen: <strong className="text-[#FBF8F2]">{docData.paisOrigen}</strong>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Botón Guardar Cambios */}
              <button
                type="button"
                onClick={handleSaveAll}
                className="bg-[#C6A466] hover:bg-[#D6CDB8] text-[#2B2B2E] font-extrabold text-xs uppercase tracking-wide py-2.5 px-4 rounded-xl flex items-center space-x-2 shadow-md transition-all active:scale-95 cursor-pointer"
                title="Guardar todos los cambios del documento en la Base de Datos Histórica"
              >
                <Save className="h-4 w-4" />
                <span>Guardar Cambios en Base FT</span>
              </button>

              {/* Menú de Exportación Unificado */}
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-700 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center space-x-2 shadow-md hover:shadow-cyan-500/20 transition-all cursor-pointer border border-cyan-400/30"
                  title="Exportar documento oficial a Word, PDF o CSV"
                >
                  <Download className="h-4 w-4 text-cyan-300" />
                  <span>Exportar Formato</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-white/80 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1f2430]/95 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl p-1.5 z-50 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        const vActual = mapSTFGroupDocumentDataToVersion(currentVersion, docData);
                        exportarFichaAWord(currentFicha, vActual);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-200 hover:text-white hover:bg-blue-600/30 transition-all cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left leading-tight">
                        <span className="block font-bold">Exportar Word</span>
                        <span className="text-[10px] text-blue-300/70">Documento .doc editable</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        const vActual = mapSTFGroupDocumentDataToVersion(currentVersion, docData);
                        exportarFichaAPDF(currentFicha, vActual);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-200 hover:text-white hover:bg-rose-600/30 transition-all cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                        <Printer className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left leading-tight">
                        <span className="block font-bold">Exportar PDF</span>
                        <span className="text-[10px] text-rose-300/70">Impresión oficial vectorizada</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportCSV();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-200 hover:text-white hover:bg-emerald-600/30 transition-all cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left leading-tight">
                        <span className="block font-bold">Exportar CSV</span>
                        <span className="text-[10px] text-emerald-300/70">Hoja de cálculo Excel / Matriz</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tarjetas de Resumen de Especificaciones Clave */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#2D2D30] border border-[#424246] rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#AA9E80] block">Composición</span>
              <span className="text-xs font-black text-white block truncate" title={`${docData.comp1Pct}% ${docData.comp1Nombre}`}>
                {docData.comp1Nombre ? `${docData.comp1Pct}% ${docData.comp1Nombre}` : '100% POLIESTER'}
              </span>
            </div>

            <div className="bg-[#2D2D30] border border-[#424246] rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#AA9E80] block">Gramaje</span>
              <span className="text-xs font-black text-amber-300 font-mono block">
                {docData.pesoGsm || '0'} g/m²
              </span>
            </div>

            <div className="bg-[#2D2D30] border border-[#424246] rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#AA9E80] block">Ancho Cortable</span>
              <span className="text-xs font-black text-emerald-300 font-mono block">
                {docData.anchoCortableCms || docData.anchoCms || '0'} cm
              </span>
            </div>

            <div className="bg-[#2D2D30] border border-[#424246] rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#AA9E80] block">Color / Tono</span>
              <span className="text-xs font-black text-white block truncate">
                {docData.color || '000 ESTÁNDAR'}
              </span>
            </div>

            <div className="bg-[#2D2D30] border border-[#424246] rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#AA9E80] block">P.O. Number</span>
              <span className="text-xs font-black text-[#C6A466] font-mono block">
                {docData.stfPo || 'N/A'}
              </span>
            </div>

            <div className="bg-[#2D2D30] border border-[#424246] rounded-2xl p-3.5 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#AA9E80] block">Google Drive</span>
              <span className="text-xs font-black text-cyan-300 block truncate flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Carpeta Vinculada</span>
              </span>
            </div>
          </div>

          {/* Barra de Pestañas de la Biblioteca */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#424246] pb-2">
            <button
              type="button"
              onClick={() => setTabActiva('documento')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                tabActiva === 'documento'
                  ? 'bg-[#C6A466] text-[#2B2B2E] shadow-md'
                  : 'bg-[#2D2D30] text-[#AA9E80] hover:text-[#FBF8F2] border border-[#424246]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Formato Oficial STF GROUP (12 Secciones)</span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('drive')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                tabActiva === 'drive'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-[#2D2D30] text-[#AA9E80] hover:text-[#FBF8F2] border border-[#424246]'
              }`}
            >
              <HardDrive className="w-4 h-4 text-blue-400" />
              <span>2. Carpeta Google Drive (LABORATORIO)</span>
              <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
                1j2VLcwxEur3GNMtP3NIh08ncDtMCqUYA
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTabActiva('integracion')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                tabActiva === 'integracion'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#2D2D30] text-[#AA9E80] hover:text-[#FBF8F2] border border-[#424246]'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>3. Alimentación de Otros Apartados (Compras / Lab)</span>
            </button>
          </div>

          {/* CONTENIDO DE PESTAÑA 1: Formato Oficial STF GROUP Renderizado en Pantalla */}
          {tabActiva === 'documento' && (
            <div className="space-y-4">
              <div className="overflow-x-auto bg-[#1e232f]/80 p-3 sm:p-5 rounded-3xl border border-[#424246] shadow-inner">
                <STFGroupDocumentSheet
                  data={docData}
                  editable={true}
                  onChange={handleDocumentChange}
                />
              </div>

              {/* Botón Guardar Inferior */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="bg-[#C6A466] hover:bg-[#D6CDB8] text-[#2B2B2E] font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center space-x-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Guardar Cambios en Base de Datos de Fichas Técnicas</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTENIDO DE PESTAÑA 2: Panel de Google Drive */}
          {tabActiva === 'drive' && (
            <div className="bg-[#2D2D30] border border-[#424246] rounded-3xl p-6 space-y-6 text-[#FBF8F2]">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#424246] pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                    <h4 className="text-base font-bold text-white uppercase tracking-wide">
                      Carpeta Oficial Conectada: LABORATORIO
                    </h4>
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-400/30">
                      ID: {CARPETA_OFICIAL_DRIVE_ID}
                    </span>
                  </div>
                  <p className="text-xs text-[#AA9E80]">
                    Esta carpeta almacena los archivos originales (PDF, Excel, Word, imágenes) y alimenta la lectura inteligente del sistema.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={CARPETA_OFICIAL_DRIVE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir en Google Drive</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsModalLecturaDriveOpen(true)}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-zinc-950" />
                    <span>Subir y Procesar con IA</span>
                  </button>
                </div>
              </div>

              {/* Zona de Dropzone directa para subir a la carpeta */}
              <div 
                onClick={() => setIsModalLecturaDriveOpen(true)}
                className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 rounded-3xl p-8 text-center cursor-pointer transition-all bg-amber-500/5 hover:bg-amber-500/10 space-y-3"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/40">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-black text-white uppercase tracking-wide">
                    Arrastra o adjunta una Ficha Técnica para subirla a la Carpeta de Drive
                  </h5>
                  <p className="text-xs text-[#AA9E80]">
                    Sube PDF de Textivision, Lafayette, Vicunha, hojas de cálculo Excel o imágenes escaneadas. La IA extraerá los datos automáticamente.
                  </p>
                </div>
                <span className="inline-block text-xs font-bold bg-amber-500 text-zinc-950 px-4 py-1.5 rounded-xl shadow-md">
                  Abrir Asistente de Lectura Inteligente
                </span>
              </div>

              {/* Documento actual vinculado */}
              <div className="bg-[#242A38] border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-400/30">
                    PDF
                  </div>
                  <div>
                    <h6 className="text-xs font-bold text-white">
                      {currentFicha.documentoOriginal?.nombreArchivo || 'ESPECIFICACIONES_TECNICAS_CREPE_VICTORIA_TEXTIVISION.pdf'}
                    </h6>
                    <span className="text-[10px] text-[#AA9E80]">
                      Vinculado a: {currentFicha.referencia} • {currentFicha.proveedor}
                    </span>
                  </div>
                </div>

                <a
                  href={currentFicha.enlaceDrive || CARPETA_OFICIAL_DRIVE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-300 hover:text-white font-bold flex items-center gap-1.5 underline"
                >
                  <span>Abrir Documento</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* CONTENIDO DE PESTAÑA 3: Alimentación a Otros Apartados */}
          {tabActiva === 'integracion' && (
            <div className="bg-[#2D2D30] border border-[#424246] rounded-3xl p-6 space-y-6 text-[#FBF8F2]">
              <div className="space-y-1 border-b border-[#424246] pb-4">
                <h4 className="text-base font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-emerald-400" />
                  <span>Flujo de Alimentación de la Base de Datos a Otros Módulos</span>
                </h4>
                <p className="text-xs text-[#AA9E80]">
                  Los datos leídos de Google Drive quedan consolidados aquí en la Biblioteca Técnica y alimentan automáticamente los siguientes procesos de STF GROUP:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Módulo 1: Compras */}
                <div className="bg-[#242A38] border border-cyan-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 font-black text-sm uppercase">
                      <ShoppingCart className="w-5 h-5" />
                      <span>1. Módulo de Compras (Telas)</span>
                    </div>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30">
                      Sincronizado
                    </span>
                  </div>
                  <p className="text-xs text-[#AA9E80]">
                    Al generar una orden de compra o requisición para <strong>{docData.refProv || currentFicha.referencia}</strong>:
                  </p>
                  <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                    <li>Autocompleta el proveedor oficial: <span className="text-white font-bold">{docData.proveedorNombre}</span></li>
                    <li>Fija el ancho útil contratado: <span className="text-emerald-300 font-bold">{docData.anchoCortableCms || docData.anchoCms} cm</span></li>
                    <li>Establece el gramaje nominal de compra: <span className="text-amber-300 font-bold">{docData.pesoGsm} g/m²</span></li>
                    <li>Bloquea errores en la composición declarada: <span className="text-white font-bold">{docData.comp1Pct}% {docData.comp1Nombre}</span></li>
                  </ul>
                </div>

                {/* Módulo 2: Laboratorio */}
                <div className="bg-[#242A38] border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-300 font-black text-sm uppercase">
                      <FlaskConical className="w-5 h-5" />
                      <span>2. Módulo de Laboratorio (Ensayos Físicos)</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                      Sincronizado
                    </span>
                  </div>
                  <p className="text-xs text-[#AA9E80]">
                    Al ingresar una muestra física del lote <strong>{docData.lotes || 'Producción'}</strong> para análisis de calidad:
                  </p>
                  <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                    <li>Compara el peso real medido en balanza contra <span className="text-amber-300 font-bold">{docData.pesoGsm} g/m²</span> (±5%).</li>
                    <li>Evalúa el cambio dimensional al lavado con la tolerancia de la ficha: <span className="text-emerald-300 font-bold">{docData.cambioDimTrama} ({docData.cambioDimTol || '±3%'})</span>.</li>
                    <li>Dictamina la solidez al frote seco/húmedo contra la norma declarada: <span className="text-white font-bold">{docData.solFroteRes}</span>.</li>
                    <li>Valida la resistencia al rasgado y tracción sin inventar tolerancias.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center bg-[#2D2D30] rounded-3xl border border-[#424246] text-[#AA9E80] text-xs">
          No hay fichas técnicas disponibles que coincidan con la búsqueda.
        </div>
      )}

      {/* Explorador Modal */}
      <ExploradorFichasModal
        abierto={isModalExploradorOpen}
        onCerrar={() => setIsModalExploradorOpen(false)}
        onSeleccionarFichaParaUso={(f) => {
          setSelectedFichaId(f.id);
          setIsModalExploradorOpen(false);
        }}
      />

      {/* Modal de Formato Completo STF GROUP */}
      {isModalFormatoCompletoOpen && currentFicha && currentVersion && (
        <FichaTecnicaFormatoCompletoModal
          ficha={currentFicha}
          version={currentVersion}
          editable={true}
          onGuardar={(updatedDocData) => {
            setDocData(updatedDocData);
            const versionActualizada = mapSTFGroupDocumentDataToVersion(currentVersion, updatedDocData);
            guardarFichaTecnicaProveedor(currentFicha, versionActualizada);
            triggerToast(`Formato oficial de ${currentFicha.referencia} actualizado exitosamente.`);
          }}
          onCerrar={() => setIsModalFormatoCompletoOpen(false)}
        />
      )}

      {/* Modal de Lectura Inteligente & Google Drive */}
      <ModalLecturaInteligenteDrive
        isOpen={isModalLecturaDriveOpen}
        onClose={() => setIsModalLecturaDriveOpen(false)}
        onFichaCreada={(fichaId) => {
          setSelectedFichaId(fichaId);
          triggerToast('✓ Ficha Técnica analizada e incorporada a la Biblioteca Técnica.');
        }}
      />

    </div>
  );
};


