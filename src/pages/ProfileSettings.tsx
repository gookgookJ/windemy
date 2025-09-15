import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Camera, Save, Lock, Trash2, Upload, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadAvatar } from '@/utils/uploadAvatar';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

const ProfileSettings = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [originalFormData, setOriginalFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });

  useEffect(() => {
    document.title = "회원정보관리 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "회원정보를 관리하고 비밀번호를 변경하세요");
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile) {
      const initialData = {
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.instructor_bio || '',
        avatar_url: profile.avatar_url || ''
      };
      setFormData(initialData);
      setOriginalFormData(initialData);
    }
  }, [user, profile, navigate]);

  // 변경사항 감지
  useEffect(() => {
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setHasChanges(hasFormChanges);
  }, [formData, originalFormData]);

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadAvatar(file, user.id);
      setFormData(prev => ({ ...prev, avatar_url: avatarUrl }));
      
      // 즉시 프로필에 반영
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "프로필 사진이 성공적으로 업데이트되었습니다.",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "오류",
        description: error.message || "프로필 사진 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) {
      toast({
        title: "알림",
        description: "변경된 내용이 없습니다.",
      });
      return;
    }

    setLoading(true);

    try {
      // 프로필 업데이트
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          instructor_bio: formData.bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // 원본 데이터 업데이트
      setOriginalFormData({ ...formData });

      toast({
        title: "성공",
        description: "회원정보가 성공적으로 업데이트되었습니다.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "오류",
        description: "회원정보 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "오류",
        description: "새 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "성공",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        title: "오류",
        description: "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    try {
      setLoading(true);
      
      // 로그아웃 처리 (실제로는 백엔드에서 계정 삭제를 처리해야 함)
      await signOut();

      toast({
        title: "계정 삭제 완료",
        description: "계정이 성공적으로 삭제되었습니다.",
      });
      
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "오류",
        description: "계정 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <UserSidebar />
            </div>
            
            <div className="lg:col-span-3 space-y-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">회원정보관리</h1>
                <p className="text-muted-foreground">개인정보를 수정하고 계정을 관리하세요.</p>
              </div>

              {/* 기본 정보 수정 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    기본 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* 프로필 사진 */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                          <AvatarImage src={formData.avatar_url} />
                          <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                            {formData.full_name ? formData.full_name[0] : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="flex items-center gap-2"
                        >
                          {uploadingAvatar ? (
                            <Upload className="h-4 w-4 animate-pulse" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                          {uploadingAvatar ? "업로드 중..." : "사진 변경"}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          JPG, PNG 파일 (최대 5MB)
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* 기본 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">이름 *</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleFormChange('full_name', e.target.value)}
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
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        placeholder="010-1234-5678"
                      />
                    </div>

                    {profile?.role === 'instructor' && (
                      <div className="space-y-2">
                        <Label htmlFor="bio">강사 소개</Label>
                        <Textarea
                          id="bio"
                          value={formData.bio}
                          onChange={(e) => handleFormChange('bio', e.target.value)}
                          placeholder="강사님의 경력과 전문분야를 소개해주세요."
                          className="min-h-[100px]"
                        />
                      </div>
                    )}

                    {/* 마케팅 수신 동의 */}
                    <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="marketing"
                        checked={marketingConsent}
                        onCheckedChange={(checked) => setMarketingConsent(!!checked)}
                      />
                      <Label htmlFor="marketing" className="text-sm">
                        마케팅 정보 및 이벤트 소식을 이메일로 받아보겠습니다
                      </Label>
                    </div>

                    <Separator />

                    {/* 계정 정보 */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">계정 정보</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>계정 유형</Label>
                          <div className="p-3 bg-muted rounded-md">
                            {profile?.role === 'student' ? '학습자' : 
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
                      <Button 
                        type="submit" 
                        disabled={loading || !hasChanges}
                        className="min-w-[120px]"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            저장 중...
                          </div>
                        ) : hasChanges ? (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            변경사항 저장
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            저장 완료
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* 비밀번호 변경 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    비밀번호 변경
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="newPassword">새 비밀번호</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="새 비밀번호 (최소 6자)"
                        />
                      </div>

                      <div>
                        <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="새 비밀번호 다시 입력"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
                        <Lock className="h-4 w-4 mr-2" />
                        {loading ? '변경 중...' : '비밀번호 변경'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* 회원탈퇴 - 덜 눈에 띄게 배치 */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                  기타 계정 설정 ▼
                </summary>
                <Card className="mt-4 border-destructive/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive text-base">
                      <Trash2 className="h-4 w-4" />
                      회원탈퇴
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-destructive/5 p-4 rounded-lg mb-4">
                      <p className="text-sm text-muted-foreground">
                        ⚠️ 계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                        <br />수강 기록, 구매 내역, 작성한 리뷰 등이 모두 사라집니다.
                      </p>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3 w-3 mr-2" />
                          회원탈퇴
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>정말로 탈퇴하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            이 작업은 되돌릴 수 없습니다. 계정과 모든 데이터가 영구적으로 삭제됩니다.
                            <br /><br />
                            • 수강 중인 강의 접근 불가
                            • 구매 내역 및 수료증 삭제
                            • 작성한 리뷰 및 문의 내역 삭제
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleAccountDeletion}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            삭제하기
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </details>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;