import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import CourseDetail from "./pages/CourseDetail";
import CourseCatalog from "./pages/CourseCatalog";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import MyPage from "./pages/MyPage";
import Admin from "./pages/Admin";
import Learn from "./pages/Learn";
import NotFound from "./pages/NotFound";
import CourseManagement from "./pages/CourseManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/my-page" element={<MyPage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/learn/:courseId" element={<Learn />} />
            <Route path="/course-management" element={<CourseManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
