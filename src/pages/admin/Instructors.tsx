import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Plus, Edit, Users, User, Trash2 } from 'lucide-react';

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  instructor_bio?: string;
  instructor_avatar_url?: string;
  role: string;
  created_at: string;
}

export const AdminInstructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or('role.eq.admin,role.eq.instructor')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstructors(data || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast({
        title: "오류",
        description: "강사 목록을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewInstructor = () => {
    navigate('/admin/instructor-profile/new');
  };

  const editInstructor = (instructorId: string) => {
    navigate(`/admin/instructor-profile/${instructorId}`);
  };

  const deleteInstructor = async (instructorId: string, instructorName: string) => {
    if (!confirm(`정말로 "${instructorName}" 강사를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', instructorId);

      if (error) throw error;

      toast({
        title: "성공",
        description: "강사가 삭제되었습니다."
      });

      fetchInstructors();
    } catch (error) {
      console.error('Error deleting instructor:', error);
      toast({
        title: "오류",
        description: "강사 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  const filteredInstructors = instructors.filter(instructor =>
    instructor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg">로딩 중...</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">강사 관리</h1>
            <p className="text-muted-foreground">강사 프로필을 관리하고 강의에 배정할 수 있습니다</p>
          </div>
          <Button onClick={createNewInstructor}>
            <Plus className="h-4 w-4 mr-2" />
            새 강사 추가
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="강사명 또는 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Instructors List */}
        <Card>
          <CardHeader>
            <CardTitle>강사 목록 ({filteredInstructors.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredInstructors.map((instructor) => (
                <div key={instructor.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-4">
                      {/* Profile Image */}
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {instructor.instructor_avatar_url ? (
                          <img 
                            src={instructor.instructor_avatar_url}
                            alt={instructor.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{instructor.full_name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{instructor.email}</p>
                        {instructor.instructor_bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {instructor.instructor_bio}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          가입일: {new Date(instructor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={instructor.role === 'admin' ? 'default' : 'secondary'}>
                        {instructor.role === 'admin' ? '관리자' : '강사'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editInstructor(instructor.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      프로필 편집
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/course-catalog?instructor=${instructor.id}`)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      담당 강의 보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteInstructor(instructor.id, instructor.full_name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
              
              {filteredInstructors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  검색 조건에 맞는 강사가 없습니다.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminInstructors;