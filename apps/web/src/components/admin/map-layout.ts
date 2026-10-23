type MapPadding = { top: number; right: number; bottom: number; left: number };

/** Keep a visible map area even in a short landscape viewport or beside a drawer. */
export function constrainMapPadding(width: number, height: number, padding: Partial<MapPadding>): MapPadding {
  const { top = 0, right = 0, bottom = 0, left = 0 } = padding;
  const horizontal = Math.max(0, left) + Math.max(0, right);
  const vertical = Math.max(0, top) + Math.max(0, bottom);
  const x = horizontal ? Math.min(1, Math.max(0, width) * .8 / horizontal) : 1;
  const y = vertical ? Math.min(1, Math.max(0, height) * .8 / vertical) : 1;
  return {
    top: Math.max(0, top) * y,
    right: Math.max(0, right) * x,
    bottom: Math.max(0, bottom) * y,
    left: Math.max(0, left) * x,
  };
}
