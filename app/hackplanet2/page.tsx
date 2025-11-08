'use client';

/**
 * app/page.tsx  (single-file prototype)
 *
 * Dependencies to install:
 * npm i react react-dom next
 * npm i three @react-three/fiber @react-three/drei gsap
 * npm i tailwindcss postcss autoprefixer
 *
 * --- UPDATES ---
 * 1. Expanded LEVELS array from 2 to 5.
 * 2. Created multiple BUILDING_LAYOUTS to make each level look different.
 * 3. REPLACED 'ProceduralBuilding' with a "crazy realistic" version that
 * uses seeded randomness to build composite structures (factories,
 * skyscrapers, offices) with multiple materials (glass, concrete, metal).
 * 4. Added 'CleanEnvironment' (Clouds and Birds) for the 'isClean' state.
 * 5. Added sound effects for 'Run' and 'Success' with error catching.
 *
 * --- NEW UPDATES (Your Request) ---
 * 6. Added 'isDamaged' state for failed/incorrect code submissions.
 * 7. ProceduralBuilding now animates to very dark/black colors on 'isDamaged'.
 * 8. Added 'doShake' state for a camera shake effect on failure.
 * 9. Added 'playFailSound' function to accompany the damage effect.
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Sky, Cloud } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';

// --------------------- Utility: Levels (Expanded to 5) ---------------------
const LEVELS = [
  {
    id: 1,
    title: 'Air: Filter High-Emission Factories',
    description:
      'Given an array of emission values, return a new array keeping only values strictly less than 50.',
    input: [30, 70, 40, 90, 20],
    expectedOutput: [30, 40, 20],
    hint: 'Use Array.prototype.filter',
    code: 'function solve(input){\n  // input is an array of numbers\n  return input.filter(x => x < 50);\n}',
  },
  {
    id: 2,
    title: 'Water: Remove "toxic" markers',
    description:
      'Given an array of water quality labels, return only those that are NOT "toxic".',
    input: ['clean', 'toxic', 'clear', 'toxic', 'fresh'],
    expectedOutput: ['clean', 'clear', 'fresh'],
    hint: 'Use filter and an equality check (e.g., x !== "toxic")',
    code: 'function solve(input){\n  // input is an array of strings\n  return input.filter(x => x !== "toxic");\n}',
  },
  {
    id: 3,
    title: 'Soil: Neutralize Acidity',
    description:
      'Given an array of soil pH values, return a new array where every value is "neutral" (7.0).',
    input: [5.5, 6.2, 7.0, 8.1],
    expectedOutput: [7.0, 7.0, 7.0, 7.0],
    hint: 'Use Array.prototype.map to transform each value.',
    code: 'function solve(input){\n  // input is an array of numbers\n  return input.map(pH => 7.0);\n}',
  },
  {
    id: 4,
    title: 'Waste: Sum Recyclable Mass',
    description:
      'Given an array of waste objects, return the total mass (in kg) of all items marked as `recyclable: true`.',
    input: [
      { type: 'plastic', mass: 1.2, recyclable: true },
      { type: 'food', mass: 0.8, recyclable: false },
      { type: 'glass', mass: 2.1, recyclable: true },
      { type: 'styrofoam', mass: 0.3, recyclable: false },
    ],
    expectedOutput: 3.3,
    hint: 'Use .filter() to get recyclable items, then .reduce() to sum their mass.',
    code: 'function solve(input){\n  // input is an array of objects\n  return input\n    .filter(item => item.recyclable)\n    .reduce((sum, item) => sum + item.mass, 0);\n}',
  },
  {
    id: 5,
    title: 'Energy: Find Max Polluter',
    description:
      'Given an array of factory objects, return the `id` of the factory with the highest `emission` value.',
    input: [
      { id: 'factory-a', emission: 85 },
      { id: 'factory-b', emission: 120 },
      { id: 'factory-c', emission: 95 },
    ],
    expectedOutput: 'factory-b',
    hint: 'Use .reduce() to find the object with the max value, then return its id.',
    code: 'function solve(input){\n  // input is an array of objects\n  const maxPolluter = input.reduce((max, current) => {\n    return (current.emission > max.emission) ? current : max;\n  });\n  return maxPolluter.id;\n}',
  },
];

// --------------------- Utility: Building Layouts ---------------------
const BUILDING_LAYOUTS = [
  // Layout 0 (Level 1) - Factory Town
  [
    { type: 'factory', pos: [0, 0, 0], size: [2.5, 3, 2.5], pColor: '#5b5b5b', cColor: '#bdecb6' },
    { type: 'factory', pos: [4, 0, -1], size: [2, 4, 2], pColor: '#454545', cColor: '#c8fbdc' },
    { type: 'factory', pos: [-3, 0, 1], size: [2, 2.5, 2], pColor: '#3e3e3e', cColor: '#a6f0b9' },
    { type: 'factory', pos: [2, 0, 4], size: [2, 3.5, 2], pColor: '#4a4a4a', cColor: '#9fe7c5' },
    { type: 'factory', pos: [-2, 0, -3], size: [2, 2, 2], pColor: '#3a3a3a', cColor: '#b7f0d1' },
  ],
  // Layout 1 (Level 2) - Downtown
  [
    { type: 'skyscraper', pos: [-4, 0, -4], size: [1.5, 8, 1.5], pColor: '#333', cColor: '#aaddff' },
    { type: 'office', pos: [-1, 0, -2], size: [3, 4, 2], pColor: '#404040', cColor: '#bbeeff' },
    { type: 'skyscraper', pos: [2, 0, 0], size: [1.5, 10, 1.5], pColor: '#2a2a2a', cColor: '#cceeff' },
    { type: 'office', pos: [3, 0, 4], size: [4, 3, 2.5], pColor: '#444', cColor: '#ddefFF' },
  ],
  // Layout 2 (Level 3) - Symmetrical City
  [
    { type: 'office', pos: [0, 0, 0], size: [5, 2, 5], pColor: '#504538', cColor: '#f0e68c' },
    { type: 'factory', pos: [0, 0, -5], size: [2, 4, 2], pColor: '#5b5b5b', cColor: '#bdecb6' },
    { type: 'factory', pos: [0, 0, 5], size: [2, 4, 2], pColor: '#5b5b5b', cColor: '#bdecb6' },
    { type: 'skyscraper', pos: [-5, 0, 0], size: [1.5, 7, 1.5], pColor: '#333', cColor: '#aaddff' },
    { type: 'skyscraper', pos: [5, 0, 0], size: [1.5, 7, 1.5], pColor: '#333', cColor: '#aaddff' },
  ],
  // Layout 3 (Level 4) - Industrial Park
  [
    { type: 'factory', pos: [-5, 0, -5], size: [3, 5, 3], pColor: '#602a2a', cColor: '#ffc0cb' },
    { type: 'factory', pos: [-5, 0, 5], size: [3, 5, 3], pColor: '#602a2a', cColor: '#ffc0cb' },
    { type: 'factory', pos: [5, 0, -5], size: [3, 5, 3], pColor: '#602a2a', cColor: '#ffc0cb' },
    { type: 'factory', pos: [5, 0, 5], size: [3, 5, 3], pColor: '#602a2a', cColor: '#ffc0cb' },
    { type: 'office', pos: [0, 0, 0], size: [4, 2, 4], pColor: '#444', cColor: '#fff' },
  ],
  // Layout 4 (Level 5) - High-Tech Hub
  [
    { type: 'skyscraper', pos: [0, 0, 0], size: [3, 12, 3], pColor: '#1a1a1a', cColor: '#f5f5f5' },
    { type: 'skyscraper', pos: [3, 0, 3], size: [2, 8, 2], pColor: '#2a2a2a', cColor: '#e5e5e5' },
    { type: 'skyscraper', pos: [-3, 0, -3], size: [2, 8, 2], pColor: '#2a2a2a', cColor: '#e5e5e5' },
    { type: 'office', pos: [4, 0, -4], size: [3, 4, 3], pColor: '#3a3a3a', cColor: '#d5d5d5' },
    { type: 'office', pos: [-4, 0, 4], size: [3, 4, 3], pColor: '#3a3a3a', cColor: '#d5d5d5' },
  ],
];

// --------------------- Local evaluator ---------------------
/**
 * Evaluate the user code in-browser by creating a wrapper Function.
 */
