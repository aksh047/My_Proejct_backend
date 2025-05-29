using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Edu_sync_final_project.Services
{
    public interface IAzureBlobService
    {
        Task<string> UploadFileAsync(IFormFile file, string fileName);
        Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType);
        Task DeleteFileAsync(string fileName);
        Task<string> GetFileUrlAsync(string fileName);
    }
} 