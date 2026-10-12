import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import './Animated3DBackground.css';

/**
 * Animated3DBackground
 * High-Visibility, Fully Responsive 3D Topographic Data Lake & Floating Polyhedra Mesh
 * Distinct, bold, and clearly visible across Mobile (320px) to 4K Ultra-wide (2560px+)
 */
export const Animated3DBackground = () => {
  const canvasRef = useRef(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Track responsiveness categories
    let isMobile = false;
    let isTablet = false;

    // Handle high-DPI crisp rendering and responsive window resize
    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      isMobile = width < 768;
      isTablet = width >= 768 && width < 1200;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset scale
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Mouse parallax tracking with smooth lerp
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / width - 0.5) * 2;
      mouse.targetY = (e.clientY / height - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Check for user reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 3D Octahedron Geometry (Crystalline data nodes)
    const octahedronVertices = [
      { x: 0, y: -1, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: -1 },
      { x: 0, y: 1, z: 0 }
    ];

    const octahedronEdges = [
      [0, 1], [0, 2], [0, 3], [0, 4], // Top pyramid
      [5, 1], [5, 2], [5, 3], [5, 4], // Bottom pyramid
      [1, 2], [2, 3], [3, 4], [4, 1]  // Equator
    ];

    // 3D Cube Geometry (Data block units)
    const cubeVertices = [
      { x: -0.7, y: -0.7, z: -0.7 },
      { x:  0.7, y: -0.7, z: -0.7 },
      { x:  0.7, y:  0.7, z: -0.7 },
      { x: -0.7, y:  0.7, z: -0.7 },
      { x: -0.7, y: -0.7, z:  0.7 },
      { x:  0.7, y: -0.7, z:  0.7 },
      { x:  0.7, y:  0.7, z:  0.7 },
      { x: -0.7, y:  0.7, z:  0.7 }
    ];

    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0], // Front face
      [4, 5], [5, 6], [6, 7], [7, 4], // Back face
      [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting pillars
    ];

    // Data Packets traveling down grid longitude streams
    const packets = Array.from({ length: 14 }).map((_, i) => ({
      col: (i * 2 + 1) % 24,
      rowProgress: Math.random() * 20,
      speed: 0.08 + Math.random() * 0.06,
      size: 3 + Math.random() * 2.5
    }));

    // Ambient 3D floating dust nodes
    const ambientNodes = Array.from({ length: 28 }).map(() => ({
      x: (Math.random() - 0.5) * 1400,
      y: (Math.random() - 0.5) * 800 - 150,
      z: Math.random() * 600 + 100,
      size: Math.random() * 2.5 + 1.2,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.25
    }));

    let time = 0;

    // Main 3D Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      time += prefersReducedMotion ? 0.003 : 0.016;

      // Smooth mouse damping
      mouse.x += (mouse.targetX - mouse.x) * 0.045;
      mouse.y += (mouse.targetY - mouse.y) * 0.045;

      const fov = 420;
      const cameraY = (isMobile ? 190 : 150) + mouse.y * 40;
      const cameraPitch = 0.36 + mouse.y * 0.1;
      const cameraYaw = mouse.x * 0.16;

      const cosPitch = Math.cos(cameraPitch);
      const sinPitch = Math.sin(cameraPitch);
      const cosYaw = Math.cos(cameraYaw);
      const sinYaw = Math.sin(cameraYaw);

      // Vanishing perspective center point
      const cx = width / 2;
      const cy = height * (isMobile ? 0.46 : 0.5);

      // Project 3D point (x, y, z) into 2D screen coordinates with atmospheric attenuation
      const project = (px, py, pz) => {
        const x1 = px * cosYaw - pz * sinYaw;
        const z1 = pz * cosYaw + px * sinYaw;

        const y2 = py * cosPitch - z1 * sinPitch;
        const z2 = z1 * cosPitch + py * sinPitch;

        const depth = z2 + 480;
        if (depth <= 10) return null;

        const scale = fov / depth;
        return {
          x: cx + x1 * scale,
          y: cy + y2 * scale,
          scale,
          depth,
          alpha: Math.max(0, Math.min(1, 1 - (depth - 150) / 1050))
        };
      };

      // Responsive Grid Calculations
      const cols = isMobile ? 18 : isTablet ? 24 : 30;
      const rows = isMobile ? 16 : 22;
      const gridSpanX = width * (isMobile ? 1.5 : 1.7);
      const spacingX = gridSpanX / (cols - 1);
      const spacingZ = Math.max(52, Math.min(85, height * 0.075));
      const offsetX = gridSpanX / 2;
      const offsetZ = isMobile ? 80 : 110;

      // Color Tokens for Dark & Light Themes
      const latitudeStroke = isDark
        ? { base: 'rgba(147, 51, 234, ', peak: 'rgba(59, 130, 246, ' } // Violet to Azure
        : { base: 'rgba(212, 175, 55, ', peak: 'rgba(37, 99, 235, ' };  // Imperial Gold to Sapphire

      const longitudeStroke = isDark
        ? 'rgba(56, 189, 248, '  // Cyan stream
        : 'rgba(245, 158, 11, ';  // Amber stream

      const nodeColor = isDark
        ? 'rgba(168, 85, 247, '
        : 'rgba(217, 119, 6, ';

      // 1. Compute Undulating 3D Grid Coordinates
      const gridPoints = [];
      for (let r = 0; r < rows; r++) {
        gridPoints[r] = [];
        for (let c = 0; c < cols; c++) {
          const worldX = c * spacingX - offsetX;
          const worldZ = r * spacingZ + offsetZ;

          // Multi-frequency wave formula simulating fluid data lake surface
          const wave1 = Math.sin(worldX * 0.0032 + time * 1.3) * (isMobile ? 26 : 38);
          const wave2 = Math.cos(worldZ * 0.0055 + time * 1.0) * (isMobile ? 22 : 30);
          const wave3 = Math.sin((worldX + worldZ) * 0.0028 + time * 0.7) * (isMobile ? 14 : 22);
          const worldY = cameraY + wave1 + wave2 + wave3;

          gridPoints[r][c] = project(worldX, worldY, worldZ);
        }
      }

      // 2. Draw 3D Topographic Latitude Curves
      for (let r = 0; r < rows; r++) {
        ctx.beginPath();
        let started = false;
        let avgAlpha = 0;
        let count = 0;

        for (let c = 0; c < cols; c++) {
          const p = gridPoints[r][c];
          if (!p) continue;
          avgAlpha += p.alpha;
          count++;

          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }

        if (started && count > 0) {
          const meanAlpha = avgAlpha / count;
          // Front rows have bold prominent stroke, tapering gracefully into depth
          const depthRatio = 1 - r / rows;
          const alpha = meanAlpha * (isDark ? (0.35 + depthRatio * 0.4) : (0.28 + depthRatio * 0.42));
          ctx.lineWidth = Math.max(1.2, 2.6 * depthRatio);
          ctx.strokeStyle = `${latitudeStroke.base}${Math.min(0.85, alpha).toFixed(3)})`;
          ctx.stroke();
        }
      }

      // 3. Draw 3D Longitude Perspective Streams
      const colStep = isMobile ? 2 : 2;
      for (let c = 0; c < cols; c += colStep) {
        ctx.beginPath();
        let started = false;
        let avgAlpha = 0;
        let count = 0;

        for (let r = 0; r < rows; r++) {
          const p = gridPoints[r][c];
          if (!p) continue;
          avgAlpha += p.alpha;
          count++;

          if (!started) {
            ctx.moveTo(p.x, p.y);
            started = true;
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }

        if (started && count > 0) {
          const alpha = (avgAlpha / count) * (isDark ? 0.35 : 0.3);
          ctx.lineWidth = Math.max(1.0, isDark ? 1.6 : 1.4);
          ctx.strokeStyle = `${longitudeStroke}${Math.min(0.65, alpha).toFixed(3)})`;
          ctx.stroke();
        }
      }

      // 4. Draw Luminous 3D Intersection Nodes
      for (let r = 0; r < rows; r += 2) {
        for (let c = 0; c < cols; c += (isMobile ? 3 : 2)) {
          const p = gridPoints[r][c];
          if (!p || p.alpha < 0.15) continue;

          const dotRadius = Math.max(2, p.scale * (isDark ? 4.5 : 3.8));
          const dotAlpha = p.alpha * (isDark ? 0.8 : 0.65);

          // Glowing Core Dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `${nodeColor}${dotAlpha.toFixed(3)})`;
          ctx.fill();

          // Ambient Pulsing Aureole
          if ((r + c) % 4 === 0 && !prefersReducedMotion) {
            const pulse = (Math.sin(time * 3.2 + r * 1.5 + c) + 1) * 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, dotRadius + pulse * 6, 0, Math.PI * 2);
            ctx.strokeStyle = `${nodeColor}${(dotAlpha * 0.45).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // 5. Draw Traveling Data Packets (Simulating Active Query/Ingestion Streams)
      packets.forEach((pkt) => {
        if (!prefersReducedMotion) {
          pkt.rowProgress = (pkt.rowProgress + pkt.speed) % (rows - 1);
        }

        const r1 = Math.floor(pkt.rowProgress);
        const r2 = r1 + 1;
        const fract = pkt.rowProgress - r1;

        if (r2 < rows && gridPoints[r1] && gridPoints[r2]) {
          const cIndex = pkt.col % cols;
          const p1 = gridPoints[r1][cIndex];
          const p2 = gridPoints[r2][cIndex];

          if (p1 && p2) {
            const px = p1.x + (p2.x - p1.x) * fract;
            const py = p1.y + (p2.y - p1.y) * fract;
            const pScale = p1.scale + (p2.scale - p1.scale) * fract;

            ctx.beginPath();
            ctx.arc(px, py, Math.max(2.5, pkt.size * pScale), 0, Math.PI * 2);
            ctx.fillStyle = isDark ? '#38BDF8' : '#F59E0B';
            ctx.shadowBlur = 10;
            ctx.shadowColor = isDark ? '#06B6D4' : '#D97706';
            ctx.fill();
            ctx.shadowBlur = 0; // reset
          }
        }
      });

      // 6. Draw Strategic 3D Floating Polyhedra (Data Crystals & Cubes)
      // Responsive dynamic positioning distributed across viewport quadrants
      const crystalScale = Math.max(34, Math.min(75, width * 0.042));
      const floatingObjects = [
        // Top Left: Large Octahedron Crystal
        { type: 'octa', x: -width * 0.38, y: -height * 0.28, z: 280, size: crystalScale * 1.1, rotSpeed: 0.012 },
        // Top Right: Large Rotating Cube
        { type: 'cube', x: width * 0.38, y: -height * 0.26, z: 320, size: crystalScale * 1.0, rotSpeed: 0.01 },
        // Mid Left: Medium Octahedron
        { type: 'octa', x: -width * 0.42, y: height * 0.05, z: 240, size: crystalScale * 0.85, rotSpeed: 0.015 },
        // Mid Right: Medium Octahedron
        { type: 'octa', x: width * 0.42, y: height * 0.08, z: 260, size: crystalScale * 0.9, rotSpeed: 0.014 },
        // Deep Horizon Anchor
        { type: 'cube', x: 0, y: -height * 0.35, z: 620, size: crystalScale * 1.3, rotSpeed: 0.008 }
      ];

      floatingObjects.forEach((obj, idx) => {
        const rotX = time * obj.rotSpeed * 40 + idx;
        const rotY = time * obj.rotSpeed * 55 + idx * 2;
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);

        const verticesDef = obj.type === 'octa' ? octahedronVertices : cubeVertices;
        const edgesDef = obj.type === 'octa' ? octahedronEdges : cubeEdges;

        // Floating hover vertical bobbing
        const floatY = obj.y + Math.sin(time * 1.4 + idx * 1.8) * 16;

        // Project 3D rotated vertices
        const projected = verticesDef.map((v) => {
          const y1 = v.y * cosX - v.z * sinX;
          const z1 = v.z * cosX + v.y * sinX;

          const x2 = v.x * cosY - z1 * sinY;
          const z2 = z1 * cosY + v.x * sinY;

          const wx = obj.x + x2 * obj.size;
          const wy = floatY + y1 * obj.size;
          const wz = obj.z + z2 * obj.size;

          return project(wx, wy, wz);
        });

        // Draw Wireframe Edges
        ctx.lineWidth = Math.max(1.4, isDark ? 1.8 : 1.6);
        edgesDef.forEach(([i1, i2]) => {
          const p1 = projected[i1];
          const p2 = projected[i2];
          if (!p1 || !p2) return;

          const edgeAlpha = Math.min(p1.alpha, p2.alpha) * (isDark ? 0.75 : 0.65);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = isDark
            ? `rgba(167, 139, 250, ${edgeAlpha.toFixed(3)})`
            : `rgba(212, 175, 55, ${edgeAlpha.toFixed(3)})`;
          ctx.stroke();
        });

        // Radiant Crystal Core Glow
        const center = project(obj.x, floatY, obj.z);
        if (center) {
          ctx.beginPath();
          ctx.arc(center.x, center.y, center.scale * (obj.size * 0.16), 0, Math.PI * 2);
          ctx.fillStyle = isDark ? '#A855F7' : '#D4AF37';
          ctx.shadowBlur = 14;
          ctx.shadowColor = isDark ? '#C084FC' : '#F59E0B';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 7. Ambient Drifting Data Sparks
      ambientNodes.forEach((node) => {
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < -width) node.x = width;
          if (node.x > width) node.x = -width;
          if (node.y < -height) node.y = height;
          if (node.y > height) node.y = -height;
        }

        const p = project(node.x, node.y, node.z);
        if (p && p.alpha > 0.1) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1.2, node.size * p.scale), 0, Math.PI * 2);
          ctx.fillStyle = isDark
            ? `rgba(192, 132, 252, ${(p.alpha * 0.55).toFixed(3)})`
            : `rgba(212, 175, 55, ${(p.alpha * 0.45).toFixed(3)})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDark]);

  return (
    <div className="rl-3d-bg-wrapper" aria-hidden="true">
      <div className={`rl-3d-bg-gradient-overlay ${isDark ? 'dark' : 'light'}`} />
      <canvas ref={canvasRef} className="rl-3d-bg-canvas" />
    </div>
  );
};
