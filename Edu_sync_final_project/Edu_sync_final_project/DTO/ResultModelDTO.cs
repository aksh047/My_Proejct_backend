namespace Edu_sync_final_project.DTO
{
    public class ResultModelDTO

    {
        public Guid ResultId { get; set; }

        public Guid? AssessmentId { get; set; }

        public Guid? UserId { get; set; }

        public int? Score { get; set; }

        public DateTime? AttemptDate { get; set; }
    }
}
