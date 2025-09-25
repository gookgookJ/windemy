interface WatchSegment {
  startTime: number;
  endTime: number;
  duration: number;
  weight: number;
}

interface Checkpoint {
  time: number;
  reached: boolean;
  isNatural: boolean;
}

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
  private currentTime: number = 0;
  private lastRecordedTime: number = 0;
  private watchSegments: WatchSegment[] = [];
  private checkpoints: Checkpoint[] = [];
  private seekEvents: SeekEvent[] = [];
  private watchedRanges: { start: number; end: number; weight: number }[] = [];
  private isPlaying: boolean = false;
  private lastPlayTime: number = 0;

  constructor(sessionId: string, userId: string, videoDuration: number) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.videoDuration = videoDuration;
    this.generateCheckpoints();
  }

  private generateCheckpoints() {
    const intervalMinutes = Math.max(1, Math.floor(this.videoDuration / 180));
    
    for (let i = intervalMinutes * 60; i < this.videoDuration; i += intervalMinutes * 60) {
      this.checkpoints.push({
        time: i,
        reached: false,
        isNatural: false
      });
    }
    
    // 마지막 30초 전 필수 체크포인트
    const lastCheckpoint = Math.max(this.videoDuration - 30, this.videoDuration * 0.9);
    this.checkpoints.push({
      time: Math.floor(lastCheckpoint),
      reached: false,
      isNatural: false
    });
  }

  onPlay(currentTime: number) {
    this.isPlaying = true;
    this.lastPlayTime = Date.now();
    this.currentTime = currentTime;
    this.lastRecordedTime = currentTime;
  }

  onPause(currentTime: number) {
    if (this.isPlaying) {
      this.recordWatchSegment(this.currentTime, currentTime);
    }
    this.isPlaying = false;
    this.currentTime = currentTime;
  }

  onTimeUpdate(currentTime: number) {
    // 재생 이벤트가 누락되어도 안전하게 동작하도록 보정
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.lastPlayTime = Date.now();
      this.currentTime = currentTime;
      this.lastRecordedTime = currentTime;
      this.checkCheckpoints(currentTime);
      return;
    }

    // 체크포인트 확인
    this.checkCheckpoints(currentTime);

    // 연속 재생 확인 (1초마다)
    if (currentTime - this.lastRecordedTime >= 1) {
      this.recordWatchSegment(this.lastRecordedTime, currentTime);
      this.lastRecordedTime = currentTime;
    }

    this.currentTime = currentTime;
    
    // 디버깅용 로그 (5초마다)
    if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime) !== Math.floor(this.lastRecordedTime)) {
      console.log('VideoProgressTracker update:', {
        currentTime: currentTime.toFixed(2),
        totalWatchedTime: this.getTotalWatchedTime().toFixed(2),
        watchedPercentage: this.getWatchedPercentage().toFixed(1) + '%',
        segments: this.watchSegments.length,
        checkpoints: this.checkpoints.filter(cp => cp.reached).length + '/' + this.checkpoints.length
      });
    }
  }

  onSeeked(fromTime: number, toTime: number) {
    const jumpAmount = toTime - fromTime;
    
    // 점프 이벤트 기록
    this.seekEvents.push({
      fromTime,
      toTime,
      jumpAmount,
      timestamp: Date.now()
    });

    // 앞으로 점프한 경우 구간 무효화
    if (jumpAmount > 10) {
      this.invalidateSkippedRange(fromTime, toTime);
    }

    this.currentTime = toTime;
    this.lastRecordedTime = toTime;
  }

  private recordWatchSegment(startTime: number, endTime: number) {
    if (endTime <= startTime) return;

    const duration = endTime - startTime;
    const weight = this.calculateWeight(startTime, endTime);

    // 기존 시청 범위와 겹치는지 확인
    this.updateWatchedRanges(startTime, endTime, weight);

    const segment: WatchSegment = {
      startTime,
      endTime,
      duration,
      weight
    };

    this.watchSegments.push(segment);
  }

  private calculateWeight(startTime: number, endTime: number): number {
    // 이미 본 구간인지 확인
    const overlaps = this.watchedRanges.filter(range => 
      !(endTime <= range.start || startTime >= range.end)
    );

    if (overlaps.length > 0) {
      // 반복 시청은 30% 가중치
      return 0.3;
    }

    return 1.0;
  }

  private updateWatchedRanges(startTime: number, endTime: number, weight: number) {
    this.watchedRanges.push({ start: startTime, end: endTime, weight });
    
    // 겹치는 범위들을 병합
    this.watchedRanges.sort((a, b) => a.start - b.start);
    const merged = [];
    
    for (const range of this.watchedRanges) {
      if (merged.length === 0 || merged[merged.length - 1].end < range.start) {
        merged.push(range);
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, range.end);
      }
    }
    
    this.watchedRanges = merged;
  }

  private invalidateSkippedRange(fromTime: number, toTime: number) {
    // 건너뛴 구간을 시청하지 않은 것으로 처리
    this.watchedRanges = this.watchedRanges.filter(range => 
      !(range.start >= fromTime && range.end <= toTime)
    );
  }

  private checkCheckpoints(currentTime: number) {
    this.checkpoints.forEach(checkpoint => {
      if (!checkpoint.reached && currentTime >= checkpoint.time) {
        checkpoint.reached = true;
        
        // 최근 점프가 있었는지 확인 (5초 내)
        const recentJump = this.seekEvents.find(event => 
          Date.now() - event.timestamp < 5000 && 
          event.jumpAmount > 5
        );
        
        checkpoint.isNatural = !recentJump;
      }
    });
  }

  getTotalWatchedTime(): number {
    return this.watchSegments.reduce((total, segment) => 
      total + (segment.duration * segment.weight), 0
    );
  }

  getWatchedPercentage(): number {
    return Math.min((this.getTotalWatchedTime() / this.videoDuration) * 100, 100);
  }

  isValidForCompletion(): boolean {
    const watchedPercentage = this.getWatchedPercentage();
    const requiredCheckpoints = this.checkpoints.length;
    const naturalCheckpoints = this.checkpoints.filter(cp => cp.reached && cp.isNatural).length;
    const checkpointScore = naturalCheckpoints / requiredCheckpoints;
    
    // 마지막 체크포인트 자연 도달 확인
    const lastCheckpoint = this.checkpoints[this.checkpoints.length - 1];
    const hasReachedEnd = lastCheckpoint.reached && lastCheckpoint.isNatural;
    
    // 의심스러운 점프 확인
    const suspiciousJumps = this.seekEvents.filter(event => event.jumpAmount > 60).length;

    return (
      watchedPercentage >= 80 &&
      checkpointScore >= 0.8 &&
      hasReachedEnd &&
      suspiciousJumps <= 2
    );
  }

  public updateVideoDuration(seconds: number) {
    if (seconds && seconds > 0) {
      this.videoDuration = seconds;
      this.checkpoints = [];
      this.generateCheckpoints();
    }
  }

  public getVideoDuration(): number {
    return this.videoDuration;
  }

  getProgressData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      watchSegments: this.watchSegments,
      checkpoints: this.checkpoints,
      seekEvents: this.seekEvents,
      totalWatchedTime: this.getTotalWatchedTime(),
      watchedPercentage: this.getWatchedPercentage(),
      isValidForCompletion: this.isValidForCompletion()
    };
  }

  async saveProgress() {
    const { supabase } = await import('@/integrations/supabase/client');
    
    try {
      // 시청 세그먼트 저장
      if (this.watchSegments.length > 0) {
        const segmentsToSave = this.watchSegments.map(segment => ({
          user_id: this.userId,
          session_id: this.sessionId,
          start_time: segment.startTime,
          end_time: segment.endTime,
          duration: segment.duration,
          weight: segment.weight
        }));

        const { error: segmentError } = await supabase
          .from('video_watch_segments')
          .insert(segmentsToSave);

        if (segmentError) {
          console.error('Error saving watch segments:', segmentError);
        }
      }

      // 체크포인트 저장
      const reachedCheckpoints = this.checkpoints.filter(cp => cp.reached);
      if (reachedCheckpoints.length > 0) {
        const checkpointsToSave = reachedCheckpoints.map(checkpoint => ({
          user_id: this.userId,
          session_id: this.sessionId,
          checkpoint_time: checkpoint.time,
          is_natural: checkpoint.isNatural
        }));

        const { error: checkpointError } = await supabase
          .from('video_checkpoints')
          .upsert(checkpointsToSave, {
            onConflict: 'user_id,session_id,checkpoint_time'
          });

        if (checkpointError) {
          console.error('Error saving checkpoints:', checkpointError);
        }
      }

      // Seek 이벤트 저장
      if (this.seekEvents.length > 0) {
        const seekEventsToSave = this.seekEvents.map(event => ({
          user_id: this.userId,
          session_id: this.sessionId,
          from_time: event.fromTime,
          to_time: event.toTime,
          jump_amount: event.jumpAmount
        }));

        const { error: seekError } = await supabase
          .from('video_seek_events')
          .insert(seekEventsToSave);

        if (seekError) {
          console.error('Error saving seek events:', seekError);
        }
      }

      // 세션 진도 업데이트
      const watchedPercentage = this.getWatchedPercentage();
      const isCompleted = this.isValidForCompletion();
      
      const { error: progressError } = await supabase
        .from('session_progress')
        .upsert({
          user_id: this.userId,
          session_id: this.sessionId,
          watched_duration_seconds: Math.round(this.getTotalWatchedTime()),
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null
        }, {
          onConflict: 'user_id,session_id'
        });

      if (progressError) {
        console.error('Error updating session progress:', progressError);
      }

      // 클리어 데이터 (중복 저장 방지)
      this.watchSegments = [];
      this.seekEvents = [];

      const data = this.getProgressData();
      console.log('Progress saved successfully:', data);
      return data;
      
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }
}