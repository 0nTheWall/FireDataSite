// Small id helpers.

export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8)
  const time = Date.now().toString(36).slice(-4)
  return `${prefix}${time}${rand}`
}

let counterSeed = 0

// Human-friendly assessment id, e.g. AF-2025-0007.
export function newAssessmentId(existing: string[]): string {
  const year = new Date().getFullYear()
  const prefix = `AF-${year}-`
  let max = 0
  existing.forEach((id) => {
    if (id.startsWith(prefix)) {
      const n = parseInt(id.slice(prefix.length), 10)
      if (!Number.isNaN(n) && n > max) max = n
    }
  })
  counterSeed = Math.max(counterSeed, max)
  counterSeed += 1
  return `${prefix}${String(counterSeed).padStart(4, '0')}`
}
