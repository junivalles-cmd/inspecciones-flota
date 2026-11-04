// Persistencia del handle de carpeta en IndexedDB, para reconectar entre sesiones.

function abrir() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('insp_flota', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function kvSet(clave, valor) {
  const db = await abrir();
  return new Promise((resolve) => {
    const t = db.transaction('kv', 'readwrite');
    t.objectStore('kv').put(valor, clave);
    t.oncomplete = () => resolve();
  });
}

export async function kvGet(clave) {
  const db = await abrir();
  return new Promise((resolve) => {
    const q = db.transaction('kv').objectStore('kv').get(clave);
    q.onsuccess = () => resolve(q.result);
    q.onerror = () => resolve(null);
  });
}
