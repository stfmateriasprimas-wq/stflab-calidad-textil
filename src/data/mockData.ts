import { MuestraTextil, SolicitudTelasCompleta, SolicitudAccesoriosCompleta, FichaTecnicaHistoricaVersionada, EvaluacionForrosCosturas } from '../types';

// Solicitudes iniciales activas para Telas y Accesorios (Vacías por defecto)
export const MOCK_MUESTRAS: MuestraTextil[] = [];
export const MOCK_SOLICITUDES_TELAS: SolicitudTelasCompleta[] = [];
export const MOCK_SOLICITUDES_ACCESORIOS: SolicitudAccesoriosCompleta[] = [];

// Base de Datos Histórica y Reutilizable de Fichas Técnicas de Proveedores con Versionamiento
export const MOCK_FICHAS_TECNICAS_HISTORICAS: FichaTecnicaHistoricaVersionada[] = [
  {
    id: 'ft-hist-001',
    codigoFT: 'FT-MEX-38770',
    referencia: 'CREPE VICTORIA',
    referenciaProveedor: 'CREPE VICTORIA',
    proveedor: 'TEXTIVISION, S.DE R.L. DE C.V.',
    contactoProveedor: 'ventas@textivision.com.mx',
    paisOrigen: 'MEXICO',
    versionActual: 1,
    createdAt: '2022-06-15',
    createdBy: 'Importación Oficial Fabricante',
    updatedAt: '2022-06-15',
    updatedBy: 'Laboratorio Calidad Textil',
    documentoOriginal: {
      nombreArchivo: 'ESPECIFICACIONES_TECNICAS_CREPE_VICTORIA_TEXTIVISION.pdf',
      tipo: 'PDF',
      fechaCarga: '2022-06-15'
    },
    historialVersiones: [
      {
        version: 1,
        fechaVersion: '2022-06-15',
        creadoPor: 'TEXTIVISION, S.DE R.L. DE C.V.',
        activo: true,
        nombreArchivoFT: 'ESPECIFICACIONES_TECNICAS_CREPE_VICTORIA_TEXTIVISION.pdf',
        especificaciones: {
          // 1. Encabezado y Trazabilidad (Datos Exactos del Documento)
          fechaProduccion: '01-15/JUN/22',
          stfPoNumber: 'MEX38770',
          numeroOrdenCompraSTF: 'MEX38770',
          nombreEmpresa: 'TEXTIVISION, S.DE R.L. DE C.V.',
          referenciaSTF: 'DESIGN 6341 A',
          nombreComercialTela: 'DESIGN 6341 A',
          colorShade: 'AZUL KLEIN 16936',
          referenciaProveedor: 'CREPE VICTORIA',
          paisOrigen: 'MEXICO',
          numeroLoteProduccion: '43254-1, 43313-1, 43367-1, 43463-1',
          subpartidaArancelaria: '',

          // 2. Información sobre Certificado de Origen
          aplicaCertificadoOrigen: false,

          // 3. Descripciones Básicas (Composición y Dimensiones)
          composicion: 'ACETATO 90%, ELASTANE 10%',
          composicionPorcentual: '90% ACETATO / 10% ELASTANE',
          tipoFibraFilamento: 'Continuo',
          tipoFibraTexturizado: 'Texturizado (Textured)',
          anchoTotalM: 1.40,
          anchoUtilM: 1.35,
          gramajeDeclaradoGsm: 286,
          pesoDenimOz: undefined,

          // 4. Acabados en el Textil
          acabadosTextiles: '100% Impregnado - 100% SOFTENER',

          // 5. Ensayos Técnicos del Textil
          tituloHiloUrdimbre: 'N/A',
          tituloHiloTrama: 'ACETATO=150/38 ELASTANO 40/1',
          resistenciaDesgarreMin: 0,
          encogimientoLargoMax: -1.8,
          encogimientoAnchoMax: -6.0,
          viroMax: 1.7,
          solidezLavadoMin: 4.5,
          solidezFroteSecoMin: 4.5,
          solidezFroteHumedoMin: 4.5,
          rendimientoMkg: 2.86,
          elongacionLargoMin: 150,
          elongacionAnchoMin: 127,
          recuperacionElasticidadMin: 0,
          desviacionTramaMax: 0,

          // 6. Clasificación de Tejido, Ligamento y Color
          tipoTejido: 'Punto',
          tipoLigamento: 'Tejido de punto por trama (Weft Knitted)',
          acabadoColorTintoreria: 'Teñido (Dyed)',

          // 7. Instrucciones de Cuidado
          lavadoSugerido: 'Machine Wash Cold, Normal Cycle, Separately, Do Not bleach, tumble dry low.',
          recomendacionesPlanchado: 'Do not Iron',
          observacionesFabricante: ''
        }
      }
    ]
  },
  {
    id: 'ft-hist-002',
    codigoFT: 'FT-COL-41200',
    referencia: 'POPELINA STRETCH',
    referenciaProveedor: 'POP-7820 B',
    proveedor: 'LAFAYETTE S.A.S.',
    contactoProveedor: 'calidad@lafayette.com',
    paisOrigen: 'COLOMBIA',
    versionActual: 1,
    createdAt: '2024-03-12',
    createdBy: 'Laboratorio STF GROUP',
    updatedAt: '2024-03-12',
    updatedBy: 'Laboratorio Calidad Textil',
    documentoOriginal: {
      nombreArchivo: 'FT_POPELINA_STRETCH_LAFAYETTE_2024.pdf',
      tipo: 'PDF',
      fechaCarga: '2024-03-12'
    },
    enlaceDrive: 'https://drive.google.com/drive/folders/1oI5S0KgSgCOEb7jw2hKQ-ye8vwI0FSyF',
    historialVersiones: [
      {
        version: 1,
        fechaVersion: '2024-03-12',
        creadoPor: 'LAFAYETTE S.A.S.',
        activo: true,
        nombreArchivoFT: 'FT_POPELINA_STRETCH_LAFAYETTE_2024.pdf',
        especificaciones: {
          fechaProduccion: '12/MAR/24',
          stfPoNumber: 'COL41200',
          numeroOrdenCompraSTF: 'COL41200',
          nombreEmpresa: 'LAFAYETTE S.A.S.',
          referenciaSTF: 'POP-7820 B',
          nombreComercialTela: 'POP-7820 B',
          colorShade: 'BLANCO OPTICO',
          referenciaProveedor: 'POP-7820 B',
          paisOrigen: 'COLOMBIA',
          numeroLoteProduccion: 'LOT-99214',
          aplicaCertificadoOrigen: true,
          composicion: 'ALGODON 97%, ELASTANO 3%',
          composicionPorcentual: '97% ALGODON / 3% ELASTANO',
          tipoFibraFilamento: 'Discontinuo',
          tipoFibraTexturizado: 'Hilatura Peinada',
          anchoTotalM: 1.50,
          anchoUtilM: 1.48,
          gramajeDeclaradoGsm: 135,
          acabadosTextiles: 'Suavizado y Sanforizado Textil',
          tituloHiloUrdimbre: '40/1 Ne Algodón',
          tituloHiloTrama: '40/1 Ne + 40D Spandex',
          encogimientoLargoMax: -2.0,
          encogimientoAnchoMax: -3.0,
          viroMax: 1.0,
          solidezLavadoMin: 4.5,
          solidezFroteSecoMin: 4.5,
          solidezFroteHumedoMin: 4.0,
          rendimientoMkg: 5.02,
          tipoTejido: 'Plano',
          tipoLigamento: 'Tafetán Plano 1x1',
          acabadoColorTintoreria: 'Blanqueo Óptico Continuo',
          lavadoSugerido: 'Lavado a máquina 30°C suave, no retorcer',
          recomendacionesPlanchado: 'Planchar a temperatura media 150°C'
        }
      }
    ]
  },
  {
    id: 'ft-hist-003',
    codigoFT: 'FT-BRA-18920',
    referencia: 'DENIM INDIGO 12OZ',
    referenciaProveedor: 'DEN-5501',
    proveedor: 'VICUNHA TEXTIL',
    contactoProveedor: 'export@vicunha.com.br',
    paisOrigen: 'BRASIL',
    versionActual: 1,
    createdAt: '2024-08-18',
    createdBy: 'Importación Oficial Fabricante',
    updatedAt: '2024-08-18',
    updatedBy: 'Laboratorio Calidad Textil',
    documentoOriginal: {
      nombreArchivo: 'MATRIZ_PARAMETROS_DENIM_VICUNHA_AGO_2024.xlsx',
      tipo: 'Excel',
      fechaCarga: '2024-08-18'
    },
    enlaceDrive: 'https://drive.google.com/drive/folders/1ZEdsOi0rd9IhyTxUfzJPwB50uqe8UERu',
    historialVersiones: [
      {
        version: 1,
        fechaVersion: '2024-08-18',
        creadoPor: 'VICUNHA TEXTIL',
        activo: true,
        nombreArchivoFT: 'MATRIZ_PARAMETROS_DENIM_VICUNHA_AGO_2024.xlsx',
        especificaciones: {
          fechaProduccion: '18/AGO/24',
          stfPoNumber: 'BRA18920',
          numeroOrdenCompraSTF: 'BRA18920',
          nombreEmpresa: 'VICUNHA TEXTIL',
          referenciaSTF: 'DEN-5501',
          nombreComercialTela: 'DEN-5501',
          colorShade: 'INDIGO DEEP BLUE',
          referenciaProveedor: 'DEN-5501',
          paisOrigen: 'BRASIL',
          numeroLoteProduccion: 'LOTE-BR-7714',
          aplicaCertificadoOrigen: true,
          composicion: 'ALGODON 100%',
          composicionPorcentual: '100% ALGODON BCI SOSTENIBLE',
          tipoFibraFilamento: 'Discontinuo',
          tipoFibraTexturizado: 'Open End Ring Spun',
          anchoTotalM: 1.70,
          anchoUtilM: 1.65,
          gramajeDeclaradoGsm: 340,
          pesoDenimOz: 12.0,
          acabadosTextiles: 'Desengomado y Mercerizado Indigo',
          tituloHiloUrdimbre: '7/1 Ring Spun',
          tituloHiloTrama: '9/1 Open End',
          encogimientoLargoMax: -3.5,
          encogimientoAnchoMax: -2.0,
          viroMax: 2.0,
          solidezLavadoMin: 4.0,
          solidezFroteSecoMin: 3.5,
          solidezFroteHumedoMin: 2.5,
          rendimientoMkg: 1.78,
          tipoTejido: 'Plano',
          tipoLigamento: 'Sarga 3/1 Derecha (RHT Twill)',
          acabadoColorTintoreria: 'Índigo Puro en Cuerda',
          lavadoSugerido: 'Lavar al revés con agua fría, no usar blanqueador',
          recomendacionesPlanchado: 'Planchar con vapor a alta temperatura'
        }
      }
    ]
  },
  {
    id: 'ft-hist-004',
    codigoFT: 'FT-CHN-88420',
    referencia: 'LINO MOURA PREMIUM',
    referenciaProveedor: 'LIN-1120',
    proveedor: 'SHANGHAI JOY TEX',
    contactoProveedor: 'joytex@shanghai.cn',
    paisOrigen: 'CHINA',
    versionActual: 1,
    createdAt: '2026-02-05',
    createdBy: 'Importación Oficial Fabricante',
    updatedAt: '2026-02-05',
    updatedBy: 'Laboratorio Calidad Textil',
    documentoOriginal: {
      nombreArchivo: 'TECHNICAL_SHEET_LINO_MOURA_2026.pdf',
      tipo: 'PDF',
      fechaCarga: '2026-02-05'
    },
    enlaceDrive: 'https://drive.google.com/drive/folders/1FhcPvTXfJGRAuj2uGIuAb7OFj-eT1wv2',
    historialVersiones: [
      {
        version: 1,
        fechaVersion: '2026-02-05',
        creadoPor: 'SHANGHAI JOY TEX',
        activo: true,
        nombreArchivoFT: 'TECHNICAL_SHEET_LINO_MOURA_2026.pdf',
        especificaciones: {
          fechaProduccion: '05/FEB/26',
          stfPoNumber: 'CHN88420',
          numeroOrdenCompraSTF: 'CHN88420',
          nombreEmpresa: 'SHANGHAI JOY TEX',
          referenciaSTF: 'LIN-1120',
          nombreComercialTela: 'LIN-1120',
          colorShade: '045 NATURAL CRUDO',
          referenciaProveedor: 'LIN-1120',
          paisOrigen: 'CHINA',
          numeroLoteProduccion: 'LOT-CN-9941',
          aplicaCertificadoOrigen: false,
          composicion: 'LINO 55%, ALGODON 45%',
          composicionPorcentual: '55% LINO / 45% ALGODON',
          tipoFibraFilamento: 'Discontinuo',
          tipoFibraTexturizado: 'Flax / Cotton Blended',
          anchoTotalM: 1.45,
          anchoUtilM: 1.40,
          gramajeDeclaradoGsm: 180,
          acabadosTextiles: 'Bio-Polished Soft Finish',
          tituloHiloUrdimbre: '21/1 Ne Lino',
          tituloHiloTrama: '21/1 Ne Algodón',
          encogimientoLargoMax: -2.5,
          encogimientoAnchoMax: -2.5,
          viroMax: 1.2,
          solidezLavadoMin: 4.5,
          solidezFroteSecoMin: 4.5,
          solidezFroteHumedoMin: 4.0,
          rendimientoMkg: 3.96,
          tipoTejido: 'Plano',
          tipoLigamento: 'Tafetán Lino Rústico',
          acabadoColorTintoreria: 'Crudo Natural Sin Teñir',
          lavadoSugerido: 'Lavado ciclo delicado a mano o máquina, secado en sombra',
          recomendacionesPlanchado: 'Planchar ligeramente húmedo con vapor alto'
        }
      }
    ]
  }
];

