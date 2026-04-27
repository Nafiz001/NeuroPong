// Fuzzy agent introspection: memberships of each input and the firing
// strengths of the output buckets.

export default function FuzzyRuleStrip({ debug }) {
  if (!debug || debug.kind !== 'fuzzy') return null;
  const { inputs, memberships, outputs, crisp, discrete } = debug;

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
        Fuzzy · Mamdani
      </div>

      {/* Raw inputs */}
      <div className="text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-x-3 gap-y-0.5">
        <div>Dist to ball X</div><div className="text-right tabular-nums text-slate-200">{inputs.distX?.toFixed(2)}</div>
        <div>Ball speed</div><div className="text-right tabular-nums text-slate-200">{inputs.ballSpeed?.toFixed(2)}</div>
        <div>Align Δ</div><div className="text-right tabular-nums text-slate-200">{inputs.alignDelta?.toFixed(2)}</div>
        <div>Energy</div><div className="text-right tabular-nums text-slate-200">{Math.round(inputs.energy)}</div>
        <div>Danger</div><div className="text-right tabular-nums text-slate-200">{inputs.danger?.toFixed(2)}</div>
        <div>Heading</div><div className="text-right tabular-nums text-slate-200">{inputs.heading ? 'incoming' : 'outgoing'}</div>
      </div>

      {/* Memberships */}
      <MemberRow label="Distance" values={memberships.dist}  labels={['near','medium','far']} />
      <MemberRow label="Speed"    values={memberships.speed} labels={['slow','fast']} />
      <MemberRow label="Align"    values={memberships.align} labels={['good','bad']} />
      <MemberRow label="Energy"   values={memberships.eng}   labels={['low','medium','high']} />
      <MemberRow label="Danger"   values={memberships.dang}  labels={['low','high']} />

      {/* Output aggregation */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.18em] text-brand-accent font-semibold mb-1">Output</div>
        <div className="space-y-1">
          {['sNeg','neg','zero','pos','sPos'].map(k => (
            <div key={k} className="flex items-center gap-2">
              <div className="w-12 text-[10px] font-mono uppercase text-slate-400">{k}</div>
              <div className="flex-1 h-2 bg-bg-1 rounded overflow-hidden">
                <div className="h-full bg-emberlynx-400" style={{ width: `${Math.min(1, outputs[k] ?? 0) * 100}%` }} />
              </div>
              <div className="w-10 text-[10px] font-mono tabular-nums text-right text-slate-300">
                {(outputs[k] ?? 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-x-3">
          <div>Crisp</div>    <div className="text-right tabular-nums text-slate-200">{crisp?.toFixed(2)}</div>
          <div>Discrete</div> <div className="text-right tabular-nums text-slate-200">{discrete}</div>
        </div>
      </div>
    </div>
  );
}

function MemberRow({ label, values = {}, labels }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="flex gap-1 mt-1">
        {labels.map(k => {
          const v = values[k] ?? 0;
          return (
            <div key={k} className="flex-1 flex flex-col items-center">
              <div className="w-full h-1.5 bg-bg-1 rounded overflow-hidden">
                <div className="h-full bg-voltari-400" style={{ width: `${Math.min(1, v) * 100}%` }} />
              </div>
              <div className="text-[9px] font-mono text-slate-400 mt-0.5">{k}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
