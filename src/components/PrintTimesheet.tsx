import { useRef } from "react";
import { Printer, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, eachDayOfInterval, addMonths, setDate, isWeekend, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  staff: any;
  month: Date;
}

export function PrintTimesheet({ staff, month }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const startDate = setDate(month, 10);
  const endDate = setDate(addMonths(month, 1), 10);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Folha de Ponto - ${staff.name}</title>
        <style>
          @page {
            size: A4;
            margin: 1cm;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            color: #000;
            font-size: 10px;
          }
          .header { 
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
          }
          .header-info {
            flex: 1;
            text-align: center;
          }
          .header-info h1 { font-size: 14px; margin-bottom: 2px; text-transform: uppercase; }
          .header-info h2 { font-size: 16px; margin-bottom: 4px; font-weight: bold; }
          .header-info p { font-size: 11px; font-weight: bold; margin-bottom: 2px; }
          .period-box {
            text-align: right;
            min-width: 150px;
          }
          .period-box h2 { font-size: 12px; margin-bottom: 4px; }
          
          .employee-info {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #000;
          }
          .info-group p { margin-bottom: 4px; }
          .info-group strong { text-transform: uppercase; font-size: 9px; }

          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px 6px; 
            text-align: center;
          }
          th { 
            background-color: #f2f2f2;
            font-size: 9px;
            text-transform: uppercase;
          }
          .day-weekend { background-color: #f9f9f9; }
          
          .signatures {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
          }
          .sig-line {
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
          }
          
          @media print {
            .no-print { display: none; }
          }
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

  const weekDayMap: { [key: number]: string } = {
    0: "DOM",
    1: "SEG",
    2: "TER",
    3: "QUA",
    4: "QUI",
    5: "SEX",
    6: "SAB",
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
        <FileText className="w-4 h-4" />
        Gerar Folha de Ponto
      </Button>

      <div ref={printRef} className="hidden">
        <div className="header">
          <img 
            src="/placeholder.svg" 
            alt="Logo" 
            className="logo"
          />
          <div className="header-info">
            <p>ESTADO DE SERGIPE</p>
            <p>PREFEITURA MUNICIPAL</p>
            <p>FUNDO MUNICIPAL DE SAÚDE</p>
            <h2>FOLHA DE FREQUÊNCIA INDIVIDUAL</h2>
          </div>
          <div className="period-box">
            <h2>MÊS/ANO: {format(month, "MM/yyyy")}</h2>
            <p>Período: {format(startDate, "dd/MM/yyyy")} a {format(endDate, "dd/MM/yyyy")}</p>
          </div>
        </div>

        <div className="employee-info">
          <div className="info-group">
            <p><strong>NOME:</strong> {staff.name}</p>
            <p><strong>CARGO/FUNÇÃO:</strong> {staff.positions?.title || "-"}</p>
            <p><strong>UNIDADE:</strong> {staff.departments?.name || "-"}</p>
          </div>
          <div className="info-group">
            <p><strong>MATRÍCULA:</strong> {staff.registration_code}</p>
            <p><strong>CARGA HORÁRIA:</strong> {staff.positions?.work_hours ? `${staff.positions.work_hours}h` : "-"}</p>
            <p><strong>VÍNCULO:</strong> {staff.condition || "-"}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th rowSpan={2}>DIA</th>
              <th rowSpan={2}>DIA SEM.</th>
              <th colSpan={2}>MATUTINO</th>
              <th colSpan={2}>VESPERTINO</th>
              <th rowSpan={2}>RUBRICA DO SERVIDOR</th>
            </tr>
            <tr>
              <th>ENTRADA</th>
              <th>SAÍDA</th>
              <th>ENTRADA</th>
              <th>SAÍDA</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const isWknd = isWeekend(day);
              const dayOfWeek = getDay(day);
              return (
                <tr key={day.toISOString()} className={isWknd ? "day-weekend" : ""}>
                  <td>{format(day, "dd")}</td>
                  <td>{weekDayMap[dayOfWeek]}</td>
                  <td>{isWknd ? "---" : ""}</td>
                  <td>{isWknd ? "---" : ""}</td>
                  <td>{isWknd ? "---" : ""}</td>
                  <td>{isWknd ? "---" : ""}</td>
                  <td></td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: "30px", fontSize: "10px" }}>
          <p>OBSERVAÇÕES: ____________________________________________________________________________________________________________________</p>
        </div>

        <div className="signatures">
          <div className="sig-line">
            <p>{staff.name}</p>
            <p>Assinatura do Servidor</p>
          </div>
          <div className="sig-line">
            <p>Carimbo e Assinatura</p>
            <p>Chefia Imediata</p>
          </div>
        </div>
      </div>
    </>
  );
}
