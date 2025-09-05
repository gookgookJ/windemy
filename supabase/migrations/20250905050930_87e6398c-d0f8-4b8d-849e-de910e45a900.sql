-- 시청 구간 추적을 위한 새로운 테이블 생성
CREATE TABLE public.video_watch_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  start_time INTEGER NOT NULL, -- 시작 시간 (초)
  end_time INTEGER NOT NULL,   -- 끝 시간 (초)
  duration INTEGER NOT NULL,   -- 실제 시청 시간 (초)
  weight DECIMAL(3,2) DEFAULT 1.0, -- 가중치 (반복 시청시 낮아짐)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 체크포인트 기록 테이블
CREATE TABLE public.video_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  checkpoint_time INTEGER NOT NULL, -- 체크포인트 시간 (초)
  reached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_natural BOOLEAN DEFAULT true, -- 자연스럽게 도달했는지 (점프 없이)
  UNIQUE(user_id, session_id, checkpoint_time)
);

-- 점프 이벤트 로그 테이블
CREATE TABLE public.video_seek_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES course_sessions(id) ON DELETE CASCADE,
  from_time INTEGER NOT NULL,  -- 점프 시작 위치
  to_time INTEGER NOT NULL,    -- 점프 도착 위치
  jump_amount INTEGER NOT NULL, -- 점프 크기 (양수: 앞으로, 음수: 뒤로)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX idx_watch_segments_user_session ON video_watch_segments(user_id, session_id);
CREATE INDEX idx_checkpoints_user_session ON video_checkpoints(user_id, session_id);
CREATE INDEX idx_seek_events_user_session ON video_seek_events(user_id, session_id);

-- RLS 정책 활성화
ALTER TABLE video_watch_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_seek_events ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "Users can manage own watch segments" ON video_watch_segments FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own checkpoints" ON video_checkpoints FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage own seek events" ON video_seek_events FOR ALL USING (user_id = auth.uid());