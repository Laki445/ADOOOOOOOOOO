const fs = require("fs");
const path = require("path");

function commandHandler(sock) {
  const pluginPath = path.join(__dirname, "../plugins");
  fs.readdirSync(pluginPath).forEach(file => {
    if (file.endsWith(".js")) {
      const plugin = require(path.join(pluginPath, file));
      if (typeof plugin === "function") plugin(sock);
    }
  });
}

module.exports = { commandHandler };
