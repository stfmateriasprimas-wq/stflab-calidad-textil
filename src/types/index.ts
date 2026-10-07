export type AreaType = 
  | 'dashboard' 
  | 'portal-proveedor'
  | 'homologacion'
  | 'laboratorio' 
  | 'patronaje' 
  | 'corte' 
  | 'compras'
  | 'compras-decision'
  | 'biblioteca'
  | 'chat'
  | 'configuracion'
  | 'indicadores'
  | 'documentos'
  | 'soporte-tecnico';

export type DictamenType = 'APROBADO' | 'HALLAZGO' | 'RECHAZADO' | 'EN_PROCESO' | 'PENDIENTE';

export type EstadoEtapa = 'COMPLETO' | 'EN_PROCESO' | 'PENDIENTE' | 'BLOQUEADO' | 'NO_APLICA';

export type MarcaType = 'Studio F' | 'ELA' | 'Studio F Men' | 'Outlet' | 'Otras marcas';

export interface ParametroEnsayo<T = number> {
  valor: T;
  unidad?: string;
  tolerancia?: string | number;
  norma?: string;
  resultado?: 'CONFORME' | 'NO_CONFORME' | 'OBSERVACION';
  observacion?: string;
}

export interface AnalistaLaboratorio {
  id: string;
  nombreCompleto: string;
  cargoEspecialidad: string;
  correoUsuario: string;     // Credencial Usuario / Correo (ej: maria.lopez@stfgroup.com)
  pinAcceso: string;          // Credencial PIN de acceso rápido (4 dígitos, ej: "1234")
  avatarUrl?: string;
  activo?: boolean;
}

export interface SelloResponsable {
  nombreAnalista: string;
  cargo: string;
  fechaHoraEmision: string; // ej: "07/09/2026 - 10:15 AM"
  pinValidado: boolean;
}

export interface RegistroEdicionAudit {
  id: string;
  fechaHora: string;
  analistaNombre: string;
  analistaCargo: string;
  tipoAccion: 'CREACION' | 'MODIFICACION' | 'DICTAMEN_EMITIDO';
  detalle: string;
  cambios?: string;
}

// 1. Ficha Técnica Declarada por el Proveedor (Portal con Token)
export interface FichaTecnicaDeclaradaProveedor {
  tokenAcceso: string; // ej: '#FT-2026-9812'
  completadaPorProveedor: boolean;
  fechaCarga?: string;
  contactoProveedor?: string;
  composicionDeclarada?: string;
  anchoTotalM?: number;
  anchoUtilM?: number;
  gramajeGsm?: number;
  encogimientoLargoEstimado?: number;
  encogimientoAnchoEstimado?: number;
  viroEstimado?: number;
  solidezLavadoEstimada?: number;
  solidezFroteEstimada?: number;
  observacionesFabricante?: string;
  nombreArchivoAdjunto?: string;
}

// 2. Ficha Técnica Maestra STF Group (Estándar de Homologación)
export interface FichaTecnicaMaestraSTF {
  gramajeObjetivo: number;
  toleranciaGramajePorc: number; // ej: 5 (%)
  encogimientoLargoMax: number;   // ej: -3.0 (%)
  encogimientoAnchoMax: number;   // ej: -3.5 (%)
  viroMax: number;                // ej: 3.0 (%)
  solidezLavadoMin: number;       // ej: 4.0
  solidezFroteSecoMin: number;    // ej: 4.0
  solidezFroteHumedoMin: number;  // ej: 3.0
  anchoMinimoM: number;
}

// 2.1 Resultado de Homologación
export interface HomologacionComparativa {
  estado: 'APROBADA' | 'OBSERVADA' | 'RECHAZADA' | 'PENDIENTE';
  fechaHomologacion?: string;
  responsable?: string;
  observaciones?: string;
  diferenciasDetectadas: string[];
}

// Estados de ciclo de vida de la Solicitud enviada por Compras
export type EstadoSolicitudFlujo = 'BORRADOR' | 'ENVIADA' | 'RECIBIDA' | 'EN_PROCESO' | 'FINALIZADA';

// 3.1 Modelos específicos para Solicitudes de Compras y Evaluación Técnica de Laboratorio en Telas
export interface ValorComparativoFTLab {
  esperadoFT?: number | string;
  medidoLab: number | string;
  unidad: string;
  norma: string;
  cumple?: boolean;
  desviacion?: string;
}

export interface EvaluacionCompletaLaboratorioTela {
  // 1. Datos de Identificación y Trazabilidad
  codigoMuestra: string;
  codigoMT: string;
  referencia: string;
  proveedor: string;
  numeroLote: string;
  numeroRollo: string;
  color: string;
  composicion: string;
  tipoTejido: 'Punto' | 'Plano' | 'Índigo / Denim';
  paisOrigen: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fechaIngreso: string;
  fotografiaUrl?: string;

  // 2. Ensayos Físicos y Dimensionales (Normas NTC / AATCC / ASTM)
  anchoUtil: ValorComparativoFTLab;
  anchoTotal: ValorComparativoFTLab;
  gramaje: ValorComparativoFTLab;
  pesoLineal: ValorComparativoFTLab;
  rendimiento: ValorComparativoFTLab;
  encogimientoAncho: ValorComparativoFTLab;
  encogimientoLargo: ValorComparativoFTLab;
  elongacionAncho: ValorComparativoFTLab;
  elongacionLargo: ValorComparativoFTLab;
  recuperacionElasticidad: ValorComparativoFTLab;
  desviacionTrama: ValorComparativoFTLab;
  torqueViroPierna: ValorComparativoFTLab;

  // 3. Ensayos Mecánicos y de Resistencia
  resistenciaTension: ValorComparativoFTLab;
  resistenciaDesgarre: ValorComparativoFTLab;
  deslizamientoCostura: ValorComparativoFTLab;
  resistenciaPilling: ValorComparativoFTLab;

  // 4. Solideces y Comportamiento de Color
  solidezLavadoDomestico: ValorComparativoFTLab;
  solidezFroteSeco: ValorComparativoFTLab;
  solidezFroteHumedo: ValorComparativoFTLab;
  cambioColor: ValorComparativoFTLab;
  aptitudFroteCombinacion: 'APTO PARA COMBINAR' | 'SUELTA COLOR CON LA FRICCIÓN' | 'NINGUNO';
  pruebaFusionado: {
    resultado: 'CONFORME' | 'NO_CONFORME';
    norma: string;
    temperaturaC?: number;
    observacion?: string;
  };

  // 5. Campos Específicos para Índigos / Denim y Desengome
  anchoTotalDesengome?: ValorComparativoFTLab;
  anchoUtilDesengome?: ValorComparativoFTLab;
  pesoGsmDesengome?: ValorComparativoFTLab;
  pesoGmlDesengome?: ValorComparativoFTLab;
  lavadoSugerido?: string;

  // Header / Document Metadata (DMP-F-001 V01-2021)
  shp?: string;
  codigoMaterial?: string;
  importacion?: string;
  consecutivoEnsayo?: string;
  loteProveedor?: string;
  rollo?: string;
  muestraFisicaPegada?: boolean;

  // Checkboxes oficiales del formato
  tieneFichaTecnica?: boolean;
  conformeFT: boolean;
  conformePLM: boolean;
  solidezAdecuadaCombinar?: boolean;
  sueltaColorFriccion?: boolean;
  dictamenFinal: DictamenType;
  observacionesRecomendaciones: string;

