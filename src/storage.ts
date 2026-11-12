import { newSave, reduce, saveSchema, type Command, type Save } from './engine';

const scope = new URL('.', location.href).pathname;
let db: Promise<IDBDatabase> | undefined;

function connect() {
  db ??= new Promise((resolve, reject) => {
    const request = indexedDB.open('other-exe:' + scope, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('local');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
  return db;
}

export function freshSave() {
  return newSave(crypto.randomUUID(), crypto.getRandomValues(new Uint32Array(1))[0], Date.now());
}

export function issue<T extends Omit<Command, 'key' | 'now'>>(input: T): T & { key: string; now: number } {
  return { ...input, key: crypto.randomUUID(), now: Date.now() };
}

export async function transact(update: (current: Save | undefined) => Save): Promise<Save> {
  const database = await connect();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('local', 'readwrite');
    const store = transaction.objectStore('local');
    const request = store.get('save');
    let result: Save;
    let error: unknown;
    request.onsuccess = () => {
      try {
        const current = request.result === undefined ? undefined : saveSchema.parse(request.result);
        result = update(current);
        if (result !== current) store.put(result, 'save');
      } catch (problem) {
        error = problem;
        transaction.abort();
      }
    };
    transaction.oncomplete = () => resolve(result);
    transaction.onabort = () => reject(error ?? transaction.error);
    transaction.onerror = () => reject(error ?? transaction.error);
  });
}

export function boot() {
  const resume = issue({ type: 'resume' as const });
  return transact(current => current ? reduce(current, resume) : freshSave());
}

export function exportSave(save: Save) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.download = 'other-exe-day-' + save.day + '.json';
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importSave(file: File) {
  if (file.size > 800_000) throw new Error('This file is too large for an OTHER.EXE save.');
  const parsed = saveSchema.safeParse(JSON.parse(await file.text()));
  if (!parsed.success) throw new Error('This file is not a compatible OTHER.EXE save.');
  return { ...parsed.data, at: Date.now() };
}
