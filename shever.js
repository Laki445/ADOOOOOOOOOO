const express = require('express');
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const sessions = new Map();

app.get('/code', async (req, res) => {
  let { number } = req.query;
  if (!number) return res.send({ error: true, message: 'Phone number is missing' });

  if (sessions.has(number)) {
    return res.send({ code: sessions.get(number) });
  }

  const { state, saveCreds } = await useMultiFileAuthState(`./session-${number}`);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('connection.update', (update) => {
    const { qr, connection, lastDisconnect } = update;

    if (qr) {
      sessions.set(number, qr);
      setTimeout(() => sessions.delete(number), 60 * 1000); // Remove after 1 min
      res.send({ code: qr });
    }

    if (connection === 'open') {
      console.log(`✅ WhatsApp connected for ${number}`);
    }

    if (connection === 'close') {
      console.log(`❌ Disconnected from ${number}`);
    }
  });

  sock.ev.on('creds.update', saveCreds);
});

app.listen(PORT, () => console.log(`✅ Server started on port ${PORT}`));
