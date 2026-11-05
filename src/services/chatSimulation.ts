export const STATUS_DELAYS_MS = {
  sent: 600,
  delivered: 1000,
  read: 2000,
} as const;

export const TYPING_DURATION_MS = 1500;
export const INCOMING_MIN_DELAY_MS = 2000;
export const INCOMING_MAX_DELAY_MS = 5000;

export const STATUS_SEQUENCE = ["sent", "delivered", "read"] as const;

export type StatusSequenceStep = (typeof STATUS_SEQUENCE)[number];

export const FAILURE_DELAY_MS = 900;

export function nextIncomingDelay(random = Math.random): number {
  const span = INCOMING_MAX_DELAY_MS - INCOMING_MIN_DELAY_MS;
  return INCOMING_MIN_DELAY_MS + Math.floor(random() * span);
}

export const FAILED_SEND_TOKEN = "#fail";

export function shouldFailSend(
  text: string,
  random: () => number = Math.random,
): boolean {
  if (text.trim().toLowerCase().includes(FAILED_SEND_TOKEN)) return true;
  return random() < 0.05;
}

export interface TimerHandle {
  setTimeout: (handler: () => void, delay: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (handle: ReturnType<typeof setTimeout>) => void;
}

export const defaultTimerHandle: TimerHandle = {
  setTimeout: (handler, delay) => setTimeout(handler, delay),
  clearTimeout: (handle) => clearTimeout(handle),
};

export class SimulationTimers {
  private handles = new Set<ReturnType<typeof setTimeout>>();

  private readonly timers: TimerHandle;

  constructor(timers: TimerHandle = defaultTimerHandle) {
    this.timers = timers;
  }

  schedule(handler: () => void, delay: number) {
    const handle = this.timers.setTimeout(() => {
      this.handles.delete(handle);
      handler();
    }, delay);
    this.handles.add(handle);
    return handle;
  }

  cancel(handle: ReturnType<typeof setTimeout>) {
    this.timers.clearTimeout(handle);
    this.handles.delete(handle);
  }

  clear() {
    for (const handle of this.handles) this.timers.clearTimeout(handle);
    this.handles.clear();
  }

  get size() {
    return this.handles.size;
  }
}
