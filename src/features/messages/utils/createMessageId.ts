let counter = 0;

export function createMessageId(now: number = Date.now()): string {
  counter = (counter + 1) % 1_000_000;
  return `msg-local-${now.toString(36)}-${counter.toString(36)}`;
}
