const fs = require('fs');
const path = require('path');
const ts = require(path.resolve(__dirname, '../../..', 'node_modules/typescript'));
const dir = path.resolve(__dirname, '../data/chunks');
const result = [];
for (const file of fs.readdirSync(dir).filter(n => n.endsWith('.source.js'))) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const defs = new Map();
  function collect(n) {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) defs.set(n.name.text, n.initializer);
    ts.forEachChild(n, collect);
  }
  collect(ast);
  function value(n, depth = 0) {
    if (!n) return null;
    if (depth > 12) return n.getText(ast).slice(0, 100);
    if (ts.isStringLiteralLike(n)) return n.text;
    if (ts.isNumericLiteral(n)) return Number(n.text);
    if (n.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (n.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isIdentifier(n) && defs.has(n.text) && /^(animation|transition)/.test(n.text)) return value(defs.get(n.text), depth + 1);
    if (ts.isObjectLiteralExpression(n)) return Object.fromEntries(n.properties.filter(ts.isPropertyAssignment).map(p => [p.name.getText(ast).replace(/^['"]|['"]$/g, ''), value(p.initializer, depth + 1)]));
    if (ts.isArrayLiteralExpression(n)) return n.elements.map(e => value(e, depth + 1));
    return n.getText(ast).slice(0, 250);
  }
  function visit(n) {
    if (ts.isCallExpression(n) && /_jsx|_jsxs/.test(n.expression.getText(ast))) {
      const props = n.arguments[1];
      if (props && ts.isObjectLiteralExpression(props)) {
        const fields = props.properties.filter(ts.isPropertyAssignment);
        const chosen = fields.filter(p => /^(animate|initial|whileHover|whileTap|variants|transition|tickerEffect|__framer__)/.test(p.name.getText(ast)));
        if (chosen.length) {
          const get = key => fields.find(p => p.name.getText(ast).replace(/^['"]|['"]$/g, '') === key)?.initializer;
          const children = get('children')?.getText(ast) || '';
          const labels = [...children.matchAll(/children:\s*["`]([^"`]+)["`]/g)].map(m => m[1]).slice(0, 3);
          const definitionLines = new Set();
          function references(node) {
            if (ts.isIdentifier(node) && /^(animation|transition)/.test(node.text) && defs.has(node.text)) definitionLines.add(ast.getLineAndCharacterOfPosition(defs.get(node.text).getStart(ast)).line + 1);
            ts.forEachChild(node, references);
          }
          chosen.forEach(references);
          result.push({ file, line: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line + 1, definitionLines: [...definitionLines],
            component: n.arguments[0].getText(ast), name: value(get('data-framer-name')), className: value(get('className')), labels,
            effects: Object.fromEntries(chosen.map(p => [p.name.getText(ast), value(p.initializer)])) });
        }
        const overrides = fields.find(p => p.name.getText(ast) === 'overrides')?.initializer;
        const child = fields.find(p => p.name.getText(ast) === 'children')?.initializer;
        if (overrides && ts.isObjectLiteralExpression(overrides) && child && ts.isCallExpression(child) && child.arguments[1] && ts.isObjectLiteralExpression(child.arguments[1])) {
          const childFields = child.arguments[1].properties.filter(ts.isPropertyAssignment);
          const base = Object.fromEntries(childFields.filter(p => /^(animate|initial|whileHover|whileTap|variants|transition|tickerEffect|__framer__)/.test(p.name.getText(ast))).map(p => [p.name.getText(ast), value(p.initializer)]));
          const breakpoints = value(defs.get('breakpoints')) || {};
          for (const bp of overrides.properties) {
            if (!ts.isPropertyAssignment(bp) || !ts.isObjectLiteralExpression(bp.initializer)) continue;
            const overridesFields = bp.initializer.properties.filter(ts.isPropertyAssignment).filter(p => /^(animate|initial|whileHover|whileTap|tickerEffect|__framer__)/.test(p.name.getText(ast)));
            if (!overridesFields.length) continue;
            const bpName = bp.name.getText(ast);
            const getChild = key => childFields.find(p => p.name.getText(ast).replace(/^['"]|['"]$/g, '') === key)?.initializer;
            result.push({ file, line: ast.getLineAndCharacterOfPosition(bp.getStart(ast)).line + 1, definitionLines: [],
              component: child.arguments[0].getText(ast), name: value(getChild('data-framer-name')) || value(getChild('className')), className: value(getChild('className')), labels: [],
              breakpoint: breakpoints[bpName] || bpName,
              effects: { ...base, ...Object.fromEntries(overridesFields.map(p => [p.name.getText(ast), value(p.initializer)])) } });
          }
        }
      }
    }
    ts.forEachChild(n, visit);
  }
  visit(ast);
}
process.stdout.write(JSON.stringify(result, null, 2));
