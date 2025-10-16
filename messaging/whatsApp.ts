// messaging/whatsApp.ts

import pino from "pino";
import qrcode from "qrcode-terminal";
import useSingleFileAuthState from "../src/utils/useSingleFileAuthState";

// Use a safe dynamic importer so TS in CJS doesn't transpile to require()
const dynamicImport = new Function("specifier", "return import(specifier)") as (
  s: string
) => Promise<any>;

// Global WhatsApp socket instance. We use 'any' since the Baileys types
// will be imported dynamically inside the function.
let sock: any;

/**
 * Initialize WhatsApp connection using Baileys
 */
export const initWhatsApp = async (): Promise<any> => {
  // --- START: Dynamic Import Block to resolve ERR_REQUIRE_ESM ---
  const { makeWASocket, fetchLatestBaileysVersion, DisconnectReason } =
    await dynamicImport("@whiskeysockets/baileys");
  // --- END: Dynamic Import Block ---

  const { state, saveCreds } = await useSingleFileAuthState("auth_info.json");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: "error" }),
    printQRInTerminal: false,
  });

  // Save updated credentials when they change
  sock.ev.on("creds.update", saveCreds);

  // Handle connection updates
  sock.ev.on("connection.update", (update: any) => {
    // Use 'any' for update if needed
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      console.log("📱 Scan this QR code with WhatsApp:");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        initWhatsApp();
      } else {
        console.log("❌ Logged out. Delete auth_info.json and re-scan QR.");
      }
    } else if (connection === "open") {
      console.log("✅ WhatsApp connected!");
    }
  });

  return sock;
};

/**
 * Send a WhatsApp message to multiple numbers
 */
export const sendBulkWhatsApp = async (
  numbers: string[],
  message: string
): Promise<void> => {
  if (!sock)
    throw new Error("WhatsApp not initialized. Call initWhatsApp() first.");

  for (const num of numbers) {
    try {
      const jid = num.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
      await sock.sendMessage(jid, { text: message });
      console.log(`✅ Sent message to ${num}`);
    } catch (err) {
      console.error(`❌ Failed to send message to ${num}:`, err);
    }
  }
};
