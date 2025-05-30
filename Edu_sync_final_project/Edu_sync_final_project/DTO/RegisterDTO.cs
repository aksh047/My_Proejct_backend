namespace Edu_sync_final_project.DTO
{
    public class RegisterUserDto
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }  // Student or Instructor
    }

}
