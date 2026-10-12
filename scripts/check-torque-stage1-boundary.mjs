import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Source-only gate: no browser, renderer, model fetch, build output or file writes.
const root = fileURLToPath(new URL('../', import.meta.url))
const entry = path.join(root, 'src/torque-wrench-main.tsx')
const gate = path.join(root, 'src/scene/torque-wrench/cadGate.ts')
const allowedStaticPackages = /^(react(?:\/|$)|react-dom(?:\/|$))/
const narrativePackages = /^(three(?:\/|$)|@react-three\/|gsap(?:\/|$)|lenis(?:\/|$)|postprocessing(?:\/|$)|troika-three-text(?:\/|$)|three-stdlib(?:\/|$))/
const configPath = ts.findConfigFile(root, ts.sys.fileExists)
const config = ts.readConfigFile(configPath, ts.sys.readFile)
const options = ts.parseJsonConfigFileContent(config.config, ts.sys, root).options
const visited = new Set()
const lazyVisited = new Set()
const lazy = []
const errors = []
const relative = (file) => path.relative(root, file).replaceAll('\\', '/')

function inspect(file, deferred = false) {
  file = path.resolve(file)
  const seen = deferred ? lazyVisited : visited
  if (seen.has(file)) return
  seen.add(file)
  const rel = relative(file)
  if (rel !== 'src/torque-wrench-main.tsx' && rel !== 'src/state/torqueWrenchStore.ts' && !rel.startsWith('src/scene/torque-wrench/') && !rel.startsWith('src/shared/')) {
    errors.push(`Outside Stage 1 local/shared surface: ${rel}`)
    return
  }
  if (!fs.existsSync(file)) {
    errors.push(`Missing source module: ${rel}`)
    return
  }
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  for (const diagnostic of source.parseDiagnostics) {
    errors.push(`Parse error in ${rel}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`)
  }
  function check(specifier, dynamic) {
    if (dynamic) {
      lazy.push({ from: rel, specifier })
      if (file !== gate || specifier !== './Scene') {
        errors.push(`Unexpected lazy edge: ${rel} -> ${specifier}`)
        return
      }
      const target = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule
      if (!target || target.isExternalLibraryImport) errors.push(`Missing lazy Scene: ${rel} -> ${specifier}`)
      else inspect(target.resolvedFileName, true)
      return
    }
    if (rel === 'src/state/torqueWrenchStore.ts') {
      errors.push(`Page-local store must remain dependency-free: ${specifier}`)
      return
    }
    const resolved = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule
    if (resolved?.isExternalLibraryImport) {
      if (!allowedStaticPackages.test(specifier) && !(deferred && narrativePackages.test(specifier))) {
        errors.push(`Unexpected ${deferred ? 'lazy' : 'eager'} package: ${rel} -> ${specifier}`)
      }
    } else if (resolved && !resolved.resolvedFileName.endsWith('.d.ts')) {
      inspect(resolved.resolvedFileName, deferred)
    } else if (!resolved && !/\.(css|png|jpe?g|webp|avif)$/.test(specifier)) {
      errors.push(`Unresolved import: ${rel} -> ${specifier}`)
    } else if (!resolved) {
      const asset = path.resolve(path.dirname(file), specifier)
      if (!fs.existsSync(asset)) errors.push(`Missing static asset: ${rel} -> ${specifier}`)
      if (!relative(asset).startsWith('src/scene/torque-wrench/') && relative(asset) !== 'src/index.css') {
        errors.push(`Asset outside Stage 1 surface: ${rel} -> ${specifier}`)
      }
    }
  }
  function walk(node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      if (!node.importClause?.isTypeOnly) {
        const bindings = node.importClause?.namedBindings
        const onlyTypes = bindings && ts.isNamedImports(bindings) && !node.importClause.name && bindings.elements.every((item) => item.isTypeOnly)
        if (!onlyTypes) check(node.moduleSpecifier.text, false)
      }
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier) && !node.isTypeOnly) {
      const onlyTypes = node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements.every((item) => item.isTypeOnly)
      if (!onlyTypes) check(node.moduleSpecifier.text, false)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      if (node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) check(node.arguments[0].text, true)
      else errors.push(`Nonliteral dynamic import: ${rel}`)
    }
    if (ts.isImportEqualsDeclaration(node)) errors.push(`Unsupported import-equals: ${rel}`)
    if (ts.isCallExpression(node)) {
      const expression = node.expression.getText(source)
      if (/^(require(?:\.|$)|createRequire$|import\.meta\.glob)/.test(expression)) {
        errors.push(`Unsupported module loader in ${rel}: ${expression}`)
      }
    }
    ts.forEachChild(node, walk)
  }
  walk(source)
}

if (!fs.existsSync(entry)) errors.push('Private module entry missing')
else inspect(entry)
if (!visited.has(gate)) errors.push('Entry does not reach the CAD gate')
if (lazy.length !== 1 || lazy[0].from !== relative(gate) || lazy[0].specifier !== './Scene') {
  errors.push('Expected exactly one lazy edge: CAD gate -> ./Scene')
}
console.log(JSON.stringify({ pass: errors.length === 0, staticModules: [...visited].map(relative).sort(), lazyModules: [...lazyVisited].map(relative).sort(), lazy, errors }, null, 2))
process.exitCode = errors.length ? 1 : 0
