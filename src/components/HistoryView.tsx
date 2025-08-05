import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { HistoryEntry } from '../services/api';
import './HistoryView.css';

interface HistoryViewProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  entityName: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  isOpen,
  onClose,
  entityId,
  entityName,
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && entityId) {
      loadHistory();
    }
  }, [isOpen, entityId]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getHistory(entityId);
      setHistory(response.history);
    } catch (err) {
      setError('Failed to load history');
      console.error('History error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return 'var(--status-on-track)';
      case 'At Risk':
        return 'var(--status-at-risk)';
      case 'Delayed':
        return 'var(--status-delayed)';
      case 'Emergency':
        return 'var(--status-emergency)';
      default:
        return 'var(--text-color-muted)';
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content history-modal">
        <div className="modal-header">
          <h2>History - {entityName}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="history-content">
          {isLoading && (
            <div className="history-loading">Loading history...</div>
          )}
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          {!isLoading && !error && history.length === 0 && (
            <div className="history-empty">No history available</div>
          )}
          
          {!isLoading && !error && history.length > 0 && (
            <div className="history-timeline">
              {history.map((entry, index) => (
                <div key={index} className="history-entry">
                  <div className="history-entry-time">
                    {formatDate(entry.timestamp)}
                  </div>
                  <div className="history-entry-status">
                    {entry.previousStatus && (
                      <>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(entry.previousStatus) }}
                        >
                          {entry.previousStatus}
                        </span>
                        <span className="status-arrow">→</span>
                      </>
                    )}
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(entry.status) }}
                    >
                      {entry.status}
                    </span>
                  </div>
                  {entry.updateNote && (
                    <div className="history-entry-note">
                      {entry.updateNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};