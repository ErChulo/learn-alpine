/* =============================================================================
 * dev.mjs — `npm run dev`: esbuild in watch mode + the static server, together.
 * ========================================================================== */

import { spawn } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const run = (file, args = []) => spawn(process.execPath, [join(here, file), ...args], { stdio: 'inherit' })

const watcher = run('build.mjs', ['--watch'])
const server = run('serve.mjs', [process.argv[2] || process.env.PORT || '5173'])

const bye = () => { watcher.kill(); server.kill(); process.exit(0) }
process.on('SIGINT', bye)
process.on('SIGTERM', bye)