export const MOCK_EVALUACIONES_FORROS_COSTURAS: EvaluacionForrosCosturas[] = [
  {
    id: 'fc-001',
    codigoReporte: 'RPT-FC-2026-001',
    referencia: 'LINO MOURA',
    proveedor: 'SHANGHAI JOY TEX CO LTD',
    color: '045 CRUDO',
    ordenCompra: 'OAC 1107',
    pipin: {
      fechaIngreso: '2026-02-05',
      fechaEntrega: '2026-02-08',
      observaciones: 'Muestra preliminar Pipin recibida con forro de poliéster ligero 100% PES crudo. Se evidenció costura limpia con 12 puntadas por pulgada. El doblado de orillo cumple tolerancia inicial.',
      estado: 'CONFORME',
      tipoForro: 'Poliéster 100% Tafetán 50D',
      calidadCostura: 'Puntada 301 Doble Pespunte',
      puntadasPorPulgada: '12 SPI'
    },
    shipping: {
      fechaIngreso: '2026-02-20',
      fechaEntrega: '2026-02-22',
      observaciones: 'Muestra Shipping final en lote de producción. Se verifica forro con idéntica densidad y tono que el Pipin. Costuras de unión en sisa y pretina con refuerzo de seguridad adicional.',
      estado: 'APROBADO',
      tipoForro: 'Poliéster 100% Tafetán 50D',
      calidadCostura: 'Puntada 301 Doble Pespunte con Remate Sisa',
      puntadasPorPulgada: '12 SPI'
    },
    comparacion: {
      coincideForro: true,
      coincideCostura: true,
      variacionesDetectadas: 'Sin discrepancias críticas. La muestra Shipping mantiene la especificación aprobada en Pipin.',
      dictamenFinal: 'APROBADO',
      evaluador: 'Laura Morales (Ing. Calidad Textil)',
      fechaEvaluacion: '2026-02-22',
      observacionesGenerales: 'Lote autorizado para confección masiva en planta.'
    },
    correosEnviados: [
      {
        id: 'mail-001',
        destinatario: 'compras.calidad@stfgroup.com',
        asunto: '[STFLab 2.0] Reporte Técnico Forros y Costuras - Ref: LINO MOURA (Pipin vs Shipping)',
        cuerpo: 'Se adjunta reporte técnico APROBADO de Pipin vs Shipping para la referencia LINO MOURA.',
        fechaEnvio: '2026-02-22 10:30 AM',
        enviadoPor: 'Laura Morales'
      }
    ],
    createdAt: '2026-02-05',
    updatedAt: '2026-02-22'
  },
  {
    id: 'fc-002',
    codigoReporte: 'RPT-FC-2026-002',
    referencia: 'CREPE VICTORIA',
    proveedor: 'TEXTIVISION, S.DE R.L. DE C.V.',
    color: 'AZUL KLEIN 16936',
    ordenCompra: 'MEX38770',
    pipin: {
      fechaIngreso: '2026-02-10',
      fechaEntrega: '2026-02-12',
      observaciones: 'Forro acetato negro en muestra Pipin. Se observó fruncido leve en costura lateral por tensión excesiva del hilo de trama.',
      estado: 'CON NOVEDAD',
      tipoForro: 'Acetato / Viscosa 60/40',
      calidadCostura: 'Puntada Overlock 4 Hilos',
      puntadasPorPulgada: '10 SPI'
    },
    shipping: {
      fechaIngreso: '2026-02-26',
      fechaEntrega: '2026-02-28',
      observaciones: 'En la muestra Shipping se corrigió la tensión de hilado y se ajustaron a 12 SPI. Forro suave al tacto con excelente caída.',
      estado: 'APROBADO',
      tipoForro: 'Acetato / Viscosa 60/40',
      calidadCostura: 'Puntada Overlock 4 Hilos Corregida',
      puntadasPorPulgada: '12 SPI'
    },
    comparacion: {
      coincideForro: true,
      coincideCostura: true,
      variacionesDetectadas: 'La muestra Shipping resolvió el fruncido reportado en Pipin.',
      dictamenFinal: 'APROBADO',
      evaluador: 'Carlos Mendoza (Jefe Calidad)',
      fechaEvaluacion: '2026-02-28',
      observacionesGenerales: 'Corrección validada y aprobada para compras.'
    },
    createdAt: '2026-02-10',
    updatedAt: '2026-02-28'
  }
];
