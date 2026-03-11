import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";
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
          <div className="h-screen overflow-hidden">
            <AppTopbar />
            <div className="flex pt-14 h-screen">
              <AppSidebar />
              <main className="flex-1 ml-60 p-8 overflow-y-auto">
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
          </div>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
