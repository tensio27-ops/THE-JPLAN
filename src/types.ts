
export interface TrussPiece {
  id: string;
  length: number; // in mm
  type: 'straight' | 'corner';
}

export interface TrussCalculation {
  horizontal: { length: number; count: number }[];
  vertical: { length: number; count: number }[];
  corners: number;
}

export const TRUSS_SEGMENTS = [1000, 500, 250]; // Standard lengths in mm

export function calculateTruss(totalLength: number): { length: number; count: number }[] {
  let remaining = totalLength;
  const result: { length: number; count: number }[] = [];

  for (const segment of TRUSS_SEGMENTS) {
    const count = Math.floor(remaining / segment);
    if (count > 0) {
      result.push({ length: segment, count });
      remaining -= count * segment;
    }
  }

  // If there's a small remainder, we might need a custom piece or just round up/down
  // For this tool, we'll assume standard segments and maybe a "custom" remainder if needed
  if (remaining > 0) {
    result.push({ length: remaining, count: 1 });
  }

  return result;
}