  // Matriz de Tintorería y Solideces (Página 2 - DMP-F-001)
  evaluacionTintoreria?: {
    solidezFroteSeco?: { norma: string; requerimiento: string; valorMedido: string; cumple: boolean };
    solidezFroteHumedo?: { norma: string; requerimiento: string; valorMedido: string; cumple: boolean };
    solidezLavadoDomestico?: { norma: string; requerimiento: string; valorMedido: string; cumple: boolean };
    solidezLavado2A?: { norma: string; requerimiento: string; valorMedido: string; cumple: boolean };
    cambioColorPostLavado?: { norma: string; requerimiento: string; valorMedido: string; cumple: boolean };
    aptoCombinarPrendas?: string; // ej: "NO - REQUIERE PRECAUCIÓN DE LAVADO" o "SÍ - APTO PARA COMBINAR"
    comportamientoFrote?: string; // ej: "SOLIDEZ ESTABLE AL FROTE"
    matrizRollos?: Array<{
      rolloNo: string;
      loteTintoreria: string;
      tonoEvaluado: string;
      deltaE: string;
      dictamenRollo: 'APROBADO' | 'RECHAZADO' | 'TOLERABLE';
    }>;
  };
}

export interface AlertaFuncionalArea {
  aplica: boolean;
  titulo: string;
  descripcion: string;
  detallesTecnicos?: Record<string, any>;
  nivelAlerta?: 'CRITICA' | 'PRECAUCION' | 'INFORMATIVA';
}

export interface DecisionCompraTela {
  decision: 'PENDIENTE' | 'COMPRAR' | 'NO_COMPRAR';
  fechaDecision?: string;
  responsable?: string;
  motivoDecision?: string;
  descuentoNegociadoPorc?: number;
  alertaPatronaje?: AlertaFuncionalArea;
  alertaCorte?: AlertaFuncionalArea;
  alertasGenerales?: string;
  decisionPorFirma?: FirmaAuditoriaSesion;
}

export interface ItemMuestraTela {
  id: string;               // ID único e independiente para cada tela/muestra
  solicitudCompra: string;  // Solicitud de compra (ej: SC-2026-091)
  referencia: string;       // Referencia (ej: LINO MOURA, CREPE VICTORIA)
  color: string;            // Color (ej: 045 CRUDO, INDIGO)
  proveedor: string;        // Proveedor (ej: SHANGHAI JOY TEX)
  ocCol: string;            // #OC COL (ej: OAC 1107)
  observacion: string;      // Observación (ej: "APLICA 1 SOLA MUESTRA PARA LAS DOS, ES LA MISMA TELA")
  esMuestraCompartida?: boolean; // True si 1 sola muestra aplica para dos o más solicitudes/órdenes
  solicitudesVinculadas?: string[]; // ej: ["SF_TEL_005941", "SF_TEL_005942"]
  ordenesCompraVinculadas?: string[]; // ej: ["106782", "106783"]
  notaMismaTela?: string;   // ej: "APLICA 1 SOLA MUESTRA PARA LAS DOS, ES LA MISMA TELA"
  incompleto?: boolean;     // True si falta alguno de los 5 campos obligatorios
  motivoIncompleto?: string;// Lista de campos obligatorios faltantes
  muestraFisicaNumero?: number; // Número consecutivo de muestra física
  etiquetaMuestraFisica?: string; // Etiqueta descriptiva (ej: "Muestra 1", "Muestra 1 (Compartida)")
  resultadoLab?: string;    // Resultado emitido por Laboratorio (texto libre)
  dictamen?: DictamenType;  // Dictamen de Laboratorio (APROBADO, RECHAZADO, HALLAZGO, etc.)
  fechaIngreso?: string;
  fechaEntrega?: string;
  fechaRevisionLab?: string;
  fechaRespuestaLab?: string;
  responsableLab?: string;
  observacionesLabRespuesta?: string;
  evaluacionTecnica?: EvaluacionCompletaLaboratorioTela; // Evaluación técnica detallada de los 6 bloques
  decisionCompra?: DecisionCompraTela; // Decisión Comercial de Compras tras dictamen de Laboratorio
  fichaProveedor?: FichaTecnicaDeclaradaProveedor; // Ficha Técnica declarada por el Proveedor
  fichaTecnica?: any;
  archivoFichaTecnica?: any;
  dictamenPorFirma?: FirmaAuditoriaSesion;
  decisionPorFirma?: FirmaAuditoriaSesion;
  fichaTecnicaUtilizada?: {
    id: string;
    codigoFT: string;
    version: number;
    referencia: string;
    proveedor: string;
    referenciaProveedor?: string;
    fechaVersion: string;
    fechaUso?: string;
    usuarioUso?: string;
  };
}

// Solicitud integral de Compras-Telas (puede contener 1 o varias telas)
export interface SolicitudTelasCompleta {
  id: string;
  numeroSolicitud: string;  // ej: SOL-TEL-2026-01
  fechaSolicitud: string;
  solicitante: string;      // ej: Compras - Telas
  proveedor: string;
  ordenCompra?: string;
  esMuestraCompartida?: boolean; // True si aplica 1 sola muestra para múltiples solicitudes por ser la misma tela
  solicitudesVinculadas?: string[];
  ordenesCompraVinculadas?: string[];
  notaMismaTela?: string;
  observacionesGenerales?: string;
  estadoFlujo: EstadoSolicitudFlujo; // Borrador -> Enviada -> Recibida -> En proceso -> Finalizada
  documentoOriginal?: {
    nombreArchivo?: string;
    tipoArchivo: 'EXCEL' | 'IMAGEN' | 'TEXTO' | 'MANUAL';
    urlData?: string;
    contenidoTexto?: string;
  };
  telas: ItemMuestraTela[]; // Lista de telas contenidas en esta solicitud
  totalTelas: number;
  dictamenGlobal?: DictamenType;
  creadoPorFirma?: FirmaAuditoriaSesion;
  recibidoPorFirma?: FirmaAuditoriaSesion;
  dictamenPorFirma?: FirmaAuditoriaSesion;
  trazabilidadAuditoria?: AuditLogEntry[];
}

export type SolicitudCompraTela = ItemMuestraTela;

export interface ReporteSeguimientoAccion {
  id?: string;
  fecha: string;
  responsable: string;
  accionDecision: string;
  estado: 'Abierto' | 'En proceso' | 'Cerrado';
  fechaCierre: string;
  observaciones: string;
}

export interface ReporteEvaluacionInsumoData {
  id?: string;
  solicitudId: string;
  numeroSolicitud: string;
  itemId: string;
  
  // Encabezado
  etapaMuestra: 'PP' | 'SHP' | 'MI';
  proveedor: string;
  oc: string;
  origen: string;
  fechaRecibidoContraMuestra: string;

  // 1. INFORMACIÓN DEL INSUMO Y PROVEEDOR
  fechaRecepcion: string;
  referencia: string;
  nombreInsumo: string;
  loteOC: string;
  cantidadRevisada: string | number;
  fechaRevision: string;
  fechaEntrega: string;

  muestraFisicaAprobada: string;
  colorTono: string;
  cantidadRecibida: string | number;
  unidadMedida: 'Metros' | 'Unidades' | 'Kg' | string;
  tallas: string;
  fichaTecnicaProveedor: string;

