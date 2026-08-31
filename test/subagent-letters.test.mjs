// Pure-node assertion script for the dsh-webui-mobile subagent letter naming and
// the two-line allocator. It mirrors the pure functions in src/client.js (the
// bundle closure is not importable from Node), so keep them in sync.
//
// Run: node test/subagent-letters.test.mjs
import assert from 'node:assert/strict'

// ---- mirrored pure logic (sync with src/client.js) ----
function subLetter(index) {
  let i = index + 1
  let s = ''
  while (i > 0) {
    const rem = (i - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    i = Math.floor((i - 1) / 26)
  }
  return s
}
const SUB_NAME_SPLIT = /[\/\\,;:.\-_ ｜]+/
function subSplitUnits(name) {
  return String(name || '').split(SUB_NAME_SPLIT).map((u) => u.trim()).filter(Boolean)
}
function subMeasure() {
  return (text, fontSize) => Math.max(1, String(text).length) * fontSize * 0.55
}
function subMaxChars(text, fontSize, boxWidth, measure) {
  let lo = 0
  let hi = String(text).length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (measure(String(text).slice(0, mid), fontSize) <= boxWidth) lo = mid
    else hi = mid - 1
  }
  return lo
}
function subOneLineFit(text, boxWidth, measure, baseFont, minFont) {
  let font = baseFont
  while (font > minFont && measure(String(text), font) > boxWidth) font -= 0.5
  return font
}
function subFitContinuous(text, boxWidth, measure, baseFont, minFont) {
  let font = baseFont
  for (;;) {
    const topChars = subMaxChars(text, font, boxWidth, measure)
    const top = String(text).slice(0, topChars)
    const rest = String(text).slice(topChars)
    if (rest.length === 0 || measure(rest, font) <= boxWidth) {
      return { top, bottom: rest, topFont: font, bottomFont: font }
    }
    if (font <= minFont) return { top, bottom: rest, topFont: font, bottomFont: font }
    font -= 0.5
  }
}
function subFitSplit(units, boxWidth, measure, baseFont, minFont) {
  const join = (arr) => arr.join('/')
  let best = null
  for (let k = 1; k < units.length; k++) {
    const top = join(units.slice(0, k))
    const bottom = join(units.slice(k))
    if (bottom.length > top.length) continue
    if (units.slice(k).length > units.slice(0, k).length) continue
    const topFont = subOneLineFit(top, boxWidth, measure, baseFont, minFont)
    const bottomFont = subOneLineFit(bottom, boxWidth, measure, baseFont, minFont)
    const score = Math.min(topFont, bottomFont)
    if (best === null || score > best.score) best = { top, bottom, topFont, bottomFont, score }
  }
  return best
}
function subRosterIndexPure(agentId, roster) {
  if (!agentId || !roster || roster.length === 0) return null
  let target = roster.find((t) => t === agentId)
  if (!target) target = roster.find((t) => t.endsWith(':' + agentId))
  if (!target) return null
  const parentPrefix = target.split(':').slice(0, -1).join(':') + ':'
  const selfDepth = target.split(':').length
  let idx = 0
  for (const t of roster) {
    if (t === target) return idx
    if (t.split(':').length === selfDepth && t.startsWith(parentPrefix)) idx += 1
  }
  return null
}
function subStableHash(value) {
  let h = 0
  const s = String(value || '')
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}
function subPlaceholder(title) {
  const name = String(title || '').trim()
  if (!name) return '?'
  const h = subStableHash(name)
  const dis = ((h % 36).toString(36) + (Math.floor(h / 36) % 36).toString(36)).toUpperCase()
  return name.slice(0, 3) + dis
}
function subResolveLetterPure(title, depth, roster, explicitOrder) {
  if (explicitOrder !== null && explicitOrder !== undefined && explicitOrder >= 0) {
    return subLetter(explicitOrder)
  }
  const idx = subRosterIndexPure(title, roster)
  if (idx !== null && idx >= 0) return subLetter(idx)
  return subPlaceholder(title)
}

