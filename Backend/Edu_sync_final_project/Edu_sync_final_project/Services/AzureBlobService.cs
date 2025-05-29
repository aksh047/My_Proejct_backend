using System;
using System.IO;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Edu_sync_final_project.Services
{
    public class AzureBlobService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly string _containerName;

        public AzureBlobService(string connectionString, string containerName)
        {
            _blobServiceClient = new BlobServiceClient(connectionString);
            _containerName = containerName;
        }

        public async Task<string> UploadFileAsync(IFormFile file, string courseId)
        {
            try
            {
                // Get container client
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                await containerClient.CreateIfNotExistsAsync();

                // Generate unique blob name
                string fileName = $"{courseId}/{Guid.NewGuid()}_{file.FileName}";
                var blobClient = containerClient.GetBlobClient(fileName);

                // Upload file
                using (var stream = file.OpenReadStream())
                {
                    await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType });
                }

                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error uploading file to blob storage: {ex.Message}", ex);
            }
        }

        public async Task<string> UploadFileAsync(Stream stream, string fileName, string contentType = "application/json")
        {
            try
            {
                // Get container client
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);
                await containerClient.CreateIfNotExistsAsync();

                var blobClient = containerClient.GetBlobClient(fileName);

                // Upload file
                await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = contentType });

                return blobClient.Uri.ToString();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error uploading file to blob storage: {ex.Message}", ex);
            }
        }

        public async Task DeleteFileAsync(string blobUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(blobUrl)) return;

                // Get container client
                var containerClient = _blobServiceClient.GetBlobContainerClient(_containerName);

                // Extract blob name from URL
                var uri = new Uri(blobUrl);
                var blobName = uri.Segments[uri.Segments.Length - 1];
                var blobClient = containerClient.GetBlobClient(blobName);

                // Delete blob if exists
                await blobClient.DeleteIfExistsAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting file from blob storage: {ex.Message}", ex);
            }
        }
    }
} 