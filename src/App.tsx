import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Binocular from "./pages/Binocular";
import Microscope from "./pages/Microscope";
import Author from "./pages/Author";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import SiteAssetsApplier from "./components/SiteAssetsApplier";

// 23.10.2026 (Сергей: «облегчи главную»): кабинет, терминал и пробные страницы грузятся своими
// файлами, только когда человек на них зашёл. До этого главная тянула весь сайт одним скриптом
// (1,6 МБ, ~480 КБ сжатым), и человек из Instagram смотрел на пустую страницу, пока тот грузился.
const SchoolAuth = lazy(() => import("./pages/SchoolAuth"));
const SchoolDashboard = lazy(() => import("./pages/SchoolDashboard"));
const SchoolCourse = lazy(() => import("./pages/SchoolCourse"));
const SchoolLesson = lazy(() => import("./pages/SchoolLesson"));
const SchoolAdmin = lazy(() => import("./pages/SchoolAdmin"));
const SchoolStudentDetail = lazy(() => import("./pages/SchoolStudentDetail"));
const SchoolResetPassword = lazy(() => import("./pages/SchoolResetPassword"));
const SchoolProfile = lazy(() => import("./pages/SchoolProfile"));
const SchoolTerminal = lazy(() => import("./pages/SchoolTerminal"));
const TgTerminal = lazy(() => import("./pages/TgTerminal"));
const SchoolAnalytics = lazy(() => import("./pages/SchoolAnalytics"));
const PreviewRedesign = lazy(() => import("./pages/PreviewRedesign"));
const PreviewNext = lazy(() => import("./pages/PreviewNext"));
const PreviewCandles = lazy(() => import("./pages/PreviewCandles"));
const SchoolPreview = lazy(() => import("./pages/SchoolPreview"));
const SchoolLadderPreview = lazy(() => import("./pages/SchoolLadderPreview"));
const SchoolHomePreview = lazy(() => import("./pages/SchoolHomePreview"));
// 29.10.2026: терминал v2 «в стиле приборов» на демо-данных — посмотреть без входа, пока он не выложен
const TerminalPreview = lazy(() => import("./components/terminal2/Preview"));
// 29.10.2026: кабинет v2 на демо-данных — посмотреть разметку без входа
const CabinetPreview = lazy(() => import("./pages/CabinetPreview"));

const queryClient = new QueryClient();

// Пока грузится файл страницы — пустой тёмный фон того же цвета, без мигания белым.
const PageFallback = () => <div className="min-h-screen bg-background" />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SiteAssetsApplier />
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* 28.10.2026: сайт из нескольких страниц (Сергей: «отдельную страницу под бинокль, под микроскоп…
                отдельная страница об авторе») */}
            <Route path="/binocular" element={<Binocular />} />
            <Route path="/microscope" element={<Microscope />} />
            <Route path="/author" element={<Author />} />
            {/* 18.10.2026: терминал внутри Телеграма — кнопка «Терминал» в меню ботов */}
            <Route path="/tg/:bot" element={<TgTerminal />} />
            {/* 22.10.2026 страница цен убрана. С 28.10.2026 старые ссылки на /access (описания YouTube, уроки) ведут
                в «Два пути» главной: оттуда обе страницы с ценами. На сервере то же правило в vercel.json */}
            <Route path="/access" element={<Navigate to="/#paths" replace />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/preview-redesign" element={<PreviewRedesign />} />
            <Route path="/preview-next" element={<PreviewNext />} />
            <Route path="/preview-candles" element={<PreviewCandles />} />
            <Route path="/school/preview" element={<SchoolPreview />} />
            <Route path="/school/ladder-preview" element={<SchoolLadderPreview />} />
            <Route path="/school/home-preview" element={<SchoolHomePreview />} />
            <Route path="/school/terminal-preview" element={<TerminalPreview />} />
            <Route path="/school/cabinet-preview" element={<CabinetPreview />} />
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
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
