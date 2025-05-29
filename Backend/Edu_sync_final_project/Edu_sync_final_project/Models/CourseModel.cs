using System;
using System.Collections.Generic;

namespace Edu_sync_final_project.Models;

public partial class CourseModel
{
    public Guid CourseId { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public Guid? InstructorId { get; set; }

    public string? MediaUrl { get; set; }

    public virtual ICollection<AssessmentModel> AssessmentModels { get; set; } = new List<AssessmentModel>();

    public virtual UserModel? Instructor { get; set; }
}