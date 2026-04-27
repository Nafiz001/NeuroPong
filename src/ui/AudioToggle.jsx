// Speaker-icon button that toggles the AudioEngine mute state. Used by both
// the in-match controls strip and the main menu so the icon style stays
// consistent. Subscribes to AudioEngine so external mute changes flip the
// icon too.

import { useEffect, useState } from 'react';
import { AudioEngine } from '../audio/AudioEngine.js';

export default function AudioToggle({ className = '', size = 16 }) {
  const [muted, setMuted] = useState(AudioEngine.muted);

  useEffect(() => {
    return AudioEngine.subscribe(s => setMuted(s.muted));
  }, []);

  const label = muted ? 'Unmute audio' : 'Mute audio';

  return (
    <button
      onClick={() => AudioEngine.toggleMute()}
      aria-label={label}
      title={label}
      className={
        'px-2.5 py-1.5 text-slate-200 bg-bg-1/85 hover:bg-bg-2/95 ' +
        'border border-white/10 rounded transition flex items-center justify-center ' +
        className
      }
    >
      <SpeakerIcon muted={muted} size={size} />
    </button>
  );
}

function SpeakerIcon({ muted, size }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none" />
      {muted ? (
        <>
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a4.5 4.5 0 0 1 0 7" />
          <path d="M18.5 5.5a8.5 8.5 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}
