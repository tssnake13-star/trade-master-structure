import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SchoolAuth from "./pages/SchoolAuth";
import SchoolDashboard from "./pages/SchoolDashboard";
import SchoolCourse from "./pages/SchoolCourse";
import SchoolLesson from "./pages/SchoolLesson";
import SchoolAdmin from "./pages/SchoolAdmin";
import SchoolStudentDetail from "./pages/SchoolStudentDetail";
import SchoolResetPassword from "./pages/SchoolResetPassword";
import PreviewRedesign from "./pages/PreviewRedesign";
import PreviewNext from "./pages/PreviewNext";
import PreviewCandles from "./pages/PreviewCandles";
import Access from "./pages/Access";
import SchoolPreview from "./pages/SchoolPreview";
import SchoolLadderPreview from "./pages/SchoolLadderPreview";
import SchoolHomePreview from "./pages/SchoolHomePreview";
import SiteAssetsApplier from "./components/SiteAssetsApplier";

const queryClient = new QueryClient();

// Outer providers (no router). Reused by the browser entry (main.tsx) and by the
// build-time SSR pre-render (entry-server.tsx) so both trees are identical.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {children}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const App = () => (
  <AppShell>
    <BrowserRouter>
      <SiteAssetsApplier />
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/access" element={<Access />} />
          <Route path="/preview-redesign" element={<PreviewRedesign />} />
          <Route path="/preview-next" element={<PreviewNext />} />
          <Route path="/preview-candles" element={<PreviewCandles />} />
          <Route path="/school/preview" element={<SchoolPreview />} />
          <Route path="/school/ladder-preview" element={<SchoolLadderPreview />} />
          <Route path="/school/home-preview" element={<SchoolHomePreview />} />
          <Route path="/school" element={<SchoolAuth />} />
          <Route path="/school/dashboard" element={<SchoolDashboard />} />
          <Route path="/school/course/:id" element={<SchoolCourse />} />
          <Route path="/school/lesson/:id" element={<SchoolLesson />} />
          <Route path="/school/admin" element={<SchoolAdmin />} />
          <Route path="/school/admin/students/:id" element={<SchoolStudentDetail />} />
          <Route path="/school/reset-password" element={<SchoolResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </AppShell>
);

export default App;
