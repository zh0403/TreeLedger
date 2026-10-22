import { BufferGeometry, CubicBezierCurve3, Float32BufferAttribute, Vector3 } from "three";

/** A seeded, botanical form. This is visual geometry, never township record data. */
export function createTreeGeometry(compact: boolean) {
  let seed = 7391;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const positions: number[] = [];
  const phases: number[] = [];
  const sizes: number[] = [];
  const kinds: number[] = [];
  const point = (p: Vector3, foliage: boolean) => {
    positions.push(p.x, p.y, p.z);
    phases.push(random() * Math.PI * 2);
    sizes.push(foliage ? .6 + random() * 1.5 : .8 + random() * 1.1);
    kinds.push(foliage ? 1 : 0);
  };
  const up = new Vector3(0, 1, 0);
  const tube = (start: Vector3, end: Vector3, radius: number, count: number) => {
    const delta = end.clone().sub(start);
    const curve = new CubicBezierCurve3(
      start,
      start.clone().add(new Vector3(delta.x * .13, delta.y * .65, delta.z * .13)),
      start.clone().add(new Vector3(delta.x * .78, delta.y * .87, delta.z * .78)),
      end,
    );
    for (let i = 0; i < count; i++) {
      const t = random();
      const center = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const normal = new Vector3().crossVectors(tangent, up);
      if (normal.lengthSq() < .001) normal.set(1, 0, 0);
      normal.normalize();
      const binormal = new Vector3().crossVectors(tangent, normal).normalize();
      const angle = random() * Math.PI * 2;
      const rootFlare = start.y < .1 && end.y > 2 ? .16 * Math.exp(-t * 16) : 0;
      const bark = 1 + Math.sin(angle * 5 + t * 9) * .1;
      const r = (radius * (1 - t * .76) + rootFlare) * bark * (.78 + random() * .22);
      center.addScaledVector(normal, Math.cos(angle) * r).addScaledVector(binormal, Math.sin(angle) * r);
      point(center, false);
    }
    return curve;
  };
  const foliage = (center: Vector3, radius: number) => {
    const count = compact ? 48 : 104;
    for (let i = 0; i < count; i++) {
      const angle = random() * Math.PI * 2;
      const v = random() * 2 - 1;
      const r = Math.cbrt(random()) * radius;
      const spread = Math.sqrt(1 - v * v);
      point(new Vector3(center.x + Math.cos(angle) * spread * r, center.y + v * r * .9, center.z + Math.sin(angle) * spread * r), true);
    }
  };
  const branch = (start: Vector3, length: number, angle: number, depth: number) => {
    const end = start.clone().add(new Vector3(Math.cos(angle) * length * .8, length * (.8 + random() * .35), Math.sin(angle) * length * .8));
    tube(start, end, .024 * (depth + 1), Math.round((compact ? 75 : 180) * length));
    if (depth === 0) {
      foliage(end, .38 + random() * .24);
      return;
    }
    for (let i = 0; i < 3; i++) branch(end, length * (.47 + random() * .14), angle + (i - 1) * .95 + (random() - .5) * .45, depth - 1);
  };
  const trunk = tube(new Vector3(0, .08, 0), new Vector3(.13, 2.75, -.09), .18, compact ? 1800 : 4000);
  for (let i = 0; i < 8; i++) {
    const angle = i * 2.39996;
    // Branches emerge from the actual curved trunk, not a disconnected axis.
    const start = trunk.getPoint(.48 + i * .055);
    branch(start, 1.12 + random() * .48, angle, 3);
  }
  // Upward growth closes the crown without turning it into a geometric sphere.
  for (let i = 0; i < 3; i++) branch(trunk.getPoint(1), .65, i * 2.094, 2);
  for (let i = 0; i < 7; i++) {
    const angle = i * .8976;
    tube(new Vector3(0, .22, 0), new Vector3(Math.cos(angle) * (1 + random() * .25), .025, Math.sin(angle) * 1.05), .055, compact ? 100 : 220);
  }
  const geometry = new BufferGeometry();
  // A visual miniature grove for the township chapter, not a set of real locations.
  const townshipPositions = new Float32Array(positions.length);
  for (let i = 0; i < positions.length / 3; i++) {
    const tile = i % 9;
    townshipPositions[i * 3] = (tile % 3 - 1) * 2.25 + positions[i * 3] * .27;
    townshipPositions[i * 3 + 1] = positions[i * 3 + 1] * .27;
    townshipPositions[i * 3 + 2] = (Math.floor(tile / 3) - 1) * 2.25 + positions[i * 3 + 2] * .27;
  }
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aTownship", new Float32BufferAttribute(townshipPositions, 3));
  geometry.setAttribute("aPhase", new Float32BufferAttribute(phases, 1));
  geometry.setAttribute("aSize", new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute("aKind", new Float32BufferAttribute(kinds, 1));
  geometry.computeBoundingSphere();
  return geometry;
}
