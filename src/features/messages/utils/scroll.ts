export const NEAR_BOTTOM_THRESHOLD_PX = 80;

export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

export function distanceFromBottom(metrics: ScrollMetrics): number {
  return metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight;
}

export function isNearBottom(
  metrics: ScrollMetrics,
  threshold = NEAR_BOTTOM_THRESHOLD_PX,
): boolean {
  return distanceFromBottom(metrics) <= threshold;
}

export function scrollToBottom(node: HTMLElement, behavior: ScrollBehavior = "auto") {
  if (typeof node.scrollTo === "function") {
    node.scrollTo({ top: node.scrollHeight, behavior });
    return;
  }
  node.scrollTop = node.scrollHeight;
}
