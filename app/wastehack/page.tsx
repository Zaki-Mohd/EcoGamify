// @/app/page.tsx
"use client";

import React, {
  Suspense,
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import {
  Canvas,
  useThree,
  useFrame,
} from "@react-three/fiber";
import {
  OrbitControls,
  Plane,
  Box,
  Cylinder,
  Sphere,
  Text,
  TorusKnot, // Added for L2 Treasure
  Cone,
} from "@react-three/drei";
import * as THREE from "three";
import CodeEditor from "@uiw/react-textarea-code-editor";

// --- Types ---

type TrashTypeL1 = "plastic" | "metal" | "organic";
type TrashTypeL2 = "glass" | "paper" | "e-waste";
type TrashType = TrashTypeL1 | TrashTypeL2;

type GameStage = "cleaning" | "upcycling" | "win";
type AlgorithmTypeL1 = "nestedLoop" | "singleLoopOrganic" | "singleLoopPlastic";
type AlgorithmTypeL2 = "loopGlass" | "loopPaper" | "loopEwaste";
type AlgorithmType = AlgorithmTypeL1 | AlgorithmTypeL2;

interface TrashItemState {
  id: number;
  type: TrashType;
  position: [number, number, number];
  status: "idle" | "sorting" | "sorted";
  targetPosition?: [number, number, number];
}

interface TrashBinProps {
  position: [number, number, number];
  type: string; // Allow any string
  color: string;
}

interface TrashItemProps {
  item: TrashItemState;
  onSorted: (id: number, correct: boolean, type: TrashType) => void;
}

interface SortedStatusL1 {
  nestedLoop: boolean;
  singleLoopOrganic: boolean;
  singleLoopPlastic: boolean;
}

interface SortedStatusL2 {
  loopGlass: boolean;
  loopPaper: boolean;
  loopEwaste: boolean;
}

// --- Constants ---

const BIN_POSITIONS_L1: Record<TrashTypeL1, [number, number, number]> = {
  plastic: [-4, 0.5, -5],
  metal: [0, 0.5, -5],
  organic: [4, 0.5, -5],
};

const BIN_POSITIONS_L2: Record<TrashTypeL2, [number, number, number]> = {
  glass: [-4, 0.5, -5],
  paper: [0, 0.5, -5],
  "e-waste": [4, 0.5, -5],
};

const TRASH_TYPES_L1: TrashTypeL1[] = ["plastic", "metal", "organic"];
const TRASH_TYPES_L2: TrashTypeL2[] = ["glass", "paper", "e-waste"];

const L1_TREASURE = {
  id: "smart_bench",
  position: [0, 0, 3] as [number, number, number],
  label: "Smart Bench",
};

const L2_TREASURE = {
  id: "tech_sculpture",
  position: [0, 0.5, 0] as [number, number, number],
  label: "Tech Art Sculpture",
};

const LEVEL_1_CODE = `// --- Algorithm 1: The "Slow" Sorter (O(n^2)) ---
// GOAL: Sort "metal" using a NESTED LOOP.
function sortMetal_On2(trashList) {
  // TODO: Write a nested loop
  // Inside, check for "metal" and sendTo(metal_bin).
  
}

// --- Algorithm 2: The "Fast" Sorter (O(n)) ---
// GOAL: Sort "organic" using a SINGLE LOOP.
function sortOrganic_On(trashList) {
  // TODO: Write a single loop
  // Inside, check for "organic" and sendTo(organic_bin).
  
}

// --- Algorithm 3: Another "Fast" Sorter (O(n)) ---
// GOAL: Sort "plastic" using a SINGLE LOOP.
function sortPlastic_On(trashList) {
  // TODO: Write a single loop
  // Inside, check for "plastic" and sendTo(plastic_bin).
  
}
`;

const LEVEL_2_CODE = `// --- LEVEL 2: New Materials ---
// --- Algorithm 4: Sort "glass" (O(n)) ---
function sortGlass(trashList) {
  // TODO: Write a single loop
  // Inside, check for "glass" and sendTo(glass_bin).
  
}

// --- Algorithm 5: Sort "paper" (O(n)) ---
function sortPaper(trashList) {
  // TODO: Write a single loop
  // Inside, check for "paper" and sendTo(paper_bin).
  
}

// --- Algorithm 6: Sort "e-waste" (O(n)) ---
function sortEwaste(trashList) {
  // TODO: Write a single loop
  // Inside, check for "e-waste" and sendTo(e-waste_bin).
  
}
`;

// --- Helper Functions ---

const createTrash = (
  count: number,
  types: TrashType[]
): TrashItemState[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + Date.now(), // Ensure unique IDs across levels
    type: types[Math.floor(Math.random() * types.length)],
    position: [
      (Math.random() - 0.5) * 15,
      0.25,
      (Math.random() - 0.5) * 8 + 4, // Spawn in front
    ],
    status: "idle",
  }));
};

