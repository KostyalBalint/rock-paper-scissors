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

    // Sort matches by creation date to understand match order
    const sortedMatches = [...matchData].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Build student match mapping
    const studentMatchMap: { [studentId: string]: Match[] } = {};
    studentData.forEach(student => {
      studentMatchMap[student.id] = matchData.filter(
        match => match.player1Id === student.id || match.player2Id === student.id
      );
    });
    
    const bracketNodes: Node[] = [];
    const bracketEdges: Edge[] = [];
    
    // Create match nodes positioned in bracket format
    const chartWidth = 1200;
    const chartHeight = 700;
    const matchHeight = 80;
    const roundSpacing = 250;
    
    // Calculate total rounds needed (estimate based on matches)
    const totalMatches = sortedMatches.length;
    const roundsEstimate = Math.ceil(Math.log2(studentData.length));
    
    sortedMatches.forEach((match, index) => {
      const isPlayer1Winner = match.winner === match.player1Name;
      const isTie = match.result === 'tie';
      
      // Position matches in chronological order, creating a flowing bracket
      const roundIndex = Math.floor(index / Math.max(1, Math.ceil(totalMatches / roundsEstimate)));
      const positionInRound = index % Math.max(1, Math.ceil(totalMatches / roundsEstimate));
      const matchesInRound = Math.ceil(totalMatches / roundsEstimate);
      
      const x = 100 + (roundIndex * roundSpacing);
      const y = 100 + (positionInRound * (matchHeight + 40)) + ((chartHeight - (matchesInRound * (matchHeight + 40))) / 2);
      
      // Create match node
      bracketNodes.push({
        id: `match-${match.id}`,
        type: 'default',
        position: { x, y },
        data: {
          label: (
            <div className="text-center bg-white border-2 border-gray-300 rounded-lg p-3 shadow-lg">
              <div className="text-xs font-bold text-gray-700 mb-2">
                Match {index + 1}
              </div>
              <div className="space-y-1">
                <div className={`text-sm font-semibold flex items-center justify-between px-2 py-1 rounded ${
                  isPlayer1Winner ? 'bg-green-100 text-green-800' : isTie ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  <span>{match.player1Name}</span>
                  {match.player1Choice && <span>{match.player1Choice === 'rock' ? '🪨' : match.player1Choice === 'paper' ? '📄' : '✂️'}</span>}
                  {isPlayer1Winner && !isTie && <span className="ml-1">👑</span>}
                </div>
                <div className="text-xs text-gray-500 font-bold">VS</div>
                <div className={`text-sm font-semibold flex items-center justify-between px-2 py-1 rounded ${
                  !isPlayer1Winner && !isTie ? 'bg-green-100 text-green-800' : isTie ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  <span>{match.player2Name}</span>
                  {match.player2Choice && <span>{match.player2Choice === 'rock' ? '🪨' : match.player2Choice === 'paper' ? '📄' : '✂️'}</span>}
                  {!isPlayer1Winner && !isTie && <span className="ml-1">👑</span>}
                </div>
              </div>
              {isTie && (
                <div className="text-xs font-bold text-yellow-600 mt-1">
                  TIE GAME
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: 'transparent',
          border: 'none',
          padding: 0,
          minWidth: '180px',
          minHeight: `${matchHeight}px`,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });
    
    // Create player nodes for eliminated and active students
    const eliminatedStudents = studentData.filter(s => s.eliminated);
    const activeStudents = studentData.filter(s => !s.eliminated);
    
    // Position eliminated students on the left side
    eliminatedStudents.forEach((student, index) => {
      const wins = studentMatchMap[student.id]?.filter(match => match.winner === student.name).length || 0;
      const losses = studentMatchMap[student.id]?.filter(match => match.winner && match.winner !== student.name).length || 0;
      const ties = studentMatchMap[student.id]?.filter(match => match.result === 'tie').length || 0;
      
      bracketNodes.push({
        id: `eliminated-${student.id}`,
        type: 'default',
        position: {
          x: 20,
          y: 50 + (index * 100)
        },
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-sm text-gray-500 line-through mb-1">
                {student.name} ❌
              </div>
              <div className="text-xs text-gray-600">
                <span className="text-green-600">W: {wins}</span>
                {' • '}
                <span className="text-red-600">L: {losses}</span>
                {ties > 0 && (
                  <>
                    {' • '}
                    <span className="text-yellow-600">T: {ties}</span>
                  </>
                )}
              </div>
              <div className="text-xs text-red-600 font-semibold mt-1">
                ELIMINATED
              </div>
            </div>
          ),
        },
        style: {
          background: '#f3f4f6',
          border: '2px dashed #9ca3af',
          borderRadius: '12px',
          padding: '8px 12px',
          minWidth: '120px',
          opacity: 0.7,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });
    });
    
    // Position active/winner students on the right side
    activeStudents.forEach((student, index) => {
      const wins = studentMatchMap[student.id]?.filter(match => match.winner === student.name).length || 0;
      const losses = studentMatchMap[student.id]?.filter(match => match.winner && match.winner !== student.name).length || 0;
      const ties = studentMatchMap[student.id]?.filter(match => match.result === 'tie').length || 0;
      
      bracketNodes.push({
        id: `active-${student.id}`,
        type: 'default',
        position: {
          x: chartWidth - 150,
          y: 150 + (index * 120)
        },
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-sm text-green-800 mb-1">
                {student.name} {activeStudents.length === 1 ? '👑' : '🔥'}
              </div>
              <div className="text-xs text-gray-600">
                <span className="text-green-600">W: {wins}</span>
                {' • '}
                <span className="text-red-600">L: {losses}</span>
                {ties > 0 && (
                  <>
                    {' • '}
                    <span className="text-yellow-600">T: {ties}</span>
                  </>
                )}
              </div>
              <div className="text-xs text-green-600 font-semibold mt-1">
                {activeStudents.length === 1 ? 'CHAMPION' : 'ACTIVE'}
              </div>
            </div>
          ),
        },
        style: {
          background: activeStudents.length === 1 ? '#fef3c7' : '#dcfce7',
          border: activeStudents.length === 1 ? '3px solid #f59e0b' : '3px solid #16a34a',
          borderRadius: '12px',
          padding: '8px 12px',
          minWidth: '130px',
          boxShadow: activeStudents.length === 1 ? '0 4px 12px rgba(245, 158, 11, 0.3)' : '0 4px 12px rgba(34, 197, 94, 0.3)'
        },
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
      });
    });
    
    // Create connecting edges showing the bracket flow
    sortedMatches.forEach((match) => {
      const isPlayer1Winner = match.winner === match.player1Name;
      const isTie = match.result === 'tie';
      
      if (!isTie) {
        const winnerId = isPlayer1Winner ? match.player1Id : match.player2Id;
        const loserId = isPlayer1Winner ? match.player2Id : match.player1Id;
        
        // Connect eliminated player to match
        bracketEdges.push({
          id: `to-match-${match.id}-${loserId}`,
          source: `eliminated-${loserId}`,
          target: `match-${match.id}`,
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#ef4444',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
        });
        
        // Connect match to winner (if winner is still active)
        const winnerNode = studentData.find(s => s.id === winnerId);
        if (winnerNode && !winnerNode.eliminated) {
          bracketEdges.push({
            id: `from-match-${match.id}-${winnerId}`,
            source: `match-${match.id}`,
            target: `active-${winnerId}`,
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
          });
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
                Active Players (Right)
              </span>
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-gray-200 border-2 border-dashed border-gray-400 rounded opacity-70"></div>
                Eliminated Players (Left)
              </span>
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-white border-2 border-gray-300 rounded"></div>
                Match Results (Center)
              </span>
            </div>
            <div className="text-xs text-gray-500">
              🏆 Bracket shows match flow - eliminated players on left, matches in center, active players on right
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFlowChart;