  // 2. CLASIFICACIÓN DEL DEFECTO / HALLAZGO
  defectos: {
    solidez: boolean;
    diferenciaColorTono: boolean;
    defectosTejeduriaTrama: boolean;
    insumoTrozadoQuebrado: boolean;
    insumoNoConcuerdaMuestraFisica: boolean;
    incompleto: boolean;
    durezaFirmeza: boolean;
    medidaAnchoLargo: boolean;
    medidaAncho?: string;
    medidaLargo?: string;
    manchasCintasImpurezas: boolean;
    aparienciaSinRayonesDeformaciones: boolean;
    resistenciaCalidadDeficiente: boolean;
    otro: boolean;
    otroTexto?: string;
  };

  // 3. DESCRIPCIÓN DETALLADA DEL PRODUCTO & HALLAZGOS
  descripcionDetallada: string;
  hallazgos: string;

  // 4. REGISTRO FOTOGRÁFICO / MUESTRA FÍSICO-VISUAL
  registroFotografico?: string[];

  // 5. CALIFICACIÓN DEL INSUMO
  calificacion: 'Aprobado' | 'APROBADO CON NOVEDAD' | 'No aprobado' | 'Otro';
  calificacionOtroTexto?: string;

  // 6. SEGUIMIENTO Y ACCIONES
  seguimientoAcciones: ReporteSeguimientoAccion[];

  // 7. CONTROL
  control: {
    elaboroReviso: {
      nombre: string;
      cargo: string;
      fecha: string;
    };
    notificadoA1: {
      nombre: string;
      cargo: string;
      fecha: string;
    };
    notificadoA2: {
      nombre: string;
      cargo: string;
      fecha: string;
    };
  };
}

// Muestra individual dentro de una solicitud de accesorios
export interface ItemMuestraAccesorio {
  id: string;               // ID único e irrepetible para cada muestra individual
  referencia: string;       // Referencia (ej: MI00409922, MI00412518)
  color: string;            // Color (ej: 000, 71, 280)
  talla: string;            // Talla (ej: 6, U, 24L, 18cm)
  qty: number | string;     // QTY (ej: 1, 500, 15000)
  descripcionInsumo?: string; // Descripción del insumo
  resultado?: string;       // Texto de resultado de Laboratorio (ej: "OK", "NO OK", "AJUSTE DEFICIENTE CON UN SELLADO DEBIL...")
  observacion?: string;     // Observación técnica detallada de Laboratorio
  fechaIngreso: string;     // Fecha de ingreso / recepción
  fechaRevision?: string;   // Fecha de revisión en laboratorio
  fechaEntrega?: string;    // Fecha de entrega / respuesta a Compras
  dictamen: DictamenType;   // Dictamen: APROBADO (OK), HALLAZGO (OK CON OBSERVACIÓN), RECHAZADO (NO OK), EN_PROCESO, PENDIENTE
  estadoAccesorio?: 'SOLICITADA' | 'RECIBIDA' | 'EN REVISIÓN' | 'PENDIENTE' | 'OK' | 'NO OK' | 'OK CON OBSERVACIÓN' | 'ENTREGADA';
  incompleto?: boolean;     // True si faltan campos en la secuencia de 4 columnas (REFERENCIA, COLOR, TALLA, QYT)
  motivoIncompleto?: string;// Detalle de los campos faltantes o advertencia
  responsableLab?: string;  // Usuario de laboratorio que evaluó
  accion?: string;          // Acción recomendada
  dictamenPorFirma?: FirmaAuditoriaSesion;
  
  // Respuestas individuales y reporte oficial de calidad
  respondidoACompras?: boolean;
  fechaRespuestaACompras?: string;
  reporteEvaluacion?: ReporteEvaluacionInsumoData;
}

// Solicitud integral de Compras-Accesorios que agrupa múltiples muestras
export interface SolicitudAccesoriosCompleta {
  id: string;
  numeroSolicitud: string;  // ej: ACC-00025, ACC-00001
  fechaSolicitud: string;
  solicitante: string;      // ej: Compras - Accesorios
  proveedor?: string;
  prioridad?: 'Alta' | 'Media' | 'Baja';
  observacionesGenerales?: string;
  estadoFlujo: EstadoSolicitudFlujo; // Borrador -> Enviada -> Recibida -> En proceso -> Finalizada
  documentoOriginal?: {
    nombreArchivo?: string;
    tipoArchivo: 'EXCEL' | 'IMAGEN' | 'TEXTO' | 'MANUAL';
    urlData?: string;       // Imagen en base64 o archivo adjunto
    contenidoTexto?: string;// Contenido crudo original
  };
  muestras: ItemMuestraAccesorio[]; // Lista de todas las muestras independientes
  estadoGlobal: DictamenType;
  totalMuestras: number;
  fechaRecepcionLab?: string;
  fechaRespuestaLab?: string;
  responsableRespuestaLab?: string;
  observacionesLabRespuesta?: string;
  creadoPorFirma?: FirmaAuditoriaSesion;
  recibidoPorFirma?: FirmaAuditoriaSesion;
  dictamenPorFirma?: FirmaAuditoriaSesion;
  trazabilidadAuditoria?: AuditLogEntry[];
}

export type ItemAccesorioLab = ItemMuestraAccesorio;

// 3.2 Repositorio Histórico de Fichas Técnicas (Independiente de Compras)
export interface FichaTecnicaHistorica {
  id: string;
  codigoFT: string;         // ej: FT-000125, #FT-2026-0841
  referencia: string;       // ej: CREPE VICTORIA, LINO MOURA
  proveedor: string;        // ej: XYZ, SHANGHAI JOY TEX
  fechaCarga: string;
  contactoProveedor?: string;
  composicion: string;
  gramajeDeclaradoGsm: number;
  anchoUtilM: number;
  encogimientoLargoMax: number;
  encogimientoAnchoMax: number;
  viroMax: number;
  solidezLavadoMin: number;
  solidezFroteSecoMin: number;
  solidezFroteHumedoMin: number;
  observacionesFabricante?: string;
  nombreArchivoFT?: string;
}

// 3.3 Ensayos de Laboratorio Telas & Accesorios
export interface EnsayosAccesorios {
  aplicaAccesorios: boolean;
  tipoAccesorio?: 'Botón Zamak' | 'Cremallera / Cierre' | 'Elástico' | 'Herraje / Remache' | 'Hilo de Confección';
  traccionBotonN?: ParametroEnsayo<number>;        // Fuerza tracción (N) [NTC 2439]
  resistenciaCremalleraN?: ParametroEnsayo<number>;// Fuerza cierre (N) [ASTM D2061]
  oxidacionSalinaHoras?: ParametroEnsayo<number>;  // Horas cámara salina [ASTM B117]
  fuerzaAperturaBrocheN?: ParametroEnsayo<number>; // Fuerza apertura (N)
  resistenciaImpacto?: ParametroEnsayo<string>;    // Apto / Frágil
  dictamenAccesorios: DictamenType;
  observaciones?: string;
}

export interface EnsayosLaboratorio {
  composicion?: string;
  construccion?: 'TEJIDO PLANO' | 'TEJIDO PUNTO' | 'DENIM' | 'OTRO';
  anchoTotal?: ParametroEnsayo<number>;
  anchoUtil?: ParametroEnsayo<number>;
  gramajeGsm?: ParametroEnsayo<number>;
  encogimientoLargo?: ParametroEnsayo<number>;
  encogimientoAncho?: ParametroEnsayo<number>;
  viroPierna?: ParametroEnsayo<number>;
  solidezLavado?: {
    cambioColor: ParametroEnsayo<number>;
    manchado: ParametroEnsayo<number>;
  };
  solidezFrote?: {
    seco: ParametroEnsayo<number>;
    humedo: ParametroEnsayo<number>;
  };
  elongacion?: {
    largo: ParametroEnsayo<number>;
    ancho: ParametroEnsayo<number>;
  };
  resistenciaRasgado?: {
    urdimbre: ParametroEnsayo<number>;
    trama: ParametroEnsayo<number>;
  };
  pilling?: ParametroEnsayo<number>;
  deslizamientoCostura?: ParametroEnsayo<number>;
  lavadoSugerido?: string;
  accesorios?: EnsayosAccesorios;
}

// 5. Control de Corte & Matiz
export interface ControlCorteMatiz {
  horasReposoCumplidas: boolean;
  horasReposoTotal: number;
  matizConformeRollos: boolean; // Control de variación de tono entre rollos
  orillosConformes: boolean;
  viroEnMesaDetectado: boolean;
  autorizacionTendido: boolean;
}

// 6. Decisión Comercial de Compras
export interface DecisionCompras {
  decision: 'APROBADO_COMERCIAL' | 'DESCUENTO_NEGOCIADO' | 'DEVOLUCION_PROVEEDOR' | 'PENDIENTE';
  porcentajeDescuento?: number; // ej: 8% por merma
  motivoDecision?: string;
  fechaDecision?: string;
  responsableCompras?: string;
  cartaNoConformidadGenerada?: boolean;
}

// 7. Auditoría de Prendas & Tabla de Medidas
export interface PuntoMedicionPrenda {
  punto: string; // ej: 'Largo Total', 'Contorno Pecho', 'Cintura', 'Cadera', 'Bota'
  especificacionCm: number;
  toleranciaMaxCm: number; // ej: 0.5 cm
  realCm: number;
  deltaCm: number;
  estado: 'CONFORME' | 'FUERA_TOLERANCIA';
}

export interface AuditoriaPrendaConfeccionada {
  tallaAuditada: string; // ej: 'S', 'M', 'L', '6', '8'
  puntosMedicion: PuntoMedicionPrenda[];
  inspeccionCosturas: boolean;
  acabadosLavanderia: boolean;
  etiquetadoLegalConforme: boolean;
  empaqueParaTiendaConforme: boolean;
  defectosConfeccion: string[];
}

export interface TrazabilidadArea {
  estado: EstadoEtapa;
  dictamen: DictamenType;
  fechaInicio?: string;
  fechaFin?: string;
  responsable?: string;
  observaciones?: string;
  detallesEspecificos?: Record<string, any>;
}

export interface HistorialAccion {
  id: string;
  fecha: string;
  area: AreaType;
  usuario: string;
  accion: string;
  detalle: string;
}

export interface MuestraTextil {
  id: string;
  codigoMT: string;             // ej: MT-2026-0841
  numeroReporte: string;        // ej: LAB-9412
  referencia: string;           // ej: TELA LINO MOURA
  codigoReferencia?: string;    // ej: STF-TEL-005941
  tipoMaterial: 'Tela Plana' | 'Tejido Punto' | 'Denim' | 'Insumo / Accesorio' | 'Prenda Confeccionada';
  proveedor: string;            // ej: COLTEJER, SHANGHAI JOY TEX
  paisOrigen?: string;
  ordenCompra: string;          // ej: OAC 1107
  lote: string;                 // ej: LOT-88421
  color: string;                // ej: 045 NATURAL
  marca: MarcaType;
  unidades?: number;
  fechaIngreso: string;         // YYYY-MM-DD
  fechaCompromiso?: string;     // YYYY-MM-DD
  fechaFinalizacion?: string;   // YYYY-MM-DD
  
  // 1. Ficha del Proveedor & Token
  fichaProveedor: FichaTecnicaDeclaradaProveedor;

  // 2. Ficha Maestra STF & Homologación
  fichaMaestraSTF: FichaTecnicaMaestraSTF;
  homologacion: HomologacionComparativa;

  // 3. Ensayos y especificaciones técnicas de Laboratorio
  ensayos: EnsayosLaboratorio;

  // 5. Control de Corte y Matiz
  corteMatiz?: ControlCorteMatiz;

  // 6. Decisión Comercial de Compras
  decisionCompras: DecisionCompras;

  // 7. Auditoría de Prendas
  auditoriaPrendas?: AuditoriaPrendaConfeccionada;

  // Trazabilidad por las 4 áreas operativas
  trazabilidad: {
    laboratorio: TrazabilidadArea;
    compras: TrazabilidadArea;
    patronaje: TrazabilidadArea;
    corte: TrazabilidadArea;
    prendas?: TrazabilidadArea;
  };

  // Dictamen global consolidado
  dictamenFinal: DictamenType;
  causasNoConformidad: string[];
  observacionesGenerales: string;
  prioridad: 'Alta' | 'Media' | 'Baja';

  // Historial de eventos
  historial: HistorialAccion[];
}

export interface FiltrosDashboard {
  busqueda: string;
  rangoFecha: 'TODOS' | 'HOY' | 'ULTIMOS_5_DIAS' | 'ULTIMOS_7_DIAS' | 'ESTE_MES' | 'PERSONALIZADO';
  fechaInicio?: string;
  fechaFin?: string;
  proveedor: string;
  marca: string;
  dictamen: string;
  estadoTrazabilidad: string;
  soloAlertasLeadTime: boolean;
}

export interface ResumenKPIs {
  totalMuestras: number;
  totalAprobadas: number;
  porcentajeAprobacion: number;
  totalConHallazgos: number;
  porcentajeHallazgos: number;
  totalRechazadas: number;
  porcentajeRechazadas: number;
  totalEnProceso: number;
  totalAlertasLeadTime: number; // Muestras con más de 2 días en proceso
  leadTimePromedioDias: number;
}

export interface RankingCausaNoConformidad {
  causa: string;
  conteo: number;
  porcentaje: number;
  areaImpacto: string;
}

export interface CalidadProveedor {
  proveedor: string;
  totalMuestras: number;
  aprobadas: number;
  hallazgos: number;
  rechazadas: number;
  indiceCalidad: number;
}

// =========================================================================
// --- 🔐 SEGURIDAD, AUTENTICACIÓN, ROLES RBAC & USUARIOS INDIVIDUALES    ---
// =========================================================================
export type UserRole = 
  | 'ADMIN'
  | 'COMPRAS'
  | 'LABORATORIO'
  | 'PATRONAJE'
  | 'CORTE'
  | 'PROVEEDOR'
  | 'SUPERVISOR'
  | 'SOPORTE_TECNICO'
  | 'soporte_tecnico';

export type RolUsuarioExt = 
  | 'ADMINISTRADOR'
  | 'JEFE_LABORATORIO'
  | 'ANALISTA_LABORATORIO'
  | 'RESPONSABLE_COMPRAS'
  | 'ANALISTA_COMPRAS'
  | 'PATRONISTA'
  | 'SUPERVISOR_CORTE'
  | 'SOPORTE_TECNICO'
  | 'soporte_tecnico'
  | 'CONSULTA';

export type PermisoSistema = 
  | 'VER_SOLICITUDES'
  | 'CREAR_SOLICITUD_COMPRAS'
  | 'RECIBIR_SOLICITUD_LAB'
  | 'REGISTRAR_RESULTADO_ENSAYO'
  | 'MODIFICAR_RESULTADO_PROPIO'
  | 'MODIFICAR_RESULTADO_OTRO'
  | 'EMITIR_DICTAMEN_TECNICO'
  | 'TOMAR_DECISION_COMPRAS'
  | 'GESTIONAR_USUARIOS'
  | 'VER_TRAZABILIDAD'
  | 'CENTRO_MONITOREO';

