import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Target, Zap, Crown, Monitor, BookOpen, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AdminLayout } from '@/layouts/AdminLayout';

interface HomepageSection {
  id: string;
  title: string;
  subtitle?: string;
  section_type: string;
  is_active: boolean;
  course_count: number;
}

const sectionConfig = {
  featured: {
    title: '지금 가장 주목받는 강의',
    subtitle: '인기와 신규 강의를 관리합니다',
    icon: Target,
    url: '/admin/homepage-sections/featured'
  },
  free: {
    title: '무료로 배우는 이커머스',
    subtitle: '무료 강의 섹션을 관리합니다',
    icon: Zap,
    url: '/admin/homepage-sections/free'
  },
  premium: {
    title: '프리미엄 강의',
    subtitle: '프리미엄 강의 섹션을 관리합니다',
    icon: Crown,
    url: '/admin/homepage-sections/premium'
  },
  vod: {
    title: 'VOD 강의',
    subtitle: 'VOD 강의 섹션을 관리합니다',
    icon: Monitor,
    url: '/admin/homepage-sections/vod'
  }
};

const HomepageSections = () => {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('order_index');

      if (error) throw error;

      // Fetch course counts for each section
      const sectionsWithCounts = await Promise.all(
        (data || []).map(async (section) => {
          const { count } = await supabase
            .from('homepage_section_courses')
            .select('*', { count: 'exact', head: true })
            .eq('section_id', section.id);

          return {
            ...section,
            course_count: count || 0
          };
        })
      );

      setSections(sectionsWithCounts);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({
        title: "오류",
        description: "섹션 정보를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSectionStatus = async (sectionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('homepage_sections')
        .update({ is_active: isActive })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(prev => 
        prev.map(section => 
          section.id === sectionId 
            ? { ...section, is_active: isActive }
            : section
        )
      );

      toast({
        title: "성공",
        description: `섹션이 ${isActive ? '활성화' : '비활성화'}되었습니다.`
      });
    } catch (error) {
      console.error('Error updating section status:', error);
      toast({
        title: "오류",
        description: "섹션 상태 변경에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg font-medium text-muted-foreground">로딩중...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">메인 페이지 섹션 관리</h1>
            <p className="text-gray-600">
              메인 페이지에 표시되는 강의 섹션들을 관리합니다. 각 섹션을 클릭하여 상세 설정이 가능합니다.
            </p>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(sectionConfig).map(([key, config]) => {
            const section = sections.find(s => s.section_type === key);
            const IconComponent = config.icon;

            return (
              <Card key={key} className="relative overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{config.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {config.subtitle}
                        </p>
                      </div>
                    </div>
                    {section && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={section.is_active}
                          onCheckedChange={(checked) => updateSectionStatus(section.id, checked)}
                        />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">상태:</span>
                        {section ? (
                          <Badge variant={section.is_active ? "default" : "secondary"}>
                            {section.is_active ? "활성" : "비활성"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">미설정</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">강의:</span>
                        <Badge variant="outline">
                          {section?.course_count || 0}개
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <Button asChild className="w-full">
                        <Link to={config.url}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          섹션 관리하기
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>전체 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {sections.filter(s => s.is_active).length}
                </div>
                <div className="text-sm text-muted-foreground">활성 섹션</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-muted-foreground">
                  {sections.filter(s => !s.is_active).length}
                </div>
                <div className="text-sm text-muted-foreground">비활성 섹션</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {sections.reduce((total, section) => total + section.course_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">총 등록 강의</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.keys(sectionConfig).length}
                </div>
                <div className="text-sm text-muted-foreground">전체 섹션</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default HomepageSections;