// ---- assertion runner ----
let pass = 0
let fail = 0
function check(name, fn) {
  try {
    fn()
    pass += 1
    console.log('PASS ' + name)
  } catch (e) {
    fail += 1
    console.error('FAIL ' + name + ' :: ' + e.message)
  }
}

const m = subMeasure()

// 1) Same parent, 3 siblings in document order must be A/B/C — not A/A.
const roster3 = [
  'agent-teams:team:scan-backend',
  'agent-teams:team:frontend',
  'agent-teams:team:docs',
]
check('letter.siblingsABC_notAA', () => {
  assert.equal(subResolveLetterPure('agent-teams:team:scan-backend', 0, roster3, null), 'A')
  assert.equal(subResolveLetterPure('agent-teams:team:frontend', 0, roster3, null), 'B')
  assert.equal(subResolveLetterPure('agent-teams:team:docs', 0, roster3, null), 'C')
})

// 2) Explicit data-order branch wins over the roster.
check('letter.dataOrderWins', () => {
  assert.equal(subResolveLetterPure('agent-teams:team:frontend', 0, ['agent-teams:team:frontend'], 2), 'C')
  assert.equal(subResolveLetterPure('agent-teams:team:frontend', 0, ['agent-teams:team:frontend'], 0), 'A')
})

// 3) No data-order: roster / expanded tree document order, per same-parent group.
const rosterNested = [
  'agent-teams:parent:scan-backend',
  'agent-teams:parent:frontend',
  'agent-teams:parent:docs',
  'agent-teams:parent:ops',
  'agent-teams:parent:scan-backend:child-x',
  'agent-teams:parent:scan-backend:child-y',
]
check('letter.rosterSameParentSiblings', () => {
  assert.equal(subResolveLetterPure('agent-teams:parent:scan-backend', 0, rosterNested, null), 'A')
  assert.equal(subResolveLetterPure('agent-teams:parent:frontend', 0, rosterNested, null), 'B')
  assert.equal(subResolveLetterPure('agent-teams:parent:ops', 0, rosterNested, null), 'D')
})
check('letter.rosterGrandchildGroupIndependent', () => {
  // grandchildren of scan-backend form their own 2-sibling group -> A/B, not A/C.
  assert.equal(subResolveLetterPure('agent-teams:parent:scan-backend:child-x', 1, rosterNested, null), 'A')
  assert.equal(subResolveLetterPure('agent-teams:parent:scan-backend:child-y', 1, rosterNested, null), 'B')
})

// 4) No order source at all: placeholder (NOT a bare depth letter), and two
//    different same-parent names never collapse to the same label (no A/A).
check('letter.placeholderNoAACollision', () => {
  const a = subResolveLetterPure('mystery-agent-xyz', 0, [], null)
  const b = subResolveLetterPure('mystery-agent-abc', 0, [], null)
  assert.notEqual(a, b)
  assert.ok(a.length >= 4 && b.length >= 4, 'placeholder should be name slice + token, not a bare letter')
})

// 5) subFitSplit: second group must be shorter than the first.
check('fit.splitSecondGroupShorter', () => {
  const r = subFitSplit(subSplitUnits('DeepSeek V4 Flash Free'), 160, m, 13, 9)
  assert.ok(r)
  assert.ok(r.bottom.length < r.top.length)
})

// 6) subFitContinuous: wraps to two lines when long, stays one line when short.
check('fit.continuousTwoLinesWhenLong', () => {
  const r = subFitContinuous('x'.repeat(50), 120, m, 13, 9)
  assert.ok(r.top.length > 0 && r.top.length < 50 && r.bottom.length > 0)
})
check('fit.continuousSingleLineWhenShort', () => {
  const r = subFitContinuous('当前dsh手机端插件名称', 200, m, 13, 9)
  assert.ok(r.top.length > 0 && (r.bottom.length === 0 || r.bottom === '当前dsh手机端插件名称'))
})

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
