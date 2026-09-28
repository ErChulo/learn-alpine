/* =============================================================================
 * safeStorage — the course must survive being opened from file://, inside an
 * opaque-origin sandboxed iframe (no localStorage/sessionStorage), or in a
 * private window with storage disabled. We therefore try real storage first and
 * silently fall back to an in-memory shim, exposing `persistent` so the UI can
 * tell the learner the truth about where their progress lives.
 * ========================================================================== */

function probe(kind) {
  try {
    const s = window[kind]
    const k = '__la_probe__'
    s.setItem(k, '1')
    s.removeItem(k)
    return s
  } catch (e) {
    return null
  }
}

function memoryShim() {
  const map = new Map()
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(String(k), String(v)),
    removeItem: k => void map.delete(String(k)),
    clear: () => map.clear(),
    key: i => Array.from(map.keys())[i] ?? null,
    get length() { return map.size },
    __memory: true
  }
}

const real = probe('localStorage')
export const storage = real || memoryShim()
export const persistent = !!real
export const storageKind = persistent ? 'localStorage' : 'memory'
