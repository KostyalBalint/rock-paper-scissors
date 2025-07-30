import React, { useState, useEffect } from 'react';
import type { Match } from '../types';
import { getMatches, deleteMatch } from '../services/firebaseService';

const MatchResults: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingMatchId, setDeletingMatchId] = useState<string | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const allMatches = await getMatches();
      setMatches(allMatches);
    } catch (err) {
      setError('Error loading matches: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getResultText = (match: Match) => {
    if (match.result === 'tie') {
      return 'Tie Game!';
    }
    return `${match.winner} Wins!`;
  };

  const getResultEmoji = (match: Match) => {
    if (match.result === 'tie') {
      return '🤝';
    }
    return '👑';
  };

  const choiceEmojis = {
    rock: '🪨',
    paper: '📄', 
    scissors: '✂️'
  };

  const handleDeleteClick = (match: Match) => {
    setMatchToDelete(match);
  };

  const handleDeleteConfirm = async () => {
    if (!matchToDelete) return;
    
    setDeletingMatchId(matchToDelete.id);
    try {
      await deleteMatch(matchToDelete.id);
      // Remove the match from local state
      setMatches(prev => prev.filter(m => m.id !== matchToDelete.id));
      setMatchToDelete(null);
    } catch (err) {
      setError('Error deleting match: ' + (err as Error).message);
    } finally {
      setDeletingMatchId(null);
    }
  };

  const handleDeleteCancel = () => {
    setMatchToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-3"></div>
            <div className="text-lg font-semibold text-gray-600">Loading battle results...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6">
          <div className="text-center">
            <div className="text-3xl mb-3">❌</div>
            <div className="text-red-700 bg-red-50 border-2 border-red-200 p-3 rounded-xl font-semibold text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="text-center mb-5">
          <div className="text-3xl sm:text-4xl mb-2">🏆</div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-1">
            Battle Results
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Tournament history and match outcomes
          </p>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-base font-semibold text-gray-700">
              {matches.length} {matches.length === 1 ? 'Match' : 'Matches'} Recorded
            </div>
            <button 
              onClick={loadMatches}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-sm rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-200 flex items-center gap-2"
            >
              🔄 Refresh Results
            </button>
          </div>
        </div>
        
        {matches.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No battles yet!</div>
            <div className="text-gray-500 text-sm">Record your first match to see results here</div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {matches.map((match, index) => (
              <div key={match.id} className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-3 sm:p-4 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
                {/* Match Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {matches.length - index}
                    </div>
                    <div className="text-base sm:text-lg font-bold text-gray-800">
                      <span className={`${match.winner === match.player1Name ? 'text-blue-600' : match.winner === match.player2Name ? 'text-gray-500 line-through' : 'text-blue-600'}`}>
                        {match.player1Name}
                        {match.winner === match.player2Name && ' ❌'}
                      </span>
                      <span className="mx-1 text-gray-400">vs</span>
                      <span className={`${match.winner === match.player2Name ? 'text-red-600' : match.winner === match.player1Name ? 'text-gray-500 line-through' : 'text-red-600'}`}>
                        {match.player2Name}
                        {match.winner === match.player1Name && ' ❌'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs sm:text-sm ${
                      match.result === 'tie' 
                        ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200' 
                        : 'bg-green-100 text-green-700 border-2 border-green-200'
                    }`}>
                      <span className="text-sm">{getResultEmoji(match)}</span>
                      {getResultText(match)}
                    </div>
                    
                    <button
                      onClick={() => handleDeleteClick(match)}
                      disabled={deletingMatchId === match.id}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete match"
                    >
                      {deletingMatchId === match.id ? (
                        <div className="w-5 h-5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Match Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 items-center">
                  {/* Player 1 Choice */}
                  <div className={`flex flex-col items-center p-3 rounded-xl border-2 ${
                    match.winner === match.player1Name 
                      ? 'bg-green-50 border-green-200' 
                      : match.winner === match.player2Name 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-blue-50 border-blue-100'
                  }`}>
                    <div className={`text-xs font-semibold mb-1 ${
                      match.winner === match.player1Name 
                        ? 'text-green-700' 
                        : match.winner === match.player2Name 
                        ? 'text-red-700' 
                        : 'text-blue-700'
                    }`}>
                      {match.player1Name}
                      {match.winner === match.player2Name && ' (Eliminated)'}
                    </div>
                    <div className="text-2xl mb-1">{choiceEmojis[match.player1Choice]}</div>
                    <div className={`font-bold capitalize px-2 py-1 rounded-full text-xs ${
                      match.winner === match.player1Name 
                        ? 'text-green-800 bg-green-200' 
                        : match.winner === match.player2Name 
                        ? 'text-red-800 bg-red-200' 
                        : 'text-blue-800 bg-blue-200'
                    }`}>
                      {match.player1Choice}
                    </div>
                  </div>
                  
                  {/* VS Divider */}
                  <div className="flex flex-col items-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-400 mb-1">VS</div>
                    <div className="text-xs text-gray-500 text-center">
                      {formatDate(match.createdAt)}
                    </div>
                  </div>
                  
                  {/* Player 2 Choice */}
                  <div className={`flex flex-col items-center p-3 rounded-xl border-2 ${
                    match.winner === match.player2Name 
                      ? 'bg-green-50 border-green-200' 
                      : match.winner === match.player1Name 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-red-50 border-red-100'
                  }`}>
                    <div className={`text-xs font-semibold mb-1 ${
                      match.winner === match.player2Name 
                        ? 'text-green-700' 
                        : match.winner === match.player1Name 
                        ? 'text-red-700' 
                        : 'text-red-700'
                    }`}>
                      {match.player2Name}
                      {match.winner === match.player1Name && ' (Eliminated)'}
                    </div>
                    <div className="text-2xl mb-1">{choiceEmojis[match.player2Choice]}</div>
                    <div className={`font-bold capitalize px-2 py-1 rounded-full text-xs ${
                      match.winner === match.player2Name 
                        ? 'text-green-800 bg-green-200' 
                        : match.winner === match.player1Name 
                        ? 'text-red-800 bg-red-200' 
                        : 'text-red-800 bg-red-200'
                    }`}>
                      {match.player2Choice}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Confirmation Dialog */}
        {matchToDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 animate-fadeIn">
              <div className="text-center mb-5">
                <div className="text-3xl mb-2">🗑️</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Match?</h3>
                <p className="text-gray-600 text-sm">
                  Are you sure you want to delete the match between{' '}
                  <span className="font-semibold text-blue-600">{matchToDelete.player1Name}</span> and{' '}
                  <span className="font-semibold text-red-600">{matchToDelete.player2Name}</span>?
                </p>
                <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deletingMatchId !== null}
                  className="flex-1 px-3 py-2 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {deletingMatchId === matchToDelete.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      🗑️ Delete Match
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchResults;
