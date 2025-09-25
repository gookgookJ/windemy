-- Add watched_ranges column to session_progress table for optimized video tracking
ALTER TABLE public.session_progress 
ADD COLUMN watched_ranges JSONB DEFAULT '[]'::jsonb;

-- Add index for better performance on watched_ranges queries
CREATE INDEX idx_session_progress_watched_ranges ON public.session_progress USING GIN (watched_ranges);

-- Add comment for documentation
COMMENT ON COLUMN public.session_progress.watched_ranges IS 'Merged unique time ranges that user has watched, stored as JSON array of {start, end} objects';