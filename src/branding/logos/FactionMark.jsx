// Unified faction mark — picks the right SVG for a faction id.

import VoltariMark from './VoltariMark.jsx';
import EmberLynxMark from './EmberLynxMark.jsx';

export default function FactionMark({ faction, size = 64, className }) {
  const id = typeof faction === 'string' ? faction : faction?.id;
  if (id === 'emberlynx') return <EmberLynxMark className={className} size={size} />;
  return <VoltariMark className={className} size={size} />;
}
