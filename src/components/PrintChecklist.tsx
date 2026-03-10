import { useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import type { Surgery, ChecklistItem } from "@/types";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  surgery: Surgery;
  patientName: string;
}

export function PrintChecklist({ surgery, patientName }: Props) {
  const { printSettings } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Checklist - ${surgery.type}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #0d9488; padding-bottom: 20px; }
          .logo { max-height: 80px; margin-bottom: 12px; }
          .header h1 { font-size: 20px; font-weight: 700; color: #0d9488; }
          .header h2 { font-size: 14px; font-weight: 400; color: #666; margin-top: 4px; }
          .info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; padding: 16px; background: #f8fafa; border-radius: 8px; }
          .info p { font-size: 13px; color: #444; }
          .info strong { color: #1a1a1a; }
          .checklist-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0d9488; }
          .item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee; }
          .checkbox { width: 18px; height: 18px; border: 2px solid #ccc; border-radius: 3px; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; }
          .checkbox.checked { border-color: #0d9488; background: #0d9488; }
          .checkbox.checked::after { content: '✓'; color: white; font-size: 12px; font-weight: bold; }
          .item-label { font-size: 13px; flex: 1; }
          .item-label.completed { text-decoration: line-through; color: #999; }
          .item-date { font-size: 11px; color: #999; white-space: nowrap; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
          .sig-line { border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const completedCount = surgery.checklist.filter(c => c.completed).length;

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="w-4 h-4 mr-1" />Imprimir Checklist
      </Button>

      <div ref={printRef} className="hidden">
        {printSettings?.showHeader && (
          <div className="header">
            {printSettings?.showLogo && printSettings?.logoUrl && (
              <img src={printSettings.logoUrl} alt="Logo" className="logo" />
            )}
            <h1>{printSettings?.headerTitle || "Secretaria Municipal de Saúde"}</h1>
            {printSettings?.headerSubtitle && <h2>{printSettings.headerSubtitle}</h2>}
          </div>
        )}

        <div className="info">
          <p><strong>Paciente:</strong> {patientName}</p>
          <p><strong>Cirurgia:</strong> {surgery.type}</p>
          <p><strong>Porte:</strong> {surgery.size === "pequena" ? "Pequeno" : "Grande"}</p>
          <p><strong>Data:</strong> {new Date(surgery.scheduledDate).toLocaleDateString("pt-BR")}</p>
          <p><strong>Status:</strong> {surgery.status}</p>
          <p><strong>Progresso:</strong> {completedCount}/{surgery.checklist.length} itens</p>
        </div>

        <div className="checklist-title">Checklist Pré-operatório</div>
        {surgery.checklist.map((item: ChecklistItem) => (
          <div key={item.id} className="item">
            <div className={`checkbox ${item.completed ? "checked" : ""}`} />
            <span className={`item-label ${item.completed ? "completed" : ""}`}>{item.label}</span>
            {item.completedAt && (
              <span className="item-date">{new Date(item.completedAt).toLocaleDateString("pt-BR")}</span>
            )}
          </div>
        ))}

        {surgery.notes && (
          <div style={{ marginTop: "20px", padding: "12px", background: "#f8fafa", borderRadius: "8px", fontSize: "13px" }}>
            <strong>Observações:</strong> {surgery.notes}
          </div>
        )}

        <div className="signatures">
          <div className="sig-line">Responsável Técnico</div>
          <div className="sig-line">Paciente / Responsável</div>
        </div>

        {printSettings?.showFooter && printSettings?.footerText && (
          <div className="footer">{printSettings.footerText}</div>
        )}
      </div>
    </>
  );
}
