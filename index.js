const express = require("express");
const path = require("path");
const fs = require("fs");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require("@whiskeysockets/baileys");
const { commandHandler } = require("./lib/command");

const app = express();
const PORT = process.env.PORT || 10000;

// Serve static HTML page from /public
app.use(express.static(path.join(__dirname, "public")));

// Route for UI page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pair.html"));
});

app.get("/code", async (req, res) => {
  try {
    const number = req.query.number;
    if (!number) return res.status(400).json({ error: "Phone number required." });

    const { state, saveCreds } = await useMultiFileAuthState(`sessions/${number}`);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      printQRInTerminal: false,
      auth: state,
      browser: ['FreeBot', 'Chrome', '1.0'],
    });

    commandHandler(sock);

    let pairCode;
    sock.ev.on("connection.update", (update) => {
      if (update.pairingCode) {
        pairCode = update.pairingCode;
        res.json({ code: `wa://pair/${pairCode}` });
      } else if (update.connection === "open") {
        console.log("✅ WhatsApp Connected");
      } else if (update.connection === "close") {
        console.log("❌ Connection closed");
      }
    });

    // Time out after 15 seconds if no pairing code
    setTimeout(() => {
      if (!pairCode) return res.status(500).json({ error: "Failed to generate code." });
    }, 15000);

  } catch (e) {
    console.error("/code error:", e);
    return res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(PORT, () => console.log("🚀 Server running on port", PORT));
