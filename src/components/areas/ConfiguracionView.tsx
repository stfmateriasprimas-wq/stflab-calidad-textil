import React, { useState, useEffect } from 'react';
import { useQuality } from '../../context/QualityContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme, FontSizeLevel } from '../../context/ThemeContext';
import { 
  Settings, 
  User, 
  Users,
  UserPlus,
  Shield, 
  CheckCircle, 
  Smartphone, 
  Database, 
  Download, 
  RefreshCw, 
  Layers,
  Sparkles,
  Info,
  Plus,
  Edit3,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  X,
  CheckCircle2,
  Building2,
  KeyRound,
  BadgeCheck,
  Type,
  RotateCcw,
  Check,
  Search,
  Eye,
  EyeOff,
  Activity,
  HardDrive,
  Server
} from 'lucide-react';
import { AreaType, AnalistaLaboratorio, UserProfile, UserRole, RolUsuarioExt } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { esUsuarioAdminOSoporte } from '../../services/monitoringService';
import { GoogleIntegrationPanel } from './GoogleIntegrationPanel';
import { SqlDatabasePanel } from './SqlDatabasePanel';

export interface AreaResponsable {
  id: string;
  area: AreaType;
  nombre: string;
  cargo: string;
  email: string;
  esPrincipal?: boolean;
}

