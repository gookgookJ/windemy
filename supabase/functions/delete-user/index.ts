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
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    
    if (!isAdmin) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    // 1) Pre-clean related data that may block auth deletion (storage objects, FK-like relations)
    try {
      // Fetch target profile (email used to clean instructors table)
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .maybeSingle();

      // Clean storage objects owned by the user (common cause of deleteUser 500s)
      const { data: ownedObjects, error: ownedErr } = await supabaseAdmin
        .from('storage.objects')
        .select('name,bucket_id')
        .eq('owner', userId);

      if (!ownedErr && ownedObjects && ownedObjects.length) {
        const bucketMap = new Map<string, string[]>();
        for (const obj of ownedObjects) {
          const arr = bucketMap.get(obj.bucket_id) ?? [];
          arr.push(obj.name);
          bucketMap.set(obj.bucket_id, arr);
        }
        for (const [bucket, names] of bucketMap.entries()) {
          // Chunk deletes to avoid payload limits
          const chunkSize = 50;
          for (let i = 0; i < names.length; i += chunkSize) {
            const chunk = names.slice(i, i + chunkSize);
            const { error: rmErr } = await supabaseAdmin.storage.from(bucket).remove(chunk);
            if (rmErr) console.warn(`Failed removing some storage objects from ${bucket}:`, rmErr.message);
          }
        }
      }

      // Delete dependent rows in our public schema
      const simpleUserTables = [
        'session_progress',
        'video_watch_segments',
        'video_seek_events',
        'video_checkpoints',
        'activity_logs',
        'support_tickets',
        'user_roles',
        'user_coupons',
        'points_transactions',
        'admin_notes',
        'user_group_memberships',
        'course_favorites',
        'enrollments',
      ];
      for (const t of simpleUserTables) {
        const { error } = await supabaseAdmin.from(t).delete().eq('user_id', userId);
        if (error) console.warn(`Cleanup warn: deleting from ${t} failed`, error.message);
      }

      // Orders and items
      const { data: ordersToDelete } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('user_id', userId);
      if (ordersToDelete && ordersToDelete.length) {
        const orderIds = ordersToDelete.map((o: any) => o.id);
        const { error: oiErr } = await supabaseAdmin
          .from('order_items')
          .delete()
          .in('order_id', orderIds);
        if (oiErr) console.warn('Cleanup warn: order_items', oiErr.message);
        const { error: oErr } = await supabaseAdmin
          .from('orders')
          .delete()
          .eq('user_id', userId);
        if (oErr) console.warn('Cleanup warn: orders', oErr.message);
      }

      // Courses authored by the user -> detach instructor
      const { error: coursesErr } = await supabaseAdmin
        .from('courses')
        .update({ instructor_id: null })
        .eq('instructor_id', userId);
      if (coursesErr) console.warn('Cleanup warn: courses', coursesErr.message);

      // Instructors directory by email
      if (targetProfile?.email) {
        const { error: instErr } = await supabaseAdmin
          .from('instructors')
          .delete()
          .eq('email', targetProfile.email);
        if (instErr) console.warn('Cleanup warn: instructors', instErr.message);
      }

      // Finally, delete profile row
      const { error: profDelErr } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);
      if (profDelErr) console.warn('Cleanup warn: profiles', profDelErr.message);
    } catch (cleanupErr) {
      console.warn('Cleanup stage encountered warnings:', cleanupErr);
    }

    // 2) Delete user from auth.users (retry after cleanup)
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