import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Match, Student } from '../types';
import { getMatches, getStudents } from '../services/firebaseService';

const MatchFlowChart: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const [allMatches, allStudents] = await Promise.all([
        getMatches(),
        getStudents()
      ]);
      setMatches(allMatches);
      setStudents(allStudents);
      generateTournamentBracket(allMatches, allStudents);
    } catch (err) {
      setError('Error loading data: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTournamentBracket = useCallback((matchData: Match[], studentData: Student[]) => {
    if (studentData.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Build student match mapping to calculate wins for each student
    const studentMatchMap: { [studentId: string]: Match[] } = {};
    const studentWins: { [studentId: string]: number } = {};
    
    studentData.forEach(student => {
      studentMatchMap[student.id] = matchData.filter(
        match => match.player1Id === student.id || match.player2Id === student.id
      );
      studentWins[student.id] = matchData.filter(
        match => match.winner === student.name
      ).length;
    });
    
    // Group students by number of wins (columns)
    const columnsByWins: { [wins: number]: Student[] } = {};
    const maxWins = Math.max(...Object.values(studentWins), 0);
    
    studentData.forEach(student => {
      const wins = studentWins[student.id];
      if (!columnsByWins[wins]) {
        columnsByWins[wins] = [];
      }
      columnsByWins[wins].push(student);
    });
    
    const bracketNodes: Node[] = [];
    const bracketEdges: Edge[] = [];
    
    const chartHeight = 700;
    const columnSpacing = 200;
    const playerHeight = 150;
    const playerSpacing = 40;
    
    // Sort players within each column to group opponents together
    const sortPlayersInColumn = (players: Student[], matchData: Match[]) => {
      // Create adjacency map of who played against whom
      const opponentMap: { [studentId: string]: string[] } = {};
      players.forEach(player => {
        opponentMap[player.id] = [];
      });
      
      matchData.forEach(match => {
        if (opponentMap[match.player1Id] !== undefined && opponentMap[match.player2Id] !== undefined) {
          opponentMap[match.player1Id].push(match.player2Id);
          opponentMap[match.player2Id].push(match.player1Id);
        }
      });
      
      // Sort players to minimize visual distance between opponents
      const sorted = [...players];
      const placed: Set<string> = new Set();
      const result: Student[] = [];
      
      // Start with the player who has the most connections in this column
      let currentPlayer = sorted.reduce((best, player) => {
        const connections = opponentMap[player.id].filter(oppId => 
          sorted.some(p => p.id === oppId)
        ).length;
        const bestConnections = opponentMap[best.id].filter(oppId => 
          sorted.some(p => p.id === oppId)
        ).length;
        return connections > bestConnections ? player : best;
      });
      
      while (result.length < sorted.length) {
        if (!placed.has(currentPlayer.id)) {
          result.push(currentPlayer);
          placed.add(currentPlayer.id);
        }
        
        // Find the next player who is an opponent of current player and not yet placed
        const nextOpponent = sorted.find(player => 
          !placed.has(player.id) && 
          opponentMap[currentPlayer.id].includes(player.id)
        );
        
        if (nextOpponent) {
          currentPlayer = nextOpponent;
        } else {
          // If no more opponents, pick the next unplaced player with most connections
          const remaining = sorted.filter(player => !placed.has(player.id));
          if (remaining.length > 0) {
            currentPlayer = remaining.reduce((best, player) => {
              const connections = opponentMap[player.id].filter(oppId => 
                !placed.has(oppId) && sorted.some(p => p.id === oppId)
              ).length;
              const bestConnections = opponentMap[best.id].filter(oppId => 
                !placed.has(oppId) && sorted.some(p => p.id === oppId)
              ).length;
              return connections > bestConnections ? player : best;
            });
          }
        }
      }
      
      return result;
    };

    // Create nodes for each column of players
    for (let wins = 0; wins <= maxWins; wins++) {
      const playersInColumn = columnsByWins[wins] || [];
      
      if (playersInColumn.length === 0) continue;
      
      // Sort players to group opponents together
      const sortedPlayers = sortPlayersInColumn(playersInColumn, matchData);
      
      const columnX = 100 + (wins * columnSpacing);
      const columnHeight = sortedPlayers.length * (playerHeight + playerSpacing);
      const startY = (chartHeight - columnHeight) / 2 + 50;
      
      sortedPlayers.forEach((student, index) => {
        const y = startY + (index * (playerHeight + playerSpacing));
        const losses = studentMatchMap[student.id]?.filter(match => 
          match.winner && match.winner !== student.name
        ).length || 0;
        const ties = studentMatchMap[student.id]?.filter(match => 
          match.result === 'tie'
        ).length || 0;
        
        // Determine if this is the final winner
        const isChampion = wins === maxWins && !student.eliminated;
        
        bracketNodes.push({
          id: `player-${student.id}`,
          type: 'default',
          position: { x: columnX, y },
          data: {
            label: (
              <div className="text-center">
                <div className={`font-bold text-sm mb-2 ${
                  student.eliminated 
                    ? 'text-gray-500 line-through' 
                    : isChampion 
                    ? 'text-yellow-700' 
                    : 'text-gray-800'
                }`}>
                  {student.name}
                  {student.eliminated && ' ❌'}
                  {isChampion && ' 👑'}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  <span className="text-green-600 font-semibold">W: {wins}</span>
                  {' • '}
                  <span className="text-red-600">L: {losses}</span>
                  {ties > 0 && (
                    <>
                      {' • '}
                      <span className="text-yellow-600">T: {ties}</span>
                    </>
                  )}
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  student.eliminated 
                    ? 'bg-red-100 text-red-700' 
                    : isChampion 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {student.eliminated ? 'ELIMINATED' : isChampion ? 'CHAMPION' : 'ACTIVE'}
                </div>
              </div>
            ),
          },
          style: {
            background: student.eliminated 
              ? '#f3f4f6' 
              : isChampion 
              ? '#fef3c7' 
              : '#dcfce7',
            border: student.eliminated 
              ? '2px dashed #9ca3af' 
              : isChampion 
              ? '3px solid #f59e0b' 
              : '2px solid #16a34a',
            borderRadius: '12px',
            padding: '12px 16px',
            minWidth: '140px',
            minHeight: `${playerHeight}px`,
            opacity: student.eliminated ? 0.7 : 1,
            boxShadow: isChampion 
              ? '0 4px 12px rgba(245, 158, 11, 0.3)' 
              : student.eliminated 
              ? 'none' 
              : '0 2px 8px rgba(34, 197, 94, 0.2)',
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });
    }
    
    // Create edges showing match relationships
    matchData.forEach((match) => {
      const isPlayer1Winner = match.winner === match.player1Name;
      const isTie = match.result === 'tie';
      
      if (!isTie && match.winner) {
        const winnerId = isPlayer1Winner ? match.player1Id : match.player2Id;
        const loserId = isPlayer1Winner ? match.player2Id : match.player1Id;
        
        // Find the winner and loser nodes
        const winnerStudent = studentData.find(s => s.id === winnerId);
        const loserStudent = studentData.find(s => s.id === loserId);
        
        if (winnerStudent && loserStudent) {
          const winnerWins = studentWins[winnerId];
          const loserWins = studentWins[loserId];
          
          // Only create edge if winner has more wins than loser (showing progression)
          if (winnerWins > loserWins) {
            bracketEdges.push({
              id: `match-${match.id}-progression`,
              source: `player-${loserId}`,
              target: `player-${winnerId}`,
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: '#22c55e',
                strokeWidth: 3,
              },
              markerEnd: {
                type: 'arrowclosed' as any,
                color: '#22c55e',
              },
              label: `Beat ${loserStudent.name}`,
            });
          }
        }
      }
    });

    setNodes(bracketNodes as any);
    setEdges(bracketEdges as any);
  }, [setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
            <div className="text-lg font-semibold text-gray-600">Loading elimination tree...</div>
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
    <div className="max-w-full mx-auto">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="text-center mb-5">
          <div className="text-3xl sm:text-4xl mb-2">🏆</div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-1">
            Tournament Bracket
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Interactive bracket showing match progression and results
          </p>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-base font-semibold text-gray-700">
              {students.length} Students • {matches.length} Matches
            </div>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-sm rounded-xl hover:from-red-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-200 flex items-center gap-2"
            >
              🔄 Refresh Bracket
            </button>
          </div>
        </div>
        
        {students.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">👥</div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No students imported yet!</div>
            <div className="text-gray-500 text-sm">Import students first to see the tournament bracket</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No matches recorded yet!</div>
            <div className="text-gray-500 text-sm">Record some matches to see the tournament bracket</div>
          </div>
        ) : (
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
            <div style={{ width: '100%', height: '700px' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={{
                  padding: 0.1,
                  includeHiddenNodes: false,
                }}
                minZoom={0.1}
                maxZoom={1.5}
                defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={true}
              >
                <Controls 
                  position="bottom-right"
                  style={{
                    bottom: 10,
                    right: 10,
                  }}
                />
                <MiniMap 
                  nodeColor={(node) => {
                    if (node.style?.background) {
                      return node.style.background as string;
                    }
                    return '#e5e7eb';
                  }}
                  position="bottom-left"
                  style={{
                    bottom: 10,
                    left: 10,
                    height: 120,
                    width: 160,
                  }}
                />
                <Background 
                  variant={BackgroundVariant.Dots} 
                  gap={20} 
                  size={1} 
                  color="#e5e7eb"
                />
              </ReactFlow>
            </div>
          </div>
        )}
        
        {matches.length > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600 mb-2">
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-green-200 border-2 border-green-500 rounded"></div>
                Active Players
              </span>
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-gray-200 border-2 border-dashed border-gray-400 rounded opacity-70"></div>
                Eliminated Players
              </span>
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-yellow-200 border-2 border-yellow-500 rounded"></div>
                Champion
              </span>
            </div>
            <div className="text-xs text-gray-500">
              🏆 Players organized by wins - arrows show progression from defeated players to winners
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFlowChart;
