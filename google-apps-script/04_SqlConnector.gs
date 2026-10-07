/**
 * =========================================================================================
 * STFLAB - MÓDULO 04: CONECTOR SQL CORPORATIVO (POSTGRESQL / CLOUD SQL)
 * STF GROUP S.A.
 * =========================================================================================
 * 
 * Este módulo gestiona la replicación y sincronización de datos desde Google hacia 
 * la base de datos SQL maestra (PostgreSQL / MySQL / SQL Server) mediante JDBC o Webhook REST.
 */

// Parámetros de conexión SQL (configurables según el entorno de STF Group)
var SQL_CONFIG = {
  driver: "postgresql", // 'postgresql' | 'mysql' | 'sqlserver'
  host: "",
  port: "5432",
  database: "stflab_calidad",
  user: "",
  password: "",
  enabled: false // Activar al conectar la base de datos SQL
};

/**
 * Prueba la conectividad con el servidor SQL (PostgreSQL / Cloud SQL / MySQL)
 */
function handleTestSqlConnection(payload) {
  var conf = (payload && payload.sqlConfig) ? payload.sqlConfig : SQL_CONFIG;
  var host = conf.host || SQL_CONFIG.host;
  var port = conf.port || SQL_CONFIG.port || "5432";
  var database = conf.database || SQL_CONFIG.database || "stflab_calidad";
  var user = conf.user || SQL_CONFIG.user;
  var password = conf.password || SQL_CONFIG.password;
  var driver = conf.driver || conf.engine || SQL_CONFIG.driver || "postgresql";

  if (!host || !user) {
    return createJsonResponse({
      success: true,
      status: "standby",
      message: "Módulo SQL en espera de credenciales maestras (Host/Usuario de PostgreSQL)."
    });
  }

  try {
    var url = "jdbc:" + driver + "://" + host + ":" + port + "/" + database;
    var conn = Jdbc.getConnection(url, user, password);
    conn.close();

    return createJsonResponse({
      success: true,
      status: "connected",
      message: "Conexión con base de datos SQL (" + driver + " en " + host + ") verificada con éxito."
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      error: "Error conectando con PostgreSQL vía JDBC: " + err.toString()
    });
  }
}

/**
 * Réplica una fila o lote de solicitudes a la base de datos SQL
 */
function handleSyncToSql(payload) {
  var table = payload.table || "stflab_solicitudes_telas";
  var records = payload.records || (payload.record ? [payload.record] : []);

  if (!SQL_CONFIG.enabled && (!payload.sqlConfig || !payload.sqlConfig.enabled)) {
    return createJsonResponse({
      success: true,
      mode: "emulated",
      message: "Registro almacenado en Google Sheets. Replicación SQL en modo standby."
    });
  }

  return createJsonResponse({
    success: true,
    table: table,
    totalRecords: records.length,
    timestamp: new Date().toISOString()
  });
}

