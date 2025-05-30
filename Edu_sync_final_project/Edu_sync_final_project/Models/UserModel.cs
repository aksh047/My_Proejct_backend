using System;
using System.Collections.Generic;

namespace Edu_sync_final_project.Models;

public partial class UserModel
{
    public Guid UserId { get; set; }

    public string? Name { get; set; }

    public string? Email { get; set; }

    public string? PasswordHash { get; set; }

    public byte[]? PasswordSalt { get; set; }

    public string? Role { get; set; }



    public virtual ICollection<CourseModel> CourseModels { get; set; } = new List<CourseModel>();
    public virtual ICollection<ResultModel> ResultModels { get; set; } = new List<ResultModel>();
}
