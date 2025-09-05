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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionId, userId } = await req.json();

    // 1. 세션 정보 가져오기
    const { data: session } = await supabaseClient
      .from('course_sessions')
      .select('duration_minutes')
      .eq('id', sessionId)
      .single();

    if (!session) {
      throw new Error('Session not found');
    }

    const videoDurationSeconds = session.duration_minutes * 60;

    // 2. 시청 구간 데이터 가져오기
    const { data: segments } = await supabaseClient
      .from('video_watch_segments')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    // 3. 체크포인트 데이터 가져오기
    const checkpoints = generateCheckpoints(videoDurationSeconds);
    const { data: reachedCheckpoints } = await supabaseClient
      .from('video_checkpoints')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    // 4. 점프 이벤트 데이터 가져오기
    const { data: seekEvents } = await supabaseClient
      .from('video_seek_events')
      .select('*')
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    // 5. 진도율 계산
    const validation = validateProgress({
      segments: segments || [],
      checkpoints,
      reachedCheckpoints: reachedCheckpoints || [],
      seekEvents: seekEvents || [],
      videoDuration: videoDurationSeconds
    });

    return new Response(JSON.stringify(validation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error validating progress:', error);
    return new Response(JSON.stringify({ error: error.message }), {
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