import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';

import Arena from './scene/Arena.jsx';
import Paddle from './scene/Paddle.jsx';
import Ball from './scene/Ball.jsx';
import GameLoopDriver from './scene/GameLoopDriver.jsx';
import Hud from './ui/Hud.jsx';
import Controls from './ui/Controls.jsx';
import MainMenu from './ui/MainMenu.jsx';
import ResultsScreen from './ui/ResultsScreen.jsx';

import { MATCH, SIDE } from './game/constants.js';
import { setAgents, setTimeScale } from './game/loop.js';
import { resetMatch, state, useHud } from './game/store.js';
import { createMinimaxAgent } from './ai/MinimaxAgent.js';
import { createFuzzyAgent } from './ai/FuzzyAgent.js';

const CAMERA_PRESETS = {
  classic: {
    label: 'Classic',
    position: [0, 14, 18],
    fov: 45,
    minPolar: 0.2,
    maxPolar: Math.PI * 0.45
  },
  broadcast: {
    label: 'Broadcast',
    position: [0, 19, 14],
    fov: 38,
    minPolar: 0.25,
    maxPolar: Math.PI * 0.4
  },
  topdown: {
    label: 'Top Down',
    position: [0, 23, 0.01],
    fov: 33,
    minPolar: 0.05,
    maxPolar: Math.PI * 0.16
  }
};

export default function App() {
  // Default: Minimax (Nafiz) on the left, Fuzzy (Dewan) on the right.
  const [swapped, setSwapped] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);
  const [resumeStatus, setResumeStatus] = useState('playing');
  const [settings, setSettings] = useState({
    camera: 'classic',
    gameSpeed: 1,
    uiScale: 1
  });

  const hud = useHud(s => ({
    scoreL: s.scoreL,
    scoreR: s.scoreR,
    metricsL: s.metricsL,
    metricsR: s.metricsR,
    matchOver: s.matchOver,
    winner: s.winner
  }));

  useEffect(() => {
    const minimax = createMinimaxAgent();
    const fuzzy   = createFuzzyAgent();
    if (swapped) {
      setAgents(fuzzy, minimax);
    } else {
      setAgents(minimax, fuzzy);
    }
    if (hasStarted) {
      resetMatch();
    }
  }, [swapped, hasStarted]);

  useEffect(() => {
    // Ensure the simulation does not auto-run before the first menu action.
    state.status = 'paused';
  }, []);

  useEffect(() => {
    setTimeScale(settings.gameSpeed);
  }, [settings.gameSpeed]);

  const leftName  = swapped ? 'Fuzzy (Dewan)'   : 'Minimax (Nafiz)';
  const rightName = swapped ? 'Minimax (Nafiz)' : 'Fuzzy (Dewan)';
  const cam = CAMERA_PRESETS[settings.camera] ?? CAMERA_PRESETS.classic;

  function openMenu() {
    const snapshotStatus =
      state.status === 'playing' || state.status === 'countdown'
        ? state.status
        : 'playing';
    setResumeStatus(snapshotStatus);
    state.status = 'paused';
    setMenuOpen(true);
  }

  function startGame() {
    resetMatch();
    setResumeStatus('playing');
    setHasStarted(true);
    setMenuOpen(false);
  }

  function resumeGame() {
    state.status = resumeStatus === 'paused' ? 'playing' : resumeStatus;
    setMenuOpen(false);
  }

  function playAgain() {
    resetMatch();
    setHasStarted(true);
    setMenuOpen(false);
  }

  function openMenuFromResults() {
    state.status = 'paused';
    setMenuOpen(true);
  }

  function updateSettings(next) {
    setSettings(prev => ({ ...prev, ...next }));
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        key={settings.camera}
        shadows
        camera={{ position: cam.position, fov: cam.fov }}
        className="w-full h-full"
      >
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[10, 14, 8]} intensity={0.9} castShadow />
        <Physics gravity={[0, 0, 0]} paused>
          <Arena />
          <Paddle side={SIDE.LEFT} />
          <Paddle side={SIDE.RIGHT} />
          <Ball />
        </Physics>
        <GameLoopDriver />
        <OrbitControls
          enablePan={false}
          minPolarAngle={cam.minPolar}
          maxPolarAngle={cam.maxPolar}
        />
      </Canvas>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `scale(${settings.uiScale})`,
          transformOrigin: 'center center'
        }}
      >
        {hasStarted && !menuOpen && !hud.matchOver && (
          <Hud leftName={leftName} rightName={rightName} />
        )}
        {hasStarted && !menuOpen && !hud.matchOver && (
          <Controls onSwap={() => setSwapped(s => !s)} onMenu={openMenu} />
        )}

        {hasStarted && !menuOpen && hud.matchOver && (
          <ResultsScreen
            leftName={leftName}
            rightName={rightName}
            winner={hud.winner}
            scoreL={hud.scoreL}
            scoreR={hud.scoreR}
            metricsL={hud.metricsL}
            metricsR={hud.metricsR}
            winScore={MATCH.winScore}
            onPlayAgain={playAgain}
            onMainMenu={openMenuFromResults}
          />
        )}

        {menuOpen && (
          <MainMenu
            leftName={leftName}
            rightName={rightName}
            swapped={swapped}
            onSwap={() => setSwapped(s => !s)}
            onPlay={startGame}
            onResume={resumeGame}
            canResume={hasStarted && !hud.matchOver}
            settings={settings}
            onSettingsChange={updateSettings}
            winScore={MATCH.winScore}
          />
        )}
      </div>
    </div>
  );
}
