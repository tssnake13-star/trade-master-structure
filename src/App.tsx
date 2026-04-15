import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SchoolAuth from "./pages/SchoolAuth";
import SchoolDashboard from "./pages/SchoolDashboard";
import SchoolCourse from "./pages/SchoolCourse";
import SchoolLesson from "./pages/SchoolLesson";
import SchoolAdmin from "./pages/SchoolAdmin";
import SchoolResetPassword from "./pages/SchoolResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/school" element={<SchoolAuth />} />
            <Route path="/school/dashboard" element={<SchoolDashboard />} />
            <Route path="/school/course/:id" element={<SchoolCourse />} />
            <Route path="/school/lesson/:id" element={<SchoolLesson />} />
            <Route path="/school/admin" element={<SchoolAdmin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
