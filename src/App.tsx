import { useState } from 'react'
import './App.css'
import StudentImport from './components/StudentImport'
import MatchRecorder from './components/MatchRecorder'
import MatchResults from './components/MatchResults'
import MatchFlowChart from './components/MatchFlowChart'

function App() {
  const [activeTab, setActiveTab] = useState<'import' | 'record' | 'results' | 'flowchart'>('import')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1)
    setActiveTab('record')
  }

  const handleMatchRecorded = () => {
    setRefreshKey(prev => prev + 1)
    // Stay on the current tab instead of redirecting to results
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <header className="mb-4 sm:mb-6">
          <div className="text-center mb-4 sm:mb-5">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              🪨📄✂️
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">
              Rock Paper Scissors
            </h2>
            <p className="text-sm sm:text-base text-gray-600 font-medium">
              Tournament Manager
            </p>
          </div>
          
          <nav className="flex flex-col sm:flex-row justify-center gap-2 max-w-4xl mx-auto">
            <button 
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === 'import' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md border-2 border-blue-500' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
              onClick={() => setActiveTab('import')}
            >
              📥 Import Students
            </button>
            <button 
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === 'record' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md border-2 border-green-500' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
              onClick={() => setActiveTab('record')}
            >
              ⚔️ Record Match
            </button>
            <button 
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === 'results' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md border-2 border-purple-500' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
              onClick={() => setActiveTab('results')}
            >
              🏆 View Results
            </button>
            <button 
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                activeTab === 'flowchart' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md border-2 border-cyan-500' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
              onClick={() => setActiveTab('flowchart')}
            >
              📊 Flow Chart
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
          {activeTab === 'flowchart' && (
            <MatchFlowChart key={refreshKey} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
