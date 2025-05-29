using System;
using System.Collections.Generic;
using Edu_sync_final_project.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Edu_sync_final_project.Data
{
    public partial class AppDbContext : DbContext
    {
        private readonly IConfiguration _configuration;

        // Parameterless constructor for design-time tools (optional)
        public AppDbContext()
        {
        }

        // Constructor used at runtime and by design-time factory
        public AppDbContext(DbContextOptions<AppDbContext> options, IConfiguration configuration)
            : base(options)
        {
            _configuration = configuration;
        }

        public virtual DbSet<AssessmentModel> AssessmentModels { get; set; }
        public virtual DbSet<CourseModel> CourseModels { get; set; }
        public virtual DbSet<ResultModel> ResultModels { get; set; }
        public virtual DbSet<UserModel> UserModels { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured && _configuration != null)
            {
                optionsBuilder.UseSqlServer(_configuration.GetConnectionString("DefaultConnection"));
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AssessmentModel>(entity =>
            {
                entity.HasKey(e => e.AssessmentId);

                entity.ToTable("AssessmentModel");

                entity.Property(e => e.AssessmentId).HasDefaultValueSql("(newsequentialid())");
                entity.Property(e => e.Title)
                    .HasMaxLength(200)
                    .IsUnicode(false);

                entity.HasOne(d => d.Course).WithMany(p => p.AssessmentModels)
                    .HasForeignKey(d => d.CourseId)
                    .HasConstraintName("FK_AssessmentModel_CourseModel");
            });

            modelBuilder.Entity<CourseModel>(entity =>
            {
                entity.HasKey(e => e.CourseId);

                entity.ToTable("CourseModel");

                entity.Property(e => e.CourseId).HasDefaultValueSql("(newsequentialid())");
                entity.Property(e => e.Description)
                    .HasMaxLength(100)
                    .IsUnicode(false);
                entity.Property(e => e.MediaUrl)
                    .HasMaxLength(500)
                    .IsUnicode(false);
                entity.Property(e => e.Title)
                    .HasMaxLength(100)
                    .IsUnicode(false);

                entity.HasOne(d => d.Instructor).WithMany(p => p.CourseModels)
                    .HasForeignKey(d => d.InstructorId)
                    .HasConstraintName("FK_CourseModel_UserModel");
            });

            modelBuilder.Entity<ResultModel>(entity =>
            {
                entity.HasKey(e => e.ResultId);

                entity.ToTable("ResultModel");

                entity.Property(e => e.ResultId).HasDefaultValueSql("(newsequentialid())");
                entity.Property(e => e.AttemptDate).HasColumnType("datetime");

                entity.HasOne(d => d.Assessment).WithMany(p => p.ResultModels)
                    .HasForeignKey(d => d.AssessmentId)
                    .HasConstraintName("FK_ResultModel_AssessmentModel");

                entity.HasOne(d => d.User).WithMany(p => p.ResultModels)
                    .HasForeignKey(d => d.UserId)
                    .HasConstraintName("FK_ResultModel_UserModel");
            });

            modelBuilder.Entity<UserModel>(entity =>
            {
                entity.HasKey(e => e.UserId);

                entity.ToTable("UserModel");

                entity.HasIndex(e => e.Email).IsUnique();

                entity.Property(e => e.UserId).HasDefaultValueSql("(newsequentialid())");
                entity.Property(e => e.Email)
                    .HasMaxLength(100)
                    .IsUnicode(false);
                entity.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsUnicode(false);
                entity.Property(e => e.PasswordHash)
                    .HasMaxLength(225)
                    .IsUnicode(false);

                entity.Property(e => e.PasswordSalt)
                    .HasColumnType("varbinary(128)")
                    .IsRequired(false);

                entity.Property(e => e.Role)
                    .HasMaxLength(20)
                    .IsUnicode(false);
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
