import { useRef } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, eachDayOfInterval, addMonths, setDate, getDay, getMonth } from "date-fns";

interface Props {
  staff: any;
  month: Date;
}

const MONTH_NAMES = [
  "JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO",
  "JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"
];

export function PrintTimesheet({ staff, month }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const startDate = setDate(month, 10);
  const endDate = setDate(addMonths(month, 1), 10);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group days by month
  const rows: Array<{ type: "month"; name: string } | { type: "day"; date: Date }> = [];
  let lastMonth = -1;
  days.forEach((d) => {
    const m = getMonth(d);
    if (m !== lastMonth) {
      rows.push({ type: "month", name: MONTH_NAMES[m] });
      lastMonth = m;
    }
    rows.push({ type: "day", date: d });
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Folha de Frequência - ${staff.name}</title>
        <style>
          @page { 
            size: A4; 
            margin: 1.5cm 1cm 1cm 1cm; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000;
            font-size: 11px;
            width: 100%;
          }
          .print-container {
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          .timbre {
            width: 100%;
            display: block;
            margin: 0 auto 15px auto;
            max-height: 180px;
            object-fit: contain;
          }
          .employee-info {
            margin-bottom: 12px;
            font-size: 11px;
            line-height: 1.6;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px 20px;
          }
          .employee-info div {
            border-bottom: 0.5px solid #eee;
            padding-bottom: 2px;
          }
          .employee-info div b {
            font-weight: bold;
            margin-right: 4px;
          }
          .title {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            margin: 10px 0;
            text-transform: uppercase;
            text-decoration: underline;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th, td {
            border: 1px solid #000;
            padding: 4px 2px;
            font-size: 10px;
            height: 22px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          th {
            font-weight: bold;
            text-align: center;
            background-color: #f2f2f2;
          }
          .month-row td {
            background-color: #e6e6e6;
            text-align: center;
            font-weight: bold;
            font-size: 11px;
            padding: 4px;
            height: 24px;
            text-transform: uppercase;
          }
          .day-cell { text-align: center; font-weight: bold; width: 35px; }
          .sig-cell { text-align: center; font-weight: bold; font-size: 8px; color: #444; text-transform: uppercase; }
          .ent-cell, .sai-cell { width: 55px; }
          .observacoes {
            display: flex;
            margin-top: 12px;
            min-height: 60px;
          }
          .observacoes > div {
            border: 1px solid #000;
            padding: 8px;
            font-size: 9px;
            line-height: 1.3;
          }
          .obs-left { flex: 1.8; margin-right: -1px; }
          .obs-right { flex: 1; }
          .carimbo {
            margin-top: 25px;
            display: flex;
            justify-content: flex-end;
            font-weight: bold;
            font-size: 11px;
          }
          .carimbo-line {
            border-top: 1px solid #000;
            padding-top: 5px;
            width: 300px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${content.innerHTML}
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  const isSat = (d: Date) => getDay(d) === 6;
  const isSun = (d: Date) => getDay(d) === 0;
  const weekendLabel = (d: Date) => (isSat(d) ? "SABADO" : isSun(d) ? "DOMINGO" : "");

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
        <FileText className="w-4 h-4" />
        Gerar Folha de Ponto
      </Button>

      <div ref={printRef} className="hidden">
        <img src="/timbre-neopolis.png" alt="Timbre" className="timbre" />

        <div className="employee-info">
          <div><b>SETOR:</b> {staff.departments?.name || "_______________________"}</div>
          <div><b>SERVIDOR:</b> {staff.name || ""}</div>
          <div><b>FUNÇÃO:</b> {staff.positions?.title || ""}</div>
          <div><b>CONDIÇÃO:</b> {staff.condition || ""}</div>
          <div><b>C. HORÁRIA:</b> {staff.positions?.work_hours ? `${staff.positions.work_hours}HRS` : "______"}</div>
          <div><b>ANO:</b> {format(month, "yyyy")}</div>
        </div>

        <div className="title">REGISTRO DIÁRIO DE FREQUÊNCIA DO SERVIDOR</div>

        <table>
          <thead>
            <tr>
              <th className="day-cell">DIA</th>
              <th className="ent-cell">ENT.</th>
              <th>ASSINATURA</th>
              <th className="sai-cell">SAÍDA</th>
              <th className="ent-cell">ENT.</th>
              <th>ASSINATURA</th>
              <th className="sai-cell">SAÍDA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              if (row.type === "month") {
                return (
                  <tr key={`m-${idx}`} className="month-row">
                    <td colSpan={7}>{row.name}</td>
                  </tr>
                );
              }
              const d = row.date;
              const label = weekendLabel(d);
              return (
                <tr key={d.toISOString()}>
                  <td className="day-cell">{format(d, "dd")}</td>
                  <td></td>
                  <td className="sig-cell">{label}</td>
                  <td></td>
                  <td></td>
                  <td className="sig-cell">{label}</td>
                  <td></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="observacoes">
          <div className="obs-left">
            <strong>OBSERVAÇÕES:</strong> TODAS AS OCORRÊNCIAS VERIFICADAS DENTRO DO MÊS,
            COMO SEJAM DISTRIBUIÇÕES, PRORROGAÇÕES, AUSÊNCIAS (ABONOS, FOLGAS, LICENÇAS MÉDICAS,
            VIAGENS, FALTAS INJUSTIFICADAS, ETC.) DEVERÃO OBRIGATORIAMENTE CONSTAR NO CAMPO AO LADO OU NO VERSO.
          </div>
          <div className="obs-right">
            <strong>OBSERVAÇÕES:</strong>
          </div>
        </div>

        <div className="carimbo">
          <div className="carimbo-line">Carimbo e Assinatura do Responsável</div>
        </div>
      </div>
    </>
  );
}
