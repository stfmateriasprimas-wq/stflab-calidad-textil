import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  MuestraTextil, 
  AreaType, 
  DictamenType, 
  FiltrosDashboard, 
  ResumenKPIs, 
  RankingCausaNoConformidad, 
  CalidadProveedor,
  SolicitudTelasCompleta,
  ItemMuestraTela,
  EvaluacionCompletaLaboratorioTela,
  DecisionCompraTela,
  SolicitudAccesoriosCompleta,
  ItemMuestraAccesorio,
  FichaTecnicaHistorica,
  FichaTecnicaHistoricaVersionada,
  VersionFichaTecnica,
  UserRole,
  AnalistaLaboratorio,
  SelloResponsable,
  RegistroEdicionAudit,
  EvaluacionForrosCosturas,
  ItemPapelera
} from '../types';
import { 
  MOCK_MUESTRAS, 
  MOCK_SOLICITUDES_ACCESORIOS, 
  MOCK_SOLICITUDES_TELAS, 
  MOCK_FICHAS_TECNICAS_HISTORICAS,
  MOCK_EVALUACIONES_FORROS_COSTURAS
} from '../data/mockData';
import { 
  calcularKPIs, 
  calcularRankingNoConformidades, 
  calcularCalidadProveedores, 
  filtrarMuestras 
} from '../utils/calculations';
import { soundEffects, TipoSonido } from '../utils/soundEffects';
import { NotificacionItem } from '../components/common/NotificationToastContainer';
import { 
  firestoreGuardarSolicitudTelas,
  firestoreActualizarItemTela,
  firestoreGuardarSolicitudAccesorios,
  firestoreActualizarItemAccesorio,
  registrarLogAuditoria,
  COLECCIONES
} from '../services/firestoreService';
import { 
  emitirNotificacionCorreoAutomatica, 
  CORREOS_CORPORATIVOS_STF,
  RegistroHistorialCorreo 
} from '../services/emailNotificationService';
import {
  inicializarBaseDatosFichas,
  guardarFichaEnBaseDatos,
  guardarLoteFichasEnBaseDatos,
  obtenerFichasDeLocalStorage,
  limpiarBaseDatosFichasCompleta
} from '../services/fichasDatabaseService';
import {
  obtenerConfiguracionGoogle,
  guardarConfiguracionGoogle,
  probarConexionGoogle,
  inicializarEstructuraGoogle,
  sincronizarTodoGoogle,
  sincronizarForrosCosturasGoogle,
  sincronizarFichasGoogle,
  sincronizarProveedoresGoogle,
  sincronizarTodoMasterGoogle
} from '../services/googleDatabaseService';
import { GoogleIntegrationConfig, GoogleSyncResponse } from '../types/googleIntegration';

interface QualityContextType {
  muestras: MuestraTextil[];
  muestrasFiltradas: MuestraTextil[];
  areaActual: AreaType;
  setAreaActual: (area: AreaType) => void;
  subseccionLaboratorio: 'telas' | 'accesorios' | 'forros-costuras' | 'historial';
  setSubseccionLaboratorio: (sub: 'telas' | 'accesorios' | 'forros-costuras' | 'historial') => void;
  subseccionCompras: 'telas' | 'accesorios';
  setSubseccionCompras: (sub: 'telas' | 'accesorios') => void;
  navegarA: (area: AreaType, subseccion?: string) => void;
  pendientesLabTelas: number;
  pendientesLabInsumos: number;
  pendientesLabTotal: number;
  totalComprasTelas: number;
  totalComprasInsumos: number;
  filtros: FiltrosDashboard;
  setFiltros: React.Dispatch<React.SetStateAction<FiltrosDashboard>>;
  resetearFiltros: () => void;
  muestraSeleccionada: MuestraTextil | null;
  setMuestraSeleccionada: (muestra: MuestraTextil | null) => void;
  
  // Modales
  modalFichaAbierto: boolean;
  setModalFichaAbierto: (abierto: boolean) => void;
  modalNuevaMuestraAbierto: boolean;
  setModalNuevaMuestraAbierto: (abierto: boolean) => void;
  modalImportarAbierto: boolean;
  setModalImportarAbierto: (abierto: boolean) => void;
  modalAlertasLeadTimeAbierto: boolean;
  setModalAlertasLeadTimeAbierto: (abierto: boolean) => void;
  modalSelectorAreaAbierto: boolean;
  setModalSelectorAreaAbierto: (abierto: boolean) => void;
  modalPapeleraAbierto: boolean;
  setModalPapeleraAbierto: (abierto: boolean) => void;

  // 📧 Visor de Correos Formales
  correoModal: RegistroHistorialCorreo | null;
  modalCorreoAbierto: boolean;
  abrirVisorCorreo: (correo: RegistroHistorialCorreo) => void;
  cerrarVisorCorreo: () => void;

  // 🗑️ Papelera de Reciclaje
  papelera: ItemPapelera[];
  eliminarSolicitudTelas: (id: string, area: 'compras' | 'laboratorio') => void;
  eliminarSolicitudAccesorios: (id: string, area: 'compras' | 'laboratorio') => void;
  restaurarDePapelera: (papeleraId: string) => void;
  eliminarPermanentePapelera: (papeleraId: string) => void;
  vaciarPapelera: () => void;

  // Acciones CRUD y Dictamen
  actualizarDictamenArea: (
    muestraId: string, 
    area: 'laboratorio' | 'compras' | 'patronaje' | 'corte', 
    dictamen: DictamenType, 
    observaciones?: string, 
    responsable?: string,
    detallesEspecificos?: Record<string, any>
  ) => void;
  agregarMuestra: (nueva: Omit<MuestraTextil, 'id'>) => void;
  actualizarMuestra: (muestra: MuestraTextil) => void;
  eliminarMuestra: (id: string) => void;
  importarMuestrasMasivas: (nuevas: MuestraTextil[]) => void;
  restablecerDatosIniciales: () => void;
  limpiarTodosLosDatos: () => void;

  // Métricas computadas
  kpis: ResumenKPIs;
  rankingCausas: RankingCausaNoConformidad[];
  calidadProveedores: CalidadProveedor[];
  listaProveedoresUnicos: string[];
  listaMarcasUnicas: string[];

  // 🧵 Gestión de Solicitudes de Telas (1 o varias telas en el mismo paquete)
  solicitudesTelas: SolicitudTelasCompleta[];
  agregarSolicitudTelas: (solicitud: Omit<SolicitudTelasCompleta, 'id'>) => void;
  enviarSolicitudTelasALaboratorio: (solicitudId: string) => void;
  actualizarItemTelaLab: (solicitudId: string, itemId: string, datosActualizados: Partial<ItemMuestraTela>) => void;
  responderSolicitudTelas: (
    solicitudId: string,
    itemId: string,
    datosRespuesta: {
      resultadoLab: string;
      dictamen: DictamenType;
      fechaIngreso?: string;
      fechaEntrega?: string;
      fechaRespuestaLab?: string;
      responsableLab?: string;
      observacionesLabRespuesta?: string;
      evaluacionTecnica?: EvaluacionCompletaLaboratorioTela;
      fichaTecnicaUtilizada?: any;
    }
  ) => void;
  registrarDecisionCompraTela: (
    solicitudId: string,
    itemId: string,
    decisionData: DecisionCompraTela
  ) => void;

  // 🔩 Gestión de Solicitudes de Accesorios (con múltiples muestras independientes)
  solicitudesAccesorios: SolicitudAccesoriosCompleta[];
  agregarSolicitudAccesorios: (solicitud: Omit<SolicitudAccesoriosCompleta, 'id'>) => void;
  enviarSolicitudAccesoriosALaboratorio: (solicitudId: string) => void;
  actualizarItemAccesorioLab: (solicitudId: string, itemId: string, datosActualizados: Partial<ItemMuestraAccesorio>) => void;
  actualizarDictamenSolicitudAccesorios: (solicitudId: string, dictamen: DictamenType) => void;
  responderSolicitudAccesorios: (solicitudId: string, datosRespuesta: { observacionesLab?: string; responsable?: string; muestrasEvaluadas?: ItemMuestraAccesorio[] }) => void;

  // 📄 Repositorio Histórico de Fichas Técnicas del Proveedor (Independiente de Compras)
  fichasTecnicasHistorial: FichaTecnicaHistoricaVersionada[];
  consultarFichaTecnicaHistorica: (referencia: string, proveedor?: string, refProveedor?: string) => { ficha: FichaTecnicaHistoricaVersionada; version: VersionFichaTecnica } | undefined;
  guardarFichaTecnica: (ficha: FichaTecnicaHistoricaVersionada) => void;
  guardarFichaTecnicaProveedor: (ficha: FichaTecnicaHistoricaVersionada, nuevaVersion?: VersionFichaTecnica) => void;
  importarFichasTecnicasExcel: (fichas: FichaTecnicaHistoricaVersionada[]) => void;
  limpiarBaseDatosFichas: () => Promise<void>;

  // 🧑‍🔬 Módulo de Usuarios de Laboratorio & Trazabilidad (4 Responsables)
  analistas: AnalistaLaboratorio[];
  analistaActivo: AnalistaLaboratorio;
  cambiarAnalistaConPin: (analistaId: string, pinIngresado: string) => { exito: boolean; mensaje: string };
  obtenerSelloResponsable: () => SelloResponsable;
  crearAnalista: (datos: Omit<AnalistaLaboratorio, 'id'>) => void;
  actualizarAnalista: (analista: AnalistaLaboratorio) => void;
  eliminarAnalista: (id: string) => void;

  // 🔔 Sistema de Alertas Animadas & Sonidos en Tiempo Real
  notificacionesActivas: NotificacionItem[];
  dispararNotificacion: (notif: Omit<NotificacionItem, 'id'>) => void;
  eliminarNotificacion: (id: string) => void;

  // 🪡 Módulo de Evaluaciones de Forros y Costuras (Pipin vs Shipping)
  evaluacionesForrosCosturas: EvaluacionForrosCosturas[];
  agregarEvaluacionForrosCosturas: (nueva: Omit<EvaluacionForrosCosturas, 'id' | 'codigoReporte' | 'createdAt' | 'updatedAt'>) => EvaluacionForrosCosturas;
  actualizarEvaluacionForrosCosturas: (id: string, datos: Partial<EvaluacionForrosCosturas>) => void;
  eliminarEvaluacionForrosCosturas: (id: string) => void;
  enviarCorreoReporteForrosCosturas: (id: string, destinatario: string, asunto: string, cuerpo: string) => void;

