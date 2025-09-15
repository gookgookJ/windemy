import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Bell, Shield, Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import UserSidebar from '@/components/UserSidebar';

const AccountSettings = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    course: true,
    marketing: false,
    system: true
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    progressVisible: false,
    activityVisible: true
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "계정 관리 | 윈들리아카데미";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "계정 설정을 관리하세요");
    
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "비밀번호 확인 실패",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "비밀번호 변경 완료",
        description: "비밀번호가 성공적으로 변경되었습니다."
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "비밀번호 변경 실패",
        description: "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // TODO: 계정 삭제 로직 구현
      toast({
        title: "계정 삭제 요청",
        description: "계정 삭제 요청이 접수되었습니다. 고객센터에서 처리해드리겠습니다."
      });
    }
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
                <h1 className="text-3xl font-bold mb-2">계정 관리</h1>
                <p className="text-muted-foreground">계정 설정을 관리하세요.</p>
              </div>

              <div className="space-y-6">
                {/* 비밀번호 변경 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      비밀번호 변경
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">현재 비밀번호</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">새 비밀번호</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                      
                      <Button type="submit">
                        비밀번호 변경
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* 알림 설정 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      알림 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>이메일 알림</Label>
                        <p className="text-sm text-muted-foreground">
                          중요한 업데이트를 이메일로 받아보세요
                        </p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, email: checked })
                        }
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>강의 알림</Label>
                        <p className="text-sm text-muted-foreground">
                          새로운 강의 업데이트 알림
                        </p>
                      </div>
                      <Switch
                        checked={notifications.course}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, course: checked })
                        }
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>마케팅 알림</Label>
                        <p className="text-sm text-muted-foreground">
                          프로모션 및 할인 정보 알림
                        </p>
                      </div>
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, marketing: checked })
                        }
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>시스템 알림</Label>
                        <p className="text-sm text-muted-foreground">
                          시스템 점검 및 보안 알림
                        </p>
                      </div>
                      <Switch
                        checked={notifications.system}
                        onCheckedChange={(checked) => 
                          setNotifications({ ...notifications, system: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 개인정보 설정 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      개인정보 설정
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>프로필 공개</Label>
                        <p className="text-sm text-muted-foreground">
                          다른 사용자에게 프로필 정보를 공개합니다
                        </p>
                      </div>
                      <Switch
                        checked={privacy.profileVisible}
                        onCheckedChange={(checked) => 
                          setPrivacy({ ...privacy, profileVisible: checked })
                        }
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>학습 진도 공개</Label>
                        <p className="text-sm text-muted-foreground">
                          학습 진도율을 다른 사용자에게 공개합니다
                        </p>
                      </div>
                      <Switch
                        checked={privacy.progressVisible}
                        onCheckedChange={(checked) => 
                          setPrivacy({ ...privacy, progressVisible: checked })
                        }
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>활동 내역 공개</Label>
                        <p className="text-sm text-muted-foreground">
                          강의 수강 및 후기 작성 활동을 공개합니다
                        </p>
                      </div>
                      <Switch
                        checked={privacy.activityVisible}
                        onCheckedChange={(checked) => 
                          setPrivacy({ ...privacy, activityVisible: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 계정 삭제 */}
                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <Trash2 className="h-5 w-5" />
                      계정 삭제
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                    </p>
                    <Button variant="destructive" onClick={handleDeleteAccount}>
                      계정 삭제
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountSettings;