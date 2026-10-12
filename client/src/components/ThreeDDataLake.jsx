import React, { useRef, useEffect, useState } from 'react';
import { Database, Sparkles, Layers, ShieldCheck, Zap } from 'lucide-react';
import './ThreeDDataLake.css';

export const ThreeDDataLake = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // 3D Mouse Parallax State
  const [rotation, setRotation] = useState({ x: 18, y: -24 });
  const [isHovered, setIsHovered] = useState(false);
  const [activeZone, setActiveZone] = useState('silver');

  // Handle Mouse Move for 3D Tilt
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Smooth bounded rotation angles
    const rotX = Math.max(-25, Math.min(35, 18 - (y / rect.height) * 30));
    const rotY = Math.max(-45, Math.min(15, -24 + (x / rect.width) * 40));
    setRotation({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smoothly reset towards default isometric angle
    setRotation({ x: 18, y: -24 });
  };

  // 3D Canvas Particle Network Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.offsetWidth || 560);
    let height = (canvas.height = canvas.offsetHeight || 420);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 560;
      height = canvas.height = canvas.offsetHeight || 420;
    };
    window.addEventListener('resize', handleResize);

    // Generate 3D Spherical & Cylindrical Data Nodes
    const numParticles = 48;
    const particles = [];
    const radius = 170;

    for (let i = 0; i < numParticles; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      particles.push({
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: (Math.random() - 0.5) * 220, // Distributed along height
        z: radius * Math.cos(phi),
        baseX: radius * Math.sin(phi) * Math.cos(theta),
        baseZ: radius * Math.cos(phi),
        size: Math.random() * 2.2 + 1.2,
        speed: (Math.random() * 0.008 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        angle: theta,
        zone: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'silver' : 'bronze'
      });
    }

    let globalAngle = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const fov = 340;
      const cx = width / 2;
      const cy = height / 2;
      globalAngle += 0.008;

      // Project each particle to 2D
      const projected = particles.map((p) => {
        p.angle += p.speed;
        const currentX = Math.cos(p.angle) * radius;
        const currentZ = Math.sin(p.angle) * radius;

        // Apply pitch (rotation.x) and yaw (globalAngle + rotation.y)
        const radX = (rotation.x * Math.PI) / 180;
        const radY = ((rotation.y + globalAngle * 25) * Math.PI) / 180;

        // 3D Rotation Matrix
        // 1. Rotate Y
        const x1 = currentX * Math.cos(radY) - currentZ * Math.sin(radY);
        const z1 = currentZ * Math.cos(radY) + currentX * Math.sin(radY);

        // 2. Rotate X
        const y2 = p.y * Math.cos(radX) - z1 * Math.sin(radX);
        const z2 = z1 * Math.cos(radX) + p.y * Math.sin(radX);

        // Perspective projection
        const scale = fov / (fov + z2 + 180);
        const x2d = cx + x1 * scale;
        const y2d = cy + y2 * scale;

        return {
          x: x2d,
          y: y2d,
          scale: Math.max(0.2, scale),
          z: z2,
          zone: p.zone,
          size: p.size * scale
        };
      });

      // Sort by Z for proper 3D depth rendering
      projected.sort((a, b) => b.z - a.z);

      // Draw 3D connecting data vectors between nearby nodes
      ctx.lineWidth = 0.75;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].x - projected[j].x;
          const dy = projected[i].y - projected[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 65) {
            const alpha = (1 - dist / 65) * 0.28 * Math.min(projected[i].scale, projected[j].scale);
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].x, projected[i].y);
            ctx.lineTo(projected[j].x, projected[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw projected nodes with 3D depth coloring
      projected.forEach((p) => {
        let color = 'rgba(217, 119, 6, '; // Bronze
        if (p.zone === 'silver') color = 'rgba(148, 163, 184, '; // Silver
        if (p.zone === 'gold') color = 'rgba(245, 158, 11, '; // Gold

        const alpha = Math.max(0.15, Math.min(0.9, (p.scale - 0.4) * 1.5));
        ctx.fillStyle = color + alpha + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size), 0, Math.PI * 2);
        ctx.fill();

        // Glowing halo for prominent foreground particles
        if (p.scale > 0.85) {
          ctx.fillStyle = color + (alpha * 0.25) + ')';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [rotation.x, rotation.y]);

  return (
    <div 
      className="rl-3d-scene-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Background Orbital Particle Matrix */}
      <canvas ref={canvasRef} className="rl-3d-canvas" />

      {/* 3D Isometric Holographic Medallion Platform */}
      <div 
        className="rl-3d-perspective-stage"
        style={{
          transform: `perspective(1100px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
        }}
      >
        {/* Vertical Core Data Laser passing through all 3 zones */}
        <div className="rl-3d-central-laser" />

        {/* Orbiting 3D Ring 1 */}
        <div className="rl-3d-orbital-ring ring-outer" />
        <div className="rl-3d-orbital-ring ring-middle" />

        {/* 3D Layer 1: GOLD ZONE (Top, Z = +80px) */}
        <div 
          className={`rl-3d-layer layer-gold ${activeZone === 'gold' ? 'active-layer' : ''}`}
          style={{ transform: 'translateZ(75px)' }}
          onClick={() => setActiveZone('gold')}
        >
          <div className="rl-layer-surface">
            <div className="rl-layer-glow gold-glow" />
            <div className="rl-layer-content">
              <div className="rl-layer-header">
                <span className="rl-layer-badge gold">GOLD ZONE</span>
                <span className="rl-layer-coord">Z: +75px</span>
              </div>
              <div className="rl-layer-title">Executive BI & Analytics</div>
              <div className="rl-layer-sub">Sub-second Aggregated Tables</div>
              <div className="rl-layer-metric-pill">
                <span>⚡ Latency: 142ms</span>
                <span>•</span>
                <span>Ready for ML/BI</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Layer 2: SILVER ZONE (Middle, Z = +20px) */}
        <div 
          className={`rl-3d-layer layer-silver ${activeZone === 'silver' ? 'active-layer' : ''}`}
          style={{ transform: 'translateZ(15px)' }}
          onClick={() => setActiveZone('silver')}
        >
          <div className="rl-layer-surface">
            <div className="rl-layer-glow silver-glow" />
            <div className="rl-layer-content">
              <div className="rl-layer-header">
                <span className="rl-layer-badge silver">SILVER ZONE</span>
                <span className="rl-layer-coord">Z: +15px</span>
              </div>
              <div className="rl-layer-title">Cleaned & Partitioned</div>
              <div className="rl-layer-sub">Enriched Schemas with Indexing</div>
              <div className="rl-layer-metric-pill">
                <span>📁 Partition: /region=*</span>
                <span>•</span>
                <span>Deduplicated</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Layer 3: BRONZE ZONE (Bottom, Z = -45px) */}
        <div 
          className={`rl-3d-layer layer-bronze ${activeZone === 'bronze' ? 'active-layer' : ''}`}
          style={{ transform: 'translateZ(-45px)' }}
          onClick={() => setActiveZone('bronze')}
        >
          <div className="rl-layer-surface">
            <div className="rl-layer-glow bronze-glow" />
            <div className="rl-layer-content">
              <div className="rl-layer-header">
                <span className="rl-layer-badge bronze">BRONZE ZONE</span>
                <span className="rl-layer-coord">Z: -45px</span>
              </div>
              <div className="rl-layer-title">Raw Landing Stream</div>
              <div className="rl-layer-sub">Unvalidated Source Fidelity</div>
              <div className="rl-layer-metric-pill">
                <span>📥 CSV • Parquet • JSON</span>
                <span>•</span>
                <span>Zero Mutation</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Isometric Base Pedestal */}
        <div className="rl-3d-base-grid" style={{ transform: 'translateZ(-75px)' }}>
          <div className="rl-grid-lines" />
        </div>
      </div>

      {/* Interactive 3D Status Overlay Bar */}
      <div className="rl-3d-hud-overlay">
        <div className="rl-hud-left">
          <span className="rl-hud-dot" />
          <span className="rl-hud-title">3D Lakehouse Hologram</span>
          <span className="rl-hud-hint">
            {isHovered ? 'Active Mouse Parallax (Tilt: X ' + Math.round(rotation.x) + '° / Y ' + Math.round(rotation.y) + '°)' : 'Hover to tilt & rotate 3D stack'}
          </span>
        </div>

        <div className="rl-hud-actions">
          <button 
            className={`rl-hud-btn ${activeZone === 'bronze' ? 'active' : ''}`}
            onClick={() => setActiveZone('bronze')}
          >
            Bronze
          </button>
          <button 
            className={`rl-hud-btn ${activeZone === 'silver' ? 'active' : ''}`}
            onClick={() => setActiveZone('silver')}
          >
            Silver
          </button>
          <button 
            className={`rl-hud-btn ${activeZone === 'gold' ? 'active' : ''}`}
            onClick={() => setActiveZone('gold')}
          >
            Gold
          </button>
        </div>
      </div>
    </div>
  );
};
