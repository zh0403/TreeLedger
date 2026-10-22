export const particleVertex = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute float aKind;
  attribute vec3 aTownship;
  attribute vec3 aLedger;
  attribute float aLedgerRole;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uState;
  uniform float uTownship;
  uniform float uLedger;
  uniform float uReveal;
  uniform vec2 uPointer;
  uniform float uHover;
  uniform float uHoverRadius;
  uniform float uAspect;
  uniform vec3 uEmerald;
  uniform vec3 uCanopy;
  uniform vec3 uProof;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = mix(position, aTownship, uTownship);
    p = mix(p, aLedger, uLedger);
    // Shared low-frequency wind keeps each limb coherent; only leaves flutter.
    float flexibility = smoothstep(.2, 4.5, position.y) * mix(.32, 1.0, aKind) * (1.0 - uLedger);
    float sway = sin(uTime * .42 + position.y * .68 + position.z * .24) * .055 * flexibility;
    float spread = uState * aKind * (1.0 - uLedger);
    p.xz *= 1.0 + spread * .12;
    p.y += sin(aPhase + uTime * .3) * spread * .14;
    p.x += sway;
    p.z += cos(uTime * .34 + position.y * .72) * .035 * flexibility;
    p.x += sin(uTime * 1.1 + aPhase) * .004 * aKind * (1.0 - uLedger);
    float ledgerDrift = uLedger * mix(.012, .045, step(2.5, aLedgerRole));
    p += vec3(sin(aPhase + uTime * .38), cos(aPhase * 1.7 + uTime * .31), sin(aPhase * 2.1 + uTime * .29)) * ledgerDrift;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float interaction = 0.0;
    if (uHover > .001) {
      // Screen-space distance follows the pointer even as the camera orbits.
      // Aspect correction gives the brush a circular, pixel-consistent radius.
      vec4 projected = projectionMatrix * mv;
      vec2 delta = (projected.xy / projected.w - uPointer) * vec2(uAspect, 1.0);
      float distanceToPointer = length(delta);
      interaction = (1.0 - smoothstep(0.0, uHoverRadius, distanceToPointer)) * uHover * (1.0 - uTownship);
      vec2 direction = delta / max(distanceToPointer, .0001);
      // Branches resist movement while foliage opens around the cursor.
      float displacement = interaction * interaction * mix(.035, .13, aKind);
      vec2 offset = direction * vec2(1.0 / uAspect, 1.0) * displacement;
      mv.xy += offset * -mv.z / vec2(projectionMatrix[0][0], projectionMatrix[1][1]);
    }
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uPixelRatio * 18.0 * mix(1.0, 1.45, uLedger) / -mv.z, 1.0, 7.0);
    float hue = .5 + .5 * sin(aPhase + p.y * 1.2);
    vColor = mix(uEmerald * .7, uCanopy, hue * .65);
    vColor = mix(vColor, uProof, smoothstep(.95, 1.0, hue) * .4);
    float shimmer = .78 + .22 * sin(aPhase * 4.0 + uTime * .65);
    float breathing = .94 + .06 * sin(uTime * .72);
    // Back-of-canopy particles recede without a post-processing pass.
    float depth = mix(.42, 1.0, smoothstep(-2.4, 2.4, (modelViewMatrix * vec4(position, 0.0)).z));
    float scan = pow(max(0.0, 1.0 - abs(p.y - mod(uTime * .24, 5.0)) * 2.2), 3.0);
    vColor += scan * uEmerald * .25;
    vColor += interaction * uEmerald * .45;
    float signal = pow(max(0.0, 1.0 - abs(fract(p.x * .22 - uTime * .18) - .5) * 9.0), 2.0);
    float ribbon = step(1.5, aLedgerRole) * (1.0 - step(2.5, aLedgerRole));
    vColor = mix(vColor, mix(uEmerald, uProof, .24), uLedger * .25);
    vColor += uLedger * ribbon * signal * uProof * .6;
    float ledgerAlpha = aLedgerRole < .5 ? .16 : (aLedgerRole > 2.5 ? .3 : .95);
    float ledgerDepth = mix(.55, 1.0, smoothstep(-2.0, 2.0, (modelViewMatrix * vec4(aLedger, 0.0)).z));
    vAlpha = shimmer * breathing * mix(.95, .7, aKind) * mix(depth, ledgerDepth, uLedger) * uReveal * mix(1.0, ledgerAlpha + ribbon * signal * .5, uLedger);
  }
`;

export const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - .5) * 2.0;
    if (d > 1.0) discard;
    float core = exp(-d * d * 7.0);
    float halo = pow(1.0 - d, 2.0) * .4;
    gl_FragColor = vec4(vColor * (1.0 + core * .4), (core + halo) * vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const groundVertex = /* glsl */ `
  varying vec2 vPosition;
  void main() {
    vPosition = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const groundFragment = /* glsl */ `
  uniform float uTime;
  uniform float uState;
  uniform float uTownship;
  uniform float uReveal;
  uniform vec3 uEmerald;
  uniform vec3 uProof;
  varying vec2 vPosition;
  void main() {
    float r = length(vPosition);
    float angle = atan(vPosition.y, vPosition.x);
    float rings = 0.0;
    for (int i = 0; i < 6; i++) {
      float radius = .72 + float(i) * .58;
      float line = exp(-pow((r - radius) * 80.0, 2.0));
      float halo = exp(-pow((r - radius) * 13.0, 2.0)) * .15;
      float arc = .35 + .65 * pow(.5 + .5 * sin(angle * 2.0 + uTime * .32 + float(i)), 5.0);
      rings += (line + halo) * arc;
    }
    float pulseRadius = mod(uTime * .3, 3.9);
    float pulse = exp(-pow((r - pulseRadius) * 28.0, 2.0)) * .25;
    float glow = exp(-r * r * .38) * .09;
    float gridX = pow(max(0.0, cos(vPosition.x * 14.0)), 90.0);
    float gridY = pow(max(0.0, cos(vPosition.y * 14.0)), 90.0);
    float grid = max(gridX, gridY) * mix(.035, .14, uTownship);
    // Connect the illustrative grove at its actual procedural root positions.
    vec2 lane = min(abs(vPosition), abs(abs(vPosition) - 2.25));
    float network = exp(-pow(min(lane.x, lane.y) * 65.0, 2.0));
    float node = exp(-pow(length(lane) * 16.0, 2.0));
    float townshipBounds = 1.0 - smoothstep(2.3, 2.5, max(abs(vPosition.x), abs(vPosition.y)));
    float connections = (network * .16 + node * .45) * townshipBounds * uTownship;
    float edge = 1.0 - smoothstep(3.5, 4.8, r);
    vec3 color = mix(uEmerald, uProof, uState * .32);
    float circleStrength = mix(.55, .15, uTownship);
    gl_FragColor = vec4(color, (rings * circleStrength + pulse * .5 + glow + grid + connections) * edge * uReveal);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
