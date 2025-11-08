"use client";

// ------------------------------------------------------------------
// Eco City Tycoon - More Events Edition
// ------------------------------------------------------------------

import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  Sky,
  Box,
  Cylinder,
  Plane,
  Sphere,
  Points,
  PointMaterial,
  TorusKnot,
  Cloud,
  Cone,
} from '@react-three/drei';
import { gsap } from 'gsap';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

// ------------------------------------------------------------------
// 1. TYPES & INTERFACES
// (Same as before)
// ------------------------------------------------------------------

type StatName = 'economy' | 'environment' | 'happiness';
type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

interface GameStats {
  economy: number;
  environment: number;
  happiness: number;
}

type VisualItem =
  | 'tree'
  | 'factory'
  | 'house'
  | 'apartment'
  | 'skyscraper'
  | 'solarpanel'
  | 'park'
  | 'office';

type VisualEffect =
  | { action: 'add'; item: VisualItem; count: number }
  | { action: 'remove'; item: VisualItem; count: number };

interface ChoiceEffects {
  stats: { [key in StatName]?: number };
  visual: VisualEffect[];
}

interface IChoice {
  text: string;
  effects: ChoiceEffects;
}

interface IGameEvent {
  id: string;
  season: Season[];
  title: string;
  description: string;
  choices: [IChoice, IChoice];
}

type GameState = 'playing' | 'event' | 'won' | 'transitioning';

// Props for our dynamic 3D objects
interface BuildingProps {
  id: string;
  position: [number, number, number];
  color?: string;
}
type TreeProps = BuildingProps;
type FactoryProps = BuildingProps;
type HouseProps = BuildingProps;
type ApartmentProps = BuildingProps;
type SkyscraperProps = BuildingProps;
type SolarPanelProps = BuildingProps;
type ParkProps = BuildingProps;
type OfficeProps = BuildingProps;


// ------------------------------------------------------------------
// 2. GAME DATA (*** UPDATED WITH MORE EVENTS ***)
// ------------------------------------------------------------------

