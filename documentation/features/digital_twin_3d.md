# 3D Anatomical Digital Twin Technical Specification

The **3D Anatomical Digital Twin** is a client-side visual simulation layer rendering an interactive human body model mapped with real-time diagnostic risk heatmaps.

Built with:
- **Three.js** (`three`: `^0.162.0`)
- **React Three Fiber** (`@react-three/fiber`: `^8.18.0`)
- **Drei Helpers** (`@react-three/drei`: `^9.122.0`)

---

## 1. Mesh Topology & Organ Nodes

The 3D model contains isolated sub-meshes with independent materials and shader uniforms:

```
HumanBodyRoot
 cranial_mesh (Brain)
 thoracic_mesh (Heart & Aorta)
 pulmonary_mesh (Lungs & Bronchi)
 endocrine_mesh (Pancreas & Adrenals)
 hepatic_mesh (Liver)
 skeletal_mesh (Bones & Joint Articulations)
```

---

## 2. Dynamic Shader Uniforms & Color Grading

Each organ material uses custom GLSL vertex and fragment shaders interpolating emission and fresnel glow based on normalized model probability $p \in [0, 1]$:

```glsl
uniform vec3 uColorNormal;   // Cyan:   #06B6D4 (p < 0.3)
uniform vec3 uColorElevated; // Amber:  #F59E0B (0.3 <= p < 0.7)
uniform vec3 uColorCritical; // Crimson: #EF4444 (p >= 0.7)
uniform float uRiskScore;
uniform float uTime;

void main() {
  vec3 baseColor = mix(uColorNormal, uColorElevated, smoothstep(0.0, 0.5, uRiskScore));
  baseColor = mix(baseColor, uColorCritical, smoothstep(0.5, 1.0, uRiskScore));
  
  // Pulse frequency increases with risk severity
  float pulse = 0.85 + 0.15 * sin(uTime * (2.0 + uRiskScore * 5.0));
  gl_FragColor = vec4(baseColor * pulse, 0.85);
}
```

---

## 3. Interactive Camera Orbit & Organ Focus

Clicking any organ in the UI (or in the 3D canvas via raycasting) triggers a smooth camera tween powered by GSAP:

```javascript
import gsap from "gsap";

function focusOrgan(camera, controls, targetPosition) {
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z + 1.2,
    duration: 1.4,
    ease: "power3.inOut"
  });
  gsap.to(controls.target, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 1.4,
    ease: "power3.inOut"
  });
}
```
