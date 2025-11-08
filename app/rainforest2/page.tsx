'use client';

// --- IMPORTS ---
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Suspense, useEffect, useState, useRef } from 'react';

// --- OBJECT INFO INTERFACE ---
interface ObjectInfo {
  name: string;
  emoji: string;
  description: string;
  funFact: string;
  habitat: string;
  conservation: string;
  sound?: string;
  video?: string;
}

// --- RAINFOREST MODEL COMPONENT ---
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
      conservation: 'Many species are endangered due to habitat loss and pet trade.',
      sound: '/sounds/parrot.mp3',
      video: 'https://www.youtube.com/embed/Kj6ZzR0LKpg'
    },
    Object_491: {
      name: 'Monkey',
      emoji: '🐒',
      description: 'Curious and playful primates that swing through the trees. They live in social groups called troops.',
      funFact: 'Monkeys use different calls to warn each other about different types of predators!',
      habitat: 'Middle to upper canopy',
      conservation: 'Threatened by deforestation and hunting.',
      sound: '/sounds/monkey.mp3',
      video: 'https://www.youtube.com/embed/8y2mgyI6kus'
    },
    Object_512: {
      name: 'Shark',
      emoji: '🦈',
      description: 'A swift predator found in rainforest rivers and coastal waters. Bull sharks can even swim in freshwater!',
      funFact: 'Sharks have been around for over 400 million years - older than trees!',
      habitat: 'Rivers and coastal waters',
      conservation: 'Protected in many regions due to overfishing.',
      sound: '/sounds/shark.mp3',
      video: 'https://www.youtube.com/embed/020g-0hhCAU'
    },
    Object_525: {
      name: 'Leopard',
      emoji: '🐆',
      description: 'A silent and powerful hunter with beautiful spotted fur. Leopards are expert climbers and often rest in trees.',
      funFact: 'Leopards can carry prey twice their weight up into trees!',
      habitat: 'Forest floor to canopy',
      conservation: 'Vulnerable species due to habitat loss and poaching.',
      sound: '/sounds/leopard.mp3',
      video: 'https://www.youtube.com/embed/S3Y_NmQj9gw'
    },
    Object_497: {
      name: 'Leopard',
      emoji: '🐆',
      description: 'Another magnificent leopard resting in its territory. These solitary cats are most active at night.',
      funFact: 'Each leopard has unique spot patterns, like human fingerprints!',
      habitat: 'Dense forest areas',
      conservation: 'Protected under international wildlife laws.',
      sound: '/sounds/leopard.mp3',
      video: 'https://www.youtube.com/embed/S3Y_NmQj9gw'
    },
    // Trees
    Object_40: {
      name: 'Cut Tree',
      emoji: '🌲',
      description: 'A tree that has been cut down. Trees are the lungs of our planet, producing oxygen we breathe.',
      funFact: 'A single mature tree can produce enough oxygen for 2 people for a year!',
      habitat: 'Forest floor',
      conservation: '⚠️ Deforestation destroys habitats - we must replant and protect forests!'
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
      emoji: '🏖️',
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
  }, [camera, gl, scene, onObjectClick, raycaster, mouse, objectDatabase]);

  return <primitive object={scene} scale={1.5} />;
}

