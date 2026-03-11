import logoNeopolis from "@/assets/logo-neopolis.png";

export function AppTopbar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-primary flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold text-primary-foreground tracking-wide">sisapi</span>
        <div className="w-px h-8 bg-primary-foreground/30" />
        <div className="flex items-center gap-2">
          <img src={logoNeopolis} alt="Logo Neópolis" className="h-9 object-contain" />
          <div className="leading-tight">
            <p className="text-xs font-bold text-primary-foreground uppercase tracking-wide">Secretaria Municipal</p>
            <p className="text-[10px] text-primary-foreground/80">de <strong>Saúde</strong> - SMS</p>
          </div>
        </div>
      </div>
    </header>
  );
}
