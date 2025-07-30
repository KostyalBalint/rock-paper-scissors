import { useState } from 'react'
import './App.css'
import StudentImport from './components/StudentImport'
import MatchRecorder from './components/MatchRecorder'
import MatchResults from './components/MatchResults'

function App() {
  const [activeTab, setActiveTab] = useState<'import' | 'record' | 'results'>('import')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1)
    setActiveTab('record')
  }

  const handleMatchRecorded = () => {
    setRefreshKey(prev => prev + 1)
    setActiveTab('results')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
              🪨📄✂️
            </h1>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
              Rock Paper Scissors
            </h2>
            <p className="text-base sm:text-lg text-gray-600 font-medium">
              Tournament Manager
            </p>
          </div>
          
          <nav className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 max-w-2xl mx-auto">
            <button 
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg ${
                activeTab === 'import' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200 border-2 border-blue-500' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-gray-100'
              }`}
              onClick={() => setActiveTab('import')}
            >
              📥 Import Students
            </button>
            <button 
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg ${
                activeTab === 'record' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-200 border-2 border-green-500' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-gray-100'
              }`}
              onClick={() => setActiveTab('record')}
            >
              ⚔️ Record Match
            </button>
            <button 
              className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg ${
                activeTab === 'results' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-200 border-2 border-purple-500' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-gray-100'
              }`}
              onClick={() => setActiveTab('results')}
            >
              🏆 View Results
            </button>
          </nav>
        </header>

        <main className="animate-fadeIn">
          {activeTab === 'import' && (
            <StudentImport onImportComplete={handleImportComplete} />
          )}
          {activeTab === 'record' && (
            <MatchRecorder onMatchRecorded={handleMatchRecorded} />
          )}
          {activeTab === 'results' && (
            <MatchResults key={refreshKey} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
