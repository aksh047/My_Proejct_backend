using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Edu_sync_final_project.Controllers;
using Edu_sync_final_project.Data;
using Edu_sync_final_project.Models;
using Edu_sync_final_project.DTO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using NUnit.Framework;

namespace EduSync.Tests
{
    [TestFixture]
    public class UserModelsControllerTests
    {
        private UserModelsController _controller;
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
            _controller = new UserModelsController(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        public async Task GetUserModels_ReturnsAllUsers()
        {
            var users = new List<UserModel>
            {
                new UserModel { UserId = Guid.NewGuid(), Email = "test1@example.com", Name = "Test User 1", Role = "Student" },
                new UserModel { UserId = Guid.NewGuid(), Email = "test2@example.com", Name = "Test User 2", Role = "Instructor" }
            };
            await _context.UserModels.AddRangeAsync(users);
            await _context.SaveChangesAsync();

            var result = await _controller.GetUserModels();

            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.Count(), Is.EqualTo(2));
        }

        [Test]
        public async Task GetUserModel_WithValidId_ReturnsUser()
        {
            var userId = Guid.NewGuid();
            var user = new UserModel 
            { 
                UserId = userId, 
                Email = "test@example.com", 
                Name = "Test User",
                Role = "Student"
            };
            await _context.UserModels.AddAsync(user);
            await _context.SaveChangesAsync();

            var result = await _controller.GetUserModel(userId);

            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.UserId, Is.EqualTo(userId));
        }

        [Test]
        public async Task GetUserModel_WithInvalidId_ReturnsNotFound()
        {
            var invalidId = Guid.NewGuid();

            var result = await _controller.GetUserModel(invalidId);

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task PostUserModel_WithValidData_CreatesUser()
        {
            var userDto = new UserModelDTO
            {
                UserId = Guid.NewGuid(),
                Email = "newuser@test.com",
                Name = "New User",
                Role = "Student",
                PasswordHash = "hashedPassword",
                PasswordSalt = new byte[] { 1, 2, 3 }
            };

            var result = await _controller.PostUserModel(userDto);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
            var createdResult = result.Result as CreatedAtActionResult;
            Assert.That(createdResult.Value, Is.InstanceOf<UserModel>());
            var createdUser = createdResult.Value as UserModel;
            Assert.That(createdUser.Email, Is.EqualTo("newuser@test.com"));
        }

        [Test]
        public async Task DeleteUserModel_WithValidId_DeletesUser()
        {
            var userId = Guid.NewGuid();
            var user = new UserModel 
            { 
                UserId = userId, 
                Email = "test@example.com", 
                Name = "Test User",
                Role = "Student"
            };
            await _context.UserModels.AddAsync(user);
            await _context.SaveChangesAsync();

            var result = await _controller.DeleteUserModel(userId);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
            var deletedUser = await _context.UserModels.FindAsync(userId);
            Assert.That(deletedUser, Is.Null);
        }

        [Test]
        public async Task DeleteUserModel_WithInvalidId_ReturnsNotFound()
        {
            var invalidId = Guid.NewGuid();

            var result = await _controller.DeleteUserModel(invalidId);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }
    }
} 