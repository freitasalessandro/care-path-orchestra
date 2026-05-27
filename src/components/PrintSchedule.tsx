import { useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Props {
  unitId: string;
  unitName: string;
}

export function PrintSchedule({ unitId, unitName }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      // Fetch unit details
      const { data: unitData, error: unitError } = await supabase
        .from("units")
        .select("*")
        .eq("id", unitId)
        .single();

      if (unitError) throw unitError;

      // Fetch all departments (sectors) for this unit
      const { data: departments, error: deptError } = await supabase
        .from("departments")
        .select(`
          id,
          name,
          work_hours,
          staff (
            id,
            name,
            work_schedule,
            positions (title)
          )
        `)
        .eq("unit_id", unitId)
        .order("name");

      if (deptError) throw deptError;

      // Fetch secretariat settings
      const { data: settings, error: settingsError } = await supabase
        .from("secretariat_settings")
        .select("*")
        .maybeSingle();

      if (settingsError) throw settingsError;

      const now = new Date();
      const monthYear = format(now, "MMMM 'de' yyyy", { locale: ptBR });

      let sectorsHtml = "";
      
      if (!departments || departments.length === 0) {
        sectorsHtml = "<p style='text-align: center; padding: 20px;'>Nenhum setor ou funcionário cadastrado nesta unidade.</p>";
      } else {
        departments.forEach((dept: any) => {
          if (dept.staff && dept.staff.length > 0) {
            sectorsHtml += `
              <div class="sector-section">
                <h2 class="sector-title">${dept.name.toUpperCase()} ${dept.work_hours ? `(${dept.work_hours}H)` : ""}</h2>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 40%">PROFISSIONAL</th>
                      <th style="width: 30%">CARGO/FUNÇÃO</th>
                      <th style="width: 30%">HORÁRIO/TURNO</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${dept.staff.map((s: any) => `
                      <tr>
                        <td>${s.name}</td>
                        <td>${s.positions?.title || "---"}</td>
                        <td>${s.work_schedule || unitData.operating_hours || "---"}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }
        });
      }

      const content = `
        <div class="print-container">
          <img src="/timbre-neopolis.png" alt="Timbre" class="timbre" />
          
          <div class="header-info">
            <h1 class="report-title">ESCALA MENSAL DE PROFISSIONAIS</h1>
            <div class="unit-details">
              <div><strong>UNIDADE:</strong> ${unitData.name.toUpperCase()}</div>
              <div><strong>CNES:</strong> ${unitData.cnes || "---"}</div>
              <div><strong>ENDEREÇO:</strong> ${unitData.address || "---"}</div>
              <div><strong>FUNCIONAMENTO:</strong> ${unitData.operating_days || "SEGUNDA A SEXTA"} (${unitData.operating_hours || "---"})</div>
              <div><strong>MÊS/ANO:</strong> ${monthYear.toUpperCase()}</div>
            </div>
          </div>

          ${sectorsHtml}

          <div class="footer-info">
            <div class="secretariat-data">
              <div>${settings?.name || "SECRETARIA MUNICIPAL DE SAÚDE"}</div>
              ${settings?.cnpj ? `<div>CNPJ: ${settings.cnpj}</div>` : ""}
              ${settings?.address ? `<div>${settings.address}</div>` : ""}
            </div>
            <div class="signatures">
              <div class="sig-line">Direção da Unidade</div>
              <div class="sig-line">Carimbo e Visto da Secretaria</div>
            </div>
          </div>
        </div>
      `;

      const win = window.open("", "_blank");
      if (!win) {
        toast.error("Por favor, habilite pop-ups para imprimir.");
        setLoading(false);
        return;
      }

      win.document.write(`
        <html>
        <head>
          <title>Escala - ${unitName}</title>
          <style>
            @page { 
              size: A4; 
              margin: 1.5cm 1.5cm 1.5cm 1.5cm; 
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #000;
              font-size: 11px;
              line-height: 1.3;
            }
            .print-container { width: 100%; display: flex; flex-direction: column; }
            .timbre {
              width: 100%;
              display: block;
              margin: 0 auto 5px auto;
              max-height: 120px;
              object-fit: contain;
            }
            .header-info {
              margin-bottom: 15px;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
            }
            .report-title {
              text-align: center;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .unit-details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 4px;
            }
            .unit-details div { font-weight: bold; font-size: 10px; }
            
            .sector-section {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .sector-title {
              font-size: 11px;
              font-weight: bold;
              background: #f4f4f4;
              padding: 4px 8px;
              border: 1px solid #000;
              border-bottom: none;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #000;
              padding: 5px 6px;
              text-align: left;
            }
            th {
              background-color: #eee;
              font-weight: bold;
              text-align: center;
              font-size: 10px;
            }
            td { font-size: 10px; }
            
            .footer-info {
              margin-top: 20px;
              display: flex;
              flex-direction: column;
              gap: 30px;
            }
            .secretariat-data {
              text-align: center;
              font-size: 9px;
              font-weight: bold;
              border-top: 1px solid #eee;
              padding-top: 8px;
            }
            .signatures {
              display: flex;
              justify-content: space-around;
              margin-top: 15px;
            }
            .sig-line {
              border-top: 1px solid #000;
              width: 180px;
              text-align: center;
              padding-top: 4px;
              font-size: 9px;
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
      Gerar Escala Geral
    </Button>
  );
}
