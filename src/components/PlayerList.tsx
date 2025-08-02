import React, { useState, useEffect } from 'react';
import type { Student } from '../types';
import { subscribeToAllStudentsWithMatchCounts } from '../services/firebaseService';

const PlayerList: React.FC = () => {
  const [students, setStudents] = useState<(Student & { matchCount: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'matches' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeToAllStudentsWithMatchCounts((studentsWithCounts) => {
      setStudents(studentsWithCounts);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSort = (criteria: 'name' | 'matches' | 'status') => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort the filtered students
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'matches':
        comparison = a.matchCount - b.matchCount;
        break;
      case 'status':
        if (a.eliminated === b.eliminated) {
          comparison = a.name.localeCompare(b.name);
        } else {
          comparison = a.eliminated ? 1 : -1;
        }
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const activeStudents = students.filter(s => !s.eliminated);
  const eliminatedStudents = students.filter(s => s.eliminated);
  const totalMatches = students.reduce((sum, student) => sum + student.matchCount, 0) / 2; // Divide by 2 since each match involves 2 players

  // Calculate tournament participation percentage (students with more than 1 match)
  const studentsWithMultipleMatches = students.filter(s => s.matchCount >= 1);
  const participationPercentage = students.length > 0 ? (studentsWithMultipleMatches.length / students.length * 100) : 0;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
            <div className="text-lg font-semibold text-gray-600">Loading players...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="text-center mb-6">
          <div className="text-3xl sm:text-4xl mb-2">👥</div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-1">
            Player Statistics
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Complete overview of all players and their match participation
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-100">
              <div className="text-2xl font-bold text-green-700">{activeStudents.length}</div>
              <div className="text-sm text-green-600 font-semibold">Active Players</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-xl border-2 border-red-100">
              <div className="text-2xl font-bold text-red-700">{eliminatedStudents.length}</div>
              <div className="text-sm text-red-600 font-semibold">Eliminated Players</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-100">
              <div className="text-2xl font-bold text-blue-700">{totalMatches}</div>
              <div className="text-sm text-blue-600 font-semibold">Total Matches</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-xl border-2 border-purple-100">
              <div className="text-2xl font-bold text-purple-700">{participationPercentage.toFixed(1)}%</div>
              <div className="text-sm text-purple-600 font-semibold">Tournament Participation</div>
              <div className="text-xs text-purple-500 mt-1">({studentsWithMultipleMatches.length}/{students.length} with 2+ matches)</div>
            </div>
          </div>

          {/* Search Field */}
          <div className="mb-6">
            <div className="relative max-w-md mx-auto">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search players by name..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all duration-200 placeholder-gray-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="text-center mt-2 text-sm text-gray-600">
                Found {sortedStudents.length} player{sortedStudents.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <button
              onClick={() => handleSort('name')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                sortBy === 'name'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sort by Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('matches')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                sortBy === 'matches'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sort by Matches {sortBy === 'matches' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => handleSort('status')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                sortBy === 'status'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sort by Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">👥</div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No players found!</div>
            <div className="text-gray-500 text-sm">Import some students to see their statistics</div>
          </div>
        ) : sortedStudents.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No players match your search!</div>
            <div className="text-gray-500 text-sm">
              Try searching for a different name or{' '}
              <button
                onClick={() => setSearchTerm('')}
                className="text-purple-600 hover:text-purple-700 font-semibold underline"
              >
                clear your search
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedStudents.map((student, index) => (
              <div
                key={student.id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:scale-102 ${
                  student.eliminated
                    ? 'bg-gradient-to-r from-gray-50 to-red-50 border-gray-200 opacity-75'
                    : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${
                      student.eliminated ? 'bg-gray-400' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className={`font-bold text-lg ${
                        student.eliminated ? 'text-gray-500 line-through' : 'text-gray-800'
                      }`}>
                        {student.name}
                        {student.eliminated && <span className="ml-2">❌</span>}
                        {!student.eliminated && student.matchCount === 0 && <span className="ml-2">🆕</span>}
                      </div>
                      <div className="text-sm text-gray-600">
                        {student.eliminated ? (
                          <>
                            <span className="text-red-600 font-semibold">ELIMINATED</span>
                            {student.eliminatedAt && (
                              <span className="ml-2">
                                on {student.eliminatedAt.toLocaleDateString()}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-green-600 font-semibold">ACTIVE</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      student.eliminated ? 'text-gray-400' : 'text-blue-700'
                    }`}>
                      {student.matchCount}
                    </div>
                    <div className="text-sm text-gray-600">
                      {student.matchCount === 1 ? 'Match' : 'Matches'}
                    </div>
                  </div>
                </div>

                {student.matchCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-500">
                      Player since {student.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerList;
