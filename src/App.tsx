import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import { SidebarProvider, useSidebarContext } from "@/contexts/SidebarContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { AppTopbar } from "@/components/AppTopbar";

// Shared Pages
const Login = lazy(() => import("@/pages/Login"));
const ModuleSelection = lazy(() => import("@/pages/ModuleSelection"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Surgery Module Pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const PatientList = lazy(() => import("@/pages/PatientList"));
const PatientDetail = lazy(() => import("@/pages/PatientDetail"));
const SurgeryList = lazy(() => import("@/pages/SurgeryList"));
const SurgeryDetail = lazy(() => import("@/pages/SurgeryDetail"));
const ChecklistTemplates = lazy(() => import("@/pages/ChecklistTemplates"));

// HR Module Pages
const HRDashboard = lazy(() => import("@/pages/HRDashboard"));
const StaffList = lazy(() => import("@/pages/StaffList"));
const UnitList = lazy(() => import("@/pages/UnitList"));
const HRReports = lazy(() => import("@/pages/HRReports"));
const PositionList = lazy(() => import("@/pages/PositionList"));

// Iose Module Pages
const IoseDashboard = lazy(() => import("@/pages/IoseDashboard"));
const IosePatientList = lazy(() => import("@/pages/IosePatientList"));
const IoseSurgeryList = lazy(() => import("@/pages/IoseSurgeryList"));
const IoseReports = lazy(() => import("@/pages/IoseReports"));
const SecretariatSettings = lazy(() => import("@/pages/SecretariatSettings"));

// SISAPI Module Pages
const SisapiDashboard = lazy(() => import("@/pages/SisapiDashboard"));
const SisapiDocumentList = lazy(() => import("@/pages/SisapiDocumentList"));
const SisapiDocumentEditor = lazy(() => import("@/pages/SisapiDocumentEditor"));
const SisapiPendingActions = lazy(() => import("@/pages/SisapiPendingActions"));
const SisapiArchive = lazy(() => import("@/pages/SisapiArchive"));
const SisapiAdminUsers = lazy(() => import("@/pages/SisapiAdminUsers"));
const SisapiAdminSetup = lazy(() => import("@/pages/SisapiAdminSetup"));
const SisapiRoles = lazy(() => import("@/pages/SisapiRoles"));
const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen text-muted-foreground bg-gray-50">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span>Carregando...</span>
    </div>
  </div>
);

function AppLayout() {
  const { collapsed } = useSidebarContext();
  const { selectedModule } = useAuth();

  if (!selectedModule) {
    return <Navigate to="/modules" replace />;
  }

  return (
    <div className="h-screen overflow-hidden">
      <AppTopbar />
      <div className="flex pt-14 h-screen">
        <AppSidebar />
        <main className={`flex-1 p-8 overflow-y-auto transition-all duration-200 ${collapsed ? "ml-16" : "ml-60"}`}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {selectedModule === "surgeries" ? (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/pacientes" element={<PatientList />} />
                  <Route path="/pacientes/:id" element={<PatientDetail />} />
                  <Route path="/cirurgias" element={<SurgeryList />} />
                  <Route path="/cirurgias/:id" element={<SurgeryDetail />} />
                  <Route path="/checklists" element={<ChecklistTemplates />} />
                </>
              ) : selectedModule === "hr" ? (
                <>
                  <Route path="/" element={<HRDashboard />} />
                  <Route path="/funcionarios" element={<StaffList />} />
                  <Route path="/unidades" element={<UnitList />} />
                  <Route path="/relatorios" element={<HRReports />} />
                  <Route path="/funcoes" element={<PositionList />} />
                  <Route path="/configuracoes" element={<SecretariatSettings />} />
                </>
              ) : selectedModule === "iose" ? (
                <>
                  <Route path="/" element={<IoseDashboard />} />
                  <Route path="/pacientes" element={<IosePatientList />} />
                  <Route path="/lista" element={<IoseSurgeryList />} />
                  <Route path="/relatorios" element={<IoseReports />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<SisapiDashboard />} />
                  <Route path="/documentos" element={<SisapiDocumentList />} />
                  <Route path="/documentos/novo" element={<SisapiDocumentEditor />} />
                  <Route path="/documentos/editar/:id" element={<SisapiDocumentEditor />} />
                  <Route path="/pendentes" element={<SisapiPendingActions />} />
                  <Route path="/acervo" element={<SisapiArchive />} />
                  <Route path="/usuarios" element={<SisapiAdminUsers />} />
                  <Route path="/funcoes" element={<SisapiRoles />} />
                  <Route path="/configuracoes" element={<SisapiAdminSetup />} />
                </>
              )}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/modules"
                  element={
                    <PrivateRoute>
                      <ModuleSelection />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/*"
                  element={
                    <PrivateRoute>
                      <SidebarProvider>
                        <AppLayout />
                      </SidebarProvider>
                    </PrivateRoute>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AppProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
