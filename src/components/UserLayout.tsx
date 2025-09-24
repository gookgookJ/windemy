import React from 'react';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';
import MobileUserMenu from '@/components/MobileUserMenu';

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

const UserLayout = ({ children, title, description }: UserLayoutProps) => {
  return (
    <div className="bg-background min-h-screen">
      <Header />
      <MobileUserMenu />
      
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* 사이드바 - 데스크톱에서만 표시 */}
            <div className="hidden lg:block lg:w-80 flex-shrink-0">
              <UserSidebar />
            </div>
            
            {/* 메인 콘텐츠 */}
            <div className="flex-1 lg:pl-6">
              {title && (
                <div className="mb-6 lg:mb-8">
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
                  {description && (
                    <p className="text-muted-foreground text-sm sm:text-base">{description}</p>
                  )}
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserLayout;