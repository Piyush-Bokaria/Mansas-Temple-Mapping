import React, { useState, useEffect } from "react";
import "./App.css";
import MapComponent from "./Components/MapComponent";
import FilterComponent from "./Components/FilterComponent";
import HeaderComponent from "./Components/HeaderComponent";
import Footer from "./Components/FooterComponent";

function App() {
  const [templeData, setTempleData] = useState([]);
  const [showRoutes, setShowRoutes] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [clickEffects, setClickEffects] = useState([]);
  const [isMouseMoving, setIsMouseMoving] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/getTemples")
      .then((res) => res.json())
      .then((data) => {
        setTempleData(data);
      })
      .catch((error) => {
        console.error("Error fetching temple data:", error);
      });
  }, []);

  // Mouse tracking for interactive effects
  useEffect(() => {
    let moveTimeout;
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsMouseMoving(true);
      
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => {
        setIsMouseMoving(false);
      }, 150);
    };

    const handleClick = (e) => {
      const newEffect = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      };
      
      setClickEffects(prev => [...prev, newEffect]);
      
      // Remove effect after animation
      setTimeout(() => {
        setClickEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      clearTimeout(moveTimeout);
    };
  }, []);

  return (
    <div id="home" className={isMouseMoving ? 'mouse-active' : ''}>
      {/* Interactive Animated Background */}
      <div className="animated-background">
        {/* Mouse Follower */}
        <div 
          className="mouse-follower"
          style={{
            left: mousePosition.x - 50,
            top: mousePosition.y - 50,
          }}
        ></div>

        {/* Click Effects */}
        {clickEffects.map(effect => (
          <div
            key={effect.id}
            className="click-effect"
            style={{
              left: effect.x - 25,
              top: effect.y - 25,
            }}
          >
            <div className="ripple"></div>
            <div className="sparkle">✨</div>
          </div>
        ))}

        {/* Interactive Floating Particles */}
        <div className="floating-particles">
          {[...Array(30)].map((_, i) => (
            <div 
              key={i} 
              className={`particle particle-${i % 5} ${isMouseMoving ? 'mouse-attracted' : ''}`}
              style={{
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`,
              }}
            ></div>
          ))}
        </div>

        {/* Interactive Wave Animation */}
        <div className={`wave-animation ${isMouseMoving ? 'wave-active' : ''}`}>
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
          <div className="wave wave3"></div>
        </div>

        {/* Interactive Temple Symbols */}
        <div className="temple-symbols">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`temple-symbol symbol-${i} ${isMouseMoving ? 'symbol-active' : ''}`}
              onClick={(e) => {
                e.target.classList.add('symbol-clicked');
                setTimeout(() => {
                  e.target.classList.remove('symbol-clicked');
                }, 600);
              }}
            >
              {['🕉️', '🏛️', '🔱', '🪔'][i % 4]}
            </div>
          ))}
        </div>

        {/* Floating Orbs */}
        <div className="floating-orbs">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={`orb orb-${i}`}
              style={{
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`,
              }}
            ></div>
          ))}
        </div>

        {/* Interactive Grid */}
        <div className="interactive-grid">
          {[...Array(100)].map((_, i) => (
            <div 
              key={i} 
              className="grid-dot"
              style={{
                '--mouse-x': `${mousePosition.x}px`,
                '--mouse-y': `${mousePosition.y}px`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <HeaderComponent />
        <FilterComponent
          templeData={templeData}
          setTempleData={setTempleData}
          setShowRoutes={setShowRoutes}
        />
        <MapComponent templeData={templeData} showRoutes={showRoutes} />
        <Footer />
      </div>
    </div>
  );
}

export default App;
