import logoNeopolis from "@/assets/logo-neopolis.png";

export function AppTopbar() {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-primary flex items-center justify-between px-6 z-50">
      <div className="flex items-center gap-3">
        <img src={logoNeopolis} alt="Logo Neópolis" className="h-10 object-contain" />
        <div className="leading-tight">
          <span className="text-sm font-bold text-primary-foreground tracking-wide">sisapi</span>
          <span className="text-[10px] text-primary-foreground/70 ml-2">Secretaria Municipal de Saúde - SMS</span>
        </div>
      </div>
    </header>
  );
}