const gameEvents: IGameEvent[] = [
  // --- EVENT 1 ---
  {
    id: 'spring_planting',
    season: ['Spring'],
    title: '🌸 Spring Planting Festival',
    description: 'Citizens want to plant new trees. Where should they go?',
    choices: [
      {
        text: 'Create a new park',
        effects: {
          stats: { economy: -5, environment: +15, happiness: +15 },
          visual: [{ action: 'add', item: 'park', count: 1 }],
        },
      },
      {
        text: 'Sell land for housing',
        effects: {
          stats: { economy: +15, environment: -10, happiness: -5 },
          visual: [{ action: 'add', item: 'apartment', count: 2 }],
        },
      },
    ],
  },
  // --- EVENT 2 ---
  {
    id: 'summer_heatwave',
    season: ['Summer'],
    title: '☀️ Summer Heatwave',
    description: 'A massive heatwave is straining our power grid.',
    choices: [
      {
        text: 'Invest in solar farms',
        effects: {
          stats: { economy: -20, environment: +15, happiness: +5 },
          visual: [
            { action: 'remove', item: 'factory', count: 1 },
            { action: 'add', item: 'solarpanel', count: 5 },
          ],
        },
      },
      {
        text: 'Build new coal plant',
        effects: {
          stats: { economy: +20, environment: -30, happiness: -10 },
          visual: [{ action: 'add', item: 'factory', count: 2 }],
        },
      },
    ],
  },
  // --- EVENT 3 ---
  {
    id: 'housing_crisis',
    season: ['Summer', 'Autumn'],
    title: '🏘️ Housing Crisis',
    description: 'Housing prices are soaring. We need more high-density options.',
    choices: [
      {
        text: 'Build apartment blocks',
        effects: {
          stats: { economy: -15, happiness: +20 },
          visual: [{ action: 'add', item: 'apartment', count: 3 }],
        },
      },
      {
        text: 'Approve new office towers',
        effects: {
          stats: { economy: +30, happiness: -15, environment: -5 },
          visual: [{ action: 'add', item: 'office', count: 2 }],
        },
      },
    ],
  },
  // --- EVENT 4 ---
  {
    id: 'corporate_boom',
    season: ['Winter', 'Spring'],
    title: '📈 Corporate Boom',
    description: 'A major tech company wants to build its HQ in our Village.',
    choices: [
      {
        text: 'Welcome them!',
        effects: {
          stats: { economy: +40, environment: -10, happiness: +5 },
          visual: [{ action: 'add', item: 'skyscraper', count: 2 }],
        },
      },
      {
        text: 'Demand green space',
        effects: {
          stats: { economy: +15, environment: +20, happiness: +10 },
          visual: [
            { action: 'add', item: 'office', count: 1 },
            { action: 'add', item: 'park', count: 1 },
          ],
        },
      },
    ],
  },
  // --- *** NEW EVENT 5 *** ---
  {
    id: 'transit_troubles',
    season: ['Spring', 'Autumn'],
    title: '🚌 Transit Troubles',
    description: 'Commute times are at an all-time high, and citizens are complaining about traffic. What should we do?',
    choices: [
      {
        text: 'Build a light-rail system',
        effects: {
          stats: { economy: -20, environment: +20, happiness: +15 },
          visual: [
            { action: 'remove', item: 'house', count: 3 },
            { action: 'add', item: 'park', count: 1 }, // Green transit corridor
          ],
        },
      },
      {
        text: 'Expand the highways',
        effects: {
          stats: { economy: +15, environment: -20, happiness: -10 },
          visual: [
            { action: 'remove', item: 'tree', count: 4 },
            { action: 'add', item: 'factory', count: 1 }, // Represents increased industry/smog
          ],
        },
      },
    ],
  },
  // --- *** NEW EVENT 6 *** ---
  {
    id: 'industrial_waste',
    season: ['Summer', 'Winter'],
    title: '🏭 Industrial Waste',
    description: 'The old factories are leaking pollutants into the ground. It\'s a PR nightmare!',
    choices: [
      {
        text: 'Force cleanup & modernization',
        effects: {
          stats: { economy: -15, environment: +30, happiness: +5 },
          visual: [
            { action: 'remove', item: 'factory', count: 2 },
            { action: 'add', item: 'office', count: 1 }, // Old industry out, new in
          ],
        },
      },
      {
        text: 'Offer tax breaks to ignore it',
        effects: {
          stats: { economy: +20, environment: -30, happiness: -20 },
          visual: [{ action: 'add', item: 'factory', count: 1 }],
        },
      },
    ],
  },
  // --- *** NEW EVENT 7 *** ---
  {
    id: 'arts_grant',
    season: ['Summer'],
    title: '🎭 Arts & Culture Grant',
    description: 'Local artists are proposing a large, public-funded cultural festival. Does it get the green light?',
    choices: [
      {
        text: 'Fund the festival!',
        effects: {
          stats: { economy: -10, environment: +5, happiness: +30 },
          visual: [{ action: 'add', item: 'park', count: 2 }], // New public spaces
        },
      },
      {
        text: 'Use funds for business grants',
        effects: {
          stats: { economy: +25, happiness: -15 },
          visual: [{ action: 'add', item: 'office', count: 1 }],
        },
      },
    ],
  },
];

// Helper to get a random position within a city grid
const getRandomPosition = (
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number
): [number, number, number] => {
  const x = Math.random() * (maxX - minX) + minX;
  const z = Math.random() * (maxZ - minZ) + minZ;
  return [x, 0, z];
};

// ------------------------------------------------------------------
// 3. 3D CITY COMPONENTS
// ------------------------------------------------------------------

// --- Tree Model ---
const Tree: React.FC<TreeProps & { season: Season }> = ({
  id,
  position,
  season,
}) => {
  const leafColor = useMemo(() => {
    switch (season) {
      case 'Spring': return '#98FB98';
      case 'Summer': return '#228B22';
      case 'Autumn': return '#FF8C00';
      case 'Winter': return '#ADD8E6';
      default: return '#228B22';
    }
  }, [season]);

  return (
    <group position={position}>
      <Cylinder args={[0.1, 0.1, 0.8]} position={[0, 0.4, 0]} castShadow>
        <meshStandardMaterial color="#8B4513" />
      </Cylinder>
      <Sphere args={[0.5]} position={[0, 1.2, 0]} castShadow>
        <meshStandardMaterial color={leafColor} />
      </Sphere>
    </group>
  );
};

// --- Factory Model ---
const Factory: React.FC<FactoryProps> = ({ id, position }) => {
  const smokeRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (smokeRef.current) {
      smokeRef.current.position.y += delta * 0.5;
      if (smokeRef.current.position.y > 5) smokeRef.current.position.y = 0;
    }
  });

  return (
    <group position={position}>
      <Box args={[2.5, 2, 2]} position={[0, 1, 0]} castShadow>
        <meshStandardMaterial color="#8B4513" />
      </Box>
      <Cylinder args={[0.3, 0.3, 3]} position={[1, 2.5, 0.5]} castShadow>
        <meshStandardMaterial color="#666666" />
      </Cylinder>
      <group ref={smokeRef} position={[1, 4, 0.5]}>
        <Sphere args={[0.5]} position={[0, 0, 0]}>
          <meshStandardMaterial color="grey" transparent opacity={0.6} />
        </Sphere>
      </group>
    </group>
  );
};

