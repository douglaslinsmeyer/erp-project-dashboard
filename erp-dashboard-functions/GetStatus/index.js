const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    try {
        const connectionString = process.env.AzureStorageConnectionString;
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('erp-data');
        const blobClient = containerClient.getBlobClient('current-status.json');

        // Check if blob exists
        const exists = await blobClient.exists();
        if (!exists) {
            // Return empty data if file doesn't exist
            context.res = {
                body: {
                    success: true,
                    sheets: {
                        DepartmentStatus: [],
                        CellStatus: []
                    }
                }
            };
            return;
        }

        // Download blob content
        const downloadResponse = await blobClient.download();
        const downloaded = await streamToString(downloadResponse.readableStreamBody);
        const data = JSON.parse(downloaded);

        // Transform data to match existing frontend format
        const response = {
            success: true,
            sheets: {
                DepartmentStatus: data.departments || [],
                CellStatus: data.cells || []
            }
        };

        context.res = {
            body: response,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    } catch (error) {
        context.log.error('Error getting status:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                error: 'Failed to get status data'
            },
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }
};

// Helper function to convert stream to string
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