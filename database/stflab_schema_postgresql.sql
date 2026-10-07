-- =========================================================================================
-- STFLAB - BASE DE DATOS MAESTRA CORPORATIVA (POSTGRESQL)
-- STF GROUP S.A. (Studio F, ELA, STF MAN)
-- =========================================================================================
--
-- Este script DDL crea el esquema relacional maestro para el Sistema de Gestión de 
-- Calidad Textil y Laboratorio (STFLab).
--
-- Compatible con:
--   - PostgreSQL 12, 13, 14, 15, 16+
--   - Supabase (incluye compatibilidad RLS opcional)
--   - Google Cloud SQL for PostgreSQL
--   - Amazon RDS / Neon / Render
--
-- Estructura Híbrida:
--   - Tablas Relacionales Normalizadas para análisis SQL e indexación rápida.
--   - Columnas JSONB para almacenar parámetros detallados de ensayos físicos y químicos.
--   - Triggers automáticos para trazabilidad y timestamps (updated_at).
-- =========================================================================================

-- 1. EXTENSIONES Y ESQUEMA
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUMERADOS
DO $$ BEGIN
    CREATE TYPE stflab_dictamen_tipo AS ENUM ('APROBADO', 'HALLAZGO', 'RECHAZADO', 'EN_PROCESO', 'PENDIENTE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE stflab_estado_flujo AS ENUM ('BORRADOR', 'ENVIADA', 'RECIBIDA', 'EN_PROCESO', 'FINALIZADA');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE stflab_decision_compra AS ENUM ('APROBADO', 'APROBADO_CON_DESCUENTO', 'RECHAZADO', 'PENDIENTE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. FUNCIÓN TRIGGER PARA ACTUALIZACIÓN DE TIMESTAMP
CREATE OR REPLACE FUNCTION update_stflab_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================================================
-- TABLA 1: stflab_proveedores (Catálogo Maestro de Proveedores Textiles e Insumos)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS stflab_proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_proveedor VARCHAR(64) UNIQUE,
    razon_social VARCHAR(255) NOT NULL,
    nombre_contacto VARCHAR(255),
    correo VARCHAR(255),
    telefono VARCHAR(64),
    pais VARCHAR(100) DEFAULT 'Colombia',
    ciudad VARCHAR(100),
    tipo_proveedor VARCHAR(64) DEFAULT 'TELA', -- 'TELA', 'ACCESORIO', 'MIXTO'
    calificacion_promedio NUMERIC(3,2) DEFAULT 5.0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================================
-- TABLA 2: stflab_solicitudes_telas (Cabecera de Solicitudes de Evaluación de Telas)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS stflab_solicitudes_telas (
    id VARCHAR(64) PRIMARY KEY,
    numero_solicitud VARCHAR(64) NOT NULL UNIQUE,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    solicitante VARCHAR(255) NOT NULL,
    correo_solicitante VARCHAR(255),
    proveedor VARCHAR(255) NOT NULL,
    marca VARCHAR(64) DEFAULT 'Studio F',
    orden_compra VARCHAR(64),
    estado_flujo VARCHAR(64) DEFAULT 'ENVIADA',
    dictamen_global VARCHAR(64) DEFAULT 'PENDIENTE',
    fecha_recibido_lab TIMESTAMP WITH TIME ZONE,
    fecha_finalizacion TIMESTAMP WITH TIME ZONE,
    analista_responsable VARCHAR(255),
    observaciones_generales TEXT,
    documento_original_nombre VARCHAR(255),
    documento_original_url TEXT,
    drive_file_id VARCHAR(128),
    total_telas_items INTEGER DEFAULT 1,
    metadata_adicional JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_stflab_solicitudes_telas_upd ON stflab_solicitudes_telas;
CREATE TRIGGER trg_stflab_solicitudes_telas_upd
    BEFORE UPDATE ON stflab_solicitudes_telas
    FOR EACH ROW EXECUTE FUNCTION update_stflab_timestamp();

-- =========================================================================================
-- TABLA 3: stflab_items_telas (Detalle de Rollos/Telas y Ensayos de Laboratorio)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS stflab_items_telas (
    id VARCHAR(64) PRIMARY KEY,
    solicitud_id VARCHAR(64) NOT NULL REFERENCES stflab_solicitudes_telas(id) ON DELETE CASCADE,
    referencia VARCHAR(255) NOT NULL,
    descripcion_tela TEXT,
    color VARCHAR(128),
    composicion VARCHAR(255),
    solicitud_compra VARCHAR(64),
    oc_col VARCHAR(64),
    lote VARCHAR(64),
    rollo VARCHAR(64),
    
    -- Ensayos Físicos de Laboratorio
    gramaje_medido NUMERIC(8,2),
    ancho_util_medido NUMERIC(8,2),
    ancho_total_medido NUMERIC(8,2),
    encogimiento_largo_porc NUMERIC(6,2),
    encogimiento_ancho_porc NUMERIC(6,2),
    viro_torsion_porc NUMERIC(6,2),
    elasticidad_trama_porc NUMERIC(6,2),
    recuperacion_elastica_porc NUMERIC(6,2),
    
    -- Ensayos Químicos y Solideces (Escala 1 a 5)
    solidez_lavado_cambio NUMERIC(3,1),
    solidez_lavado_manchado NUMERIC(3,1),
    solidez_frote_seco NUMERIC(3,1),
    solidez_frote_humedo NUMERIC(3,1),
    resistencia_pilling NUMERIC(3,1),
    
    -- Dictamen Técnico y Decisión Comercial
    dictamen_lab VARCHAR(64) DEFAULT 'PENDIENTE',
    resultado_lab_detalle TEXT,
    responsable_lab VARCHAR(255),
    fecha_dictamen TIMESTAMP WITH TIME ZONE,
    
    decision_compra VARCHAR(64) DEFAULT 'PENDIENTE',
    descuento_negociado_porc NUMERIC(5,2) DEFAULT 0.0,
    responsable_compra VARCHAR(255),
    fecha_decision_compra TIMESTAMP WITH TIME ZONE,
    observacion_compra TEXT,

    -- Objeto completo de ensayos y valores de norma (JSONB para máxima versatilidad)
    ensayos_completos_json JSONB DEFAULT '{}'::jsonb,
    fotos_ensayos_urls JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stflab_items_telas_sol ON stflab_items_telas(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_stflab_items_telas_ref ON stflab_items_telas(referencia);
CREATE INDEX IF NOT EXISTS idx_stflab_items_telas_dict ON stflab_items_telas(dictamen_lab);

-- =========================================================================================
-- TABLA 4: stflab_solicitudes_accesorios (Solicitudes de Accesorios e Insumos)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS stflab_solicitudes_accesorios (
    id VARCHAR(64) PRIMARY KEY,
    numero_solicitud VARCHAR(64) NOT NULL UNIQUE,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    solicitante VARCHAR(255) NOT NULL,
    proveedor VARCHAR(255) NOT NULL,
    marca VARCHAR(64) DEFAULT 'Studio F',
    prioridad VARCHAR(32) DEFAULT 'NORMAL', -- 'ALTA', 'NORMAL', 'URGENTE'
    estado_flujo VARCHAR(64) DEFAULT 'ENVIADA',
    dictamen_global VARCHAR(64) DEFAULT 'PENDIENTE',
    observaciones_generales TEXT,
    documento_original_url TEXT,
    drive_file_id VARCHAR(128),
    total_muestras INTEGER DEFAULT 1,
    metadata_adicional JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS trg_stflab_solicitudes_acc_upd ON stflab_solicitudes_accesorios;
CREATE TRIGGER trg_stflab_solicitudes_acc_upd
    BEFORE UPDATE ON stflab_solicitudes_accesorios
    FOR EACH ROW EXECUTE FUNCTION update_stflab_timestamp();

-- =========================================================================================
-- TABLA 5: stflab_items_accesorios (Detalle de Muestras de Insumos/Accesorios)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS stflab_items_accesorios (
    id VARCHAR(64) PRIMARY KEY,
    solicitud_id VARCHAR(64) NOT NULL REFERENCES stflab_solicitudes_accesorios(id) ON DELETE CASCADE,
    referencia VARCHAR(255) NOT NULL,
    color VARCHAR(128),
    talla VARCHAR(64),
    cantidad_piezas NUMERIC(10,2) DEFAULT 1,
    descripcion_insumo TEXT,
    tipo_insumo VARCHAR(128), -- 'BOTON', 'CREMALLERA', 'ELASTICO', 'HERRAJE', 'HILO', etc.
    
    -- Resultados de Pruebas Físicas / Mecánicas
    resistencia_traccion_kg NUMERIC(8,2),
    resistencia_fatiga_ciclos INTEGER,
    resistencia_corrosion VARCHAR(64),
    calificacion_acabado VARCHAR(64),
    
    dictamen_lab VARCHAR(64) DEFAULT 'PENDIENTE',
    resultado_lab_detalle TEXT,
    observacion_lab TEXT,
    responsable_lab VARCHAR(255),
    fecha_dictamen TIMESTAMP WITH TIME ZONE,
    
    ensayos_detalle_json JSONB DEFAULT '{}'::jsonb,
    fotos_urls JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stflab_items_acc_sol ON stflab_items_accesorios(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_stflab_items_acc_ref ON stflab_items_accesorios(referencia);

-- =========================================================================================
-- TABLA 6: stflab_fichas_tecnicas (Biblioteca Maestra y Fichas Oficiales)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS stflab_fichas_tecnicas (
    id VARCHAR(64) PRIMARY KEY,
    codigo_ft VARCHAR(64) NOT NULL,
    referencia VARCHAR(255) NOT NULL,
    proveedor VARCHAR(255) NOT NULL,
    referencia_proveedor VARCHAR(255),
    composicion TEXT,
    tipo_tejido VARCHAR(128), -- 'PLANO', 'PUNTO', 'DENIM', 'NO_TEJIDO'
    peso_g_m2 NUMERIC(8,2),
    ancho_util_cm NUMERIC(8,2),
    ancho_total_cm NUMERIC(8,2),
    version_actual VARCHAR(32) DEFAULT '1.0',
    fecha_version TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usuario_creador VARCHAR(255),
    
    -- Tolerancias estándar para homologación
    tolerancia_gramaje_porc NUMERIC(5,2) DEFAULT 5.0,
    encogimiento_largo_max_porc NUMERIC(5,2) DEFAULT -3.0,
    encogimiento_ancho_max_porc NUMERIC(5,2) DEFAULT -3.5,
    viro_max_porc NUMERIC(5,2) DEFAULT 3.0,
    solidez_lavado_min NUMERIC(3,1) DEFAULT 4.0,
    solidez_frote_seco_min NUMERIC(3,1) DEFAULT 4.0,
    solidez_frote_humedo_min NUMERIC(3,1) DEFAULT 3.0,
    
    -- Enlaces a Google Drive y archivo
    drive_file_id VARCHAR(128),
    url_drive_archivo TEXT,
    nombre_archivo_adjunto VARCHAR(255),
    
    especificaciones_completas_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stflab_ft_codigo ON stflab_fichas_tecnicas(codigo_ft);
CREATE INDEX IF NOT EXISTS idx_stflab_ft_ref ON stflab_fichas_tecnicas(referencia);
CREATE INDEX IF NOT EXISTS idx_stflab_ft_prov ON stflab_fichas_tecnicas(proveedor);

-- =========================================================================================
-- TABLA 7: stflab_auditoria_logs (Trazabilidad y Registro de Cambios Inmutable)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS stflab_auditoria_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha_hora TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    coleccion VARCHAR(64) NOT NULL, -- 'SOLICITUDES_TELAS', 'FICHAS_TECNICAS', etc.
    documento_id VARCHAR(64) NOT NULL,
    accion VARCHAR(64) NOT NULL,    -- 'CREACION', 'ACTUALIZACION', 'DICTAMEN', 'ELIMINACION'
    usuario VARCHAR(255) NOT NULL,
    rol VARCHAR(64),
    area VARCHAR(64),
    campo_afectado VARCHAR(255),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    detalles TEXT,
    ip_origen VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stflab_audit_doc ON stflab_auditoria_logs(documento_id);
CREATE INDEX IF NOT EXISTS idx_stflab_audit_fecha ON stflab_auditoria_logs(fecha_hora);

-- =========================================================================================
-- VISTAS ANALÍTICAS PARA REPORTES GERENCIALES Y KPIS
-- =========================================================================================

-- Vista 1: Resumen de Aprobación del Laboratorio (KPIs)
CREATE OR REPLACE VIEW v_kpi_laboratorio_aprobacion AS
SELECT 
    DATE_TRUNC('month', COALESCE(it.fecha_dictamen, st.fecha_solicitud)) AS mes,
    COUNT(it.id) AS total_ensayos_telas,
    COUNT(CASE WHEN it.dictamen_lab = 'APROBADO' THEN 1 END) AS aprobados,
    COUNT(CASE WHEN it.dictamen_lab = 'HALLAZGO' THEN 1 END) AS hallazgos,
    COUNT(CASE WHEN it.dictamen_lab = 'RECHAZADO' THEN 1 END) AS rechazados,
    COUNT(CASE WHEN it.dictamen_lab = 'PENDIENTE' THEN 1 END) AS pendientes,
    ROUND(
        (COUNT(CASE WHEN it.dictamen_lab = 'APROBADO' THEN 1 END)::numeric / 
         NULLIF(COUNT(CASE WHEN it.dictamen_lab IN ('APROBADO', 'HALLAZGO', 'RECHAZADO') THEN 1 END), 0) * 100), 2
    ) AS tasa_aprobacion_porc
FROM stflab_items_telas it
JOIN stflab_solicitudes_telas st ON it.solicitud_id = st.id
GROUP BY DATE_TRUNC('month', COALESCE(it.fecha_dictamen, st.fecha_solicitud))
ORDER BY mes DESC;

-- Vista 2: Desempeño y Calidad por Proveedor
CREATE OR REPLACE VIEW v_desempeno_proveedores AS
SELECT 
    st.proveedor,
    COUNT(it.id) AS total_muestras_evaluadas,
    COUNT(CASE WHEN it.dictamen_lab = 'APROBADO' THEN 1 END) AS aprobadas,
    COUNT(CASE WHEN it.dictamen_lab = 'RECHAZADO' THEN 1 END) AS rechazadas,
    COUNT(CASE WHEN it.decision_compra = 'APROBADO_CON_DESCUENTO' THEN 1 END) AS aprobadas_con_descuento,
    ROUND(AVG(it.descuento_negociado_porc), 2) AS promedio_descuento_negociado_porc,
    ROUND(
        (COUNT(CASE WHEN it.dictamen_lab = 'APROBADO' THEN 1 END)::numeric / 
         NULLIF(COUNT(it.id), 0) * 100), 2
    ) AS tasa_calidad_porc
FROM stflab_solicitudes_telas st
JOIN stflab_items_telas it ON st.id = it.solicitud_id
GROUP BY st.proveedor
ORDER BY total_muestras_evaluadas DESC;

-- Comentario explicativo
COMMENT ON TABLE stflab_solicitudes_telas IS 'Registro maestro de solicitudes de calidad textil - STF Group S.A.';
COMMENT ON TABLE stflab_fichas_tecnicas IS 'Biblioteca y especificaciones técnicas de telas - STFLab';
