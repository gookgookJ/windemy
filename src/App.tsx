import React from "react";
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
import AdminUsers from "./pages/admin/Users";
import AdminCourses from "./pages/admin/Courses";
import AdminOrders from "./pages/admin/Orders";
import AdminCourseCreate from "./pages/admin/CourseCreate";
import AdminAnnouncements from "./pages/admin/Announcements";
import AdminCoupons from "./pages/admin/Coupons";
import AdminSupport from "./pages/admin/Support";
import AdminReports from "./pages/admin/Reports";
import AdminSettings from "./pages/admin/Settings";
import AdminCourseEdit from "./pages/admin/CourseEdit";
import AdminInstructors from "./pages/admin/Instructors";
import AdminInstructorProfile from "./pages/admin/InstructorProfile";
import AdminSessionManagement from "./pages/admin/SessionManagement";
import AdminLearningAnalytics from "./pages/admin/LearningAnalytics";
import AdminProgressMonitoring from "./pages/admin/ProgressMonitoring";
import Learn from "./pages/Learn";
import NotFound from "./pages/NotFound";

console.log('Debug React in App.tsx', React, typeof (React as any)?.useEffect);

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
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/courses/edit/:id" element={<AdminCourseEdit />} />
            <Route path="/admin/course-create" element={<AdminCourseCreate />} />
            <Route path="/admin/sessions" element={<AdminSessionManagement />} />
            <Route path="/admin/learning-analytics" element={<AdminLearningAnalytics />} />
            <Route path="/admin/progress-monitoring" element={<AdminProgressMonitoring />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/admin/support" element={<AdminSupport />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/instructors" element={<AdminInstructors />} />
            <Route path="/admin/instructor-profile/:id" element={<AdminInstructorProfile />} />
            <Route path="/learn/:courseId" element={<Learn />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
