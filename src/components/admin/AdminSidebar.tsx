import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ShoppingCart,
  BarChart3,
  Settings,
  MessageSquare,
  FileText,
  DollarSign,
  Calendar,
  Shield,
  PlusCircle,
  Image
} from 'lucide-react';

const menuItems = [
  {
    title: '대시보드',
    url: '/admin',
    icon: LayoutDashboard,
    group: 'main'
  },
  {
    title: '사용자 관리',
    url: '/admin/users',
    icon: Users,
    group: 'main'
  },
  {
    title: '강의 관리',
    url: '/admin/courses',
    icon: BookOpen,
    group: 'content'
  },
  {
    title: '강의 생성',
    url: '/admin/course-create',
    icon: PlusCircle,
    group: 'content'
  },
  {
    title: '세션 관리',
    url: '/admin/sessions',
    icon: Calendar,
    group: 'content'
  },
  {
    title: '섹션 자료 관리',
    url: '/admin/section-management',
    icon: FileText,
    group: 'content'
  },
  {
    title: '히어로 슬라이드',
    url: '/admin/hero-slides',
    icon: Image,
    group: 'content'
  },
  {
    title: '메인 페이지 섹션',
    url: '/admin/homepage-sections',
    icon: BookOpen,
    group: 'content'
  },
  {
    title: '주문 관리',
    url: '/admin/orders',
    icon: ShoppingCart,
    group: 'main'
  },
  {
    title: '학습 분석',
    url: '/admin/learning-analytics',
    icon: BarChart3,
    group: 'analytics'
  },
  {
    title: '수강 통계',
    url: '/admin/enrollment-stats',
    icon: Users,
    group: 'analytics'
  },
  {
    title: '진도 모니터링',
    url: '/admin/progress-monitoring',
    icon: FileText,
    group: 'analytics'
  },
  {
    title: '보고서',
    url: '/admin/reports',
    icon: BarChart3,
    group: 'analytics'
  },
  {
    title: '고객 지원',
    url: '/admin/support',
    icon: MessageSquare,
    group: 'support'
  },
  {
    title: '공지사항',
    url: '/admin/announcements',
    icon: FileText,
    group: 'support'
  },
  {
    title: '쿠폰 관리',
    url: '/admin/coupons',
    icon: DollarSign,
    group: 'marketing'
  },
  {
    title: '설정',
    url: '/admin/settings',
    icon: Settings,
    group: 'system'
  },
  {
    title: '강사 관리',
    url: '/admin/instructors',
    icon: Users,
    group: 'system'
  },
  {
    title: '권한 관리',
    url: '/admin/permissions',
    icon: Shield,
    group: 'system'
  },
  {
    title: '활동 로그',
    url: '/admin/logs',
    icon: FileText,
    group: 'system'
  }
];

const groupLabels = {
  main: '주요 관리',
  content: '콘텐츠 관리',
  analytics: '학습 분석',
  support: '고객 지원',
  marketing: '마케팅',
  system: '시스템 관리'
};

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-muted/50";
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <Sidebar collapsible="icon" className="pt-16 border-r">
      <SidebarContent className="pt-2">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center space-x-2">
            {state !== "collapsed" && (
              <h2 className="font-semibold text-foreground">관리자</h2>
            )}
          </div>
          <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
        </div>
        
        {Object.entries(groupedItems).map(([group, items]) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>
              {state !== "collapsed" && groupLabels[group as keyof typeof groupLabels]}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClassName(item.url)}
                        end={item.url === '/admin'}
                        onClick={() => {
                          // Smooth scroll to top when navigating
                          setTimeout(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }, 100);
                        }}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};