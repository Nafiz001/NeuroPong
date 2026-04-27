// Broadcast HUD composition. Each piece is an independent component living
// in ui/broadcast/. This file is intentionally thin — adding/removing a
// broadcast element is a one-line change here.

import { useHud } from '../game/store.js';
import { factionForSide } from '../branding/palette.js';
import PlayerCard from './broadcast/PlayerCard.jsx';
import LowerThirdScore from './broadcast/LowerThirdScore.jsx';
import RallyCounter from './broadcast/RallyCounter.jsx';
import ServeIndicator from './broadcast/ServeIndicator.jsx';
import PowerupTray from './broadcast/PowerupTray.jsx';
import MatchPointFlash from './broadcast/MatchPointFlash.jsx';
import CommentaryBanner from './broadcast/CommentaryBanner.jsx';
import { useCommentary } from '../audio/commentary/CommentaryDirector.js';

export default function Hud({ leftAgent, rightAgent }) {
  const s = useHud();
  const leftFaction  = factionForSide('left');
  const rightFaction = factionForSide('right');
  const commentaryLine = useCommentary(c => c.line);

  return (
    <div className="pointer-events-none absolute inset-0">
      <PlayerCard
        side="left"
        faction={leftFaction}
        agentName={leftAgent}
        score={s.scoreL}
        energy={s.energyL}
        cooldowns={s.cooldownsL}
        active={s.activeL}
        metrics={s.metricsL}
        isServing={s.server === 'left'}
      />
      <PlayerCard
        side="right"
        faction={rightFaction}
        agentName={rightAgent}
        score={s.scoreR}
        energy={s.energyR}
        cooldowns={s.cooldownsR}
        active={s.activeR}
        metrics={s.metricsR}
        isServing={s.server === 'right'}
      />

      <RallyCounter hits={s.rallyHits} />
      <ServeIndicator side={s.server} />

      <PowerupTray side="left"  cooldowns={s.cooldownsL} active={s.activeL} />
      <PowerupTray side="right" cooldowns={s.cooldownsR} active={s.activeR} />

      <LowerThirdScore
        leftFaction={leftFaction}
        rightFaction={rightFaction}
        scoreL={s.scoreL}
        scoreR={s.scoreR}
        rallyHits={s.rallyHits}
        status={s.status}
      />

      <CommentaryBanner line={commentaryLine} />
      <MatchPointFlash />
    </div>
  );
}
