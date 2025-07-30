import React, { useState } from 'react';
import { addMultipleStudents } from '../services/firebaseService';

interface StudentImportProps {
  onImportComplete: () => void;
}

const StudentImport: React.FC<StudentImportProps> = ({ onImportComplete }) => {
  const [studentText, setStudentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleImport = async () => {
    if (!studentText.trim()) {
      setMessage('Please enter student names');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const names = studentText
        .split('\n')
        .map(name => name.trim())
        .filter(name => name.length > 0);

      if (names.length === 0) {
        setMessage('No valid student names found');
        setIsLoading(false);
        return;
      }

      await addMultipleStudents(names);
      setMessage(`Successfully imported ${names.length} students`);
      setStudentText('');
      onImportComplete();
    } catch (error) {
      setMessage('Error importing students: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-5">
        <div className="text-center mb-4 sm:mb-5">
          <div className="text-3xl sm:text-4xl mb-2">📥</div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
            Import Students
          </h2>
          <p className="text-gray-600 text-sm">
            Add students by entering their names below
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Student Names (one per line)
            </label>
            <textarea
              value={studentText}
              onChange={(e) => setStudentText(e.target.value)}
              placeholder="John Doe&#10;Jane Smith&#10;Mike Johnson&#10;Sarah Williams&#10;..."
              rows={6}
              className="block p-2 w-full text-sm text-gray-900 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            />
            <div className="absolute top-2 right-3 text-xs text-gray-400 font-medium">
              {studentText.split('\n').filter(name => name.trim().length > 0).length} students
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button 
              onClick={handleImport} 
              disabled={isLoading || !studentText.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold text-sm rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-green-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Importing...
                </>
              ) : (
                <>
                  ✨ Import Students
                </>
              )}
            </button>
            {studentText && (
              <button 
                onClick={() => {setStudentText(''); setMessage('');}}
                disabled={isLoading}
                className="px-3 py-3 bg-gray-100 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-200 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
              >
                🗑️ Clear
              </button>
            )}
          </div>
          
          {message && (
            <div className={`p-3 rounded-xl font-semibold text-sm flex items-center gap-2 animate-slideIn ${
              message.includes('Error') 
                ? 'text-red-700 bg-red-50 border-2 border-red-200' 
                : 'text-green-700 bg-green-50 border-2 border-green-200'
            }`}>
              <span className="text-lg">
                {message.includes('Error') ? '❌' : '✅'}
              </span>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentImport;