// --- HOME COMPONENT ---
export default function Home() {
  const [photoInfo, setPhotoInfo] = useState<ObjectInfo | null>(null);
  const [cameraFlash, setCameraFlash] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [boyAnimation, setBoyAnimation] = useState('idle');
  
  // Audio references
  const animalSoundRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Initialize background music
  useEffect(() => {
    bgMusicRef.current = new Audio('/sounds/forestsound.mp3');
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.3;
    
    // Auto-play background music (some browsers may block this)
    const playBgMusic = () => {
      bgMusicRef.current?.play().catch(err => {
        console.log('Background music autoplay blocked:', err);
      });
    };
    
    playBgMusic();
    
    // Retry on user interaction
    const handleInteraction = () => {
      playBgMusic();
      document.removeEventListener('click', handleInteraction);
    };
    document.addEventListener('click', handleInteraction);

    return () => {
      bgMusicRef.current?.pause();
      document.removeEventListener('click', handleInteraction);
    };
  }, []);

  const handlePhotoTaken = (info: ObjectInfo) => {
    // Boy takes photo animation
    setBoyAnimation('taking-photo');
    
    // Camera flash effect
    setCameraFlash(true);
    setTimeout(() => setCameraFlash(false), 200);
    
    // Show info card after photo
    setTimeout(() => {
      setPhotoInfo(info);
      setBoyAnimation('idle');
      
      // Play animal sound if available
      if (info.sound) {
        // Stop any currently playing animal sound
        if (animalSoundRef.current) {
          animalSoundRef.current.pause();
          animalSoundRef.current.currentTime = 0;
        }
        
        // Play new animal sound
        animalSoundRef.current = new Audio(info.sound);
        animalSoundRef.current.loop = true;
        animalSoundRef.current.volume = 0.6;
        animalSoundRef.current.play().catch(err => {
          console.error('Error playing animal sound:', err);
        });
      }
    }, 300);
  };

  const closeInfo = () => {
    // Stop animal sound when closing popup
    if (animalSoundRef.current) {
      animalSoundRef.current.pause();
      animalSoundRef.current.currentTime = 0;
      animalSoundRef.current = null;
    }
    setPhotoInfo(null);
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
      {/* Camera Flash Overlay */}
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

      {/* Boy Photographer Character - Bottom Center */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {/* Boy Character */}
        <div
          style={{
            position: 'relative',
            width: '120px',
            height: '140px',
            animation: boyAnimation === 'idle' ? 'boyIdle 2s ease-in-out infinite' : 'none'
          }}
        >
          {/* Head */}
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: '#FFD1A4',
              border: '3px solid #333',
              zIndex: 2
            }}
          >
            {/* Hair */}
            <div
              style={{
                position: 'absolute',
                top: '-5px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '52px',
                height: '30px',
                borderRadius: '50% 50% 0 0',
                background: '#4A2C2A',
                border: '3px solid #333',
                borderBottom: 'none'
              }}
            />
            {/* Eyes */}
            <div style={{ position: 'absolute', top: '18px', left: '12px', width: '8px', height: '8px', borderRadius: '50%', background: '#000' }} />
            <div style={{ position: 'absolute', top: '18px', right: '12px', width: '8px', height: '8px', borderRadius: '50%', background: '#000' }} />
            {/* Smile */}
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '20px',
                height: '10px',
                borderRadius: '0 0 20px 20px',
                border: '2px solid #000',
                borderTop: 'none'
              }}
            />
          </div>

          {/* Body */}
          <div
            style={{
              position: 'absolute',
              top: '50px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '45px',
              height: '50px',
              borderRadius: '10px',
              background: '#FF6B35',
              border: '3px solid #333',
              zIndex: 1
            }}
          />

          {/* Arms */}
          <div
            style={{
              position: 'absolute',
              top: '55px',
              left: '10px',
              width: '30px',
              height: '12px',
              borderRadius: '10px',
              background: '#FFD1A4',
              border: '2px solid #333',
              transform: 'rotate(-30deg)'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '55px',
              right: '10px',
              width: '30px',
              height: '12px',
              borderRadius: '10px',
              background: '#FFD1A4',
              border: '2px solid #333',
              transform: boyAnimation === 'taking-photo' ? 'rotate(30deg) translateY(-5px)' : 'rotate(30deg)',
              transition: 'transform 0.3s ease'
            }}
          />

          {/* Camera in hand */}
          <div
            style={{
              position: 'absolute',
              top: '60px',
              right: '5px',
              width: '25px',
              height: '18px',
              borderRadius: '4px',
              background: '#2C3E50',
              border: '2px solid #333',
              transform: boyAnimation === 'taking-photo' ? 'translateY(-8px) rotate(-10deg)' : 'none',
              transition: 'transform 0.3s ease'
            }}
          >
            {/* Lens */}
            <div
              style={{
                position: 'absolute',
                top: '3px',
                right: '-8px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#34495E',
                border: '2px solid #333'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '2px',
                  left: '2px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#4A9EFF',
                  opacity: 0.7
                }}
              />
            </div>
            {/* Flash effect on camera */}
            {boyAnimation === 'taking-photo' && (
              <div
                style={{
                  position: 'absolute',
                  top: '-5px',
                  left: '0',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#FFEB3B',
                  boxShadow: '0 0 10px #FFEB3B',
                  animation: 'flashBlink 0.3s ease-out'
                }}
              />
            )}
          </div>

          {/* Legs */}
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '35%',
              width: '12px',
              height: '35px',
              borderRadius: '0 0 6px 6px',
              background: '#2C5F2D',
              border: '2px solid #333'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              right: '35%',
              width: '12px',
              height: '35px',
              borderRadius: '0 0 6px 6px',
              background: '#2C5F2D',
              border: '2px solid #333'
            }}
          />
        </div>

        {/* Speech Bubble */}
        <div
          style={{
            background: 'rgba(255,255,255,0.95)',
            padding: '8px 16px',
            borderRadius: '20px',
            border: '2px solid #333',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: '#2C3E50',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            position: 'relative'
          }}
        >
          {boyAnimation === 'taking-photo' ? '📸 Click!' : '🌿 Rainforest Explorer'}
          {/* Flipped Tail */}
          <div
            style={{
              position: 'absolute',
              bottom: '-10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '10px solid transparent',
              borderRight: '10px solid transparent',
              borderTop: '10px solid #333'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-7px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid rgba(255,255,255,0.95)'
            }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
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
        👆 Click objects • 🖱️ Drag to rotate • 🔍 Scroll to zoom
      </div>

      {/* Toggle Rotation Button */}
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
        {autoRotate ? '⏸️ Pause' : '▶️ Auto Rotate'}
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

      {/* Photo Info Card */}
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
              maxWidth: '600px',
              width: '90%',
              animation: 'slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            {/* Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(74,144,226,0.8) 0%, rgba(80,200,120,0.8) 100%)',
                backdropFilter: 'blur(10px)',
                padding: '24px',
                borderRadius: '24px 24px 0 0',
                color: 'white',
                position: 'relative',
                borderBottom: '2px solid rgba(255,255,255,0.3)',
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  fontSize: '3.5rem',
                  marginBottom: '8px',
                  textShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  animation: 'bounce 0.6s ease-out'
                }}
              >
                {photoInfo.emoji}
              </div>
              <h2 style={{
                margin: 0,
                fontSize: '1.8rem',
                fontWeight: 'bold',
                textShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}>
                {photoInfo.name}
              </h2>
              <button
                onClick={closeInfo}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.25)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  fontSize: '1.3rem',
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

            {/* Content - Compact Grid Layout */}
            <div style={{ padding: '24px', display: 'grid', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Description */}
              <div>
                <h3 style={{
                  color: '#fff',
                  fontSize: '1rem',
                  marginBottom: '6px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  margin: '0 0 6px 0'
                }}>
                  📖 Description
                </h3>
                <p style={{
                  color: 'rgba(255,255,255,0.95)',
                  lineHeight: '1.5',
                  margin: 0,
                  fontSize: '0.95rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {photoInfo.description}
                </p>
              </div>

              {/* Fun Fact */}
              <div style={{
                background: 'rgba(255, 249, 230, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '14px',
                borderRadius: '12px',
                border: '2px solid rgba(255, 215, 0, 0.4)',
                boxShadow: '0 4px 12px rgba(255,215,0,0.1)'
              }}>
                <h3 style={{
                  color: '#FFD700',
                  fontSize: '1rem',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  margin: '0 0 6px 0'
                }}>
                  💡 Fun Fact
                </h3>
                <p style={{
                  color: 'rgba(255,255,255,0.95)',
                  lineHeight: '1.5',
                  margin: 0,
                  fontStyle: 'italic',
                  fontSize: '0.95rem',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  {photoInfo.funFact}
                </p>
              </div>

              {/* Two Column Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Habitat */}
                <div>
                  <h3 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    marginBottom: '6px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    margin: '0 0 6px 0'
                  }}>
                    🏡 Habitat
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.95)',
                    lineHeight: '1.5',
                    margin: 0,
                    fontSize: '0.9rem',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    {photoInfo.habitat}
                  </p>
                </div>

                {/* Conservation */}
                <div style={{
                  background: 'rgba(232, 245, 233, 0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid rgba(76, 175, 80, 0.4)',
                  boxShadow: '0 4px 12px rgba(76,175,80,0.1)'
                }}>
                  <h3 style={{
                    color: '#4CAF50',
                    fontSize: '1rem',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    margin: '0 0 6px 0'
                  }}>
                    🌍 Status
                  </h3>
                  <p style={{
                    color: 'rgba(255,255,255,0.95)',
                    lineHeight: '1.4',
                    margin: 0,
                    fontSize: '0.85rem',
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                  }}>
                    {photoInfo.conservation}
                  </p>
                </div>
              </div>

              {/* YouTube Video Embed - Only for animals with videos */}
              {photoInfo.video && (
                <div style={{
                  width: '100%',
                  marginTop: '8px'
                }}>
                  <h3 style={{
                    color: '#fff',
                    fontSize: '1rem',
                    marginBottom: '10px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    margin: '0 0 10px 0'
                  }}>
                    🎥 Watch Video
                  </h3>
                  <div style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    height: 0,
                    overflow: 'hidden',
                    borderRadius: '12px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    background: '#000'
                  }}>
                    <iframe
                      src={photoInfo.video}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: '10px'
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`${photoInfo.name} video`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* STYLES */}
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
          @keyframes boyIdle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes flashBlink {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }
        `}
      </style>
    </main>
  );
}