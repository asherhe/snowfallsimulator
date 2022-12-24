const path = require("path");
const express = require("express");
// const minify = require("express-minify");
const compression = require("compression");
const config = require("./config");

const app = express();
app.listen(config.port, function () {
  console.log(`server running at ${config.port}`);
});

app.use(compression());
// // don't minify already minified files
// app.use(function (req, res, next) {
//   if (/\.min\.(css|js)$/.test(req.url)) {
//     res.minifyOptions = res.minifyOptions || {};
//     res.minifyOptions.enable = false;
//   }
//   next();
// });
// app.use(minify({ cache: config.cache, js_match: /javascript/ }));
app.use((req, res, next) => {
  console.log(`GET ${req.url}`);
  next();
});
app.use(express.static(config.publicDir));
