import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Search, Edit, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

const TableView = () => {
  const { tableName } = useParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('ID');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [limit] = useState(50);

  const { data: tableStructure } = useQuery(
    ['tableStructure', tableName],
    () => apiService.getTableStructure(tableName),
    { staleTime: 10 * 60 * 1000 } // 10 minutes
  );

  const { data: tableData, isLoading, error } = useQuery(
    ['tableRecords', tableName, page, search, sortBy, sortOrder, limit],
    () => apiService.getRecords(tableName, { page, limit, search, sortBy, sortOrder }),
    { keepPreviousData: true }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const formatCellValue = (value, field) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    if (typeof value === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Yes' : 'No'}
        </span>
      );
    }

    if (field === 'Txt' || field === 'Markdown') {
      const truncated = String(value).length > 150 
        ? String(value).substring(0, 150) + '...' 
        : String(value);
      return (
        <div className="max-w-xs">
          <div className="text-sm text-gray-900 break-words leading-relaxed">{truncated}</div>
        </div>
      );
    }

    if (field === 'json_data') {
      let jsonObj;
      
      // Handle different JSON data formats
      if (typeof value === 'string') {
        try {
          jsonObj = JSON.parse(value);
        } catch {
          return <span className="text-sm break-words text-red-600">{String(value)}</span>;
        }
      } else if (typeof value === 'object' && value !== null) {
        jsonObj = value;
      } else {
        return <span className="text-sm break-words">{String(value)}</span>;
      }
      
      // Create a nice snippet of the JSON
      const jsonString = JSON.stringify(jsonObj, null, 2);
      const truncated = jsonString.length > 200 
        ? jsonString.substring(0, 200) + '...' 
        : jsonString;
      
      // Count the number of top-level keys for context
      const keyCount = Object.keys(jsonObj).length;
      const keyNames = Object.keys(jsonObj).slice(0, 3).join(', ');
      
      return (
        <div className="max-w-xs">
          <div className="text-xs text-gray-600 mb-1">
            {keyCount} key{keyCount !== 1 ? 's' : ''}: {keyNames}{keyCount > 3 ? '...' : ''}
          </div>
          <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded break-words leading-relaxed border">
            {truncated}
          </div>
        </div>
      );
    }

    return <span className="text-sm break-words">{String(value)}</span>;
  };

  if (error) {
    toast.error('Failed to load table data');
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading table data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-2xl font-bold text-gray-900">{tableName}</h1>
        </div>
        
        <div className="text-sm text-gray-600">
          {tableData?.pagination && (
            <span>
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, tableData.pagination.totalRecords)} of {tableData.pagination.totalRecords.toLocaleString()} records
            </span>
          )}
        </div>
      </div>

      {/* Search and Controls */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or text content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="btn-secondary"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  {tableStructure?.map((column) => (
                    <th
                      key={column.Field}
                      className={`table-header-cell cursor-pointer hover:bg-gray-100 transition-colors ${
                        column.Field === 'Txt' || column.Field === 'Markdown' || column.Field === 'json_data'
                          ? 'max-w-xs'
                          : ''
                      }`}
                      onClick={() => handleSort(column.Field)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.Field}</span>
                        {sortBy === column.Field && (
                          <span className="text-primary-600">
                            {sortOrder === 'ASC' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {tableData?.records?.map((record) => (
                  <tr key={record.ID} className="table-row">
                    {tableStructure?.map((column) => (
                      <td 
                        key={column.Field} 
                        className={column.Field === 'Txt' || column.Field === 'Markdown' || column.Field === 'json_data' 
                          ? 'table-cell-text' 
                          : 'table-cell'
                        }
                      >
                        {formatCellValue(record[column.Field], column.Field)}
                      </td>
                    ))}
                    <td className="table-cell">
                      <Link
                        to={`/table/${tableName}/record/${record.ID}`}
                        className="inline-flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {tableData?.pagination && tableData.pagination.total > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {tableData.pagination.current} of {tableData.pagination.total}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, tableData.pagination.total) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= tableData.pagination.total}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableView;
