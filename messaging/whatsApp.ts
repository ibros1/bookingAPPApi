// messaging/whatsApp.ts

import pino from "pino";

import useSingleFileAuthState from "../src/utils/useSingleFileAuthState";
import { existsSync, unlinkSync } from "fs";
import qrcode from "qrcode-terminal";
// Global WhatsApp socket instance. We use 'any' since the Baileys types
// will be imported dynamically inside the function.
let sock: any;
let lastQr: string | null = null;
let isConnected = false;
let lastConnectedJid: string | null = null;

/**
 * Initialize WhatsApp connection using Baileys
 */
export const initWhatsApp = async (): Promise<any> => {
  // --- START: Dynamic Import Block to resolve ERR_REQUIRE_ESM ---
  const { makeWASocket, fetchLatestBaileysVersion, DisconnectReason } =
    await import("@whiskeysockets/baileys");
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
      lastQr = qr;
      try {
        qrcode.generate(qr, { small: true });
      } catch {}
    }

    if (connection === "close") {
      isConnected = false;
      const shouldReconnect =
        (lastDisconnect?.error as any)?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        initWhatsApp();
      } else {
        console.log(
          "❌ Logged out. Deleting auth_info.json and awaiting new QR."
        );
        try {
          if (existsSync("auth_info.json")) unlinkSync("auth_info.json");
        } catch {}
        initWhatsApp();
      }
    } else if (connection === "open") {
      console.log("✅ WhatsApp connected!");
      isConnected = true;
      lastQr = null;
      try {
        lastConnectedJid = sock?.user?.id ?? null;
      } catch {
        lastConnectedJid = null;
      }
    }
  });

  return sock;
};

export const getWhatsAppStatus = async (): Promise<{
  connected: boolean;
  qrDataUrl?: string;
  qrString?: string;
  lastConnectedJid?: string | null;
}> => {
  if (isConnected) return { connected: true, lastConnectedJid };
  if (lastQr) {
    try {
      const qrMod = await import("qrcode");
      const QR = (qrMod as any).default ?? qrMod;
      const dataUrl = await QR.toDataURL(lastQr, { margin: 2, scale: 6 });
      return {
        connected: false,
        qrDataUrl: dataUrl,
        qrString: lastQr,
        lastConnectedJid,
      };
    } catch {
      return { connected: false, qrString: lastQr, lastConnectedJid };
    }
  }
  return { connected: false, lastConnectedJid };
};

export const ensureWhatsAppStarted = async (): Promise<void> => {
  if (!sock) {
    await initWhatsApp();
  }
};

export const resetWhatsAppSession = async (): Promise<void> => {
  try {
    if (existsSync("auth_info.json")) unlinkSync("auth_info.json");
  } catch {}
  lastQr = null;
  isConnected = false;
  lastConnectedJid = null;
  sock = undefined;
  await initWhatsApp();
};

/**
 * Send a WhatsApp message to multiple numbers with better error handling
 */
export const sendBulkWhatsApp = async (
  numbers: string[],
  message: string
): Promise<{ success: number; failed: number; errors: string[] }> => {
  if (!sock) {
    throw new Error("WhatsApp not initialized. Call initWhatsApp() first.");
  }

  const results = { success: 0, failed: 0, errors: [] as string[] };

  for (const num of numbers) {
    try {
      // Clean and format phone number
      const cleanNumber = num.replace(/[^0-9]/g, "");
      if (!cleanNumber || cleanNumber.length < 10) {
        results.failed++;
        results.errors.push(`Invalid phone number: ${num}`);
        continue;
      }

      const jid = cleanNumber + "@s.whatsapp.net";
      await sock.sendMessage(jid, { text: message });
      results.success++;
      console.log(`✅ Sent message to ${num}`);
    } catch (err) {
      results.failed++;
      const errorMsg = `Failed to send to ${num}: ${
        err instanceof Error ? err.message : "Unknown error"
      }`;
      results.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }

  return results;
};
