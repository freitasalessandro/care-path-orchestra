import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { PDFDocument } from 'pdf-lib';

interface ExportData {
  title: string;
  document_type: string;
  department: string;
  content: string;
  items?: any[];
  budget_info?: any;
  creditor_info?: any;
  author_name?: string;
  author_role?: string;
  author_signature?: string;
  assigned_name?: string;
  assigned_role?: string;
  is_finalized?: boolean;
  attachments?: any[];
}

export const exportToPdf = async (data: ExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // 1. Fetch Institution Settings
  const { data: settings } = await supabase
    .from("sisapi_settings")
    .select("*")
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const instName = settings?.institution_name || "SISAPI - SISTEMA DE GESTÃO";
  const instLogo = settings?.institution_logo_url;
  const instAddress = settings?.address || "";
  const instCity = settings?.city_state || "";
  const instCnpj = settings?.cnpj || "";

  // 2. Draw Header
  let currentY = 15;
  if (instLogo) {
    try {
      doc.addImage(instLogo, 'PNG', 15, currentY, 25, 25);
    } catch (e) {
      console.error("Logo error", e);
    }
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ESTADO DE SERGIPE", 45, currentY + 5);
  doc.text(instName, 45, currentY + 10);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(instAddress, 45, currentY + 15);
  doc.text(instCity, 45, currentY + 20);
  doc.text(`C.N.P.J.: ${instCnpj}`, 45, currentY + 25);

  // Document Title (Right side)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const docTitle = `${data.document_type || "Documento"} / ${data.title}`;
  doc.text(docTitle, pageWidth - 15, currentY + 10, { align: "right" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(), "MMMM/yyyy", { locale: ptBR }).toUpperCase(), pageWidth - 15, currentY + 18, { align: "right" });

  currentY += 35;
  doc.setLineWidth(0.5);
  doc.line(15, currentY, pageWidth - 15, currentY);
  
  // 3. Document Info Bar
  currentY += 10;
  doc.setFillColor(240, 240, 240);
  doc.rect(15, currentY, pageWidth - 30, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Tipo: ${data.document_type || "N/A"}`, 20, currentY + 5.5);
  doc.text(`Situação: ${data.is_finalized ? "Finalizado" : "Em Análise"}`, pageWidth - 20, currentY + 5.5, { align: "right" });

  currentY += 15;

  // 4. Solicitor Block (SOLICITANTE)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SOLICITANTE", 15, currentY);
  currentY += 5;
  doc.setLineWidth(0.2);
  doc.line(15, currentY, pageWidth - 15, currentY);
  
  currentY += 6;
  doc.setFont("helvetica", "normal");
  doc.text("Órgão:", 20, currentY);
  doc.text(instName, 45, currentY);
  
  currentY += 5;
  doc.text("Responsável:", 20, currentY);
  doc.text(data.author_name || "N/A", 45, currentY);

  currentY += 5;
  doc.text("Setor:", 20, currentY);
  doc.text(data.department || "Geral", 45, currentY);

  currentY += 15;

  // 5. Budget/Creditor Info (If active)
  if (data.budget_info && data.budget_info.action) {
    doc.setFont("helvetica", "bold");
    doc.text("DOTAÇÃO ORÇAMENTÁRIA", 15, currentY);
    currentY += 5;
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Ação: ${data.budget_info.action}`, 20, currentY);
    doc.text(`Elemento: ${data.budget_info.expense_element}`, 70, currentY);
    doc.text(`Fonte: ${data.budget_info.resource_source}`, 130, currentY);
    currentY += 10;
  }

  if (data.creditor_info && data.creditor_info.name) {
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CREDOR", 15, currentY);
    currentY += 5;
    doc.line(15, currentY, pageWidth - 15, currentY);
    currentY += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Credor: ${data.creditor_info.name}`, 20, currentY);
    doc.text(`Doc: ${data.creditor_info.document}`, 120, currentY);
    currentY += 10;
  }

  // 6. Content Text
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  
  // Basic HTML to Text cleaning (simple version)
  const cleanContent = data.content.replace(/<[^>]*>/g, '\n').replace(/\n\n+/g, '\n').trim();
  const splitContent = doc.splitTextToSize(cleanContent, pageWidth - 30);
  doc.text(splitContent, 15, currentY + 5);
  
  currentY += (splitContent.length * 6) + 15;

  // 7. Items Table
  if (data.items && data.items.length > 0) {
    if (currentY > 230) { doc.addPage(); currentY = 20; }
    
    autoTable(doc, {
      startY: currentY,
      head: [['Descrição', 'Unid', 'Qtd', 'Vlr. Unit', 'Total']],
      body: data.items.map(i => [
        i.description, 
        i.unit, 
        i.quantity, 
        `R$ ${i.value.toFixed(2)}`, 
        `R$ ${(i.quantity * i.value).toFixed(2)}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] },
      margin: { left: 15, right: 15 }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // 8. Signatures Block
  if (currentY > 240) { doc.addPage(); currentY = 20; }
  
  doc.setLineWidth(0.1);
  doc.line( pageWidth / 2 - 40, currentY + 15, pageWidth / 2 + 40, currentY + 15);
  
  if (data.author_signature) {
    try {
      doc.addImage(data.author_signature, 'PNG', pageWidth / 2 - 20, currentY - 10, 40, 20);
    } catch (e) {}
  }
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(data.author_name || "Responsável", pageWidth / 2, currentY + 20, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(data.author_role || "Cargo não informado", pageWidth / 2, currentY + 25, { align: "center" });
  doc.setFontSize(7);
  doc.text(`Documento gerado eletronicamente em ${format(new Date(), "dd/MM/yyyy HH:mm:ss")}`, pageWidth / 2, currentY + 30, { align: "center" });

  // 9. Watermark (Optional)
  if (data.is_finalized) {
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(40);
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
    doc.text("DOCUMENTO ASSINADO", pageWidth / 2, doc.internal.pageSize.getHeight() / 2, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
  }

  const mainPdfBytes = doc.output('arraybuffer');
  
  // 10. Merge Attachments if they are PDFs
  if (data.attachments && data.attachments.length > 0) {
    try {
      const mergedPdf = await PDFDocument.create();
      
      // Add main document first
      const mainPdf = await PDFDocument.load(mainPdfBytes);
      const copiedPages = await mergedPdf.copyPages(mainPdf, mainPdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      
      // Add attachments
      for (const att of data.attachments) {
        if (att.file_type === 'application/pdf' || att.file_url.toLowerCase().endsWith('.pdf')) {
          try {
            const resp = await fetch(att.file_url);
            const attBytes = await resp.arrayBuffer();
            const attPdf = await PDFDocument.load(attBytes);
            const attPages = await mergedPdf.copyPages(attPdf, attPdf.getPageIndices());
            
            attPages.forEach((page) => {
              // Add stamp to each attachment page
              const { width, height } = page.getSize();
              page.drawText(`Assinado digitalmente por: ${data.author_name || 'SISAPI'}`, {
                x: 30,
                y: 20,
                size: 8,
                opacity: 0.5,
              });
              mergedPdf.addPage(page);
            });
          } catch (e) {
            console.error(`Error merging attachment ${att.file_name}:`, e);
          }
        }
      }
      
      const finalPdfBytes = await mergedPdf.save();
      const blob = new Blob([finalPdfBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${data.title || "documento"}_final.pdf`;
      link.click();
      return;
    } catch (error) {
      console.error("Error during PDF merging:", error);
      // Fallback to saving just the main document
    }
  }

  doc.save(`${data.title || "documento"}.pdf`);
};