export type PermissionAction = 
  | 'VER'
  | 'CREAR'
  | 'EDITAR'
  | 'APROBAR'
  | 'RECHAZAR'
  | 'ELIMINAR'
  | 'DESCARGAR'
  | 'ADMINISTRAR';

export interface UserProfile {
  uid: string;
  email: string;
  nombreUsuario?: string;     // ej: "ana.gonzalez", "carlos.perez"
  displayName: string;        // ej: "Ana González", "Carlos Pérez"
  password?: string;          // Contraseña cifrada o credencial individual
  role: UserRole;
  rolEspecifico?: RolUsuarioExt | string; // ej: "Analista de Laboratorio", "Jefe de Laboratorio"
  areaAsignada: AreaType;
  permisos?: PermisoSistema[];
  activo: boolean;
  esResponsableArea?: boolean;
  createdAt: string;
  lastLogin?: string;
  tokenProveedor?: string;
}

// Firma automática de sesión transparente para trazabilidad
export interface FirmaAuditoriaSesion {
  usuarioId: string;
  nombreUsuario: string;
  nombreCompleto: string;
  area: AreaType;
  rol: UserRole | string;
  rolEspecifico?: string;
  fecha: string;      // ej: "08/09/2026"
  hora: string;       // ej: "10:25 a. m."
  timestamp: string;  // ISO string
}

// =========================================================================
// --- 📜 AUDITORÍA & TRAZABILIDAD INMUTABLE (CENTRO DE MONITOREO)       ---
// =========================================================================
export interface AuditMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type TipoAccionAuditoria = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'CONSULTA'
  | 'CREACION'
  | 'EDICION'
  | 'ELIMINACION'
  | 'DESCARGA'
  | 'CARGA_ARCHIVO'
  | 'CAMBIO_ESTADO'
  | 'REGISTRO_RESULTADO'
  | 'MODIFICACION'
  | 'ENVIO_SOLICITUD'
  | 'RESPUESTA_SOLICITUD'
  | 'ERROR'
  | 'APROBACION'
  | 'RECHAZO'
  | 'NAVEGACION';

export type ResultadoAuditoria = 'Exitoso' | 'Error' | 'Advertencia' | 'En revisión' | 'Crítico';

export interface AuditLogEntry {
  id: string; // ID del evento
  collectionName?: string;
  documentId?: string;
  action: string; // Acción legible e.g. "Registró ensayo", "Creó solicitud"
  tipoAccion?: TipoAccionAuditoria;
  user: string; // Nombre usuario / email
  userId?: string; // ID del usuario
  nombreCompleto?: string;
  area?: AreaType | string;
  modulo?: string; // Módulo ej: "Ensayos", "Solicitudes de Compras", "Fichas Técnicas"
  userRole: UserRole;
  rolEspecifico?: string;
  timestamp: string;
  fecha?: string;
  hora?: string;
  registroAfectado?: string; // Nombre/descripción del registro afectado
  idRegistro?: string; // Código/ID del registro ej: "ENS-002541", "SC-00152"
  campoAfectado?: string; // Campo modificado
  previousValue?: any; // Valor anterior
  newValue?: any; // Valor nuevo
  resultado?: ResultadoAuditoria | string; // Exitoso | Error
  mensajeError?: string; // Mensaje de error si aplica
  dispositivo?: string; // ej: "Chrome - Windows"
  detalles?: string;
}

export interface SesionUsuarioMonitoreo {
  id: string; // ID sesión
  userId: string;
  nombreCompleto: string;
  email?: string;
  avatar?: string;
  area: AreaType | string;
  rol: string;
  rolEspecifico: string;
  estado: 'CONECTADO' | 'INACTIVO' | 'DESCONECTADO'; // 🟢, 🟡, 🔴
  horaEntrada: string; // ej: "07:58"
  horaEntradaCompleta: string; // ej: "07:58:12"
  ultimaActividad: string; // ISO
  ultimaActividadRelativa: string; // "Hace 10 s", "Hace 6 min"
  moduloActual: string; // ej: "Ensayos"
  accionRealizada: string; // OBLIGATORIA ej: "Registró ensayo"
  dispositivo: string;
  ip?: string;
  duracionMinutos?: number;
  historialAcciones: Array<{
    id: string;
    hora: string;
    modulo: string;
    accion: string;
    detalles?: string;
    resultado: 'Exitoso' | 'Error';
    idRegistro?: string;
    campoAfectado?: string;
    previousValue?: any;
    newValue?: any;
  }>;
}

export interface EventoErrorMonitoreo {
  id: string;
  hora: string;
  fecha: string;
  usuario: string;
  userId?: string;
  modulo: string;
  accion: string;
  error: string;
  estado: 'CRITICO' | 'EN_REVISION' | 'RESUELTO';
  dispositivo?: string;
  idRegistro?: string;
}

export interface KpisCentroMonitoreo {
  usuariosConectados: number;
  usuariosActivosHoy: number;
  modulosEnUso: number;
  alertasErrores: number;
  sesionesActivas: number;
  totalSesionesDia: number;
  moduloMasUtilizado: string;
  erroresDelDia: number;
  actividadesRegistradas: number;
  tiempoPromedioSesionMin: number;
}

// =========================================================================
// --- 📑 FICHA TÉCNICA HISTÓRICA CON VERSIONAMIENTO                   ---
// =========================================================================
// --- 📑 FICHA TÉCNICA HISTÓRICA CON VERSIONAMIENTO (7 SECCIONES)      ---
// =========================================================================

export interface ParametroTecnicoProveedor<T = number | string> {
  valor: T;
  unidad: string;
  tolerancia?: string;
  norma?: string;
}

export interface DocumentosAdjuntosFichaProveedor {
  pdfFichaOriginal?: { nombre: string; urlData: string; fecha: string };
  certificadosCalidad?: { nombre: string; urlData: string; fecha: string }[];
  fotosTela?: { nombre: string; urlData: string; fecha: string }[];
  fotosCartaColor?: { nombre: string; urlData: string; fecha: string }[];
}

