import React, { useState, useEffect } from 'react';
import type { Match } from '../types';
import { getMatches } from '../services/firebaseService';

const MatchResults: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-4"></div>
            <div className="text-xl font-semibold text-gray-600">Loading battle results...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <div className="text-red-700 bg-red-50 border-2 border-red-200 p-4 rounded-xl font-semibold">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="text-4xl sm:text-5xl mb-3">🏆</div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Battle Results
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6">
            Tournament history and match outcomes
          </p>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-lg font-semibold text-gray-700">
              {matches.length} {matches.length === 1 ? 'Match' : 'Matches'} Recorded
            </div>
            <button 
              onClick={loadMatches}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-purple-200 flex items-center gap-2"
            >
              🔄 Refresh Results
            </button>
          </div>
        </div>
        
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <div className="text-xl font-semibold text-gray-600 mb-2">No battles yet!</div>
            <div className="text-gray-500">Record your first match to see results here</div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {matches.map((match, index) => (
              <div key={match.id} className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]">
                {/* Match Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {matches.length - index}
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-gray-800">
                      <span className="text-blue-600">{match.player1Name}</span>
                      <span className="mx-2 text-gray-400">vs</span>
                      <span className="text-red-600">{match.player2Name}</span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm sm:text-base ${
                    match.result === 'tie' 
                      ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-200' 
                      : 'bg-green-100 text-green-700 border-2 border-green-200'
                  }`}>
                    <span className="text-lg">{getResultEmoji(match)}</span>
                    {getResultText(match)}
                  </div>
                </div>
                
                {/* Match Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-center">
                  {/* Player 1 Choice */}
                  <div className="flex flex-col items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                    <div className="text-sm font-semibold text-blue-700 mb-2">{match.player1Name}</div>
                    <div className="text-3xl mb-2">{choiceEmojis[match.player1Choice]}</div>
                    <div className="font-bold capitalize text-blue-800 bg-blue-200 px-3 py-1 rounded-full text-sm">
                      {match.player1Choice}
                    </div>
                  </div>
                  
                  {/* VS Divider */}
                  <div className="flex flex-col items-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-400 mb-2">VS</div>
                    <div className="text-xs sm:text-sm text-gray-500 text-center">
                      {formatDate(match.createdAt)}
                    </div>
                  </div>
                  
                  {/* Player 2 Choice */}
                  <div className="flex flex-col items-center p-4 bg-red-50 rounded-xl border-2 border-red-100">
                    <div className="text-sm font-semibold text-red-700 mb-2">{match.player2Name}</div>
                    <div className="text-3xl mb-2">{choiceEmojis[match.player2Choice]}</div>
                    <div className="font-bold capitalize text-red-800 bg-red-200 px-3 py-1 rounded-full text-sm">
                      {match.player2Choice}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchResults;