  // 🌐 Integración Google Workspace (Drive & Sheets)
  googleConfig: GoogleIntegrationConfig;
  actualizarGoogleConfig: (nueva: Partial<GoogleIntegrationConfig>) => GoogleIntegrationConfig;
  probarConexionGoogleActiva: (url?: string) => Promise<{ success: boolean; message: string; meta?: any }>;
  inicializarEstructuraGoogleActiva: () => Promise<GoogleSyncResponse>;
  sincronizarConGoogleManual: () => Promise<GoogleSyncResponse>;
  sincronizarFichasGoogleManual: () => Promise<GoogleSyncResponse>;
  sincronizarForrosGoogleManual: () => Promise<GoogleSyncResponse>;
  sincronizarTodoMasterManual: () => Promise<GoogleSyncResponse>;
  sincronizandoGoogle: boolean;
}

export const ANALISTAS_PREDETERMINADOS: AnalistaLaboratorio[] = [
  {
    id: 'analista-1',
    nombreCompleto: 'María Fernanda López',
    cargoEspecialidad: 'Analista de Calidad & Ensayos Textil',
    correoUsuario: 'maria.lopez@stfgroup.com',
    pinAcceso: '1234',
    activo: true
  },
  {
    id: 'analista-2',
    nombreCompleto: 'Juan Pérez',
    cargoEspecialidad: 'Técnico de Ensayo & Fisicoquímica',
    correoUsuario: 'juan.perez@stfgroup.com',
    pinAcceso: '5678',
    activo: true
  },
  {
    id: 'analista-3',
    nombreCompleto: 'Carlos Gómez',
    cargoEspecialidad: 'Especialista en Solideces y Color',
    correoUsuario: 'carlos.gomez@stfgroup.com',
    pinAcceso: '4321',
    activo: true
  },
  {
    id: 'analista-4',
    nombreCompleto: 'Ana Martínez',
    cargoEspecialidad: 'Analista de Calidad & Técnico de Ensayo',
    correoUsuario: 'ana.martinez@stfgroup.com',
    pinAcceso: '8888',
    activo: true
  }
];

const FILTROS_INICIALES: FiltrosDashboard = {
  busqueda: '',
  rangoFecha: 'TODOS',
  fechaInicio: '',
  fechaFin: '',
  proveedor: 'TODOS',
  marca: 'TODAS',
  dictamen: 'TODOS',
  estadoTrazabilidad: 'TODOS',
  soloAlertasLeadTime: false,
};

const QualityContext = createContext<QualityContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'stflab_muestras_clean_v5';
const LOCAL_STORAGE_ACC_KEY = 'stflab_solicitudes_acc_clean_v5';
const LOCAL_STORAGE_TELAS_KEY = 'stflab_solicitudes_telas_clean_v5';
const LOCAL_STORAGE_FICHAS_KEY = 'stflab_fichas_clean_v5';
const LOCAL_STORAGE_PAPELERA_KEY = 'stflab_papelera_reciclaje_v1';
const LOCAL_STORAGE_FORROS_KEY = 'stflab_forros_costuras_clean_v5';

