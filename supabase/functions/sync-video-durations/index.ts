import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VimeoVideoData {
  duration: number;
  title: string;
}

const extractVimeoId = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/channels\/[\w-]+\/(\d+)/,
    /vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)/,
    /vimeo\.com\/album\/\d+\/video\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

const getVimeoVideoDuration = async (videoUrl: string): Promise<number | null> => {
  try {
    const videoId = extractVimeoId(videoUrl);
    if (!videoId) {
      console.error('Invalid Vimeo URL:', videoUrl);
      return null;
    }

    // Vimeo API v2 사용 (인증 불필요)
    const vimeoApiUrl = `https://vimeo.com/api/v2/video/${videoId}.json`;
    const apiResponse = await fetch(vimeoApiUrl);
    
    if (!apiResponse.ok) {
      console.error('Failed to fetch video duration for:', videoId);
      return null;
    }
    
    const apiData = await apiResponse.json();
    const videoData = apiData[0] as VimeoVideoData;

    // duration은 이미 초 단위
    return videoData.duration;
  } catch (error) {
    console.error('Error fetching Vimeo video info:', error);
    return null;
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // 요청에서 course_id 가져오기
    const { course_id } = await req.json();

    if (!course_id) {
      return new Response(
        JSON.stringify({ error: 'course_id is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Syncing video durations for course:', course_id);

    // 해당 강의의 모든 세션 가져오기
    const { data: sessions, error: sessionsError } = await supabaseClient
      .from('course_sessions')
      .select('id, video_url, title')
      .eq('course_id', course_id);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sessions' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Found ${sessions?.length || 0} sessions`);

    let updatedCount = 0;
    let failedCount = 0;

    // 각 세션의 영상 길이 업데이트
    for (const session of sessions || []) {
      if (!session.video_url) {
        console.log(`Session ${session.id} has no video_url, skipping`);
        continue;
      }

      console.log(`Processing session: ${session.title} (${session.id})`);
      
      const duration = await getVimeoVideoDuration(session.video_url);
      
      if (duration !== null) {
        const { error: updateError } = await supabaseClient
          .from('course_sessions')
          .update({ video_duration_seconds: duration })
          .eq('id', session.id);

        if (updateError) {
          console.error(`Failed to update session ${session.id}:`, updateError);
          failedCount++;
        } else {
          console.log(`Updated session ${session.id} with duration ${duration}s`);
          updatedCount++;
        }
      } else {
        console.error(`Could not get duration for session ${session.id}`);
        failedCount++;
      }

      // Rate limiting: Vimeo API 제한을 피하기 위해 약간의 딜레이
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Sync complete: ${updatedCount} updated, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        updated: updatedCount,
        failed: failedCount,
        total: sessions?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in sync-video-durations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
