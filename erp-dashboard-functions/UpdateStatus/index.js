const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
    try {
        const { entityType, entityId, name, status, updateNote } = req.body;

        if (!entityType || !entityId || !status) {
            context.res = {
                status: 400,
                body: { success: false, error: 'Missing required fields' },
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            };
            return;
        }

        const connectionString = process.env.AzureStorageConnectionString;
        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient('erp-data');
        
        // Get current status
        const statusBlobClient = containerClient.getBlobClient('current-status.json');
        let currentData = { departments: [], cells: [] };
        
        const exists = await statusBlobClient.exists();
        if (exists) {
            const downloadResponse = await statusBlobClient.download();
            const downloaded = await streamToString(downloadResponse.readableStreamBody);
            currentData = JSON.parse(downloaded);
        }

        // Find and update the entity
        const arrayKey = entityType === 'department' ? 'departments' : 'cells';
        const entity = currentData[arrayKey].find(e => e.id === entityId);
        const timestamp = new Date().toISOString();
        
        if (entity) {
            // Save previous status for history
            const previousStatus = entity.status;
            
            // Update entity
            entity.status = status;
            entity.updateNote = updateNote;
            entity.lastUpdate = timestamp;
            
            // Save history
            await saveHistory(containerClient, {
                timestamp,
                entityType,
                entityId,
                entityName: entity.name,
                status,
                updateNote,
                previousStatus
            });
        } else {
            // Create new entity
            currentData[arrayKey].push({
                id: entityId,
                name: name || entityId,
                status,
                updateNote,
                lastUpdate: timestamp
            });
            
            // Save history for new entity
            await saveHistory(containerClient, {
                timestamp,
                entityType,
                entityId,
                entityName: name || entityId,
                status,
                updateNote,
                previousStatus: null
            });
        }

        // Save updated current status
        const uploadBlobResponse = await statusBlobClient.upload(
            JSON.stringify(currentData, null, 2),
            JSON.stringify(currentData, null, 2).length,
            { overwrite: true }
        );

        // SignalR notification removed temporarily

        context.res = {
            body: { success: true, timestamp },
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    } catch (error) {
        context.log.error('Error updating status:', error);
        context.res = {
            status: 500,
            body: { success: false, error: 'Failed to update status' },
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        };
    }
};

async function saveHistory(containerClient, historyEntry) {
    const date = new Date(historyEntry.timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const historyPath = `history/${year}/${month}/${day}/updates.json`;
    const historyBlobClient = containerClient.getBlobClient(historyPath);
    
    let historyData = [];
    const exists = await historyBlobClient.exists();
    if (exists) {
        const downloadResponse = await historyBlobClient.download();
        const downloaded = await streamToString(downloadResponse.readableStreamBody);
        historyData = JSON.parse(downloaded);
    }
    
    historyData.push(historyEntry);
    
    await historyBlobClient.upload(
        JSON.stringify(historyData, null, 2),
        JSON.stringify(historyData, null, 2).length,
        { overwrite: true }
    );
}

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