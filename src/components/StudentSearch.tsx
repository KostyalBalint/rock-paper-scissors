import React, { useState, useEffect } from 'react';
import type { Student } from '../types';
import { subscribeToStudentsWithMatchCounts } from '../services/firebaseService';

interface StudentSearchProps {
  onStudentSelect: (student: Student) => void;
  placeholder?: string;
  selectedStudent?: Student | null;
}

const StudentSearch: React.FC<StudentSearchProps> = ({ 
  onStudentSelect, 
  placeholder = "Search for a student...",
  selectedStudent
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<(Student & { matchCount: number })[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<(Student & { matchCount: number })[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToStudentsWithMatchCounts((studentsWithCounts) => {
      setStudents(studentsWithCounts);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [isLoading]);

  useEffect(() => {
    if (selectedStudent) {
      setSearchTerm(selectedStudent.name);
    }
  }, [selectedStudent]);

  const handleSearchChange = async (value: string) => {
    setSearchTerm(value);
    setShowDropdown(true);

    if (value.trim() === '') {
      setFilteredStudents(students.slice(0, 10));
      return;
    }

    // Filter from loaded students with match counts
    const filtered = students.filter(student => 
      student.name.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 10);
    
    setFilteredStudents(filtered);
  };

  const handleStudentSelect = (student: Student) => {
    setSearchTerm(student.name);
    setShowDropdown(false);
    onStudentSelect(student);
  };

  const handleFocus = () => {
    setShowDropdown(true);
    if (searchTerm === '') {
      setFilteredStudents(students.slice(0, 10));
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150);
  };

  return (
    <div className="relative mb-6">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={isLoading}
          className="w-full pl-10 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl text-base focus:ring-4 focus:ring-blue-100 focus:border-blue-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all duration-200 placeholder-gray-400"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
        {showDropdown && filteredStudents.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 border-t-0 rounded-b-xl max-h-48 overflow-y-auto z-20 shadow-xl">
            {filteredStudents.map((student, index) => (
              <div 
                key={student.id} 
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors duration-150 flex items-center justify-between ${
                  index === 0 ? 'bg-blue-25' : ''
                } last:border-b-0 last:rounded-b-xl`}
                onClick={() => handleStudentSelect(student)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-blue-500">👤</span>
                  <span className="font-medium text-gray-800">{student.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">⚔️</span>
                  <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    {student.matchCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSearch;
