// Seam logic for wrapping events across tile edges

import { Event, EventType } from './weave';

export interface SeamConfig {
  width: number;
  height: number;
  xWrap: boolean;
  yWrap: boolean; // default false
}

export function wrapEvents(events: Event[], config: SeamConfig): Event[] {
  const wrapped: Event[] = [...events];

  for (const event of events) {
    // 3.1 X wrap duplication
    if (config.xWrap) {
      if (event.x + event.size > config.width) {
        // Crosses right edge, wrap to left
        const wrappedEvent: Event = {
          ...event,
          x: event.x - config.width
        };
        wrapped.push(wrappedEvent);
      }
      if (event.x - event.size < 0) {
        // Crosses left edge, wrap to right
        const wrappedEvent: Event = {
          ...event,
          x: event.x + config.width
        };
        wrapped.push(wrappedEvent);
      }
    }

    // 3.2 Y wrap (optional)
    if (config.yWrap) {
      if (event.y + event.size > config.height) {
        // Crosses bottom, wrap to top
        const wrappedEvent: Event = {
          ...event,
          y: event.y - config.height
        };
        wrapped.push(wrappedEvent);
      }
      if (event.y - event.size < 0) {
        // Crosses top, wrap to bottom
        const wrappedEvent: Event = {
          ...event,
          y: event.y + config.height
        };
        wrapped.push(wrappedEvent);
      }
    }
  }

  return wrapped;
}

// 3.3 Handle seam continuity (already in wrap, but for lines, adjust endpoints if needed)
export function adjustWrappedEvent(event: Event, config: SeamConfig): Event {
  if (event.type.name === 'stitch-interrupt') {
    // For lines, ensure they don't extend beyond tile after wrapping
    // But since wrapped, perhaps clip or adjust
    // For simplicity, keep as is
  }
  return event;
}