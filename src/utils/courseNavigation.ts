import { supabase } from '@/integrations/supabase/client';

export const getLastWatchedSession = async (courseId: string, userId: string | undefined) => {
  if (!userId) return null;
  
  try {
    const { data: sessionsProgress } = await supabase
      .from('session_progress')
      .select(`
        session_id,
        created_at,
        session:course_sessions!inner(
          id,
          course_id,
          order_index,
          section:course_sections!inner(order_index)
        )
      `)
      .eq('user_id', userId)
      .eq('session.course_id', courseId)
      .order('created_at', { ascending: false });

    if (sessionsProgress && sessionsProgress.length > 0) {
      // 가장 최근에 시청한 세션 반환
      return sessionsProgress[0].session_id;
    }
  } catch (error) {
    console.error('Error getting last watched session:', error);
  }
  return null;
};

export const navigateToLastWatchedSession = async (
  courseId: string, 
  userId: string | undefined, 
  navigate: (path: string) => void
) => {
  const lastSessionId = await getLastWatchedSession(courseId, userId);
  if (lastSessionId) {
    navigate(`/learn/${courseId}?session=${lastSessionId}`);
  } else {
    navigate(`/learn/${courseId}`);
  }
};