import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

type AuthView = 'main' | 'signup' | 'forgot-password';

export const AuthModal = ({ isOpen, onClose, defaultTab = 'signin' }: AuthModalProps) => {
  const [currentView, setCurrentView] = useState<AuthView>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    confirmPassword: '' 
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(signInData.email, signInData.password);
      
      if (error) {
        toast({
          title: "로그인 실패",
          description: error.message === "Invalid login credentials" 
            ? "이메일 또는 비밀번호가 잘못되었습니다." 
            : error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "로그인 성공",
          description: "윈들리아카데미에 오신 것을 환영합니다!"
        });
        onClose();
        setSignInData({ email: '', password: '' });
      }
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: "로그인 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: "비밀번호 확인",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive"
      });
      return;
    }

    if (signUpData.password.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 6자 이상이어야 합니다.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: signUpData.fullName
          }
        }
      });
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "가입 불가",
            description: "이미 가입된 이메일입니다. 로그인을 시도해보세요.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "회원가입 실패",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "회원가입 완료",
          description: "이메일로 인증 링크를 발송했습니다. 이메일을 확인해주세요."
        });
        setSignUpData({ email: '', password: '', fullName: '', confirmPassword: '' });
        setCurrentView('main');
      }
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: "회원가입 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: redirectUrl
      });
      
      if (error) {
        toast({
          title: "오류 발생",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "비밀번호 재설정 이메일 발송",
          description: "이메일로 비밀번호 재설정 링크를 발송했습니다."
        });
        setForgotPasswordEmail('');
        setCurrentView('main');
      }
    } catch (error: any) {
      toast({
        title: "오류 발생",
        description: "비밀번호 재설정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 로직 (향후 구현)
    toast({
      title: "준비 중",
      description: "카카오 로그인 기능은 준비 중입니다.",
      variant: "destructive"
    });
  };

  const handleClose = () => {
    setCurrentView('main');
    setSignInData({ email: '', password: '' });
    setSignUpData({ email: '', password: '', fullName: '', confirmPassword: '' });
    setForgotPasswordEmail('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-white">
        <div className="relative">
          {/* Header */}
          <DialogHeader className="px-6 pt-8 pb-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              {currentView !== 'main' && (
                <button
                  onClick={() => setCurrentView('main')}
                  className="absolute left-6 top-2 p-2 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
              )}
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">윈들리아카데미</h2>
              <DialogDescription className="text-gray-600 text-base">
                {currentView === 'main' && "지금 가입 하고\n첫구매 할인쿠폰을 받으세요!"}
                {currentView === 'signup' && "새 계정을 만들어보세요"}
                {currentView === 'forgot-password' && "비밀번호를 재설정하세요"}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="px-6 pb-8">
            {/* Main Login View */}
            {currentView === 'main' && (
              <>
                {/* Kakao Login Button */}
                <Button 
                  onClick={handleKakaoLogin}
                  className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold text-base mb-6 rounded-lg"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <span className="text-yellow-400 text-xs font-bold">K</span>
                    </div>
                    <span>카카오로 3초만에 시작하기</span>
                  </div>
                </Button>

                {/* Email Login Form */}
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="이메일 또는 아이디"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      className="h-12 border-gray-200 rounded-lg"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="비밀번호"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      className="h-12 border-gray-200 rounded-lg"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? '로그인 중...' : '로그인'}
                  </Button>
                </form>

                {/* Footer Links */}
                <div className="flex justify-center space-x-4 mt-6 text-sm text-gray-500">
                  <button 
                    onClick={() => setCurrentView('forgot-password')}
                    className="hover:text-gray-700"
                  >
                    비밀번호 찾기
                  </button>
                  <span>|</span>
                  <button 
                    onClick={() => setCurrentView('signup')}
                    className="hover:text-gray-700"
                  >
                    이메일 회원가입
                  </button>
                </div>
              </>
            )}

            {/* Sign Up View */}
            {currentView === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">이름</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    className="h-12 border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    className="h-12 border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="비밀번호 (6자 이상)"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    className="h-12 border-gray-200 rounded-lg"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    className="h-12 border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? '가입 중...' : '회원가입'}
                </Button>
              </form>
            )}

            {/* Forgot Password View */}
            {currentView === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgotEmail">이메일</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    placeholder="가입한 이메일을 입력하세요"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="h-12 border-gray-200 rounded-lg"
                    required
                  />
                </div>
                <p className="text-sm text-gray-600">
                  입력하신 이메일로 비밀번호 재설정 링크를 발송합니다.
                </p>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-lg mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? '발송 중...' : '재설정 링크 발송'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};