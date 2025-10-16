// src/utils/useSingleFileAuthState.ts

import { readFileSync, writeFileSync, existsSync } from "fs";

// Safe dynamic import to avoid TS downleveling to require() in CJS
const dynamicImport = new Function("specifier", "return import(specifier)") as (
  s: string
) => Promise<any>;

// Export an ASYNC factory function
export default async function useSingleFileAuthState(filePath: string) {
  // --- Dynamic Load inside the ASYNC function ---
  const { initAuthCreds, BufferJSON } = await dynamicImport(
    "@whiskeysockets/baileys"
  );
  // --- END: Dynamic Load ---

  let creds: ReturnType<typeof initAuthCreds>;
  let keys: any = {};

  // ... (rest of your useSingleFileAuthState logic) ...

  const saveCreds = () => {
    try {
      writeFileSync(
        filePath,
        JSON.stringify({ creds, keys }, BufferJSON.replacer, 2)
      );
    } catch (err) {
      console.error("❌ Failed to save WhatsApp auth file:", err);
    }
  };

  // --- Safe read (recover if JSON invalid)
  try {
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, { encoding: "utf-8" });
      const parsed = JSON.parse(data, BufferJSON.reviver);
      creds = parsed.creds || initAuthCreds();
      keys = parsed.keys || {};
    } else {
      creds = initAuthCreds();
    }
  } catch (error) {
    console.warn("⚠️ Auth file corrupted, resetting session:", error);
    creds = initAuthCreds();
    keys = {};
  }

  const state = {
    creds,
    keys: {
      get: (type: string, ids: string[]) => {
        return ids.reduce((dict, id) => {
          const value = keys[type]?.[id];
          if (value) dict[id] = value;
          return dict;
        }, {} as Record<string, any>);
      },
      set: (data: any) => {
        for (const type in data) {
          keys[type] = keys[type] || {};
          Object.assign(keys[type], data[type]);
        }
        saveCreds();
      },
    },
  };

  return { state, saveCreds };
}
