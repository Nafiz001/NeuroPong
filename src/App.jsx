import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AnimatePresence } from 'framer-motion';

import Arena from './scene/Arena.jsx';
import Paddle from './scene/Paddle.jsx';
import Ball from './scene/Ball.jsx';
import GameLoopDriver from './scene/GameLoopDriver.jsx';
import EventBusDriver from './scene/EventBusDriver.jsx';
import Stadium from './scene/stadium/Stadium.jsx';
import PostFX from './scene/vfx/PostFX.jsx';
import HitSparks from './scene/vfx/HitSparks.jsx';
import CinematicRig from './scene/camera/CinematicRig.jsx';

import Hud from './ui/Hud.jsx';
import Controls from './ui/Controls.jsx';
import MainMenu from './ui/MainMenu.jsx';
import ResultsScreen from './ui/ResultsScreen.jsx';
import TelemetryPanel from './ui/telemetry/TelemetryPanel.jsx';

import IntroSplash from './routes/IntroSplash.jsx';

import { MATCH, SIDE } from './game/constants.js';
import { setAgents, setTimeScale } from './game/loop.js';
import { resetMatch, state, useHud } from './game/store.js';
import { createMinimaxAgent } from './ai/MinimaxAgent.js';
import { createFuzzyAgent } from './ai/FuzzyAgent.js';

import { initAudio, useGameEventAudio, useMenuMusic, useMatchMusic } from './audio/hooks.js';
import { attachCommentaryDirector } from './audio/commentary/CommentaryDirector.js';
import { useCrowdEnergy } from './scene/stadium/useCrowdEnergy.js';
import { onSceneEvent } from './scene/sceneBus.js';

const CAMERA_PRESETS = {
  classic:   { label: 'Classic',   position: [0, 14, 18],  fov: 45, minPolar: 0.2,  maxPolar: Math.PI * 0.45 },
  broadcast: { label: 'Broadcast', position: [0, 19, 14],  fov: 38, minPolar: 0.25, maxPolar: Math.PI * 0.40 },
  topdown:   { label: 'Top Down',  position: [0, 23, 0.01],fov: 33, minPolar: 0.05, maxPolar: Math.PI * 0.16 }
};

