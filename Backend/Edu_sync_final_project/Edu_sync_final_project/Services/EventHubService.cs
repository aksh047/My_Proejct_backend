using Azure.Messaging.EventHubs;
using Azure.Messaging.EventHubs.Producer;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Edu_sync_final_project.Services
{
    public class EventHubService
    {
        private readonly string _connectionString;
        private readonly string _eventHubName;
        private readonly EventHubProducerClient _producerClient;
        private readonly ILogger<EventHubService> _logger;

        public EventHubService(IConfiguration configuration, ILogger<EventHubService> logger)
        {
            var connectionString = configuration["AzureEventHubs:ConnectionString"];
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new InvalidOperationException("Azure Event Hubs connection string is missing");
            }
            _connectionString = connectionString;

            var eventHubName = configuration["AzureEventHubs:EventHubName"];
            if (string.IsNullOrEmpty(eventHubName))
            {
                throw new InvalidOperationException("Azure Event Hubs name is missing");
            }
            _eventHubName = eventHubName;

            _producerClient = new EventHubProducerClient(_connectionString, _eventHubName);
            _logger = logger;
        }

        public async Task SendEventAsync<T>(T eventData, string eventType)
        {
            _logger.LogWarning("SendEventAsync called for event type: " + eventType);
            try
            {                            // Create the event data
                var eventBody = JsonSerializer.Serialize(eventData);
                var eventBytes = Encoding.UTF8.GetBytes(eventBody);

                // Create the event
                var eventDataBatch = await _producerClient.CreateBatchAsync();
                var eventDataItem = new EventData(eventBytes);
                eventDataItem.Properties["EventType"] = eventType;

                // Add the event to the batch
                if (!eventDataBatch.TryAdd(eventDataItem))                            {
                    _logger.LogError("Event is too large for the batch");
                    throw new Exception("Event is too large for the batch");                            }

                _logger.LogWarning("About to send event to Event Hub...");                            // Send the batch
                await _producerClient.SendAsync(eventDataBatch);
                _logger.LogInformation($"Event of type {eventType} sent successfully");
            }
            catch (Exception ex)                            {
                _logger.LogError(ex, $"Error sending event of type {eventType}");
                throw;
            }
        }

        public async Task DisposeAsync()
        {
            if (_producerClient != null)
            {
                await _producerClient.DisposeAsync();
            }
        }
    }
} 