export interface VersionFichaTecnica {
  version: number;
  fechaVersion: string;
  creadoPor: string;
  activo: boolean;
  especificaciones: {
    // 1. INFORMACIÓN DE CONTACTO Y EMPRESA
    nombreEmpresa?: string;
    contactoTecnico?: string;
    emailContacto?: string;
    telefonoWhatsapp?: string;
    paisEmpresa?: string;

    // 2. TRAZABILIDAD, COMERCIAL Y ADUANAS
    numeroOrdenCompraSTF?: string;
    stfPoNumber?: string;
    fechaProduccion?: string;
    codigoMT?: string;
    referenciaSTF?: string;
    referenciaProveedor?: string;
    codigoFabrica?: string;
    nombreComercialTela?: string;
    molinoFabricante?: string;
    paisOrigen?: string;
    numeroLoteProduccion?: string;
    colorShade?: string;
    subpartidaArancelaria?: string;
    certificadoOrigen?: string;
    aplicaCertificadoOrigen?: boolean | 'SI' | 'NO' | 'EN_TRAMITE';
    acuerdoComercial?: string;

    // 3. FIBRAS, HILOS Y COMPOSICIÓN
    composicion: string;
    composicionPorcentual?: string;
    tipoFibraFilamento?: string; // 'Continuo' | 'Discontinuo' | 'Cortada'
    continuoDiscontinuoCortada?: 'Continuo' | 'Discontinuo' | 'Cortada' | string;
    tipoFibraTexturizado?: string;
    tituloHiloUrdimbre?: string;
    tituloHiloTrama?: string;
    sentidoTorsion?: 'S' | 'Z' | 'S+Z' | 'Sin Torsión';
    mezclaIntima?: string;

    // 4. DIMENSIONES, PESO Y RENDIMIENTO
    anchoTotalM?: number;
    anchoTotalDetalle?: ParametroTecnicoProveedor<number>;
    anchoUtilM: number;
    anchoUtilDetalle?: ParametroTecnicoProveedor<number>;
    gramajeDeclaradoGsm: number;
    gramajeDetalle?: ParametroTecnicoProveedor<number>;
    pesoLinealGsm?: number;
    pesoLinealDetalle?: ParametroTecnicoProveedor<number>;
    rendimientoMkg?: number;
    rendimientoDetalle?: ParametroTecnicoProveedor<number>;
    espesorMm?: number;
    espesorDetalle?: ParametroTecnicoProveedor<number>;
    pesoDenimOz?: number;
    pesoDenimDetalle?: ParametroTecnicoProveedor<number>;

    // 5. ESTRUCTURA, CONSTRUCCIÓN Y ACABADOS
    tipoTejido?: 'Punto' | 'Plano' | 'Índigo / Denim' | 'No Tejido';
    tipoLigamento?: string; // 'Tafetán', 'Sarga 3/1', 'Satén', 'Jersey', 'Piqué', 'Rib', 'Interlock'
    densidadUrdimbreHilosCm?: number;
    densidadUrdimbreDetalle?: ParametroTecnicoProveedor<number>;
    densidadTramaPasadasCm?: number;
    densidadTramaDetalle?: ParametroTecnicoProveedor<number>;
    acabadosTextiles?: string;
    acabadoColorTintoreria?: string;

    // 6. PARÁMETROS DE LABORATORIO, ENSAYOS FÍSICOS Y TOLERANCIAS
    encogimientoLargoMax: number;
    encogimientoLargoDetalle?: ParametroTecnicoProveedor<number>;
    encogimientoAnchoMax: number;
    encogimientoAnchoDetalle?: ParametroTecnicoProveedor<number>;
    torqueViroPiernaDetalle?: ParametroTecnicoProveedor<number>;
    viroMax: number;
    solidezLavadoMin: number;
    solidezLavadoCambioColorDetalle?: ParametroTecnicoProveedor<number>;
    solidezLavadoManchadoDetalle?: ParametroTecnicoProveedor<number>;
    solidezFroteSecoMin: number;
    solidezFroteSecoDetalle?: ParametroTecnicoProveedor<number>;
    solidezFroteHumedoMin: number;
    solidezFroteHumedoDetalle?: ParametroTecnicoProveedor<number>;
    elongacionLargoMin?: number;
    elongacionLargoDetalle?: ParametroTecnicoProveedor<number>;
    elongacionAnchoMin?: number;
    elongacionAnchoDetalle?: ParametroTecnicoProveedor<number>;
    recuperacionElasticidadMin?: number;
    recuperacionElasticidadDetalle?: ParametroTecnicoProveedor<number>;
    resistenciaDesgarreMin?: number;
    resistenciaDesgarreDetalle?: ParametroTecnicoProveedor<number>;
    resistenciaDesgarreUrdimbreDetalle?: ParametroTecnicoProveedor<number>;
    resistenciaDesgarreTramaDetalle?: ParametroTecnicoProveedor<number>;
    resistenciaTensionMin?: number;
    resistenciaTensionDetalle?: ParametroTecnicoProveedor<number>;
    resistenciaPillingMin?: number;
    resistenciaPillingDetalle?: ParametroTecnicoProveedor<number>;
    deslizamientoCosturaMax?: number;
    deslizamientoCosturaDetalle?: ParametroTecnicoProveedor<number>;
    desviacionTramaMax?: number;
    cambioColorMin?: number;
    aptitudFrote?: 'APTO PARA COMBINAR' | 'SUELTA COLOR CON LA FRICCIÓN' | 'NINGUNO';
    pruebaFusionadoTemp?: number;
    anchoTotalDesengome?: number;
    anchoUtilDesengome?: number;

    // 7. CUIDADOS, RECOMENDACIONES Y DOCUMENTACIÓN
    lavadoSugerido?: string;
    instruccionesCuidado?: string;
    instruccionesLavadoSugerido?: string;
    recomendacionesPlanchado?: string;
    observacionesAdvertencias?: string;
    observacionesFabricante?: string;
    documentosAdjuntos?: DocumentosAdjuntosFichaProveedor;
    [key: string]: any;
  };
  nombreArchivoFT?: string;
  urlArchivoFT?: string;
  cambiosRespectoAnterior?: string;
}

export interface FichaTecnicaHistoricaVersionada extends AuditMetadata {
  id: string;
  codigoFT: string;
  referencia: string;
  referenciaProveedor: string;
  proveedor: string;
  contactoProveedor?: string;
  paisOrigen?: string;
  versionActual: number;
  estadoRevision?: 'PENDIENTE_REVISION' | 'APROBADA_HISTORICO' | 'OBSERVADA';
  historialVersiones: VersionFichaTecnica[];
  documentoOriginal?: {
    nombreArchivo: string;
    tipo: string;
    urlData?: string;
    fechaCarga: string;
  };
  enlaceDrive?: string;
  driveFileId?: string;
  carpetaDriveId?: string;
  procesadoConLecturaInteligente?: boolean;
}


// =========================================================================
// --- 💬 CHAT INTER-ÁREAS & NOTIFICACIONES EN TIEMPO REAL              ---
// =========================================================================
export interface ChatMessage {
  id: string;
  remitente: string;
  area: AreaType;
  mensaje: string;
  timestamp: string;
  canal?: string; // 'general' | 'colecciones' | 'laboratorio' | 'calidad' | 'compras' | 'patronaje' | 'corte'
}

export interface SeccionRespondidaLab {
  id: string;
  titulo: string;
  descripcion: string;
  icono?: 'dictamen' | 'observaciones' | 'recomendaciones' | 'muestras' | 'ficha';
  badge?: string;
  badgeColor?: string;
}

export interface AlertNotificationData {
  id: string;
  type: 'solicitud_enviada' | 'solicitud_recibida' | 'solicitud_aprobada' | 'solicitud_rechazada' | 'solicitud_respondida' | 'patronaje' | 'corte' | 'general';
  title: string;
  message: string;
  codigo?: string;
  itemCount?: number;
  areaDestino?: string;
  areaOrigen?: string;
  timestamp?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number; // ms
  dictamen?: string;
  responsableLab?: string;
  seccionesRespondidas?: SeccionRespondidaLab[];
  resumenItems?: {
    total: number;
    aprobadas: number;
    observadas: number;
    rechazadas: number;
  };
}

// =========================================================================
// --- 👗 REVISIÓN DE PRENDAS, PARÁMETROS & AUDITORÍA                   ---
// =========================================================================
export type ParametroTriState = 'VERDADERO' | 'FALSO' | null;

export interface ParametrosRevision {
  desarrollo?: ParametroTriState | boolean;
  empaque?: ParametroTriState | boolean;
  composiciones?: ParametroTriState | boolean;
  lavado?: ParametroTriState | boolean;
}

