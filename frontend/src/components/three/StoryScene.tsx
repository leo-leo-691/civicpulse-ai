'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
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
import { getAnalyticsOverview, getHotspots, AnalyticsOverview, Hotspot } from '@/lib/api';

const CountUp = ({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || value === undefined) return;
    gsap.fromTo(ref.current, { innerHTML: 0 }, {
      innerHTML: value,
      duration: 2,
      ease: "power2.out",
      snap: { innerHTML: decimals === 0 ? 1 : 0.1 },
      onUpdate: function() {
        if (ref.current) ref.current.innerHTML = prefix + Number(this.targets()[0].innerHTML).toFixed(decimals) + suffix;
      },
      scrollTrigger: {
        trigger: ref.current,
        start: "top 80%"
      }
    });
  }, [value, prefix, suffix, decimals]);
  return <span ref={ref}>0</span>;
};

export default function StoryScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const threeRefs = useRef<{ arc1?: THREE.Mesh, arc2?: THREE.Mesh, hotspotRings: THREE.Mesh[] }>({ hotspotRings: [] });

  useEffect(() => {
    getAnalyticsOverview().then(setOverview).catch(() => {});
    getHotspots().then(setHotspots).catch(() => {});
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

    const cameraGroup = new THREE.Group();
    scene.add(cameraGroup);
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    cameraGroup.add(camera);

    const cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 18),
      new THREE.Vector3(0, 0.5, 12),
      new THREE.Vector3(1, 2, 14),
      new THREE.Vector3(0, 4, 11),
      new THREE.Vector3(0, 0.8, 7.5)
    ]);
    const cameraProxy = { progress: 0 };
    cameraPath.getPointAt(0, cameraGroup.position);

    let targetX = 0;
    let targetY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

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

    // Post-processing setup (Device-tier check + Bloom)
    const isHighTier = typeof navigator !== 'undefined' && navigator.hardwareConcurrency > 4 && !/Mobi|Android/i.test(navigator.userAgent);
    
    let composer: EffectComposer | null = null;
    if (isHighTier) {
      composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);
      
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.6, 0.4, 0.85);
      composer.addPass(bloomPass);
    }

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
    particleGeo.setAttribute('aTarget', new THREE.BufferAttribute(particleTargets, 3));

    const particleMat = new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 0.0 },
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0x00e5ff) },
        uSize: { value: 60.0 * Math.min(window.devicePixelRatio, 2.0) }
      },
      vertexShader: `
        uniform float uProgress;
        uniform float uTime;
        uniform float uSize;
        attribute vec3 aTarget;
        void main() {
          // Subtle organic wobble during transition
          float noise = sin(position.x * 2.0 + uTime * 2.0) * 0.1;
          float individualProgress = clamp(uProgress + noise * uProgress * (1.0 - uProgress), 0.0, 1.0);
          
          vec3 currentPos = mix(position, aTarget, individualProgress);
          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          
          gl_PointSize = uSize * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          
          float alpha = smoothstep(0.5, 0.2, dist);
          gl_FragColor = vec4(uColor, alpha * 0.85);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
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
    const shardMat = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0
    });
    const shardInstancedMesh = new THREE.InstancedMesh(shardGeo, shardMat, 30);
    shardInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const shardDummies: THREE.Object3D[] = [];
    for (let i = 0; i < 30; i++) {
      const dummy = new THREE.Object3D();
      const angle = (i / 30) * Math.PI * 2;
      const dist = 3.0 + (i % 3) * 0.4;
      dummy.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist, (Math.random() - 0.5) * 2);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      dummy.updateMatrix();
      shardInstancedMesh.setMatrixAt(i, dummy.matrix);
      shardDummies.push(dummy);
    }
    shardGroup.add(shardInstancedMesh);
    scene.add(shardGroup);

    // BEAT 3: Abstract Geospatial Grid Plane
    const gridHelper = new THREE.GridHelper(24, 24, 0x00e5ff, 0x1e293b);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0;
    gridHelper.position.set(0, -4, 0);
    gridHelper.rotation.x = Math.PI / 10;
    scene.add(gridHelper);

    // Hotspot cluster indicator rings
    const hotspotRingGeo = new THREE.RingGeometry(0.8, 1.0, 32);
    const hotspotRingMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0
    });
    const hotspotRings: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i++) {
      const ring = new THREE.Mesh(hotspotRingGeo, hotspotRingMat);
      ring.rotation.x = -Math.PI / 2 + Math.PI / 10;
      ring.position.set(0, -3.9, 0);
      ring.visible = false;
      scene.add(ring);
      hotspotRings.push(ring);
    }
    threeRefs.current.hotspotRings = hotspotRings;

    // BEAT 4: Explainable Priority & Digital Divide Dual Rings
    const priorityGroup = new THREE.Group();
    priorityGroup.position.set(3, 0, 2);

    // Primary Citizen Demand Arc (Cyan)
    const arc1Geo = new THREE.TorusGeometry(2.2, 0.12, 16, 64, Math.PI * 1.4);
    const arc1Mat = new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0
    });
    const arc1 = new THREE.Mesh(arc1Geo, arc1Mat);
    priorityGroup.add(arc1);
    threeRefs.current.arc1 = arc1;

    // Digital Divide Correction Arc (Amber) - §4 explicit differentiator
    const arc2Geo = new THREE.TorusGeometry(1.6, 0.14, 16, 64, Math.PI * 0.7);
    const arc2Mat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0
    });
    const arc2 = new THREE.Mesh(arc2Geo, arc2Mat);
    arc2.rotation.z = Math.PI * 0.9;
    priorityGroup.add(arc2);
    threeRefs.current.arc2 = arc2;
    scene.add(priorityGroup);

    // BEAT 5: Human Decision Checkmark Emblem
    const decisionGroup = new THREE.Group();
    decisionGroup.position.set(0, 0.5, 3);

    const ringShieldGeo = new THREE.TorusGeometry(2.0, 0.1, 16, 64);
    const ringShieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0
    });
    const ringShield = new THREE.Mesh(ringShieldGeo, ringShieldMat);
    decisionGroup.add(ringShield);

    const checkStemMat = new THREE.MeshPhysicalMaterial({ 
      color: 0x10b981, 
      emissive: 0x10b981, 
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0
    });

    // Checkmark geometry constructed with cylinder primitives
    const checkStem1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 1.2, 16),
      checkStemMat
    );
    checkStem1.position.set(-0.5, -0.2, 0);
    checkStem1.rotation.z = -Math.PI / 4;
    decisionGroup.add(checkStem1);

    const checkStem2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 2.2, 16),
      checkStemMat
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
      .to(cameraProxy, { progress: 0.25, ease: 'power1.inOut' }, 0)
      .to(centralSphereMat, { opacity: 0.9, ease: 'power2.inOut' }, 0.15)
      .to(particleGroup.rotation, { y: Math.PI * 0.8, x: 0.4 }, 0)
      .to(particleMat.uniforms.uProgress, { value: 1.0, ease: 'power2.inOut' }, 0)

      // Beat 2 -> Beat 3 Transition (0.25 to 0.50)
      .to(shardMat, { opacity: 1, ease: 'power2.inOut' }, 0.22)
      .to(centralNode.scale, { x: 1.6, y: 1.6, z: 1.6, ease: 'power2.out' }, 0.25)
      .to(shardGroup.scale, { x: 1.4, y: 1.4, z: 1.4, ease: 'power1.out' }, 0.3)
      .to(cameraProxy, { progress: 0.5, ease: 'power1.inOut' }, 0.3)

      // Beat 3 -> Beat 4 Transition (0.50 to 0.75)
      .to(gridHelper.material, { opacity: 1, ease: 'power1.inOut' }, 0.48)
      .to(cameraProxy, { progress: 0.75, ease: 'power2.inOut' }, 0.5)
      .to(cameraGroup.rotation, { x: -0.28, ease: 'power2.inOut' }, 0.5)
      .to(hotspotRingMat, { opacity: 0.85, ease: 'power1.in' }, 0.52)
      .to(arc1Mat, { opacity: 1, ease: 'power2.inOut' }, 0.65)
      .to(arc2Mat, { opacity: 1, ease: 'power2.inOut' }, 0.65)
      .to(priorityGroup.rotation, { z: Math.PI * 2, ease: 'power1.inOut' }, 0.68)
      .to(arc2.rotation, { z: Math.PI * 1.5, ease: 'back.out(1.5)' }, 0.72)

      // Beat 4 -> Beat 5 Transition (0.75 to 1.0)
      .to(ringShieldMat, { opacity: 1, ease: 'power2.inOut' }, 0.82)
      .to(checkStemMat, { opacity: 1, ease: 'power2.inOut' }, 0.82)
      .to(cameraProxy, { progress: 1.0, ease: 'power2.inOut' }, 0.85)
      .to(cameraGroup.rotation, { x: 0, ease: 'power2.inOut' }, 0.85)
      .to(ringShield.rotation, { z: Math.PI * 2, ease: 'power2.out' }, 0.88)
      .to(decisionGroup.scale, { x: 1.15, y: 1.15, z: 1.15, ease: 'back.out(2)' }, 0.92);

    // 4. Render / Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Continuous subtle ambient procedural rotations
      particleMat.uniforms.uTime.value = elapsed;
      particles.rotation.y += 0.001;
      centralNode.rotation.y += 0.008;
      centralNode.rotation.x += 0.004;

      shardDummies.forEach((dummy, i) => {
        dummy.rotation.x += 0.01;
        dummy.rotation.y += 0.015;
        dummy.updateMatrix();
        shardInstancedMesh.setMatrixAt(i, dummy.matrix);
      });
      shardInstancedMesh.instanceMatrix.needsUpdate = true;

      // Smooth spline camera path update
      cameraPath.getPointAt(cameraProxy.progress, cameraGroup.position);
      
      // Desktop mouse parallax
      camera.position.x += (targetX * 0.5 - camera.position.x) * 0.05;
      camera.position.y += (targetY * 0.5 - camera.position.y) * 0.05;

      if (hotspotRingMat.opacity > 0) {
        const pulse = 1 + Math.sin(elapsed * 3) * 0.08;
        hotspotRings.forEach(r => {
          if (r.visible) {
            const base = r.userData.baseScale || 1;
            r.scale.set(base * pulse, base * pulse, 1);
          }
        });
      }

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
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
      if (composer) composer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 6. Mandatory WebGL Resource Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
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

      if (composer) {
        try {
          // @ts-ignore
          if (typeof composer.dispose === 'function') composer.dispose();
        } catch (e) {}
      }

      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update geometries/positions when data loads
  useEffect(() => {
    if (!overview || !hotspots.length) return;

    if (threeRefs.current.arc1) {
      threeRefs.current.arc1.geometry.dispose();
      const arc1Angle = Math.min(Math.PI * 2, Math.PI * 1.0 * (overview.total_requests / 3000));
      threeRefs.current.arc1.geometry = new THREE.TorusGeometry(2.2, 0.12, 16, 64, arc1Angle);
    }
    
    if (threeRefs.current.arc2) {
      threeRefs.current.arc2.geometry.dispose();
      const arc2Angle = Math.min(Math.PI * 2, Math.PI * 0.5 * (overview.digital_access_corrections_applied / 4.0));
      threeRefs.current.arc2.geometry = new THREE.TorusGeometry(1.6, 0.14, 16, 64, arc2Angle);
    }

    const sortedHotspots = [...hotspots].sort((a, b) => b.total_request_count - a.total_request_count);
    const limit = Math.min(12, sortedHotspots.length);
    
    threeRefs.current.hotspotRings.forEach((ring, i) => {
      if (i < limit) {
        const h = sortedHotspots[i];
        ring.visible = true;
        const px = ((h.longitude * 100) % 15) - 7.5;
        const pz = ((h.latitude * 100) % 15) - 7.5;
        ring.position.set(px, -3.9, pz);
        ring.userData.baseScale = 0.4 + (h.total_request_count / 1500);
      } else {
        ring.visible = false;
      }
    });
  }, [overview, hotspots]);

  const topCorrectionHotspot = hotspots.reduce((max, hs) => hs.digital_access_correction > (max?.digital_access_correction || 0) ? hs : max, null as Hotspot | null);

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
                {overview ? <CountUp value={overview.total_requests} /> : '...'}
              </span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <span className="text-cyan-400 block text-[10px] uppercase font-mono">Active Clusters</span>
              <span className="text-xl font-mono font-bold text-cyan-300">
                {overview ? <CountUp value={overview.active_hotspots} suffix=" Hotspots" /> : '...'}
              </span>
            </div>
          </div>
          {hotspots.length > 12 && (
            <p className="text-xs font-mono text-slate-500 mt-2">
              +{hotspots.length - 12} additional clusters rendering skipped
            </p>
          )}
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
              <span className="text-[11px] uppercase tracking-wide">
                Case Study: {topCorrectionHotspot && topCorrectionHotspot.digital_access_correction > 0 ? topCorrectionHotspot.title : 'Illustrative Benchmark'}
              </span>
              <span>
                {topCorrectionHotspot && topCorrectionHotspot.digital_access_correction > 0 ? <CountUp value={topCorrectionHotspot.digital_access_correction} prefix="+" suffix=" Points Added" decimals={1} /> : '+6.0 Points Added'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              In this verified benchmark, low connectivity triggers an automatic mathematical boost, ensuring remote tribal drinking water crises rank above urban cosmetic paving.
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
