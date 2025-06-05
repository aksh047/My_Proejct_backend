using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Edu_sync_final_project.Data;
using Edu_sync_final_project.Models;
using Edu_sync_final_project.DTO;
using Edu_sync_final_project.Services;

namespace Edu_sync_final_project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CourseModelsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AzureBlobService _blobService;

        public CourseModelsController(AppDbContext context, AzureBlobService blobService)
        {
            _context = context;
            _blobService = blobService;
        }

        // GET: api/CourseModels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CourseModel>>> GetCourseModels([FromQuery] Guid? instructorId)
        {
            if (instructorId.HasValue)
            {
                return await _context.CourseModels
                    .Where(c => c.InstructorId == instructorId.Value)
                    .ToListAsync();
            }
            return await _context.CourseModels.ToListAsync();
        }

        // GET: api/CourseModels/5
        [HttpGet("{id}")]
        public async Task<ActionResult<CourseModel>> GetCourseModel(Guid id)
        {
            var courseModel = await _context.CourseModels.FindAsync(id);

            if (courseModel == null)
            {
                return NotFound();
            }

            return courseModel;
        }

        [HttpGet("instructor/{instructorId}")]
        public async Task<ActionResult<IEnumerable<CourseModel>>> GetCoursesByInstructor(Guid instructorId)
        {
            var courses = await _context.CourseModels
                .Where(c => c.InstructorId == instructorId)
                .ToListAsync();

            if (courses == null || courses.Count == 0)
            {
                return NotFound("No courses found for this instructor.");
            }

            return courses;
        }

        // POST: api/CourseModels
        [HttpPost]
        public async Task<ActionResult<CourseModel>> PostCourse([FromForm] CourseModelDTO courseModel, IFormFile file)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage);
                return BadRequest(new { message = "Validation failed", errors });
            }

            if (courseModel == null)
                return BadRequest(new { message = "Course model cannot be null" });

            // Validate instructor exists
            var instructor = await _context.UserModels.FindAsync(courseModel.InstructorId);
            if (instructor == null)
                return BadRequest(new { message = "Instructor not found" });

            if (instructor.Role != "Instructor")
                return BadRequest(new { message = "User is not an instructor" });

            // Generate a new CourseId
            courseModel.CourseId = Guid.NewGuid();

            string? blobUrl = null;
            if (file != null)
            {
                try
                {
                    Console.WriteLine($"Uploading file for course {courseModel.CourseId}");
                    blobUrl = await _blobService.UploadFileAsync(file, courseModel.CourseId.ToString());
                    Console.WriteLine($"File uploaded successfully. Blob URL: {blobUrl}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error uploading file: {ex.Message}");
                    Console.WriteLine($"Stack trace: {ex.StackTrace}");
                    return BadRequest(new { message = $"Error uploading file: {ex.Message}" });
                }
            }

            var course = new CourseModel
            {
                CourseId = courseModel.CourseId,
                Title = courseModel.Title,
                Description = courseModel.Description,
                InstructorId = courseModel.InstructorId,
                MediaUrl = blobUrl
            };

            try
            {
                _context.CourseModels.Add(course);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving course: {ex.Message}");
                return StatusCode(500, new { message = "Error saving course to database" });
            }

            return CreatedAtAction("GetCourseModel", new { id = course.CourseId }, course);
        }

        // PUT: api/CourseModels/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCourse(Guid id, [FromForm] CourseModelDTO courseModel, IFormFile file)
        {
            if (id != courseModel.CourseId)
            {
                return BadRequest();
            }

            var existingCourse = await _context.CourseModels.FindAsync(id);
            if (existingCourse == null)
            {
                return NotFound();
            }

            string? blobUrl = null;
            if (file != null)
            {
                try
                {
                    // Delete old file if exists
                    if (!string.IsNullOrEmpty(existingCourse.MediaUrl))
                    {
                        await _blobService.DeleteFileAsync(existingCourse.MediaUrl);
                    }

                    // Upload new file
                    blobUrl = await _blobService.UploadFileAsync(file, id.ToString());
                }
                catch (Exception ex)
                {
                    return BadRequest($"Error handling file: {ex.Message}");
                }
            }

            existingCourse.Title = courseModel.Title;
            existingCourse.Description = courseModel.Description;
            existingCourse.MediaUrl = blobUrl ?? existingCourse.MediaUrl;

            _context.Entry(existingCourse).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CourseModelExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/CourseModels/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourseModel(Guid id)
        {
            try
            {
                var courseModel = await _context.CourseModels
                    .Include(c => c.AssessmentModels)
                    .ThenInclude(a => a.ResultModels) // Include results for each assessment
                    .FirstOrDefaultAsync(c => c.CourseId == id);

                if (courseModel == null)
                {
                    return NotFound();
                }

                // Delete associated results for each assessment
                if (courseModel.AssessmentModels != null)
                {
                    foreach (var assessment in courseModel.AssessmentModels)
                    {
                        if (assessment.ResultModels != null)
                        {
                            _context.ResultModels.RemoveRange(assessment.ResultModels);
                        }
                    }
                    // Delete associated assessments
                    _context.AssessmentModels.RemoveRange(courseModel.AssessmentModels);
                }

                // Delete associated blob file if present
                if (!string.IsNullOrEmpty(courseModel.MediaUrl))
                {
                    try
                    {
                        await _blobService.DeleteFileAsync(courseModel.MediaUrl);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"Error deleting blob file: {ex.Message}");
                    }
                }

                // Delete the course
                _context.CourseModels.Remove(courseModel);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                // Log the exception details
                Console.WriteLine($"Error deleting course: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, "An error occurred while deleting the course. Please try again later.");
            }
        }

        private bool CourseModelExists(Guid id)
        {
            return _context.CourseModels.Any(e => e.CourseId == id);
        }
    }
}
