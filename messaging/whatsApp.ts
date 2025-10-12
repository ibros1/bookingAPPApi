// messaging/whatsapp.ts
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import useSingleFileAuthState from "../src/utils/useSingleFileAuthState";

let sock: ReturnType<typeof makeWASocket> | undefined;

export const initWhatsApp = async () => {
  const { state, saveCreds } = await useSingleFileAuthState("auth_info.json");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    auth: state,
    version,
    logger: pino({ level: "error" }),
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
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

export const sendBulkWhatsApp = async (numbers: string[], message: string) => {
  if (!sock)
    throw new Error("WhatsApp not initialized. Call initWhatsApp first.");

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
