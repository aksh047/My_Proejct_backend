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
    public class ResultModelsControllerTests
    {
        private ResultModelsController _controller;
        private AppDbContext _context;
        private Mock<IConfiguration> _mockConfiguration;
        private Mock<EventHubService> _mockEventHubService;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _mockConfiguration = new Mock<IConfiguration>();

            // Mocking the ILogger dependency for EventHubService
            var mockLogger = new Mock<Microsoft.Extensions.Logging.ILogger<EventHubService>>();

            // Initialize the mock EventHubService with its dependencies (mocked IConfiguration and ILogger)
            _mockEventHubService = new Mock<EventHubService>(_mockConfiguration.Object, mockLogger.Object);

            _context = new AppDbContext(options, _mockConfiguration.Object);

            // Pass both the context and the mock EventHubService to the controller constructor
            _controller = new ResultModelsController(_context, _mockEventHubService.Object);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        public async Task GetResultModels_ReturnsAllResults()
        {
            var results = new List<ResultModel>
            {
                new ResultModel { ResultId = Guid.NewGuid(), Score = 85, UserId = Guid.NewGuid(), AssessmentId = Guid.NewGuid(), AttemptDate = DateTime.UtcNow },
                new ResultModel { ResultId = Guid.NewGuid(), Score = 90, UserId = Guid.NewGuid(), AssessmentId = Guid.NewGuid(), AttemptDate = DateTime.UtcNow }
            };
            await _context.ResultModels.AddRangeAsync(results);
            await _context.SaveChangesAsync();

            var result = await _controller.GetResultModels();

            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.Count(), Is.EqualTo(2));
        }

        [Test]
        public async Task GetResultModel_WithValidId_ReturnsResult()
        {
            var resultId = Guid.NewGuid();
            var resultModel = new ResultModel 
            { 
                ResultId = resultId, 
                Score = 85,
                UserId = Guid.NewGuid(),
                AssessmentId = Guid.NewGuid(),
                AttemptDate = DateTime.UtcNow
            };
            await _context.ResultModels.AddAsync(resultModel);
            await _context.SaveChangesAsync();

            var result = await _controller.GetResultModel(resultId);

            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.ResultId, Is.EqualTo(resultId));
        }

        [Test]
        public async Task GetResultModel_WithInvalidId_ReturnsNotFound()
        {
            var invalidId = Guid.NewGuid();

            var result = await _controller.GetResultModel(invalidId);

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task DeleteResultModel_WithValidId_DeletesResult()
        {
            var resultId = Guid.NewGuid();
            var resultModel = new ResultModel 
            { 
                ResultId = resultId, 
                Score = 85,
                UserId = Guid.NewGuid(),
                AssessmentId = Guid.NewGuid(),
                AttemptDate = DateTime.UtcNow
            };
            await _context.ResultModels.AddAsync(resultModel);
            await _context.SaveChangesAsync();

            var deleteResult = await _controller.DeleteResultModel(resultId);

            Assert.That(deleteResult, Is.InstanceOf<NoContentResult>());
            var deletedResult = await _context.ResultModels.FindAsync(resultId);
            Assert.That(deletedResult, Is.Null);
        }

        [Test]
        public async Task DeleteResultModel_WithInvalidId_ReturnsNotFound()
        {
            var invalidId = Guid.NewGuid();

            var result = await _controller.DeleteResultModel(invalidId);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }
    }
} 
