<script setup lang="ts">
/**
 * Hästsko-illustrationen — skärmens hjärta (Designförslag B). EN SVG-renderare,
 * många states (röster, aktiv plats, dim, facit, pratbubbla). U:et öppnar uppåt
 * mot scenen/TV:n; platser 1,2 vänster arm · 3,4 botten · 5,6 höger arm — exakt
 * som den fysiska möbeln. Varje plats-ring speglar den fysiska LED-tredjedelen.
 * Driven av storen (röster/aktiv plats); step-specifika saker via props.
 */
import { computed } from 'vue'
import { useUtmanaStore } from '../store/utmanaStore'
import { seatName } from '@/config'

const props = withDefaults(
  defineProps<{
    dim?: boolean
    showFacit?: boolean
    tv?: string
    bubbleText?: string
    bubbleSeat?: number
  }>(),
  { dim: false, showFacit: false, tv: '' },
)

const store = useUtmanaStore()

const POS: Record<number, { x: number; y: number }> = {
  1: { x: 250, y: 255 },
  2: { x: 205, y: 400 },
  3: { x: 335, y: 525 },
  4: { x: 665, y: 525 },
  5: { x: 795, y: 400 },
  6: { x: 750, y: 255 },
}
const VC: Record<string, string> = { ja: '#36b34a', kanske: '#f2c021', nej: '#e23b2e' }
const SEG = ['nej', 'kanske', 'ja'] // skärmordning NEJ·KANSKE·JA

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function segs(lit: string | null): string {
  const w = 22, h = 13, gap = 8, total = 3 * w + 2 * gap, x0 = -total / 2
  return SEG.map((k, i) => {
    const x = x0 + i * (w + gap), on = lit === k, c = VC[k]
    const halo = on ? `<rect x="${x - 4}" y="-4" width="${w + 8}" height="${h + 8}" rx="6" fill="${c}" opacity=".4"/>` : ''
    return `${halo}<rect x="${x}" y="0" width="${w}" height="${h}" rx="4" fill="${on ? c : 'rgba(242,231,207,.12)'}" stroke="${on ? c : 'rgba(242,231,207,.2)'}" stroke-width="1"/>`
  }).join('')
}

function seat(n: number, votes: Record<number, string>, active: number, dim: boolean, facit: string | null): string {
  const { x, y } = POS[n]
  const vote = votes[n] ?? null
  const lit = facit ?? vote
  const isActive = active === n
  const isDim = dim && !isActive
  const ringC = isActive ? '#f2e7cf' : vote ? VC[vote] : '#8a5a2a'
  const ringW = isActive || vote ? 5 : 2.5
  const spot = isActive ? `<path d="M0,-210 L150,-20 L-150,-20 Z" fill="url(#spot)" opacity=".55"/>` : ''
  const halo = isActive
    ? `<circle r="72" fill="none" stroke="#f2e7cf" stroke-width="2" class="pulse" opacity=".55"/><circle r="63" fill="#f2e7cf" opacity=".09"/>`
    : ''
  return `<g transform="translate(${x},${y})" opacity="${isDim ? 0.34 : 1}">
    ${spot}${halo}
    <circle r="50" fill="#0a2930" stroke="${ringC}" stroke-width="${ringW}"/>
    <g fill="${isActive ? '#f2e7cf' : '#c89b5e'}">
      <circle cx="0" cy="-10" r="12"/>
      <path d="M-22,22 a22,19 0 0 1 44,0 Z"/>
    </g>
    <g transform="translate(0,62)">${segs(lit)}</g>
    <g transform="translate(0,-50)"><circle r="15" fill="#d4682e"/><text y="5.5" text-anchor="middle" font-family="Unbounded" font-weight="700" font-size="17" fill="#160d07">${n}</text></g>
    <text y="102" text-anchor="middle" font-family="Hanken Grotesk" font-weight="700" font-size="21" fill="${isActive ? '#f2e7cf' : '#c98a4a'}">${esc(seatName(n))}</text>
  </g>`
}

function bubble(txt: string, n: number): string {
  const p = POS[n]
  const left = p.x < 500
  const bw = 300, bh = 128
  const bx = left ? p.x + 54 : p.x - 54 - bw
  const by = Math.max(70, Math.min(p.y - 64, 640 - bh - 20))
  const edgeX = left ? bx : bx + bw
  const midY = by + bh / 2
  const tail = `<path d="M${edgeX},${midY - 15} L${p.x + (left ? -40 : 40)},${p.y} L${edgeX},${midY + 15} Z" fill="#f2e7cf"/>`
  return `<g>
    ${tail}
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="18" fill="#f2e7cf"/>
    <foreignObject x="${bx + 20}" y="${by + 14}" width="${bw - 40}" height="${bh - 28}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:'Hanken Grotesk',sans-serif;color:#13343c;font-size:20px;line-height:1.34;font-weight:500">${esc(txt)}</div>
    </foreignObject>
  </g>`
}

function stage(tv: string): string {
  return `<g transform="translate(500,116)">
    <rect x="-172" y="-58" width="344" height="116" rx="12" fill="url(#tv)" stroke="#c89b5e" stroke-width="3"/>
    <text y="-16" text-anchor="middle" font-family="Hanken Grotesk" font-weight="700" font-size="15" letter-spacing="3" fill="#c98a4a">PÅ SCEN</text>
    <text y="18" text-anchor="middle" font-family="Unbounded" font-weight="700" font-size="22" fill="#f2e7cf">${esc(tv)}</text>
    <circle cx="150" cy="-40" r="5" fill="#e23b2e"/>
  </g>`
}

const svg = computed(() => {
  const votes: Record<number, string> = {}
  for (const v of store.currentVotes) votes[v.plats] = v.val
  const active = store.activePlats
  const facit = props.showFacit ? store.facitRatt : null
  const tvLabel = props.tv || (store.format?.namn ?? 'Utmana experten')
  const d = 'M250,255 L205,400 Q192,540 348,545 L652,545 Q808,540 795,400 L750,255'
  const seats = [1, 2, 3, 4, 5, 6].map((n) => seat(n, votes, active, props.dim, facit)).join('')
  const bub = props.bubbleText && props.bubbleSeat ? bubble(props.bubbleText, props.bubbleSeat) : ''
  return `<svg class="hs" viewBox="0 0 1000 640" role="img" aria-label="Hästsko-bord med sex platser runt en scen">
    <defs>
      <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c89b5e"/><stop offset=".5" stop-color="#8a5a2a"/><stop offset="1" stop-color="#5e3c1b"/></linearGradient>
      <radialGradient id="spot" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#f2e7cf"/><stop offset="1" stop-color="rgba(242,231,207,0)"/></radialGradient>
      <radialGradient id="tv" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#114048"/><stop offset="1" stop-color="#061c23"/></radialGradient>
    </defs>
    <path d="${d}" fill="none" stroke="url(#wood)" stroke-width="42" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="#160d07" stroke-width="42" stroke-linecap="round" stroke-linejoin="round" opacity=".16"/>
    ${stage(tvLabel)}
    ${seats}
    ${bub}
  </svg>`
})
</script>

<template>
  <div class="hs-wrap" v-html="svg"></div>
</template>
