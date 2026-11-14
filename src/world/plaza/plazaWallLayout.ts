import { PLAZA_PATH_SPOKES, PLAZA_RADII } from '../islandPaths';

/**
 * The plaza's edge as a garden seat wall: coursed stone with a light coping, open where each path leaves the
 * plaza, with a stone pier either side of every opening. It replaces a plain kerb whose shaded face read as a
 * flat brown band from outside. Heights are relative to the plaza floor top.
 *
 * Angles here use three.js's lathe/cylinder convention (x = r sin θ, z = r cos θ). Plaza spoke angles use
 * plazaPoint's (x = -r sin a, z = -r cos a), so θ = a + π.
 */
export const PLAZA_WALL = {
  innerRadius: PLAZA_RADII.edge + 0.14,
  outerRadius: PLAZA_RADII.edge + 0.42,
  /** The wall foot is sunk into the top of the grass berm. */
  footY: -0.3,
  topY: 0.34,
  copingInnerRadius: PLAZA_RADII.edge + 0.08,
  copingOuterRadius: PLAZA_RADII.edge + 0.48,
  copingTopY: 0.42,
  /** Clear width either side of a path's edge at an opening. */
  openingMargin: 0.55,
  pierSize: 0.62,
  pierTopY: 0.7,
} as const;

const TWO_PI = Math.PI * 2;
const MID_RADIUS = (PLAZA_WALL.innerRadius + PLAZA_WALL.outerRadius) / 2;

function wrap(theta: number): number {
  return ((theta % TWO_PI) + TWO_PI) % TWO_PI;
}

export interface WallOpening {
  /** Centre angle (three.js convention). */
  theta: number;
  halfAngle: number;
}

export const PLAZA_WALL_OPENINGS: WallOpening[] = PLAZA_PATH_SPOKES.map((spoke) => ({
  theta: wrap(spoke.angle + Math.PI),
  halfAngle: (spoke.width / 2 + PLAZA_WALL.openingMargin) / MID_RADIUS,
})).sort((a, b) => a.theta - b.theta);

export interface WallArc {
  thetaStart: number;
  thetaLength: number;
}

const PIER_HALF_ANGLE = PLAZA_WALL.pierSize / 2 / MID_RADIUS;

/** The wall runs between openings; each arc stops at the piers flanking them. */
export const PLAZA_WALL_ARCS: WallArc[] = PLAZA_WALL_OPENINGS.map((opening, index) => {
  const next = PLAZA_WALL_OPENINGS[(index + 1) % PLAZA_WALL_OPENINGS.length]!;
  const start = opening.theta + opening.halfAngle + PIER_HALF_ANGLE;
  let end = next.theta - next.halfAngle - PIER_HALF_ANGLE;
  if (end <= start) end += TWO_PI;
  return { thetaStart: start, thetaLength: end - start };
});

/** World XZ of a point on the wall line at angle θ (three.js convention). */
export function wallPoint(theta: number, radius = MID_RADIUS): [number, number] {
  return [radius * Math.sin(theta), radius * Math.cos(theta)];
}

export interface WallPier {
  x: number;
  z: number;
  /** Rotation about Y so the pier's faces follow the wall. */
  rotationY: number;
}

export const PLAZA_WALL_PIERS: WallPier[] = PLAZA_WALL_OPENINGS.flatMap((opening) =>
  [-1, 1].map((side) => {
    const theta = opening.theta + side * (opening.halfAngle + PIER_HALF_ANGLE);
    const [x, z] = wallPoint(theta);
    return { x, z, rotationY: theta };
  }),
);

/** Whether angle θ falls inside a path opening. */
export function isInWallOpening(theta: number): boolean {
  const t = wrap(theta);
  return PLAZA_WALL_OPENINGS.some((opening) => {
    const d = Math.abs(((t - opening.theta + Math.PI * 3) % TWO_PI) - Math.PI);
    return d <= opening.halfAngle;
  });
}

const COLLIDER_SPACING = 0.42;
const COLLIDER_RADIUS = 0.3;

/** A chain of small circles along every wall arc and pier, so the wall is solid except at the openings. */
export const PLAZA_WALL_COLLIDERS: Array<{ centerX: number; centerZ: number; radius: number }> = [
  ...PLAZA_WALL_ARCS.flatMap((arc) => {
    const count = Math.max(2, Math.ceil((arc.thetaLength * MID_RADIUS) / COLLIDER_SPACING) + 1);
    return Array.from({ length: count }, (_, i) => {
      const [x, z] = wallPoint(arc.thetaStart + (arc.thetaLength * i) / (count - 1));
      return { centerX: x, centerZ: z, radius: COLLIDER_RADIUS };
    });
  }),
  ...PLAZA_WALL_PIERS.map((pier) => ({ centerX: pier.x, centerZ: pier.z, radius: PLAZA_WALL.pierSize * 0.62 })),
];
