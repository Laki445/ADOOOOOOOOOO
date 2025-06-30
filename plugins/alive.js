module.exports = (sock) => {
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || "";
    if (text === ".alive") {
      await sock.sendMessage(m.key.remoteJid, { text: "🟢 Bot is Alive!" }, { quoted: m });
    }
  });
};
