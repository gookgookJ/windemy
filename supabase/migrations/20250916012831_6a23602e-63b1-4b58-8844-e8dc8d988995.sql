-- Create function to update enrollment progress based on completed sessions
CREATE OR REPLACE FUNCTION update_enrollment_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update enrollment progress when session progress changes
  UPDATE enrollments 
  SET progress = (
    SELECT CASE 
      WHEN COUNT(cs.id) = 0 THEN 0
      ELSE (COUNT(CASE WHEN sp.completed = true THEN 1 END)::float / COUNT(cs.id)::float) * 100
    END
    FROM course_sessions cs
    LEFT JOIN session_progress sp ON cs.id = sp.session_id 
      AND sp.user_id = enrollments.user_id 
    WHERE cs.course_id = enrollments.course_id
  ),
  completed_at = CASE 
    WHEN (
      SELECT COUNT(CASE WHEN sp.completed = true THEN 1 END)::float / COUNT(cs.id)::float * 100
      FROM course_sessions cs
      LEFT JOIN session_progress sp ON cs.id = sp.session_id 
        AND sp.user_id = enrollments.user_id 
      WHERE cs.course_id = enrollments.course_id
    ) >= 100 THEN NOW()
    ELSE NULL
  END
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND course_id = (
      SELECT course_id FROM course_sessions 
      WHERE id = COALESCE(NEW.session_id, OLD.session_id)
    );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update enrollment progress
DROP TRIGGER IF EXISTS trigger_update_enrollment_progress ON session_progress;
CREATE TRIGGER trigger_update_enrollment_progress
  AFTER INSERT OR UPDATE OR DELETE ON session_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_progress();