import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { userId }: DeleteUserRequest = await req.json();

    if (!userId) {
      throw new Error('사용자 ID가 필요합니다.');
    }

    console.log(`Attempting to delete user: ${userId}`);

    // First, verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('인증이 필요합니다.');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: user } = await supabaseAdmin.auth.getUser(token);

    if (!user.user) {
      throw new Error('유효하지 않은 토큰입니다.');
    }

    // Check if the requesting user is an admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();

    if (profile?.role !== 'admin') {
      throw new Error('관리자 권한이 필요합니다.');
    }

    // Delete user from auth.users (this will cascade to profiles table due to foreign key)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw new Error(`사용자 삭제 실패: ${deleteError.message}`);
    }

    console.log(`Successfully deleted user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '사용자가 성공적으로 삭제되었습니다.' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in delete-user function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || '사용자 삭제 중 오류가 발생했습니다.' 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);