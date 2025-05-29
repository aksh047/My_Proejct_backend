using System;
using System.Threading.Tasks;
using Edu_sync_final_project.Controllers;
using Edu_sync_final_project.Data;
using Edu_sync_final_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Moq;
using NUnit.Framework;

namespace EduSync.Tests
{
    [TestFixture]
    public class AuthControllerTests
    {
        private AuthController _controller;
        private AppDbContext _context;
        private Mock<IConfiguration> _mockConfiguration;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfiguration.Setup(x => x["Jwt:Key"]).Returns("YourSecretKeyHere12345678901234567890");
            _mockConfiguration.Setup(x => x["Jwt:Issuer"]).Returns("YourIssuer");
            _mockConfiguration.Setup(x => x["Jwt:Audience"]).Returns("YourAudience");

            _context = new AppDbContext(options, _mockConfiguration.Object);
            _controller = new AuthController(_mockConfiguration.Object, _context);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        private void CreatePasswordHash(string password, out string passwordHash, out byte[] passwordSalt)
        {
            // Generate salt
            passwordSalt = new byte[128 / 8];
            using (var rng = System.Security.Cryptography.RandomNumberGenerator.Create())
            {
                rng.GetBytes(passwordSalt);
            }

            // Hash password with salt using the same method as AuthController
            passwordHash = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: password,
                salt: passwordSalt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 10000,
                numBytesRequested: 256 / 8));
        }

        [Test]
        public async Task Register_WithValidData_ReturnsOkResult()
        {
            var registerDto = new AuthController.RegisterUserDto
            {
                Email = "test@example.com",
                Password = "Test123!",
                FullName = "Test User",
                Role = "Student"
            };

            var result = await _controller.Register(registerDto);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Assert.That(okResult?.Value, Is.Not.Null);
        }

        [Test]
        public async Task Register_WithExistingEmail_ReturnsBadRequest()
        {
            var existingUser = new UserModel
            {
                Email = "test@example.com",
                Name = "Existing User",
                Role = "Student"
            };
            await _context.UserModels.AddAsync(existingUser);
            await _context.SaveChangesAsync();

            var registerDto = new AuthController.RegisterUserDto
            {
                Email = "test@example.com",
                Password = "Test123!",
                FullName = "Test User",
                Role = "Student"
            };

            var result = await _controller.Register(registerDto);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task Login_WithValidCredentials_ReturnsOkResult()
        {
            CreatePasswordHash("Test123!", out var passwordHash, out var passwordSalt);

            var user = new UserModel
            {
                Email = "test@example.com",
                Name = "Test User",
                Role = "Student",
                PasswordHash = passwordHash,
                PasswordSalt = passwordSalt
            };
            await _context.UserModels.AddAsync(user);
            await _context.SaveChangesAsync();

            var loginRequest = new AuthController.LoginRequest
            {
                Email = "test@example.com",
                Password = "Test123!"
            };

            var result = await _controller.Login(loginRequest);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
            var okResult = result as OkObjectResult;
            Assert.That(okResult?.Value, Is.Not.Null);
        }

        [Test]
        public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
        {
            var loginRequest = new AuthController.LoginRequest
            {
                Email = "nonexistent@example.com",
                Password = "WrongPassword"
            };

            var result = await _controller.Login(loginRequest);

            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());
        }
    }
}