/**
 * Extracts the body of a specific function from a code string.
 * Flexible with whitespace.
 */
const getFunctionBody = (code: string, functionName: string): string | null => {
  const regex = new RegExp(
    `function\\s+${functionName}\\s*\\(.*?\\)\\s*\\{([\\s\\S]*?)\\}`,
    "is"
  );
  const match = code.match(regex);
  return match && match[1] ? match[1] : null;
};

// --- 3D Components ---

function TrashItem({ item, onSorted }: TrashItemProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const geometry = useMemo(() => {
    switch (item.type) {
      case "plastic":
        return <boxGeometry args={[0.5, 0.5, 0.5]} />; // Blue
      case "metal":
        return <cylinderGeometry args={[0.2, 0.2, 0.6, 16]} />; // Gray
      case "organic":
        return <sphereGeometry args={[0.3, 16, 16]} />; // Green
      case "glass":
        return <coneGeometry args={[0.3, 0.7, 16]} />; // Light blue
      case "paper":
        return <boxGeometry args={[0.4, 0.1, 0.6]} />; // White
      case "e-waste":
        return <boxGeometry args={[0.6, 0.3, 0.4]} />; // Black
      default:
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    }
  }, [item.type]);

  const color = useMemo(() => {
    switch (item.type) {
      case "plastic":
        return "#3b82f6";
      case "metal":
        return "#6b7280";
      case "organic":
        return "#16a34a";
      case "glass":
        return "#67e8f9";
      case "paper":
        return "#ffffff";
      case "e-waste":
        return "#1f2937";
    }
  }, [item.type]);

  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    let animationFrame: number;
    let startTime = Date.now();
    if (item.status === "sorting" && item.targetPosition) {
      const startPos = mesh.position.clone();
      const targetPos = new THREE.Vector3(...item.targetPosition);
      const midPoint = new THREE.Vector3(
        (startPos.x + targetPos.x) / 2,
        Math.max(startPos.y, targetPos.y) + 3,
        (startPos.z + targetPos.z) / 2
      );
      const duration = 1200;
      startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        if (progress < 0.5) {
          const t = progress * 2;
          mesh.position.lerpVectors(startPos, midPoint, t * t);
        } else {
          const t = (progress - 0.5) * 2;
          mesh.position.lerpVectors(midPoint, targetPos, 1 - (1 - t) * (1 - t));
        }
        mesh.rotation.y += 0.05;
        if (progress >= 1) {
          let correct = false;
          const [posX] = item.targetPosition!;
          if (
            (item.type === "plastic" && posX === BIN_POSITIONS_L1.plastic[0]) ||
            (item.type === "metal" && posX === BIN_POSITIONS_L1.metal[0]) ||
            (item.type === "organic" && posX === BIN_POSITIONS_L1.organic[0]) ||
            (item.type === "glass" && posX === BIN_POSITIONS_L2.glass[0]) ||
            (item.type === "paper" && posX === BIN_POSITIONS_L2.paper[0]) ||
            (item.type === "e-waste" && posX === BIN_POSITIONS_L2["e-waste"][0])
          ) {
            correct = true;
          }
          onSorted(item.id, correct, item.type);
        } else {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      animate();
    }
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [item.status, item.targetPosition, item.id, item.type, onSorted]);

  if (item.status === "sorted") return null;
  return (
    <mesh ref={meshRef} position={item.position}>
      {geometry}
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function TrashBin({ position, type, color }: TrashBinProps) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.7, 0.7, 1.5, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>
      <Text position={[0, 1.2, 0]} fontSize={0.4} color="white" anchorX="center">
        {type.toUpperCase()}
      </Text>
    </group>
  );
}

