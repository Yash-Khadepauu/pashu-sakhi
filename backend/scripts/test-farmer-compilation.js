const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const htmlPath = path.join(__dirname, '..', '..', 'Farmer (4).html');
const html = fs.readFileSync(htmlPath, 'utf8');

const match = /<script\b[^>]*type="text\/babel"[^>]*>([\s\S]*?)<\/script>/i.exec(html);
if (!match) {
  console.error('No text/babel script found!');
  process.exit(1);
}

console.log('Found babel script, length:', match[1].length);

try {
  const res = ts.transpileModule(match[1], {
    compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 }
  });
  console.log('TypeScript JSX Transpile: SUCCESS! Output length:', res.outputText.length);
} catch (err) {
  console.error('JSX Transpile FAILED:', err);
}
