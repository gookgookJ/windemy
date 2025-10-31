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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  Image,
  Target,
  Zap,
  Crown,
  Monitor,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
    title: '강의 생성',
    url: '/admin/course-create',
    icon: PlusCircle,
    group: 'content'
  },
  {
    title: '강의 관리',
    url: '/admin/courses',
    icon: BookOpen,
    group: 'content'
  },
  {
    title: '강의 영상 관리',
    url: '/admin/sessions',
    icon: Calendar,
    group: 'content'
  },
  {
    title: '강의 자료 관리',
    url: '/admin/section-management',
    icon: FileText,
    group: 'content'
  },
  {
    title: '학습 기간 관리',
    url: '/admin/access-period',
    icon: Clock,
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
    url: '#',
    icon: BookOpen,
    group: 'content',
    submenu: [
      {
        title: '지금 가장 주목받는 강의',
        url: '/admin/homepage-sections/featured',
        icon: Target
      },
      {
        title: '무료로 배우는 이커머스',
        url: '/admin/homepage-sections/free',
        icon: Zap
      },
      {
        title: '프리미엄 강의', 
        url: '/admin/homepage-sections/premium',
        icon: Crown
      },
      {
        title: 'VOD 강의',
        url: '/admin/homepage-sections/vod',
        icon: Monitor
      }
    ]
  },
  {
    title: '공지사항 관리',
    url: '/admin/announcements',
    icon: MessageSquare,
    group: 'policy'
  },
  {
    title: 'FAQ 관리',
    url: '/admin/faq-management',
    icon: MessageSquare,
    group: 'policy'
  },
  {
    title: '약관 및 정책 관리',
    url: '/admin/legal-documents',
    icon: Shield,
    group: 'policy'
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
    title: '쿠폰 관리',
    url: '/admin/coupons',
    icon: DollarSign,
    group: 'marketing'
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
  policy: '정책 관리',
  analytics: '학습 분석',
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
    if (path === '#') return false;
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

  const renderMenuItem = (item: any) => {
    if (item.submenu) {
      return (
        <SidebarMenuItem key={item.title}>
          <Collapsible defaultOpen={currentPath.includes('/admin/homepage-sections')}>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton className={`w-full ${getNavClassName('#')}`}>
                <div className="flex items-center">
                  <item.icon className="mr-2 h-4 w-4" />
                  {state !== "collapsed" && <span>{item.title}</span>}
                </div>
                {state !== "collapsed" && <ChevronRight className="h-4 w-4 ml-auto" />}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.submenu.map((subItem: any) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton asChild>
                      <NavLink 
                        to={subItem.url} 
                        className={getNavClassName(subItem.url)}
                        onClick={() => {
                          requestAnimationFrame(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          });
                        }}
                      >
                        <subItem.icon className="mr-2 h-4 w-4" />
                        {state !== "collapsed" && <span>{subItem.title}</span>}
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink 
            to={item.url} 
            className={getNavClassName(item.url)}
            end={item.url === '/admin'}
            onClick={() => {
              requestAnimationFrame(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              });
            }}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {state !== "collapsed" && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

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
                {items.map((item) => renderMenuItem(item))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};