export type EstadoClasificacionPrenda =
  | 'Cancelada'
  | 'PorIniciar'
  | 'Incumplimiento'
  | 'Inconsistencia'
  | 'EnProceso'
  | 'Completada';

export interface PrendaRevision {
  id?: string;
  referenciaPrenda: string;
  marca?: string;
  estadoAprobacion?: string;
  parametros?: ParametrosRevision;
  fotoUrl?: string;
  fotos?: string[];
  fechaInfoEmp?: string | null;
  fechaRevCompo?: string | null;
  fechaCarelabels?: string | null;
}

export interface AlertaRevision {
  id: string;
  referencia: string;
  marca: string;
  tipo: 'parametro' | 'inconsistencia' | 'informacion';
  parametro?: string;
  area: 'Colecciones' | 'Laboratorio' | 'Calidad';
  mensaje: string;
  accion: string;
  prioridad: 'alta' | 'media';
}

export interface RevisionPrenda {
  id: string;
  referenciaPrenda: string;
  referencia?: string;
  nombrePrenda?: string;
  proveedor?: string;
  marca:
    | 'DOTACION'
    | 'ELA'
    | 'F STUDIO OUTLET'
    | 'HOMBRES STUDIO F'
    | 'NIÑOS ELA'
    | 'OUTLET ELA'
    | 'STUDIO F'
    | string;
  linea?: string;
  ordenCompra?: string;
  lote?: string;
  responsable?: string;
  resultadosLaboratorio?: string;
  fechaCreadoDocumento?: string | null;
  fechaInfoEmp: string;
  fechaDesarrollo?: string;
  fechaEmpaque?: string;
  fechaRevCompo?: string;
  fechaSolicitudCarelabels?: string;
  fechaInstruccionCuidado?: string;
  instruccionCuidadoTexto?: string;
  fechaCarelabels?: string;
  parametros?: ParametrosRevision;
  etapaActual?: 'Creado' | 'Desarrollo' | 'Empaque' | 'Revisión Lab' | 'Carelabels' | 'Completado';
  confirmacionesEtapas?: {
    creado?: boolean;
    desarrollo?: boolean;
    empaque?: boolean;
    laboratorio?: boolean;
    carelabels?: boolean;
  };
  estado: 'Pendiente' | 'En Revisión' | 'Aprobado' | 'Con Novedad' | 'Completado' | 'Rechazado' | 'Demorado (>2 Días)' | 'Cancelado' | string;
  estadoAprobacion?: string;
  unidades?: number;
  confeccionista?: string;
  composicionDeclarada?: string;
  composicionLaboratorio?: string;
  hayDiscrepanciaComposicion?: boolean;
  detalleDiscrepancia?: string;
  analistaResponsable?: string;
  fotos?: string[];
  novedades?: any[];
  celdasConError?: any[];
  registradoPor: string;
  observaciones?: string;
  creadoEn: string;
}

// =========================================================================
// --- 👗 REVISIÓN DE PRENDAS (6 PARÁMETROS CARELABELS)                 ---
// =========================================================================
export const PARAMETROS_CARELABELS = [
  'A. Desarrollo',
  'F. Información de Empaque',
  'B. Revisión de Composiciones',
  'C. Asignación de Instrucción de Lavado',
  'D. Solicitud de Carelabels',
  'E. Entrega Carelabels'
] as const;

export type ParametroCarelabelNombre = typeof PARAMETROS_CARELABELS[number];

export interface RegistroRevisionPrenda {
  id: string;
  referencia: string;
  descripcion?: string;
  marca?: string;
  linea?: string;
  estadoAprobacion: string;
  parametrosRegistrados: {
    desarrollo?: { presente: boolean; fecha?: string; valor?: string };
    empaque?: { presente: boolean; fecha?: string; valor?: string };
    composiciones?: { presente: boolean; fecha?: string; valor?: string };
    instruccionLavado?: { presente: boolean; fecha?: string; valor?: string };
    solicitudCarelabels?: { presente: boolean; fecha?: string; valor?: string };
    entregaCarelabels?: { presente: boolean; fecha?: string; valor?: string };
  };
  llegoEntregaCarelabels: boolean;
  parametrosFaltantes: ParametroCarelabelNombre[];
  tieneAlerta: boolean;
  observaciones?: string;
  auditMetadata?: AuditMetadata;
}

// =========================================================================
// --- 🧵 COMPATIBILIDAD CON DATASETS INICIALES & FORMULARIOS            ---
// =========================================================================
export interface Muestra {
  id: string;
  codigo: string;
  codigoMaterial?: string;
  referencia: string;
  nombreTela: string;
  proveedor: string;
  nroLote: string;
  prioridad?: 'Alta' | 'Media' | 'Baja';
  solicitudCompra?: string;
  ordenCompra?: string;
  color?: string;
  composicion: string;
  paisOrigen: string;
  fechaIngreso: string;
  resultadoFinal: string;
  dictamenLaboratorio?: string;
  observaciones: string;
  registradoPor: string;
  fichaTecnica: any;
  pruebas: any;
  decisionCompras?: any;
  alertasAreas?: any[];
  fotoUrl?: string;
  fotos?: string[];
  lineasCompra?: any[];
  archivoOrigen?: string;
  tablaExcel?: any;
  archivoFichaTecnica?: any;
  esMuestraConsolidada?: boolean;
}

export type EstadoMuestraAccesorio = 'OK' | 'Novedad' | 'Rechazado' | 'Pendiente' | 'En Análisis' | 'Aprobado' | 'Observado' | 'Entregado';

export interface MuestraAccesorioItem {
  id: string;
  filaNumero: number;
  referencia: string;
  color?: string;
  talla?: string;
  cantidad?: number | string;
  unidad?: string;
  descripcion?: string;
  proveedor?: string;
  linea?: string;
  observacionCompras?: string;
  resultadoLab?: string;
  observacionLab?: string;
  fechaIngresoLab?: string;
  fechaEntregaLab?: string;
  fechaDictamen?: string;
  fechaUltimoDictamen?: string;
  fechaEvaluacion?: string;
  estadoLab?: EstadoMuestraAccesorio;
  responsableLab?: string;
}

export interface RespuestaLaboratorioAccesorios {
  fechaRespuesta: string;
  respondidoPor: string;
  dictamenGeneral: string;
  observacionesGenerales: string;
  recomendaciones?: string;
  totalAprobadas?: number;
  totalObservadas?: number;
  totalRechazadas?: number;
}