function evaluateUserCode(userCode: string, inputValue: any): { ok: boolean; output: any; error?: string } {
  try {
    const hasSolve = /function\s+solve\s*\(|const\s+solve\s*=|let\s+solve\s*=|var\s+solve\s*=/.test(userCode);

    let wrapped = userCode;
    if (!hasSolve) {
      // If user wrote a single expression like "input.filter(x => x < 50)" we wrap it.
      wrapped = `function solve(input){ ${userCode.startsWith('return') ? userCode : 'return (' + userCode + ')'} }`;
    }

    // eslint-disable-next-line no-new-func
    const Fn = new Function(`${wrapped}; return solve;`);
    const solve = Fn();

    const result = solve(inputValue);
    return { ok: true, output: result };
  } catch (err: any) {
    return { ok: false, output: null, error: err?.message || String(err) };
  }
}

// --------------------- Optional: call OpenAI directly (client-side) ---------------------
/**
 * WARNING: For production, create a server-side route /api/evaluate.
 * This version checks for an environment variable.
 */
async function callOpenAiEvaluate(userCode: string, inputValue: any, expectedOutput: any) {
  // --- SECURITY FIX ---
  // The API key MUST be stored in .env.local as NEXT_PUBLIC_OPENAI_API_KEY=...
  // Never hardcode a key in your client-side code.
  const key = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!key) {
    console.error('No NEXT_PUBLIC_OPENAI_API_KEY set. Skipping OpenAI evaluation.');
    throw new Error('No NEXT_PUBLIC_OPENAI_API_KEY set');
  }

  const prompt = `You are an assistant that evaluates JavaScript solutions.
Problem input: ${JSON.stringify(inputValue)}
Expected output: ${JSON.stringify(expectedOutput)}
User code:
\`\`\`js
${userCode}
\`\`\`
Please return ONLY JSON like:
{"isCorrect": true/false, "feedback": "short message", "output": <the user's output>}
Evaluate by reasoning and comparing outputs (use JSON.stringify equality).`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || '';
  try {
    const parsed = JSON.parse(content.trim());
    return parsed;
  } catch (e) {
    return { isCorrect: false, feedback: 'OpenAI returned non-JSON response', output: null, raw: content };
  }
}