// --- House Model ---
const House: React.FC<HouseProps> = ({ id, position }) => {
  const baseColor = useMemo(() => {
    const colors = ['#87CEEB', '#FFD700', '#ADFF2F', '#F08080'];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  return (
    <group position={position}>
      <Box args={[1.5, 1.5, 1.5]} position={[0, 0.75, 0]} castShadow>
        <meshStandardMaterial color={baseColor} />
      </Box>
      <Cylinder args={[0, 1.2, 1, 4]} position={[0, 1.5 + 0.5 / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <meshStandardMaterial color="#A0522D" />
      </Cylinder>
    </group>
  );
};

// --- Apartment Model ---
const Apartment: React.FC<ApartmentProps> = ({ id, position }) => {
  return (
    <Box args={[3, 6, 3]} position={[0, 3, 0]} castShadow>
      <meshStandardMaterial color="#B0C4DE" />
    </Box>
  );
};

// --- Skyscraper Model ---
const Skyscraper: React.FC<SkyscraperProps> = ({ id, position }) => {
  return (
    <Box args={[4, 20, 4]} position={[0, 10, 0]} castShadow>
      <meshPhysicalMaterial
        color="#5A9"
        roughness={0.1}
        metalness={0.9}
        transmission={0.8}
        transparent
        thickness={0.5}
      />
    </Box>
  );
};

// --- SolarPanel Model ---
const SolarPanel: React.FC<SolarPanelProps> = ({ id, position }) => {
  return (
    <group position={position}>
      <Plane args={[1, 1]} rotation={[-Math.PI / 2 + 0.5, 0, 0]} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#000050" metalness={0.8} roughness={0.2} />
      </Plane>
      <Box args={[0.1, 1, 0.1]} position={[0, 0.25, 0.5]}>
        <meshStandardMaterial color="grey" />
      </Box>
    </group>
  );
};

// --- Park Model ---
const Park: React.FC<ParkProps> = ({ id, position }) => {
  const waterRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (waterRef.current) {
      waterRef.current.position.y = Math.sin(Date.now() * 0.01) * 0.1 + 0.5;
    }
  });

  return (
    <group position={position}>
      <Plane args={[3, 3]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#7CFC00" />
      </Plane>
      <Cylinder args={[0.5, 0.5, 0.2]} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color="grey" />
      </Cylinder>
      <Cone ref={waterRef} args={[0.1, 0.8]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.7} />
      </Cone>
    </group>
  );
};

// --- OfficeBuilding Model ---
const OfficeBuilding: React.FC<OfficeProps> = ({ id, position }) => {
  return (
    <Box args={[5, 12, 3]} position={[0, 6, 0]} castShadow>
      <meshStandardMaterial color="#EEEEEE" />
      <Box args={[4.5, 11, 2.5]} position={[0, 0, 0]}>
        <meshPhysicalMaterial
          color="#101040"
          roughness={0}
          metalness={0.5}
          transmission={0.1}
          transparent
        />
      </Box>
    </Box>
  );
};

// --- Weather Effects ---
const Weather: React.FC<{ season: Season }> = ({ season }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [particles, velocities] = useMemo(() => {
    const count = 1000;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const isRain = season === 'Spring' || season === 'Autumn';

    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 60;
      pos[i + 1] = Math.random() * 40;
      pos[i + 2] = (Math.random() - 0.5) * 60;
      vel[i] = 0;
      vel[i + 1] = isRain ? -Math.random() * 0.4 - 0.4 : -Math.random() * 0.08 - 0.03;
      vel[i + 2] = isRain ? 0 : (Math.random() - 0.5) * 0.05;
    }
    return [pos, vel];
  }, [season]);

  useFrame(() => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += velocities[i + 1];
        positions[i] += velocities[i + 2];
        if (positions[i + 1] < -5) positions[i + 1] = 40;
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (season === 'Summer') return null;
  return (
    <Points ref={pointsRef} positions={particles} stride={3}>
      <PointMaterial
        transparent
        color={season === 'Winter' ? '#ffffff' : '#ADD8E6'}
        size={season === 'Winter' ? 0.15 : 0.1}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
};

// --- Crazy Floating Orb ---
const CrazyOrb: React.FC = () => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 2 + 15;
      ref.current.rotation.y = clock.elapsedTime * 0.5;
      ref.current.rotation.x = clock.elapsedTime * 0.3;
    }
  });

  return (
    <TorusKnot ref={ref} args={[1, 0.3, 100, 16]} position={[0, 15, 0]}>
      <meshPhysicalMaterial
        color="#8A2BE2"
        roughness={0}
        metalness={0.8}
        transmission={0.9}
        ior={1.5}
        thickness={0.1}
      />
    </TorusKnot>
  );
};

