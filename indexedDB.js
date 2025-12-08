// === PDA DEDRA IndexedDB – wersja stabilna (opcja C) ===

const DB_NAME = "dedraDB";
const DB_VERSION = 5;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("products"))
        db.createObjectStore("products", { keyPath: "symbol" });

      if (!db.objectStoreNames.contains("pos"))
        db.createObjectStore("pos", { keyPath: "symbol" });

      if (!db.objectStoreNames.contains("sets"))
        db.createObjectStore("sets", { keyPath: "symbol" });
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveData(store, items) {
  const db = await openDB();
  const tx = db.transaction(store, "readwrite");
  const st = tx.objectStore(store);
  items.forEach(i => st.put(i));
  return tx.complete;
}

async function loadData(store) {
  const db = await openDB();
  const tx = db.transaction(store, "readonly");
  return tx.objectStore(store).getAll();
}
