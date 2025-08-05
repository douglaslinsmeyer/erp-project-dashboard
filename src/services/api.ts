import type { DepartmentData } from '../types';
import { mockApi } from './mockApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://func-erp-dashboard.azurewebsites.net/api';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true' || (import.meta.env.DEV && !import.meta.env.VITE_USE_REAL_API);

export interface StatusResponse {
  success: boolean;
  sheets: {
    DepartmentStatus: DepartmentData[];
    CellStatus: DepartmentData[];
  };
}

export interface UpdateStatusRequest {
  entityType: 'department' | 'cell';
  entityId: string;
  name: string;
  status: DepartmentData['Status'];
  updateNote: string;
}

export interface CreateEntityRequest {
  entityType: 'department' | 'cell';
  name: string;
  status: DepartmentData['Status'];
  updateNote: string;
}

export interface DeleteEntityRequest {
  entityType: 'department' | 'cell';
  entityId: string;
}

export interface HistoryEntry {
  timestamp: string;
  entityType: string;
  entityId: string;
  entityName: string;
  status: string;
  updateNote: string;
  previousStatus: string | null;
}

export const api = USE_MOCK_API ? mockApi : {
  async getStatus(): Promise<StatusResponse> {
    const response = await fetch(`${API_BASE_URL}/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch status');
    }
    return response.json();
  },

  async updateStatus(data: UpdateStatusRequest): Promise<{ success: boolean; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/status/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    return response.json();
  },

  async createEntity(data: CreateEntityRequest): Promise<{ success: boolean; entityId: string; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/status/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create entity');
    }
    return response.json();
  },

  async deleteEntity(data: DeleteEntityRequest): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/status/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to delete entity');
    }
    return response.json();
  },

  async getHistory(entityId: string): Promise<{ success: boolean; history: HistoryEntry[] }> {
    const response = await fetch(`${API_BASE_URL}/history/${entityId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch history');
    }
    return response.json();
  },

  async getNegotiateInfo(): Promise<{ url: string; accessToken: string }> {
    const response = await fetch(`${API_BASE_URL}/negotiate`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to get SignalR connection info');
    }
    return response.json();
  },
};