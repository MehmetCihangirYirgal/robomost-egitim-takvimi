export function SignatureSection() {
  return (
    <div className="grid grid-cols-2 gap-8 mt-6 avoid-break">
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Veli</div>
        <div className="text-xs text-slate-500 mb-1">Ad Soyad:</div>
        <div className="border-b border-slate-400 h-8 mb-3" />
        <div className="text-xs text-slate-500 mb-1">İmza:</div>
        <div className="border-b border-slate-400 h-10" />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">ROBOMOST</div>
        <div className="text-xs text-slate-500 mb-1">Yetkili:</div>
        <div className="border-b border-slate-400 h-8 mb-3" />
        <div className="text-xs text-slate-500 mb-1">Kaşe / İmza:</div>
        <div className="border border-dashed border-slate-300 rounded-md h-24" />
      </div>
    </div>
  );
}
