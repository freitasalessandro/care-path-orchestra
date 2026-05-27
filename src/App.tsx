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
const DepartmentList = lazy(() => import("@/pages/DepartmentList"));

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
              ) : (
                <>
                  <Route path="/" element={<HRDashboard />} />
                  <Route path="/funcionarios" element={<StaffList />} />
                  <Route path="/unidades" element={<UnitList />} />
                  <Route path="/setores" element={<DepartmentList />} />
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
