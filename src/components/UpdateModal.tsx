import React, { useState } from 'react';
import type { DepartmentData } from '../types';
import { api } from '../services/api';
import type { UpdateStatusRequest } from '../services/api';
import './UpdateModal.css';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: DepartmentData & { type: 'department' | 'cell'; id: string };
  onUpdate: () => void;
  onShowHistory: () => void;
  onDelete?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  entity,
  onUpdate,
  onShowHistory,
  onDelete,
}) => {
  const [status, setStatus] = useState<DepartmentData['Status']>(entity.Status);
  const [updateNote, setUpdateNote] = useState(entity.UpdateNote || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const updateData: UpdateStatusRequest = {
      entityType: entity.type,
      entityId: entity.id,
      name: entity.Name,
      status,
      updateNote,
    };

    try {
      await api.updateStatus(updateData);
      onUpdate();
      onClose();
    } catch (err) {
      setError('Failed to update status. Please try again.');
      console.error('Update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    setError(null);

    try {
      await api.deleteEntity({
        entityType: entity.type,
        entityId: entity.id,
      });
      onDelete();
      onClose();
    } catch (err) {
      setError('Failed to delete entity. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Update {entity.Name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="updateNote">Update Note</label>
            <textarea
              id="updateNote"
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              placeholder="Enter update details..."
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="modal-actions">
            <div>
              <button
                type="button"
                className="button-secondary"
                onClick={onShowHistory}
                disabled={isSubmitting || isDeleting}
              >
                View History
              </button>
              {onDelete && (
                <button
                  type="button"
                  className="button-danger"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting}
                  style={{ marginLeft: '8px' }}
                >
                  Delete
                </button>
              )}
            </div>
            <div className="modal-actions-right">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-primary"
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </form>
        
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-dialog">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete {entity.Name}?</p>
              <p className="delete-warning">This action cannot be undone.</p>
              <div className="delete-confirm-actions">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="button-danger"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};