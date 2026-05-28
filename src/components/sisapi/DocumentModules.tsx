import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Item {
  description: string;
  unit: string;
  quantity: number;
  value: number;
}

interface ItemsModuleProps {
  items: Item[];
  onChange: (items: Item[]) => void;
}

export function ItemsModule({ items, onChange }: ItemsModuleProps) {
  const addItem = () => {
    onChange([...items, { description: "", unit: "", quantity: 1, value: 0 }]);
  };

  const updateItem = (index: number, field: keyof Item, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const total = items.reduce((acc, item) => acc + (item.quantity * item.value), 0);

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-slate-800">Lista de Itens</h3>
        <Button size="sm" onClick={addItem} type="button">
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-20">Unidade</TableHead>
            <TableHead className="w-20">Qtd</TableHead>
            <TableHead className="w-32">Vlr. Unit</TableHead>
            <TableHead className="w-32">Subtotal</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <Input value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} />
              </TableCell>
              <TableCell>
                <Input value={item.unit} onChange={(e) => updateItem(index, 'unit', e.target.value)} />
              </TableCell>
              <TableCell>
                <Input type="number" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} />
              </TableCell>
              <TableCell>
                <Input type="number" value={item.value} onChange={(e) => updateItem(index, 'value', Number(e.target.value))} />
              </TableCell>
              <TableCell className="font-medium text-slate-700">
                {(item.quantity * item.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </TableCell>
              <TableCell>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeItem(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-4">Nenhum item adicionado</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="text-right text-lg font-bold text-slate-900 pr-10">
        Total Geral: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </div>
    </div>
  );
}

interface BudgetInfo {
  action: string;
  expense_element: string;
  resource_source: string;
}

interface BudgetModuleProps {
  data: BudgetInfo;
  onChange: (data: BudgetInfo) => void;
}

export function BudgetModule({ data, onChange }: BudgetModuleProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-lg bg-slate-50">
      <div className="space-y-2">
        <Label>Ação</Label>
        <Input value={data.action} onChange={(e) => onChange({...data, action: e.target.value})} placeholder="Ex: 2045" />
      </div>
      <div className="space-y-2">
        <Label>Elemento de Despesa</Label>
        <Input value={data.expense_element} onChange={(e) => onChange({...data, expense_element: e.target.value})} placeholder="Ex: 33.90.30" />
      </div>
      <div className="space-y-2">
        <Label>Fonte de Recurso</Label>
        <Input value={data.resource_source} onChange={(e) => onChange({...data, resource_source: e.target.value})} placeholder="Ex: 1500" />
      </div>
    </div>
  );
}

interface CreditorInfo {
  name: string;
  document: string;
  address: string;
  bank_details: string;
}

interface CreditorModuleProps {
  data: CreditorInfo;
  onChange: (data: CreditorInfo) => void;
}

export function CreditorModule({ data, onChange }: CreditorModuleProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-slate-50">
      <div className="space-y-2">
        <Label>Nome do Credor</Label>
        <Input value={data.name} onChange={(e) => onChange({...data, name: e.target.value})} />
      </div>
      <div className="space-y-2">
        <Label>CPF/CNPJ</Label>
        <Input value={data.document} onChange={(e) => onChange({...data, document: e.target.value})} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Endereço</Label>
        <Input value={data.address} onChange={(e) => onChange({...data, address: e.target.value})} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Dados Bancários</Label>
        <Input value={data.bank_details} onChange={(e) => onChange({...data, bank_details: e.target.value})} placeholder="Banco, Agência, Conta..." />
      </div>
    </div>
  );
}
