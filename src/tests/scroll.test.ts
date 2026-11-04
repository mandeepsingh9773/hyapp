import { describe, expect, it } from "vitest";
import {
  distanceFromBottom,
  isNearBottom,
  NEAR_BOTTOM_THRESHOLD_PX,
} from "@/features/messages/utils/scroll";

describe("scroll helpers", () => {
  it("computes the distance from the bottom", () => {
    expect(
      distanceFromBottom({ scrollTop: 100, scrollHeight: 500, clientHeight: 300 }),
    ).toBe(100);
  });

  it("treats a fully scrolled container as at the bottom", () => {
    expect(
      isNearBottom({ scrollTop: 200, scrollHeight: 500, clientHeight: 300 }),
    ).toBe(true);
  });

  it("treats a container within the threshold as near the bottom", () => {
    const scrollTop = 200 - NEAR_BOTTOM_THRESHOLD_PX;
    expect(
      isNearBottom({ scrollTop, scrollHeight: 500, clientHeight: 300 }),
    ).toBe(true);
  });

  it("reports false when reading well above the bottom", () => {
    expect(
      isNearBottom({ scrollTop: 0, scrollHeight: 1000, clientHeight: 300 }),
    ).toBe(false);
  });
});
