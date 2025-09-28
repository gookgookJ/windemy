import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { UserDashboard } from '@/components/admin/UserDashboard';
import { UserFilters, UserFilterOptions } from '@/components/admin/UserFilters';
import { UserTable } from '@/components/admin/UserTable';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 페이지네이션 상수
const ITEMS_PER_PAGE = 20;

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersThisMonth: number;
  adminUsers: number;
  instructorUsers: number;
  studentUsers: number;
}

// Mock 데이터 생성 함수
const generateMockUsers = (page: number, itemsPerPage: number, filters: UserFilterOptions) => {
  const mockUsers = [
    {
      id: '1',
      full_name: '김영희',
      email: 'kim.younghee@email.com',
      phone: '010-1234-5678',
      role: 'student',
      created_at: '2024-01-15T10:30:00Z',
      avatar_url: null,
      marketing_consent: true,
      total_payment: 89000,
      status: 'active',
      last_login: '2024-03-20T14:22:00Z'
    },
    {
      id: '2',
      full_name: '이철수',
      email: 'lee.chulsoo@email.com',
      phone: '010-2345-6789',
      role: 'instructor',
      created_at: '2023-11-08T09:15:00Z',
      avatar_url: null,
      marketing_consent: false,
      total_payment: 245000,
      status: 'active',
      last_login: '2024-03-19T16:45:00Z'
    },
    {
      id: '3',
      full_name: '박민지',
      email: 'park.minji@email.com',
      phone: '010-3456-7890',
      role: 'student',
      created_at: '2024-02-20T11:00:00Z',
      avatar_url: null,
      marketing_consent: true,
      total_payment: 156000,
      status: 'active',
      last_login: '2024-03-18T09:30:00Z'
    },
    {
      id: '4',
      full_name: '정수연',
      email: 'jung.suyeon@email.com',
      phone: '010-4567-8901',
      role: 'admin',
      created_at: '2023-08-12T08:45:00Z',
      avatar_url: null,
      marketing_consent: true,
      total_payment: 0,
      status: 'active',
      last_login: '2024-03-21T10:15:00Z'
    },
    {
      id: '5',
      full_name: '한지민',
      email: 'han.jimin@email.com',
      phone: '010-5678-9012',
      role: 'student',
      created_at: '2024-03-01T13:20:00Z',
      avatar_url: null,
      marketing_consent: false,
      total_payment: 78000,
      status: 'inactive',
      last_login: '2024-03-05T15:10:00Z'
    },
    {
      id: '6',
      full_name: '강태우',
      email: 'kang.taewoo@email.com',
      phone: '010-6789-0123',
      role: 'instructor',
      created_at: '2023-09-15T12:30:00Z',
      avatar_url: null,
      marketing_consent: true,
      total_payment: 320000,
      status: 'active',
      last_login: '2024-03-20T11:40:00Z'
    },
    {
      id: '7',
      full_name: '송혜교',
      email: 'song.hyekyo@email.com',
      phone: '010-7890-1234',
      role: 'student',
      created_at: '2024-01-28T16:45:00Z',
      avatar_url: null,
      marketing_consent: true,
      total_payment: 134000,
      status: 'active',
      last_login: '2024-03-19T14:25:00Z'
    },
    {
      id: '8',
      full_name: '최민호',
      email: 'choi.minho@email.com',
      phone: '010-8901-2345',
      role: 'student',
      created_at: '2024-02-14T09:00:00Z',
      avatar_url: null,
      marketing_consent: false,
      total_payment: 67000,
      status: 'active',
      last_login: '2024-03-17T13:50:00Z'
    }
  ];

  // 필터 적용
  let filteredUsers = mockUsers;

  if (filters.searchTerm) {
    const searchTerm = filters.searchTerm.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.full_name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.phone.includes(searchTerm)
    );
  }

  if (filters.role !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.role === filters.role);
  }

  if (filters.status !== 'all') {
    filteredUsers = filteredUsers.filter(user => user.status === filters.status);
  }

  if (filters.marketingEmail !== 'all') {
    filteredUsers = filteredUsers.filter(user => 
      user.marketing_consent === (filters.marketingEmail === 'true')
    );
  }

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  return {
    users: filteredUsers.slice(startIndex, endIndex),
    totalCount: filteredUsers.length
  };
};

const generateMockStats = (): UserStats => {
  return {
    totalUsers: 847,
    activeUsers: 692,
    inactiveUsers: 155,
    newUsersThisMonth: 84,
    adminUsers: 3,
    instructorUsers: 24,
    studentUsers: 820,
  };
};

export const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<UserFilterOptions>({
    searchTerm: '',
    status: 'all',
    role: 'all',
    marketingEmail: 'all',
    marketingSms: 'all'
  });
  const { toast } = useToast();

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Mock 데이터 로딩
  useEffect(() => {
    const loadMockData = async () => {
      setLoading(true);
      
      // 실제 API 호출을 시뮬레이션하기 위한 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { users: mockUsers, totalCount: mockTotalCount } = generateMockUsers(currentPage, ITEMS_PER_PAGE, filters);
      
      setUsers(mockUsers);
      setTotalCount(mockTotalCount);
      setLoading(false);
    };

    loadMockData();
  }, [filters, currentPage]);

  // Mock Stats 로딩
  useEffect(() => {
    const loadMockStats = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setStats(generateMockStats());
    };

    loadMockStats();
  }, []);

  const handleFiltersChange = (newFilters: UserFilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 이동
  };

  const handleResetFilters = () => {
    setFilters({
      searchTerm: '',
      status: 'all',
      role: 'all',
      marketingEmail: 'all',
      marketingSms: 'all'
    });
    setCurrentPage(1);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setShowDetailModal(true);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "권한 변경 완료",
        description: "사용자 권한이 성공적으로 변경되었습니다.",
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "권한 변경 실패",
        description: "사용자 권한 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    switch (action) {
      case 'export':
        exportToCSV(userIds);
        break;
      default:
        toast({
          title: "기능 준비 중",
          description: "해당 기능은 추후 구현 예정입니다.",
        });
    }
  };

  const exportToCSV = (userIds: string[]) => {
    const selectedUsers = users.filter(user => userIds.includes(user.id));
    const csvContent = [
      ['이름', '이메일', '역할', '가입일', '총 결제금액'].join(','),
      ...selectedUsers.map(user => [
        user.full_name || '',
        user.email,
        user.role,
        new Date(user.created_at).toLocaleDateString(),
        user.total_payment
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "내보내기 완료",
      description: "사용자 목록이 CSV 파일로 내보내졌습니다.",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">사용자 관리</h1>
          <p className="text-muted-foreground">
            CS 문의에 필요한 모든 사용자 정보를 한 곳에서 파악하고 즉시 조치하여 응대 시간을 단축합니다.
          </p>
        </div>

        {/* 1. 요약 대시보드 */}
        <UserDashboard stats={stats} loading={loading} />

        {/* 2. 검색 및 필터링 영역 */}
        <UserFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleResetFilters}
        />

        {/* 3. 사용자 목록 테이블 */}
        <div className="space-y-4">
          <UserTable 
            users={users}
            loading={loading}
            onUserSelect={handleUserSelect}
            onRoleChange={handleRoleChange}
            onBulkAction={handleBulkAction}
          />

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                총 {totalCount}개 항목 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} 표시
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  이전
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  다음
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <UserDetailModal
          userId={selectedUserId}
          open={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUserId(null);
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;