import React from 'react';
import type { DepartmentData } from '../types';
import './StatusCard.css';

interface StatusCardProps {
  data: DepartmentData & { type: 'department' | 'cell'; id: string };
  onClick: () => void;
  cardHeight: number;
}

export const StatusCard: React.FC<StatusCardProps> = ({ data, onClick, cardHeight }) => {
  const getTimeSince = (lastUpdate: string) => {
    const now = new Date();
    const updateTime = new Date(lastUpdate);
    const diffInMinutes = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const hours = Math.floor(diffInMinutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const isOverdue = () => {
    const now = new Date();
    const updateTime = new Date(data.LastUpdate);
    const diffInMinutes = (now.getTime() - updateTime.getTime()) / (1000 * 60);
    return diffInMinutes > 60;
  };

  return (
    <div 
      className={`status-card status-${data.Status.toLowerCase().replace(' ', '-')}`}
      style={{ height: `${cardHeight}px` }}
      onClick={onClick}
    >
      <div className="status-badge">{data.Status}</div>
      <div className="card-header">
        <h3>{data.Name}</h3>
      </div>
      <div className="card-body">
        {data.UpdateNote && (
          <p className="update-note">{data.UpdateNote}</p>
        )}
      </div>
      <span className={`time-since ${isOverdue() ? 'overdue' : ''}`}>
        {getTimeSince(data.LastUpdate)}
      </span>
    </div>
  );
};