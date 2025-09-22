import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Shield, CheckCircle, XCircle } from 'lucide-react';

interface SecurityTestResult {
  test_name: string;
  table_name: string;
  expected_result: string;
  actual_result: string;
  status: string;
}

export const SecurityTestPanel = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [quickCheck, setQuickCheck] = useState<string>('');
  const [comprehensiveCheck, setComprehensiveCheck] = useState<string>('');
  const [userStatus, setUserStatus] = useState<string>('');
  const [testResults, setTestResults] = useState<SecurityTestResult[]>([]);

  const runQuickCheck = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('security_quick_check');
      if (error) throw error;
      setQuickCheck(data);
    } catch (error) {
      console.error('보안 체크 오류:', error);
      setQuickCheck('오류: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const runComprehensiveCheck = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('security_comprehensive_check');
      if (error) throw error;
      setComprehensiveCheck(data);
    } catch (error) {
      console.error('종합 보안 체크 오류:', error);
      setComprehensiveCheck('오류: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('ensure_test_users');
      if (error) throw error;
      setUserStatus(data);
    } catch (error) {
      console.error('사용자 현황 체크 오류:', error);
      setUserStatus('오류: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTest = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('test_rls_security');
      if (error) throw error;
      setTestResults(data || []);
    } catch (error) {
      console.error('보안 테스트 오류:', error);
      setTestResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            보안 테스트 패널
          </CardTitle>
          <CardDescription>
            로그인 후 RLS 보안 정책이 올바르게 작동하는지 테스트할 수 있습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          RLS 보안 테스트 패널
        </CardTitle>
        <CardDescription>
          현재 데이터베이스의 Row Level Security(RLS) 정책이 올바르게 작동하는지 확인합니다.
          <br />
          현재 사용자: <code className="bg-muted px-1 rounded">{user.email}</code>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <Button 
            onClick={runQuickCheck} 
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? '체크 중...' : '🔍 빠른 체크'}
          </Button>
          <Button 
            onClick={runComprehensiveCheck} 
            disabled={isLoading}
            variant="default"
            size="sm"
          >
            {isLoading ? '체크 중...' : '🔒 종합 체크'}
          </Button>
          <Button 
            onClick={checkUserStatus} 
            disabled={isLoading}
            variant="secondary"
            size="sm"
          >
            {isLoading ? '확인 중...' : '👥 사용자 현황'}
          </Button>
          <Button 
            onClick={runFullTest} 
            disabled={isLoading}
            variant="destructive"
            size="sm"
          >
            {isLoading ? '테스트 중...' : '🧪 상세 테스트'}
          </Button>
        </div>

        {quickCheck && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔍 빠른 보안 체크 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded font-mono overflow-x-auto">
                {quickCheck}
              </pre>
            </CardContent>
          </Card>
        )}

        {comprehensiveCheck && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔒 종합 보안 체크 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded font-mono overflow-x-auto">
                {comprehensiveCheck}
              </pre>
            </CardContent>
          </Card>
        )}

        {userStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">👥 사용자 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded font-mono overflow-x-auto">
                {userStatus}
              </pre>
            </CardContent>
          </Card>
        )}

        {comprehensiveCheck && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔒 종합 보안 체크 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded font-mono overflow-x-auto">
                {comprehensiveCheck}
              </pre>
            </CardContent>
          </Card>
        )}

        {userStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">👥 사용자 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded font-mono overflow-x-auto">
                {userStatus}
              </pre>
            </CardContent>
          </Card>
        )}

        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">종합 보안 테스트 결과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.test_name}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        <Badge variant="outline">{result.table_name}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>예상: {result.expected_result}</div>
                        <div>실제: {result.actual_result}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">콘솔에서 직접 테스트하기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              브라우저 개발자 도구 콘솔에서 다음 명령어를 실행할 수 있습니다:
            </p>
            <div className="space-y-2 text-sm font-mono bg-background p-3 rounded border">
              <div>// 빠른 보안 체크</div>
              <div className="text-blue-600">
                {`supabase.rpc('check_security').then(result => console.log(result.data))`}
              </div>
              <div className="mt-2">// 현재 사용자 역할 확인</div>
              <div className="text-blue-600">
                {`supabase.rpc('get_user_role_safe').then(result => console.log(result.data))`}
              </div>
              <div className="mt-2">// 종합 테스트</div>
              <div className="text-blue-600">
                {`supabase.rpc('test_rls_security').then(result => console.table(result.data))`}
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};