export const ConfiguracionView: React.FC = () => {
  const { 
    analistas,
    analistaActivo,
    limpiarTodosLosDatos,
    setAreaActual,
    googleConfig
  } = useQuality();
  const { t } = useLanguage();
  const { theme, toggleTheme, fontSize, setFontSize } = useTheme();
  const [notif, setNotif] = useState<string | null>(null);
  const [storageSize, setStorageSize] = useState<string>("0 KB");
  const [activeSettingsTab, setActiveSettingsTab] = useState<'usuarios' | 'apariencia' | 'tolerancias' | 'pwa' | 'almacenamiento' | 'google' | 'sql'>('usuarios');
  const { usuario, usuariosSistema, actualizarEstadoUsuario, eliminarUsuarioSistema, crearUsuarioSistema, actualizarUsuarioSistema } = useAuth();
  
  // Administradores y Soporte Técnico tienen privilegios totales para gestionar y editar TODOS los usuarios
  const esAdminOSoporte = usuario?.role === 'ADMIN' || 
                          usuario?.role === 'SOPORTE_TECNICO' ||
                          usuario?.role === 'soporte_tecnico' ||
                          usuario?.rolEspecifico?.toUpperCase().includes('ADMIN') ||
                          usuario?.rolEspecifico?.toLowerCase().includes('soporte') ||
                          usuario?.areaAsignada === 'soporte-tecnico';
  const esAdministrador = esAdminOSoporte; // Compatibilidad de permisos

  // Determinación de permisos de edición según requerimiento:
  // 1. Administradores y Soporte Técnico pueden editar TODOS los usuarios.
  // 2. El resto de áreas SOLO pueden editar sus usuarios (misma área o perfil propio).
  const puedeEditarUsuario = (u: UserProfile | null | undefined): boolean => {
    if (!usuario || !u) return false;
    if (esAdminOSoporte) return true;

    // Perfil propio
    if (u.uid === usuario.uid) return true;
    if (u.nombreUsuario && usuario.nombreUsuario && u.nombreUsuario.toLowerCase() === usuario.nombreUsuario.toLowerCase()) return true;
    if (u.email && usuario.email && u.email.toLowerCase() === usuario.email.toLowerCase()) return true;

    // Usuarios del resto de áreas: ÚNICAMENTE pueden editar usuarios asignados a su misma área
    const miArea = (usuario.areaAsignada || '').toLowerCase().trim();
    const uArea = (u.areaAsignada || '').toLowerCase().trim();
    if (miArea && uArea && miArea === uArea) {
      return true;
    }
    return false;
  };

  const [mostrarFormularioUsuario, setMostrarFormularioUsuario] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<UserProfile | null>(null);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');

  // Form Fields
  const [formNombreCompleto, setFormNombreCompleto] = useState('');
  const [formNombreUsuario, setFormNombreUsuario] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formShowPassword, setFormShowPassword] = useState(false);
  const [formArea, setFormArea] = useState<AreaType>('laboratorio');
  const [formRole, setFormRole] = useState<UserRole>('LABORATORIO');
  const [formRolEspecifico, setFormRolEspecifico] = useState<RolUsuarioExt>('ANALISTA_LABORATORIO');
  const [formEmail, setFormEmail] = useState('');
  const [formActivo, setFormActivo] = useState(true);

  const handleAbrirNuevoUsuario = () => {
    setUsuarioParaEditar(null);
    setFormNombreCompleto('');
    setFormNombreUsuario('');
    setFormPassword('');
    setFormShowPassword(false);
    setFormEmail('');
    
    // Si es Administrador o Soporte Técnico, puede asignar cualquier área
    // Si es de otra área, se asigna forzosamente su propia área de trabajo
    const areaDefault = esAdminOSoporte ? 'laboratorio' : ((usuario?.areaAsignada as AreaType) || 'laboratorio');
    setFormArea(areaDefault);

    const rolDefault: UserRole = 
      areaDefault === 'laboratorio' ? 'LABORATORIO' :
      areaDefault === 'compras' ? 'COMPRAS' :
      areaDefault === 'patronaje' ? 'PATRONAJE' :
      areaDefault === 'corte' ? 'CORTE' :
      areaDefault === 'soporte-tecnico' ? 'SOPORTE_TECNICO' : 'LABORATORIO';

    setFormRole(rolDefault);
    setFormRolEspecifico(
      rolDefault === 'LABORATORIO' ? 'ANALISTA_LABORATORIO' :
      rolDefault === 'COMPRAS' ? 'ANALISTA_COMPRAS' :
      rolDefault === 'PATRONAJE' ? 'PATRONISTA' :
      rolDefault === 'CORTE' ? 'SUPERVISOR_CORTE' :
      rolDefault === 'SOPORTE_TECNICO' ? 'soporte_tecnico' : 'ANALISTA_LABORATORIO'
    );
    setFormActivo(true);
    setMostrarFormularioUsuario(true);
  };

  const handleEditarUsuario = (u: UserProfile) => {
    // Validar permiso previo
    if (!puedeEditarUsuario(u)) {
      showToast('⚠️ Permiso restringido: El resto de áreas solo pueden editar usuarios de su propia área operativa.');
      return;
    }

    setUsuarioParaEditar(u);
    setFormNombreCompleto(u.displayName || '');
    setFormNombreUsuario(u.nombreUsuario || u.email.split('@')[0] || '');
    setFormPassword(u.password || '');
    setFormShowPassword(false);
    setFormEmail(u.email || '');
    setFormArea(u.areaAsignada || 'laboratorio');
    setFormRole(u.role || 'LABORATORIO');
    setFormRolEspecifico((u.rolEspecifico as RolUsuarioExt) || 'ANALISTA_LABORATORIO');
    setFormActivo(u.activo !== false);
    setMostrarFormularioUsuario(true);
  };

  const handleGuardarUsuarioInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombreCompleto.trim() || !formNombreUsuario.trim()) {
      showToast('⚠️ Por favor complete los campos obligatorios (*)');
      return;
    }

    const emailFinal = formEmail.trim() || `${formNombreUsuario.trim().toLowerCase()}@stfgroup.com`;

    if (usuarioParaEditar) {
      // 1. Validar si el usuario actual tiene permiso para editar este perfil
      if (!puedeEditarUsuario(usuarioParaEditar)) {
        showToast('⚠️ Permiso denegado: El resto de áreas solo pueden editar usuarios de su propia área operativa.');
        return;
      }

      const esMiUsuario = !!(usuario && (
        usuarioParaEditar.uid === usuario.uid ||
        (usuarioParaEditar.nombreUsuario && usuario.nombreUsuario && usuarioParaEditar.nombreUsuario.toLowerCase() === usuario.nombreUsuario.toLowerCase()) ||
        (usuarioParaEditar.email && usuario.email && usuarioParaEditar.email.toLowerCase() === usuario.email.toLowerCase())
      ));

      // 2. Administradores y Soporte Técnico pueden modificar área y rol libremente
      // El resto de áreas no puede cambiar el área asignada ni auto-escalar a ADMIN/SOPORTE
      if (!esAdminOSoporte && (formRole === 'ADMIN' || formRole === 'SOPORTE_TECNICO')) {
        showToast('⚠️ Solo Administradores y Soporte Técnico pueden asignar permisos administrativos.');
        return;
      }

      const areaFinal = esAdminOSoporte ? formArea : (usuarioParaEditar.areaAsignada || usuario?.areaAsignada || 'laboratorio');
      const roleFinal = esAdminOSoporte ? formRole : formRole;
      const rolEspecificoFinal = esAdminOSoporte ? formRolEspecifico : formRolEspecifico;
      const activoFinal = (esAdminOSoporte || !esMiUsuario) ? formActivo : usuarioParaEditar.activo;

      const res = await actualizarUsuarioSistema(usuarioParaEditar.uid, {
        displayName: formNombreCompleto.trim(),
        nombreUsuario: esAdminOSoporte ? formNombreUsuario.trim().toLowerCase() : (usuarioParaEditar.nombreUsuario || formNombreUsuario.trim().toLowerCase()),
        email: emailFinal,
        areaAsignada: areaFinal,
        role: roleFinal,
        rolEspecifico: rolEspecificoFinal,
        activo: activoFinal,
        ...(formPassword.trim() ? { password: formPassword.trim() } : {})
      });
      if (res.exito) {
        showToast(esAdminOSoporte
          ? `Usuario "${formNombreCompleto.trim()}" actualizado y guardado correctamente (Alcance Global).`
          : `Usuario de área "${formNombreCompleto.trim()}" actualizado y guardado correctamente.`
        );
        setMostrarFormularioUsuario(false);
        setUsuarioParaEditar(null);
      } else {
        showToast(res.mensaje);
      }
    } else {
      // Creación de nuevos usuarios INTERNAMENTE desde la plataforma
      // Si no es Admin/Soporte, el usuario se crea obligatoriamente dentro de su propia área
      const areaFinal = esAdminOSoporte ? formArea : ((usuario?.areaAsignada as AreaType) || 'laboratorio');

      if (!esAdminOSoporte && (formRole === 'ADMIN' || formRole === 'SOPORTE_TECNICO')) {
        showToast('⚠️ Solo Administradores y Soporte Técnico pueden crear cuentas con privilegios administrativos.');
        return;
      }

      const res = await crearUsuarioSistema({
        displayName: formNombreCompleto.trim(),
        nombreUsuario: formNombreUsuario.trim().toLowerCase(),
        email: emailFinal,
        password: formPassword.trim() || 'stf123',
        areaAsignada: areaFinal,
        role: formRole,
        rolEspecifico: formRolEspecifico,
        activo: formActivo
      });
      if (res.exito) {
        showToast(`Usuario "${formNombreCompleto.trim()}" registrado y creado internamente exitosamente.`);
        setMostrarFormularioUsuario(false);
        setUsuarioParaEditar(null);
      } else {
        showToast(res.mensaje);
      }
    }
  };

  const handleEliminarUsuario = async (u: UserProfile) => {
    if (usuario && u.uid === usuario.uid) {
      showToast("⚠️ No puedes eliminar tu propia cuenta mientras tengas la sesión activa.");
      return;
    }
    const confirmado = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente al usuario "${u.displayName}" (${u.nombreUsuario || u.email})?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    const res = await eliminarUsuarioSistema(u.uid);
    if (res.exito) {
      showToast(`Usuario "${u.displayName}" eliminado correctamente.`);
    } else {
      showToast(res.mensaje);
    }
  };

  const usuariosFiltrados = (usuariosSistema || []).filter(u => {
    if (!busquedaUsuario.trim()) return true;
    const q = busquedaUsuario.toLowerCase();
    return (
      (u.displayName || '').toLowerCase().includes(q) ||
      (u.nombreUsuario || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.areaAsignada || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.rolEspecifico || '').toLowerCase().includes(q)
    );
  });

  // Calculate local storage size
  useEffect(() => {
    let totalBytes = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalBytes += (localStorage[key].length + key.length) * 2;
      }
    }
    setStorageSize((totalBytes / 1024).toFixed(2) + " KB");
  }, [notif]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast("Configuración del laboratorio guardada correctamente.");
  };

  const showToast = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3000);
  };

  const handleExportBackup = () => {
    try {
      const backupData = {
        analistas,
        backupDate: new Date().toISOString(),
        platform: 'STFLab Quality 2.0'
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `STFLab_Backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      
      showToast("Copia de seguridad exportada en JSON correctamente.");
    } catch (e) {
      showToast("Fallo al exportar copia de seguridad.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Toast Notif */}
      {notif && (
        <div className="fixed bottom-4 right-4 bg-[#2B2B2E] text-[#C6A466] text-xs px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 border border-[#C6A466]/30 z-50 animate-bounce">
          <CheckCircle className="h-4 w-4 text-[#485C3E]" />
          <span>{notif}</span>
        </div>
      )}

      {/* Title block */}
      <div className="bg-[#2B2B2E] border border-[#424246] rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[#FBF8F2]">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-2xl bg-[#C6A466]/10 text-[#C6A466] border border-[#C6A466]/20 flex items-center justify-center shrink-0 shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-[#FBF8F2] tracking-tight font-sans">
                Configuración de la Plataforma STFLab 2.0
              </h2>
              <span className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-[#C6A466]/15 text-[#C6A466] border border-[#C6A466]/30 font-mono tracking-wider">
                SISTEMA & RBAC
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A8A095] mt-1 font-medium leading-relaxed">
              Gestión de usuarios laboratoristas, firmas digitales, parámetros de seguridad y copias de respaldo.
            </p>
          </div>
        </div>

        <span className="bg-[#1E1E21] text-[#C6A466] font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl border border-[#C6A466]/30 flex items-center space-x-2 self-start sm:self-center shrink-0">
          <Smartphone className="h-4 w-4 text-[#C6A466]" />
          <span>PWA Activa & Offline</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Options Navigation */}
        <div className="lg:col-span-4 bg-[#2D2D30] rounded-3xl border border-[#424246] shadow-sm p-4 space-y-1.5 h-fit text-[#FBF8F2]">
          <span className="text-[9px] font-bold text-[#AA9E80] uppercase tracking-widest px-3 block mb-1">Módulos del Sistema</span>
          
          <button 
            type="button"
            onClick={() => setActiveSettingsTab('usuarios')}
            className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              activeSettingsTab === 'usuarios' 
                ? 'bg-[#C6A466] text-[#2B2B2E] font-bold shadow-sm' 
                : 'text-[#AA9E80] hover:bg-[#2B2B2E] hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Users className="h-4 w-4" />
              <span>Gestión de Usuarios y Perfiles</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold font-mono bg-[#2B2B2E] text-[#C6A466] border border-[#424246]">
              {analistas.length}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSettingsTab('apariencia')}
            className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              activeSettingsTab === 'apariencia' 
                ? 'bg-[#00b4d8] text-white font-black shadow-md' 
                : 'text-[#AA9E80] hover:bg-[#2B2B2E] hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Type className="h-4 w-4" />
              <span>Tamaño de Letra & Apariencia</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-900/60 text-cyan-300 border border-cyan-500/30">
              {fontSize === 'pequena' ? 'Pequeña' : fontSize === 'grande' ? 'Grande' : 'Mediana'}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSettingsTab('tolerancias')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeSettingsTab === 'tolerancias' 
                ? 'bg-[#C6A466] text-[#2B2B2E] font-bold shadow-sm' 
                : 'text-[#AA9E80] hover:bg-[#2B2B2E] hover:text-white'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Tolerancias Técnicas (NTC)</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSettingsTab('pwa')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeSettingsTab === 'pwa' 
                ? 'bg-[#C6A466] text-[#2B2B2E] font-bold shadow-sm' 
                : 'text-[#AA9E80] hover:bg-[#2B2B2E] hover:text-white'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Configurar Acceso PWA Móvil</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSettingsTab('almacenamiento')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2.5 transition-all cursor-pointer ${
              activeSettingsTab === 'almacenamiento' 
                ? 'bg-[#C6A466] text-[#2B2B2E] font-bold shadow-sm' 
                : 'text-[#AA9E80] hover:bg-[#2B2B2E] hover:text-white'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>LocalStorage y Backups</span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveSettingsTab('google')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              activeSettingsTab === 'google' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold shadow-md' 
                : 'text-[#AA9E80] hover:bg-[#2B2B2E] hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <HardDrive className="h-4 w-4 text-emerald-400" />
              <span>Google Drive & Sheets DB</span>
            </div>
            {googleConfig?.webAppUrl && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" title="Google Workspace Conectado" />
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveSettingsTab('sql')}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
              activeSettingsTab === 'sql' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-extrabold shadow-md' 
                : 'text-[#AA9E80] hover:bg-[#2B2B2E] hover:text-white'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <Server className="h-4 w-4 text-indigo-400" />
              <span>Base de Datos SQL</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              PG
            </span>
          </button>

          {esUsuarioAdminOSoporte(usuario) && (
            <div className="pt-3 border-t border-[#424246]">
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest px-3 block mb-1">Supervisión</span>
              <button 
                type="button"
                onClick={() => setAreaActual('soporte-tecnico')}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center space-x-2.5">
                  <Activity className="h-4 w-4 text-cyan-400 group-hover:animate-pulse" />
                  <span>Centro de Monitoreo</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  EN VIVO
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right Settings Content Form */}
        <div className="lg:col-span-8 bg-[#2D2D30] text-[#FBF8F2] rounded-3xl border border-[#424246] shadow-sm p-6 space-y-6 text-xs">
          
          {/* MÓDULO ÚNICO: GESTIÓN INTEGRAL DE USUARIOS Y PERFILES */}
          {activeSettingsTab === 'usuarios' && (
            <div className="space-y-6 animate-fade-in font-sans">
              
              {/* Header de Módulo Único */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#424246] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-[#FBF8F2] flex items-center space-x-2">
                    <Users className="h-5 w-5 text-[#00b4d8]" />
                    <span>Gestión Integral de Usuarios y Perfiles</span>
                  </h3>
                  <p className="text-[#AA9E80] text-[11px] mt-1">
                    Módulo centralizado para administrar analistas emisores, firmas digitales y credenciales de acceso.
                  </p>
                </div>

                {/* Botón: Creación interna de usuarios (Admin/Soporte para cualquier área, resto de áreas para su propia área) */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleAbrirNuevoUsuario}
                    className="px-5 py-2.5 bg-[#00b4d8] hover:bg-[#0096c7] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-2 shadow-md hover:shadow-cyan-500/25 transition-all cursor-pointer active:scale-95"
                    title={esAdminOSoporte 
                      ? "Registrar internamente un nuevo usuario (Cualquier Área Operativa)" 
                      : `Registrar internamente un nuevo usuario para el área ${(usuario?.areaAsignada || 'su área').toUpperCase()}`}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>{esAdminOSoporte ? 'Nuevo Usuario' : `Nuevo Usuario (${(usuario?.areaAsignada || 'Área').toUpperCase()})`}</span>
                  </button>
                </div>
              </div>

              {/* Formulario Inline Integrado (Creación y Edición Interna) */}
              {mostrarFormularioUsuario && (
                <div className={`p-5 rounded-2xl border shadow-md space-y-4 animate-fade-in ${
                  theme === 'light'
                    ? 'bg-slate-100 border-slate-300 text-slate-800'
                    : 'bg-[#1e1e24] border-[#3a3a40] text-[#FBF8F2]'
                }`}>
                  <div className="flex items-center justify-between border-b pb-3 border-inherit">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-[#00b4d8]/15 text-[#00b4d8] border border-[#00b4d8]/30">
                        {usuarioParaEditar ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">
                          {usuarioParaEditar 
                            ? (usuarioParaEditar.uid === usuario?.uid 
                                ? `Editar Mi Perfil: ${usuarioParaEditar.displayName}` 
                                : esAdminOSoporte 
                                ? `Editar Usuario (Global): ${usuarioParaEditar.displayName}` 
                                : `Editar Usuario de Área: ${usuarioParaEditar.displayName}`)
                            : (esAdminOSoporte 
                                ? 'Registrar Nuevo Usuario (Cualquier Área)' 
                                : `Registrar Nuevo Usuario (Área ${(usuario?.areaAsignada || 'Actual').toUpperCase()})`)}
                        </h4>
                        <span className="text-[11px] opacity-75">
                          {usuarioParaEditar 
                            ? (esAdminOSoporte 
                                ? 'Privilegios totales: puede editar datos, credenciales, área y roles de cualquier usuario' 
                                : 'Edición de área: autorizado para actualizar los datos de usuarios de su misma área')
                            : 'Creación interna autorizada en el sistema (no disponible desde pantalla de acceso público)'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarFormularioUsuario(false);
                        setUsuarioParaEditar(null);
                      }}
                      className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 cursor-pointer"
                      title="Cerrar formulario"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleGuardarUsuarioInline} className="space-y-4">
                    {/* Field 1: Nombre Completo */}
                    <div>
                      <label className="block text-xs font-bold mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={formNombreCompleto}
                        onChange={(e) => setFormNombreCompleto(e.target.value)}
                        placeholder="ej: Edwin Diaz"
                        className={`w-full p-2.5 rounded-xl text-xs font-semibold border focus:outline-none focus:border-[#00b4d8] ${
                          theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#2B2B2E] border-[#424246] text-white'
                        }`}
                      />
                    </div>

                    {/* Row 2: Nombre de Usuario + Contraseña */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1">Nombre de Usuario (Login) *</label>
                        <input
                          type="text"
                          required
                          value={formNombreUsuario}
                          onChange={(e) => setFormNombreUsuario(e.target.value.toLowerCase().trim())}
                          placeholder="administracion"
                          className={`w-full p-2.5 rounded-xl text-xs font-mono font-semibold border focus:outline-none focus:border-[#00b4d8] ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#2B2B2E] border-[#424246] text-white'
                          }`}
                        />
                        <span className="text-[10px] opacity-70 mt-1 block">Identificador único para iniciar sesión</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">
                          Contraseña {usuarioParaEditar ? '(dejar en blanco para mantener)' : '*'}
                        </label>
                        <div className="relative">
                          <input
                            type={formShowPassword ? 'text' : 'password'}
                            value={formPassword}
                            onChange={(e) => setFormPassword(e.target.value)}
                            placeholder={usuarioParaEditar ? '••••••••' : 'stf123'}
                            className={`w-full p-2.5 pr-9 rounded-xl text-xs font-mono font-semibold border focus:outline-none focus:border-[#00b4d8] ${
                              theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#2B2B2E] border-[#424246] text-white'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setFormShowPassword(!formShowPassword)}
                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {formShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Área + Rol */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold">Área de Trabajo *</label>
                          {!esAdminOSoporte && (
                            <span className="text-[9px] text-amber-500 font-bold uppercase">Área Operativa Asignada</span>
                          )}
                        </div>
                        <select
                          value={formArea}
                          onChange={(e) => setFormArea(e.target.value as AreaType)}
                          disabled={!esAdminOSoporte}
                          className={`w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:border-[#00b4d8] ${
                            !esAdminOSoporte ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#2B2B2E] border-[#424246] text-white'
                          }`}
                        >
                          {esAdminOSoporte ? (
                            <>
                              <option value="dashboard">Administración / Dashboard</option>
                              <option value="soporte-tecnico">Soporte Técnico / Monitoreo</option>
                              <option value="laboratorio">Laboratorio</option>
                              <option value="compras">Compras</option>
                              <option value="patronaje">Patronaje</option>
                              <option value="corte">Corte</option>
                              <option value="portal-proveedor">Proveedor Textil</option>
                            </>
                          ) : (
                            <option value={usuario?.areaAsignada || 'laboratorio'}>
                              {(usuario?.areaAsignada || 'laboratorio').toUpperCase()} (Tu Área)
                            </option>
                          )}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold">Rol Asignado *</label>
                          {!esAdminOSoporte && (
                            <span className="text-[9px] text-sky-400 font-bold uppercase">Roles de Área</span>
                          )}
                        </div>
                        <select
                          value={formRole}
                          onChange={(e) => {
                            const selectedRole = e.target.value as UserRole;
                            setFormRole(selectedRole);
                            const mapRolExt: Record<UserRole, RolUsuarioExt> = {
                              ADMIN: 'ADMINISTRADOR',
                              SOPORTE_TECNICO: 'soporte_tecnico',
                              soporte_tecnico: 'soporte_tecnico',
                              LABORATORIO: 'ANALISTA_LABORATORIO',
                              COMPRAS: 'ANALISTA_COMPRAS',
                              PATRONAJE: 'PATRONISTA',
                              CORTE: 'SUPERVISOR_CORTE',
                              SUPERVISOR: 'CONSULTA',
                              PROVEEDOR: 'CONSULTA'
                            };
                            setFormRolEspecifico(mapRolExt[selectedRole] || 'ANALISTA_LABORATORIO');
                          }}
                          className={`w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:border-[#00b4d8] cursor-pointer ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#2B2B2E] border-[#424246] text-white'
                          }`}
                        >
                          {esAdminOSoporte ? (
                            <>
                              <option value="ADMIN">Administrador</option>
                              <option value="SOPORTE_TECNICO">Soporte Técnico</option>
                              <option value="LABORATORIO">Laboratorista</option>
                              <option value="COMPRAS">Analista de Compras</option>
                              <option value="PATRONAJE">Patronista</option>
                              <option value="CORTE">Supervisor de Corte</option>
                              <option value="SUPERVISOR">Supervisor General</option>
                              <option value="PROVEEDOR">Proveedor Fabricante</option>
                            </>
                          ) : (
                            <>
                              {usuario?.areaAsignada === 'laboratorio' && (
                                <>
                                  <option value="LABORATORIO">Laboratorista / Analista</option>
                                  <option value="SUPERVISOR">Supervisor de Laboratorio</option>
                                </>
                              )}
                              {usuario?.areaAsignada === 'compras' && (
                                <>
                                  <option value="COMPRAS">Analista de Compras</option>
                                  <option value="SUPERVISOR">Supervisor de Compras</option>
                                </>
                              )}
                              {usuario?.areaAsignada === 'patronaje' && (
                                <>
                                  <option value="PATRONAJE">Patronista / CAD</option>
                                  <option value="SUPERVISOR">Supervisor de Patronaje</option>
                                </>
                              )}
                              {usuario?.areaAsignada === 'corte' && (
                                <>
                                  <option value="CORTE">Supervisor de Corte</option>
                                  <option value="SUPERVISOR">Operador de Corte</option>
                                </>
                              )}
                              {usuario?.areaAsignada !== 'laboratorio' && usuario?.areaAsignada !== 'compras' && usuario?.areaAsignada !== 'patronaje' && usuario?.areaAsignada !== 'corte' && (
                                <>
                                  <option value="LABORATORIO">Analista Operativo</option>
                                  <option value="SUPERVISOR">Supervisor</option>
                                </>
                              )}
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Row 4: Correo + Estado */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-1">Correo Electrónico</label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="usuario@stfgroup.com"
                          className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:border-[#00b4d8] ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#2B2B2E] border-[#424246] text-white'
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold">Estado de Acceso</label>
                          {!esAdministrador && (
                            <span className="text-[9px] text-amber-500 font-bold uppercase">Solo Admin</span>
                          )}
                        </div>
                        <select
                          value={formActivo ? 'activo' : 'inactivo'}
                          onChange={(e) => setFormActivo(e.target.value === 'activo')}
                          disabled={!esAdministrador}
                          className={`w-full p-2.5 rounded-xl text-xs font-bold border focus:outline-none focus:border-[#00b4d8] ${
                            !esAdministrador ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
                          } ${
                            theme === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#2B2B2E] border-[#424246] text-white'
                          }`}
                        >
                          <option value="activo">Activo (Permite Login)</option>
                          <option value="inactivo">Inactivo (Acceso Bloqueado)</option>
                        </select>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center justify-end space-x-3 pt-3 border-t border-inherit">
                      <button
                        type="button"
                        onClick={() => {
                          setMostrarFormularioUsuario(false);
                          setUsuarioParaEditar(null);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold opacity-75 hover:opacity-100 cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-[#00b4d8] hover:bg-[#0096c7] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                      >
                        {usuarioParaEditar ? 'Guardar Cambios' : 'Crear Usuario'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabla de Usuarios Registrados integrada directamente en el módulo (Foto 1) */}
              <div className="space-y-3.5">
                
                {/* Cabecera superior de la tabla: color gris en modo claro */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-3.5 shadow-xs transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-200/90 border border-slate-300 text-slate-800'
                    : 'bg-[#1C1714] border border-[#2D2622] text-[#FBF8F2]'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-black uppercase tracking-wider ${
                      theme === 'light' ? 'text-slate-800' : 'text-[#FBF8F2]'
                    }`}>
                      Usuarios Registrados ({usuariosFiltrados.length})
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                      theme === 'light'
                        ? 'bg-cyan-100 text-cyan-800 border-cyan-300'
                        : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    }`}>
                      {esAdminOSoporte 
                        ? 'Gestión Global (Admin / Soporte: Edición de Todos los Usuarios)' 
                        : `Gestión Local (Área ${(usuario?.areaAsignada || 'Mi Área').toUpperCase()}: Solo Usuarios de su Área)`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                        theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                      }`} />
                      <input
                        type="text"
                        value={busquedaUsuario}
                        onChange={(e) => setBusquedaUsuario(e.target.value)}
                        placeholder="Buscar por usuario, nombre, rol..."
                        className={`pl-8 pr-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-[#00b4d8] w-48 sm:w-64 border ${
                          theme === 'light'
                            ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                            : 'bg-[#2B2B2E] border-[#424246] text-white placeholder-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Tabla con encabezado gris en modo claro y estilo refinado */}
                <div className={`overflow-x-auto rounded-2xl max-h-[460px] border shadow-md transition-colors ${
                  theme === 'light'
                    ? 'border-slate-300 bg-white'
                    : 'border-[#1e3461] bg-[#0f1b35]'
                }`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className={`font-black uppercase text-[10px] sm:text-[11px] tracking-wider border-b sticky top-0 z-10 ${
                      theme === 'light'
                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-[#0c1527] text-sky-400 border-[#1e3461]'
                    }`}>
                      <tr>
                        <th className="py-3.5 px-4">Usuario</th>
                        <th className="py-3.5 px-4">Nombre Completo</th>
                        <th className="py-3.5 px-4">Área</th>
                        <th className="py-3.5 px-4">Rol</th>
                        <th className="py-3.5 px-4 text-center">Estado</th>
                        <th className="py-3.5 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${
                      theme === 'light' ? 'divide-slate-200' : 'divide-[#1e3461]/70'
                    }`}>
                      {usuariosFiltrados.map((u) => {
                        const esMiUsuario = !!(usuario && (
                          u.uid === usuario.uid ||
                          (u.nombreUsuario && usuario.nombreUsuario && u.nombreUsuario.toLowerCase() === usuario.nombreUsuario.toLowerCase()) ||
                          (u.email && usuario.email && u.email.toLowerCase() === usuario.email.toLowerCase())
                        ));
                        const esMismaArea = !!(
                          usuario?.areaAsignada && 
                          u.areaAsignada && 
                          usuario.areaAsignada.toLowerCase().trim() === u.areaAsignada.toLowerCase().trim()
                        );
                        const puedeEditar = puedeEditarUsuario(u);

                        return (
                          <tr key={u.uid} className={`transition-colors ${
                            theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-[#152449]'
                          } ${esMiUsuario ? (theme === 'light' ? 'bg-sky-50/60' : 'bg-sky-950/20') : ''}`}>
                            <td className={`py-3.5 px-4 font-mono font-bold ${
                              theme === 'light' ? 'text-slate-800' : 'text-sky-200'
                            }`}>
                              {u.nombreUsuario || u.email.split('@')[0]}
                            </td>
                            <td className={`py-3.5 px-4 font-bold ${
                              theme === 'light' ? 'text-slate-900' : 'text-white'
                            }`}>
                              <div className="flex items-center gap-2">
                                <span>{u.displayName}</span>
                                {esMiUsuario && (
                                  <span className="text-[9px] bg-cyan-500/20 text-[#00b4d8] font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                                    Tú
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-black uppercase text-[#00b4d8]">
                              {u.areaAsignada || 'LABORATORIO'}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-2xs border ${
                                theme === 'light'
                                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                                  : 'bg-white text-slate-900 border-slate-300'
                              }`}>
                                {u.rolEspecifico || u.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                u.activo ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-600 border border-rose-500/40'
                              }`}>
                                {u.activo ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Botón Editar: Admin y Soporte pueden editar TODOS; resto de áreas solo sus usuarios y perfil propio */}
                                {puedeEditar ? (
                                  <button
                                    type="button"
                                    onClick={() => handleEditarUsuario(u)}
                                    className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-xs border ${
                                      theme === 'light'
                                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                                        : 'bg-sky-950 hover:bg-sky-900 text-sky-300 border-sky-600/40'
                                    }`}
                                    title={esMiUsuario 
                                      ? "Editar mi perfil personal" 
                                      : esAdminOSoporte 
                                      ? "Editar usuario (Permiso Total Admin/Soporte)" 
                                      : `Editar usuario de mi área (${(u.areaAsignada || 'Área').toUpperCase()})`}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>
                                      {esMiUsuario 
                                        ? 'Mi Perfil' 
                                        : esAdminOSoporte 
                                        ? 'Editar' 
                                        : 'Editar Área'}
                                    </span>
                                  </button>
                                ) : (
                                  <span 
                                    className={`text-[10px] font-semibold italic px-2 py-0.5 rounded-lg border ${
                                      theme === 'light' 
                                        ? 'bg-slate-100 text-slate-400 border-slate-200' 
                                        : 'bg-slate-800/60 text-slate-500 border-slate-700/40'
                                    }`}
                                    title="Solo lectura: Tu área solo puede editar usuarios pertenecientes a tu misma área operativa"
                                  >
                                    Solo lectura
                                  </span>
                                )}

                                {/* Activar/Desactivar: Exclusivo Administradores, Soporte Técnico o responsables de la misma área */}
                                {(esAdminOSoporte || esMismaArea) && u.uid !== usuario?.uid && (
                                  <button
                                    type="button"
                                    onClick={() => actualizarEstadoUsuario(u.uid, !u.activo)}
                                    className={`p-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                                      u.activo 
                                        ? (theme === 'light' ? 'text-emerald-600 hover:text-emerald-700 border-emerald-300 hover:bg-emerald-50' : 'text-emerald-400 hover:text-emerald-300 border-emerald-500/30 hover:bg-emerald-950/40')
                                        : (theme === 'light' ? 'text-rose-600 hover:text-rose-700 border-rose-300 hover:bg-rose-50' : 'text-rose-400 hover:text-rose-300 border-rose-500/30 hover:bg-rose-950/40')
                                    }`}
                                    title={u.activo ? 'Desactivar acceso al usuario' : 'Activar acceso al usuario'}
                                  >
                                    {u.activo ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                  </button>
                                )}

                                {/* Opción de borrar/eliminar: Exclusivo Administradores y Soporte Técnico */}
                                {esAdminOSoporte && u.uid !== usuario?.uid && (
                                  <button
                                    type="button"
                                    onClick={() => handleEliminarUsuario(u)}
                                    className={`p-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                      theme === 'light'
                                        ? 'text-rose-600 hover:text-white hover:bg-rose-600 border-rose-300 hover:border-rose-600'
                                        : 'text-rose-400 hover:text-white hover:bg-rose-600/80 border-rose-500/30 hover:border-rose-500'
                                    }`}
                                    title={`Eliminar usuario ${u.displayName}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {usuariosFiltrados.length === 0 && (
                        <tr>
                          <td colSpan={6} className={`py-8 text-center text-xs ${
                            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            No se encontraron usuarios que coincidan con la búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          )}

          {/* TAB: APARIENCIA Y TAMAÑO DE LETRA */}
          {activeSettingsTab === 'apariencia' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#424246] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-[#FBF8F2] flex items-center space-x-2">
                    <Type className="h-5 w-5 text-[#00b4d8]" />
                    <span>Nivel de Tamaño de Letra del Sistema</span>
                  </h3>
                  <p className="text-[#AA9E80] text-[11px] mt-1">
                    Ajusta proporcionalmente el tamaño de todos los textos, tablas y datos de la plataforma STFLab sin alterar el diseño ni romper cajas.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Escala Activa: {fontSize.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Selector de 3 Niveles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nivel Pequeña */}
                <div
                  onClick={() => {
                    setFontSize('pequena');
                    showToast('Tamaño de letra ajustado a: Pequeña (14px base - Compacta)');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    fontSize === 'pequena'
                      ? 'bg-[#00b4d8]/10 border-[#00b4d8] shadow-md ring-1 ring-[#00b4d8]/50'
                      : 'bg-[#252528] border-[#424246] hover:border-slate-500'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
                        Aa
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        14px Base (88%)
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#FBF8F2] flex items-center gap-1.5">
                        <span>Pequeña</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          Compacta
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#A8A095] mt-1 leading-relaxed">
                        Óptima para monitores compactos, tablas técnicas extensas de laboratorio y alta densidad de información.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#424246]/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Densidad Máxima</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      fontSize === 'pequena' ? 'border-[#00b4d8] bg-[#00b4d8]' : 'border-slate-500'
                    }`}>
                      {fontSize === 'pequena' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>

                {/* Nivel Mediana */}
                <div
                  onClick={() => {
                    setFontSize('mediana');
                    showToast('Tamaño de letra ajustado a: Mediana (16px base - Estándar)');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    fontSize === 'mediana'
                      ? 'bg-[#00b4d8]/10 border-[#00b4d8] shadow-md ring-1 ring-[#00b4d8]/50'
                      : 'bg-[#252528] border-[#424246] hover:border-slate-500'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-sm text-white">
                        Aa
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        16px Base (100%)
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#FBF8F2] flex items-center gap-1.5">
                        <span>Mediana</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          Recomendada
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#A8A095] mt-1 leading-relaxed">
                        Nivel estándar y armónico del sistema. Equilibrio exacto entre legibilidad y distribución visual.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#424246]/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Estándar STFLab</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      fontSize === 'mediana' ? 'border-[#00b4d8] bg-[#00b4d8]' : 'border-slate-500'
                    }`}>
                      {fontSize === 'mediana' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>

                {/* Nivel Grande */}
                <div
                  onClick={() => {
                    setFontSize('grande');
                    showToast('Tamaño de letra ajustado a: Grande (17.5px base - Confortable)');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    fontSize === 'grande'
                      ? 'bg-[#00b4d8]/10 border-[#00b4d8] shadow-md ring-1 ring-[#00b4d8]/50'
                      : 'bg-[#252528] border-[#424246] hover:border-slate-500'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-base text-white">
                        Aa
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        17.5px Base (110%)
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#FBF8F2] flex items-center gap-1.5">
                        <span>Grande</span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          Descansada
                        </span>
                      </h4>
                      <p className="text-[11px] text-[#A8A095] mt-1 leading-relaxed">
                        Mayor tamaño para lectura cómoda y descansada sin forzar la vista, manteniendo proporciones sin exagerar.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#424246]/60 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">Lectura Cómoda</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      fontSize === 'grande' ? 'border-[#00b4d8] bg-[#00b4d8]' : 'border-slate-500'
                    }`}>
                      {fontSize === 'grande' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista Previa en Vivo de la Escala */}
              <div className="bg-[#252528] border border-[#424246] rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#AA9E80]">
                    Vista Previa en Tiempo Real de Tipografía del Sistema
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFontSize('mediana');
                      showToast('Tipografía restablecida a Mediana (Estándar)');
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer a Mediana</span>
                  </button>
                </div>

                <div className="bg-[#1E1E21] border border-[#3A3A3D] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#3A3A3D] pb-2.5">
                    <span className="font-black text-sm text-[#FBF8F2]">
                      Control de Calidad Textil • STF GROUP S.A.
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                      DICTAMEN: APROBADO
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-[#2B2B2E] p-2 rounded-lg border border-[#424246]">
                      <span className="text-[10px] text-slate-400 block font-bold">Referencia</span>
                      <span className="font-mono font-bold text-[#FBF8F2]">STF-REF-9021</span>
                    </div>
                    <div className="bg-[#2B2B2E] p-2 rounded-lg border border-[#424246]">
                      <span className="text-[10px] text-slate-400 block font-bold">Insumo Evaluado</span>
                      <span className="font-bold text-[#FBF8F2]">Borlas & Flecos Trenzados</span>
                    </div>
                    <div className="bg-[#2B2B2E] p-2 rounded-lg border border-[#424246]">
                      <span className="text-[10px] text-slate-400 block font-bold">Tolerancia Técnica</span>
                      <span className="font-bold text-emerald-400">Cero Desprendimiento</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#A8A095] leading-relaxed">
                    Parámetros críticos y métodos de verificación técnica aplicables en la inspección de laboratorio textil conforme a normativa STF Group.
                  </p>
                </div>
              </div>

              {/* Ajuste rápido de Modo Claro / Modo Oscuro */}
              <div className="bg-[#252528] border border-[#424246] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-[#FBF8F2]">Tema Visual de la Plataforma</h4>
                  <p className="text-[11px] text-[#A8A095] mt-0.5">
                    Alterna entre Modo Claro (Blanco / Slate con textos de alto contraste) y Modo Oscuro (Azul Marino Profundo).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-[#00b4d8] hover:bg-[#0096c7] text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm shrink-0"
                >
                  <span>Cambiar a {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: TOLERANCIAS */}
          {activeSettingsTab === 'tolerancias' && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div>
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FBF8F2] border-b border-[#424246] pb-2">
                  Tolerancias Técnicas e Indicadores de Rechazo
                </h3>
                <p className="text-[#AA9E80] text-[11px] mt-1">
                  Alineado con Normas Técnicas Colombianas (NTC 228, NTC 230, NTC 481, NTC 1599) y AATCC 135.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">Límite Encogimiento Crítico Máximo (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue="3.0"
                      className="w-full bg-[#2B2B2E] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono font-bold outline-none focus:border-[#C6A466]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">Tolerancia de Desviación de Ancho Útil (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue="1.5"
                      className="w-full bg-[#2B2B2E] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono font-bold outline-none focus:border-[#C6A466]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">Límite de Elasticidad Trama Máxima (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      defaultValue="15.0"
                      className="w-full bg-[#2B2B2E] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono font-bold outline-none focus:border-[#C6A466]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide mb-1">Calificación de Pilling Mínima (Escala 1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      defaultValue="4"
                      className="w-full bg-[#2B2B2E] border border-[#424246] rounded-xl p-2.5 text-xs text-[#FBF8F2] font-mono font-bold outline-none focus:border-[#C6A466]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#424246]">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#C6A466] hover:bg-[#D6CDB8] text-[#2B2B2E] font-bold rounded-xl tracking-wider text-xs uppercase transition-colors cursor-pointer shadow-sm"
                >
                  Guardar Tolerancias Técnicas
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PWA */}
          {activeSettingsTab === 'pwa' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FBF8F2] border-b border-[#424246] pb-2 flex items-center space-x-2">
                  <Smartphone className="h-4.5 w-4.5 text-[#C6A466]" />
                  <span>Configuración e Instalación PWA (Acceso Directo Celular)</span>
                </h3>
                
                <p className="text-[#AA9E80] text-[11px] leading-relaxed mt-2">
                  Plataforma web de <strong>Studio F Group</strong> optimizada como <strong>PWA (Progressive Web App)</strong> para funcionar a pantalla completa con persistencia sin conexión.
                </p>

                {/* Visual Card del Icono Oficial PWA STFLAB */}
                <div className="bg-[#2B2B2E] border border-[#424246] rounded-2xl p-5 mt-4 flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative group shrink-0">
                    <img 
                      src="/pwa-icon-512.png" 
                      alt="Icono Oficial PWA STFLAB" 
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl shadow-xl border border-cyan-500/30 object-contain bg-[#060c18] transition-transform group-hover:scale-105"
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                      STFLAB PWA
                    </div>
                  </div>
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-sans font-black text-base text-white tracking-wide">STFLAB</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                        Icono Oficial Configurado
                      </span>
                    </div>
                    <p className="text-[#AA9E80] text-xs">
                      Este es el icono oficial con las letras <strong>STFLAB</strong> que verás al descargar e instalar la app en tu escritorio de Windows o pantalla de inicio de Android / iOS.
                    </p>
                    <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <a 
                        href="/pwa-icon-512.png" 
                        download="STFLAB-Icono-512.png"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00b4d8] hover:bg-[#0096c7] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Icono PNG</span>
                      </a>
                      <a 
                        href="/pwa-icon.svg" 
                        download="STFLAB-Icono.svg"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Vector SVG</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-[#2B2B2E] border border-[#424246] rounded-2xl p-4 mt-4 space-y-3">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-[#C6A466] block">📱 Cómo instalar en Dispositivo Móvil y Computador</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-[#2D2D30] border border-[#424246] rounded-xl space-y-1">
                      <span className="font-serif font-bold text-[#FBF8F2] text-[10px] uppercase block">En iOS (Apple Safari)</span>
                      <ol className="list-decimal list-inside text-[10px] text-[#AA9E80] space-y-1">
                        <li>Abra la plataforma en su navegador Safari.</li>
                        <li>Toque el botón de <strong>Compartir</strong> en la barra inferior.</li>
                        <li>Desplace y seleccione <strong>"Agregar a Inicio"</strong>.</li>
                      </ol>
                    </div>

                    <div className="p-3 bg-[#2D2D30] border border-[#424246] rounded-xl space-y-1">
                      <span className="font-serif font-bold text-[#FBF8F2] text-[10px] uppercase block">En Android (Chrome / Edge)</span>
                      <ol className="list-decimal list-inside text-[10px] text-[#AA9E80] space-y-1">
                        <li>Abra la app en Google Chrome.</li>
                        <li>Toque el menú de <strong>3 puntos</strong> superior.</li>
                        <li>Presione <strong>"Instalar Aplicación"</strong>.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ALMACENAMIENTO */}
          {activeSettingsTab === 'almacenamiento' && (
            <div className="space-y-5">
              <div>
                <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#FBF8F2] border-b border-[#424246] pb-2 flex items-center space-x-2">
                  <Database className="h-4.5 w-4.5 text-[#C6A466]" />
                  <span>Almacenamiento LocalStorage & Copias de Seguridad</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-[#2B2B2E] border border-[#424246] rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide block">Almacenamiento Consumido</span>
                    <span className="text-2xl font-bold text-[#FBF8F2] font-mono block">{storageSize}</span>
                  </div>

                  <div className="p-4 bg-[#2B2B2E] border border-[#424246] rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold text-[#AA9E80] uppercase tracking-wide block">Estado del Sistema</span>
                    <span className="text-[#485C3E] font-bold text-sm block">Sincronizado en Tiempo Real</span>
                  </div>
                </div>

                <div className="border-t border-[#424246] pt-4 mt-4 flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="bg-[#C6A466] hover:bg-[#D6CDB8] text-[#2B2B2E] px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    <span>Exportar Copia de Seguridad JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('⚠️ ¿Estás seguro de que deseas LIMPIAR TODOS LOS DATOS? Todas las solicitudes, muestras, fichas técnicas y elementos de papelera se eliminarán para que puedas probar el flujo desde cero.')) {
                        limpiarTodosLosDatos();
                        showToast("Todos los datos fueron borrados exitosamente. La app está en blanco.");
                      }
                    }}
                    className="bg-rose-600/80 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase flex items-center space-x-2 cursor-pointer shadow-sm border border-rose-500/40"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Limpiar Todos los Datos (Empezar de Cero)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GOOGLE WORKSPACE (DRIVE & SHEETS) */}
          {activeSettingsTab === 'google' && (
            <GoogleIntegrationPanel />
          )}

          {/* TAB 6: BASE DE DATOS SQL MAESTRA (POSTGRESQL / SUPABASE) */}
          {activeSettingsTab === 'sql' && (
            <SqlDatabasePanel />
          )}

        </div>
      </div>

    </div>
  );
};
