/* =============================================================================
 * content-index.mjs — regenerates the import list in src/content/index.js from
 * whatever module files exist. Run it after adding or renaming a module.
 *   node scripts/content-index.mjs
 * ========================================================================== */

import { readdir, writeFile, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'src/content')

const files = (await readdir(dir))
  .filter(f => /^\d{2}-.*\.js$/.test(f))
  .sort()

const imports = files.map(f => `import m${f.slice(0, 2)} from './${f}'`).join('\n')
const names = files.map(f => `m${f.slice(0, 2)}`)

const path = join(dir, 'index.js')
let src = await readFile(path, 'utf8')
const start = src.indexOf('import m01')
const end = src.indexOf('const raw = [')
const before = src.slice(0, start)
const after = src.slice(end)
const tail = after.slice(after.indexOf(']') + 1)

await writeFile(path, `${before}${imports}\n\nconst raw = [${names.join(', ')}]\n${tail}`)
console.log(`indexed ${files.length} module files`)
