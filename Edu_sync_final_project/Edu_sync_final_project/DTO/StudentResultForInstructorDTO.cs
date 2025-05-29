namespace Edu_sync_final_project.DTO
{
    public class StudentResultForInstructorDTO
    {
        public Guid ResultId { get; set; }
        public int Score { get; set; }
        public DateTime AttemptDate { get; set; }
        public string StudentName { get; set; }
        public string AssessmentTitle { get; set; }
        public int MaxScore { get; set; }
        public Guid StudentId { get; set; } // Include StudentId for filtering on the frontend
        public Guid AssessmentId { get; set; } // Include AssessmentId for filtering on the frontend
    }
} 