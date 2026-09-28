'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  Mic,
  Cpu,
  MapPin,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  BarChart3,
  Users,
  ChevronDown
} from 'lucide-react';
import { getAnalyticsOverview, AnalyticsOverview } from '@/lib/api';

export default function StoryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    getAnalyticsOverview()
      .then((data) => setOverview(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // 1. Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    // 2. Set up Three.js Scene, Camera, Renderer
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060913, 0.035);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00e5ff, 40, 50);
    pointLight1.position.set(5, 5, 8);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xf59e0b, 30, 50);
    pointLight2.position.set(-6, -4, 6);
    scene.add(pointLight2);

    // =========================================================================
    // PROCEDURAL GEOMETRIES FOR THE 5 BEATS
    // =========================================================================

    // BEAT 1: Scattered Citizen Voices Particle Cloud
    const particleCount = 1000;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleOrigins = new Float32Array(particleCount * 3);
    const particleTargets = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      // Scattered initial field (Beat 1 start)
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.cbrt(Math.random()) * 16;
      const sinPhi = Math.sin(phi);

      const px = r * sinPhi * Math.cos(theta);
      const py = r * sinPhi * Math.sin(theta);
      const pz = (Math.random() - 0.5) * 12;

      particlePositions[idx] = px;
      particlePositions[idx + 1] = py;
      particlePositions[idx + 2] = pz;

      particleOrigins[idx] = px;
      particleOrigins[idx + 1] = py;
      particleOrigins[idx + 2] = pz;

      // Coalesced central pin position (Beat 1 end)
      const pinAngle = Math.random() * Math.PI * 2;
      const pinRadius = Math.random() * 0.8;
      particleTargets[idx] = Math.cos(pinAngle) * pinRadius;
      particleTargets[idx + 1] = Math.sin(pinAngle) * pinRadius + (Math.random() * 2 - 1);
      particleTargets[idx + 2] = (Math.random() - 0.5) * 1.5;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00e5ff,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    const particleGroup = new THREE.Group();
    particleGroup.add(particles);
    scene.add(particleGroup);

    // BEAT 2: Speech Bubble / Semantic Morphing Nodes
    const centralSphereGeo = new THREE.IcosahedronGeometry(1.5, 3);
    const centralSphereMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0
    });
    const centralNode = new THREE.Mesh(centralSphereGeo, centralSphereMat);
    scene.add(centralNode);

    // Semantic vector shards orbiting central node
    const shardGroup = new THREE.Group();
    const shardGeo = new THREE.ConeGeometry(0.18, 0.5, 4);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const shards: THREE.Mesh[] = [];
    for (let i = 0; i < 30; i++) {
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = (i / 30) * Math.PI * 2;
      const dist = 3.0 + (i % 3) * 0.4;
      shard.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, (Math.random() - 0.5) * 2);
      shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      shardGroup.add(shard);
      shards.push(shard);
    }
    shardGroup.visible = false;
    scene.add(shardGroup);

    // BEAT 3: Abstract Geospatial Grid Plane
    const gridHelper = new THREE.GridHelper(24, 24, 0x00e5ff, 0x1e293b);
    gridHelper.position.set(0, -4, 0);
    gridHelper.rotation.x = Math.PI / 10;
    gridHelper.visible = false;
    scene.add(gridHelper);

    // Hotspot cluster indicator rings
    const hotspotRingGeo = new THREE.RingGeometry(0.8, 1.0, 32);
    const hotspotRingMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const hotspotRing = new THREE.Mesh(hotspotRingGeo, hotspotRingMat);
    hotspotRing.rotation.x = -Math.PI / 2 + Math.PI / 10;
    hotspotRing.position.set(0, -3.9, 0);
    hotspotRing.visible = false;
    scene.add(hotspotRing);

    // BEAT 4: Explainable Priority & Digital Divide Dual Rings
    const priorityGroup = new THREE.Group();
    priorityGroup.position.set(3, 0, 2);
    priorityGroup.visible = false;

    // Primary Citizen Demand Arc (Cyan)
    const arc1Geo = new THREE.TorusGeometry(2.2, 0.12, 16, 64, Math.PI * 1.4);
    const arc1Mat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.9,
      roughness: 0.3
    });
    const arc1 = new THREE.Mesh(arc1Geo, arc1Mat);
    priorityGroup.add(arc1);

    // Digital Divide Correction Arc (Amber) - §4 explicit differentiator
    const arc2Geo = new THREE.TorusGeometry(1.6, 0.14, 16, 64, Math.PI * 0.7);
    const arc2Mat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.2,
      roughness: 0.2
    });
    const arc2 = new THREE.Mesh(arc2Geo, arc2Mat);
    arc2.rotation.z = Math.PI * 0.9;
    priorityGroup.add(arc2);
    scene.add(priorityGroup);

    // BEAT 5: Human Decision Checkmark Emblem
    const decisionGroup = new THREE.Group();
    decisionGroup.position.set(0, 0.5, 3);
    decisionGroup.visible = false;

    const ringShieldGeo = new THREE.TorusGeometry(2.0, 0.1, 16, 64);
    const ringShieldMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.9,
      roughness: 0.3
    });
    const ringShield = new THREE.Mesh(ringShieldGeo, ringShieldMat);
    decisionGroup.add(ringShield);

    // Checkmark geometry constructed with cylinder primitives
    const checkStem1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.2 })
    );
    checkStem1.position.set(-0.5, -0.2, 0);
    checkStem1.rotation.z = -Math.PI / 4;
    decisionGroup.add(checkStem1);

    const checkStem2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 2.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.2 })
    );
    checkStem2.position.set(0.5, 0.2, 0);
    checkStem2.rotation.z = Math.PI / 4;
    decisionGroup.add(checkStem2);

    scene.add(decisionGroup);

    // =========================================================================
    // GSAP SCROLLTRIGGER CHOREOGRAPHY ACROSS 5 BEATS
    // =========================================================================
    const storyTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        }
      }
    });

    // Beat 1 -> Beat 2 Transition (0.0 to 0.25)
    storyTimeline
      .to(camera.position, { z: 12, y: 0.5, ease: 'power1.inOut' }, 0)
      .to(centralSphereMat, { opacity: 0.9, ease: 'power2.inOut' }, 0.15)
      .to(particleGroup.rotation, { y: Math.PI * 0.8, x: 0.4 }, 0)

      // Beat 2 -> Beat 3 Transition (0.25 to 0.50)
      .call(() => { shardGroup.visible = true; }, [], 0.22)
      .to(centralNode.scale, { x: 1.6, y: 1.6, z: 1.6, ease: 'power2.out' }, 0.25)
      .to(shardGroup.scale, { x: 1.4, y: 1.4, z: 1.4, ease: 'power1.out' }, 0.3)
      .to(camera.position, { x: 1, y: 2, z: 14, ease: 'power1.inOut' }, 0.3)

      // Beat 3 -> Beat 4 Transition (0.50 to 0.75)
      .call(() => {
        gridHelper.visible = true;
        hotspotRing.visible = true;
      }, [], 0.48)
      .to(camera.position, { x: 0, y: 4, z: 11, ease: 'power2.inOut' }, 0.5)
      .to(camera.rotation, { x: -0.28, ease: 'power2.inOut' }, 0.5)
      .to(hotspotRingMat, { opacity: 0.85, ease: 'power1.in' }, 0.52)
      .call(() => { priorityGroup.visible = true; }, [], 0.65)
      .to(priorityGroup.rotation, { z: Math.PI * 2, ease: 'power1.inOut' }, 0.68)
      .to(arc2.rotation, { z: Math.PI * 1.5, ease: 'back.out(1.5)' }, 0.72)

      // Beat 4 -> Beat 5 Transition (0.75 to 1.0)
      .call(() => { decisionGroup.visible = true; }, [], 0.82)
      .to(camera.position, { x: 0, y: 0.8, z: 7.5, ease: 'power2.inOut' }, 0.85)
      .to(camera.rotation, { x: 0, ease: 'power2.inOut' }, 0.85)
      .to(ringShield.rotation, { z: Math.PI * 2, ease: 'power2.out' }, 0.88)
      .to(decisionGroup.scale, { x: 1.15, y: 1.15, z: 1.15, ease: 'back.out(2)' }, 0.92);

    // 4. Render / Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Continuous subtle ambient procedural rotations
      particles.rotation.y += 0.001;
      centralNode.rotation.y += 0.008;
      centralNode.rotation.x += 0.004;

      shards.forEach((shard, i) => {
        shard.rotation.x += 0.01;
        shard.rotation.y += 0.015;
      });

      if (hotspotRing.visible) {
        const pulse = 1 + Math.sin(elapsed * 3) * 0.08;
        hotspotRing.scale.set(pulse, pulse, 1);
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 5. Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 6. Mandatory WebGL Resource Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      // Kill Lenis & ScrollTrigger
      lenis.destroy();
      storyTimeline.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      gsap.ticker.remove(updateLenis);
      gsap.ticker.lagSmoothing(500, 33);

      // Dispose Geometries & Materials
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh ||
          obj instanceof THREE.Points ||
          obj instanceof THREE.LineSegments ||
          obj instanceof THREE.Line
        ) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full bg-[#060913]">
      {/* Fixed 3D Canvas Background */}
      <div
        ref={canvasContainerRef}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Floating HUD Progress Bar */}
      <div className="fixed top-20 right-6 z-30 hidden md:flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-800 shadow-xl">
        <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider">
          STORY PIPELINE
        </span>
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-cyan-400 to-amber-400 transition-all duration-75"
            style={{ width: `${Math.min(100, Math.max(0, scrollProgress * 100))}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-300">
          {(scrollProgress * 100).toFixed(0)}%
        </span>
      </div>

      {/* 5 SCROLL STORY BEATS CONTENT PANELS (Overlaid in DOM) */}

      {/* BEAT 1: The Citizen Voice */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-8 max-w-7xl mx-auto z-10">
        <div className="max-w-xl space-y-5 bg-[#0c1222]/85 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-mono text-cyan-300 font-bold">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            BEAT 01 • THE SCATTERED SIGNAL
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Citizen Distress Signals Dispersed Across Rural India
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            In remote hamlets like Bhamragad and Shirur, broken water filtration networks, collapsed culverts, and blackouts go unnoticed because traditional bureaucratic portals require literacy, smartphones, and official terminology.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-mono text-slate-400">
            <ChevronDown className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>Scroll down to initiate AI ingestion</span>
          </div>
        </div>
      </section>

      {/* BEAT 2: Multimodal AI Understanding */}
      <section className="relative min-h-screen flex items-center justify-end px-4 sm:px-8 max-w-7xl mx-auto z-10">
        <div className="max-w-xl space-y-5 bg-[#0c1222]/85 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-mono text-purple-300 font-bold">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            BEAT 02 • MULTIMODAL GEMINI EXTRACTION
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Raw Vernacular Voice Transformed into Structured Evidence
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Google Gemini 2.5 Flash ingests audio recordings in Marathi, Hindi, and English. It extracts civic category, severity scores, and validates citizen photographs against computer vision fraud models — discarding spam and stock photos instantly.
          </p>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400 space-y-1">
            <div className="text-purple-300">✓ Vernacular Whisper/Gemini STT</div>
            <div className="text-purple-300">✓ Automated category &amp; urgency vectorization</div>
            <div className="text-emerald-400">✓ Computer Vision Pothole / Pipe Integrity Validated</div>
          </div>
        </div>
      </section>

      {/* BEAT 3: Spatial Convergence / DBSCAN Clustering */}
      <section className="relative min-h-screen flex items-center px-4 sm:px-8 max-w-7xl mx-auto z-10">
        <div className="max-w-xl space-y-5 bg-[#0c1222]/85 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-mono text-blue-300 font-bold">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            BEAT 03 • GEOSPATIAL DEDUPLICATION &amp; CLUSTERING
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Thousands of Requests Converge onto Census Coordinates
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Using spatial DBSCAN (<code className="text-cyan-300 font-mono">eps=0.035</code>) and semantic embeddings, CivicPulse clusters raw citizen complaints into geographic hotspot nodes across vulnerable village boundaries. Duplicate complaints amplify demand rather than clutter the queue.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Total Ingested Reports</span>
              <span className="text-xl font-mono font-bold text-white">
                {overview ? overview.total_requests.toLocaleString() : '4,000+'}
              </span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-cyan-400 block text-[10px] uppercase font-mono">Active Clusters</span>
              <span className="text-xl font-mono font-bold text-cyan-300">
                {overview ? `${overview.active_hotspots} Hotspots` : 'Verified Hotspots'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BEAT 4: Explainable Priority & Digital Divide Correction */}
      <section className="relative min-h-screen flex items-center justify-end px-4 sm:px-8 max-w-7xl mx-auto z-10">
        <div className="max-w-xl space-y-5 bg-[#0c1222]/85 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-mono text-amber-300 font-bold">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            BEAT 04 • EXPLAINABLE PRIORITY ALLOCATION
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Digital-Divide Correction Prevents Urban Bias
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            In standard systems, wealthy smartphone-connected urban zones submit 10x more complaints and take all the funding. CivicPulse joins citizen signals with district census internet penetration indices.
          </p>
          <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-xl text-xs space-y-2">
            <div className="flex flex-wrap justify-between items-center text-amber-300 font-bold font-mono gap-1">
              <span className="text-[11px] uppercase tracking-wide">Case Study: Bhamragad Block, Gadchiroli</span>
              <span>+6.0 Points Added</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              In this verified benchmark, a low tele-density index (38.0/100) triggers an automatic mathematical boost, ensuring remote tribal drinking water crises rank above urban cosmetic paving.
            </p>
          </div>
        </div>
      </section>

      {/* BEAT 5: Human Decision & Actionable Governance */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-8 max-w-7xl mx-auto z-10">
        <div className="max-w-2xl text-center space-y-6 bg-[#0c1222]/90 backdrop-blur-md p-8 sm:p-12 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1 rounded-full text-xs font-mono text-emerald-300 font-bold mx-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            BEAT 05 • ACTIONABLE HUMAN GOVERNANCE (§29)
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Transparent Policy Decision with Immutable Audit Trail
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            AI provides decision support and simulation — never autonomous budget disbursal. District Magistrates inspect synthesized evidence and approve projects with full legal accountability.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/citizen"
              className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2 transition shadow-[0_0_20px_rgba(0,229,255,0.35)]"
            >
              <Users className="w-4 h-4" /> Enter Citizen Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 flex items-center gap-2 transition"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Policymaker Dashboard
            </Link>
            <Link
              href="/admin"
              className="px-5 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded-xl border border-slate-800 flex items-center gap-2 transition"
            >
              Admin Console
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
