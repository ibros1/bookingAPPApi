import {
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
  SignalKeyStore,
  SignalDataTypeMap,
} from "@whiskeysockets/baileys";
import * as fs from "fs";

export default async function useSingleFileAuthState(file: string): Promise<{
  state: AuthenticationState;
  saveCreds: () => void;
}> {
  let creds: AuthenticationState["creds"];

  // strictly typed keys
  let keys: {
    [K in keyof SignalDataTypeMap]?: Record<string, SignalDataTypeMap[K]>;
  };

  if (fs.existsSync(file)) {
    const data = JSON.parse(
      fs.readFileSync(file, { encoding: "utf-8" }),
      BufferJSON.reviver
    );
    creds = data.creds;
    keys = data.keys;
  } else {
    creds = initAuthCreds();
    keys = {};
  }

  const saveState = () => {
    fs.writeFileSync(
      file,
      JSON.stringify({ creds, keys }, BufferJSON.replacer, 2)
    );
  };

  const keyStore: SignalKeyStore = {
    get: (type, ids) => {
      const result: any = {};
      for (const id of ids) {
        result[id] = keys[type]?.[id];
      }
      return result;
    },
    set: (data) => {
      for (const type of Object.keys(data) as (keyof SignalDataTypeMap)[]) {
        if (!keys[type]) keys[type] = {};
        Object.assign(keys[type]!, data[type]);
      }
      saveState();
    },
  };

  return {
    state: {
      creds,
      keys: keyStore,
    },
    saveCreds: saveState,
  };
}
