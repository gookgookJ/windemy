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

    // 2. 시청 구간 데이터 가져오기
    console.log('Fetching watch segments for user:', userId, 'session:', sessionId);
    const { data: segments, error: segmentsError } = await supabaseClient
      .from('video_watch_segments')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (segmentsError) {
      console.error('Segments fetch error:', segmentsError);
    }
    console.log('Watch segments found:', segments?.length || 0);

    // 3. 체크포인트 및 영상 길이 결정
    let videoDurationSeconds = (session.duration_minutes ?? 0) * 60;
    const requestedDuration = typeof actualDuration === 'number' ? Math.round(actualDuration) : 0;
    if (requestedDuration > 0) videoDurationSeconds = requestedDuration;
    if ((!videoDurationSeconds || videoDurationSeconds <= 0) && segments && segments.length > 0) {
      videoDurationSeconds = Math.max(...(segments as any[]).map((s: any) => s.end_time || 0));
    }
    console.log('Effective videoDurationSeconds:', videoDurationSeconds);

    const checkpoints = generateCheckpoints(videoDurationSeconds);
    console.log('Generated checkpoints:', checkpoints);
    
    const { data: reachedCheckpoints, error: checkpointsError } = await supabaseClient
      .from('video_checkpoints')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    if (checkpointsError) {
      console.error('Checkpoints fetch error:', checkpointsError);
    }
    console.log('Reached checkpoints found:', reachedCheckpoints?.length || 0);

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

    // 5. 진도율 계산
    console.log('Validating progress with data:', {
      segmentsCount: segments?.length || 0,
      checkpointsCount: checkpoints.length,
      reachedCheckpointsCount: reachedCheckpoints?.length || 0,
      seekEventsCount: seekEvents?.length || 0,
      videoDuration: videoDurationSeconds
    });

    const validation = validateProgress({
      segments: segments || [],
      checkpoints,
      reachedCheckpoints: reachedCheckpoints || [],
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
  segments: any[];
  checkpoints: number[];
  reachedCheckpoints: any[];
  seekEvents: any[];
  videoDuration: number;
}) {
  const { segments, checkpoints, reachedCheckpoints, seekEvents, videoDuration } = data;

  // 1. 누적 시청 시간 계산 (가중치 적용)
  const totalWatchedTime = segments.reduce((total, segment) => {
    return total + (segment.duration * segment.weight);
  }, 0);

  // 2. 실제 시청 비율 계산
  const watchedPercentage = Math.min((totalWatchedTime / videoDuration) * 100, 100);

  // 3. 체크포인트 검증
  const requiredCheckpoints = checkpoints.length;
  const naturalCheckpoints = reachedCheckpoints.filter(cp => cp.is_natural).length;
  const checkpointScore = naturalCheckpoints / requiredCheckpoints;

  // 4. 점프 패턴 분석
  const forwardJumps = seekEvents.filter(event => event.jump_amount > 10).length;
  const suspiciousJumps = seekEvents.filter(event => event.jump_amount > 60).length;

  // 5. 마지막 30초 체크
  const lastCheckpoint = Math.max(videoDuration - 30, videoDuration * 0.9);
  const hasReachedEnd = reachedCheckpoints.some(cp => 
    cp.checkpoint_time >= lastCheckpoint && cp.is_natural
  );

  // 6. 종합 검증
  const isValidProgress = 
    watchedPercentage >= 80 &&           // 80% 이상 시청
    checkpointScore >= 0.8 &&            // 80% 이상 체크포인트 자연 도달
    hasReachedEnd &&                     // 마지막 구간 자연 도달
    suspiciousJumps <= 2;                // 의심스러운 점프 2회 이하

  return {
    isValid: isValidProgress,
    watchedPercentage: Math.round(watchedPercentage),
    totalWatchedTime,
    checkpointScore: Math.round(checkpointScore * 100),
    forwardJumps,
    suspiciousJumps,
    hasReachedEnd,
    details: {
      segments: segments.length,
      checkpointsReached: naturalCheckpoints,
      checkpointsRequired: requiredCheckpoints,
      videoDuration
    }
  };
}