import React, { useState } from 'react';
import type { DepartmentData } from '../types';
import { api } from '../services/api';
import './AddModal.css';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'department' | 'cell';
  onAdd: () => void;
}

export const AddModal: React.FC<AddModalProps> = ({ isOpen, onClose, entityType, onAdd }) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<DepartmentData['Status']>('On Track');
  const [updateNote, setUpdateNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createEntity({
        entityType,
        name: name.trim(),
        status,
        updateNote,
      });
      
      // Reset form
      setName('');
      setStatus('On Track');
      setUpdateNote('');
      
      // Notify parent to refresh
      onAdd();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create entity');
      console.error('Create error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setStatus('On Track');
    setUpdateNote('');
    setError(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New {entityType === 'department' ? 'Department' : 'Cell'}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder={`Enter ${entityType} name`}
              autoFocus
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as DepartmentData['Status'])}
              disabled={isSubmitting}
            >
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Delayed">Delayed</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="updateNote">Initial Note</label>
            <textarea
              id="updateNote"
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              placeholder="Enter initial status details..."
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="modal-actions">
            <div className="modal-actions-right">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};