export default function App() {
  const [phase, setPhase] = useState('intro');      // intro | menu | match | results
  const [swapped, setSwapped] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [resumeStatus, setResumeStatus] = useState('playing');
  const [settings, setSettings] = useState({ camera: 'classic', gameSpeed: 1, uiScale: 1 });

  const orbitRef = useRef(null);

  const hud = useHud(s => ({
    matchOver: s.matchOver,
    winner: s.winner,
    scoreL: s.scoreL,
    scoreR: s.scoreR,
    metricsL: s.metricsL,
    metricsR: s.metricsR
  }));

  // Wire the AI pair each time swap changes.
  useEffect(() => {
    const minimax = createMinimaxAgent();
    const fuzzy   = createFuzzyAgent();
    if (swapped) setAgents(fuzzy, minimax);
    else         setAgents(minimax, fuzzy);
  }, [swapped]);

  // Simulation should never auto-start.
  useEffect(() => { state.status = 'paused'; }, []);

  // Apply settings.
  useEffect(() => { setTimeScale(settings.gameSpeed); }, [settings.gameSpeed]);

  // Commentary director subscribes once — returns unsubscribe.
  useEffect(() => {
    const unsubscribe = attachCommentaryDirector();
    return () => { unsubscribe?.(); };
  }, []);

  // Crowd energy: subscribe to scene events for rally tracking.
  useEffect(() => {
    return onSceneEvent(ev => {
      const ce = useCrowdEnergy.getState();
      if (ev.type === 'hit') {
        ce.setRallyHits(ev.payload.rallyHits ?? 0);
        if (ev.payload.smash) ce.spike(0.55);
      } else if (ev.type === 'score') {
        ce.spike(0.8);
        ce.setRallyHits(0);
      } else if (ev.type === 'matchWon') {
        ce.spike(1.0);
      }
    });
  }, []);

  // Transition into match/results based on game status.
  useEffect(() => {
    if (phase !== 'match') return;
    if (hud.matchOver) setPhase('results');
  }, [hud.matchOver, phase]);

  // Music per phase.
  useMenuMusic(phase === 'menu');
  useMatchMusic(phase === 'match');

  // Audio + SFX wiring.
  useGameEventAudio();

  // Agent identity for HUD strings / stats — identity is tied to the agent
  // type, not to the faction (faction is per-side).
  const leftIsMinimax  = !swapped;
  const leftAgentId    = leftIsMinimax ? 'minimax' : 'fuzzy';
  const rightAgentId   = leftIsMinimax ? 'fuzzy'   : 'minimax';
  const leftAgentName  = leftIsMinimax ? 'Minimax (Nafiz)' : 'Fuzzy (Dewan)';
  const rightAgentName = leftIsMinimax ? 'Fuzzy (Dewan)'   : 'Minimax (Nafiz)';
  const cam = CAMERA_PRESETS[settings.camera] ?? CAMERA_PRESETS.classic;

  function startMatch() {
    initAudio().catch(() => {});
    resetMatch();
    setResumeStatus('playing');
    setHasStarted(true);
    setPhase('match');
  }
  function resumeMatch() {
    state.status = resumeStatus === 'paused' ? 'playing' : resumeStatus;
    setPhase('match');
  }
  function openMenu() {
    const snapshotStatus = state.status === 'playing' || state.status === 'countdown'
      ? state.status : 'playing';
    setResumeStatus(snapshotStatus);
    state.status = 'paused';
    setPhase('menu');
  }
  function updateSettings(next) {
    setSettings(prev => ({ ...prev, ...next }));
  }

  const canResume = hasStarted && !hud.matchOver;

  return (
    <div className="relative w-full h-full">
      <Canvas
        key={settings.camera}
        shadows
        camera={{ position: cam.position, fov: cam.fov }}
        className="w-full h-full"
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 1.6]}
      >
        <color attach="background" args={['#05070D']} />
        <fog attach="fog" args={['#05070D', 22, 48]} />

        <Stadium />
        <Arena />
        <Paddle side={SIDE.LEFT} />
        <Paddle side={SIDE.RIGHT} />
        <Ball />
        <HitSparks />

        <EventBusDriver />
        <GameLoopDriver />

        <OrbitControls
          ref={orbitRef}
          enablePan={false}
          minPolarAngle={cam.minPolar}
          maxPolarAngle={cam.maxPolar}
          minDistance={10}
          maxDistance={38}
        />
        <CinematicRig orbitControlsRef={orbitRef} basePosition={cam.position} />

        <PostFX />
      </Canvas>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `scale(${settings.uiScale})`, transformOrigin: 'center center' }}
      >
        {phase === 'match' && !hud.matchOver && (
          <>
            <Hud leftAgent={leftAgentName} rightAgent={rightAgentName} />
            <Controls onSwap={() => setSwapped(s => !s)} onMenu={openMenu} />
            <TelemetryPanel />
          </>
        )}

        {phase === 'results' && (
          <ResultsScreen
            leftAgentId={leftAgentId}
            rightAgentId={rightAgentId}
            leftAgentName={leftAgentName}
            rightAgentName={rightAgentName}
            winner={hud.winner}
            scoreL={hud.scoreL}
            scoreR={hud.scoreR}
            metricsL={hud.metricsL}
            metricsR={hud.metricsR}
            winScore={MATCH.winScore}
            onPlayAgain={startMatch}
            onMainMenu={() => { state.status = 'paused'; setPhase('menu'); }}
          />
        )}

        {phase === 'menu' && (
          <MainMenu
            leftAgentId={leftAgentId}
            rightAgentId={rightAgentId}
            leftAgentName={leftAgentName}
            rightAgentName={rightAgentName}
            swapped={swapped}
            onSwap={() => setSwapped(s => !s)}
            onPlay={startMatch}
            onResume={resumeMatch}
            canResume={canResume}
            settings={settings}
            onSettingsChange={updateSettings}
            winScore={MATCH.winScore}
          />
        )}

        <AnimatePresence>
          {phase === 'intro' && (
            <IntroSplash onComplete={() => setPhase('menu')} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