// --- Reduced and Thinned Clouds ---
const FloatingClouds: React.FC = () => {
  const cloudData = useMemo(() => {
    return Array(5).fill(0).map((_, i) => ({
      id: i,
      position: [(Math.random() - 0.5) * 80, Math.random() * 5 + 30, (Math.random() - 0.5) * 80] as [number, number, number],
      speed: Math.random() * 0.1 + 0.05,
      opacity: Math.random() * 0.1 + 0.1,
      scale: Math.random() * 3 + 2,
    }));
  }, []);

  return (
    <group>
      {cloudData.map(cloud => (
        <DriftingCloud key={cloud.id} {...cloud} />
      ))}
    </group>
  );
};

const DriftingCloud: React.FC<any> = ({ position, speed, opacity, scale }) => {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.position.x += speed * delta;
      if (ref.current.position.x > 80) ref.current.position.x = -80;
    }
  });

  return (
    <group ref={ref} position={position}>
      <Cloud scale={scale} segments={10} volume={1} color="white" opacity={opacity} speed={0} />
    </group>
  );
};


// ------------------------------------------------------------------
// 3.5. MOUNTAIN COMPONENTS
// ------------------------------------------------------------------

const Mountain: React.FC<{
  position: [number, number, number];
  height: number;
  base: number;
  season: Season;
}> = ({ position, height, base, season }) => {
  
  const mainColor = useMemo(() => {
    if (season === 'Winter') return '#A9A9A9';
    if (season === 'Autumn') return '#A0522D';
    return '#8B4513';
  }, [season]);

  const snowHeight = height * 0.4;
  const snowBase = base * 0.4;

  return (
    <group position={position}>
      <Cone args={[base, height, 16]} position={[0, height / 2, 0]} castShadow>
        <meshStandardMaterial color={mainColor} />
      </Cone>
      {season === 'Winter' && (
        <Cone args={[snowBase, snowHeight, 16]} position={[0, height - snowHeight / 2, 0]} castShadow>
          <meshStandardMaterial color="#FFFFFF" />
        </Cone>
      )}
    </group>
  );
};

const MountainRange: React.FC<{ season: Season }> = ({ season }) => {
  const mountains = useMemo(() => {
    const data = [];
    const count = 40;
    const minRadius = 60; // Pushed mountains back
    const maxRadius = 90; // Pushed mountains back
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * (maxRadius - minRadius) + minRadius;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const height = Math.random() * 25 + 15;
      const base = Math.random() * 10 + 8;
      
      data.push({ id: `m${i}`, position: [x, 0, z], height, base });
    }
    return data;
  }, []);

  return (
    <group>
      {mountains.map(mtn => (
        <Mountain key={mtn.id} {...mtn} season={season} />
      ))}
    </group>
  );
};


// ------------------------------------------------------------------
// 4. UI COMPONENTS (HTML OVERLAY)
// ------------------------------------------------------------------

interface StatsUIProps {
  stats: GameStats;
  refs: {
    eco: React.RefObject<HTMLDivElement>;
    env: React.RefObject<HTMLDivElement>;
    hap: React.RefObject<HTMLDivElement>;
  };
  season: Season;
}

const StatsUI: React.FC<StatsUIProps> = ({ stats, refs, season }) => (
  <div style={styles.statsContainer}>
    <div style={styles.seasonDisplay}>
      {season === 'Spring' && '🌸'}
      {season === 'Summer' && '☀️'}
      {season === 'Autumn' && '🍂'}
      {season === 'Winter' && '❄️'}
      {` ${season}`}
    </div>
    <div style={styles.statBar}>
      <span style={styles.statLabel}>💵 Economy</span>
      <div style={styles.statBarOuter}>
        <div ref={refs.eco} style={{ ...styles.statBarInner, backgroundColor: '#f39c12' }} />
      </div>
      <span style={styles.statValue}>{stats.economy}</span>
    </div>
    <div style={styles.statBar}>
      <span style={styles.statLabel}>🌳 Environment</span>
      <div style={styles.statBarOuter}>
        <div ref={refs.env} style={{ ...styles.statBarInner, backgroundColor: '#2ecc71' }} />
      </div>
      <span style={styles.statValue}>{stats.environment}</span>
    </div>
    <div style={styles.statBar}>
      <span style={styles.statLabel}>😊 Happiness</span>
      <div style={styles.statBarOuter}>
        <div ref={refs.hap} style={{ ...styles.statBarInner, backgroundColor: '#e74c3c' }} />
      </div>
      <span style={styles.statValue}>{stats.happiness}</span>
    </div>
  </div>
);

