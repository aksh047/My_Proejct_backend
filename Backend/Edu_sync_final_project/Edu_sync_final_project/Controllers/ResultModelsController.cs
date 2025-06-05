using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Edu_sync_final_project.Data;
using Edu_sync_final_project.Models;
using Edu_sync_final_project.DTO;
using System.Linq;
using Edu_sync_final_project.Services;

namespace Edu_sync_final_project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResultModelsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly EventHubService _eventHubService;

        public ResultModelsController(AppDbContext context, EventHubService eventHubService)
        {
            _context = context;
            _eventHubService = eventHubService;
        }

        // GET: api/ResultModels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ResultModel>>> GetResultModels()
        {
            return await _context.ResultModels.ToListAsync();
        }

        // GET: api/ResultModels/id
        [HttpGet("{id}")]
        public async Task<ActionResult<ResultModel>> GetResultModel(Guid id)
        {
            var resultModel = await _context.ResultModels.FindAsync(id);

            if (resultModel == null)
            {
                return NotFound();
            }

            return resultModel;
        }
        // New endpoint: Get results by student ID
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<ResultModel>>> GetResultsByUser(Guid userId)
        {
            var results = await _context.ResultModels
                .Where(r => r.UserId == userId)
                .Select(r => new ResultModel
                {
                    ResultId = r.ResultId,
                    Score = r.Score,
                    AttemptDate = r.AttemptDate,
                    AssessmentId = r.AssessmentId
                })
                .ToListAsync();

            return Ok(results);
        }

        // New endpoint: Get results for students in a specific course (for instructor view)
        [HttpGet("course/{courseId}/instructor")]
        public async Task<ActionResult<IEnumerable<StudentResultForInstructorDTO>>> GetCourseResultsForInstructor(Guid courseId)
        {
            var results = await _context.ResultModels
                .Include(r => r.Assessment)
                .Include(r => r.User)
                .Where(r => r.Assessment != null && r.Assessment.CourseId == courseId)
                .Select(r => new StudentResultForInstructorDTO
                {
                    ResultId = r.ResultId,
                    Score = r.Score ?? 0,
                    AttemptDate = r.AttemptDate ?? DateTime.UtcNow,
                    StudentName = r.User != null ? r.User.Name : "Unknown Student",
                    AssessmentTitle = r.Assessment != null ? r.Assessment.Title : "Unknown Quiz",
                    MaxScore = r.Assessment != null && r.Assessment.MaxScore.HasValue ? r.Assessment.MaxScore.Value : 0,
                    StudentId = r.UserId ?? Guid.Empty,
                    AssessmentId = r.AssessmentId ?? Guid.Empty
                })
                .ToListAsync();

            return Ok(results);
        }

        // PUT: api/ResultModels/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutResult(Guid id, ResultModelDTO resultModel)
        {
            if (id != resultModel.ResultId)
            {
                return BadRequest();
            }

            var originalResult = await _context.ResultModels.FindAsync(id);
            if (originalResult == null)
            {
                return NotFound();
            }

            // Map properties from DTO to entity, using null checks/coalescing where necessary
            originalResult.AssessmentId = resultModel.AssessmentId;
            originalResult.UserId = resultModel.UserId;
            originalResult.Score = resultModel.Score;
            originalResult.AttemptDate = resultModel.AttemptDate;

            _context.Entry(originalResult).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ResultModelExists(id))
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


        // POST: api/ResultModels
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<ResultModel>> PostResultModel(ResultModel resultModel)
        {
            if (resultModel == null)
            {
                return BadRequest("Result model cannot be null");
            }

            if (resultModel.UserId == Guid.Empty)
            {
                return BadRequest("User ID is required");
            }

            if (resultModel.AssessmentId == Guid.Empty)
            {
                return BadRequest("Assessment ID is required");
            }

            _context.ResultModels.Add(resultModel);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetResultModel", new { id = resultModel.ResultId }, resultModel);
        }

        // DELETE: api/ResultModels/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteResultModel(Guid id)
        {
            var resultModel = await _context.ResultModels.FindAsync(id);
            if (resultModel == null)
            {
                return NotFound();
            }

            _context.ResultModels.Remove(resultModel);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ResultModelExists(Guid id)
        {
            return _context.ResultModels.Any(e => e.ResultId == id);
        }
    }
}
