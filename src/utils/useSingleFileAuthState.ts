// src/utils/useSingleFileAuthState.ts

import { readFileSync, writeFileSync, existsSync } from "fs";
// DELETE or COMMENT OUT THIS LINE:
// import { initAuthCreds, BufferJSON } from "@whiskeysockets/baileys";
// ^^^ This is the line causing the CJS/ESM error.

// Since the entire file is one export function, we make it async (which it already is)
export default async function useSingleFileAuthState(filePath: string) {
  // --- START: Dynamic Import Block to resolve ERR_REQUIRE_ESM ---
  const Baileys = await import("@whiskeysockets/baileys");

  // Destructure the needed Baileys exports from the dynamically loaded module
  const { initAuthCreds, BufferJSON } = Baileys as any;
  // --- END: Dynamic Import Block ---

  let creds: ReturnType<typeof initAuthCreds>;
  let keys: any = {};

  // Define saveCreds function early so it can be used inside state.keys.set
  const saveCreds = () => {
    try {
      writeFileSync(
        filePath,
        // Ensure BufferJSON.replacer and 'creds' are available here
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
      // Use the dynamically imported BufferJSON.reviver
      const parsed = JSON.parse(data, BufferJSON.reviver);
      creds = parsed.creds || initAuthCreds();
      keys = parsed.keys || {};
    } else {
      // Use the dynamically imported initAuthCreds
      creds = initAuthCreds();
    }
  } catch (error) {
    console.warn("⚠️ Auth file corrupted, resetting session:", error);
    // Use the dynamically imported initAuthCreds
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

  // The saveCreds definition has been moved up to ensure proper closure scope,
  // especially for Vercel's execution environment. (Though the original placement might work, this is safer).

  return { state, saveCreds };
}