function UpcycledItem({
  type,
  position,
  label,
}: {
  type: string;
  position: [number, number, number];
  label: string;
}) {
  const ref = useRef<THREE.Group>(null!);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.scale.set(0, 0, 0);
    const startTime = Date.now();
    const duration = 1000;
    const animate = () => {
      if (!ref.current) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const c4 = (2 * Math.PI) / 3;
      const eased =
        progress === 0
          ? 0
          : progress === 1
          ? 1
          : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) +
            1;
      ref.current.scale.set(eased, eased, eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return (
    <group ref={ref} position={position}>
      {/* L1 Treasure: Smart Bench */}
      {type === "smart_bench" && (
        <>
          <Box args={[2, 0.2, 0.5]} position={[-0.2, 0.4, 0]}>
            <meshStandardMaterial color="#4ade80" />
          </Box>
          <Box args={[0.2, 0.4, 0.5]} position={[-1.0, 0.2, 0]}>
            <meshStandardMaterial color="#6b7280" />
          </Box>
          <Box args={[0.2, 0.4, 0.5]} position={[0.6, 0.2, 0]}>
            <meshStandardMaterial color="#6b7280" />
          </Box>
          <Box args={[0.6, 0.6, 0.6]} position={[1.4, 0.3, 0]}>
            <meshStandardMaterial color="#8b5a2b" />
          </Box>
          <Box args={[0.5, 0.2, 0.5]} position={[1.4, 0.7, 0]}>
            <meshStandardMaterial color="#573a1a" />
          </Box>
        </>
      )}

      {/* L2 Treasure: Tech Art Sculpture */}
      {type === "tech_sculpture" && (
        <>
          {/* Base (from E-Waste plastic) */}
          <Box args={[1, 0.2, 1]} position={[0, 0.1, 0]}>
            <meshStandardMaterial color="#1f2937" />
          </Box>
          {/* Main Body (from Paper pulp) */}
          <TorusKnot args={[0.5, 0.1, 100, 16]} position={[0, 0.8, 0]}>
            <meshStandardMaterial color="#ffffff" roughness={0.8} />
          </TorusKnot>
          {/* Details (from Glass and E-Waste copper) */}
          <Sphere args={[0.05, 8, 8]} position={[0, 1.4, 0]}>
            <meshStandardMaterial color="#67e8f9" transparent opacity={0.8} />
          </Sphere>
          <Cylinder args={[0.02, 0.02, 0.5]} position={[0.5, 0.8, 0.5]}>
            <meshStandardMaterial color="#b45309" metalness={1} />
          </Cylinder>
          <Cylinder args={[0.02, 0.02, 0.5]} position={[-0.5, 0.8, -0.5]}>
            <meshStandardMaterial color="#b45309" metalness={1} />
          </Cylinder>
        </>
      )}

      <Text position={[0, -0.3, 0]} fontSize={0.3} color="white" anchorX="center">
        {label}
      </Text>
    </group>
  );
}

function GameScene({
  trashItems,
  gameStage,
  gameLevel,
  onTrashSorted,
}: {
  trashItems: TrashItemState[];
  gameStage: GameStage;
  gameLevel: 1 | 2;
  onTrashSorted: (id: number, correct: boolean, type: TrashType) => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null!);
  const ambientRef = useRef<THREE.AmbientLight>(null!);

  useEffect(() => {
    if (!ambientRef.current) return;
    const target = gameStage === "cleaning" ? 0.5 : 2.0;
    // Animate light intensity
    const startTime = Date.now();
    const duration = 1000;
    const startIntensity = ambientRef.current.intensity;
    const animate = () => {
      if (!ambientRef.current) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      ambientRef.current.intensity =
        startIntensity + (target - startIntensity) * progress;
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [gameStage]);

  // --- CAMERA LOGIC FIX ---
  useEffect(() => {
    const isUpcyclingL1 = gameStage === "upcycling" && gameLevel === 1;
    const isCleaningL2 = gameStage === "cleaning" && gameLevel === 2;
    const isUpcyclingL2 = gameStage === "upcycling" && gameLevel === 2;

    let targetPos = new THREE.Vector3(0, 8, 15); // Default
    let targetLookAt = new THREE.Vector3(0, 0, 0); // Default

    if (isUpcyclingL1) {
      targetPos = new THREE.Vector3(0, 3, 8); // Zoom on bench
      targetLookAt = new THREE.Vector3(0, 1, 3);
    } else if (isCleaningL2) {
      targetPos = new THREE.Vector3(0, 8, 15); // Zoom back out for L2
      targetLookAt = new THREE.Vector3(0, 1, 3); // --- FIX: Keep looking at the bench
    } else if (isUpcyclingL2) {
      targetPos = new THREE.Vector3(0, 3, 5); // Zoom on L2 sculpture
      targetLookAt = new THREE.Vector3(0, 0.8, 0); // Look at new sculpture
    }

    const startTime = Date.now();
    const duration = 2000;
    const startPos = camera.position.clone();
    const startLookAt = controlsRef.current
      ? controlsRef.current.target.clone()
      : new THREE.Vector3(0, 0, 0);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos, targetPos, eased);
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(startLookAt, targetLookAt, eased);
        controlsRef.current.update();
      }
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [gameStage, gameLevel, camera]);

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
      <OrbitControls ref={controlsRef} />
      <Plane
        args={[20, 20]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          color={gameStage === "cleaning" ? "#556B2F" : "#7CFC00"}
        />
      </Plane>

      {/* Level 1 Bins */}
      {gameLevel === 1 && (
        <>
          <TrashBin
            position={BIN_POSITIONS_L1.plastic}
            type="plastic"
            color="#3b82f6"
          />
          <TrashBin
            position={BIN_POSITIONS_L1.metal}
            type="metal"
            color="#6b7280"
          />
          <TrashBin
            position={BIN_POSITIONS_L1.organic}
            type="organic"
            color="#16a34a"
          />
        </>
      )}

      {/* Level 2 Bins */}
      {gameLevel === 2 && (
        <>
          <TrashBin
            position={BIN_POSITIONS_L2.glass}
            type="glass"
            color="#67e8f9"
          />
          <TrashBin
            position={BIN_POSITIONS_L2.paper}
            type="paper"
            color="#ffffff"
          />
          <TrashBin
            position={BIN_POSITIONS_L2["e-waste"]}
            type="e-waste"
            color="#1f2937"
          />
        </>
      )}

      {/* Trash Items */}
      {trashItems.map((item) => (
        <TrashItem key={item.id} item={item} onSorted={onTrashSorted} />
      ))}

      {/* L1 Treasure (visible on L1 upcycle AND all of L2) */}
      {(gameStage === 'upcycling' && gameLevel === 1) || gameLevel === 2 ? (
        <UpcycledItem
          key={L1_TREASURE.id}
          type={L1_TREASURE.id}
          position={L1_TREASURE.position}
          label={L1_TREASURE.label}
        />
      ) : null}

      {/* L2 Treasure (visible on L2 upcycling) */}
      {gameStage === "upcycling" && gameLevel === 2 && (
        <UpcycledItem
          key={L2_TREASURE.id}
          type={L2_TREASURE.id}
          position={L2_TREASURE.position}
          label={L2_TREASURE.label}
        />
      )}
    </>
  );
}

// --- UI Components ---

function GameStatusUI({
  level,
  status,
}: {
  level: 1 | 2;
  status: SortedStatusL1 | SortedStatusL2;
}) {
  const Checkbox = ({
    label,
    checked,
  }: {
    label: string;
    checked: boolean;
  }) => (
    <div className="flex items-center space-x-2">
      <div
        className={`w-5 h-5 rounded border-2 ${
          checked
            ? "bg-green-500 border-green-500"
            : "bg-gray-600 border-gray-400"
        }`}
      >
        {checked && <span className="text-white text-sm pl-0.5">✔</span>}
      </div>
      <span className={checked ? "text-green-400" : "text-gray-300"}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="absolute top-4 left-4 w-64 bg-gray-800 bg-opacity-70 p-3 rounded-lg text-white shadow-lg z-10">
      <h3 className="text-lg font-bold mb-2">Level {level} Status</h3>
      {level === 1 && (
        <div className="space-y-1">
          <Checkbox
            label="O(n^2) Sorter"
            checked={(status as SortedStatusL1).nestedLoop}
          />
          <Checkbox
            label="O(n) Sorter (Organic)"
            checked={(status as SortedStatusL1).singleLoopOrganic}
          />
          <Checkbox
            label="O(n) Sorter (Plastic)"
            checked={(status as SortedStatusL1).singleLoopPlastic}
          />
        </div>
      )}
      {level === 2 && (
        <div className="space-y-1">
          <Checkbox
            label="Glass Sorter (O(n))"
            checked={(status as SortedStatusL2).loopGlass}
          />
          <Checkbox
            label="Paper Sorter (O(n))"
            checked={(status as SortedStatusL2).loopPaper}
          />
          <Checkbox
            label="E-Waste Sorter (O(n))"
            checked={(status as SortedStatusL2).loopEwaste}
          />
        </div>
      )}
    </div>
  );
}

function CodeEditorUI({
  code,
  setCode,
  onRunAlgorithm,
  level,
}: {
  code: string;
  setCode: (code: string) => void;
  onRunAlgorithm: (type: AlgorithmType) => void;
  level: 1 | 2;
}) {
  return (
    <div className="absolute bottom-4 left-4 w-full max-w-lg bg-gray-900 bg-opacity-80 p-4 rounded-lg shadow-lg text-white z-10">
      <h4 className="text-md font-semibold mb-2">Level {level} Algorithms</h4>
      <CodeEditor
        value={code}
        language="js"
        placeholder="Enter sorting logic"
        onChange={(e: any) => setCode(e.target.value)}
        padding={15}
        style={{
          fontSize: 14,
          backgroundColor: "#1f2937",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          borderRadius: "8px",
          minHeight: "250px",
          maxHeight: "30vh",
          overflow: "auto",
        }}
      />
      {/* Level 1 Buttons */}
      {level === 1 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            onClick={() => onRunAlgorithm("nestedLoop")}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Run O(n²) Sorter
          </button>
          <button
            onClick={() => onRunAlgorithm("singleLoopOrganic")}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Run O(n) Sorter (Org)
          </button>
          <button
            onClick={() => onRunAlgorithm("singleLoopPlastic")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Run O(n) Sorter (Pla)
          </button>
        </div>
      )}
      {/* Level 2 Buttons */}
      {level === 2 && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            onClick={() => onRunAlgorithm("loopGlass")}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Run Glass Sorter
          </button>
          <button
            onClick={() => onRunAlgorithm("loopPaper")}
            className="bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded transition-colors"
          >
            Run Paper Sorter
          </button>
          <button
            onClick={() => onRunAlgorithm("loopEwaste")}
            className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Run E-Waste Sorter
          </button>
        </div>
      )}
    </div>
  );
}

function BuildButtonUI({ onClick, level }: { onClick: () => void; level: 1 | 2 }) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
      <button
        onClick={onClick}
        className="animate-pulse bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-lg shadow-xl text-xl transition-all"
      >
        {level === 1
          ? "✨ Build Smart Bench! ✨"
          : "✨ Build Tech Sculpture! ✨"}
      </button>
    </div>
  );
}

