import { supabase } from '@/integrations/supabase/client';

export const trackActivity = async (
  action: string, 
  entityType?: string, 
  entityId?: string, 
  details?: any
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    await supabase.functions.invoke('track-activity', {
      body: {
        action,
        entity_type: entityType,
        entity_id: entityId,
        details
      }
    });
  } catch (error) {
    console.error('Failed to track activity:', error);
  }
};

// 로그인 추적
export const trackLogin = () => trackActivity('login', 'auth');

// 강의 시청 추적
export const trackVideoWatch = (sessionId: string, progress: number) => 
  trackActivity('video_watch', 'session', sessionId, { progress });

// 페이지 방문 추적
export const trackPageView = (page: string) => 
  trackActivity('page_view', 'navigation', page);

// 강의 등록 추적
export const trackCourseEnrollment = (courseId: string) => 
  trackActivity('course_enrollment', 'course', courseId);

// 강의 완료 추적
export const trackCourseCompletion = (courseId: string) => 
  trackActivity('course_completion', 'course', courseId);