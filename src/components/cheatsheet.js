export default function registerCheatsheet(Alpine) {
  Alpine.data('cheatsheet', () => ({
    cfg: { rows: [], groups: [] },
    q: '',
    group: '',
    init() { this.cfg = JSON.parse(this.$el.dataset.cfg) },
    get filtered() {
      const q = this.q.trim().toLowerCase()
      return this.cfg.rows
        .filter(r => !this.group || r.g === this.group)
        .filter(r => !q || r.hay.includes(q))
    },
    done(r) {
      const st = this.$store.course.modStats[r.mid]
      return (st?.pct || 0) === 100
    }
  }))
}