// --- Event Modal (Glassy Panel) ---
interface EventModalProps {
  event: IGameEvent;
  onChoice: (choice: IChoice) => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onChoice }) => (
  <div style={styles.modalOverlay}>
    <div style={styles.modalContent}>
      <h2 style={styles.modalTitle}>{event.title}</h2>
      <p style={styles.modalDescription}>{event.description}</p>
      <div style={styles.modalButtons}>
        <button
          style={{ ...styles.modalButton, ...styles.buttonA }}
          onClick={() => onChoice(event.choices[0])}
        >
          {event.choices[0].text}
        </button>
        <button
          style={{ ...styles.modalButton, ...styles.buttonB }}
          onClick={() => onChoice(event.choices[1])}
        >
          {event.choices[1].text}
        </button>
      </div>
    </div>
  </div>
);

// --- *** UPDATED WIN SCREEN TEXT *** ---
const WinScreen: React.FC<{ onRestart: () => void }> = ({ onRestart }) => (
  <div style={styles.modalOverlay}>
    <div style={styles.modalContent}>
      <h2 style={styles.modalTitle}>🎉 Level Passed! 🎉</h2>
      <p style={styles.modalDescription}>
        You saved the cityyy!
      </p>
      <p style={styles.modalDescription}>
        You successfully balanced the Economy, Environment, and Happiness.
        You've created a perfect utopia!
      </p>
      <button
        style={{ ...styles.modalButton, ...styles.buttonA }}
        onClick={onRestart}
      >
        Play Again
      </button>
    </div>
  </div>
);


// ------------------------------------------------------------------
// 5. MAIN APP COMPONENT
// ------------------------------------------------------------------

const MAX_STAT = 100;
const MIN_STAT = 0;
const INITIAL_STATS: GameStats = {
  economy: 50,
  environment: 50,
  happiness: 50,
};
const SEASONS: Season[] = ['Spring', 'Summer', 'Autumn', 'Winter'];

// Initial city layout
const INITIAL_CITY_RADIUS = 40;
const INITIAL_TREES: TreeProps[] = Array(50)
  .fill(0)
  .map((_, i) => ({ id: `t${i}`, position: getRandomPosition(-INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS, -INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS) }));
const INITIAL_FACTORIES: FactoryProps[] = Array(5)
  .fill(0)
  .map((_, i) => ({ id: `f${i}`, position: getRandomPosition(-INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS, -INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS) }));
const INITIAL_HOUSES: HouseProps[] = Array(40)
  .fill(0)
  .map((_, i) => ({ id: `h${i}`, position: getRandomPosition(-INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS, -INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS) }));
const INITIAL_APARTMENTS: ApartmentProps[] = Array(20)
  .fill(0)
  .map((_, i) => ({ id: `a${i}`, position: getRandomPosition(-INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS, -INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS) }));
const INITIAL_SKYSCRAPERS: SkyscraperProps[] = Array(8)
  .fill(0)
  .map((_, i) => ({ id: `s${i}`, position: getRandomPosition(-INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS, -INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS) }));
const INITIAL_SOLARPANELS: SolarPanelProps[] = Array(10)
  .fill(0)
  .map((_, i) => ({ id: `sp${i}`, position: getRandomPosition(-INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS, -INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS) }));
const INITIAL_PARKS: ParkProps[] = Array(5)
  .fill(0)
  .map((_, i) => ({ id: `p${i}`, position: getRandomPosition(-INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS, -INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS) }));
const INITIAL_OFFICES: OfficeProps[] = Array(12)
  .fill(0)
  .map((_, i) => ({ id: `o${i}`, position: getRandomPosition(-INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS, -INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS) }));


