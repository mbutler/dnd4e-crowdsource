import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  Database, 
  Shield, 
  Zap, 
  Users, 
  BookOpen, 
  Gem, 
  Skull,
  Heart,
  Map,
  Crown,
  Target,
  Flame,
  Star,
  Eye,
  Shield as ShieldIcon,
  Book,
  Scroll as ScrollIcon,
  Users as UsersIcon
} from 'lucide-react';
import { apiService } from '../utils/api';
import toast from 'react-hot-toast';

const tableIcons = {
  Power: Zap,
  Monster: Skull,
  Item: Gem,
  Class: Crown,
  Race: Users,
  Feat: Star,
  Ritual: BookOpen,
  Skill: Target,
  Background: Book,
  Theme: Flame,
  ParagonPath: Shield,
  EpicDestiny: Crown,
  Deity: Eye,
  Companion: Heart,
  Associate: UsersIcon,
  Disease: ShieldIcon,
  Poison: Flame,
  Trap: Target,
  Terrain: Map,
  Glossary: ScrollIcon,
  GetFilterSelect: Database
};

const tableColors = {
  Power: 'bg-blue-100 text-blue-800',
  Monster: 'bg-red-100 text-red-800',
  Item: 'bg-yellow-100 text-yellow-800',
  Class: 'bg-purple-100 text-purple-800',
  Race: 'bg-green-100 text-green-800',
  Feat: 'bg-indigo-100 text-indigo-800',
  Ritual: 'bg-pink-100 text-pink-800',
  Skill: 'bg-orange-100 text-orange-800',
  Background: 'bg-teal-100 text-teal-800',
  Theme: 'bg-rose-100 text-rose-800',
  ParagonPath: 'bg-cyan-100 text-cyan-800',
  EpicDestiny: 'bg-violet-100 text-violet-800',
  Deity: 'bg-amber-100 text-amber-800',
  Companion: 'bg-emerald-100 text-emerald-800',
  Associate: 'bg-slate-100 text-slate-800',
  Disease: 'bg-red-100 text-red-800',
  Poison: 'bg-orange-100 text-orange-800',
  Trap: 'bg-gray-100 text-gray-800',
  Terrain: 'bg-green-100 text-green-800',
  Glossary: 'bg-blue-100 text-blue-800',
  GetFilterSelect: 'bg-gray-100 text-gray-800'
};

const Dashboard = () => {
  const { data: tables, isLoading, error } = useQuery('tables', apiService.getTables);

  const { data: tableStats, isLoading: statsLoading } = useQuery(
    'tableStats',
    async () => {
      if (!tables) return {};
      const stats = {};
      for (const table of tables) {
        try {
          stats[table] = await apiService.getTableStats(table);
        } catch (error) {
          console.error(`Error fetching stats for ${table}:`, error);
          stats[table] = { totalRecords: 0, nameSample: [] };
        }
      }
      return stats;
    },
    {
      enabled: !!tables,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      retryDelay: 1000,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    toast.error('Failed to load tables');
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          D&D 4e Compendium Data
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Browse and correct data in the D&D 4e compendium database. Select a table below to start reviewing and editing records.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <Database className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tables</p>
              <p className="text-2xl font-bold text-gray-900">{tables?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">
                {statsLoading ? '...' : 
                  Object.values(tableStats || {}).reduce((sum, stat) => sum + (stat.totalRecords || 0), 0).toLocaleString()
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ready for Review</p>
              <p className="text-2xl font-bold text-gray-900">All Tables</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Database Tables</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables?.map((tableName) => {
            const Icon = tableIcons[tableName] || Database;
            const colorClass = tableColors[tableName] || 'bg-gray-100 text-gray-800';
            const stats = tableStats?.[tableName];
            
            return (
              <Link
                key={tableName}
                to={`/table/${tableName}`}
                className="card hover:shadow-md transition-shadow duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {tableName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {statsLoading ? 'Loading...' : `${stats?.totalRecords?.toLocaleString() || 0} records`}
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-primary-600 transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                {stats?.nameSample && stats.nameSample.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Sample entries:</p>
                    <div className="flex flex-wrap gap-1">
                      {stats.nameSample.slice(0, 3).map((name, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {name}
                        </span>
                      ))}
                      {stats.nameSample.length > 3 && (
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          +{stats.nameSample.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
