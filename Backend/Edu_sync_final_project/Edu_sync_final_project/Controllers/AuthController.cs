using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Linq;
using Edu_sync_final_project.Data;    
using Edu_sync_final_project.Models; 
using Edu_sync_final_project.DTO;   
using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using System.ComponentModel.DataAnnotations;

namespace Edu_sync_final_project.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly AppDbContext _context;  // Your EF DbContext

    public AuthController(IConfiguration configuration, AppDbContext context)
    {
        _configuration = configuration;
        _context = context;
    }

    
    public class LoginRequest
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        [Required]
        public required string Password { get; set; }
    }

   
    public class RegisterUserDto
    {
        [Required]
        public required string FullName { get; set; }
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
        [Required]
        public required string Password { get; set; }
        [Required]
        public required string Role { get; set; }  
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            Console.WriteLine($"Login attempt for email: {request.Email}");
            
            var user = await _context.UserModels.SingleOrDefaultAsync(u => u.Email == request.Email);
            if (user == null)
            {
                Console.WriteLine("User not found");
                return Unauthorized("Invalid credentials");
            }

            Console.WriteLine($"User found: {user.Email}, Role: {user.Role}");
            Console.WriteLine($"Stored salt length: {user.PasswordSalt?.Length ?? 0}");

            // Verify password
            if (!VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt))
            {
                Console.WriteLine("Password verification failed");
                return Unauthorized("Invalid credentials");
            }

            Console.WriteLine("Password verified successfully");
            var token = GenerateJwtToken(user.Email, user.Role);
            Console.WriteLine("Token generated successfully");
            
            return Ok(new { token });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Login error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, "An error occurred during login");
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterUserDto dto)
    {
        try
        {
            Console.WriteLine($"Registration attempt for email: {dto.Email}");

            if (string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password) || string.IsNullOrEmpty(dto.Role))
            {
                Console.WriteLine("Missing required fields");
                return BadRequest(new { message = "Missing required fields" });
            }

            // Validate password strength
            if (dto.Password.Length < 8)
            {
                Console.WriteLine("Password too short");
                return BadRequest(new { message = "Password must be at least 8 characters long" });
            }
            
            if (!dto.Password.Any(char.IsUpper))
            {
                Console.WriteLine("Password missing uppercase");
                return BadRequest(new { message = "Password must contain at least one uppercase letter" });
            }
            
            if (!dto.Password.Any(char.IsLower))
            {
                Console.WriteLine("Password missing lowercase");
                return BadRequest(new { message = "Password must contain at least one lowercase letter" });
            }
            
            if (!dto.Password.Any(char.IsDigit))
            {
                Console.WriteLine("Password missing number");
                return BadRequest(new { message = "Password must contain at least one number" });
            }

            // Validate email format
            try
            {
                var addr = new System.Net.Mail.MailAddress(dto.Email);
                if (addr.Address != dto.Email)
                {
                    Console.WriteLine("Invalid email format");
                    return BadRequest(new { message = "Invalid email format" });
                }
            }
            catch
            {
                Console.WriteLine("Invalid email format");
                return BadRequest(new { message = "Invalid email format" });
            }

            // Validate role
            if (dto.Role != "Student" && dto.Role != "Instructor")
            {
                Console.WriteLine("Invalid role");
                return BadRequest(new { message = "Invalid role. Role must be either 'Student' or 'Instructor'" });
            }

            var userExists = await _context.UserModels.AnyAsync(u => u.Email == dto.Email);
            if (userExists)
            {
                Console.WriteLine("Email already registered");
                return BadRequest(new { message = "Email already registered" });
            }

            // Generate salt
            byte[] salt = new byte[128 / 8];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }

            // Hash password with salt
            var hashed = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: dto.Password,
                salt: salt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 10000,
                numBytesRequested: 256 / 8));

            var user = new UserModel
            {
                Name = dto.FullName,
                Email = dto.Email,
                PasswordHash = hashed,
                PasswordSalt = salt,
                Role = dto.Role
            };

            _context.UserModels.Add(user);
            await _context.SaveChangesAsync();

            Console.WriteLine($"User registered successfully: {dto.Email}");

            // Generate token after successful registration
            var token = GenerateJwtToken(user.Email, user.Role);
            Console.WriteLine($"Token generated: {token}");

            var response = new
            {
                success = true,
                message = "User registered successfully",
                data = new
                {
                    token = token,
                    user = new
                    {
                        email = user.Email,
                        role = user.Role,
                        name = user.Name
                    }
                }
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Registration error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return StatusCode(500, new { 
                success = false,
                message = "An error occurred during registration",
                error = ex.Message
            });
        }
    }

    private string GenerateJwtToken(string email, string role)
    {
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(role))
        {
            throw new ArgumentException("Email and role cannot be null or empty");
        }
        
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, email),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim(ClaimTypes.Name, email) 
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? 
            throw new InvalidOperationException("JWT key is missing")));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(7), // Token valid for 7 days
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private bool VerifyPassword(string enteredPassword, string storedHash, byte[] storedSalt)
    {
        if (string.IsNullOrEmpty(enteredPassword) || string.IsNullOrEmpty(storedHash) || storedSalt == null)
        {
            return false;
        }

        try
        {
            var enteredHash = Convert.ToBase64String(KeyDerivation.Pbkdf2(
                password: enteredPassword,
                salt: storedSalt,
                prf: KeyDerivationPrf.HMACSHA256,
                iterationCount: 10000,
                numBytesRequested: 256 / 8));

            Console.WriteLine($"Stored hash: {storedHash}");
            Console.WriteLine($"Entered hash: {enteredHash}");
            
            return enteredHash == storedHash;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error verifying password: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            return false;
        }
    }
}
