export const particleVertex = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute float aKind;
  attribute vec3 aTownship;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uState;
  uniform float uTownship;
  uniform float uReveal;
  uniform vec3 uEmerald;
  uniform vec3 uCanopy;
  uniform vec3 uProof;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = mix(position, aTownship, uTownship);
    // Shared low-frequency wind keeps each limb coherent; only leaves flutter.
    float flexibility = smoothstep(.2, 4.5, position.y) * mix(.32, 1.0, aKind);
    float sway = sin(uTime * .42 + position.y * .68 + position.z * .24) * .055 * flexibility;
    float spread = uState * aKind;
    p.xz *= 1.0 + spread * .12;
    p.y += sin(aPhase + uTime * .3) * spread * .14;
    p.x += sway;
    p.z += cos(uTime * .34 + position.y * .72) * .035 * flexibility;
    p.x += sin(uTime * 1.1 + aPhase) * .004 * aKind;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uPixelRatio * 18.0 / -mv.z, 1.0, 7.0);
    float hue = .5 + .5 * sin(aPhase + p.y * 1.2);
    vColor = mix(uEmerald * .7, uCanopy, hue * .65);
    vColor = mix(vColor, uProof, smoothstep(.95, 1.0, hue) * .4);
    float shimmer = .78 + .22 * sin(aPhase * 4.0 + uTime * .65);
    float breathing = .94 + .06 * sin(uTime * .72);
    // Back-of-canopy particles recede without a post-processing pass.
    float depth = mix(.42, 1.0, smoothstep(-2.4, 2.4, (modelViewMatrix * vec4(position, 0.0)).z));
    float scan = pow(max(0.0, 1.0 - abs(p.y - mod(uTime * .24, 5.0)) * 2.2), 3.0);
    vColor += scan * uEmerald * .25;
    vAlpha = shimmer * breathing * mix(.95, .7, aKind) * depth * uReveal;
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
