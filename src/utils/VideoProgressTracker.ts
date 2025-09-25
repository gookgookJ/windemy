import { supabase } from '@/integrations/supabase/client';

interface SeekEvent {
  fromTime: number;
  toTime: number;
  jumpAmount: number;
  timestamp: number;
}

export class VideoProgressTracker {
  private sessionId: string;
  private userId: string;
  private videoDuration: number;
  private lastUpdateTime: number = 0;
  private isPlaying: boolean = false;
  private isInitialized: boolean = false;

  // 핵심 데이터 구조: 병합된 고유 시청 구간
  private mergedWatchedRanges: { start: number; end: number }[] = [];
  private seekEventsToSave: SeekEvent[] = []; // 서버 저장 대기열

  constructor(sessionId: string, userId: string, videoDuration: number) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.videoDuration = videoDuration;
  }

  // 초기화 및 데이터 로드 (새로고침 대응)
  public async initialize() {
    if (this.isInitialized) return;
    try {
      const { data } = await supabase
        .from('session_progress')
        .select('watched_ranges')
        .eq('user_id', this.userId)
        .eq('session_id', this.sessionId)
        .maybeSingle();

      if (data && data.watched_ranges) {
        // JSON 파싱 및 데이터 복원
        this.mergedWatchedRanges = typeof data.watched_ranges === 'string' 
                                   ? JSON.parse(data.watched_ranges) 
                                   : data.watched_ranges || [];
        console.log('Loaded existing progress:', this.mergedWatchedRanges.length, 'ranges');
      }
    } catch (error) {
      console.error('Error loading existing progress:', error);
    } finally {
      this.isInitialized = true;
    }
  }

  onPlay(currentTime: number) {
    this.isPlaying = true;
    this.lastUpdateTime = currentTime;
  }

  onPause(currentTime: number) {
    if (this.isPlaying) {
      this.recordWatchRange(this.lastUpdateTime, currentTime);
    }
    this.isPlaying = false;
    this.lastUpdateTime = currentTime;
  }

  onTimeUpdate(currentTime: number) {
    if (!this.isPlaying || !this.isInitialized) return;

    const timeDiff = currentTime - this.lastUpdateTime;

    // 비정상적인 시간 점프 감지 (3초 이상 차이나면 무시 - 네트워크 지연 등 고려)
    if (currentTime > this.lastUpdateTime && timeDiff > 0 && timeDiff < 3) {
      this.recordWatchRange(this.lastUpdateTime, currentTime);
    }
    
    this.lastUpdateTime = currentTime;
  }

  onSeeked(fromTime: number, toTime: number) {
    const jumpAmount = toTime - fromTime;
    this.seekEventsToSave.push({ fromTime, toTime, jumpAmount, timestamp: Date.now() });
    this.lastUpdateTime = toTime;
  }

  private recordWatchRange(start: number, end: number) {
    if (end <= start + 0.1) return; // 너무 짧은 구간은 무시
    this.mergedWatchedRanges.push({ start, end });
    this.mergeRanges();
  }

  // 시청 구간 병합 로직 (핵심)
  private mergeRanges() {
    if (this.mergedWatchedRanges.length < 2) return;

    this.mergedWatchedRanges.sort((a, b) => a.start - b.start);
    const merged = [];
    let current = { ...this.mergedWatchedRanges[0] };

    for (let i = 1; i < this.mergedWatchedRanges.length; i++) {
      const next = this.mergedWatchedRanges[i];
      // 0.5초 이내의 간격은 이어진 것으로 간주 (오차 허용)
      if (next.start <= current.end + 0.5) {
        current.end = Math.max(current.end, next.end);
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
    this.mergedWatchedRanges = merged;
  }

  // 총 고유 시청 시간 계산
  getTotalWatchedTime(): number {
    return this.mergedWatchedRanges.reduce((total, range) => total + (range.end - range.start), 0);
  }

  getWatchedPercentage(): number {
    if (this.videoDuration === 0) return 0;
    return Math.min((this.getTotalWatchedTime() / this.videoDuration) * 100, 100);
  }

  public updateVideoDuration(seconds: number) {
    if (seconds && seconds > 0) {
      this.videoDuration = seconds;
    }
  }

  public getVideoDuration(): number { 
    return this.videoDuration; 
  }

  getProgressData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      watchedRanges: this.mergedWatchedRanges,
      seekEvents: this.seekEventsToSave,
      totalWatchedTime: this.getTotalWatchedTime(),
      watchedPercentage: this.getWatchedPercentage(),
      isInitialized: this.isInitialized
    };
  }

  // 데이터 저장 로직 수정
  async saveProgress() {
    if (!this.isInitialized) return;
    this.mergeRanges(); // 최종 병합

    const totalWatchedTime = this.getTotalWatchedTime();

    try {
      // 1. session_progress 업데이트 (요약 데이터 저장)
      const { error: progressError } = await supabase
        .from('session_progress')
        .upsert({
          user_id: this.userId,
          session_id: this.sessionId,
          watched_duration_seconds: Math.round(totalWatchedTime),
          // 병합된 시청 범위를 저장 (JSON 형태로)
          watched_ranges: this.mergedWatchedRanges,
        }, {
          onConflict: 'user_id,session_id'
        });

      if (progressError) throw progressError;

      // 2. Seek 이벤트 저장 (증분 저장)
      if (this.seekEventsToSave.length > 0) {
        const eventsBatch = [...this.seekEventsToSave];
        const eventsData = eventsBatch.map(event => ({
          user_id: this.userId,
          session_id: this.sessionId,
          from_time: event.fromTime,
          to_time: event.toTime,
          jump_amount: event.jumpAmount
        }));

        const { error: seekError } = await supabase
          .from('video_seek_events')
          .insert(eventsData);

        if (!seekError) {
          // 성공 시에만 대기열에서 제거
          this.seekEventsToSave = this.seekEventsToSave.filter(s => !eventsBatch.includes(s));
        }
      }
      console.log('Progress saved successfully:', {
        totalWatchedTime,
        watchedPercentage: this.getWatchedPercentage(),
        ranges: this.mergedWatchedRanges.length
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }
}