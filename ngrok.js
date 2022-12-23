const ngrok = require("ngrok");
const config = require("./config");

(async function () {
  const url = await ngrok.connect({
    proto: "http",
    addr: config.port,
  });
  console.log(`ngrok running at ${url}`);
})();
