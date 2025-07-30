import React, { useState, useEffect } from 'react';
import type { Student, GameChoice } from '../types';
import { addMatch, checkExistingMatch } from '../services/firebaseService';
import StudentSearch from './StudentSearch';

interface MatchRecorderProps {
  onMatchRecorded: () => void;
}

const MatchRecorder: React.FC<MatchRecorderProps> = ({ onMatchRecorded }) => {
  const [player1, setPlayer1] = useState<Student | null>(null);
  const [player2, setPlayer2] = useState<Student | null>(null);
  const [player1Choice, setPlayer1Choice] = useState<GameChoice | ''>('');
  const [player2Choice, setPlayer2Choice] = useState<GameChoice | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasPlayedBefore, setHasPlayedBefore] = useState(false);
  const [checkingMatch, setCheckingMatch] = useState(false);

  const choices: GameChoice[] = ['rock', 'paper', 'scissors'];
  
  const choiceEmojis = {
    rock: '🪨',
    paper: '📄', 
    scissors: '✂️'
  };

  // Check for existing match when both players are selected
  useEffect(() => {
    const checkForExistingMatch = async () => {
      if (player1 && player2 && player1.id !== player2.id) {
        setCheckingMatch(true);
        try {
          const exists = await checkExistingMatch(player1.id, player2.id);
          setHasPlayedBefore(exists);
          if (exists) {
            setMessage(`⚠️ ${player1.name} and ${player2.name} have already played against each other.`);
          } else {
            setMessage('');
          }
        } catch (error) {
          console.error('Error checking existing match:', error);
        } finally {
          setCheckingMatch(false);
        }
      } else {
        setHasPlayedBefore(false);
        setMessage('');
      }
    };

    checkForExistingMatch();
  }, [player1, player2]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!player1 || !player2) {
      setMessage('Please select both players');
      return;
    }
    
    if (player1.id === player2.id) {
      setMessage('Please select two different players');
      return;
    }
    
    if (!player1Choice || !player2Choice) {
      setMessage('Please select choices for both players');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      await addMatch(
        player1.id,
        player1.name,
        player1Choice as GameChoice,
        player2.id,
        player2.name,
        player2Choice as GameChoice
      );
      
      setMessage('Match recorded successfully!');
      
      setPlayer1(null);
      setPlayer2(null);
      setPlayer1Choice('');
      setPlayer2Choice('');
      
      onMatchRecorded();
    } catch (error) {
      setMessage('Error recording match: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPlayer1(null);
    setPlayer2(null);
    setPlayer1Choice('');
    setPlayer2Choice('');
    setMessage('');
    setHasPlayedBefore(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="text-center mb-5 sm:mb-6">
          <div className="text-3xl sm:text-4xl mb-2">⚔️</div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
            Record Match
          </h2>
          <p className="text-gray-600 text-sm">
            Choose two players and their moves to record the battle
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            {/* Player 1 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-blue-800">Player 1</h3>
              </div>
              
              <StudentSearch 
                onStudentSelect={setPlayer1}
                placeholder="Search for Player 1..."
                selectedStudent={player1}
              />
              
              {player1 && (
                <div className="mt-4">
                  <label className="block text-sm font-bold text-blue-700 mb-2">
                    Choose Player 1's Move:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {choices.map(choice => (
                      <button
                        key={choice}
                        type="button"
                        className={`p-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex flex-col items-center gap-1 ${
                          player1Choice === choice 
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 border-2 border-blue-600' 
                            : 'bg-white text-blue-700 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                        onClick={() => setPlayer1Choice(choice)}
                      >
                        <span className="text-xl">{choiceEmojis[choice]}</span>
                        <span className="text-xs capitalize">{choice}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Player 2 */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-2xl border-2 border-red-100">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-red-800">Player 2</h3>
              </div>
              
              <StudentSearch 
                onStudentSelect={setPlayer2}
                placeholder="Search for Player 2..."
                selectedStudent={player2}
              />
              
              {player2 && (
                <div className="mt-4">
                  <label className="block text-sm font-bold text-red-700 mb-2">
                    Choose Player 2's Move:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {choices.map(choice => (
                      <button
                        key={choice}
                        type="button"
                        className={`p-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 flex flex-col items-center gap-1 ${
                          player2Choice === choice 
                            ? 'bg-red-500 text-white shadow-lg shadow-red-200 border-2 border-red-600' 
                            : 'bg-white text-red-700 border-2 border-red-200 hover:bg-red-50 hover:border-red-300'
                        }`}
                        onClick={() => setPlayer2Choice(choice)}
                      >
                        <span className="text-xl">{choiceEmojis[choice]}</span>
                        <span className="text-xs capitalize">{choice}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-100">
            <button 
              type="submit" 
              disabled={isLoading || !player1 || !player2 || !player1Choice || !player2Choice || hasPlayedBefore || checkingMatch}
              className={`flex-1 px-6 py-3 text-white font-bold text-base rounded-xl disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 ${
                hasPlayedBefore 
                  ? 'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 disabled:from-gray-300 disabled:to-gray-400' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 hover:shadow-green-200'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Recording Battle...
                </>
              ) : checkingMatch ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Checking...
                </>
              ) : hasPlayedBefore ? (
                <>
                  ⚠️ Already Played
                </>
              ) : (
                <>
                  🏁 Record Match
                </>
              )}
            </button>
            
            <button 
              type="button" 
              onClick={reset} 
              disabled={isLoading}
              className="px-4 py-3 bg-gray-100 text-gray-600 font-semibold text-base rounded-xl hover:bg-gray-200 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              🔄 Reset
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-xl font-semibold text-sm flex items-center gap-2 animate-slideIn ${
              message.includes('Error') 
                ? 'text-red-700 bg-red-50 border-2 border-red-200' 
                : message.includes('already played')
                ? 'text-orange-700 bg-orange-50 border-2 border-orange-200'
                : 'text-green-700 bg-green-50 border-2 border-green-200'
            }`}>
              <span className="text-xl">
                {message.includes('Error') ? '❌' : message.includes('already played') ? '⚠️' : '🎉'}
              </span>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default MatchRecorder;
