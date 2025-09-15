import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModal = ({ isOpen, onClose, defaultTab = 'signup' }: AuthModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    email: '', 
    password: '', 
    fullName: '', 
    confirmPassword: '' 
  });
  const { signIn, signUp } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (!error) {
      onClose();
      setSignInData({ email: '', password: '' });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpData.password !== signUpData.confirmPassword) {
      return;
    }
    
    setIsLoading(true);
    
    const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName);
    
    if (!error) {
      setSignUpData({ email: '', password: '', fullName: '', confirmPassword: '' });
      onClose();
    }
    setIsLoading(false);
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 로직 (향후 구현)
    console.log('카카오 로그인');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-white">
        <div className="relative">
          {/* Header */}
          <DialogHeader className="px-6 pt-8 pb-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">윈들리아카데미</h2>
              <DialogDescription className="text-gray-600 text-base">
                지금 가입 하고<br />
                첫구매 할인쿠폰을 받으세요!
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="px-6 pb-8">
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
              <button className="hover:text-gray-700">
                아이디(계정) · 비밀번호 찾기
              </button>
              <span>|</span>
              <button className="hover:text-gray-700">
                이메일 회원가입
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};