// --------------------- Three.js Scene Components ---------------------

/**
 * NEW: "Crazy Realistic" ProceduralBuilding Component
 *
 * This component replaces the simple block with a complex, multi-part
 * structure based on deterministic randomness (using its position as a seed).
 *
 * --- UPDATE ---
 * Now accepts 'isDamaged' prop to animate to black/dark colors on failure.
 */
function ProceduralBuilding({
  type = 'office',
  position = [0, 0, 0],
  size = [2, 3, 2],
  pColor = '#444', // Polluted color for the main body
  cColor = '#ccc', // Clean color for the main body
  isClean = false,
  isDamaged = false, // <-- NEW PROP
}) {
  const groupRef = useRef<THREE.Group>(null);

  // --- Material Refs ---
  const mainMatRef = useRef<THREE.MeshStandardMaterial>(null); // Concrete, Brick
  const glassMatRef = useRef<THREE.MeshStandardMaterial>(null); // Glass shell
  const metalMatRef = useRef<THREE.MeshStandardMaterial>(null); // Smokestacks, Antennas
  const secondaryMatRef = useRef<THREE.MeshStandardMaterial>(null); // Podium, Warehouse

  // --- Deterministic Randomness ---
  const seed = Math.abs((position[0] * 17) ^ (position[2] * 31)) % 100;
  const [width, height, depth] = size;

  // --- Animation Logic (UPDATED) ---
  useEffect(() => {
    // --- Define color states ---
    const cleanMain = new THREE.Color(cColor);
    const pollutedMain = new THREE.Color(pColor);
    const damagedMain = new THREE.Color('#1a1a1a'); // Very dark "damaged" color

    // --- Select target colors based on state ---
    const targetMainColor = isClean ? cleanMain : isDamaged ? damagedMain : pollutedMain;
    const animationDuration = isDamaged ? 0.4 : 1.5; // Faster animation for damage

    // 1. Main Material (Concrete/Brick)
    if (mainMatRef.current) {
      gsap.to(mainMatRef.current.color, {
        r: targetMainColor.r,
        g: targetMainColor.g,
        b: targetMainColor.b,
        duration: animationDuration,
      });
    }

    // 2. Secondary Material (Podium/Warehouse)
    if (secondaryMatRef.current) {
      const targetSecondaryColor = targetMainColor.clone().multiplyScalar(0.8);
      gsap.to(secondaryMatRef.current.color, {
        r: targetSecondaryColor.r,
        g: targetSecondaryColor.g,
        b: targetSecondaryColor.b,
        duration: animationDuration,
      });
    }

    // 3. Glass Material
    if (glassMatRef.current) {
      const cGlass = new THREE.Color('#88aaff'); // Clean: bright, reflective blue
      const pGlass = new THREE.Color('#333'); // Polluted: dark, grimy
      const dGlass = new THREE.Color('#000000'); // Damaged: Pitch black

      const targetGlassColor = isClean ? cGlass : isDamaged ? dGlass : pGlass;
      const targetGlassOpacity = isClean ? 0.6 : isDamaged ? 1.0 : 0.8; // Damaged glass is opaque black

      gsap.to(glassMatRef.current.color, {
        r: targetGlassColor.r,
        g: targetGlassColor.g,
        b: targetGlassColor.b,
        duration: animationDuration,
      });
      gsap.to(glassMatRef.current, { opacity: targetGlassOpacity, duration: animationDuration });
    }

    // 4. Metal Material
    if (metalMatRef.current) {
      const cMetal = new THREE.Color('#aaa'); // Clean: silver
      const pMetal = new THREE.Color('#1a1a1a'); // Polluted: black, sooty
      const dMetal = new THREE.Color('#000000'); // Damaged: Pitch black

      const targetMetalColor = isClean ? cMetal : isDamaged ? dMetal : pMetal;

      gsap.to(metalMatRef.current.color, {
        r: targetMetalColor.r,
        g: targetMetalColor.g,
        b: targetMetalColor.b,
        duration: animationDuration,
      });
    }
  }, [isClean, isDamaged, pColor, cColor]); // <-- Add isDamaged to dependency array

  // --- Building Generation ---
  let buildingParts = [];

  switch (type) {
    // --- SKYSCRAPER ---
    case 'skyscraper':
      const coreRatio = 0.5 + (seed % 30) / 100; // 0.5 to 0.8
      const hasAntenna = (seed % 4) === 0; // 1 in 4 chance

      // 1. Glass Shell (Outer)
      buildingParts.push(
        <mesh position={[0, height / 2, 0]} castShadow key="shell">
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            ref={glassMatRef}
            color="#333"
            metalness={0.9}
            roughness={0.1}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      );
      // 2. Concrete Core (Inner)
      buildingParts.push(
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow key="core">
          <boxGeometry args={[width * coreRatio, height, depth * coreRatio]} />
          <meshStandardMaterial ref={mainMatRef} color={pColor} roughness={0.8} />
        </mesh>
      );
      // 3. Antenna
      if (hasAntenna) {
        const antennaHeight = height * (0.1 + (seed % 10) / 100); // 10-20% of building height
        buildingParts.push(
          <mesh position={[0, height + antennaHeight / 2, 0]} castShadow key="antenna">
            <cylinderGeometry args={[width * 0.05, width * 0.05, antennaHeight, 8]} />
            <meshStandardMaterial ref={metalMatRef} color="#1a1a1a" metalness={0.8} roughness={0.3} />
          </mesh>
        );
      }
      break;

    // --- OFFICE ---
    case 'office':
      const podiumHeight = height * 0.25;
      const towerHeight = height * 0.75;
      const podiumWidth = width * (1.2 + (seed % 30) / 100); // 1.2x to 1.5x wider
      const podiumDepth = depth * (1.2 + (seed % 30) / 100);
      const hasRooftopUnit = (seed % 2) === 0;

      // 1. Main Tower
      buildingParts.push(
        <mesh position={[0, towerHeight / 2 + podiumHeight, 0]} castShadow receiveShadow key="tower">
          <boxGeometry args={[width, towerHeight, depth]} />
          <meshStandardMaterial ref={mainMatRef} color={pColor} roughness={0.7} />
        </mesh>
      );
      // 2. Podium (Lobby)
      buildingParts.push(
        <mesh position={[0, podiumHeight / 2, 0]} castShadow receiveShadow key="podium">
          <boxGeometry args={[podiumWidth, podiumHeight, podiumDepth]} />
          <meshStandardMaterial ref={secondaryMatRef} color={new THREE.Color(pColor).multiplyScalar(0.8)} roughness={0.8} />
        </mesh>
      );
      // 3. Rooftop HVAC Unit
      if (hasRooftopUnit) {
        const unitSize = width * 0.3;
        buildingParts.push(
          <mesh position={[width * 0.2, height + unitSize / 2, depth * 0.2]} castShadow key="hvac">
            <boxGeometry args={[unitSize, unitSize, unitSize]} />
            <meshStandardMaterial ref={metalMatRef} color="#1a1a1a" metalness={0.6} roughness={0.4} />
          </mesh>
        
      );
      }
      break;

    // --- FACTORY ---
    case 'factory':
    default:
      const stackCount = 2 + (seed % 3); // 2, 3, or 4 stacks
      const stackHeight = height * (0.7 + (seed % 50) / 100); // 70% to 120% of height
      const hasWarehouse = (seed % 2) === 0;

      // 1. Main Hall
      buildingParts.push(
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow key="hall">
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial ref={mainMatRef} color={pColor} roughness={0.8} metalness={0.1} />
        </mesh>
      );
      // 2. Attached Warehouse
      if (hasWarehouse) {
        const whWidth = width * (0.8 + (seed % 40) / 100); // 80-120% of width
        const whHeight = height * 0.4;
        buildingParts.push(
          <mesh position={[width / 2 + whWidth / 2, whHeight / 2, 0]} castShadow receiveShadow key="warehouse">
            <boxGeometry args={[whWidth, whHeight, depth * 0.9]} />
            <meshStandardMaterial ref={secondaryMatRef} color={new THREE.Color(pColor).multiplyScalar(0.8)} roughness={0.8} />
          </mesh>
        );
      }
      // 3. Multiple Smokestacks
      for (let i = 0; i < stackCount; i++) {
        // Assign first stack to main metal ref for animation
        const mat = i === 0 ? metalMatRef : undefined;
        // Use a non-animated color for the other stacks
        const nonAnimColor = mat ? undefined : '#1a1a1a';

        const stackX = (i / stackCount - 0.5) * width * 0.8 + (seed % 10 / 10 - 0.5) * 0.2;
        const stackZ = (depth / 2 * 0.8) * (i % 2 === 0 ? 1 : -1);
        const stackRadius = width * 0.1;
        buildingParts.push(
          <mesh position={[stackX, height + stackHeight / 2, stackZ]} castShadow key={`stack-${i}`}>
            <cylinderGeometry args={[stackRadius, stackRadius * 0.8, stackHeight, 12]} />
            <meshStandardMaterial ref={mat} color={nonAnimColor} metalness={0.7} roughness={0.4} />
          </mesh>
        );
      }
      break;
  }

  return (
    <group ref={groupRef} position={position}>
      {buildingParts}
    </group>
  );
}

