import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import ScrollToTop from "./components/ScrollToTop";
import OptimizedLayout from "./components/OptimizedLayout";

// Eager load critical home page components only
import Index from "./pages/Index";

// Pre-load CourseCatalog as it's likely to be visited early
const CourseCatalog = React.lazy(() => 
  import("./pages/CourseCatalog").then(module => ({
    default: module.default
  }))
);

// Lazy load all other pages to reduce initial bundle
const CourseDetail = React.lazy(() => import("./pages/CourseDetail"));
const Payment = React.lazy(() => import("./pages/Payment"));
const PurchaseHistory = React.lazy(() => import("./pages/PurchaseHistory"));
const AuthCallback = React.lazy(() => import("./pages/AuthCallback"));
const SearchResults = React.lazy(() => import("./pages/SearchResults"));
const MyPage = React.lazy(() => import("./pages/MyPage"));
const CategoryCourses = React.lazy(() => import("./pages/CategoryCourses"));
const Learn = React.lazy(() => import("./pages/Learn"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Lazy load user pages
const FavoriteCourses = React.lazy(() => import("./pages/FavoriteCourses"));
const MyRewards = React.lazy(() => import("./pages/MyRewards"));


const FAQ = React.lazy(() => import("./pages/FAQ"));
const ProfileSettings = React.lazy(() => import("./pages/ProfileSettings"));
const About = React.lazy(() => import("./pages/About"));
const InstructorApply = React.lazy(() => import("./pages/InstructorApply"));
const Policies = React.lazy(() => import("./pages/Policies"));
const SecurityTest = React.lazy(() => import("./pages/SecurityTest"));

// Lazy load admin pages (heaviest components)
const Admin = React.lazy(() => import("./pages/Admin"));
const AdminUsers = React.lazy(() => import("./pages/admin/Users"));
const AdminCourses = React.lazy(() => import("./pages/admin/Courses"));
const AdminOrders = React.lazy(() => import("./pages/admin/Orders"));
const AdminCourseCreate = React.lazy(() => import("./pages/admin/CourseCreate"));
const AdminCoupons = React.lazy(() => import("./pages/admin/Coupons"));
const AdminReports = React.lazy(() => import("./pages/admin/Reports"));
const AdminCourseEdit = React.lazy(() => import("./pages/admin/CourseEdit"));
const AdminInstructors = React.lazy(() => import("./pages/admin/Instructors"));
const AdminInstructorProfile = React.lazy(() => import("./pages/admin/InstructorProfile"));
const AdminSessionManagement = React.lazy(() => import("./pages/admin/SessionManagement"));
const AdminSectionManagement = React.lazy(() => import("./pages/admin/SectionManagement"));
const AdminLearningAnalytics = React.lazy(() => import("./pages/admin/LearningAnalytics"));
const AdminProgressMonitoring = React.lazy(() => import("./pages/admin/ProgressMonitoring"));
const AdminHeroSlides = React.lazy(() => import("./pages/admin/HeroSlides"));
const AdminHomepageSections = React.lazy(() => import("./pages/admin/HomepageSections"));
const AdminHomepageSectionManager = React.lazy(() => import("./pages/admin/HomepageSectionManager"));
const AdminAccessPeriod = React.lazy(() => import("./pages/admin/AccessPeriodManagement"));
const AdminUserDetail = React.lazy(() => import("./pages/admin/UserDetail"));
const AdminAnnouncements = React.lazy(() => import("./pages/admin/Announcements"));
const AdminLegalDocuments = React.lazy(() => import("./pages/admin/LegalDocuments"));

// Optimized loading fallback with critical CSS classes
const PageLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center fade-in">
      <div className="loading-spinner mb-4"></div>
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>
        <TooltipProvider>
          <OptimizedLayout>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<PageLoading />}>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/instructor-apply" element={<InstructorApply />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/courses" element={<CourseCatalog />} />
                <Route path="/courses/:category" element={<CategoryCourses />} />
                <Route path="/course/:id" element={<CourseDetail />} />
                <Route path="/payment/:id" element={<Payment />} />
                
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                <Route path="/purchase-history" element={<PurchaseHistory />} />
                <Route path="/my-page" element={<MyPage />} />
                <Route path="/my-rewards" element={<MyRewards />} />
                <Route path="/favorite-courses" element={<FavoriteCourses />} />
                
                
                <Route path="/faq" element={<FAQ />} />
                <Route path="/profile-settings" element={<ProfileSettings />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/users/:userId" element={<AdminUserDetail />} />
                <Route path="/admin/courses" element={<AdminCourses />} />
                <Route path="/admin/courses/edit/:id" element={<AdminCourseEdit />} />
                <Route path="/admin/course-create" element={<AdminCourseCreate />} />
                <Route path="/admin/sessions" element={<AdminSessionManagement />} />
                <Route path="/admin/section-management" element={<AdminSectionManagement />} />
                <Route path="/admin/access-period" element={<AdminAccessPeriod />} />
                <Route path="/admin/learning-analytics" element={<AdminLearningAnalytics />} />
                <Route path="/admin/progress-monitoring" element={<AdminProgressMonitoring />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/coupons" element={<AdminCoupons />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/instructors" element={<AdminInstructors />} />
                <Route path="/admin/instructor-profile/:id" element={<AdminInstructorProfile />} />
                <Route path="/admin/hero-slides" element={<AdminHeroSlides />} />
                <Route path="/admin/homepage-sections" element={<AdminHomepageSections />} />
                <Route path="/admin/homepage-sections/:sectionType" element={<AdminHomepageSectionManager />} />
                <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                <Route path="/admin/legal-documents" element={<AdminLegalDocuments />} />
                <Route path="/security-test" element={<SecurityTest />} />
                <Route path="/learn/:courseId" element={<Learn />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </OptimizedLayout>
        </TooltipProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
