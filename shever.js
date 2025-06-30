const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, makeWALegacySocket, makeInMemoryStore, DisconnectReason, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');

app.use(express.static(path.join(__dirname, 'public'))); // for serving frontend

// ✨ Pairing code API route
app.get('/code', async (req, res) => {
    let number = req.query.number;
    if (!number) return res.status(400).json({ error: 'Missing number' });

    try {
        const { state, saveCreds } = await useMultiFileAuthState(`./session/${number}`);
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            browser: ['FreeBot', 'Chrome', '1.0.0'],
        });

        await delay(1000);
        const code = await sock.requestPairingCode(number + '@s.whatsapp.net');

        console.log(`[✅] Pair code for ${number}: ${code}`);
        res.json({ code });
    } catch (err) {
        console.error(`[❌] Error generating code:`, err);
        res.status(500).json({ error: 'Failed to generate code' });
    }
});

// Default route for home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pair.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`✅ FreeBot V11 Server running at http://localhost:${port}`);
});
