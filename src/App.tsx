import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import SchoolProfile from "./pages/SchoolProfile";
import SchoolTerminal from "./pages/SchoolTerminal";
import TgTerminal from "./pages/TgTerminal";
import SchoolAnalytics from "./pages/SchoolAnalytics";
import PreviewRedesign from "./pages/PreviewRedesign";
import PreviewNext from "./pages/PreviewNext";
import PreviewCandles from "./pages/PreviewCandles";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SchoolPreview from "./pages/SchoolPreview";
import SchoolLadderPreview from "./pages/SchoolLadderPreview";
import SchoolHomePreview from "./pages/SchoolHomePreview";
import SiteAssetsApplier from "./components/SiteAssetsApplier";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SiteAssetsApplier />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* 18.10.2026: терминал внутри Телеграма — кнопка «Терминал» в меню ботов */}
            <Route path="/tg/:bot" element={<TgTerminal />} />
            {/* 22.10.2026 страница цен убрана: цены в «09 · Сотрудничество», схему путей объясняет ролик «Карта школы».
                Старые ссылки на /access (описания YouTube, уроки) ведут туда же; на сервере то же правило в vercel.json */}
            <Route path="/access" element={<Navigate to="/#formats" replace />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
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
            <Route path="/school/admin/analytics" element={<SchoolAnalytics />} />
            <Route path="/school/reset-password" element={<SchoolResetPassword />} />
            <Route path="/school/profile" element={<SchoolProfile />} />
            <Route path="/school/terminal" element={<SchoolTerminal />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
