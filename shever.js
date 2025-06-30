const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// === Show homepage ===
app.get('/', (req, res) => {
  res.send(`
    <h2>✅ FreeBot V11 Working!</h2>
    <p>Enter your number below to get a Pair Code.</p>
    <form method="POST" action="/pair">
      <input type="text" name="number" placeholder="+9477XXXXXXX" required />
      <button type="submit">Get Code</button>
    </form>
  `);
});

// === POST /pair route ===
app.post('/pair', async (req, res) => {
  const number = req.body.number;
  if (!number) return res.send("❌ Number is required!");

  const cmd = `node index.js '${number}'`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error('Error:', err);
      return res.send('❌ Failed to generate code.');
    }

    const match = stdout.match(/wa:\/\/pair\/[0-9A-Za-z?=\/\-]+/);
    if (match) {
      res.send(`
        <h2>✅ Copy & Paste this on WhatsApp > Link Device</h2>
        <pre>${match[0]}</pre>
        <button onclick="navigator.clipboard.writeText('${match[0]}')">Copy</button>
      `);
    } else {
      res.send("❌ Pair code not found. Try again.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
