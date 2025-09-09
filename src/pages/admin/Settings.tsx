import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings, Globe, CreditCard, BookOpen, Users } from 'lucide-react';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string;
  category: string;
  is_public: boolean;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const categories = [
    { key: 'general', label: '일반 설정', icon: Globe },
    { key: 'course', label: '강의 설정', icon: BookOpen },
    { key: 'payment', label: '결제 설정', icon: CreditCard },
    { key: 'user', label: '사용자 설정', icon: Users }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category, key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "오류",
        description: "설정을 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => prev.map(setting => 
      setting.key === key ? { ...setting, value } : setting
    ));
  };

  const saveSetting = async (setting: SystemSetting) => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('인증되지 않은 사용자');

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          category: setting.category,
          is_public: setting.is_public,
          updated_by: user.user.id
        });

      if (error) throw error;

      toast({
        title: "성공",
        description: "설정이 저장되었습니다."
      });

    } catch (error) {
      console.error('Error saving setting:', error);
      toast({
        title: "오류",
        description: "설정 저장에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('인증되지 않은 사용자');

      const updates = settings.map(setting => ({
        key: setting.key,
        value: setting.value,
        description: setting.description,
        category: setting.category,
        is_public: setting.is_public,
        updated_by: user.user.id
      }));

      const { error } = await supabase
        .from('system_settings')
        .upsert(updates);

      if (error) throw error;

      toast({
        title: "성공",
        description: "모든 설정이 저장되었습니다."
      });

    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "오류",
        description: "설정 저장에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(setting => setting.category === category);
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = setting.value;
    
    // JSON 값 처리
    const getValue = () => {
      if (typeof value === 'string' && (value.startsWith('"') || value.startsWith('{'))) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    };

    const actualValue = getValue();

    if (typeof actualValue === 'boolean') {
      return (
        <Switch
          checked={actualValue}
          onCheckedChange={(checked) => updateSetting(setting.key, checked)}
        />
      );
    }

    if (typeof actualValue === 'number') {
      return (
        <Input
          type="number"
          value={actualValue}
          onChange={(e) => updateSetting(setting.key, Number(e.target.value))}
        />
      );
    }

    if (setting.key.includes('description') || setting.key.includes('content')) {
      return (
        <Textarea
          value={actualValue}
          onChange={(e) => updateSetting(setting.key, e.target.value)}
          rows={3}
        />
      );
    }

    return (
      <Input
        value={actualValue}
        onChange={(e) => updateSetting(setting.key, e.target.value)}
      />
    );
  };

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">시스템 설정</h1>
            <p className="text-muted-foreground">플랫폼의 전반적인 설정을 관리하세요</p>
          </div>
          <Button onClick={saveAllSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? '저장 중...' : '모든 설정 저장'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => {
            const categorySettings = getSettingsByCategory(category.key);
            if (categorySettings.length === 0) return null;

            return (
              <Card key={category.key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5" />
                    {category.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categorySettings.map((setting) => (
                    <div key={setting.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={setting.key} className="text-sm font-medium">
                          {setting.description || setting.key}
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {setting.is_public ? '공개' : '비공개'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveSetting(setting)}
                            disabled={saving}
                          >
                            저장
                          </Button>
                        </div>
                      </div>
                      {renderSettingInput(setting)}
                      <p className="text-xs text-muted-foreground">
                        키: {setting.key}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 새 설정 추가 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              새 설정 추가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input placeholder="설정 키" />
              <Input placeholder="설정 값" />
              <Input placeholder="설명" />
              <Button>추가</Button>
            </div>
          </CardContent>
        </Card>

        {/* 시스템 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>시스템 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="font-medium">총 사용자 수</Label>
                <p className="text-muted-foreground">계산 중...</p>
              </div>
              <div>
                <Label className="font-medium">총 강의 수</Label>
                <p className="text-muted-foreground">계산 중...</p>
              </div>
              <div>
                <Label className="font-medium">데이터베이스 버전</Label>
                <p className="text-muted-foreground">PostgreSQL 15.x</p>
              </div>
              <div>
                <Label className="font-medium">마지막 백업</Label>
                <p className="text-muted-foreground">자동 백업 활성화됨</p>
              </div>
              <div>
                <Label className="font-medium">스토리지 사용량</Label>
                <p className="text-muted-foreground">확인 중...</p>
              </div>
              <div>
                <Label className="font-medium">서버 상태</Label>
                <p className="text-green-600">정상</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;