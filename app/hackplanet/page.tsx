'use client';

/**
 * app/page.tsx  (single-file prototype)
 *
 * Dependencies to install:
 * npm i react react-dom next
 * npm i three @react-three/fiber @react-three/drei gsap @react-three/cannon
 * npm i tailwindcss postcss autoprefixer  (and configure Tailwind if you want styling)
 *
 * --- UPDATES ---
 * 1. Expanded LEVELS array from 2 to 5.
 * 2. Created multiple BUILDING_LAYOUTS to make each level look different.
 * 3. Replaced single 'CityBlock' with procedural 'Building' component
 * (can render as 'factory', 'skyscraper', 'office').
 * 4. Added 'CleanEnvironment' component (Clouds and Birds) that appears when 'isClean' is true.
 * 5. Security: Removed hardcoded API key from OpenAI helper.
 * 6. Passed 'levelIndex' to CityScene to trigger layout changes.
 * 7. Updated 'Page' component logic to handle 5 levels (starter code, reset button).
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Sky, Cloud } from '@react-three/drei';
import gsap from 'gsap';
import * as THREE from 'three';
// import { Physics, useBox } from '@react-three/cannon'; // kept as optional

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
  // Layout 0 (Level 1)
  [
    { type: 'factory', pos: [0, 0, 0], size: [2, 3, 2], pColor: '#5b5b5b', cColor: '#bdecb6' },
    { type: 'factory', pos: [3, 0, -1], size: [2, 4, 2], pColor: '#454545', cColor: '#c8fbdc' },
    { type: 'factory', pos: [-3, 0, 1], size: [2, 2.5, 2], pColor: '#3e3e3e', cColor: '#a6f0b9' },
    { type: 'factory', pos: [2, 0, 3], size: [2, 3.5, 2], pColor: '#4a4a4a', cColor: '#9fe7c5' },
    { type: 'factory', pos: [-2, 0, -3], size: [2, 2, 2], pColor: '#3a3a3a', cColor: '#b7f0d1' },
  ],
  // Layout 1 (Level 2)
  [
    { type: 'skyscraper', pos: [-4, 0, -4], size: [1.5, 8, 1.5], pColor: '#333', cColor: '#aaddff' },
    { type: 'office', pos: [-1, 0, -2], size: [3, 4, 2], pColor: '#404040', cColor: '#bbeeff' },
    { type: 'skyscraper', pos: [2, 0, 0], size: [1.5, 10, 1.5], pColor: '#2a2a2a', cColor: '#cceeff' },
    { type: 'office', pos: [3, 0, 4], size: [4, 3, 2.5], pColor: '#444', cColor: '#ddefFF' },
  ],
  // Layout 2 (Level 3)
  [
    { type: 'office', pos: [0, 0, 0], size: [5, 2, 5], pColor: '#504538', cColor: '#f0e68c' },
    { type: 'factory', pos: [0, 0, -5], size: [2, 4, 2], pColor: '#5b5b5b', cColor: '#bdecb6' },
    { type: 'factory', pos: [0, 0, 5], size: [2, 4, 2], pColor: '#5b5b5b', cColor: '#bdecb6' },
    { type: 'skyscraper', pos: [-5, 0, 0], size: [1.5, 7, 1.5], pColor: '#333', cColor: '#aaddff' },
    { type: 'skyscraper', pos: [5, 0, 0], size: [1.5, 7, 1.5], pColor: '#333', cColor: '#aaddff' },
  ],
  // Layout 3 (Level 4)
  [
    { type: 'factory', pos: [-5, 0, -5], size: [3, 5, 3], pColor: '#602a2a', cColor: '#ffc0cb' },
    { type: 'factory', pos: [-5, 0, 5], size: [3, 5, 3], pColor: '#602a2a', cColor: '#ffc0cb' },
    { type: 'factory', pos: [5, 0, -5], size: [3, 5, 3], pColor: '#602a2a', cColor: '#ffc0cb' },
    { type: 'factory', pos: [5, 0, 5], size: [3, 5, 3], pColor: '#602a2a', cColor: '#ffc0cb' },
    { type: 'office', pos: [0, 0, 0], size: [4, 2, 4], pColor: '#444', cColor: '#fff' },
  ],
  // Layout 4 (Level 5)
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
 * NEW: ProceduralBuilding Component
 * Renders different building types based on props.
 */