export const QualityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { usuario, obtenerFirmaSesion } = useAuth();

  // 🗑️ Estado de la Papelera de Reciclaje
  const [modalPapeleraAbierto, setModalPapeleraAbierto] = useState<boolean>(false);
  const [papelera, setPapelera] = useState<ItemPapelera[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PAPELERA_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo localStorage de papelera:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PAPELERA_KEY, JSON.stringify(papelera));
    } catch (e) {
      console.error('Error guardando papelera:', e);
    }
  }, [papelera]);
  const [analistas, setAnalistas] = useState<AnalistaLaboratorio[]>(() => {
    try {
      const stored = localStorage.getItem('stflab_analistas_list_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo localStorage de analistas:', e);
    }
    return ANALISTAS_PREDETERMINADOS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('stflab_analistas_list_v2', JSON.stringify(analistas));
    } catch (e) {
      console.error('Error guardando analistas:', e);
    }
  }, [analistas]);

  const [analistaActivo, setAnalistaActivo] = useState<AnalistaLaboratorio>(() => {
    try {
      const savedId = localStorage.getItem('stf_analista_activo_id');
      const found = (analistas || ANALISTAS_PREDETERMINADOS).find(a => a.id === savedId);
      if (found) return found;
    } catch {}
    return ANALISTAS_PREDETERMINADOS[0];
  });

  // Sincronizar automáticamente analistaActivo con el usuario ingresado en AuthContext
  useEffect(() => {
    if (usuario) {
      const nombre = usuario.displayName || usuario.nombreUsuario || 'Analista Laboratorio';
      const cargo = usuario.rolEspecifico || (usuario.role === 'ADMIN' ? 'Administrador STFLab' : 'Analista de Laboratorio');
      
      setAnalistaActivo(prev => {
        if (prev.nombreCompleto === nombre) return prev;
        const matchInList = analistas.find(a => 
          a.id === usuario.uid || 
          a.nombreCompleto.toLowerCase() === nombre.toLowerCase() ||
          a.correoUsuario.toLowerCase() === (usuario.email || '').toLowerCase()
        );
        if (matchInList) {
          return matchInList;
        }
        return {
          id: usuario.uid || 'usr-active',
          nombreCompleto: nombre,
          cargoEspecialidad: cargo,
          correoUsuario: usuario.email || `${usuario.nombreUsuario}@stfgroup.com`,
          pinAcceso: '1234',
          activo: true
        };
      });
    }
  }, [usuario, analistas]);
  const [muestras, setMuestras] = useState<MuestraTextil[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo localStorage de muestras:', e);
    }
    return [];
  });

  // Solicitudes de Compras - Telas
  const [solicitudesTelas, setSolicitudesTelas] = useState<SolicitudTelasCompleta[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_TELAS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo localStorage de telas:', e);
    }
    return [];
  });

  // Solicitudes de Compras - Accesorios (Conectadas directamente a Laboratorio)
  const [solicitudesAccesorios, setSolicitudesAccesorios] = useState<SolicitudAccesoriosCompleta[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ACC_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo localStorage de accesorios:', e);
    }
    return [];
  });

  // Repositorio Histórico de Fichas Técnicas del Fabricante (con Versionamiento y Base de Datos)
  const [fichasTecnicasHistorial, setFichasTecnicasHistorial] = useState<FichaTecnicaHistoricaVersionada[]>(() => {
    const guardadas = obtenerFichasDeLocalStorage();
    if (guardadas && guardadas.length > 0) return guardadas;
    return MOCK_FICHAS_TECNICAS_HISTORICAS;
  });

  // --- MÓDULO FORROS Y COSTURAS (PIPIN VS SHIPPING) ---
  const [evaluacionesForrosCosturas, setEvaluacionesForrosCosturas] = useState<EvaluacionForrosCosturas[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FORROS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error leyendo localStorage de forros y costuras:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FORROS_KEY, JSON.stringify(evaluacionesForrosCosturas));
    } catch (e) {
      console.error('Error guardando forros y costuras:', e);
    }
  }, [evaluacionesForrosCosturas]);

  // 🌐 Estado de Integración con Google Workspace
  const [googleConfig, setGoogleConfig] = useState<GoogleIntegrationConfig>(() => obtenerConfiguracionGoogle());
  const [sincronizandoGoogle, setSincronizandoGoogle] = useState<boolean>(false);

  useEffect(() => {
    const handleGoogleUpdate = (e: any) => {
      if (e.detail) setGoogleConfig(e.detail);
    };
    window.addEventListener('stflab-google-config-updated', handleGoogleUpdate);
    return () => window.removeEventListener('stflab-google-config-updated', handleGoogleUpdate);
  }, []);

  // Sincronización automática no intrusiva hacia Google Sheets en las 7 pestañas maestras
  useEffect(() => {
    if (!googleConfig.autoSyncEnabled || !googleConfig.webAppUrl) return;
    if (
      solicitudesTelas.length === 0 &&
      solicitudesAccesorios.length === 0 &&
      evaluacionesForrosCosturas.length === 0 &&
      fichasTecnicasHistorial.length === 0
    ) return;

    const timer = setTimeout(async () => {
      try {
        const provs = Array.from(new Set([
          ...solicitudesTelas.map(s => s.proveedor),
          ...solicitudesAccesorios.map(s => s.proveedor),
          ...fichasTecnicasHistorial.map(f => f.proveedor)
        ].filter(Boolean))).map((p, idx) => ({
          id: `prov-${idx + 1}`,
          codigoProveedor: `PRV-${(idx + 1).toString().padStart(3, '0')}`,
          razonSocial: p,
          tipoProveedor: 'TELA'
        }));

        await sincronizarTodoMasterGoogle({
          telas: solicitudesTelas,
          accesorios: solicitudesAccesorios,
          forros: evaluacionesForrosCosturas,
          fichas: fichasTecnicasHistorial,
          proveedores: provs
        });
        setGoogleConfig(obtenerConfiguracionGoogle());
      } catch (e) {
        console.warn('Auto-sync en segundo plano con Google Sheets (7 pestañas):', e);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [
    solicitudesTelas, 
    solicitudesAccesorios, 
    evaluacionesForrosCosturas, 
    fichasTecnicasHistorial, 
    googleConfig.autoSyncEnabled, 
    googleConfig.webAppUrl
  ]);

  const actualizarGoogleConfig = (nueva: Partial<GoogleIntegrationConfig>) => {
    const act = guardarConfiguracionGoogle(nueva);
    setGoogleConfig(act);
    return act;
  };

  const probarConexionGoogleActiva = async (url?: string) => {
    const res = await probarConexionGoogle(url);
    setGoogleConfig(obtenerConfiguracionGoogle());
    return res;
  };

  const inicializarEstructuraGoogleActiva = async () => {
    setSincronizandoGoogle(true);
    try {
      const res = await inicializarEstructuraGoogle();
      setGoogleConfig(obtenerConfiguracionGoogle());
      return res;
    } finally {
      setSincronizandoGoogle(false);
    }
  };

  const sincronizarConGoogleManual = async () => {
    setSincronizandoGoogle(true);
    try {
      const res = await sincronizarTodoGoogle(solicitudesTelas, solicitudesAccesorios);
      setGoogleConfig(obtenerConfiguracionGoogle());
      return res;
    } finally {
      setSincronizandoGoogle(false);
    }
  };

  const sincronizarFichasGoogleManual = async () => {
    setSincronizandoGoogle(true);
    try {
      const res = await sincronizarFichasGoogle(fichasTecnicasHistorial);
      setGoogleConfig(obtenerConfiguracionGoogle());
      return res;
    } finally {
      setSincronizandoGoogle(false);
    }
  };

  const sincronizarForrosGoogleManual = async () => {
    setSincronizandoGoogle(true);
    try {
      const res = await sincronizarForrosCosturasGoogle(evaluacionesForrosCosturas);
      setGoogleConfig(obtenerConfiguracionGoogle());
      return res;
    } finally {
      setSincronizandoGoogle(false);
    }
  };

  const sincronizarTodoMasterManual = async () => {
    setSincronizandoGoogle(true);
    try {
      const provs = Array.from(new Set([
        ...solicitudesTelas.map(s => s.proveedor),
        ...solicitudesAccesorios.map(s => s.proveedor),
        ...fichasTecnicasHistorial.map(f => f.proveedor)
      ].filter(Boolean))).map((p, idx) => ({
        id: `prov-${idx + 1}`,
        codigoProveedor: `PRV-${(idx + 1).toString().padStart(3, '0')}`,
        razonSocial: p,
        tipoProveedor: 'TELA'
      }));

      const res = await sincronizarTodoMasterGoogle({
        telas: solicitudesTelas,
        accesorios: solicitudesAccesorios,
        forros: evaluacionesForrosCosturas,
        fichas: fichasTecnicasHistorial,
        proveedores: provs
      });
      setGoogleConfig(obtenerConfiguracionGoogle());
      return res;
    } finally {
      setSincronizandoGoogle(false);
    }
  };

  // Hidratación e inicialización de la Base de Datos de Fichas Técnicas (IndexedDB + Cloud)
  useEffect(() => {
    inicializarBaseDatosFichas().then((fichasBD) => {
      if (fichasBD && fichasBD.length > 0) {
        setFichasTecnicasHistorial(fichasBD);
      }
    }).catch((err) => console.warn('Error inicializando Base de Datos de Fichas:', err));
  }, []);

  const [areaActual, setAreaActual] = useState<AreaType>('dashboard');
  const [subseccionLaboratorio, setSubseccionLaboratorio] = useState<'telas' | 'accesorios' | 'forros-costuras' | 'historial'>('telas');
  const [subseccionCompras, setSubseccionCompras] = useState<'telas' | 'accesorios'>('telas');

  const navegarA = (area: AreaType, subseccion?: string) => {
    if (area === 'laboratorio') {
      if (subseccion === 'accesorios' || subseccion === 'insumos') {
        setSubseccionLaboratorio('accesorios');
      } else if (subseccion === 'forros-costuras') {
        setSubseccionLaboratorio('forros-costuras');
      } else if (subseccion === 'historial') {
        setSubseccionLaboratorio('historial');
      } else if (subseccion === 'telas') {
        setSubseccionLaboratorio('telas');
      }
      setAreaActual('laboratorio');
      return;
    }

    if (area === 'compras' || area === 'compras-decision') {
      if (subseccion === 'accesorios' || subseccion === 'insumos') {
        setSubseccionCompras('accesorios');
      } else if (subseccion === 'telas') {
        setSubseccionCompras('telas');
      }
      setAreaActual(area);
      return;
    }

    setAreaActual(area);
  };

  const pendientesLabTelas = (solicitudesTelas || [])
    .flatMap(s => s.telas || [])
    .filter(t => !t.dictamen || t.dictamen === 'PENDIENTE' || t.dictamen === 'EN_PROCESO').length;

  const pendientesLabInsumos = (solicitudesAccesorios || [])
    .flatMap(s => s.muestras || [])
    .filter(m => !m.dictamen || m.dictamen === 'PENDIENTE' || m.dictamen === 'EN_PROCESO').length;

  const pendientesLabTotal = pendientesLabTelas + pendientesLabInsumos;
  const totalComprasTelas = (solicitudesTelas || []).length;
  const totalComprasInsumos = (solicitudesAccesorios || []).length;
  const [filtros, setFiltros] = useState<FiltrosDashboard>(FILTROS_INICIALES);
  const [muestraSeleccionada, setMuestraSeleccionada] = useState<MuestraTextil | null>(null);

  // Estados de modales
  const [modalFichaAbierto, setModalFichaAbierto] = useState(false);
  const [modalNuevaMuestraAbierto, setModalNuevaMuestraAbierto] = useState(false);
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [modalAlertasLeadTimeAbierto, setModalAlertasLeadTimeAbierto] = useState(false);
  const [modalSelectorAreaAbierto, setModalSelectorAreaAbierto] = useState(false);

  // 📧 Visor de Correos Formales
  const [correoModal, setCorreoModal] = useState<RegistroHistorialCorreo | null>(null);
  const [modalCorreoAbierto, setModalCorreoAbierto] = useState(false);

  const abrirVisorCorreo = (correo: RegistroHistorialCorreo) => {
    setCorreoModal(correo);
    setModalCorreoAbierto(true);
  };

  const cerrarVisorCorreo = () => {
    setModalCorreoAbierto(false);
    setCorreoModal(null);
  };

  // 🔔 Estado y Gestor de Notificaciones Animadas & Sonidos
  const [notificacionesActivas, setNotificacionesActivas] = useState<NotificacionItem[]>([]);

  const dispararNotificacion = (notif: Omit<NotificacionItem, 'id'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const nueva: NotificacionItem = { ...notif, id, tiempo: 'Ahora' };

    // Reproducir sonido con Web Audio API
    soundEffects.reproducir(notif.tipo);

    setNotificacionesActivas((prev) => [nueva, ...prev.slice(0, 4)]);

    // Auto-cierre suave después de 7 segundos
    setTimeout(() => {
      setNotificacionesActivas((prev) => prev.filter((n) => n.id !== id));
    }, 7000);
  };

  const eliminarNotificacion = (id: string) => {
    setNotificacionesActivas((prev) => prev.filter((n) => n.id !== id));
  };

  // Persistencia de respaldo en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(muestras));
    } catch (e) {
      console.error('Error sincronizando muestras:', e);
    }
  }, [muestras]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_TELAS_KEY, JSON.stringify(solicitudesTelas));
    } catch (e) {
      console.error('Error sincronizando solicitudes telas:', e);
    }
  }, [solicitudesTelas]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACC_KEY, JSON.stringify(solicitudesAccesorios));
    } catch (e) {
      console.error('Error sincronizando solicitudes accesorios:', e);
    }
  }, [solicitudesAccesorios]);

  // Persistencia de la Base de Datos de Fichas Técnicas en LocalStorage e IndexedDB
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FICHAS_KEY, JSON.stringify(fichasTecnicasHistorial));
      guardarLoteFichasEnBaseDatos(fichasTecnicasHistorial);
    } catch (e) {
      console.error('Error sincronizando base de datos de fichas técnicas:', e);
    }
  }, [fichasTecnicasHistorial]);

  // Consultar Ficha Técnica Histórica (Prioridad: Proveedor + Referencia Proveedor / Nombre Comercial)
  const consultarFichaTecnicaHistorica = (
    referencia?: string,
    proveedor?: string,
    refProveedor?: string
  ): { ficha: FichaTecnicaHistoricaVersionada; version: VersionFichaTecnica } | undefined => {
    if (!referencia && !refProveedor) return undefined;
    const refClean = (referencia || '').trim().toLowerCase();
    const provClean = (proveedor || '').trim().toLowerCase();
    const refProvClean = (refProveedor || '').trim().toLowerCase();

    const fichaEncontrada = (fichasTecnicasHistorial || []).find((ft) => {
      if (!ft) return false;
      const ftProv = (ft.proveedor || '').toLowerCase();
      // 1. Coincidencia primaria: Proveedor + Referencia Proveedor
      if (refProvClean && ft.referenciaProveedor) {
        const ftRefProv = ft.referenciaProveedor.toLowerCase();
        const matchRefProv = ftRefProv === refProvClean ||
                             ftRefProv.includes(refProvClean) ||
                             refProvClean.includes(ftRefProv);
        if (matchRefProv) {
          if (!provClean || ftProv.includes(provClean) || provClean.includes(ftProv)) {
            return true;
          }
        }
      }

      // 2. Coincidencia secundaria: Nombre comercial / Referencia + Proveedor
      const ftRef = (ft.referencia || '').toLowerCase();
      const matchRefNombre = ftRef.includes(refClean) || (refClean && refClean.includes(ftRef));
      if (matchRefNombre) {
        if (!provClean || ftProv.includes(provClean) || provClean.includes(ftProv)) {
          return true;
        }
      }

      return false;
    });

    if (!fichaEncontrada) return undefined;
    const versionActiva = fichaEncontrada.historialVersiones.find((v: VersionFichaTecnica) => v.activo) || 
      fichaEncontrada.historialVersiones[fichaEncontrada.historialVersiones.length - 1];

    return { ficha: fichaEncontrada, version: versionActiva };
  };

  const guardarFichaTecnica = (fichaActualizada: FichaTecnicaHistoricaVersionada) => {
    guardarFichaEnBaseDatos(fichaActualizada).catch(err => console.warn('Aviso guardando ficha en BD:', err));
    setFichasTecnicasHistorial((prev) => {
      const existe = prev.some(f => f.id === fichaActualizada.id || (f.proveedor.toLowerCase() === fichaActualizada.proveedor.toLowerCase() && f.referenciaProveedor.toLowerCase() === fichaActualizada.referenciaProveedor.toLowerCase()));
      if (existe) {
        return prev.map(f => (f.id === fichaActualizada.id || (f.proveedor.toLowerCase() === fichaActualizada.proveedor.toLowerCase() && f.referenciaProveedor.toLowerCase() === fichaActualizada.referenciaProveedor.toLowerCase())) ? fichaActualizada : f);
      }
      return [fichaActualizada, ...prev];
    });
  };

  const guardarFichaTecnicaProveedor = (
    ficha: FichaTecnicaHistoricaVersionada, 
    nuevaVersion?: VersionFichaTecnica
  ) => {
    let fichaAGuardar: FichaTecnicaHistoricaVersionada;

    setFichasTecnicasHistorial((prev) => {
      const idx = prev.findIndex(f => 
        f.id === ficha.id || 
        (f.proveedor.trim().toLowerCase() === ficha.proveedor.trim().toLowerCase() && 
         f.referenciaProveedor.trim().toLowerCase() === ficha.referenciaProveedor.trim().toLowerCase())
      );

      if (idx >= 0) {
        const fichaExistente = prev[idx];
        const versionNumero = fichaExistente.versionActual + 1;
        const versionObj: VersionFichaTecnica = nuevaVersion ? {
          ...nuevaVersion,
          version: versionNumero
        } : {
          ...ficha.historialVersiones[ficha.historialVersiones.length - 1],
          version: versionNumero
        };

        const fichaActualizada: FichaTecnicaHistoricaVersionada = {
          ...fichaExistente,
          ...ficha,
          versionActual: versionNumero,
          estadoRevision: 'PENDIENTE_REVISION',
          updatedAt: new Date().toISOString().split('T')[0],
          updatedBy: versionObj.creadoPor || 'Proveedor',
          historialVersiones: [...fichaExistente.historialVersiones, versionObj]
        };

        fichaAGuardar = fichaActualizada;
        guardarFichaEnBaseDatos(fichaActualizada).catch(err => console.warn('Aviso guardando ficha en BD:', err));

        const nuevoHistorial = [...prev];
        nuevoHistorial[idx] = fichaActualizada;
        return nuevoHistorial;
      }

      fichaAGuardar = { ...ficha, estadoRevision: 'PENDIENTE_REVISION' };
      guardarFichaEnBaseDatos(fichaAGuardar).catch(err => console.warn('Aviso guardando ficha en BD:', err));
      return [fichaAGuardar, ...prev];
    });

    // 🔔 Disparar notificación interna a Laboratorio
    dispararNotificacion({
      tipo: 'solicitud',
      titulo: '📄 Nueva Ficha Técnica del Fabricante',
      mensaje: `El proveedor ${ficha.proveedor} ha enviado la Ficha Técnica para ${ficha.referenciaProveedor} (${ficha.referencia}). Registrada en la Base de Datos Histórica [PENDIENTE DE REVISIÓN].`,
      areaDestino: 'laboratorio',
      accionLabel: 'Ver Ficha en Historial'
    });
  };

  const importarFichasTecnicasExcel = (fichasNuevas: FichaTecnicaHistoricaVersionada[]) => {
    guardarLoteFichasEnBaseDatos(fichasNuevas).catch(err => console.warn('Aviso guardando lote en BD:', err));
    setFichasTecnicasHistorial((prev) => [...fichasNuevas, ...prev]);
  };

  const limpiarBaseDatosFichas = async () => {
    const limpias = await limpiarBaseDatosFichasCompleta();
    setFichasTecnicasHistorial(limpias);
  };

  // Filtrado de muestras
  const muestrasFiltradas = filtrarMuestras(muestras, filtros);

  // KPIs y Estadísticas dinámicas
  const kpis = calcularKPIs(muestrasFiltradas);
  const rankingCausas = calcularRankingNoConformidades(muestrasFiltradas);
  const calidadProveedores = calcularCalidadProveedores(muestrasFiltradas);

  const listaProveedoresUnicos = Array.from(new Set(muestras.map((m) => m.proveedor).filter(Boolean)));
  const listaMarcasUnicas = Array.from(new Set(muestras.map((m) => m.marca).filter(Boolean)));

  const resetearFiltros = () => {
    setFiltros(FILTROS_INICIALES);
  };

  // =========================================================================
  // --- 🔄 ACCIONES CRUD MUESTRAS & DICTÁMENES                             ---
  // =========================================================================
  const actualizarDictamenArea = (
    muestraId: string,
    area: 'laboratorio' | 'compras' | 'patronaje' | 'corte',
    dictamen: DictamenType,
    observaciones?: string,
    responsable?: string,
    detallesEspecificos?: Record<string, any>
  ) => {
    const fechaActual = new Date().toISOString().split('T')[0];

    setMuestras((prev) =>
      prev.map((m) => {
        if (m.id !== muestraId) return m;

        const nuevaTrazabilidad = {
          ...m.trazabilidad,
          [area]: {
            estado: 'COMPLETO' as const,
            dictamen,
            fecha: fechaActual,
            responsable: responsable || m.trazabilidad[area]?.responsable || 'Usuario Responsable',
            observaciones: observaciones || m.trazabilidad[area]?.observaciones,
          },
        };

        const dictamenes = Object.values(nuevaTrazabilidad).map((t) => t.dictamen);
        let nuevoDictamenFinal: DictamenType = 'APROBADO';
        if (dictamenes.includes('RECHAZADO')) {
          nuevoDictamenFinal = 'RECHAZADO';
        } else if (dictamenes.includes('HALLAZGO')) {
          nuevoDictamenFinal = 'HALLAZGO';
        } else if (dictamenes.includes('EN_PROCESO') || dictamenes.includes('PENDIENTE')) {
          nuevoDictamenFinal = 'EN_PROCESO';
        }

        const nuevoMuestra: MuestraTextil = {
          ...m,
          dictamenFinal: nuevoDictamenFinal,
          trazabilidad: nuevaTrazabilidad,
          fechaFinalizacion: nuevoDictamenFinal === 'APROBADO' || nuevoDictamenFinal === 'RECHAZADO' ? fechaActual : undefined
        };

        if (muestraSeleccionada?.id === muestraId) {
          setMuestraSeleccionada(nuevoMuestra);
        }

        return nuevoMuestra;
      })
    );

    // Registro de auditoría
    registrarLogAuditoria(
      COLECCIONES.MUESTRAS_LABORATORIO,
      muestraId,
      'APROBAR',
      responsable || 'Usuario',
      area.toUpperCase() as UserRole,
      `Dictamen de ${area} actualizado a ${dictamen}.`
    );
  };

  const agregarMuestra = (nueva: Omit<MuestraTextil, 'id'>) => {
    const id = `mt-${Date.now()}`;
    const muestraCompleta: MuestraTextil = {
      ...nueva,
      id,
    };
    setMuestras((prev) => [muestraCompleta, ...prev]);
  };

  const actualizarMuestra = (muestraActualizada: MuestraTextil) => {
    setMuestras((prev) => prev.map((m) => (m.id === muestraActualizada.id ? muestraActualizada : m)));
    if (muestraSeleccionada?.id === muestraActualizada.id) {
      setMuestraSeleccionada(muestraActualizada);
    }
  };

  const eliminarMuestra = (id: string) => {
    setMuestras((prev) => prev.filter((m) => m.id !== id));
    if (muestraSeleccionada?.id === id) {
      setMuestraSeleccionada(null);
      setModalFichaAbierto(false);
    }
  };

  const importarMuestrasMasivas = (nuevas: MuestraTextil[]) => {
    setMuestras((prev) => [...nuevas, ...prev]);
  };

  const limpiarTodosLosDatos = () => {
    setMuestras([]);
    setSolicitudesTelas([]);
    setSolicitudesAccesorios([]);
    setFichasTecnicasHistorial([]);
    setEvaluacionesForrosCosturas([]);
    setPapelera([]);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_TELAS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ACC_KEY);
    localStorage.removeItem(LOCAL_STORAGE_FICHAS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_FORROS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PAPELERA_KEY);
    resetearFiltros();
  };

  const restablecerDatosIniciales = () => {
    limpiarTodosLosDatos();
  };

  // =========================================================================
  // --- 🗑️ PAPELERA DE RECICLAJE (COMPRAS & LABORATORIO)                  ---
  // =========================================================================
  const eliminarSolicitudTelas = (solicitudId: string, area: 'compras' | 'laboratorio') => {
    const sol = solicitudesTelas.find(s => s.id === solicitudId);
    if (!sol) return;

    const nombreUsuario = usuario?.displayName || usuario?.nombreUsuario || (area === 'compras' ? 'Compras' : 'Laboratorio');

    const itemPapelera: ItemPapelera = {
      id: `pap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipo: 'tela',
      solicitudOriginalId: sol.id,
      numeroSolicitud: sol.numeroSolicitud || sol.id,
      fechaSolicitud: sol.fechaSolicitud || new Date().toISOString(),
      solicitante: sol.solicitante || 'Compras',
      proveedor: sol.proveedor || (sol.telas && sol.telas[0]?.proveedor) || 'No especificado',
      cantidadItems: sol.telas ? sol.telas.length : 1,
      eliminadoPor: nombreUsuario,
      areaEliminacion: area,
      fechaEliminacion: new Date().toISOString(),
      motivo: `Eliminado desde el módulo de ${area}`,
      datosCompletos: sol
    };

    setPapelera(prev => [itemPapelera, ...prev]);
    setSolicitudesTelas(prev => prev.filter(s => s.id !== solicitudId));

    soundEffects.reproducir('alerta');
    dispararNotificacion({
      tipo: 'alerta',
      titulo: '🗑️ Solicitud enviada a la Papelera',
      mensaje: `La solicitud ${sol.numeroSolicitud} fue eliminada desde ${area} y archivada en la Papelera de Reciclaje.`
    });
  };

  const eliminarSolicitudAccesorios = (solicitudId: string, area: 'compras' | 'laboratorio') => {
    const sol = solicitudesAccesorios.find(s => s.id === solicitudId);
    if (!sol) return;

    const nombreUsuario = usuario?.displayName || usuario?.nombreUsuario || (area === 'compras' ? 'Compras' : 'Laboratorio');

    const itemPapelera: ItemPapelera = {
      id: `pap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tipo: 'accesorio',
      solicitudOriginalId: sol.id,
      numeroSolicitud: sol.numeroSolicitud || sol.id,
      fechaSolicitud: sol.fechaSolicitud || new Date().toISOString(),
      solicitante: sol.solicitante || 'Compras',
      proveedor: sol.proveedor || 'No especificado',
      cantidadItems: sol.muestras ? sol.muestras.length : 1,
      eliminadoPor: nombreUsuario,
      areaEliminacion: area,
      fechaEliminacion: new Date().toISOString(),
      motivo: `Eliminado desde el módulo de ${area}`,
      datosCompletos: sol
    };

    setPapelera(prev => [itemPapelera, ...prev]);
    setSolicitudesAccesorios(prev => prev.filter(s => s.id !== solicitudId));

    soundEffects.reproducir('alerta');
    dispararNotificacion({
      tipo: 'alerta',
      titulo: '🗑️ Solicitud enviada a la Papelera',
      mensaje: `La solicitud de insumos ${sol.numeroSolicitud} fue eliminada desde ${area} y archivada en la Papelera de Reciclaje.`
    });
  };

  const restaurarDePapelera = (itemId: string) => {
    const item = papelera.find(p => p.id === itemId);
    if (!item) return;

    if (item.tipo === 'tela') {
      const sol = item.datosCompletos as SolicitudTelasCompleta;
      setSolicitudesTelas(prev => {
        if (prev.some(s => s.id === sol.id)) return prev;
        return [sol, ...prev];
      });
    } else {
      const sol = item.datosCompletos as SolicitudAccesoriosCompleta;
      setSolicitudesAccesorios(prev => {
        if (prev.some(s => s.id === sol.id)) return prev;
        return [sol, ...prev];
      });
    }

    setPapelera(prev => prev.filter(p => p.id !== itemId));
    soundEffects.reproducir('aprobado');
    dispararNotificacion({
      tipo: 'aprobado',
      titulo: '✅ Solicitud Restaurada',
      mensaje: `La solicitud ${item.numeroSolicitud} fue restaurada exitosamente a su módulo correspondiente.`
    });
  };

  const eliminarPermanentePapelera = (itemId: string) => {
    const item = papelera.find(p => p.id === itemId);
    setPapelera(prev => prev.filter(p => p.id !== itemId));
    soundEffects.reproducir('alerta');
    dispararNotificacion({
      tipo: 'alerta',
      titulo: 'Elemento Eliminado',
      mensaje: `La solicitud ${item?.numeroSolicitud || ''} fue eliminada permanentemente.`
    });
  };

  const vaciarPapelera = () => {
    const total = papelera.length;
    setPapelera([]);
    soundEffects.reproducir('alerta');
    dispararNotificacion({
      tipo: 'alerta',
      titulo: 'Papelera Vaciada',
      mensaje: `Se eliminaron permanentemente ${total} registros de la papelera.`
    });
  };

  // =========================================================================
  // --- 🧵 MÉTODOS SOLICITUDES TELAS                                      ---
  // =========================================================================
  const agregarSolicitudTelas = (nueva: Omit<SolicitudTelasCompleta, 'id'>) => {
    const firma = obtenerFirmaSesion();

    // 🚫 Rechazar si alguna tela no cuenta con Ficha Técnica del Proveedor
    const telasSinFT = (nueva.telas || []).filter(t => {
      const tieneFT = 
        (t.fichaProveedor && (t.fichaProveedor.completadaPorProveedor || Boolean(t.fichaProveedor.tokenAcceso) || Boolean(t.fichaProveedor.composicionDeclarada))) ||
        Boolean(t.fichaTecnica) ||
        Boolean(t.archivoFichaTecnica) ||
        consultarFichaTecnicaHistorica(t.referencia, nueva.proveedor || t.proveedor) !== undefined;
      return !tieneFT;
    });

    if (telasSinFT.length > 0) {
      const listaRef = telasSinFT.map(t => t.referencia).join(', ');
      dispararNotificacion({
        tipo: 'alerta',
        titulo: '❌ Solicitud Rechazada - Falta Ficha Técnica',
        mensaje: `La tela "${listaRef}" NO cuenta con la Ficha Técnica del Proveedor. Se requiere cargar la ficha técnica antes de enviar a Laboratorio.`,
        areaDestino: 'compras',
        accionLabel: 'Ver Fichas'
      });
      return;
    }

    const solicitud: SolicitudTelasCompleta = {
      ...nueva,
      id: `sol-tel-${Date.now()}`,
      creadoPorFirma: firma
    };
    setSolicitudesTelas((prev) => [solicitud, ...prev]);
    firestoreGuardarSolicitudTelas(solicitud, firma.nombreCompleto, firma.rol as UserRole);

    registrarLogAuditoria(
      COLECCIONES.SOLICITUDES_TELAS,
      solicitud.id,
      'CREAR',
      firma.nombreCompleto,
      firma.rol as UserRole,
      `Solicitud de telas ${solicitud.numeroSolicitud} creada por ${firma.nombreCompleto} (${firma.area}).`,
      { firma, previousValue: null, newValue: solicitud.numeroSolicitud }
    );

    // 🔔 Alerta Animada con Sonido: Nueva Solicitud de Telas
    dispararNotificacion({
      tipo: 'solicitud',
      titulo: '🧵 Compras - Telas: Nueva Solicitud de Ensayo',
      mensaje: `Solicitud ${solicitud.numeroSolicitud} (${solicitud.telas?.length || 1} telas) enviada a Laboratorio - Telas por ${firma.nombreCompleto}.`,
      areaDestino: 'laboratorio',
      subseccion: 'telas',
      accionLabel: 'Ver en Laboratorio - Telas'
    });

    // 📧 Emisión de Correo Formal Automático a Laboratorio
    emitirNotificacionCorreoAutomatica({
      evento: 'SOLICITUD_COMPRAS_TELAS',
      solicitudId: solicitud.id,
      numeroSolicitud: solicitud.numeroSolicitud,
      tipo: 'telas',
      remitente: {
        nombre: firma.nombreCompleto,
        area: 'compras',
        cargo: firma.rolEspecifico || firma.rol
      },
      destinatario: {
        area: 'laboratorio',
        emailPrincipal: CORREOS_CORPORATIVOS_STF.laboratorio
      },
      proveedor: solicitud.proveedor,
      articulos: (solicitud.telas || []).map(t => ({
        referencia: t.referencia,
        descripcion: t.color ? `Tela color ${t.color}` : `Ref. ${t.referencia}`,
        observacion: t.observacion || 'Pendiente de ensayos técnicos'
      })),
      observacionesGenerales: solicitud.observacionesGenerales
    }).then(({ registro }) => {
      dispararNotificacion({
        tipo: 'solicitud',
        titulo: '📧 Correo Notificado a Laboratorio',
        mensaje: `Se generó correo formal corporativo para Laboratorio (${CORREOS_CORPORATIVOS_STF.laboratorio}) con enlace directo a la solicitud ${solicitud.numeroSolicitud}.`,
        areaDestino: 'laboratorio',
        subseccion: 'telas',
        accionLabel: 'Ver Correo Formal',
        onAccion: () => abrirVisorCorreo(registro)
      });
    }).catch(e => console.warn('Aviso de notificación correo:', e));
  };

  const enviarSolicitudTelasALaboratorio = (solicitudId: string) => {
    const firma = obtenerFirmaSesion();

    const solActual = solicitudesTelas.find(s => s.id === solicitudId);
    if (solActual) {
      const telasSinFT = solActual.telas.filter(t => {
        const tieneFT = 
          (t.fichaProveedor && (t.fichaProveedor.completadaPorProveedor || Boolean(t.fichaProveedor.tokenAcceso) || Boolean(t.fichaProveedor.composicionDeclarada))) ||
          Boolean(t.fichaTecnica) ||
          Boolean(t.archivoFichaTecnica) ||
          consultarFichaTecnicaHistorica(t.referencia, solActual.proveedor || t.proveedor) !== undefined;
        return !tieneFT;
      });

      if (telasSinFT.length > 0) {
        const listaRef = telasSinFT.map(t => t.referencia).join(', ');
        dispararNotificacion({
          tipo: 'alerta',
          titulo: '❌ Rechazado - Falta Ficha Técnica del Proveedor',
          mensaje: `No se pudo enviar la solicitud ${solActual.numeroSolicitud} a laboratorio: La tela "${listaRef}" no tiene Ficha Técnica del Proveedor.`,
          areaDestino: 'compras',
          subseccion: 'telas',
          accionLabel: 'Ver Fichas'
        });
        alert(`❌ RECHAZADO: La tela "${listaRef}" no cuenta con la Ficha Técnica del Proveedor. Debe cargarse previamente antes de transferir a laboratorio.`);
        return;
      }
    }

    setSolicitudesTelas((prev) =>
      prev.map((sol) => {
        if (sol.id !== solicitudId) return sol;
        const actualizada: SolicitudTelasCompleta = { 
          ...sol, 
          estadoFlujo: 'ENVIADA',
          recibidoPorFirma: firma
        };
        
        registrarLogAuditoria(
          COLECCIONES.SOLICITUDES_TELAS,
          solicitudId,
          'RECIBIR',
          firma.nombreCompleto,
          firma.rol as UserRole,
          `Solicitud ${sol.numeroSolicitud} transferida a Laboratorio por ${firma.nombreCompleto}.`,
          { firma, previousValue: sol.estadoFlujo, newValue: 'ENVIADA' }
        );

        // 🔔 Alerta Animada con Sonido al Enviar
        dispararNotificacion({
          tipo: 'solicitud',
          titulo: '🧵 Compras - Telas: Solicitud Transferida a Laboratorio',
          mensaje: `Solicitud ${sol.numeroSolicitud} (${sol.telas?.length || 1} telas) transferida a Laboratorio - Telas por ${firma.nombreCompleto}.`,
          areaDestino: 'laboratorio',
          subseccion: 'telas',
          accionLabel: 'Ver en Laboratorio - Telas'
        });

        // 📧 Emisión de Correo Formal Automático a Laboratorio
        emitirNotificacionCorreoAutomatica({
          evento: 'SOLICITUD_COMPRAS_TELAS',
          solicitudId: sol.id,
          numeroSolicitud: sol.numeroSolicitud,
          tipo: 'telas',
          remitente: {
            nombre: firma.nombreCompleto,
            area: 'compras',
            cargo: firma.rolEspecifico || firma.rol
          },
          destinatario: {
            area: 'laboratorio',
            emailPrincipal: CORREOS_CORPORATIVOS_STF.laboratorio
          },
          proveedor: sol.proveedor,
          articulos: (sol.telas || []).map(t => ({
            referencia: t.referencia,
            descripcion: t.color ? `Tela color ${t.color}` : `Ref. ${t.referencia}`,
            observacion: t.observacion || 'Transferida para análisis técnico'
          })),
          observacionesGenerales: sol.observacionesGenerales
        }).catch(e => console.warn('Aviso de notificación correo:', e));

        return actualizada;
      })
    );
  };

  const actualizarItemTelaLab = (
    solicitudId: string,
    itemId: string,
    datosActualizados: Partial<ItemMuestraTela>
  ) => {
    const firma = obtenerFirmaSesion();
    setSolicitudesTelas((prev) =>
      prev.map((sol) => {
        if (sol.id !== solicitudId) return sol;
        const telasActualizadas = sol.telas.map((t) => (t.id === itemId ? { ...t, ...datosActualizados, dictamenPorFirma: firma } : t));
        const dictamenes = telasActualizadas.map((t) => t.dictamen);
        let nuevoDictamenGlobal: DictamenType = 'APROBADO';
        if (dictamenes.includes('RECHAZADO')) nuevoDictamenGlobal = 'RECHAZADO';
        else if (dictamenes.includes('HALLAZGO')) nuevoDictamenGlobal = 'HALLAZGO';
        else if (dictamenes.includes('EN_PROCESO') || dictamenes.includes('PENDIENTE')) nuevoDictamenGlobal = 'EN_PROCESO';

        const solicitudModificada: SolicitudTelasCompleta = {
          ...sol,
          telas: telasActualizadas,
          dictamenGlobal: nuevoDictamenGlobal,
          estadoFlujo: (nuevoDictamenGlobal === 'EN_PROCESO' ? 'EN_PROCESO' : 'FINALIZADA'),
        };

        firestoreActualizarItemTela(solicitudId, itemId, datosActualizados, firma.nombreCompleto, firma.rol as UserRole);

        registrarLogAuditoria(
          COLECCIONES.SOLICITUDES_TELAS,
          solicitudId,
          'REGISTRAR_ENSAYO',
          firma.nombreCompleto,
          firma.rol as UserRole,
          `Ensayos de tela actualizados por ${firma.nombreCompleto} (${firma.rolEspecifico || firma.rol}).`,
          { firma, previousValue: 'EN_PROCESO', newValue: datosActualizados.dictamen || 'EN_PROCESO', itemId }
        );

        // 🔔 ALERTAS AUTOMÁTICAS CON SONIDO CUANDO LLEGAN A PATRONAJE Y CORTE
        if (datosActualizados.dictamen === 'APROBADO' || datosActualizados.dictamen === 'HALLAZGO') {
          const telaEvaluada = sol.telas.find(t => t.id === itemId);
          const refTela = telaEvaluada?.referencia || datosActualizados.referencia || 'Tela Evaluada';

          // 1. Alerta a Patronaje (Moldería & Compensación)
          dispararNotificacion({
            tipo: 'patronaje',
            titulo: '📐 ¡Nueva Alerta para Patronaje!',
            mensaje: `${refTela} evaluada en Laboratorio. Encogimientos registrados listos para cálculo de compensación de moldes base.`,
            areaDestino: 'patronaje',
            accionLabel: 'Ir a Patronaje'
          });

          // 2. Alerta a Corte (Control de Reposo & Matiz)
          setTimeout(() => {
            dispararNotificacion({
              tipo: 'corte',
              titulo: '✂️ ¡Nueva Alerta para Corte & Tendido!',
              mensaje: `${refTela} liberada por Laboratorio. Iniciar control de reposo textil (24-48h) y verificación de matiz entre rollos.`,
              areaDestino: 'corte',
              accionLabel: 'Ir a Corte'
            });
          }, 700);
        }

        return solicitudModificada;
      })
    );
  };

  const responderSolicitudTelas = (
    solicitudId: string,
    itemId: string,
    datosRespuesta: {
      resultadoLab: string;
      dictamen: DictamenType;
      fechaIngreso?: string;
      fechaEntrega?: string;
      fechaRespuestaLab?: string;
      responsableLab?: string;
      observacionesLabRespuesta?: string;
      evaluacionTecnica?: EvaluacionCompletaLaboratorioTela;
      fichaTecnicaUtilizada?: any;
    }
  ) => {
    const firma = obtenerFirmaSesion();
    setSolicitudesTelas((prev) =>
      prev.map((sol) => {
        if (sol.id !== solicitudId) return sol;
        const hoy = new Date().toISOString().split('T')[0];

        const telaPrincipal = sol.telas.find((t) => t.id === itemId);
        const dictamenAnterior = telaPrincipal?.dictamen || 'PENDIENTE';
        const esMuestraCompartida = sol.esMuestraCompartida || 
          telaPrincipal?.esMuestraCompartida || 
          /aplica\s*1\s*sola\s*muestra|misma\s*tela/i.test(telaPrincipal?.observacion || sol.observacionesGenerales || '');

        const telasActualizadas = sol.telas.map((t) => {
          if (t.id === itemId || (esMuestraCompartida && sol.telas.length > 1)) {
            return {
              ...t,
              resultadoLab: datosRespuesta.resultadoLab,
              dictamen: datosRespuesta.dictamen,
              fechaIngreso: datosRespuesta.fechaIngreso || t.fechaIngreso || hoy,
              fechaEntrega: datosRespuesta.fechaEntrega || t.fechaEntrega || hoy,
              fechaRevisionLab: hoy,
              fechaRespuestaLab: datosRespuesta.fechaRespuestaLab || hoy,
              responsableLab: firma.nombreCompleto || datosRespuesta.responsableLab || 'Laboratorista Textil',
              observacionesLabRespuesta: datosRespuesta.observacionesLabRespuesta,
              evaluacionTecnica: datosRespuesta.evaluacionTecnica,
              dictamenPorFirma: firma,
              fichaTecnicaUtilizada: datosRespuesta.fichaTecnicaUtilizada || t.fichaTecnicaUtilizada
            };
          }
          return t;
        });

        const dictamenes = telasActualizadas.map((t) => t.dictamen);
        let nuevoDictamenGlobal: DictamenType = 'APROBADO';
        if (dictamenes.includes('RECHAZADO')) nuevoDictamenGlobal = 'RECHAZADO';
        else if (dictamenes.includes('HALLAZGO')) nuevoDictamenGlobal = 'HALLAZGO';
        else if (dictamenes.includes('EN_PROCESO') || dictamenes.includes('PENDIENTE')) nuevoDictamenGlobal = 'EN_PROCESO';

        const solicitudModificada: SolicitudTelasCompleta = {
          ...sol,
          telas: telasActualizadas,
          dictamenGlobal: nuevoDictamenGlobal,
          estadoFlujo: 'FINALIZADA',
          dictamenPorFirma: firma
        };

        registrarLogAuditoria(
          COLECCIONES.SOLICITUDES_TELAS,
          solicitudId,
          'DICTAMEN_TECNICO',
          firma.nombreCompleto,
          firma.rol as UserRole,
          `Dictamen de Laboratorio emitido por ${firma.nombreCompleto} (${firma.rolEspecifico || firma.rol}): ${datosRespuesta.dictamen}.`,
          { firma, previousValue: dictamenAnterior, newValue: datosRespuesta.dictamen, itemId }
        );

        // 🔔 Disparar notificación a Compras
        dispararNotificacion({
          tipo: 'solicitud',
          titulo: `🔬 Dictamen de Laboratorio: ${sol.numeroSolicitud}`,
          mensaje: `Laboratorio (${firma.nombreCompleto}) emitió dictamen [${datosRespuesta.dictamen}] para "${sol.telas.find(t => t.id === itemId)?.referencia || 'tela'}". Compras debe decidir si procede con la compra.`,
          areaDestino: 'compras',
          accionLabel: 'Decidir Compra en Compras'
        });

        // 📧 Emisión de Correo Formal Automático a Compras
        emitirNotificacionCorreoAutomatica({
          evento: 'RESPUESTA_LAB_TELAS',
          solicitudId: sol.id,
          numeroSolicitud: sol.numeroSolicitud,
          tipo: 'telas',
          remitente: {
            nombre: firma.nombreCompleto,
            area: 'laboratorio',
            cargo: firma.rolEspecifico || firma.rol
          },
          destinatario: {
            area: 'compras',
            emailPrincipal: CORREOS_CORPORATIVOS_STF.compras
          },
          proveedor: sol.proveedor,
          dictamenGlobal: nuevoDictamenGlobal,
          responsableLab: firma.nombreCompleto,
          articulos: telasActualizadas.map(t => ({
            referencia: t.referencia,
            descripcion: t.color ? `Tela color ${t.color}` : `Ref. ${t.referencia}`,
            dictamen: t.dictamen,
            resultado: t.resultadoLab,
            observacion: t.observacionesLabRespuesta || (t.evaluacionTecnica ? `Encogimiento L: ${t.evaluacionTecnica.encogimientoLargo}%, A: ${t.evaluacionTecnica.encogimientoAncho}%` : 'Conforme a ensayos')
          })),
          observacionesGenerales: datosRespuesta.observacionesLabRespuesta || `Dictamen técnico emitido por ${firma.nombreCompleto}: [${datosRespuesta.dictamen}]`
        }).then(({ registro }) => {
          dispararNotificacion({
            tipo: 'solicitud',
            titulo: '📧 Correo Notificado a Compras',
            mensaje: `Se notificó por correo formal a Compras (${CORREOS_CORPORATIVOS_STF.compras}) con el dictamen de ${sol.numeroSolicitud}.`,
            areaDestino: 'compras',
            accionLabel: 'Ver Correo Formal',
            onAccion: () => abrirVisorCorreo(registro)
          });
        }).catch(e => console.warn('Aviso de notificación correo:', e));

        return solicitudModificada;
      })
    );
  };

  const registrarDecisionCompraTela = (
    solicitudId: string,
    itemId: string,
    decisionData: DecisionCompraTela
  ) => {
    const firma = obtenerFirmaSesion();
    const decisionConFirma: DecisionCompraTela = {
      ...decisionData,
      responsable: firma.nombreCompleto,
      decisionPorFirma: firma
    };

    setSolicitudesTelas((prev) =>
      prev.map((sol) => {
        if (sol.id !== solicitudId) return sol;
        const telaAfectada = sol.telas.find((t) => t.id === itemId);
        const decisionAnterior = telaAfectada?.decisionCompra?.decision || 'PENDIENTE';
        const refTela = telaAfectada?.referencia || 'Tela Evaluada';

        const telasActualizadas = sol.telas.map((t) => {
          if (t.id === itemId) {
            return {
              ...t,
              decisionCompra: decisionConFirma,
              decisionPorFirma: firma
            };
          }
          return t;
        });

        registrarLogAuditoria(
          COLECCIONES.SOLICITUDES_TELAS,
          solicitudId,
          'DECISION_FINAL',
          firma.nombreCompleto,
          firma.rol as UserRole,
          `Decisión comercial de Compras por ${firma.nombreCompleto}: ${decisionData.decision}. Motivo: ${decisionData.motivoDecision || 'N/A'}.`,
          { firma, previousValue: decisionAnterior, newValue: decisionData.decision, itemId }
        );

        // 🔔 SI SE COMPRA: Se emiten alertas funcionales a Patronaje y Corte
        if (decisionData.decision === 'COMPRAR') {
          if (decisionData.alertaPatronaje?.aplica !== false) {
            dispararNotificacion({
              tipo: 'patronaje',
              titulo: `📐 Alerta para Patronaje: ${refTela}`,
              mensaje: decisionData.alertaPatronaje?.descripcion || `Compra aprobada por ${firma.nombreCompleto}. Aplicar compensación de moldería según encogimientos de laboratorio.`,
              areaDestino: 'patronaje',
              accionLabel: 'Ir a Patronaje'
            });
          }

          if (decisionData.alertaCorte?.aplica !== false) {
            setTimeout(() => {
              dispararNotificacion({
                tipo: 'corte',
                titulo: `✂️ Alerta para Corte: ${refTela}`,
                mensaje: decisionData.alertaCorte?.descripcion || `Compra aprobada por ${firma.nombreCompleto}. Programar reposo textil de 24-48h y verificar sentido de tendido en mesa.`,
                areaDestino: 'corte',
                accionLabel: 'Ir a Corte'
              });
            }, 600);
          }
        } 
        // 🚫 SI NO SE COMPRA: El proceso llega hasta ahí y no avanza
        else if (decisionData.decision === 'NO_COMPRAR') {
          dispararNotificacion({
            tipo: 'alerta',
            titulo: `🚫 Compra No Aprobada: ${refTela}`,
            mensaje: `Compras (${firma.nombreCompleto}) decidió NO comprar la tela "${refTela}". Motivo: ${decisionData.motivoDecision || 'No conforme con requerimientos'}. El proceso finaliza aquí y no continúa.`,
            areaDestino: 'compras',
            accionLabel: 'Ver en Compras'
          });
        }

        return {
          ...sol,
          telas: telasActualizadas
        };
      })
    );
  };

  // =========================================================================
  // --- 🔩 MÉTODOS SOLICITUDES ACCESORIOS                                 ---
  // =========================================================================
  const agregarSolicitudAccesorios = (nueva: Omit<SolicitudAccesoriosCompleta, 'id'>) => {
    const firma = obtenerFirmaSesion();
    const solicitud: SolicitudAccesoriosCompleta = {
      ...nueva,
      id: `sol-acc-${Date.now()}`,
      creadoPorFirma: firma
    };
    setSolicitudesAccesorios((prev) => [solicitud, ...prev]);
    firestoreGuardarSolicitudAccesorios(solicitud, firma.nombreCompleto, firma.rol as UserRole);

    registrarLogAuditoria(
      COLECCIONES.SOLICITUDES_ACCESORIOS,
      solicitud.id,
      'CREAR',
      firma.nombreCompleto,
      firma.rol as UserRole,
      `Solicitud de accesorios ${solicitud.numeroSolicitud} creada por ${firma.nombreCompleto}.`,
      { firma, previousValue: null, newValue: solicitud.numeroSolicitud }
    );

    // 🔔 Alerta Animada con Sonido: Nueva Solicitud de Insumos
    dispararNotificacion({
      tipo: 'solicitud',
      titulo: '🔩 Compras - Insumos: Nueva Solicitud de Ensayo',
      mensaje: `Solicitud ${solicitud.numeroSolicitud} (${solicitud.muestras?.length || 1} insumos) enviada a Laboratorio - Insumos por ${firma.nombreCompleto}.`,
      areaDestino: 'laboratorio',
      subseccion: 'accesorios',
      accionLabel: 'Ver en Laboratorio - Insumos'
    });

    // 📧 Emisión de Correo Formal Automático a Laboratorio
    emitirNotificacionCorreoAutomatica({
      evento: 'SOLICITUD_COMPRAS_INSUMOS',
      solicitudId: solicitud.id,
      numeroSolicitud: solicitud.numeroSolicitud,
      tipo: 'insumos',
      remitente: {
        nombre: firma.nombreCompleto,
        area: 'compras',
        cargo: firma.rolEspecifico || firma.rol
      },
      destinatario: {
        area: 'laboratorio',
        emailPrincipal: CORREOS_CORPORATIVOS_STF.laboratorio
      },
      proveedor: solicitud.proveedor,
      articulos: (solicitud.muestras || []).map(m => ({
        referencia: m.referencia,
        descripcion: m.descripcionInsumo || 'Insumo de confección',
        observacion: m.observacion || 'Pendiente de inspección técnica'
      })),
      observacionesGenerales: solicitud.observacionesGenerales
    }).then(({ registro }) => {
      dispararNotificacion({
        tipo: 'solicitud',
        titulo: '📧 Correo Notificado a Laboratorio',
        mensaje: `Se notificó por correo formal a Laboratorio (${CORREOS_CORPORATIVOS_STF.laboratorio}) con la solicitud de insumos ${solicitud.numeroSolicitud}.`,
        areaDestino: 'laboratorio',
        subseccion: 'accesorios',
        accionLabel: 'Ver Correo Formal',
        onAccion: () => abrirVisorCorreo(registro)
      });
    }).catch(e => console.warn('Aviso de notificación correo:', e));
  };

  const enviarSolicitudAccesoriosALaboratorio = (solicitudId: string) => {
    const firma = obtenerFirmaSesion();
    setSolicitudesAccesorios((prev) =>
      prev.map((sol) => {
        if (sol.id !== solicitudId) return sol;
        const actualizada: SolicitudAccesoriosCompleta = { ...sol, estadoFlujo: 'ENVIADA', recibidoPorFirma: firma };
        
        // 🔔 Alerta Animada con Sonido al Enviar
        dispararNotificacion({
          tipo: 'solicitud',
          titulo: '🔩 Compras - Insumos: Solicitud Transferida a Laboratorio',
          mensaje: `Solicitud ${sol.numeroSolicitud} (${sol.muestras?.length || 1} insumos) transferida a Laboratorio - Insumos por ${firma.nombreCompleto}.`,
          areaDestino: 'laboratorio',
          subseccion: 'accesorios',
          accionLabel: 'Ver en Laboratorio - Insumos'
        });

        // 📧 Emisión de Correo Formal Automático a Laboratorio
        emitirNotificacionCorreoAutomatica({
          evento: 'SOLICITUD_COMPRAS_INSUMOS',
          solicitudId: sol.id,
          numeroSolicitud: sol.numeroSolicitud,
          tipo: 'insumos',
          remitente: {
            nombre: firma.nombreCompleto,
            area: 'compras',
            cargo: firma.rolEspecifico || firma.rol
          },
          destinatario: {
            area: 'laboratorio',
            emailPrincipal: CORREOS_CORPORATIVOS_STF.laboratorio
          },
          proveedor: sol.proveedor,
          articulos: (sol.muestras || []).map(m => ({
            referencia: m.referencia,
            descripcion: m.descripcionInsumo || 'Insumo de confección',
            observacion: m.observacion || 'Transferida formalmente'
          })),
          observacionesGenerales: sol.observacionesGenerales
        }).catch(e => console.warn('Aviso de notificación correo:', e));

        return actualizada;
      })
    );
  };

  const actualizarItemAccesorioLab = (
    solicitudId: string,
    itemId: string,
    datosActualizados: Partial<ItemMuestraAccesorio>
  ) => {
    const firma = obtenerFirmaSesion();
    setSolicitudesAccesorios((prev) =>
      prev.map((sol) => {
        if (sol.id !== solicitudId) return sol;

        const muestrasActualizadas = sol.muestras.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            ...datosActualizados,
            dictamenPorFirma: firma
          };
        });

        const dictamenes = muestrasActualizadas.map((m) => m.dictamen);
        let nuevoEstadoGlobal: DictamenType = 'APROBADO';
        if (dictamenes.includes('RECHAZADO')) nuevoEstadoGlobal = 'RECHAZADO';
        else if (dictamenes.includes('HALLAZGO')) nuevoEstadoGlobal = 'HALLAZGO';
        else if (dictamenes.includes('EN_PROCESO') || dictamenes.includes('PENDIENTE')) nuevoEstadoGlobal = 'EN_PROCESO';

        const solicitudModificada: SolicitudAccesoriosCompleta = {
          ...sol,
          muestras: muestrasActualizadas,
          estadoGlobal: nuevoEstadoGlobal,
          estadoFlujo: (nuevoEstadoGlobal === 'EN_PROCESO' ? 'EN_PROCESO' : 'FINALIZADA'),
        };

        firestoreActualizarItemAccesorio(solicitudId, itemId, datosActualizados, firma.nombreCompleto, firma.rol as UserRole);
        return solicitudModificada;
      })
    );
  };

  const actualizarDictamenSolicitudAccesorios = (solicitudId: string, dictamen: DictamenType) => {
    setSolicitudesAccesorios((prev) =>
      prev.map((sol) => (sol.id === solicitudId ? { ...sol, estadoGlobal: dictamen } : sol))
    );
  };

  const responderSolicitudAccesorios = (
    solicitudId: string,
    datosRespuesta: {
      observacionesLab?: string;
      responsable?: string;
      muestrasEvaluadas?: ItemMuestraAccesorio[];
    }
  ) => {
    const firma = obtenerFirmaSesion();
    setSolicitudesAccesorios((prev) =>
      prev.map((sol) => {
        if (sol.id !== solicitudId) return sol;
        const fechaActual = new Date().toISOString().split('T')[0];
        const muestrasFinales = datosRespuesta.muestrasEvaluadas || sol.muestras;

        const dictamenes = muestrasFinales.map((m) => m.dictamen);
        let nuevoEstadoGlobal: DictamenType = 'APROBADO';
        if (dictamenes.includes('RECHAZADO')) nuevoEstadoGlobal = 'RECHAZADO';
        else if (dictamenes.includes('HALLAZGO')) nuevoEstadoGlobal = 'HALLAZGO';
        else if (dictamenes.includes('EN_PROCESO') || dictamenes.includes('PENDIENTE')) nuevoEstadoGlobal = 'EN_PROCESO';

        const solicitudRespondida: SolicitudAccesoriosCompleta = {
          ...sol,
          muestras: muestrasFinales,
          estadoGlobal: nuevoEstadoGlobal,
          estadoFlujo: 'FINALIZADA',
          fechaRespuestaLab: fechaActual,
          responsableRespuestaLab: firma.nombreCompleto || datosRespuesta.responsable || 'Laboratorio Accesorios',
          observacionesLabRespuesta: datosRespuesta.observacionesLab || 'Respuesta técnica de laboratorio emitida exitosamente a Compras.',
          dictamenPorFirma: firma
        };

        firestoreGuardarSolicitudAccesorios(solicitudRespondida, firma.nombreCompleto, firma.rol as UserRole);

        registrarLogAuditoria(
          COLECCIONES.SOLICITUDES_ACCESORIOS,
          solicitudId,
          'DICTAMEN_TECNICO',
          firma.nombreCompleto,
          firma.rol as UserRole,
          `Respuesta de laboratorio de accesorios emitida por ${firma.nombreCompleto}: ${nuevoEstadoGlobal}.`,
          { firma, previousValue: sol.estadoGlobal, newValue: nuevoEstadoGlobal }
        );

        // 🔔 Alerta Animada con Sonido a Compras
        dispararNotificacion({
          tipo: 'solicitud',
          titulo: '🟢 Respuesta de Accesorios Enviada a Compras',
          mensaje: `Solicitud ${sol.numeroSolicitud} evaluada por ${firma.nombreCompleto}. Resultados disponibles para Compras.`,
          areaDestino: 'compras',
          accionLabel: 'Ver en Compras'
        });

        // 📧 Emisión de Correo Formal Automático a Compras
        emitirNotificacionCorreoAutomatica({
          evento: 'RESPUESTA_LAB_INSUMOS',
          solicitudId: sol.id,
          numeroSolicitud: sol.numeroSolicitud,
          tipo: 'insumos',
          remitente: {
            nombre: firma.nombreCompleto,
            area: 'laboratorio',
            cargo: firma.rolEspecifico || firma.rol
          },
          destinatario: {
            area: 'compras',
            emailPrincipal: CORREOS_CORPORATIVOS_STF.compras
          },
          proveedor: sol.proveedor,
          dictamenGlobal: nuevoEstadoGlobal,
          responsableLab: firma.nombreCompleto || datosRespuesta.responsable,
          articulos: muestrasFinales.map(m => ({
            referencia: m.referencia,
            descripcion: m.descripcionInsumo || 'Insumo de confección',
            dictamen: m.dictamen,
            resultado: m.resultado,
            observacion: m.observacion || 'Conforme a estándar técnico de insumos'
          })),
          observacionesGenerales: datosRespuesta.observacionesLab || `Dictamen emitido por ${firma.nombreCompleto}: [${nuevoEstadoGlobal}]`
        }).then(({ registro }) => {
          dispararNotificacion({
            tipo: 'solicitud',
            titulo: '📧 Correo Notificado a Compras',
            mensaje: `Se notificó por correo formal a Compras (${CORREOS_CORPORATIVOS_STF.compras}) con el dictamen de insumos ${sol.numeroSolicitud}.`,
            areaDestino: 'compras',
            accionLabel: 'Ver Correo Formal',
            onAccion: () => abrirVisorCorreo(registro)
          });
        }).catch(e => console.warn('Aviso de notificación correo:', e));

        return solicitudRespondida;
      })
    );
  };

  // =========================================================================
  // --- 🧑‍🔬 MÓDULO DE USUARIOS DE LABORATORIO (4 ANALISTAS & PIN RÁPIDO)    ---
  // =========================================================================
  const cambiarAnalistaConPin = (analistaId: string, pinIngresado: string) => {
    const target = analistas.find(a => a.id === analistaId);
    if (!target) {
      return { exito: false, mensaje: 'El analista seleccionado no existe.' };
    }
    if (target.pinAcceso !== pinIngresado.trim()) {
      soundEffects.reproducir('alerta');
      return { exito: false, mensaje: 'PIN de 4 dígitos incorrecto. Verifica e intenta de nuevo.' };
    }
    setAnalistaActivo(target);
    try {
      localStorage.setItem('stf_analista_activo_id', target.id);
    } catch {}
    soundEffects.reproducir('aprobado');
    dispararNotificacion({
      tipo: 'solicitud',
      titulo: `👤 Operador Activo: ${target.nombreCompleto}`,
      mensaje: `Especialidad: ${target.cargoEspecialidad}`,
      areaDestino: 'laboratorio'
    });
    return { exito: true, mensaje: `Analista cambiado exitosamente a ${target.nombreCompleto}` };
  };

  const obtenerSelloResponsable = (): SelloResponsable => {
    const now = new Date();
    const fechaFormat = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaFormat = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    return {
      nombreAnalista: analistaActivo.nombreCompleto,
      cargo: analistaActivo.cargoEspecialidad,
      fechaHoraEmision: `${fechaFormat} - ${horaFormat}`,
      pinValidado: true
    };
  };

  const crearAnalista = (datos: Omit<AnalistaLaboratorio, 'id'>) => {
    const nuevo: AnalistaLaboratorio = {
      ...datos,
      id: `analista-${Date.now()}`,
      activo: true
    };
    setAnalistas(prev => [...prev, nuevo]);
    dispararNotificacion({
      titulo: 'Perfil Creado',
      mensaje: `Se ha registrado el perfil de ${nuevo.nombreCompleto} (${nuevo.cargoEspecialidad}).`,
      tipo: 'aprobado'
    });
  };

  const actualizarAnalista = (analistaActualizado: AnalistaLaboratorio) => {
    setAnalistas(prev => prev.map(a => a.id === analistaActualizado.id ? analistaActualizado : a));
    if (analistaActivo.id === analistaActualizado.id) {
      setAnalistaActivo(analistaActualizado);
    }
    dispararNotificacion({
      titulo: 'Perfil Actualizado',
      mensaje: `Credenciales de ${analistaActualizado.nombreCompleto} actualizadas.`,
      tipo: 'aprobado'
    });
  };

  const eliminarAnalista = (id: string) => {
    if (analistas.length <= 1) {
      dispararNotificacion({
        titulo: 'Acción No Permitida',
        mensaje: 'Debe haber al menos 1 perfil activo en el sistema.',
        tipo: 'alerta'
      });
      return;
    }
    setAnalistas(prev => prev.filter(a => a.id !== id));
    if (analistaActivo.id === id) {
      const siguiente = analistas.find(a => a.id !== id) || ANALISTAS_PREDETERMINADOS[0];
      setAnalistaActivo(siguiente);
    }
    dispararNotificacion({
      titulo: 'Perfil Removido',
      mensaje: 'El perfil de usuario fue eliminado correctamente.',
      tipo: 'alerta'
    });
  };

  // --- MÓDULO FORROS Y COSTURAS (PIPIN VS SHIPPING - ACCIONES) ---

  const agregarEvaluacionForrosCosturas = (datos: Omit<EvaluacionForrosCosturas, 'id' | 'codigoReporte' | 'createdAt' | 'updatedAt'>): EvaluacionForrosCosturas => {
    const nuevoId = `fc-${Date.now()}`;
    const consecutivo = (evaluacionesForrosCosturas.length + 1).toString().padStart(3, '0');
    const codigoReporte = `RPT-FC-2026-${consecutivo}`;
    const fecha = new Date().toISOString().split('T')[0];

    const nuevaItem: EvaluacionForrosCosturas = {
      ...datos,
      id: nuevoId,
      codigoReporte,
      createdAt: fecha,
      updatedAt: fecha
    };

    setEvaluacionesForrosCosturas(prev => [nuevaItem, ...prev]);
    soundEffects.reproducir('solicitud');
    dispararNotificacion({
      titulo: '🪡 Nueva Evaluación de Forros y Costuras',
      mensaje: `Reporte ${codigoReporte} creado para la referencia "${datos.referencia}".`,
      tipo: 'solicitud'
    });

    return nuevaItem;
  };

  const actualizarEvaluacionForrosCosturas = (id: string, datos: Partial<EvaluacionForrosCosturas>) => {
    const fecha = new Date().toISOString().split('T')[0];
    setEvaluacionesForrosCosturas(prev => prev.map(item => item.id === id ? { ...item, ...datos, updatedAt: fecha } : item));
    dispararNotificacion({
      titulo: '✏️ Evaluación Actualizada',
      mensaje: `Los datos del reporte de forros y costuras han sido guardados.`,
      tipo: 'solicitud'
    });
  };

  const eliminarEvaluacionForrosCosturas = (id: string) => {
    setEvaluacionesForrosCosturas(prev => prev.filter(item => item.id !== id));
  };

  const enviarCorreoReporteForrosCosturas = (id: string, destinatario: string, asunto: string, cuerpo: string) => {
    const fechaEnvio = new Date().toLocaleString('es-CO');
    const nuevoCorreo = {
      id: `mail-${Date.now()}`,
      destinatario,
      asunto,
      cuerpo,
      fechaEnvio,
      enviadoPor: analistaActivo?.nombreCompleto || 'Ingeniero de Calidad'
    };

    setEvaluacionesForrosCosturas(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          correosEnviados: [...(item.correosEnviados || []), nuevoCorreo]
        };
      }
      return item;
    }));

    soundEffects.reproducir('aprobado');
    dispararNotificacion({
      titulo: '📧 Correo Enviado Exitosamente',
      mensaje: `Reporte enviado a ${destinatario} con asunto "${asunto}".`,
      tipo: 'aprobado'
    });
  };

  return (
    <QualityContext.Provider
      value={{
        analistas,
        analistaActivo,
        cambiarAnalistaConPin,
        obtenerSelloResponsable,
        crearAnalista,
        actualizarAnalista,
        eliminarAnalista,
        muestras,
        muestrasFiltradas,
        areaActual,
        setAreaActual,
        subseccionLaboratorio,
        setSubseccionLaboratorio,
        subseccionCompras,
        setSubseccionCompras,
        navegarA,
        pendientesLabTelas,
        pendientesLabInsumos,
        pendientesLabTotal,
        totalComprasTelas,
        totalComprasInsumos,
        filtros,
        setFiltros,
        resetearFiltros,
        muestraSeleccionada,
        setMuestraSeleccionada,
        modalFichaAbierto,
        setModalFichaAbierto,
        modalNuevaMuestraAbierto,
        setModalNuevaMuestraAbierto,
        modalImportarAbierto,
        setModalImportarAbierto,
        modalAlertasLeadTimeAbierto,
        setModalAlertasLeadTimeAbierto,
        modalSelectorAreaAbierto,
        setModalSelectorAreaAbierto,
        actualizarDictamenArea,
        agregarMuestra,
        actualizarMuestra,
        eliminarMuestra,
        importarMuestrasMasivas,
        restablecerDatosIniciales,
        limpiarTodosLosDatos,
        kpis,
        rankingCausas,
        calidadProveedores,
        listaProveedoresUnicos,
        listaMarcasUnicas,
        solicitudesTelas,
        agregarSolicitudTelas,
        enviarSolicitudTelasALaboratorio,
        actualizarItemTelaLab,
        responderSolicitudTelas,
        registrarDecisionCompraTela,
        solicitudesAccesorios,
        agregarSolicitudAccesorios,
        enviarSolicitudAccesoriosALaboratorio,
        actualizarItemAccesorioLab,
        actualizarDictamenSolicitudAccesorios,
        responderSolicitudAccesorios,
        fichasTecnicasHistorial,
        consultarFichaTecnicaHistorica,
        guardarFichaTecnica,
        guardarFichaTecnicaProveedor,
        importarFichasTecnicasExcel,
        limpiarBaseDatosFichas,
        notificacionesActivas,
        dispararNotificacion,
        eliminarNotificacion,
        evaluacionesForrosCosturas,
        agregarEvaluacionForrosCosturas,
        actualizarEvaluacionForrosCosturas,
        eliminarEvaluacionForrosCosturas,
        enviarCorreoReporteForrosCosturas,
        modalPapeleraAbierto,
        setModalPapeleraAbierto,
        correoModal,
        modalCorreoAbierto,
        abrirVisorCorreo,
        cerrarVisorCorreo,
        papelera,
        eliminarSolicitudTelas,
        eliminarSolicitudAccesorios,
        restaurarDePapelera,
        eliminarPermanentePapelera,
        vaciarPapelera,
        googleConfig,
        actualizarGoogleConfig,
        probarConexionGoogleActiva,
        inicializarEstructuraGoogleActiva,
        sincronizarConGoogleManual,
        sincronizarFichasGoogleManual,
        sincronizarForrosGoogleManual,
        sincronizarTodoMasterManual,
        sincronizandoGoogle
      }}
    >
      {children}
    </QualityContext.Provider>
  );
};

export const useQuality = (): QualityContextType => {
  const context = useContext(QualityContext);
  if (!context) {
    throw new Error('useQuality debe usarse dentro de un QualityProvider');
  }
  return context;
};
