const fs = require("fs");
const path = require("path");
const sass = require("sass");
const config = require("./config");

const minify = require("@node-minify/core");
const uglifyjs = require("@node-minify/uglify-js");
const cleanCSS = require("@node-minify/clean-css");
const htmlMinifier = require("@node-minify/html-minifier");
const jsonminify = require("@node-minify/jsonminify");

function changeExt(file, ext) {
  return path.join(path.dirname(file), path.basename(file, path.extname(file)) + ext);
}

/** @type {{[lang: string]: {compressor: string, options: any}}} */
const minifyConfig = {
  ".js": {
    compressor: uglifyjs,
    // https://github.com/mishoo/UglifyJS#minify-options
    options: {
      mangle: {
        keep_fargs: true,
        properties: true,
      },
    },
  },
  ".css": {
    compressor: cleanCSS,
    // https://github.com/clean-css/clean-css/tree/3.4#how-to-use-clean-css-api
    options: {
      advanced: true,
      keepSpecialComments: 0,
      root: config.publicDir,
    },
  },
  ".html": {
    compressor: htmlMinifier,
    // https://github.com/clean-css/clean-css/tree/3.4#how-to-use-clean-css-api
    options: {
      minifyCSS: true,
      minifyJS: true,
      quoteCharacter: '"',
      removeComments: true,
    },
  },
  ".json": {
    compressor: jsonminify,
  },
};

/**
 *
 * @param {string} from
 * @param {string} to
 */
async function copy(from, to) {
  console.log(`copying \x1b[32m${from}\x1b[0m -> \x1b[36m${to}\x1b[0m`);

  if (fs.lstatSync(from).isDirectory()) {
    if (!fs.existsSync(to)) fs.mkdirSync(to);

    let files = fs.readdirSync(from);
    files.forEach((file) => {
      copy(path.join(from, file), path.join(to, file));
    });
  } else {
    let ext = path.extname(from);
    switch (ext) {
      case ".scss":
      case ".sass":
        to = changeExt(to, ".css");
        console.log(`\x1b[33mcompiling sass: \x1b[32m${from}\x1b[0m -> \x1b[36m${to}\x1b[0m`);
        let result = sass.compile(from);
        fs.writeFileSync(to, result.css);
        break;
      default:
        fs.copyFileSync(from, to);
        break;
    }

    // minify files
    let minimize = !/\.min\..+$/.test(from);
    if (minimize) {
      for (let excludeDir of config.noMinimize) {
        excludeDir = path.join(config.srcDir, excludeDir);
        if (from.substring(0, excludeDir.length) == excludeDir) {
          minimize = false;
          break;
        }
      }
    }
    if (minimize) {
      if (ext in minifyConfig) {
        console.log(`\x1b[33mminifying: \x1b[36m${to}\x1b[0m`);
        await minify({
          compressor: minifyConfig[ext].compressor,
          input: to,
          output: to,
          options: minifyConfig[ext].options,
        }).catch((err) => {
          console.log(err);
        });
      }
    }
  }
}

console.log("clearing public dir");
fs.rmSync(config.publicDir, { recursive: true, force: true });

copy(config.srcDir, config.publicDir);
