import { useRef, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Props {
  departmentId: string;
  departmentName: string;
}

export function PrintSchedule({ departmentId, departmentName }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      // Fetch staff in this department
      const { data: staffData, error: staffError } = await supabase
        .from("staff")
        .select(`
          id,
          name,
          work_schedule,
          positions (title),
          staff_assignments (
            units (name, operating_hours, address)
          )
        `)
        .eq("department_id", departmentId)
        .order("name");

      if (staffError) throw staffError;

      // Fetch secretariat settings
      const { data: settings, error: settingsError } = await supabase
        .from("secretariat_settings")
        .select("*")
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (!staffData || staffData.length === 0) {
        toast.error("Nenhum funcionário encontrado neste setor.");
        return;
      }

      const now = new Date();
      const monthYear = format(now, "MMMM 'de' yyyy", { locale: ptBR });
      
      // Get the first unit's data for the header (as most professionals in a sector usually share units, or we pick the primary one)
      const unit = staffData[0]?.units || { name: "Não informada", operating_hours: "Não informado", address: "Não informado" };

      const content = `
        <div class="print-container">
          <img src="/timbre-neopolis.png" alt="Timbre" class="timbre" />
          
          <div class="header-info">
            <h1 class="report-title">ESCALA DE PROFISSIONAIS - ${departmentName.toUpperCase()}</h1>
            <div class="unit-details">
              <div><strong>UNIDADE:</strong> ${Array.isArray(unit) ? unit[0]?.name : (unit as any).name}</div>
              <div><strong>FUNCIONAMENTO:</strong> ${Array.isArray(unit) ? unit[0]?.operating_hours : (unit as any).operating_hours}</div>
              <div><strong>MÊS/ANO:</strong> ${monthYear.toUpperCase()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40%">PROFISSIONAL</th>
                <th style="width: 30%">CARGO/FUNÇÃO</th>
                <th style="width: 30%">HORÁRIO/TURNO</th>
              </tr>
            </thead>
            <tbody>
              ${staffData.map((s: any) => `
                <tr>
                  <td>${s.name}</td>
                  <td>${s.positions?.title || "---"}</td>
                  <td>${s.work_schedule || "DE ACORDO COM A UNIDADE"}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-info">
            <div class="secretariat-data">
              <div>${settings?.name || "SECRETARIA MUNICIPAL DE SAÚDE"}</div>
              ${settings?.cnpj ? `<div>CNPJ: ${settings.cnpj}</div>` : ""}
              ${settings?.address ? `<div>${settings.address}</div>` : ""}
            </div>
            <div class="signatures">
              <div class="sig-line">Assinatura do Responsável pelo Setor</div>
              <div class="sig-line">Carimbo e Visto da Secretaria</div>
            </div>
          </div>
        </div>
      `;

      const win = window.open("", "_blank");
      if (!win) return;

      win.document.write(`
        <html>
        <head>
          <title>Escala - ${departmentName}</title>
          <style>
            @page { 
              size: A4; 
              margin: 1.5cm 2cm 1.5cm 2cm; 
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #000;
              font-size: 12px;
              line-height: 1.4;
            }
            .print-container { width: 100%; display: flex; flex-direction: column; }
            .timbre {
              width: 100%;
              display: block;
              margin: 0 auto 10px auto;
              max-height: 140px;
              object-fit: contain;
            }
            .header-info {
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .report-title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .unit-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 5px;
              font-size: 11px;
            }
            .unit-details div { font-weight: bold; }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px 6px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
              font-size: 11px;
            }
            td { font-size: 11px; }
            .footer-info {
              margin-top: auto;
              display: flex;
              flex-direction: column;
              gap: 40px;
            }
            .secretariat-data {
              text-align: center;
              font-size: 10px;
              font-weight: bold;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
            .signatures {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
            }
            .sig-line {
              border-top: 1px solid #000;
              width: 200px;
              text-align: center;
              padding-top: 5px;
              font-size: 10px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
        </html>
      `);
      win.document.close();
      setTimeout(() => {
        win.print();
        setLoading(false);
      }, 500);

    } catch (error: any) {
      toast.error("Erro ao gerar escala: " + error.message);
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handlePrint} 
      disabled={loading}
      className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
      Gerar Escala
    </Button>
  );
}
