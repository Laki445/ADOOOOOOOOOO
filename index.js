const express = require("express");
const path = require("path");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { commandHandler } = require("./lib/command");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "pair.html"));
});

let globalSocket;

app.get("/code", async (req, res) => {
  const number = req.query.number;
  if (!number) return res.status(400).json({ error: "number required" });

  const { state, saveCreds } = await useMultiFileAuthState(`sessions/${number}`);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    generateHighQualityLinkPreview: true,
    browser: ['FreeBot', 'Safari', '1.0'],
  });

  globalSocket = sock;
  commandHandler(sock); // Load command handler

  sock.ev.on("connection.update", (update) => {
    if (update.pairingCode && update.connection === "open") {
      console.log("✅ Connected");
    }
  });

  await sock.waitForConnectionUpdate((u) => !!u.pairingCode);
  const code = sock?.ev?.store?.pairingCode || "123456";
  res.json({ code });
});

app.listen(PORT, () => console.log("Server Running on PORT", PORT));