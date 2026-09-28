export default function registerSettings(Alpine) {
  Alpine.data('settings', () => ({
    sizeNames: ['small', 'comfortable', 'large', 'extra large'],
    fonts: [
      { id: 'lexend', name: 'Lexend', note: 'Designed for reading proficiency research. Default.' },
      { id: 'atkinson', name: 'Atkinson Hyperlegible', note: 'Braille Institute; maximally distinct letterforms.' },
      { id: 'opendyslexic', name: 'OpenDyslexic', note: 'Weighted bottoms to fight letter rotation.' }
    ],
    get prefs() { return this.$store.course.prefs },
    setFont(id) { this.$store.course.prefs.font = id; this.$store.course.savePrefs(); this.$store.course.toast('Reading font: ' + id) },
    setSize(d) { this.$store.course.setSize(d) },
    get storageKind() { return this.$store.course.persistent ? 'localStorage (this browser)' : 'memory only — this window blocks storage' },
    get keys() { try { return Object.keys(localStorage).filter(k => k.startsWith('learn-alpine')).join(', ') || '—' } catch (e) { return 'unavailable' } },
    get bytes() { try { return (localStorage.getItem('learn-alpine.progress.v1') || '').length } catch (e) { return 0 } },
    exportProgress() {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([this.$store.course.engine.export()], { type: 'application/json' }))
      a.download = 'learn-alpine-progress.json'
      a.click()
    },
    async importProgress(ev) {
      const f = ev.target.files && ev.target.files[0]
      if (!f) return
      try { this.$store.course.engine.import(await f.text()); this.$store.course.refresh(); location.reload() }
      catch (e) { this.$store.course.toast('Could not read that file: ' + e.message, 'bad') }
    }
  }))
}
