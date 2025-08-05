import * as signalR from '@microsoft/signalr';
import { api } from './api';

export interface StatusUpdateMessage {
  entityType: string;
  entityId: string;
  status: string;
  updateNote: string;
  timestamp: string;
}

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  async connect(onStatusUpdate: (update: StatusUpdateMessage) => void): Promise<void> {
    try {
      const connectionInfo = await api.getNegotiateInfo();
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(connectionInfo.url, {
          accessTokenFactory: () => connectionInfo.accessToken,
        })
        .withAutomaticReconnect()
        .build();

      this.connection.on('statusUpdated', (update: StatusUpdateMessage) => {
        onStatusUpdate(update);
      });

      this.connection.onreconnected(() => {
        console.log('SignalR reconnected');
      });

      this.connection.onreconnecting(() => {
        console.log('SignalR reconnecting...');
      });

      this.connection.onclose(() => {
        console.log('SignalR connection closed');
        this.scheduleReconnect(onStatusUpdate);
      });

      await this.connection.start();
      console.log('SignalR connected');
    } catch (error) {
      console.error('Failed to connect to SignalR:', error);
      this.scheduleReconnect(onStatusUpdate);
    }
  }

  private scheduleReconnect(onStatusUpdate: (update: StatusUpdateMessage) => void): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect to SignalR...');
      this.connect(onStatusUpdate);
    }, 5000);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
  }

  getConnectionState(): string {
    return this.connection?.state ?? 'Disconnected';
  }
}

export const signalRService = new SignalRService();