function FogParticles({ active }: { active: boolean }) {
  const ref = useRef<THREE.Points>(null);
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
    }
  });

  // Animate opacity
  useEffect(() => {
    if (!ref.current) return;
    gsap.to((ref.current.material as THREE.PointsMaterial), {
      opacity: active ? 0.9 : 0.0,
      duration: 1.5,
      onComplete: () => {
        if (ref.current) (ref.current.material as THREE.PointsMaterial).visible = active;
      }
    });
    if (active) (ref.current.material as THREE.PointsMaterial).visible = true;
  }, [active])

  return (
    <points ref={ref} position={[0, 2, 0]}>
      <sphereGeometry args={[8, 32, 32]} />
      <pointsMaterial size={0.08} sizeAttenuation={true} color={'#bfbfbf'} opacity={0.9} transparent />
    </points>
  );
}

/**
 * NEW: Simple animated bird
 */
function Bird({ offset, ...props }: { offset: number, [key: string]: any }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime() + offset;
    // Fly in a wide circle
    ref.current.position.x = Math.cos(t * 0.4) * 12;
    ref.current.position.z = Math.sin(t * 0.4) * 12;
    // Bob up and down
    ref.current.position.y = 10 + Math.sin(t * 2) * 0.5;
    // Look in direction of flight
    ref.current.rotation.y = -t * 0.4 + Math.PI / 2;
  });
  return (
    <mesh ref={ref} {...props}>
      <coneGeometry args={[0.05, 0.3, 4]} /> {/* Simple "bird" shape */}
      <meshStandardMaterial color="black" />
    </mesh>
  );
}

