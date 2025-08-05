const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    try {
        const entityId = context.bindingData.entityId;
        const limit = parseInt(req.query.limit) || 50;
        
        const connectionString = process.env.AzureStorageConnectionString;
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('erp-data');
        
        const history = [];
        
        // List all blobs in history folder
        for await (const blob of containerClient.listBlobsFlat({ prefix: 'history/' })) {
            if (blob.name.endsWith('/updates.json')) {
                const blobClient = containerClient.getBlobClient(blob.name);
                const downloadResponse = await blobClient.download();
                const downloaded = await streamToString(downloadResponse.readableStreamBody);
                const dayHistory = JSON.parse(downloaded);
                
                // Filter for this entity
                const entityHistory = dayHistory.filter(h => h.entityId === entityId);
                history.push(...entityHistory);
            }
        }
        
        // Sort by timestamp descending
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Apply limit
        const limitedHistory = history.slice(0, limit);
        
        context.res = {
            body: {
                success: true,
                history: limitedHistory
            }
        };
    } catch (error) {
        context.log.error('Error getting history:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                error: 'Failed to get history'
            }
        };
    }
};

async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data.toString());
        });
        readableStream.on('end', () => {
            resolve(chunks.join(''));
        });
        readableStream.on('error', reject);
    });
}