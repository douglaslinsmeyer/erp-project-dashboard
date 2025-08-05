import type { DepartmentData } from '../types';
import type { StatusResponse, UpdateStatusRequest, HistoryEntry, CreateEntityRequest, DeleteEntityRequest } from './api';

// In-memory storage for mock data
let mockData = {
  departments: [
    {
      id: "accounting",
      name: "Accounting",
      status: "On Track",
      lastUpdate: new Date().toISOString(),
      updateNote: "No Update."
    },
    {
      id: "biz",
      name: "BIZ",
      status: "At Risk",
      lastUpdate: new Date().toISOString(),
      updateNote: "We've re-opened BIZ and are monitoring the app"
    },
    {
      id: "ecom",
      name: "Ecom",
      status: "On Track",
      lastUpdate: new Date().toISOString(),
      updateNote: "Ecom is currently queuing orders. Now through Monday, August 4, we are going to re-enable inventory 8/4."
    },
    {
      id: "customer_relations",
      name: "Customer Relations",
      status: "On Track",
      lastUpdate: new Date().toISOString(),
      updateNote: "No Update."
    },
    {
      id: "credit",
      name: "Credit",
      status: "On Track",
      lastUpdate: new Date().toISOString(),
      updateNote: "No Update."
    },
    {
      id: "export",
      name: "Export",
      status: "On Track",
      lastUpdate: new Date().toISOString(),
      updateNote: "No Update."
    },
    {
      id: "it",
      name: "IT",
      status: "On Track",
      lastUpdate: new Date().toISOString(),
      updateNote: "No update."
    },
    {
      id: "inventory_wm",
      name: "Inventory/WM",
      status: "Delayed",
      lastUpdate: new Date().toISOString(),
      updateNote: "Tracking down issues related to inventory processes"
    }
  ],
  cells: [
    {
      id: "project_alpha",
      name: "Project Alpha",
      status: "On Track",
      lastUpdate: new Date().toISOString(),
      updateNote: "Progress on schedule"
    },
    {
      id: "project_beta",
      name: "Project Beta",
      status: "At Risk",
      lastUpdate: new Date().toISOString(),
      updateNote: "Resource constraints causing delays"
    },
    {
      id: "project_gamma",
      name: "Project Gamma",
      status: "Emergency",
      lastUpdate: new Date().toISOString(),
      updateNote: "Critical issue requires immediate attention"
    }
  ]
};

// Store history in memory
const mockHistory: Record<string, HistoryEntry[]> = {};

export const mockApi = {
  async getStatus(): Promise<StatusResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      sheets: {
        DepartmentStatus: mockData.departments,
        CellStatus: mockData.cells
      }
    };
  },

  async updateStatus(data: UpdateStatusRequest): Promise<{ success: boolean; timestamp: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const timestamp = new Date().toISOString();
    const arrayKey = data.entityType === 'department' ? 'departments' : 'cells';
    const entity = mockData[arrayKey].find(e => e.id === data.entityId);
    
    if (entity) {
      // Store previous status for history
      const previousStatus = entity.status;
      
      // Update entity
      entity.status = data.status;
      entity.updateNote = data.updateNote;
      entity.lastUpdate = timestamp;
      
      // Add to history
      if (!mockHistory[data.entityId]) {
        mockHistory[data.entityId] = [];
      }
      
      mockHistory[data.entityId].push({
        timestamp,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: entity.name,
        status: data.status,
        updateNote: data.updateNote,
        previousStatus
      });
    }
    
    return { success: true, timestamp };
  },

  async getHistory(entityId: string): Promise<{ success: boolean; history: HistoryEntry[] }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      history: mockHistory[entityId] || []
    };
  },

  async getNegotiateInfo(): Promise<{ url: string; accessToken: string }> {
    // Mock SignalR connection info
    return {
      url: 'mock://signalr',
      accessToken: 'mock-token'
    };
  },

  async createEntity(data: CreateEntityRequest): Promise<{ success: boolean; entityId: string; timestamp: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const timestamp = new Date().toISOString();
    const entityId = data.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const arrayKey = data.entityType === 'department' ? 'departments' : 'cells';
    
    // Check if entity with same ID already exists
    if (mockData[arrayKey].find(e => e.id === entityId)) {
      throw new Error('Entity with this name already exists');
    }
    
    // Add new entity
    mockData[arrayKey].push({
      id: entityId,
      name: data.name,
      status: data.status,
      updateNote: data.updateNote,
      lastUpdate: timestamp
    });
    
    // Add to history
    if (!mockHistory[entityId]) {
      mockHistory[entityId] = [];
    }
    
    mockHistory[entityId].push({
      timestamp,
      entityType: data.entityType,
      entityId,
      entityName: data.name,
      status: data.status,
      updateNote: data.updateNote,
      previousStatus: null
    });
    
    return { success: true, entityId, timestamp };
  },

  async deleteEntity(data: DeleteEntityRequest): Promise<{ success: boolean }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const arrayKey = data.entityType === 'department' ? 'departments' : 'cells';
    const index = mockData[arrayKey].findIndex(e => e.id === data.entityId);
    
    if (index === -1) {
      throw new Error('Entity not found');
    }
    
    // Remove entity
    mockData[arrayKey].splice(index, 1);
    
    // Keep history for audit purposes
    
    return { success: true };
  }
};