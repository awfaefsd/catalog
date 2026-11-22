const fs = require('fs');
const path = require('path');
 
const SRC = path.join(__dirname, 'public');
const OUT = path.join(__dirname, 'dist');
 function minifyCss(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}
function minifyJs(text) {
  const lines = text.split('\n');
  const result = [];
 
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
 
    if (line === '') continue;
    if (line.indexOf('//') === 0) continue;
 
    result.push(line);
  }
 
  return result.join('\n');
}

// проходим по папке и переносим всё, что в ней есть
function build(from, to) {
 
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to);
  }
 
  const names = fs.readdirSync(from);
 
  for (let i = 0; i < names.length; i++) {
    const src = path.join(from, names[i]);
    const dst = path.join(to, names[i]);
 
    // если это папка, заходим внутрь неё
    if (fs.statSync(src).isDirectory()) {
      build(src, dst);
      continue;
    }
 
    const ext = path.extname(names[i]);
 
    // файлы со стилями сжимаем, остальные просто копируем
    if (ext === '.css') {
      const text = fs.readFileSync(src, 'utf8');
      const out = minifyCss(text);
      fs.writeFileSync(dst, out);
 
      const was = Buffer.byteLength(text);
      const now = Buffer.byteLength(out);
      console.log(names[i] + ': ' + was + ' -> ' + now);
      } else if (ext === '.js') {
      const text = fs.readFileSync(src, 'utf8');
      const out = minifyJs(text);
      fs.writeFileSync(dst, out);
      console.log(names[i] + ': ' + Buffer.byteLength(text) +
                  ' -> ' + Buffer.byteLength(out));
} else if (ext === '.html') {
      const text = fs.readFileSync(src, 'utf8');
      const out = minifyHtml(text);
      fs.writeFileSync(dst, out);
      console.log(names[i] + ': ' + Buffer.byteLength(text) +
                  ' -> ' + Buffer.byteLength(out));

      function minifyJs(text) {
  const lines = text.split('\n');
  const result = [];
 
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
 
    if (line === '') continue;
    if (line.indexOf('//') === 0) continue;
 
    result.push(line);
  }
 
  return result.join('\n');
}
function minifyHtml(text) {
  return text.replace(/<style>([\s\S]*?)<\/style>/, function (all, css) {
    return '<style>' + minifyCss(css) + '</style>';
  });
}


    } else {
      fs.copyFileSync(src, dst);
    }

  }
}
 
build(SRC, OUT);
console.log('Сборка готова');
