import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Save, User, Trash2, ArrowLeft } from 'lucide-react';

interface InstructorProfile {
  id?: string;
  full_name: string;
  email: string;
  instructor_bio?: string;
  instructor_avatar_url?: string;
}

export const AdminInstructorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InstructorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewInstructor, setIsNewInstructor] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id === 'new') {
      setIsNewInstructor(true);
      setProfile({
        full_name: '',
        email: '',
        instructor_bio: '',
        instructor_avatar_url: ''
      });
      setLoading(false);
    } else if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('id', id)
        .maybeSingle();

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
    if (!profile) return;

    // Client-side validation for new instructor
    if (isNewInstructor) {
      const email = (profile.email || '').trim();
      const name = (profile.full_name || '').trim();
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!name) {
        toast({ title: '입력 필요', description: '강사명을 입력하세요.', variant: 'destructive' });
        return;
      }
      if (!email) {
        toast({ title: '입력 필요', description: '이메일을 입력하세요.', variant: 'destructive' });
        return;
      }
      if (!isValidEmail) {
        toast({ title: '유효하지 않은 이메일', description: '올바른 이메일 주소 형식으로 입력하세요.', variant: 'destructive' });
        return;
      }
    }

    setSaving(true);
    try {
      if (isNewInstructor) {
        // Create instructor (no auth user needed)
        const { error } = await supabase
          .from('instructors')
          .insert({
            email: profile.email,
            full_name: profile.full_name,
            instructor_bio: profile.instructor_bio,
            instructor_avatar_url: profile.instructor_avatar_url,
          });

        if (error) {
          throw new Error(error.message || '강사 생성에 실패했습니다.');
        }


        toast({
          title: '성공',
          description: '새 강사 프로필이 생성되었습니다.'
        });
      } else {
        // Update existing instructor
        const { error } = await supabase
          .from('instructors')
          .update({
            full_name: profile.full_name,
            email: profile.email,
            instructor_bio: profile.instructor_bio,
            instructor_avatar_url: profile.instructor_avatar_url,
          })
          .eq('id', id);

        if (error) throw new Error(error.message);

        toast({
          title: '성공',
          description: '강사 프로필이 저장되었습니다.'
        });
      }

      navigate('/admin/instructors');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast({
        title: '오류',
        description: err?.message || '프로필 저장에 실패했습니다.',
        variant: 'destructive'
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
            <Button onClick={() => navigate('/admin/instructors')} className="mt-4">
              강사 목록으로 돌아가기
            </Button>
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
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/instructors')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isNewInstructor ? '새 강사 등록' : '강사 프로필 편집'}
              </h1>
              <p className="text-muted-foreground">강의 상세페이지에 표시될 강사 정보를 관리합니다</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving || (isNewInstructor && ((!profile.full_name?.trim()) || (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email || ''))))}>
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

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="이메일을 입력하세요"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">권한</Label>
              <Select value={profile.role} onValueChange={(value) => setProfile({ ...profile, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="권한을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instructor">강사</SelectItem>
                  <SelectItem value="admin">관리자</SelectItem>
                </SelectContent>
              </Select>
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