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
          @page { size: A4; margin: 1cm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            color: #000;
            font-size: 11px;
            padding: 10px;
          }
          .timbre {
            width: 100%;
            display: block;
            margin: 0 auto 10px auto;
            max-height: 220px;
            object-fit: contain;
          }
          .employee-info {
            margin-bottom: 10px;
            font-weight: bold;
            font-size: 12px;
            line-height: 1.5;
          }
          .title {
            text-align: center;
            font-weight: bold;
            font-size: 13px;
            margin: 8px 0 0 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #000;
            padding: 3px 5px;
            font-size: 11px;
          }
          th {
            font-weight: bold;
            text-align: center;
          }
          .month-row td {
            background-color: #bfbfbf;
            text-align: center;
            font-weight: bold;
            font-size: 13px;
            padding: 4px;
          }
          .day-cell { text-align: center; font-weight: bold; width: 40px; }
          .sig-cell { text-align: center; font-weight: bold; }
          .ent-cell, .sai-cell { width: 60px; }
          .observacoes {
            display: flex;
            margin-top: 10px;
          }
          .observacoes > div {
            border: 1px solid #000;
            padding: 6px;
            font-size: 10px;
          }
          .obs-left { flex: 2; }
          .obs-right { flex: 1; border-left: none; }
          .carimbo {
            margin-top: 8px;
            font-weight: bold;
            font-size: 12px;
          }
        </style>
      </head>
      <body>${content.innerHTML}</body>
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
          <div>SETOR: {staff.departments?.name || "_______________________"}</div>
          <div>SERVIDOR: {staff.name || ""}</div>
          <div>FUNÇÃO: {staff.positions?.title || ""}</div>
          <div>CONDIÇÃO: {staff.condition || ""}</div>
          <div>
            C. HORÁRIA: {staff.positions?.work_hours ? `${staff.positions.work_hours}HRS` : "______"}
            {"  "}ANO: {format(month, "yyyy")}
          </div>
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
          Carimbo e Assinatura do Responsável: ____________________________
        </div>
      </div>
    </>
  );
}
