'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense, useEffect, useState, useRef } from 'react';

function KidPhotographer() {
  const groupRef = useRef<THREE.Group>(null);
  const [wave, setWave] = useState(0);
  
  useFrame((state) => {
    if (groupRef.current) {
      setWave(state.clock.elapsedTime);
      // Gentle idle animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[-3, 0.5, 3]} rotation={[0, Math.PI / 4, 0]}>
      {/* Legs */}
      <mesh position={[-0.12, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#2C5F2D" />
      </mesh>
      <mesh position={[0.12, 0.3, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
        <meshStandardMaterial color="#2C5F2D" />
      </mesh>
      
      {/* Body - torso */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.3]} />
        <meshStandardMaterial color="#FF6B35" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.35, 0.75, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#FFD1A4" />
      </mesh>
      <mesh position={[0.35, 0.75, 0.15]} rotation={[0, 0, -Math.PI / 3]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#FFD1A4" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#FFD1A4" />
      </mesh>
      
      {/* Hair */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.23, 16, 16]} />
        <meshStandardMaterial color="#4A2C2A" />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.08, 1.38, 0.18]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[0.08, 1.38, 0.18]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Smile */}
      <mesh position={[0, 1.3, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.08, 0.01, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      
      {/* Camera body */}
      <mesh position={[0.5, 0.85, 0.3]} rotation={[0, -Math.PI / 6, 0]}>
        <boxGeometry args={[0.2, 0.15, 0.12]} />
        <meshStandardMaterial color="#2C3E50" />
      </mesh>
      
      {/* Camera lens */}
      <mesh position={[0.55, 0.85, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 16]} />
        <meshStandardMaterial color="#34495E" />
      </mesh>
      
      {/* Camera lens glass */}
      <mesh position={[0.55, 0.85, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshStandardMaterial color="#4A9EFF" transparent opacity={0.7} />
      </mesh>
      
      {/* Backpack */}
      <mesh position={[0, 0.85, -0.2]}>
        <boxGeometry args={[0.35, 0.5, 0.15]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    </group>
  );
}

function RainforestModel({ onObjectClick }: { onObjectClick: (data: ObjectInfo) => void }) {
  const { scene } = useGLTF('/models/rainforest.glb');
  const { camera, gl } = useThree();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const objectDatabase: Record<string, ObjectInfo> = {
    // Animals
    Object_503: {
      name: 'Parrot',
      emoji: '🦜',
      description: 'A vibrant, intelligent bird native to tropical rainforests. Parrots can mimic human speech and live up to 80 years!',
      funFact: 'Parrots are one of the few animals that can use tools and solve complex puzzles.',
      habitat: 'Canopy layer of rainforests',
      conservation: 'Many species are endangered due to habitat loss and pet trade.'
    },
    Object_491: {
      name: 'Monkey',
      emoji: '🐒',
      description: 'Curious and playful primates that swing through the trees. They live in social groups called troops.',
      funFact: 'Monkeys use different calls to warn each other about different types of predators!',
      habitat: 'Middle to upper canopy',
      conservation: 'Threatened by deforestation and hunting.'
    },
    Object_512: {
      name: 'Shark',
      emoji: '🦈',
      description: 'A swift predator found in rainforest rivers and coastal waters. Bull sharks can even swim in freshwater!',
      funFact: 'Sharks have been around for over 400 million years - older than trees!',
      habitat: 'Rivers and coastal waters',
      conservation: 'Protected in many regions due to overfishing.'
    },
    Object_525: {
      name: 'Leopard',
      emoji: '🐆',
      description: 'A silent and powerful hunter with beautiful spotted fur. Leopards are expert climbers and often rest in trees.',
      funFact: 'Leopards can carry prey twice their weight up into trees!',
      habitat: 'Forest floor to canopy',
      conservation: 'Vulnerable species due to habitat loss and poaching.'
    },
    Object_497: {
      name: 'Leopard',
      emoji: '🐆',
      description: 'Another magnificent leopard resting in its territory. These solitary cats are most active at night.',
      funFact: 'Each leopard has unique spot patterns, like human fingerprints!',
      habitat: 'Dense forest areas',
      conservation: 'Protected under international wildlife laws.'
    },

    // Trees
    Object_40: {
      name: 'Cut Tree',
      emoji: '🌲',
      description: 'A tree that has been cut down. Trees are the lungs of our planet, producing oxygen we breathe.',
      funFact: 'A single mature tree can produce enough oxygen for 2 people for a year!',
      habitat: 'Forest floor',
      conservation: '⚠ Deforestation destroys habitats - we must replant and protect forests!'
    },
    Object_18: {
      name: 'Logged Tree',
      emoji: '🌲',
      description: 'Evidence of deforestation. This affects countless animals who called this tree home.',
      funFact: 'Rainforests cover only 6% of Earth but contain 50% of all plant and animal species!',
      habitat: 'Former forest area',
      conservation: 'We lose 137 species every day due to deforestation.'
    },
    Object_93: {
      name: 'Fallen Tree',
      emoji: '🌲',
      description: 'A cut tree stump. Trees take decades to grow but only minutes to cut down.',
      funFact: 'The Amazon rainforest produces 20% of the world\'s oxygen!',
      habitat: 'Rainforest floor',
      conservation: 'Plant a tree today - it\'s the best gift to future generations!'
    },
    Object_152: {
      name: 'Tree Leaves',
      emoji: '🍃',
      description: 'Lush green leaves that convert sunlight into energy through photosynthesis.',
      funFact: 'One tree can absorb 48 pounds of carbon dioxide per year!',
      habitat: 'Tree canopy',
      conservation: 'Healthy leaves mean healthy forests - protect them from pollution!'
    },

    // Nature
    Object_119: {
      name: 'Forest Grass',
      emoji: '🌿',
      description: 'Lush ground cover that provides food and shelter for small animals and insects.',
      funFact: 'Grass absorbs rainfall and prevents soil erosion!',
      habitat: 'Forest floor',
      conservation: 'Ground vegetation is crucial for ecosystem balance.'
    },
    Object_419: {
      name: 'Tall Grass',
      emoji: '🌾',
      description: 'Dense vegetation where small animals hide from predators. Home to countless insects.',
      funFact: 'Tall grasses can grow up to 10 feet in tropical climates!',
      habitat: 'Open forest areas',
      conservation: 'Provides nesting sites for ground-dwelling birds.'
    },
    Object_437: {
      name: 'Young Plants',
      emoji: '🌱',
      description: 'New life sprouting! These seedlings will become tomorrow\'s forest giants.',
      funFact: 'It takes 5-10 years for a rainforest tree to grow just 20 feet tall!',
      habitat: 'Forest undergrowth',
      conservation: 'Protect seedlings - they are the forest\'s future!'
    },
    Object_307: {
      name: 'Ancient Rocks',
      emoji: '🪨',
      description: 'Massive rocks that have stood for millions of years, shaping the landscape.',
      funFact: 'These rocks provide minerals that enrich the soil for plants!',
      habitat: 'Throughout the forest',
      conservation: 'Rock formations create microclimates for unique species.'
    },
    Object_113: {
      name: 'Sandy Path',
      emoji: '🏖',
      description: 'Soft sand along the riverbed, created by centuries of water erosion.',
      funFact: 'River sand is home to tiny organisms that filter and clean the water!',
      habitat: 'River edges',
      conservation: 'Keep rivers clean - no littering!'
    },
    Object_115: {
      name: 'Freshwater Lake',
      emoji: '💧',
      description: 'A vital water source for all rainforest life. Animals travel miles to drink here.',
      funFact: 'Rainforest lakes support over 3,000 species of fish!',
      habitat: 'Forest clearings',
      conservation: 'Clean water is life - protect our water sources from pollution!'
    }
  };

  useEffect(() => {
    console.log('🌿 Rainforest model loaded!');

    const handleClick = (event: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const clicked = intersects[0].object as THREE.Mesh;
        const objectInfo = objectDatabase[clicked.name];
        
        if (objectInfo) {
          console.log('📸 Photographed:', clicked.name);
          onObjectClick(objectInfo);

          const mat = clicked.material as THREE.MeshStandardMaterial;
          if (mat) {
            const original = mat.emissive.clone();
            mat.emissive.setHex(0xffff00);
            setTimeout(() => mat.emissive.copy(original), 300);
          }
        }
      }
    };

    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [camera, gl, scene]);

  return <primitive object={scene} scale={1.5} />;
}

interface ObjectInfo {
  name: string;
  emoji: string;
  description: string;
  funFact: string;
  habitat: string;
  conservation: string;
}

export default function Home() {
  const [photoInfo, setPhotoInfo] = useState<ObjectInfo | null>(null);
  const [cameraFlash, setCameraFlash] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePhotoTaken = (info: ObjectInfo) => {
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);
    setPhotoInfo(info);
    
    // Play leopard sound if it's a leopard
    if (info.name === 'Leopard') {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_4a96f9ff18.mp3');
      audioRef.current.volume = 0.5;
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }
  };

  const closeInfo = () => {
    setPhotoInfo(null);
    // Stop the sound when closing info panel
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8C8 100%)',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative'
      }}
    >
      {cameraFlash && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'white',
            zIndex: 9999,
            animation: 'fadeOut 0.2s ease-out',
            pointerEvents: 'none'
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(10px)',
          padding: '12px 28px',
          borderRadius: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <span style={{ fontSize: '1.4rem' }}>📸</span>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2C3E50' }}>
          🌿 Rainforest Explorer
        </span>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          padding: '12px 20px',
          borderRadius: '12px',
          color: 'white',
          fontSize: '0.9rem',
          maxWidth: '280px',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        👆 Click objects • 🖱 Drag to rotate • 🔍 Scroll to zoom
      </div>

      <button
        onClick={() => setAutoRotate(!autoRotate)}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 10,
          background: autoRotate 
            ? 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)' 
            : 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '12px',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          fontSize: '1rem',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {autoRotate ? '⏸ Pause' : '▶ Auto Rotate'}
      </button>

      <Canvas camera={{ position: [0, 3, 8], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-5, 5, 5]} intensity={0.5} />
        <pointLight position={[5, 2, -5]} intensity={0.3} color="#FFB6C1" />

        <Suspense
          fallback={
            <Html center>
              <div
                style={{
                  color: 'white',
                  fontFamily: 'monospace',
                  fontSize: '1.3rem',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '24px 32px',
                  borderRadius: '16px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                Loading Rainforest 🌿...
              </div>
            </Html>
          }
        >
          <RainforestModel onObjectClick={handlePhotoTaken} />
          <KidPhotographer />
        </Suspense>

        <OrbitControls
          enableZoom={true}
          enablePan={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          minDistance={3}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      {photoInfo && (
        <>
          <div
            onClick={closeInfo}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              zIndex: 999,
              animation: 'fadeIn 0.3s ease-out'
            }}
          />
          
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.2)',
              maxWidth: '550px',
              width: '90%',
              maxHeight: '85vh',
              overflow: 'auto',
              animation: 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(74,144,226,0.8) 0%, rgba(80,200,120,0.8) 100%)',
                backdropFilter: 'blur(10px)',
                padding: '28px',
                borderRadius: '24px 24px 0 0',
                color: 'white',
                position: 'relative',
                borderBottom: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              <div 
                style={{ 
                  fontSize: '4rem', 
                  marginBottom: '12px',
                  textShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  animation: 'bounce 0.6s ease-out'
                }}
              >
                {photoInfo.emoji}
              </div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '2rem', 
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {photoInfo.name}
              </h2>
              <button
                onClick={closeInfo}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'white',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
                  e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '28px' }}>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  color: '#fff', 
                  fontSize: '1.2rem', 
                  marginBottom: '10px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  📖 Description
                </h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.95)', 
                  lineHeight: '1.7', 
                  margin: 0,
                  fontSize: '1rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {photoInfo.description}
                </p>
              </div>

              <div style={{ 
                marginBottom: '24px', 
                background: 'rgba(255, 249, 230, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '20px', 
                borderRadius: '16px', 
                border: '2px solid rgba(255, 215, 0, 0.4)',
                boxShadow: '0 4px 12px rgba(255,215,0,0.1)'
              }}>
                <h3 style={{ 
                  color: '#FFD700', 
                  fontSize: '1.2rem', 
                  marginBottom: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  💡 Fun Fact
                </h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.95)', 
                  lineHeight: '1.7', 
                  margin: 0, 
                  fontStyle: 'italic',
                  fontSize: '1rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {photoInfo.funFact}
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  color: '#fff', 
                  fontSize: '1.2rem', 
                  marginBottom: '10px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  🏡 Habitat
                </h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.95)', 
                  lineHeight: '1.7', 
                  margin: 0,
                  fontSize: '1rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {photoInfo.habitat}
                </p>
              </div>

              <div style={{ 
                background: 'rgba(232, 245, 233, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '20px', 
                borderRadius: '16px', 
                border: '2px solid rgba(76, 175, 80, 0.4)',
                boxShadow: '0 4px 12px rgba(76,175,80,0.1)'
              }}>
                <h3 style={{ 
                  color: '#4CAF50', 
                  fontSize: '1.2rem', 
                  marginBottom: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  🌍 Conservation
                </h3>
                <p style={{ 
                  color: 'rgba(255,255,255,0.95)', 
                  lineHeight: '1.7', 
                  margin: 0,
                  fontSize: '1rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {photoInfo.conservation}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      <style>
        {`
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { 
              transform: translate(-50%, -60%);
              opacity: 0;
              scale: 0.9;
            }
            to { 
              transform: translate(-50%, -50%);
              opacity: 1;
              scale: 1;
            }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </main>
  );
}