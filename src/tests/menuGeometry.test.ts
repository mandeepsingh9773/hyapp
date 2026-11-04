import { describe, expect, it } from "vitest";
import {
  computeMenuGeometry,
  MENU_MARGIN,
  MENU_OFFSET,
  MENU_WIDTH,
} from "@/features/messages/utils/menuGeometry";

const viewport = { width: 1024, height: 800 };

describe("computeMenuGeometry", () => {
  it("opens downward when there is room below", () => {
    const geometry = computeMenuGeometry(
      { top: 100, bottom: 130, left: 40 },
      200,
      viewport,
    );
    expect(geometry.placement).toBe("bottom");
    expect(geometry.top).toBe(130 + MENU_OFFSET);
    expect(geometry.left).toBe(40);
  });

  it("opens upward when space below is limited", () => {
    const geometry = computeMenuGeometry(
      { top: 700, bottom: 730, left: 40 },
      200,
      viewport,
    );
    expect(geometry.placement).toBe("top");
    expect(geometry.top).toBe(700 - 200 - MENU_OFFSET);
  });

  it("clamps to the top margin when the upward menu would overflow", () => {
    const geometry = computeMenuGeometry(
      { top: 60, bottom: 90, left: 40 },
      200,
      { width: 1024, height: 140 },
    );
    expect(geometry.placement).toBe("top");
    expect(geometry.top).toBe(MENU_MARGIN);
  });

  it("clamps horizontally inside the viewport", () => {
    const nearRight = computeMenuGeometry(
      { top: 100, bottom: 130, left: 1000 },
      200,
      viewport,
    );
    expect(nearRight.left).toBe(viewport.width - MENU_WIDTH - MENU_MARGIN);

    const nearLeft = computeMenuGeometry(
      { top: 100, bottom: 130, left: -20 },
      200,
      viewport,
    );
    expect(nearLeft.left).toBe(MENU_MARGIN);
  });

  it("prefers downward when both sides are cramped but below is not smaller", () => {
    const geometry = computeMenuGeometry(
      { top: 30, bottom: 60, left: 10 },
      300,
      viewport,
    );
    expect(geometry.placement).toBe("bottom");
  });
});
