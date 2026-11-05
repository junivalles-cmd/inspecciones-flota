// Cliente mínimo de Supabase (fetch directo, sin SDK) — mismo patrón que Control de Engrase.
// La URL y la anon key son públicas por diseño; la seguridad real la da RLS (supabase/schema.sql).
const SUPABASE_URL = 'https://jsdkwdytuvidvysvvzof.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_67ITk7dsXxtmG8PbYT7p7Q_u8w-PX7s';

const CLAVE_SESION = 'insp_sesion_v3';

function usuarioAEmail(usuario) {
  return usuario.trim().toLowerCase() + '@inspecciones.internal';
}

function guardarSesion(s) {
  localStorage.setItem(CLAVE_SESION, JSON.stringify(s));
}

function leerSesionGuardada() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION));
  } catch {
    return null;
  }
}

let sesionActual = leerSesionGuardada();

export function sesion() {
  return sesionActual;
}

export function esAdmin() {
  return sesionActual?.rol === 'admin';
}

export function cerrarSesion() {
  sesionActual = null;
  localStorage.removeItem(CLAVE_SESION);
}

async function obtenerPerfil(accessToken, userId) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${userId}&select=nombre,rol`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
  });
  const filas = await resp.json();
  if (!filas[0]) throw new Error('Esta cuenta no tiene un perfil asignado. Pide que te agreguen desde Equipos > (contacta al administrador).');
  return filas[0];
}

export async function iniciarSesion(usuario, password) {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: usuarioAEmail(usuario), password }),
  });
  if (!resp.ok) throw new Error('Usuario o contraseña incorrectos.');
  const datos = await resp.json();
  const perfil = await obtenerPerfil(datos.access_token, datos.user.id);
  sesionActual = {
    access_token: datos.access_token,
    refresh_token: datos.refresh_token,
    expira: Date.now() + datos.expires_in * 1000,
    usuario: usuario.trim().toLowerCase(),
    nombre: perfil.nombre,
    rol: perfil.rol,
  };
  guardarSesion(sesionActual);
  return sesionActual;
}

async function refrescarToken() {
  const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: sesionActual.refresh_token }),
  });
  if (!resp.ok) {
    cerrarSesion();
    throw new Error('La sesión expiró. Vuelve a entrar.');
  }
  const datos = await resp.json();
  sesionActual = { ...sesionActual, access_token: datos.access_token, refresh_token: datos.refresh_token, expira: Date.now() + datos.expires_in * 1000 };
  guardarSesion(sesionActual);
}

async function tokenValido() {
  if (!sesionActual) throw new Error('No hay sesión activa.');
  if (Date.now() > sesionActual.expira - 60000) await refrescarToken();
  return sesionActual.access_token;
}

// Llamada autenticada a PostgREST (tablas de supabase/schema.sql). `ruta` incluye filtros,
// ej. "inspecciones?id=eq.abc123".
export async function peticion(ruta, opciones = {}) {
  const token = await tokenValido();
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${ruta}`, {
    ...opciones,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(opciones.headers || {}),
    },
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.message || `Error del servidor (${resp.status}).`);
  }
  if (resp.status === 204) return null;
  const texto = await resp.text();
  return texto ? JSON.parse(texto) : null;
}
