import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

const ProfileSettings = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "회원정보관리 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "회원정보를 수정하세요");
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.instructor_bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          instructor_bio: formData.bio,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "프로필 업데이트 완료",
        description: "회원정보가 성공적으로 업데이트되었습니다."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "프로필 업데이트 실패",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = () => {
    // TODO: 파일 업로드 로직 구현
    toast({
      title: "기능 준비 중",
      description: "프로필 사진 업로드 기능은 곧 제공될 예정입니다."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">회원정보관리</h1>
                <p className="text-muted-foreground">개인정보를 수정하세요.</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    프로필 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 프로필 사진 */}
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={formData.avatar_url} />
                        <AvatarFallback className="text-lg">
                          {formData.full_name ? formData.full_name[0] : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAvatarUpload}
                          className="flex items-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          사진 변경
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          JPG, PNG 파일만 업로드 가능합니다.
                        </p>
                      </div>
                    </div>

                    {/* 기본 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">이름 *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">이메일</Label>
                        <Input
                          id="email"
                          value={user?.email || ''}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          이메일은 변경할 수 없습니다.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">전화번호</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="010-1234-5678"
                      />
                    </div>

                    {profile?.role === 'instructor' && (
                      <div className="space-y-2">
                        <Label htmlFor="bio">강사 소개</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="강사님의 경력과 전문분야를 소개해주세요."
                          className="min-h-[100px]"
                        />
                      </div>
                    )}

                    {/* 계정 정보 */}
                    <div className="pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4">계정 정보</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>계정 유형</Label>
                          <div className="p-3 bg-muted rounded-md">
                            {profile?.role === 'student' ? '학생' : 
                             profile?.role === 'instructor' ? '강사' : 
                             profile?.role === 'admin' ? '관리자' : '사용자'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>가입일</Label>
                          <div className="p-3 bg-muted rounded-md">
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? '저장 중...' : '변경사항 저장'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;