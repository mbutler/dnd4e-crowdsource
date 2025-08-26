import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Save, X, Eye, EyeOff } from 'lucide-react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

const RecordEdit = () => {
  const { tableName, id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({});
  const [showJson, setShowJson] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [jsonValidation, setJsonValidation] = useState({});

  const { data: record, isLoading: recordLoading } = useQuery(
    ['record', tableName, id],
    () => apiService.getRecord(tableName, id),
    {
      onSuccess: (data) => {
        setFormData(data);
      },
    }
  );

  const { data: tableStructure } = useQuery(
    ['tableStructure', tableName],
    () => apiService.getTableStructure(tableName),
    { staleTime: 10 * 60 * 1000 }
  );

  const updateMutation = useMutation(
    (data) => apiService.updateRecord(tableName, id, data),
    {
      onSuccess: (data) => {
        toast.success('Record updated successfully!');
        setIsEditing(false);
        queryClient.invalidateQueries(['record', tableName, id]);
        queryClient.invalidateQueries(['tableRecords', tableName]);
      },
      onError: (error) => {
        toast.error('Failed to update record');
        console.error('Update error:', error);
      },
    }
  );

  const handleInputChange = (field, value) => {
    let processedValue = value;
    
    // Handle JSON data validation
    if (field === 'json_data' && value.trim()) {
      try {
        // Try to parse and re-stringify to validate JSON
        const parsed = JSON.parse(value);
        processedValue = JSON.stringify(parsed);
        setJsonValidation(prev => ({ ...prev, [field]: { isValid: true, error: null } }));
      } catch (error) {
        // If it's not valid JSON, keep the original value but show validation error
        setJsonValidation(prev => ({ ...prev, [field]: { isValid: false, error: error.message } }));
      }
    } else if (field === 'json_data') {
      setJsonValidation(prev => ({ ...prev, [field]: { isValid: true, error: null } }));
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleSave = () => {
    // Check if there are any JSON validation errors
    const hasJsonErrors = Object.values(jsonValidation).some(validation => 
      validation && !validation.isValid
    );
    
    if (hasJsonErrors) {
      toast.error('Please fix JSON validation errors before saving');
      return;
    }
    
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData(record);
    setIsEditing(false);
  };

  const renderField = (column, value) => {
    const fieldName = column.Field;
    const fieldType = column.Type.toLowerCase();
    const isPrimaryKey = column.Key === 'PRI';
    const isAutoIncrement = column.Extra?.includes('auto_increment');

    if (isPrimaryKey || isAutoIncrement) {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldName}
            <span className="text-xs text-gray-500 ml-2">(Primary Key)</span>
          </label>
          <input
            type="text"
            value={value || ''}
            disabled
            className="input-field bg-gray-100 cursor-not-allowed"
          />
        </div>
      );
    }

    if (fieldType.includes('text') || fieldType.includes('longtext')) {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldName}
          </label>
          <textarea
            value={isEditing ? (formData[fieldName] || '') : (value || '')}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            disabled={!isEditing}
            rows={6}
            className={`input-field resize-vertical ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </div>
      );
    }

    if (fieldName === 'json_data') {
      // Handle JSON data properly
      let jsonValue = '';
      let jsonDisplay = 'No JSON data';
      
      if (value) {
        try {
          // If value is already a string, parse it
          if (typeof value === 'string') {
            const parsed = JSON.parse(value);
            jsonValue = JSON.stringify(parsed, null, 2);
            jsonDisplay = 'JSON data (click "Show JSON" to edit)';
          } else if (typeof value === 'object') {
            // If value is already an object, stringify it
            jsonValue = JSON.stringify(value, null, 2);
            jsonDisplay = 'JSON data (click "Show JSON" to edit)';
          }
        } catch (error) {
          jsonValue = String(value);
          jsonDisplay = 'Invalid JSON data (click "Show JSON" to edit)';
        }
      }
      
      return (
        <div key={fieldName} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              {fieldName}
            </label>
            <button
              type="button"
              onClick={() => setShowJson(prev => ({ ...prev, [fieldName]: !prev[fieldName] }))}
              className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
            >
              {showJson[fieldName] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showJson[fieldName] ? 'Hide' : 'Show'} JSON</span>
            </button>
          </div>
          {showJson[fieldName] ? (
            <div className="space-y-2">
              <textarea
                value={isEditing ? (formData[fieldName] || '') : jsonValue}
                onChange={(e) => handleInputChange(fieldName, e.target.value)}
                disabled={!isEditing}
                rows={12}
                className={`input-field font-mono text-sm ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''} ${
                  jsonValidation[fieldName] && !jsonValidation[fieldName].isValid ? 'border-red-500' : ''
                }`}
                placeholder="Enter valid JSON..."
              />
              {isEditing && jsonValidation[fieldName] && !jsonValidation[fieldName].isValid && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  <strong>Invalid JSON:</strong> {jsonValidation[fieldName].error}
                </div>
              )}
              {isEditing && jsonValidation[fieldName] && jsonValidation[fieldName].isValid && formData[fieldName] && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  ✓ Valid JSON
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg border">
              <div className="text-sm text-gray-600">
                {jsonDisplay}
              </div>
              {value && typeof value === 'object' && (
                <div className="mt-2 text-xs text-gray-500">
                  <div className="font-medium">Preview:</div>
                  <div className="mt-1 max-h-20 overflow-y-auto">
                    {Object.keys(value).slice(0, 3).map(key => (
                      <div key={key} className="flex">
                        <span className="font-mono text-blue-600">{key}:</span>
                        <span className="ml-2 text-gray-700">
                          {typeof value[key] === 'string' ? value[key].substring(0, 50) : JSON.stringify(value[key]).substring(0, 50)}
                          {typeof value[key] === 'string' && value[key].length > 50 ? '...' : ''}
                        </span>
                      </div>
                    ))}
                    {Object.keys(value).length > 3 && (
                      <div className="text-gray-500 italic">... and {Object.keys(value).length - 3} more properties</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (fieldType.includes('tinyint(1)') || fieldType.includes('bool')) {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldName}
          </label>
          <select
            value={isEditing ? (formData[fieldName] || '') : (value || '')}
            onChange={(e) => handleInputChange(fieldName, e.target.value === 'true')}
            disabled={!isEditing}
            className={`input-field ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      );
    }

    if (fieldType.includes('int') || fieldType.includes('smallint')) {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldName}
          </label>
          <input
            type="number"
            value={isEditing ? (formData[fieldName] || '') : (value || '')}
            onChange={(e) => handleInputChange(fieldName, parseInt(e.target.value) || 0)}
            disabled={!isEditing}
            className={`input-field ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </div>
      );
    }

    // Default text input
    return (
      <div key={fieldName} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {fieldName}
        </label>
        <input
          type="text"
          value={isEditing ? (formData[fieldName] || '') : (value || '')}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          disabled={!isEditing}
          className={`input-field ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
    );
  };

  if (recordLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Record not found</p>
        <Link to={`/table/${tableName}`} className="btn-primary mt-4">
          Back to Table
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/table/${tableName}`}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to {tableName}</span>
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Record #{id}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary"
            >
              Edit Record
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="btn-secondary"
                disabled={updateMutation.isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isLoading}
                className="btn-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tableStructure?.map((column) => 
            renderField(column, record[column.Field])
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link to={`/table/${tableName}`} className="btn-secondary">
          Back to Table View
        </Link>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate(`/table/${tableName}/record/${parseInt(id) - 1}`)}
            disabled={parseInt(id) <= 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Record
          </button>
          <button
            onClick={() => navigate(`/table/${tableName}/record/${parseInt(id) + 1}`)}
            className="btn-secondary"
          >
            Next Record
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordEdit;
