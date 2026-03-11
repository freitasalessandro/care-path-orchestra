import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const PatientList = lazy(() => import("@/pages/PatientList"));
const PatientDetail = lazy(() => import("@/pages/PatientDetail"));
const SurgeryList = lazy(() => import("@/pages/SurgeryList"));
const SurgeryDetail = lazy(() => import("@/pages/SurgeryDetail"));
const ChecklistTemplates = lazy(() => import("@/pages/ChecklistTemplates"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>
);

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
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pacientes" element={<PatientList />} />
                    <Route path="/pacientes/:id" element={<PatientDetail />} />
                    <Route path="/cirurgias" element={<SurgeryList />} />
                    <Route path="/cirurgias/:id" element={<SurgeryDetail />} />
                    <Route path="/checklists" element={<ChecklistTemplates />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
          </div>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