const App: React.FC = () => {
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [gameState, setGameState] = useState<GameState>('transitioning');
  const [currentEvent, setCurrentEvent] = useState<IGameEvent | null>(null);
  const [season, setSeason] = useState<Season>('Spring');

  // State for our 3D objects
  const [trees, setTrees] = useState<TreeProps[]>(INITIAL_TREES);
  const [factories, setFactories] = useState<FactoryProps[]>(INITIAL_FACTORIES);
  const [houses, setHouses] = useState<HouseProps[]>(INITIAL_HOUSES);
  const [apartments, setApartments] = useState<ApartmentProps[]>(INITIAL_APARTMENTS);
  const [skyscrapers, setSkyscrapers] = useState<SkyscraperProps[]>(INITIAL_SKYSCRAPERS);
  const [solarPanels, setSolarPanels] = useState<SolarPanelProps[]>(INITIAL_SOLARPANELS);
  const [parks, setParks] = useState<ParkProps[]>(INITIAL_PARKS);
  const [offices, setOffices] = useState<OfficeProps[]>(INITIAL_OFFICES);

  // Refs for GSAP animation
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const ecoBarRef = useRef<HTMLDivElement>(null);
  const envBarRef = useRef<HTMLDivElement>(null);
  const hapBarRef = useRef<HTMLDivElement>(null);
  const groundRef = useRef<THREE.Mesh>(null);

  // Function to get the next season
  const getNextSeason = (current: Season): Season => {
    const currentIndex = SEASONS.indexOf(current);
    return SEASONS[(currentIndex + 1) % SEASONS.length];
  };

  // Function to show the next event
  const showNextEvent = (nextSeason: Season) => {
    const availableEvents = gameEvents.filter((e) =>
      e.season.includes(nextSeason)
    );
    const randomEvent =
      availableEvents[Math.floor(Math.random() * availableEvents.length)];

    setCurrentEvent(randomEvent);
    setGameState('event');
  };

  // Game loop trigger: 1. Start game
  useEffect(() => {
    const timer = setTimeout(() => {
      showNextEvent(season);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Game loop trigger: 2. Animate stats and check for win
  useEffect(() => {
    gsap.to(ecoBarRef.current, { width: `${stats.economy}%`, duration: 0.5 });
    gsap.to(envBarRef.current, { width: `${stats.environment}%`, duration: 0.5 });
    gsap.to(hapBarRef.current, { width: `${stats.happiness}%`, duration: 0.5 });

    if (
      stats.economy >= MAX_STAT &&
      stats.environment >= MAX_STAT &&
      stats.happiness >= MAX_STAT &&
      gameState === 'playing' // Only trigger win from 'playing' state
    ) {
      setGameState('won');
    }
  }, [stats, gameState]); // Added gameState dependency

  // Game loop trigger: 3. Animate season change
  useEffect(() => {
    if (groundRef.current) {
      let targetColor: string;
      switch (season) {
        case 'Spring': targetColor = '#3E8635'; break;
        case 'Summer': targetColor = '#55A630'; break;
        case 'Autumn': targetColor = '#B87333'; break;
        case 'Winter': targetColor = '#F0F8FF'; break;
      }
      gsap.to((groundRef.current.material as THREE.MeshStandardMaterial).color, {
        r: new THREE.Color(targetColor).r,
        g: new THREE.Color(targetColor).g,
        b: new THREE.Color(targetColor).b,
        duration: 2.0,
      });
    }
  }, [season]);

  // Game loop trigger: 4. Handle user's choice
  const handleChoice = (choice: IChoice) => {
    // 1. Update Stats
    setStats((prevStats) => {
      const clamp = (val: number) => Math.max(MIN_STAT, Math.min(MAX_STAT, val));
      return {
        economy: clamp(prevStats.economy + (choice.effects.stats.economy || 0)),
        environment: clamp(prevStats.environment + (choice.effects.stats.environment || 0)),
        happiness: clamp(prevStats.happiness + (choice.effects.stats.happiness || 0)),
      };
    });

    // 2. Update Visuals
    choice.effects.visual.forEach((visual) => {
      const newItems = Array(visual.count).fill(0).map(() => ({
        id: `${visual.item}_${Math.random()}`,
        position: getRandomPosition(-INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS, -INITIAL_CITY_RADIUS, INITIAL_CITY_RADIUS),
      }));

      if (visual.action === 'add') {
        if (visual.item === 'tree') setTrees((prev) => [...prev, ...newItems]);
        else if (visual.item === 'factory') setFactories((prev) => [...prev, ...newItems]);
        else if (visual.item === 'house') setHouses((prev) => [...prev, ...newItems]);
        else if (visual.item === 'apartment') setApartments((prev) => [...prev, ...newItems]);
        else if (visual.item === 'skyscraper') setSkyscrapers((prev) => [...prev, ...newItems]);
        else if (visual.item === 'solarpanel') setSolarPanels((prev) => [...prev, ...newItems]);
        else if (visual.item === 'park') setParks((prev) => [...prev, ...newItems]);
        else if (visual.item === 'office') setOffices((prev) => [...prev, ...newItems]);
      } else if (visual.action === 'remove') {
        const count = visual.count;
        if (visual.item === 'tree') setTrees((prev) => prev.slice(0, Math.max(0, prev.length - count)));
        else if (visual.item === 'factory') setFactories((prev) => prev.slice(0, Math.max(0, prev.length - count)));
        else if (visual.item === 'house') setHouses((prev) => prev.slice(0, Math.max(0, prev.length - count)));
        else if (visual.item === 'apartment') setApartments((prev) => prev.slice(0, Math.max(0, prev.length - count)));
        else if (visual.item === 'skyscraper') setSkyscrapers((prev) => prev.slice(0, Math.max(0, prev.length - count)));
        else if (visual.item === 'solarpanel') setSolarPanels((prev) => prev.slice(0, Math.max(0, prev.length - count)));
        else if (visual.item === 'park') setParks((prev) => prev.slice(0, Math.max(0, prev.length - count)));
        else if (visual.item === 'office') setOffices((prev) => prev.slice(0, Math.max(0, prev.length - count)));
      }
    });

    // 3. Hide modal, enter transition state
    setCurrentEvent(null);
    setGameState('transitioning');

    // 4. --- *** UPDATED ORBITAL CAMERA TRANSITION *** ---
    const controls = controlsRef.current;
    if (controls) {
      // Pick a random spot in the city center to look at
      const newTarget = new THREE.Vector3(
          (Math.random() - 0.5) * INITIAL_CITY_RADIUS * 0.5,
          0,
          (Math.random() - 0.5) * INITIAL_CITY_RADIUS * 0.5
      );
      
      // Pick a random angle, distance, and height
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = Math.random() * 40 + 50; // 50 to 90 units away
      const randomHeight = Math.random() * 15 + 25; // 25 to 40 units high
      
      // Calculate new position based on angle and distance
      const newCamPos = new THREE.Vector3(
          newTarget.x + Math.cos(randomAngle) * randomDistance,
          randomHeight,
          newTarget.z + Math.sin(randomAngle) * randomDistance
      );

      // Animate camera target
      gsap.to(controls.target, {
          x: newTarget.x, y: newTarget.y, z: newTarget.z,
          duration: 5.5, ease: "power2.inOut"
      });
      // Animate camera position
      gsap.to(controls.object.position, {
          x: newCamPos.x, y: newCamPos.y, z: newCamPos.z,
          duration: 5.5, ease: "power2.inOut",
          onUpdate: () => controls.update()
      });
    }

    // 5. Wait for transition, then show next event
    setTimeout(() => {
      const nextSeason = getNextSeason(season);
      setSeason(nextSeason);
      
      // Check for win *after* stats have updated but *before* next event
      // We read the stats directly from the state as it will be after the update
      setStats(currentStats => {
        if (
          currentStats.economy >= MAX_STAT &&
          currentStats.environment >= MAX_STAT &&
          currentStats.happiness >= MAX_STAT
        ) {
          setGameState('won');
        } else {
          showNextEvent(nextSeason);
        }
        return currentStats; // Return unchanged stats, setStats was just for reading
      });

    }, 5500); // 5.5 second pause
  };

  // Restart the game
  const handleRestart = () => {
    setStats(INITIAL_STATS);
    setTrees(INITIAL_TREES);
    setFactories(INITIAL_FACTORIES);
    setHouses(INITIAL_HOUSES);
    setApartments(INITIAL_APARTMENTS);
    setSkyscrapers(INITIAL_SKYSCRAPERS);
    setSolarPanels(INITIAL_SOLARPANELS);
    setParks(INITIAL_PARKS);
    setOffices(INITIAL_OFFICES);
    setSeason('Spring');
    setCurrentEvent(null);
    setGameState('transitioning');
    setTimeout(() => {
      showNextEvent('Spring');
    }, 1500);
  };

  return (
    <div style={styles.appContainer}>
      {/* --- 3D SCENE --- */}
      <Canvas
        shadows
        camera={{ position: [30, 25, 30], fov: 50 }}
        style={styles.canvas}
      >
        <Suspense fallback={null}>
          {/* Lighting & Environment */}
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[10, 20, 15]}
            intensity={1.5}
            castShadow
            shadow-mapSize-width={4096}
            shadow-mapSize-height={4096}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
          />

          {/* Floor */}
          <Plane
            ref={groundRef}
            args={[400, 400]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <meshStandardMaterial color="#3E8635" />
          </Plane>

          {/* Weather & Atmosphere */}
          <Weather season={season} />
          <FloatingClouds />
          <CrazyOrb />
          <MountainRange season={season} />

          {/* Dynamic City Models */}
          {trees.map((tree) => (
            <Tree key={tree.id} {...tree} season={season} />
          ))}
          {factories.map((factory) => (
            <Factory key={factory.id} {...factory} />
          ))}
          {houses.map((house) => (
            <House key={house.id} {...house} />
          ))}
          {apartments.map((apt) => (
            <Apartment key={apt.id} {...apt} position={apt.position} />
          ))}
          {skyscrapers.map((sky) => (
            <Skyscraper key={sky.id} {...sky} position={sky.position} />
          ))}
          {solarPanels.map((sp) => (
            <SolarPanel key={sp.id} {...sp} position={sp.position} />
          ))}
          {parks.map((p) => (
            <Park key={p.id} {...p} position={p.position} />
          ))}
          {offices.map((o) => (
            <OfficeBuilding key={o.id} {...o} position={o.position} />
          ))}

          {/* Controls */}
          <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            minDistance={10}
            maxDistance={150} // Can zoom out to see the mountains
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
        </Suspense>
      </Canvas>

      {/* --- HTML UI OVERLAY --- */}
      <StatsUI
        stats={stats}
        refs={{ eco: ecoBarRef, env: envBarRef, hap: hapBarRef }}
        season={season}
      />

      {gameState === 'event' && currentEvent && (
        <EventModal event={currentEvent} onChoice={handleChoice} />
      )}

      {gameState === 'won' && <WinScreen onRestart={handleRestart} />}

    </div>
  );
};

// ------------------------------------------------------------------
// 6. STYLES (CSS-in-JS)
// (Same as before)
// ------------------------------------------------------------------

const styles: { [key: string]: React.CSSProperties } = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
  },
  canvas: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  statsContainer: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px) saturate(180%)',
    webkitBackdropFilter: 'blur(10px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '15px',
    borderRadius: '15px',
    color: 'white',
    width: '320px',
    zIndex: 10,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },
  seasonDisplay: {
    fontSize: '20px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '15px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
    paddingBottom: '10px',
    textShadow: '0 0 5px #fff, 0 0 10px #8A2BE2',
  },
  statBar: {
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
  },
  statLabel: {
    width: '120px',
    fontSize: '15px',
  },
  statBarOuter: {
    flex: 1,
    height: '22px',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '11px',
    overflow: 'hidden',
    marginRight: '10px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  statBarInner: {
    height: '100%',
    width: '50%',
    borderRadius: '11px',
  },
  statValue: {
    fontSize: '15px',
    minWidth: '30px',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 20,
    padding: '50px',
    pointerEvents: 'none',
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(200%)',
    webkitBackdropFilter: 'blur(20px) saturate(200%)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '25px',
    padding: '40px',
    width: '450px',
    maxWidth: '90%',
    boxShadow: '0 15px 50px 0 rgba(0, 0, 0, 0.5)',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    pointerEvents: 'auto',
    animation: 'slideInRight 0.7s cubic-bezier(0.25, 1, 0.5, 1) forwards',
  },
  modalTitle: {
    margin: 0,
    marginBottom: '20px',
    color: 'white',
    fontSize: '2.2em',
    textShadow: '0 0 8px #ADD8E6, 0 0 15px #8A2BE2',
    letterSpacing: '1px',
  },
  modalDescription: {
    marginBottom: '20px',
    color: '#E0E0E0',
    fontSize: '1.1em',
    lineHeight: 1.6,
  },
  modalButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginTop: '30px',
  },
  modalButton: {
    padding: '15px 25px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.1em',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    background: 'linear-gradient(45deg, #A020F0, #8A2BE2)',
    color: 'white',
    boxShadow: '0 4px 15px rgba(138, 43, 226, 0.4)',
    textShadow: '0 0 5px rgba(255,255,255,0.3)',
  },
  buttonA: {
    background: 'linear-gradient(45deg, #2ecc71, #27ae60)',
    boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)',
    '&:hover': {
      transform: 'translateY(-3px) scale(1.02)',
      boxShadow: '0 6px 20px rgba(46, 204, 113, 0.6)',
    },
  },
  buttonB: {
    background: 'linear-gradient(45deg, #e74c3c, #c0392b)',
    boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
    '&:hover': {
      transform: 'translateY(-3px) scale(1.02)',
      boxShadow: '0 6px 20px rgba(231, 76, 60, 0.6)',
    },
  },
  '@keyframes slideInRight': {
    '0%': { transform: 'translateX(100%)', opacity: 0 },
    '100%': { transform: 'translateX(0)', opacity: 1 },
  },
};

export default App;