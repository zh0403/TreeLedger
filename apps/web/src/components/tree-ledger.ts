// A particle sculpture of linked records, never real transaction data.
const blocks = [
  { x: -2.55, y: 1.75, z: .2 },
  { x: -.85, y: 3.15, z: -.25 },
  { x: .85, y: 2.5, z: .3 },
  { x: 2.55, y: 3.9, z: -.15 },
];
const half = .72;

export function createLedgerTargets(count: number, tree: number[]) {
  const positions = new Float32Array(count * 3);
  const roles = new Float32Array(count);
  let seed = 829;
  const random = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < count; i++) {
    const offset = i * 3;
    const sample = random();
    if (sample < .035) {
      // A faint botanical trace remains behind the records.
      positions.set(tree.slice(offset, offset + 3), offset);
      continue;
    }
    if (sample < .18) {
      const index = Math.floor(random() * (blocks.length - 1));
      const a = blocks[index], b = blocks[index + 1];
      const t = random();
      const radius = Math.sqrt(random()) * (.065 + Math.sin(t * Math.PI) * .09);
      const angle = random() * Math.PI * 2;
      // Volumetric particle ribbons pass through the block cores.
      positions.set([
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t + Math.sin(t * Math.PI) * .22 + Math.cos(angle) * radius,
        a.z + (b.z - a.z) * t + Math.sin(angle) * radius,
      ], offset);
      roles[i] = 2;
      continue;
    }
    const block = blocks[Math.floor(random() * blocks.length)];
    const local = [(random() * 2 - 1) * half, (random() * 2 - 1) * half, (random() * 2 - 1) * half];
    if (sample < .25) {
      const scale = 1.05 + random() * .65;
      local.forEach((value, axis) => { local[axis] = value * scale; });
      roles[i] = 3;
    } else {
      roles[i] = 1;
      const structure = random();
      // Filled volume and granular faces, with no continuous wireframe edges.
      if (structure > .52) {
        const axis = Math.floor(random() * 3);
        local[axis] = (random() > .5 ? half : -half) + (random() - .5) * .035;
        if (structure > .95) local[(axis + 1) % 3] = (random() > .5 ? half : -half) + (random() - .5) * .035;
      }
    }
    positions.set([block.x + local[0], block.y + local[1], block.z + local[2]], offset);
  }
  return { positions, roles };
}
