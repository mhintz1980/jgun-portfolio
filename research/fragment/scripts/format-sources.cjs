const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const dir = path.resolve(__dirname, '../data/chunks');
const out = {};
for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.authored.js'))) {
  const ast = ts.createSourceFile(name, fs.readFileSync(path.join(dir, name), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  function visit(node) {
    if (ts.isObjectLiteralExpression(node) || ts.isArrayLiteralExpression(node)) ts.setEmitFlags(node, ts.EmitFlags.MultiLine);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  out[name.replace('.authored.js', '.source.js')] = ts.createPrinter({newLine:ts.NewLineKind.LineFeed}).printFile(ast);
}
process.stdout.write(JSON.stringify(out));
