/**
 * use-editable-field.ts
 * 
 * A custom hook that manages the state and logic for editable fields in forms.
 * This hook provides functionality to track which field is being edited,
 * and handlers for starting, canceling, and checking edit states.
 */

import { useState, useCallback } from 'react';

export interface UseEditableFieldResult {
  editingField: string | null;
  isEditing: (field: string) => boolean;
  handleEditStart: (field: string) => void;
  handleEditCancel: () => void;
  setEditingField: (field: string | null) => void;
}

/**
 * Hook for managing editable fields with popover handling
 * @returns Object with editing state and handlers
 */
export function useEditableField(): UseEditableFieldResult {
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Start editing a field
  const handleEditStart = useCallback((field: string) => {
    console.log('Starting to edit field:', field);
    setEditingField(field);
  }, []);
  
  // Cancel editing
  const handleEditCancel = useCallback(() => {
    console.log('Canceling edit for field:', editingField);
    setEditingField(null);
  }, [editingField]);
  
  // Check if a specific field is being edited
  const isEditing = useCallback((field: string) => {
    return editingField === field;
  }, [editingField]);

  return {
    editingField,
    isEditing,
    handleEditStart,
    handleEditCancel,
    setEditingField
  };
} 