function ProceduralBuilding({
  type = 'office',
  position = [0, 0, 0],
  size = [2, 3, 2],
  pColor = '#444',
  cColor = '#ccc',
  isClean = false,
}) {
  const groupRef = useRef<THREE.Group>(null);
  const mainMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const stackMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const [width, height, depth] = size;

  // Animate color change
  useEffect(() => {
    if (!mainMatRef.current) return;
    gsap.to(mainMatRef.current.color, {
      ...(isClean ? { r: new THREE.Color(cColor).r, g: new THREE.Color(cColor).g, b: new THREE.Color(cColor).b } : { r: new THREE.Color(pColor).r, g: new THREE.Color(pColor).g, b: new THREE.Color(pColor).b }),
      duration: 1.5,
    });
    // Also animate smokestack if it exists
    if (stackMatRef.current) {
      gsap.to(stackMatRef.current.color, {
        ...(isClean ? { r: 0.8, g: 0.8, b: 0.8 } : { r: 0.2, g: 0.2, b: 0.2 }), // from dark grey to light grey
        duration: 1.5,
      });
    }
  }, [isClean, pColor, cColor]);

  let building;
  switch (type) {
    case 'factory':
      const stackHeight = height * 0.7;
      building = (
        <>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial ref={mainMatRef} color={pColor} roughness={0.7} metalness={0.1} />
          </mesh>
          <mesh position={[width * 0.3, height + stackHeight / 2, depth * 0.3]} castShadow>
            <cylinderGeometry args={[width * 0.15, width * 0.15, stackHeight, 12]} />
            <meshStandardMaterial ref={stackMatRef} color={'#222'} roughness={0.6} metalness={0.2} />
          </mesh>
        </>
      );
      break;
    case 'skyscraper':
    case 'office':
    default:
      building = (
        <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial ref={mainMatRef} color={pColor} roughness={0.7} metalness={0.1} />
        </mesh>
      );
      break;
  }

  return (
    <group ref={groupRef} position={position}>
      {building}
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

function CityScene({ isClean, doPulse, levelIndex }: { isClean: boolean; doPulse: boolean; levelIndex: number }) {
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
      gsap.to(lightRef.current, { intensity: 0.6, duration: 1.2 });
      gsap.to(camera.position, { x: 10, y: 8, z: 10, duration: 1.2, ease: 'power2.in' });
      gsap.to(camera, { zoom: 1.0, duration: 1.2, onUpdate: () => camera.updateProjectionMatrix() });
    }
  }, [isClean, camera]);

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

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight ref={lightRef} intensity={0.8} position={[5, 10, 5]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <group ref={groupRef}>
        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color={isClean ? '#90ee90' : '#666'} />
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
      <fog attach="fog" args={[isClean ? '#87ceeb' : '#333333', isClean ? 30 : 8, isClean ? 60 : 25]} />
      <FogParticles active={!isClean} />
      
      {/* NEW: Render clean elements */}
      {isClean && <CleanEnvironment />}

      <OrbitControls enablePan={false} enableZoom={true} minDistance={5} maxDistance={30} />
    </>
  );
}

// --------------------- Main App Component ---------------------

// --------------------- Main App Component ---------------------

export default function Page() {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = LEVELS[levelIndex];
  const [userCode, setUserCode] = useState<string>(() => LEVELS[0].code); // Init with level 0 code
  const [isClean, setIsClean] = useState(false);
  const [doPulse, setDoPulse] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [score, setScore] = useState(0);

  // --- NEW: Create audio objects. Using refs ensures they are stable. ---
  // We use refs to optionally pre-load or manage them, but simple Audio objects are fine too.
  // For one-shot sounds, creating them in the handler is easiest.

  useEffect(() => {
    // when level changes, reset scene and code
    setIsClean(false);
    setFeedback(null);
    setDoPulse(false);
    setUserCode(LEVELS[levelIndex].code); // Set default code snippet for new level
  }, [levelIndex]);

  async function handleRun() {
    // --- NEW: Play "Run" sound ---
    try {
      // Assumes 'whoosh.mp3' is in your /public folder
      const runSound = new Audio('/whoosh.mp3');
      runSound.volume = 0.5; // Optional: lower volume
      runSound.play();
    } catch (e) {
      console.warn('Could not play run sound', e);
    }
    // --- End new code ---

    setBusy(true);
    setFeedback(null);

    const evalResult = evaluateUserCode(userCode, level.input);

    if (!evalResult.ok) {
      setFeedback(`Error executing code: ${evalResult.error}`);
      setBusy(false);
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
    }

    setBusy(false);
  }

  function onSuccess() {
    // --- NEW: Play "Success" sound ---
    try {
      // Assumes 'clean-transition.mp3' is in your /public folder
      const successSound = new Audio('/clean-transition.mp3');
      successSound.play();
    } catch (e) {
      console.warn('Could not play success sound', e);
    }
    // --- End new code ---

    setIsClean(true);
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
            <CityScene isClean={isClean} doPulse={doPulse} levelIndex={levelIndex} />
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