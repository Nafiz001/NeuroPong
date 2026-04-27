export default function FuzzyRuleStrip({ rules = [] }) {
  if (!rules.length) return null;

  // Compact, text-first output keeps the fuzzy decisions easy to scan in-match.
  return (
    <div className="space-y-1 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
      <div className="text-slate-500">Fuzzy rules</div>
      <div className="space-y-0.5">
        {rules.map((rule, index) => (
          <div key={`${rule}-${index}`} className="flex items-start gap-2">
            <span className="text-brand-accent">{String(index + 1).padStart(2, '0')}</span>
            <span className="leading-relaxed text-slate-300 normal-case tracking-normal">{rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}