function WinScreen() {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="text-center p-10 bg-white rounded-lg shadow-xl">
        <h1 className="text-5xl font-bold text-green-600 mb-4">You Win!</h1>
        <p className="text-2xl text-gray-800">
          All levels complete! You built a Smart Bench & a Tech Sculpture!
        </p>
        <p className="text-lg text-gray-600 mt-2">
          Waste Hack Complete: Trash to Treasure!
        </p>
      </div>
    </div>
  );
}

// --- Main Page Component ---
const L1_TRASH_COUNT = 20;
const L2_TRASH_COUNT = 30;

export default function HomePage() {
  const [gameLevel, setGameLevel] = useState<1 | 2>(1);
  const [trashItems, setTrashItems] = useState(() =>
    createTrash(L1_TRASH_COUNT, TRASH_TYPES_L1)
  );
  const [code, setCode] = useState(LEVEL_1_CODE);
  const [gameStage, setGameStage] = useState<GameStage>("cleaning");
  const [l1SortedStatus, setL1SortedStatus] = useState<SortedStatusL1>({
    nestedLoop: false,
    singleLoopOrganic: false,
    singleLoopPlastic: false,
  });
  const [l2SortedStatus, setL2SortedStatus] = useState<SortedStatusL2>({
    loopGlass: false,
    loopPaper: false,
    loopEwaste: false,
  });

  useEffect(() => {
    // Level 2 Treasure animation
    if (gameStage === "upcycling" && gameLevel === 2) {
      const timer = setTimeout(() => {
        setGameStage("win");
      }, 4000); // Show L2 treasure for 4s
      return () => clearTimeout(timer);
    }
    // Level 1 Treasure animation -> Transition to Level 2
    if (gameStage === "upcycling" && gameLevel === 1) {
      const timer = setTimeout(() => {
        setGameLevel(2);
        setGameStage("cleaning");
        setCode(LEVEL_2_CODE);
        // Clear L1 trash and add L2 trash
        setTrashItems(createTrash(L2_TRASH_COUNT, TRASH_TYPES_L2));
      }, 4000); // Show L1 treasure for 4s
      return () => clearTimeout(timer);
    }
  }, [gameStage, gameLevel]);

  const handleTrashSorted = useCallback(
    (id: number, isCorrect: boolean, type: TrashType) => {
      setTrashItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "sorted" } : item
        )
      );
    },
    []
  );

  /**
   * --- THIS IS THE FINAL, WORKING PARSER ---
   * I am so sorry this took so long.
   */
  const handleRunAlgorithm = useCallback(
    (algoType: AlgorithmType) => {
      if (gameStage !== "cleaning") return;

      let trashTypeToSort: TrashType | null = null;
      let functionName = "";
      let failureMessage = "Algorithm check failed. Please try again.";
      let isAlgorithmCorrect = false;
      let cleanBody = ""; // --- DEFINE cleanBody in the outer scope ---

      // --- Parser for Level 1 ---
      if (gameLevel === 1) {
        functionName = {
          nestedLoop: "sortMetal_On2",
          singleLoopOrganic: "sortOrganic_On",
          singleLoopPlastic: "sortPlastic_On",
        }[algoType as AlgorithmTypeL1];
        
        trashTypeToSort = {
          nestedLoop: "metal",
          singleLoopOrganic: "organic",
          singleLoopPlastic: "plastic",
        }[algoType as AlgorithmTypeL1] as TrashType;

        const functionBody = getFunctionBody(code, functionName);
        if (!functionBody) {
          alert(`Algorithm Failed: Could not find the function "${functionName}".`);
          return;
        }
        cleanBody = functionBody // Assign to outer scope
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "")
          .replace(/\s+/g, "");

        switch (algoType) {
          case "nestedLoop": {
            const hasNestedLoop = /for.*\{.*for.*\{/i.test(cleanBody);
            const checksMetal = /if\(.*?["']metal["']\)/i.test(cleanBody);
            const callsMetalBin = /sendTo\(metal_bin\)/i.test(cleanBody);
            if (hasNestedLoop && checksMetal && callsMetalBin) isAlgorithmCorrect = true;
            else if (!hasNestedLoop) failureMessage = `Algorithm Failed: The O(n^2) sorter ("${functionName}") must use a NESTED LOOP.`;
            else failureMessage = `Algorithm Failed: Make sure your logic in "${functionName}" checks for "metal" AND calls sendTo(metal_bin).`;
            break;
          }
          case "singleLoopOrganic": {
            const hasSingleLoop = /for.*\{/i.test(cleanBody);
            const hasNoNestedLoop = !/for.*\{.*for.*\{/i.test(cleanBody);
            const checksOrganic = /if\(.*?["']organic["']\)/i.test(cleanBody);
            const callsOrganicBin = /sendTo\(organic_bin\)/i.test(cleanBody);
            if (hasSingleLoop && hasNoNestedLoop && checksOrganic && callsOrganicBin) isAlgorithmCorrect = true;
            else if (!hasSingleLoop) failureMessage = `Algorithm Failed: The O(n) sorter ("${functionName}") must use a SINGLE 'for' loop.`;
            else if (!hasNoNestedLoop) failureMessage = `Algorithm Failed: The O(n) sorter ("${functionName}") cannot have a nested loop!`;
            else failureMessage = `Algorithm Failed: Make sure your logic in "${functionName}" checks for "organic" AND calls sendTo(organic_bin).`;
            break;
          }
          case "singleLoopPlastic": {
            const hasSingleLoop = /for.*\{/i.test(cleanBody);
            const hasNoNestedLoop = !/for.*\{.*for.*\{/i.test(cleanBody);
            const checksPlastic = /if\(.*?["']plastic["']\)/i.test(cleanBody);
            const callsPlasticBin = /sendTo\(plastic_bin\)/i.test(cleanBody);
            if (hasSingleLoop && hasNoNestedLoop && checksPlastic && callsPlasticBin) isAlgorithmCorrect = true;
            else if (!hasSingleLoop) failureMessage = `Algorithm Failed: The O(n) sorter ("${functionName}") must use a SINGLE 'for' loop.`;
            else if (!hasNoNestedLoop) failureMessage = `Algorithm Failed: The O(n) sorter ("${functionName}") cannot have a nested loop!`;
            else failureMessage = `Algorithm Failed: Make sure your logic in "${functionName}" sorts "plastic" AND calls sendTo(plastic_bin).`;
            break;
          }
        }
      
      // --- Parser for Level 2 ---
      } else if (gameLevel === 2) {
         functionName = {
          loopGlass: "sortGlass",
          loopPaper: "sortPaper",
          loopEwaste: "sortEwaste",
        }[algoType as AlgorithmTypeL2];
        
        trashTypeToSort = {
          loopGlass: "glass",
          loopPaper: "paper",
          loopEwaste: "e-waste",
        }[algoType as AlgorithmTypeL2] as TrashType;

        const functionBody = getFunctionBody(code, functionName);
        if (!functionBody) {
          alert(`Algorithm Failed: Could not find the function "${functionName}".`);
          return;
        }
        
        // --- THIS WAS THE MISSING LINE ---
        cleanBody = functionBody
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "") // remove comments
          .replace(/\s+/g, ""); // remove all whitespace

        // All L2 are simple O(n) checks
        const hasSingleLoop = /for.*\{/i.test(cleanBody);
        const hasNoNestedLoop = !/for.*\{.*for.*\{/i.test(cleanBody);
        
        // --- THIS IS THE FIX ---
        // The bin name in the code (e.g., "e-waste_bin") must be checked
        // without replacing the dash.
        const binName = `${trashTypeToSort}_bin`;
        const checksType = new RegExp(`if\\(.*?["']${trashTypeToSort}["']\\)`, "i").test(cleanBody);
        const callsBin = new RegExp(`sendTo\\(${binName}\\)`, "i").test(cleanBody);

        if (hasSingleLoop && hasNoNestedLoop && checksType && callsBin) {
          isAlgorithmCorrect = true;
        } else if (!hasSingleLoop) {
          failureMessage = `Algorithm Failed: The sorter ("${functionName}") must use a SINGLE 'for' loop.`;
        } else if (!hasNoNestedLoop) {
          failureMessage = `Algorithm Failed: The sorter ("${functionName}") cannot have a nested loop!`;
        } else {
          // --- FIX THE FAILURE MESSAGE TOO ---
          failureMessage = `Algorithm Failed: Make sure your logic in "${functionName}" sorts "${trashTypeToSort}" AND calls sendTo(${binName}).`;
        }
      }

      // 5. If correct, run the simulation
      if (isAlgorithmCorrect) {
        if (gameLevel === 1) {
          setL1SortedStatus((prev) => ({ ...prev, [algoType]: true }));
        } else {
          setL2SortedStatus((prev) => ({ ...prev, [algoType]: true }));
        }

        const type = trashTypeToSort;
        const targetBinPos = (
          gameLevel === 1 
            ? BIN_POSITIONS_L1[type as TrashTypeL1] 
            : BIN_POSITIONS_L2[type as TrashTypeL2]
        );

        setTrashItems((prev) =>
          prev.map((item) => {
            if (item.type === type && item.status === "idle") {
              return {
                ...item,
                status: "sorting",
                targetPosition: targetBinPos,
              };
            }
            return item;
          })
        );
      } else {
        // Log the cleaned code to the console to help debug
        console.log("=== PARSER DEBUG FAILED ===");
        console.log("Function:", functionName);
        console.log("Cleaned Code:", cleanBody); // This will now work
        console.log("Failure Message:", failureMessage);
        alert(failureMessage);
      }
    },
    [code, gameStage, gameLevel]
  );

  const handleBuildTreasure = () => {
    if (gameStage === "cleaning") {
      setGameStage("upcycling");
    }
  };

  const allL1Sorted =
    l1SortedStatus.nestedLoop &&
    l1SortedStatus.singleLoopOrganic &&
    l1SortedStatus.singleLoopPlastic;

  const allL2Sorted =
    l2SortedStatus.loopGlass &&
    l2SortedStatus.loopPaper &&
    l2SortedStatus.loopEwaste;

  return (
    <div className="relative h-screen w-screen bg-gray-900">
      <GameStatusUI
        level={gameLevel}
        status={gameLevel === 1 ? l1SortedStatus : l2SortedStatus}
      />

      {gameStage === "cleaning" &&
        ((gameLevel === 1 && !allL1Sorted) ||
          (gameLevel === 2 && !allL2Sorted)) && (
          <CodeEditorUI
            code={code}
            setCode={setCode}
            onRunAlgorithm={handleRunAlgorithm}
            level={gameLevel}
          />
        )}

      {gameStage === "cleaning" &&
        ((gameLevel === 1 && allL1Sorted) ||
          (gameLevel === 2 && allL2Sorted)) && (
          <BuildButtonUI onClick={handleBuildTreasure} level={gameLevel} />
        )}

      {gameStage === "win" && <WinScreen />}

      <Canvas shadows camera={{ position: [0, 8, 15], fov: 60 }}>
        <Suspense fallback={null}>
          <GameScene
            trashItems={trashItems}
            gameStage={gameStage}
            gameLevel={gameLevel}
            onTrashSorted={handleTrashSorted}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}