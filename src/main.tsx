import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import { FavoritesProvider } from '@/contexts/FavoritesContext'
import App from './App.tsx'
import Index from '@/pages/Index.tsx'
import About from '@/pages/About.tsx'
import FAQ from '@/pages/FAQ.tsx'
import CourseCatalog from '@/pages/CourseCatalog.tsx'
import CourseDetail from '@/pages/CourseDetail.tsx'
import CategoryCourses from '@/pages/CategoryCourses.tsx'
import SearchResults from '@/pages/SearchResults.tsx'
import Learn from '@/pages/Learn.tsx'
import MyPage from '@/pages/MyPage.tsx'
import ProfileSettings from '@/pages/ProfileSettings.tsx'
import FavoriteCourses from '@/pages/FavoriteCourses.tsx'
import PurchaseHistory from '@/pages/PurchaseHistory.tsx'
import ReviewManagement from '@/pages/ReviewManagement.tsx'
import Inquiry from '@/pages/Inquiry.tsx'
import InstructorApply from '@/pages/InstructorApply.tsx'
import Payment from '@/pages/Payment.tsx'
import AuthCallback from '@/pages/AuthCallback.tsx'
import Admin from '@/pages/Admin.tsx'
import { AdminLayout } from '@/layouts/AdminLayout.tsx'
import Courses from '@/pages/admin/Courses.tsx'
import CourseCreate from '@/pages/admin/CourseCreate.tsx'
import CourseEdit from '@/pages/admin/CourseEdit.tsx'
import Users from '@/pages/admin/Users.tsx'
import Orders from '@/pages/admin/Orders.tsx'
import Reports from '@/pages/admin/Reports.tsx'
import Settings from '@/pages/admin/Settings.tsx'
import HeroSlides from '@/pages/admin/HeroSlides.tsx'
import HomepageSections from '@/pages/admin/HomepageSections.tsx'
import HomepageSectionManager from '@/pages/admin/HomepageSectionManager.tsx'
import SectionManagement from '@/pages/admin/SectionManagement.tsx'
import SessionManagement from '@/pages/admin/SessionManagement.tsx'
import ProgressMonitoring from '@/pages/admin/ProgressMonitoring.tsx'
import LearningAnalytics from '@/pages/admin/LearningAnalytics.tsx'
import InstructorProfile from '@/pages/admin/InstructorProfile.tsx'
import Instructors from '@/pages/admin/Instructors.tsx'
import Announcements from '@/pages/admin/Announcements.tsx'
import Coupons from '@/pages/admin/Coupons.tsx'
import Support from '@/pages/admin/Support.tsx'
import NotFound from '@/pages/NotFound.tsx'
import './index.css'
import { queryClient } from './lib/queryClient'

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />}>
                <Route index element={<Index />} />
                <Route path="about" element={<About />} />
                <Route path="faq" element={<FAQ />} />
                <Route path="courses" element={<CourseCatalog />} />
                <Route path="courses/:category" element={<CategoryCourses />} />
                <Route path="course/:id" element={<CourseDetail />} />
                <Route path="search" element={<SearchResults />} />
                <Route path="learn/:id" element={<Learn />} />
                <Route path="mypage" element={<MyPage />} />
                <Route path="profile-settings" element={<ProfileSettings />} />
                <Route path="favorites" element={<FavoriteCourses />} />
                <Route path="purchase-history" element={<PurchaseHistory />} />
                <Route path="reviews" element={<ReviewManagement />} />
                <Route path="inquiry" element={<Inquiry />} />
                <Route path="instructor-apply" element={<InstructorApply />} />
                <Route path="payment" element={<Payment />} />
                <Route path="auth/callback" element={<AuthCallback />} />
                
                <Route path="admin" element={<AdminLayout><Outlet /></AdminLayout>}>
                  <Route index element={<Admin />} />
                  <Route path="courses" element={<Courses />} />
                  <Route path="courses/create" element={<CourseCreate />} />
                  <Route path="courses/edit/:id" element={<CourseEdit />} />
                  <Route path="users" element={<Users />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="hero-slides" element={<HeroSlides />} />
                  <Route path="homepage-sections" element={<HomepageSections />} />
                  <Route path="homepage-sections/:id" element={<HomepageSectionManager />} />
                  <Route path="section-management" element={<SectionManagement />} />
                  <Route path="session-management" element={<SessionManagement />} />
                  <Route path="progress-monitoring" element={<ProgressMonitoring />} />
                  <Route path="learning-analytics" element={<LearningAnalytics />} />
                  <Route path="instructor-profile" element={<InstructorProfile />} />
                  <Route path="instructors" element={<Instructors />} />
                  <Route path="announcements" element={<Announcements />} />
                  <Route path="coupons" element={<Coupons />} />
                  <Route path="support" element={<Support />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </FavoritesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);