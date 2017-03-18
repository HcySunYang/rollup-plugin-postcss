import { createFilter } from 'rollup-pluginutils';
import postcss from 'postcss';
import styleInject from 'style-inject';
import path from 'path';
import fs from 'fs';
import cssnano from 'cssnano';

import Concat from 'concat-with-sourcemaps';

function cwd(file) {
  return path.join(process.cwd(), file);
}

function mkdirsSync(dirname) {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

function noop () {}

export default function (options = {}) {
  const filter = createFilter(options.include, options.exclude);
  const injectFnName = '__$styleInject'
  const extensions = options.extensions || ['.css', '.sss']
  const getExport = options.getExport || function () {}
  const combineStyleTags = !!options.combineStyleTags;
  const extractCss = options.extractCss ? options.extractCss : false;
  const outputPath = extractCss.outputPath;
  let fileName = extractCss.fileName;
  const concat = new Concat(true, 'styles.css', '\n');

  const injectStyleFuncCode = styleInject.toString().replace(/styleInject/, injectFnName);
  let resCodeAll = '';
  let tempFileName = 'extract';

  return {
    intro() {
      if(combineStyleTags) {
        return `${injectStyleFuncCode}\n${injectFnName}(${JSON.stringify(concat.content.toString('utf8'))})`;
      } else if (extractCss) {
        if (outputPath) {
          cssnano.process(resCodeAll).then(function (result) {
            fileName = fileName ? fileName : tempFileName;
            console.log(`Optimize css file output to ${outputPath}/${fileName}.css`);
            fs.writeFileSync(`${outputPath}/${fileName}.css`, result.css, 'utf8');
          });
        }
        return noop.toString();
      } else {
        return injectStyleFuncCode;
      }
    },
    transform(code, id) {
      if (!filter(id)) return null
      if (extensions.indexOf(path.extname(id)) === -1) return null
      const opts = {
        from: options.from ? cwd(options.from) : id,
        to: options.to ? cwd(options.to) : id,
        map: {
          inline: false,
          annotation: false
        },
        parser: options.parser
      };
      let r = postcss(options.plugins || [])
          .process(code, opts)
          .then(result => {
            let code, map;
            if(combineStyleTags) {
              concat.add(result.opts.from, result.css, result.map && result.map.toString());
              code = `export default ${JSON.stringify(getExport(result.opts.from))};`;
              map = { mappings: '' };
            } else if (extractCss) {
              let moduleName = path.basename(id, path.extname(id));
              mkdirsSync(outputPath);

              tempFileName = moduleName;
              resCodeAll += result.css;

              code = `export default ${noop.name}();`;
              map = options.sourceMap && result.map
                ? JSON.parse(result.map)
                : { mappings: '' };
            } else {
              code = `export default ${injectFnName}(${JSON.stringify(result.css)},${JSON.stringify(getExport(result.opts.from))});`;
              map = options.sourceMap && result.map
                ? JSON.parse(result.map)
                : { mappings: '' };
            }
            return { code, map };
          });
      return r;
    }
  };
};
