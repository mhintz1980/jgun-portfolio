const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');
const source = fs.readFileSync(path.join(__dirname, '../_dl/fresh/layout.js'), 'utf8');
const ast = require(path.join(root, 'node_modules/@babel/parser')).parse(source, {sourceType:'module'});
const generate = require(path.join(root, 'node_modules/@babel/generator')).default;
const names = new Set((process.argv[2] || '').split(','));
const filter = process.argv[3] ? new RegExp(process.argv[3]) : null;
for (const node of ast.program.body) {
  const items = node.type === 'VariableDeclaration' ? node.declarations : [node];
  for (const item of items) {
    const name = item.id?.name;
    if (!names.has(name)) continue;
    const value = item.init || item;
    if (value.type === 'ClassExpression') {
      for (const member of value.body.body) {
        const key = member.key?.name || member.key?.value || 'unknown';
        if (filter && !filter.test(key)) continue;
        console.log(`\n${name}.${key} [${member.start},${member.end})`);
        console.log(generate(member, {compact:false,comments:false}).code);
      }
    } else {
      console.log(`\n${name} [${item.start},${item.end})`);
      if (value.type === 'TemplateLiteral' && value.end-value.start > 500) {
        console.log('Shader/string length:',value.end-value.start,'(inspect bounded slices separately)');
      } else console.log(generate(item, {compact:false,comments:false}).code);
    }
  }
}
