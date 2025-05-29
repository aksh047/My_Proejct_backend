using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Edu_sync_final_project.Controllers;
using Edu_sync_final_project.Data;
using Edu_sync_final_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using NUnit.Framework;

namespace EduSync.Tests
{
    [TestFixture]
    public class AssessmentModelsControllerTests
    {
        private AssessmentModelsController _controller;
        private AppDbContext _context;
        private Mock<IConfiguration> _mockConfiguration;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _mockConfiguration = new Mock<IConfiguration>();
            _context = new AppDbContext(options, _mockConfiguration.Object);
            _controller = new AssessmentModelsController(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        public async Task GetAssessmentModels_ReturnsAllAssessments()
        {
            var courseId = Guid.NewGuid();
            var assessments = new List<AssessmentModel>
            {
                new AssessmentModel { AssessmentId = Guid.NewGuid(), Title = "Assessment 1", CourseId = courseId, Questions = "Q1,Q2", MaxScore = 100 },
                new AssessmentModel { AssessmentId = Guid.NewGuid(), Title = "Assessment 2", CourseId = courseId, Questions = "Q3,Q4", MaxScore = 100 }
            };
            await _context.AssessmentModels.AddRangeAsync(assessments);
            await _context.SaveChangesAsync();

            var result = await _controller.GetAssessmentModels();

            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.Count(), Is.EqualTo(2));
        }

        [Test]
        public async Task GetAssessmentModel_WithValidId_ReturnsAssessment()
        {
            var assessmentId = Guid.NewGuid();
            var assessment = new AssessmentModel 
            { 
                AssessmentId = assessmentId, 
                Title = "Test Assessment",
                Questions = "Q1,Q2",
                MaxScore = 100
            };
            await _context.AssessmentModels.AddAsync(assessment);
            await _context.SaveChangesAsync();

            var result = await _controller.GetAssessmentModel(assessmentId);

            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.AssessmentId, Is.EqualTo(assessmentId));
        }

        [Test]
        public async Task GetAssessmentModel_WithInvalidId_ReturnsNotFound()
        {
            var invalidId = Guid.NewGuid();

            var result = await _controller.GetAssessmentModel(invalidId);

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task DeleteAssessmentModel_WithValidId_DeletesAssessment()
        {
            var assessmentId = Guid.NewGuid();
            var assessment = new AssessmentModel 
            { 
                AssessmentId = assessmentId, 
                Title = "Test Assessment",
                Questions = "Q1,Q2",
                MaxScore = 100
            };
            await _context.AssessmentModels.AddAsync(assessment);
            await _context.SaveChangesAsync();

            var result = await _controller.DeleteAssessmentModel(assessmentId);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            var deletedAssessment = await _context.AssessmentModels.FindAsync(assessmentId);
            Assert.That(deletedAssessment, Is.Null);
        }

        [Test]
        public async Task DeleteAssessmentModel_WithInvalidId_ReturnsNotFound()
        {
            var invalidId = Guid.NewGuid();

            var result = await _controller.DeleteAssessmentModel(invalidId);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task GetAssessmentsByCourse_ReturnsCourseAssessments()
        {
            // Arrange
            var courseId = Guid.NewGuid();
            var course = new CourseModel
            {
                CourseId = courseId,
                Title = "Test Course",
                Description = "Test Description"
            };
            await _context.CourseModels.AddAsync(course);

            var assessments = new List<AssessmentModel>
            {
                new AssessmentModel
                {
                    AssessmentId = Guid.NewGuid(),
                    CourseId = courseId,
                    Title = "Assessment 1",
                    Questions = "Q1,Q2",
                    MaxScore = 100
                },
                new AssessmentModel
                {
                    AssessmentId = Guid.NewGuid(),
                    CourseId = courseId,
                    Title = "Assessment 2",
                    Questions = "Q3,Q4",
                    MaxScore = 100
                }
            };
            await _context.AssessmentModels.AddRangeAsync(assessments);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetAssessmentsByCourse(courseId);

            // Assert
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
            var okResult = result.Result as OkObjectResult;
            Assert.That(okResult.Value, Is.Not.Null);
            var returnedAssessments = okResult.Value as IEnumerable<AssessmentModel>;
            Assert.That(returnedAssessments.Count(), Is.EqualTo(2));
            Assert.That(returnedAssessments.All(a => a.CourseId == courseId));
        }
    }
} 