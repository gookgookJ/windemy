import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Save, User, Trash2 } from 'lucide-react';

interface InstructorProfile {
  id: string;
  full_name: string;
  email: string;
  instructor_bio?: string;
  instructor_avatar_url?: string;
}

export const AdminInstructorProfile = () => {
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "오류",
        description: "프로필 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          instructor_bio: profile.instructor_bio,
          instructor_avatar_url: profile.instructor_avatar_url,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "성공",
        description: "강사 프로필이 저장되었습니다."
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "오류",
        description: "프로필 저장에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
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

  if (!profile) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg">프로필을 찾을 수 없습니다.</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">강사 프로필 관리</h1>
            <p className="text-muted-foreground">강의 상세페이지에 표시될 강사 정보를 관리합니다</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image */}
            <div className="space-y-4">
              <Label>프로필 이미지</Label>
              <div className="flex items-start gap-6">
                {/* Current Image Display */}
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                  {profile.instructor_avatar_url ? (
                    <img 
                      src={profile.instructor_avatar_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-muted-foreground" />
                  )}
                </div>
                
                {/* Upload Controls */}
                <div className="flex-1 space-y-4">
                  <FileUpload
                    bucket="course-thumbnails"
                    accept="image/*"
                    onUpload={(url) => setProfile({ ...profile, instructor_avatar_url: url })}
                    currentFile={profile.instructor_avatar_url}
                  />
                  {profile.instructor_avatar_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setProfile({ ...profile, instructor_avatar_url: '' })}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      이미지 삭제
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">강사명</Label>
              <Input
                id="name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="강사명을 입력하세요"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                이메일은 변경할 수 없습니다.
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">강사 소개</Label>
              <Textarea
                id="bio"
                value={profile.instructor_bio || ''}
                onChange={(e) => setProfile({ ...profile, instructor_bio: e.target.value })}
                placeholder="강의 상세페이지에 표시될 강사 소개를 작성하세요"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                강의 상세페이지의 "강사 소개" 섹션에 표시됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>미리보기</CardTitle>
            <p className="text-sm text-muted-foreground">
              강의 상세페이지에서 어떻게 표시되는지 확인하세요
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">강사 소개</h3>
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profile.instructor_avatar_url ? (
                    <img 
                      src={profile.instructor_avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold mb-2">{profile.full_name || "강사명"}</h4>
                  {profile.instructor_bio && (
                    <p className="text-muted-foreground">{profile.instructor_bio}</p>
                  )}
                  {!profile.instructor_bio && (
                    <p className="text-muted-foreground italic">강사 소개를 작성해주세요.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminInstructorProfile;