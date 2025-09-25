import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Validate progress function called');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { sessionId, userId, actualDuration } = requestBody;

    // 1. 세션 정보 가져오기
    console.log('Fetching session info for sessionId:', sessionId);
    const { data: session, error: sessionError } = await supabaseClient
      .from('course_sessions')
      .select('duration_minutes')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('Session fetch error:', sessionError);
      throw new Error(`Session fetch failed: ${sessionError.message}`);
    }

    if (!session) {
      console.error('Session not found for id:', sessionId);
      throw new Error('Session not found');
    }

    console.log('Session found:', session);

    // 2. 시청 데이터 가져오기 (session_progress 사용)
    const { data: progressData, error: progressError } = await supabaseClient
        .from('session_progress')
        .select('watched_ranges, watched_duration_seconds')
        .eq('user_id', userId)
        .eq('session_id', sessionId)
        .single();

    if (progressError || !progressData) throw new Error('Progress data fetch failed');

    // watched_ranges 파싱
    let watchedRanges = [];
    if (progressData.watched_ranges) {
        watchedRanges = typeof progressData.watched_ranges === 'string' 
                        ? JSON.parse(progressData.watched_ranges) 
                        : progressData.watched_ranges;
    }

    // 3. 영상 길이 결정
    let videoDurationSeconds = (session.duration_minutes ?? 0) * 60;
    const requestedDuration = typeof actualDuration === 'number' ? Math.round(actualDuration) : 0;
    if (requestedDuration > 0) videoDurationSeconds = requestedDuration;
    
    if (videoDurationSeconds <= 0) {
        throw new Error('Invalid video duration.');
    }

    // 4. 점프 이벤트 데이터 가져오기
    const { data: seekEvents, error: seekError } = await supabaseClient
      .from('video_seek_events')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (seekError) {
      console.error('Seek events fetch error:', seekError);
    }
    console.log('Seek events found:', seekEvents?.length || 0);

    // 5. 진도율 계산 및 검증
    const validation = validateProgress({
      watchedRanges: watchedRanges,
      storedWatchedTime: progressData.watched_duration_seconds,
      seekEvents: seekEvents || [],
      videoDuration: videoDurationSeconds
    });

    console.log('Validation result:', validation);

    return new Response(JSON.stringify(validation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error validating progress:', error);
    return new Response(JSON.stringify({ 
      error: (error as any)?.message || 'Unknown error',
      isValid: false,
      watchedPercentage: 0,
      checkpointScore: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateCheckpoints(videoDuration: number): number[] {
  const checkpoints = [];
  const intervalMinutes = Math.max(1, Math.floor(videoDuration / 180)); // 최소 1분 간격
  
  for (let i = intervalMinutes * 60; i < videoDuration; i += intervalMinutes * 60) {
    checkpoints.push(i);
  }
  
  // 마지막 30초 전 체크포인트 (필수)
  const lastCheckpoint = Math.max(videoDuration - 30, videoDuration * 0.9);
  if (!checkpoints.includes(lastCheckpoint)) {
    checkpoints.push(Math.floor(lastCheckpoint));
  }
  
  return checkpoints;
}

function validateProgress(data: {
  watchedRanges: { start: number; end: number }[];
  storedWatchedTime: number;
  seekEvents: any[];
  videoDuration: number;
}) {
  const { watchedRanges, storedWatchedTime, seekEvents, videoDuration } = data;

  // 1. 고유 시청 시간 재계산 (서버 측 보안 검증)
  const calculatedWatchedTime = watchedRanges.reduce((total, range) => {
    const duration = (range.end || 0) - (range.start || 0);
    return total + (duration > 0 ? duration : 0);
  }, 0);

  // 2. 시청 비율 계산
  const watchedPercentage = Math.min((calculatedWatchedTime / videoDuration) * 100, 100);

  // 3. 점프 패턴 분석
  const forwardJumps = seekEvents.filter(event => event.jump_amount > 10).length;
  const suspiciousJumps = seekEvents.filter(event => event.jump_amount > 60).length;

  // 4. 마지막 구간 시청 확인 (마지막 30초 또는 90% 지점)
  const lastSegmentThreshold = Math.max(videoDuration - 30, videoDuration * 0.9);
  const hasReachedEnd = watchedRanges.some(range => range.end >= lastSegmentThreshold);

  // 5. 종합 검증
  const isValidProgress =
    watchedPercentage >= 80 &&          // 80% 이상 고유 구간 시청
    hasReachedEnd &&                    // 마지막 구간 시청 완료
    suspiciousJumps <= 2;               // 의심스러운 점프 2회 이하

  return {
    isValid: isValidProgress,
    watchedPercentage: Math.round(watchedPercentage),
    totalWatchedTime: calculatedWatchedTime,
    forwardJumps,
    suspiciousJumps,
    hasReachedEnd,
    details: {
        videoDuration
    }
  };
}