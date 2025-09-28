import { AdminLayout } from '@/layouts/AdminLayout';

export const AdminUsers = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">사용자 관리</h1>
        </div>
        
        {/* 여기에 새로운 사용자 관리 컴포넌트들이 들어갈 예정 */}
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">사용자 관리 페이지를 구성 중입니다.</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
