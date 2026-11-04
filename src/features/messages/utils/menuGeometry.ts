export type MenuPlacement = "top" | "bottom";

export interface MenuAnchor {
  top: number;
  bottom: number;
  left: number;
}

export interface MenuViewport {
  width: number;
  height: number;
}

export interface MenuGeometry {
  placement: MenuPlacement;
  top: number;
  left: number;
}

export const MENU_WIDTH = 176;
export const MENU_MARGIN = 8;
export const MENU_OFFSET = 6;

export function computeMenuGeometry(
  anchor: MenuAnchor,
  menuHeight: number,
  viewport: MenuViewport,
): MenuGeometry {
  const spaceBelow = viewport.height - anchor.bottom;
  const spaceAbove = anchor.top;
  const placement: MenuPlacement =
    spaceBelow < menuHeight + MENU_MARGIN && spaceAbove > spaceBelow
      ? "top"
      : "bottom";

  const top =
    placement === "top"
      ? Math.max(MENU_MARGIN, anchor.top - menuHeight - MENU_OFFSET)
      : Math.min(
          viewport.height - menuHeight - MENU_MARGIN,
          anchor.bottom + MENU_OFFSET,
        );

  const left = Math.min(
    Math.max(MENU_MARGIN, anchor.left),
    Math.max(MENU_MARGIN, viewport.width - MENU_WIDTH - MENU_MARGIN),
  );
  return { placement, top, left };
}
