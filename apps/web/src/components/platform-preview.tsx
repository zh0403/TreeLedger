import { Blocks, Check, ClipboardCheck, MapPin, QrCode, TreePine } from "lucide-react";

const recordItems = [
  { icon: QrCode, label: "Digital identity", value: "QR-linked profile" },
  { icon: ClipboardCheck, label: "Maintenance", value: "Field evidence trail" },
  { icon: Blocks, label: "Verification", value: "Auditable event history" },
];

export function PlatformPreview() {
  return (
    <div className="relative mx-auto w-full min-w-0 max-w-[570px] lg:mx-0 lg:justify-self-end">
      <div className="absolute -inset-5 -z-10 rounded-[3rem] border border-[#bfd1b7]/60" aria-hidden="true" />
      <div className="rounded-[2.2rem] border border-white/80 bg-[#e8eee4]/85 p-3 shadow-[0_28px_80px_rgba(42,68,48,0.16)] backdrop-blur sm:p-4">
        <div className="overflow-hidden rounded-[1.65rem] bg-white">
          <div className="flex min-w-0 items-center justify-between gap-3 border-b border-[#e6eae3] px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[#274b37]">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e8f2df]">
                <TreePine className="h-3.5 w-3.5 text-[#5f853f]" aria-hidden="true" />
              </span>
              <span className="truncate">Living tree record</span>
            </div>
            <span className="shrink-0 rounded-full bg-[#eef3e9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#668057]">Connected</span>
          </div>

          <div className="p-5 sm:p-6">
            <div className="relative overflow-hidden rounded-[1.3rem] bg-[#16422e] p-5 text-white sm:p-6">
              <div className="preview-rings absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-50" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#abc4ae]">Tree profile</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">One identity</p>
                  <p className="mt-1 text-sm text-[#bfd0c1]">A continuous care record</p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#dcec9e] text-[#234d31]">
                  <TreePine className="h-7 w-7" strokeWidth={1.7} aria-hidden="true" />
                </div>
              </div>
              <div className="relative mt-8 flex items-center gap-2 text-xs text-[#dbe6dc]">
                <MapPin className="h-3.5 w-3.5 text-[#c9df80]" aria-hidden="true" />
                Linked to its township context
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {recordItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-[#e8ece5] px-3.5 py-3.5 sm:px-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f4ec] text-[#608149]">
                      <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#2d4c39]">{item.label}</p>
                      <p className="mt-0.5 truncate text-xs text-[#7b877f]">{item.value}</p>
                    </div>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e5f2d8] text-[#50743a]">
                      <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_14px_35px_rgba(42,68,48,0.14)] backdrop-blur sm:flex lg:-left-8">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fff0bd] text-[#6f5310]">
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#819087]">Care trail</p>
          <p className="mt-0.5 text-xs font-semibold text-[#2b4a37]">Context that stays attached</p>
        </div>
      </div>
    </div>
  );
}
