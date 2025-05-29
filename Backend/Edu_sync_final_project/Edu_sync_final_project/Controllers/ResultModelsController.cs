using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Edu_sync_final_project.Data;
using Edu_sync_final_project.Models;
using Edu_sync_final_project.DTO;
using System.Linq;

namespace Edu_sync_final_project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResultModelsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ResultModelsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ResultModels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ResultModel>>> GetResultModels()
        {
            return await _context.ResultModels.ToListAsync();
        }

        // GET: api/ResultModels/5
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
                .Where(r => r.Assessment.CourseId == courseId)
                .Select(r => new StudentResultForInstructorDTO
                {
                    ResultId = r.ResultId,
                    Score = r.Score.GetValueOrDefault(),
                    AttemptDate = r.AttemptDate.GetValueOrDefault(),
                    StudentName = r.User != null ? r.User.Name : "Unknown Student",
                    AssessmentTitle = r.Assessment != null ? r.Assessment.Title : "Unknown Quiz",
                    MaxScore = r.Assessment != null ? r.Assessment.MaxScore.GetValueOrDefault() : 0,
                    StudentId = r.UserId.GetValueOrDefault(),
                    AssessmentId = r.AssessmentId.GetValueOrDefault()
                })
                .ToListAsync();

            // Although the query should implicitly filter by instructor's courses via the courseId,
            // we can add an explicit check if needed, but the current structure implies this.
            // We return an empty list if no results are found, not NotFound.
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
            

            ResultModel orignalResult = new ResultModel()
            {
                ResultId = resultModel.ResultId,
                AssessmentId = resultModel.AssessmentId,
                UserId = resultModel.UserId,
                Score = resultModel.Score,
                AttemptDate = resultModel.AttemptDate
            };

            _context.Entry(orignalResult).State = EntityState.Modified;

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
        public async Task<ActionResult<ResultModel>> PostResult(ResultModelDTO result)
        {
            //result.ResultId = Guid.NewGuid();
            ResultModel orignalResult = new ResultModel()
            {
                ResultId = result.ResultId,
                AssessmentId = result.AssessmentId,
                UserId = result.UserId,
                Score = result.Score,
                AttemptDate = result.AttemptDate
            };

            _context.ResultModels.Add(orignalResult);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (ResultModelExists(orignalResult.ResultId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetResultModel", new { id = orignalResult.ResultId }, orignalResult);
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
