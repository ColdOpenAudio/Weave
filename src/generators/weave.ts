// Weave overlay system for fabric events

import { wrapEvents } from './seam';

export interface EventType {
  name: string;
  svgTemplate: string; // SVG path or element template, e.g., <circle ... />
  minSize: number;
}

export interface WeaveConfig {
  width: number;
  height: number;
  seed: number;
  eventDensity: number; // e.g., 0.02 for 2% coverage
  minFeatureMm: number; // from constraints
  xWrap: boolean;
  yWrap: boolean;
}

export interface Event {
  type: EventType;
  x: number;
  y: number;
  size: number;
}

// Simple seeded PRNG (reuse from tile.ts if possible, but for now duplicate)
class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// 2.1 Define event types
export const eventTypes: EventType[] = [
  {
    name: 'weft-pop',
    svgTemplate: '<circle cx="{x}" cy="{y}" r="{size}" fill="#000" opacity="0.5"/>',
    minSize: 1
  },
  {
    name: 'stitch-interrupt',
    svgTemplate: '<line x1="{x}" y1="{y}" x2="{x2}" y2="{y2}" stroke="#000" stroke-width="0.5"/>',
    minSize: 2 // length
  },
  {
    name: 'basket-patch',
    svgTemplate: '<rect x="{x}" y="{y}" width="{size}" height="{size}" fill="#111" opacity="0.3"/>',
    minSize: 3
  }
];

// 2.2 Implement fray/notch details (integrated in events)
export function generateEvent(event: Event, rand: SeededRandom): string {
  let template = event.type.svgTemplate;
  template = template.replace('{x}', event.x.toString());
  template = template.replace('{y}', event.y.toString());
  template = template.replace('{size}', event.size.toString());
  if (event.type.name === 'stitch-interrupt') {
    // For line, add x2 y2
    const angle = rand.next() * Math.PI * 2;
    const x2 = event.x + Math.cos(angle) * event.size;
    const y2 = event.y + Math.sin(angle) * event.size;
    template = template.replace('{x2}', x2.toString());
    template = template.replace('{y2}', y2.toString());
  }
  return template;
}

// 2.3 Create seed-driven event placement
export function generateEvents(config: WeaveConfig): Event[] {
  const { width, height, seed, eventDensity, minFeatureMm } = config;
  const rand = new SeededRandom(seed + 3); // different seed
  const events: Event[] = [];

  const numEvents = Math.floor(width * height * eventDensity / 100);
  for (let i = 0; i < numEvents; i++) {
    const type = eventTypes[Math.floor(rand.next() * eventTypes.length)];
    const x = rand.next() * width;
    const y = rand.next() * height;
    const size = type.minSize + rand.next() * 2; // vary size
    if (size >= minFeatureMm) { // enforce min feature
      events.push({ type, x, y, size });
    }
  }
  return events;
}

// 2.4 Overlay events on tile base
export function generateWeaveOverlay(config: WeaveConfig): string {
  let events = generateEvents(config);
  // 3.1-3.3 Seam logic
  const seamConfig = { width: config.width, height: config.height, xWrap: config.xWrap, yWrap: config.yWrap };
  events = wrapEvents(events, seamConfig);
  const rand = new SeededRandom(config.seed + 4); // for event rendering
  let svg = `<g id="weave-overlay">`;
  for (const event of events) {
    svg += generateEvent(event, rand);
  }
  svg += `</g>`;
  return svg;
}

// For testing
export function generateTileWithOverlay(tileSvg: string, overlaySvg: string): string {
  // Insert overlay before closing </svg>
  return tileSvg.replace('</svg>', overlaySvg + '</svg>');
}