/**
 * NEW: Clean environment elements
 */
function CleanEnvironment() {
  const groupRef = useRef<THREE.Group>(null!);

  // Fade in
  useEffect(() => {
    groupRef.current.scale.set(0, 0, 0);
    gsap.to(groupRef.current.scale, { x: 1, y: 1, z: 1, duration: 1.5, delay: 0.5, ease: 'power2.out' });
  }, []);

  return (
    <group ref={groupRef}>
      {/* Birds */}
      <Bird offset={0} />
      <Bird offset={1.5} />
      <Bird offset={3.0} />

      {/* Clouds */}
      <Cloud position={[-4, 8, -4]} speed={0.2} opacity={0.6} segments={40} depth={0.5} width={3} />
      <Cloud position={[4, 9, -2]} speed={0.2} opacity={0.5} segments={40} depth={0.5} width={4} />
      <Cloud position={[0, 8, 5]} speed={0.2} opacity={0.6} segments={40} depth={0.5} width={3} />
    </group>
  );
}

function CityScene({
  isClean,
  doPulse,
  levelIndex,
  isDamaged, // <-- NEW PROP
  doShake, // <-- NEW PROP
}: {
  isClean: boolean;
  doPulse: boolean;
  levelIndex: number;
  isDamaged: boolean;
  doShake: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.DirectionalLight>(null);
  const { camera } = useThree();

  // Get current building layout, wrap around if levels > layouts
  const layout = BUILDING_LAYOUTS[levelIndex % BUILDING_LAYOUTS.length];

  // On mount, set camera position
  useEffect(() => {
    camera.position.set(10, 8, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // animate clean <-> polluted using gsap
  useEffect(() => {
    if (!groupRef.current || !lightRef.current) return;
    if (isClean) {
      gsap.to(lightRef.current, { intensity: 1.6, duration: 1.8 });
      gsap.to(camera.position, { x: 12, y: 10, z: 12, duration: 1.2, ease: 'power2.out' });
      gsap.to(camera, { zoom: 1.1, duration: 1.2, onUpdate: () => camera.updateProjectionMatrix() });
    } else {
      // Don't animate camera/light if we're just shaking
      if (doShake) return;
      gsap.to(lightRef.current, { intensity: 0.6, duration: 1.2 });
      gsap.to(camera.position, { x: 10, y: 8, z: 10, duration: 1.2, ease: 'power2.in' });
      gsap.to(camera, { zoom: 1.0, duration: 1.2, onUpdate: () => camera.updateProjectionMatrix() });
    }
  }, [isClean, camera, doShake]);

  // small pulse animation
  useEffect(() => {
    if (doPulse && groupRef.current) {
      gsap.fromTo(
        groupRef.current.scale,
        { x: 1, y: 1, z: 1 },
        { x: 1.05, y: 1.05, z: 1.05, duration: 0.45, yoyo: true, repeat: 1 }
      );
    }
  }, [doPulse]);

  // --- NEW: Camera shake effect ---
  useEffect(() => {
    if (doShake) {
      // A quick, jarring shake
      gsap.to(camera.position, {
        x: '+=0.3', // relative shake
        y: '-=0.2',
        z: '+=0.3',
        duration: 0.1,
        yoyo: true,
        repeat: 5, // 5 shakes back and forth
        ease: 'power1.inOut',
      });
    }
  }, [doShake, camera]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight ref={lightRef} intensity={0.8} position={[5, 10, 5]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <group ref={groupRef}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          {/* Ground also darkens on damage */}
          <meshStandardMaterial color={isClean ? '#90ee90' : isDamaged ? '#333' : '#666'} />
        </mesh>

        {/* --- NEW: Dynamic Buildings --- */}
        {layout.map((building, index) => (
          <ProceduralBuilding
            key={`level-${levelIndex}-bldg-${index}`}
            type={building.type as any}
            position={building.pos as [number, number, number]}
            size={building.size as [number, number, number]}
            pColor={building.pColor}
            cColor={building.cColor}
            isClean={isClean}
            isDamaged={isDamaged} // <-- Pass down damage state
          />
        ))}

        {/* small "trees" placeholders that scale in on clean */}
        <mesh position={[1.5, 0.5, -2]} scale={isClean ? 1 : 0.01}>
          <coneGeometry args={[0.5, 1.2, 8]} />
          <meshStandardMaterial color="#0f9d58" />
        </mesh>
        <mesh position={[-1.5, 0.5, 2]} scale={isClean ? 1 : 0.01}>
          <coneGeometry args={[0.5, 1.2, 8]} />
          <meshStandardMaterial color="#0f9d58" />
        </mesh>
        <mesh position={[3, 0.5, 3]} scale={isClean ? 1 : 0.01}>
          <coneGeometry args={[0.3, 1.0, 8]} />
          <meshStandardMaterial color="#2a9d8f" />
        </mesh>

        {/* sky */}
        <Sky distance={450000} sunPosition={isClean ? [5, 10, 5] : [-1, 1, 0]} inclination={isClean ? 0.45 : 0.6} azimuth={0.25} />
      </group>

      {/* smog/fog layer */}
      {/* Fog becomes denser and darker on damage */}
      <fog attach="fog" args={[isClean ? '#87ceeb' : isDamaged ? '#111' : '#333333', isClean ? 30 : 8, isClean ? 60 : 20]} />
      <FogParticles active={!isClean} />

      {/* NEW: Render clean elements */}
      {isClean && <CleanEnvironment />}

      <OrbitControls enablePan={false} enableZoom={true} minDistance={5} maxDistance={30} />
    </>
  );
}

// --------------------- Main App Component ---------------------

export default function Page() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];
  const [userCode, setUserCode] = useState<string>(() => LEVELS[0].code); // Init with level 0 code
  const [isClean, setIsClean] = useState(false);
  const [doPulse, setDoPulse] = useState(false);
  const [feedback, setFeedback] =useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);

  // --- NEW STATES ---
  const [isDamaged, setIsDamaged] = useState(false);
  const [doShake, setDoShake] = useState(false);

  useEffect(() => {
    // when level changes, reset scene and code
    setIsClean(false);
    setFeedback(null);
    setDoPulse(false);
    setIsDamaged(false); // <-- Reset damage
    setDoShake(false); // <-- Reset shake
    setUserCode(LEVELS[levelIndex].code); // Set default code snippet for new level
  }, [levelIndex]);

  // --- NEW: Failure sound function ---
  function playFailSound() {
    try {
      // Assumes 'failure-buzz.mp3' is in your /public folder
      const failSound = new Audio('/failure-buzz.mp3');
      failSound.volume = 0.4;
      failSound.play().catch(e => {
        console.warn('Could not play fail sound:', e);
      });
    } catch (e) {
      console.warn('Could not create fail sound:', e);
    }
  }

  async function handleRun() {
    // --- NEW: Play "Run" sound ---
    try {
      // Assumes 'whoosh.mp3' is in your /public folder
      const runSound = new Audio('/whoosh.mp3');
      runSound.volume = 0.5; // Optional: lower volume
      runSound.play().catch(e => {
        console.warn('Could not play run sound (promise rejection):', e);
      });
    } catch (e) {
      console.warn('Could not play run sound (sync error):', e);
    }
    // --- End new code ---

    setBusy(true);
    setFeedback(null);
    setIsDamaged(false); // <-- Reset damage on new run
    setDoShake(false); // <-- Reset shake on new run

    const evalResult = evaluateUserCode(userCode, level.input);

    if (!evalResult.ok) {
      setFeedback(`Error executing code: ${evalResult.error}`);
      setBusy(false);
      setIsDamaged(true); // <-- Set damage
      setDoShake(true); // <-- Set shake
      playFailSound(); // <-- Play sound
      setTimeout(() => setDoShake(false), 700); // Reset shake after animation
      return;
    }

    const userOutput = evalResult.output;
    // Use JSON.stringify for robust comparison of arrays/objects/values
    const equal = JSON.stringify(userOutput) === JSON.stringify(level.expectedOutput);

    // WARNING: client-side key exposure; recommended to use server proxy.
    const tryOpenAi = false; // Keep false unless you've set up a server proxy

    if (tryOpenAi) {
      try {
        const aiResp = await callOpenAiEvaluate(userCode, level.input, level.expectedOutput);
        if (aiResp?.isCorrect) {
          setFeedback(aiResp.feedback || 'Correct (verified by AI).');
          onSuccess();
        } else {
          setFeedback(aiResp.feedback || 'Incorrect (AI evaluation).');
          setIsDamaged(true); // <-- Set damage
          setDoShake(true); // <-- Set shake
          playFailSound(); // <-- Play sound
          setTimeout(() => setDoShake(false), 700);
        }
      } catch (err: any) {
        setFeedback(`OpenAI error: ${err?.message || err}`);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (equal) {
      setFeedback('✅ Correct! Environment stabilized — triggering ecosystem recovery...');
      onSuccess();
    } else {
      setFeedback(
        `❌ Incorrect. Your output: ${JSON.stringify(userOutput)} — Expected: ${JSON.stringify(level.expectedOutput)}. Hint: ${level.hint}`
      );
      setIsClean(false); // Ensure it stays polluted on fail
      setIsDamaged(true); // <-- Set damage
      setDoShake(true); // <-- Set shake
      playFailSound(); // <-- Play sound
      setTimeout(() => setDoShake(false), 700); // Reset shake after animation
    }

    setBusy(false);
  }

  function onSuccess() {
    // --- NEW: Play "Success" sound ---
    try {
      // Assumes 'clean-transition.mp3' is in your /public folder
      const successSound = new Audio('/clean-transition.mp3');
      successSound.play().catch(e => {
        console.warn('Could not play success sound (promise rejection):', e);
      });
    } catch (e) {
      console.warn('Could not play success sound (sync error):', e);
    }
    // --- End new code ---

    setIsClean(true);
    setIsDamaged(false); // <-- Reset damage on success
    setDoShake(false); // <-- Reset shake on success
    setDoPulse(true);
    setScore((s) => s + 100);
    setTimeout(() => setDoPulse(false), 700);

    // unlock next level
    setTimeout(() => {
      if (levelIndex < LEVELS.length - 1) {
        setLevelIndex((i) => i + 1);
      } else {
        setFeedback((f) => (f ? f + ' 🎉 You finished all levels! Ecosystem fully restored!' : 'You finished all levels! 🎉'));
      }
    }, 2500); // Increased delay to enjoy the clean scene
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: 3D City */}
      <div className="w-full md:w-2/3 h-[60vh] md:h-screen relative">
        <Canvas shadows camera={{ position: [10, 8, 10], fov: 50 }}>
          <Suspense fallback={<Html center>Loading scene...</Html>}>
            <CityScene
              isClean={isClean}
              doPulse={doPulse}
              levelIndex={levelIndex}
              isDamaged={isDamaged} // <-- Pass state
              doShake={doShake} // <-- Pass state
            />
          </Suspense>
        </Canvas>

        {/* In-scene overlay: score + level */}
        <div className="absolute left-4 top-4 bg-black/40 text-white p-3 rounded-lg">
          <div className="text-sm">Eco-Coder</div>
          <div className="font-bold text-lg">Score: {score}</div>
          <div className="text-xs opacity-80">Level {level.id}: {level?.title}</div>
        </div>
      </div>

      {/* Right: Editor + Challenge */}
      <div className="w-full md:w-1/3 p-4 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col">
        <h2 className="text-xl font-semibold mb-2">{level.title}</h2>
        <p className="text-sm mb-2">{level.description}</p>
        <div className="mb-2">
          <div className="text-xs text-gray-300">Input:</div>
          <pre className="bg-black/30 p-2 rounded text-sm overflow-auto">{JSON.stringify(level.input, null, 2)}</pre>
        </div>

        <div className="mb-2 flex-grow flex flex-col">
          <div className="text-xs text-gray-300 mb-1">Your Code</div>
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            className="w-full h-48 md:flex-grow bg-black/20 p-2 rounded resize-none text-sm font-mono border border-slate-700"
            spellCheck="false"
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={handleRun}
            disabled={busy}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded font-semibold disabled:opacity-50"
          >
            {busy ? 'Running...' : 'Run Solution'}
          </button>

          <button
            onClick={() => {
              setUserCode(level.code); // Reset to current level's template
            }}
            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
          >
            Reset Code
          </button>
        </div>

        <div className="mt-3">
          <div className="text-sm font-medium">Feedback:</div>
          <div className="mt-2 p-3 min-h-[64px] rounded bg-black/20 text-sm">{feedback ?? 'Submit your code to see feedback.'}</div>
        </div>

        <div className="mt-4 text-xs text-gray-400">
          Tip: Your code must successfully produce the expected output to pass. The `solve` function wrapper is added automatically if you only provide an expression.
        </div>
      </div>
    </div>
  );
}