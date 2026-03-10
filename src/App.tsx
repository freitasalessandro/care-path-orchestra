import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/pages/Dashboard";
import PatientList from "@/pages/PatientList";
import PatientDetail from "@/pages/PatientDetail";
import SurgeryList from "@/pages/SurgeryList";
import SurgeryDetail from "@/pages/SurgeryDetail";
import ChecklistTemplates from "@/pages/ChecklistTemplates";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <div className="flex min-h-screen">
            <AppSidebar />
            <main className="flex-1 ml-64 p-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pacientes" element={<PatientList />} />
                <Route path="/pacientes/:id" element={<PatientDetail />} />
                <Route path="/cirurgias" element={<SurgeryList />} />
                <Route path="/cirurgias/:id" element={<SurgeryDetail />} />
                <Route path="/checklists" element={<ChecklistTemplates />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
