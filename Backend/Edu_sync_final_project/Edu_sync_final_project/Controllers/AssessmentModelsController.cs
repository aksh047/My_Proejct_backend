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

namespace Edu_sync_final_project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AssessmentModelsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AssessmentModelsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/AssessmentModels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AssessmentModel>>> GetAssessmentModels()
        {
            return await _context.AssessmentModels.ToListAsync();
        }

        // GET: api/AssessmentModels/course/{courseId}
        [HttpGet("course/{courseId}")]
        public async Task<ActionResult<IEnumerable<AssessmentModel>>> GetAssessmentsByCourse(Guid courseId)
        {
            try
            {
                var assessments = await _context.AssessmentModels
                    .Where(a => a.CourseId == courseId)
                    .ToListAsync();

                // Return empty list instead of NotFound
                return Ok(assessments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving assessments", error = ex.Message });
            }
        }

        // GET: api/AssessmentModels/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AssessmentModel>> GetAssessmentModel(Guid id)
        {
            var assessmentModel = await _context.AssessmentModels.FindAsync(id);

            if (assessmentModel == null)
            {
                return NotFound();
            }

            return assessmentModel;
        }

        // PUT: api/AssessmentModels/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAssessment(Guid id, AssessementModelDTO assessmentModel)
        {
            if (id != assessmentModel.AssessmentId)
            {
                return BadRequest();
            }

            AssessmentModel orignalAssessment = new AssessmentModel()
            {
                AssessmentId = assessmentModel.AssessmentId,
                CourseId = assessmentModel.CourseId,
                Title = assessmentModel.Title,
                Questions = assessmentModel.Questions,
                MaxScore = assessmentModel.MaxScore
            };

            _context.Entry(orignalAssessment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AssessmentModelExists(id))
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

        // POST: api/AssessmentModels
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<AssessmentModel>> PostAssessment(AssessementModelDTO assessmentModel)
        {
            //assessment.AssessmentId = Guid.NewGuid();
            AssessmentModel orignalAssessment = new AssessmentModel()
            {
                AssessmentId = assessmentModel.AssessmentId,
                CourseId = assessmentModel.CourseId,
                Title = assessmentModel.Title,
                Questions = assessmentModel.Questions,
                MaxScore = assessmentModel.MaxScore
            };

            _context.AssessmentModels.Add(orignalAssessment);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (AssessmentModelExists(orignalAssessment.AssessmentId))
                {
                    return Conflict();
                }
                else
                {
                    throw;
                }
            }

            return CreatedAtAction("GetAssessmentModel", new { id = orignalAssessment.AssessmentId }, orignalAssessment);
        }


        // DELETE: api/AssessmentModels/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAssessmentModel(Guid id)
        {
            try
            {
                var assessmentModel = await _context.AssessmentModels
                    .Include(a => a.ResultModels)
                    .FirstOrDefaultAsync(a => a.AssessmentId == id);

                if (assessmentModel == null)
                {
                    return NotFound(new { message = "Assessment not found" });
                }

                // Delete associated results first
                if (assessmentModel.ResultModels != null)
                {
                    _context.ResultModels.RemoveRange(assessmentModel.ResultModels);
                }

                // Then delete the assessment
                _context.AssessmentModels.Remove(assessmentModel);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting assessment: {ex.Message}");
                return StatusCode(500, new { message = "Error deleting assessment" });
            }
        }

        private bool AssessmentModelExists(Guid id)
        {
            return _context.AssessmentModels.Any(e => e.AssessmentId == id);
        }
    }
}
