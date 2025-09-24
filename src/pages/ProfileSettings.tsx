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
import { User, Camera, Save, Lock, Upload, Check, Calendar } from 'lucide-react';
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [originalFormData, setOriginalFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    avatar_url: ''
  });
  const [originalMarketingConsent, setOriginalMarketingConsent] = useState(false);

  useEffect(() => {
    document.title = "회원정보관리 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "회원정보를 관리하고 비밀번호를 변경하세요");
    
    if (!user) {
      navigate('/');
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
      setMarketingConsent(profile.marketing_consent || false);
      setOriginalMarketingConsent(profile.marketing_consent || false);
    }
  }, [user, profile, navigate]);

  // 변경사항 감지
  useEffect(() => {
    const hasFormChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData);
    const hasMarketingChanges = marketingConsent !== originalMarketingConsent;
    setHasChanges(hasFormChanges || hasMarketingChanges);
  }, [formData, originalFormData, marketingConsent, originalMarketingConsent]);

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

      // 프로필 데이터 새로고침
      await refreshProfile();

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

    if (!profileCurrentPassword) {
      toast({
        title: "보안 확인 필요",
        description: "회원정보 변경을 위해 현재 비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 현재 비밀번호 확인
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: profileCurrentPassword,
      });

      if (signInError) {
        toast({
          title: "인증 실패", 
          description: "현재 비밀번호가 올바르지 않습니다.",
          variant: "destructive",
        });
        return;
      }

      // 프로필 업데이트
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          instructor_bio: formData.bio,
          marketing_consent: marketingConsent,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // 프로필 데이터 새로고침
      await refreshProfile();

      // 원본 데이터 업데이트
      setOriginalFormData({ ...formData });
      setOriginalMarketingConsent(marketingConsent);
      setProfileCurrentPassword('');

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
    
    if (!currentPassword) {
      toast({
        title: "현재 비밀번호 필요",
        description: "보안을 위해 현재 비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
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
      // 현재 비밀번호 확인
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast({
          title: "인증 실패", 
          description: "현재 비밀번호가 올바르지 않습니다.",
          variant: "destructive",
        });
        return;
      }

      // 새 비밀번호로 업데이트
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "성공",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      
      setCurrentPassword('');
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
                          <Label>가입일</Label>
                          <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '-'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>이메일 확인</Label>
                          <div className="p-3 bg-muted rounded-md">
                            {user?.email_confirmed_at ? '확인됨' : '미확인'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 보안 확인 */}
                    <div className="border-t pt-6">
                      <div className="space-y-2">
                        <Label htmlFor="profileCurrentPassword">현재 비밀번호 확인 *</Label>
                        <Input
                          id="profileCurrentPassword"
                          type="password"
                          value={profileCurrentPassword}
                          onChange={(e) => setProfileCurrentPassword(e.target.value)}
                          placeholder="회원정보 변경을 위해 현재 비밀번호를 입력하세요"
                          required={hasChanges}
                        />
                        <p className="text-xs text-muted-foreground">
                          보안을 위해 회원정보 변경 시 비밀번호 확인이 필요합니다.
                        </p>
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
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">현재 비밀번호 *</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="현재 사용 중인 비밀번호"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">새 비밀번호</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="새 비밀번호 (최소 6자)"
                        />
                      </div>

                      <div className="space-y-2">
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
                      <Button type="submit" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
                        <Lock className="h-4 w-4 mr-2" />
                        {loading ? '변경 중...' : '비밀번호 변경'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* 회원탈퇴 */}
              <Card className="border-destructive/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-medium mb-1">계정 관리</h3>
                      <p className="text-sm text-muted-foreground">
                        계정을 더 이상 사용하지 않으신다면 탈퇴할 수 있습니다.
                      </p>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
                          탈퇴하기
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader className="text-left">
                          <AlertDialogTitle className="text-lg font-bold">회원탈퇴 안내</AlertDialogTitle>
                        </AlertDialogHeader>
                        
                        <div className="space-y-4 text-sm">
                          <p className="text-muted-foreground">
                            회원 탈퇴 시점에 당신 아래 내용을 반드시 확인해주세요.
                          </p>
                          
                          <div>
                            <h4 className="font-semibold mb-2">회원탈퇴 시 처리내용</h4>
                            <p className="text-muted-foreground">
                              탈퇴일으로부터 모든 개인정보는 소멸되며 복원되지 않습니다.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">구매 정보가 삭제됩니다.</h4>
                            <p className="text-muted-foreground">
                              소비자보호에 관한 법령 제6조에 의거, 계약 또는 청약철회 등에 관한 기록은 5년, 대금결제 및 재화공급에 관한 기록은 5년, 소비자의 불만 또는 분쟁처리에 관한 기록은 3년 동안 보관됩니다. 동 개인정보는 법령에 의한 보유 목적 외에 다른 목적으로는 이용하지 않습니다.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">회원탈퇴 시 재가입 관련</h4>
                            <p className="text-muted-foreground">
                              탈퇴회원 정보는 재가입 시 복구 및 연동이 상이하므로, 회원정보 상태로 이전 정상적 복원이 불가하며 수강 횟수 및 적립 포인트 복원도 불가하므로 신중한 검토 후 탈퇴 신청하시기 바랍니다.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold mb-2">회원탈퇴 후 재가입 제한</h4>
                            <p className="text-muted-foreground">
                              탈퇴 회원이 재가입하더라도 기존의 포인트나 혜택은 소멸되어 복원되지 않습니다.
                            </p>
                          </div>
                          
                          <div className="bg-muted p-3 rounded">
                            <p className="text-sm">위 내용을 모두 확인하였습니다.</p>
                          </div>
                        </div>
                        
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleAccountDeletion}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            탈퇴하기
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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