export interface SolicitudAccesorios {
  id: string;
  codigoSolicitud: string;
  titulo?: string;
  marca?: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  fechaSolicitud: string;
  fechaEsperada?: string;
  fechaUltimoDictamen?: string;
  proveedorGeneral?: string;
  estadoGeneral: string;
  solicitante?: any;
  observacionesGenerales?: string;
  items: MuestraAccesorioItem[];
  respuestaLaboratorio?: RespuestaLaboratorioAccesorios;
  documentoOriginal?: any;
  historial?: any[];
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface ArchivoAdjuntoProveedor {
  id?: string;
  nombre: string;
  tipo: string;
  tamano: number;
  categoria?: 'ficha_tecnica' | 'certificado' | 'fotografia' | 'otro' | string;
  urlOData: string;
  fechaCarga?: string;
}

export interface DatosProveedorFicha {
  [key: string]: any;
}

export interface SolicitudProveedor {
  id: string;
  token: string;
  referencia: string;
  nombreTela?: string;
  proveedor: string;
  color?: string;
  estado: string;
  fechaCreacion: string;
  fechaRecepcion?: string;
  fechaVencimiento?: string;
  muestraId?: string;
  documentoOriginal?: any;
  documentosAdjuntos?: ArchivoAdjuntoProveedor[];
  archivoUrl?: string;
  datosProveedor?: any;
  creadoPor?: any;
  observacionesInternas?: string;
}

export interface DatosProveedorFormulario {
  [key: string]: any;
}


export type AreaRole = 'laboratorio' | 'compras' | 'patronaje' | 'corte' | 'colecciones' | 'calidad';

export interface AreaResponsable {
  id: string;
  area: AreaRole;
  nombre: string;
  cargo: string;
  email: string;
  telefono?: string;
  esPrincipal?: boolean;
}

export interface User {
  username: string;
  name: string;
  area: AreaRole;
}

export type DictamenCalidad = 'APROBADO' | 'CON HALLAZGO' | 'RECHAZADO' | 'PENDIENTE';

export interface EnsayoLaboratorioTela {
  idMuestra: string;
  codigo: string;
  referencia: string;
  lote: string;
  rollo: string;
  color: string;
  anchoUtilMedido: number;
  anchoTotalMedido: number;
  gramajeMedido: number;
  rendimientoMedido: number;
  encogimientoLargoMedido: number;
  encogimientoAnchoMedido: number;
  elongacionMedida: number;
  recuperacionMedida: number;
  viroTorqueMedido: number;
  solidezLavado: number;
  solidezFroteSeco: number;
  solidezFroteHumedo: number;
  dictamen: DictamenCalidad;
  observacionesTecnicas: string;
  responsableLab: string;
  fechaEnsayo: string;
}

/**
 * ============================================================================
 * INTERFACES PARA MOTOR DE ANÁLISIS DE DATOS Y TRAZABILIDAD DE PRENDAS (EXCEL)
 * ============================================================================
 */

export type ClasificacionPrenda = 
  | 'CULMINADO_COMPLETO' 
  | 'CULMINADO_INCOMPLETO' 
  | 'EN_PROCESO' 
  | 'CANCELADO';

export type NombreParametroProceso = 
  | 'A. Desarrollo'
  | 'F. Información de Empaque'
  | 'B. Revisión de Composiciones'
  | 'C. Asignación de Instrucción de Lavado'
  | 'D. Solicitud de Carelabels'
  | 'E. Entrega Carelabels';

export interface PrendaAnalizada {
  id: string;
  referencia: string;                  // leída desde la columna PRODUCTO
  estadoAprobacion: string;           // leída desde ESTADO DE APROBACIÓN
  esCancelado: boolean;
  
  // Fechas crudas encontradas en el documento
  fechas: {
    creado?: string;
    desarrollo?: string;            // 'A. Fecha Desarrollo
    empaque?: string;               // 'F. Fecha Info. de Emp.
    composicion?: string;           // 'B. Fecha Rev. Compo.
    lavado?: string;                // 'C. Fecha Asig. Inst. Lav.
    solicitudCarelabel?: string;    // 'D. Fecha Sol. Carel.
    entregaCarelabel?: string;      // 'E. Fecha Ent.Carel.
  };

  // Clasificación final del motor
  clasificacion: ClasificacionPrenda;
  procesoActual: string;              // Nombre del proceso actual
  ultimoProcesoCompletado: string | null;
  fechaInicioProcesoActual: string | null;
  diasEnProcesoActual: number;
  
  // Detalle de parámetros
  parametroBloqueante: NombreParametroProceso | null; // El primer parámetro faltante que frena la secuencia
  parametrosIncompletosHistoricos: string[];          // Para prendas culminadas con vacíos previos
  parametrosAunNoCorresponden: string[];               // Pasos posteriores que aún no aplican
  tiemposPorProceso: Record<string, number>;          // Tiempos transcurridos entre etapas
  
  alertaRequerida: boolean;
  mensajeAuditoria: string;
  explicacionAuditoria: string[];                    // Árbol de decisiones paso a paso
}

export interface ResumenAnalisisDocumento {
  nombreArchivo: string;
  fechaDescargaDocumento: string;
  fechaAnalisis: string;
  
  // Conteos globales
  totalPrendasLeidas: number;
  totalPrendasCanceladas: number;
  totalPrendasAnalizadas: number;       // No canceladas (~1.556)
  totalCulminadasCompleta: number;
  totalCulminadasIncompleta: number;
  totalEnProceso: number;
  totalAlertasBloqueo: number;
  
  // Sugerencia inteligente para la empresa
  fechaCorteSugerida: string | null;
  motivoFechaCorte: string;
  
  // Distribución y Cuellos de Botella
  prendasPorProceso: Record<NombreParametroProceso, number>;
  diasPromedioPorProceso: Record<NombreParametroProceso, number>;
  faltantesPorParametro: Record<NombreParametroProceso, number>;
  
  prendas: PrendaAnalizada[];
}

// ============================================================================
// 15. MODELO DE EVALUACIÓN Y COMPARACIÓN DE FORROS Y COSTURAS (PIPIN VS SHIPPING)
// ============================================================================
export interface MuestraPipinForrosCosturas {
  fechaIngreso: string;
  fechaEntrega: string;
  observaciones: string;
  estado: 'CONFORME' | 'CON NOVEDAD' | 'PENDIENTE';
  tipoForro?: string;
  calidadCostura?: string;
  puntadasPorPulgada?: string | number;
}

export interface MuestraShippingForrosCosturas {
  fechaIngreso: string;
  fechaEntrega?: string;
  observaciones: string;
  estado: 'APROBADO' | 'RECHAZADO' | 'OBSERVADO' | 'PENDIENTE';
  tipoForro?: string;
  calidadCostura?: string;
  puntadasPorPulgada?: string | number;
}

export interface ComparacionPipinShipping {
  coincideForro: boolean;
  coincideCostura: boolean;
  variacionesDetectadas: string;
  dictamenFinal: 'APROBADO' | 'RECHAZADO' | 'CON HALLAZGOS' | 'PENDIENTE';
  evaluador: string;
  fechaEvaluacion: string;
  observacionesGenerales?: string;
}

export interface CorreoLogForrosCosturas {
  id: string;
  destinatario: string;
  asunto: string;
  cuerpo: string;
  fechaEnvio: string;
  enviadoPor: string;
}

export interface EvaluacionForrosCosturas {
  id: string;
  codigoReporte: string;       // Ej: RPT-FC-2026-001
  referencia: string;          // Ej: LINO MOURA, CREPE VICTORIA
  proveedor: string;
  color?: string;
  ordenCompra?: string;
  solicitudId?: string;
  
  pipin: MuestraPipinForrosCosturas;
  shipping: MuestraShippingForrosCosturas;
  comparacion: ComparacionPipinShipping;
  
  correosEnviados?: CorreoLogForrosCosturas[];
  
  createdAt: string;
  updatedAt: string;
}

export interface ItemPapelera {
  id: string;
  tipo: 'tela' | 'accesorio';
  solicitudOriginalId: string;
  numeroSolicitud: string;
  fechaSolicitud: string;
  solicitante: string;
  proveedor?: string;
  cantidadItems: number;
  eliminadoPor: string;
  areaEliminacion: 'compras' | 'laboratorio' | 'admin';
  fechaEliminacion: string;
  motivo?: string;
  datosCompletos: SolicitudTelasCompleta | SolicitudAccesoriosCompleta;
}

// Integración Google Workspace (Drive & Sheets)
export * from './googleIntegration';



