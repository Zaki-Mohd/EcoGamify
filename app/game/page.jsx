"use client";
import React, { useState, useEffect } from 'react';
import { Gamepad2, Sparkles, Zap, Trees, Users, Recycle, Globe, School, GraduationCap } from 'lucide-react';

const PixelCard = ({ title, icon: Icon, games, delay, category }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showGames, setShowGames] = useState(false);

  return (
    <div
      className="relative group"
      style={{
        animation: `float ${3 + delay}s ease-in-out infinite`,
        animationDelay: `${delay * 0.5}s`
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${
        category === 'school' ? 'from-green-400 to-blue-500' : 'from-purple-400 to-pink-500'
      } rounded-2xl blur-xl opacity-0 group-hover:opacity-60 transition-all duration-500`}></div>
      
      <div 
        className={`relative bg-gradient-to-br ${
          category === 'school' 
            ? 'from-green-900 via-teal-900 to-blue-900' 
            : 'from-purple-900 via-pink-900 to-red-900'
        } p-8 rounded-2xl border-4 ${
          category === 'school' ? 'border-green-400' : 'border-purple-400'
        } shadow-2xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-rotate-1`}
        onClick={() => setShowGames(!showGames)}
      >
        <div className="absolute top-2 right-2">
          <div className={`w-3 h-3 ${
            category === 'school' ? 'bg-green-400' : 'bg-purple-400'
          } rounded-sm animate-pulse`}></div>
        </div>
        
        <div className={`absolute top-2 left-2 text-xs font-bold ${
          category === 'school' ? 'text-green-300' : 'text-purple-300'
        } tracking-wider pixel-text`}>
          {category === 'school' ? 'SCHOOL LVL' : 'COLLEGE LVL'}
        </div>

        <div className="flex flex-col items-center space-y-4">
          <div className={`p-6 bg-black/40 rounded-xl border-2 ${
            category === 'school' ? 'border-green-400' : 'border-purple-400'
          } transform transition-all duration-300 ${
            isHovered ? 'rotate-12 scale-110' : ''
          }`}>
            <Icon className={`w-12 h-12 ${
              category === 'school' ? 'text-green-400' : 'text-purple-400'
            }`} strokeWidth={3} />
          </div>
          
          <h3 className="text-3xl font-black text-white tracking-wider pixel-text text-center">
            {title}
          </h3>
          
          <div className={`h-2 w-32 ${
            category === 'school' ? 'bg-green-950' : 'bg-purple-950'
          } rounded-full overflow-hidden`}>
            <div 
              className={`h-full ${
                category === 'school' ? 'bg-green-400' : 'bg-purple-400'
              } rounded-full transition-all duration-1000`}
              style={{ width: showGames ? '100%' : '0%' }}
            ></div>
          </div>

          {showGames && (
            <div className="mt-6 space-y-3 w-full animate-in slide-in-from-top duration-500">
              {games.map((game, idx) => (
                <a
                  key={idx}
                  href={game.route}
                  className={`block w-full p-4 bg-black/60 rounded-lg border-2 ${
                    category === 'school' ? 'border-green-500 hover:border-green-300 hover:bg-green-950/50' : 'border-purple-500 hover:border-purple-300 hover:bg-purple-950/50'
                  } transition-all duration-300 transform hover:scale-105 hover:translate-x-2 group/game`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold pixel-text text-sm">{game.name}</span>
                    <Zap className={`w-4 h-4 ${
                      category === 'school' ? 'text-green-400' : 'text-purple-400'
                    } group-hover/game:animate-bounce`} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="absolute -bottom-2 -right-2 flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 ${
                category === 'school' ? 'bg-green-400' : 'bg-purple-400'
              } rounded-sm`}
              style={{
                animation: `ping 1s cubic-bezier(0, 0, 0.2, 1) infinite`,
                animationDelay: `${i * 200}ms`
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FloatingParticle = ({ delay, duration, color }) => (
  <div
    className="absolute w-2 h-2 rounded-sm opacity-60"
    style={{
      background: color,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animation: `float-particle ${duration}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
      boxShadow: `0 0 10px ${color}`
    }}
  ></div>
);

export default function SustainabilityGameLanding() {
  const [glitchActive, setGlitchActive] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 5000);

    const scoreInterval = setInterval(() => {
      setScore(prev => (prev + 1) % 10000);
    }, 100);

    return () => {
      clearInterval(glitchInterval);
      clearInterval(scoreInterval);
    };
  }, []);

  const schoolGames = [
    { name: "RAINFOREST RESCUE", route: "/rainforest2" },
    { name: "PRESIDENT CHALLENGE", route: "/president" },
    { name: "PRESIDENT 2.0", route: "/president2" }
  ];

  const collegeGames = [
    { name: "HACK PLANET", route: "/hackplanet" },
    { name: "HACK PLANET 2", route: "/hackplanet2" },
    { name: "WASTE HACK", route: "/wastehack" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden relative">
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .pixel-text {
          font-family: 'Press Start 2P', cursive;
          text-shadow: 2px 2px 0px rgba(0,0,0,0.8), 4px 4px 0px rgba(255,255,255,0.1);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes float-particle {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          50% { 
            transform: translate(100px, -100px) rotate(180deg);
            opacity: 0.6;
          }
        }

        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes pulse-border {
          0%, 100% { border-color: rgba(168, 85, 247, 0.5); }
          50% { border-color: rgba(168, 85, 247, 1); }
        }

        .glitch {
          animation: glitch 0.2s infinite;
        }

        .scan-line {
          animation: scan 8s linear infinite;
        }

        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: slide-in-from-top 0.5s ease-out forwards;
        }
      `}</style>

      {/* Floating Particles */}
      {[...Array(30)].map((_, i) => (
        <FloatingParticle
          key={i}
          delay={i * 0.3}
          duration={8 + Math.random() * 4}
          color={i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#a855f7' : '#ec4899'}
        />
      ))}

      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="scan-line absolute w-full h-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(168, 85, 247, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(168, 85, 247, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 bg-black/40 backdrop-blur-sm border-b-4 border-purple-500 p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Globe className="w-8 h-8 text-green-400 animate-spin" style={{ animationDuration: '8s' }} />
            <h1 className={`text-2xl font-black text-white pixel-text ${glitchActive ? 'glitch' : ''}`}>
              EcoGamify
            </h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              <span className="text-xl font-bold text-yellow-400 pixel-text">{score.toString().padStart(4, '0')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-6 h-6 text-purple-400 animate-bounce" />
              <span className="text-xl font-bold text-purple-400 pixel-text">ONLINE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20 space-y-6">
            <div className="flex justify-center space-x-4 mb-8">
              <Gamepad2 className="w-16 h-16 text-green-400 animate-bounce" style={{ animationDelay: '0s' }} />
              <Recycle className="w-16 h-16 text-purple-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <Trees className="w-16 h-16 text-pink-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
            
            <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-purple-400 to-pink-400 pixel-text mb-6 animate-pulse">
              CHOOSE YOUR LEVEL
            </h2>
            
            <p className="text-2xl text-purple-300 pixel-text max-w-3xl mx-auto leading-relaxed">
              SAVE THE PLANET. ONE GAME AT A TIME.
            </p>

            <div className="flex justify-center space-x-4 mt-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-gradient-to-r from-green-400 to-purple-400 rounded-sm"
                  style={{
                    animation: `pulse 1s ease-in-out infinite`,
                    animationDelay: `${i * 0.2}s`
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <PixelCard
              title="SCHOOL ZONE"
              icon={School}
              games={schoolGames}
              delay={0}
              category="school"
            />
            
            <PixelCard
              title="COLLEGE ARENA"
              icon={GraduationCap}
              games={collegeGames}
              delay={0.5}
              category="college"
            />
          </div>

          {/* Bottom Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Users, label: 'PLAYERS', value: '999+', color: 'text-green-400' },
              { icon: Globe, label: 'WORLDS', value: '6', color: 'text-purple-400' },
              { icon: Sparkles, label: 'MISSIONS', value: '∞', color: 'text-pink-400' }
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-black/40 backdrop-blur-sm p-6 rounded-xl border-2 border-purple-500/50 hover:border-purple-400 transition-all duration-300 transform hover:scale-105"
                style={{
                  animation: `float ${3 + idx}s ease-in-out infinite`,
                  animationDelay: `${idx * 0.3}s`
                }}
              >
                <div className="flex flex-col items-center space-y-3">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <div className="text-center">
                    <div className={`text-3xl font-black ${stat.color} pixel-text`}>
                      {stat.value}
                    </div>
                    <div className="text-sm text-purple-300 pixel-text mt-2">
                      {stat.label}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Corner Decorations */}
      <div className="absolute top-20 left-8 w-16 h-16 border-t-4 border-l-4 border-green-400 opacity-50"></div>
      <div className="absolute top-20 right-8 w-16 h-16 border-t-4 border-r-4 border-purple-400 opacity-50"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-pink-400 opacity-50"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-green-400 opacity-50"></div>
    </div>
  );
}