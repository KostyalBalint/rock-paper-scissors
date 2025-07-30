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
      generateEliminationTree(allMatches, allStudents);
    } catch (err) {
      setError('Error loading data: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEliminationTree = useCallback((matchData: Match[], studentData: Student[]) => {
    if (studentData.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Sort matches by creation date to understand elimination order
    const sortedMatches = [...matchData].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    // Build elimination structure
    const eliminationRounds: { [round: number]: Student[] } = {};
    const eliminationOrder: { [studentId: string]: number } = {};
    const studentMatchMap: { [studentId: string]: Match[] } = {};
    
    // Initialize student match mapping
    studentData.forEach(student => {
      studentMatchMap[student.id] = matchData.filter(
        match => match.player1Id === student.id || match.player2Id === student.id
      );
    });
    
    let currentRound = 0;
    
    // Process matches in chronological order to determine elimination rounds
    sortedMatches.forEach((match) => {
      const isPlayer1Winner = match.winner === match.player1Name;
      const isTie = match.result === 'tie';
      
      if (!isTie) {
        const loserId = isPlayer1Winner ? match.player2Id : match.player1Id;
        const loser = studentData.find(s => s.id === loserId);
        
        if (loser && !eliminationOrder.hasOwnProperty(loserId)) {
          eliminationOrder[loserId] = currentRound;
          if (!eliminationRounds[currentRound]) {
            eliminationRounds[currentRound] = [];
          }
          eliminationRounds[currentRound].push(loser);
          currentRound++;
        }
      }
    });
    
    // Survivors (students not eliminated)
    const survivors = studentData.filter(s => !eliminationOrder.hasOwnProperty(s.id));
    
    // Create nodes positioned by elimination round
    const studentNodes: Node[] = [];
    const chartWidth = 1200;
    const chartHeight = 700;
    const roundHeight = chartHeight / Math.max(currentRound + 3, 5);
    
    // Position survivors at the top
    survivors.forEach((student, index) => {
      const wins = studentMatchMap[student.id]?.filter(match => match.winner === student.name).length || 0;
      const losses = studentMatchMap[student.id]?.filter(match => match.winner && match.winner !== student.name).length || 0;
      const ties = studentMatchMap[student.id]?.filter(match => match.result === 'tie').length || 0;
      
      studentNodes.push({
        id: student.id,
        type: 'default',
        position: {
          x: (chartWidth / (survivors.length + 1)) * (index + 1) - 60,
          y: roundHeight * 0.5
        },
        data: {
          label: (
            <div className="text-center">
              <div className="font-bold text-sm text-green-800 mb-1">
                {student.name} 👑
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
                SURVIVOR
              </div>
            </div>
          ),
        },
        style: {
          background: '#dcfce7',
          border: '3px solid #16a34a',
          borderRadius: '12px',
          padding: '8px 12px',
          minWidth: '140px',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
    });
    
    // Position eliminated students by round
    Object.entries(eliminationRounds).forEach(([roundStr, roundStudents]) => {
      const round = parseInt(roundStr);
      
      roundStudents.forEach((student, index) => {
        const wins = studentMatchMap[student.id]?.filter(match => match.winner === student.name).length || 0;
        const losses = studentMatchMap[student.id]?.filter(match => match.winner && match.winner !== student.name).length || 0;
        const ties = studentMatchMap[student.id]?.filter(match => match.result === 'tie').length || 0;
        
        // Find the match that eliminated this student
        const eliminatingMatch = sortedMatches.find(match => {
          const isPlayer1Winner = match.winner === match.player1Name;
          const loserId = isPlayer1Winner ? match.player2Id : match.player1Id;
          return loserId === student.id && match.result !== 'tie';
        });
        
        studentNodes.push({
          id: student.id,
          type: 'default',
          position: {
            x: (chartWidth / (roundStudents.length + 1)) * (index + 1) - 60,
            y: roundHeight * (round + 2)
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
                  ROUND {round + 1}
                </div>
                {eliminatingMatch && (
                  <div className="text-xs text-gray-500 mt-1">
                    Lost to: {eliminatingMatch.winner}
                  </div>
                )}
              </div>
            ),
          },
          style: {
            background: '#f3f4f6',
            border: '2px dashed #9ca3af',
            borderRadius: '12px',
            padding: '8px 12px',
            minWidth: '140px',
            opacity: 0.7,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        });
      });
    });
    
    // Create elimination flow edges
    const eliminationEdges: Edge[] = [];
    
    sortedMatches.forEach((match, index) => {
      const isPlayer1Winner = match.winner === match.player1Name;
      const isTie = match.result === 'tie';
      
      if (!isTie) {
        const loserId = isPlayer1Winner ? match.player2Id : match.player1Id;
        const winnerId = isPlayer1Winner ? match.player1Id : match.player2Id;
        
        eliminationEdges.push({
          id: `elimination-${index}`,
          source: loserId,
          target: winnerId,
          type: 'straight',
          animated: true,
          style: {
            stroke: '#dc2626',
            strokeWidth: 3,
            strokeDasharray: '8,4',
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#dc2626',
            width: 20,
            height: 20,
          },
          label: (
            <div className="bg-red-50 border border-red-200 rounded-lg px-2 py-1 text-xs font-bold shadow-sm">
              <div className="flex items-center gap-1">
                <span>{match.player1Choice === 'rock' ? '🪨' : match.player1Choice === 'paper' ? '📄' : '✂️'}</span>
                <span className="text-gray-400">vs</span>
                <span>{match.player2Choice === 'rock' ? '🪨' : match.player2Choice === 'paper' ? '📄' : '✂️'}</span>
              </div>
              <div className="text-center text-red-600 text-xs">
                Eliminated
              </div>
            </div>
          ),
          labelStyle: {
            fill: 'transparent',
          },
          labelBgStyle: {
            fill: 'transparent',
          },
        });
      } else {
        // Show tie matches as neutral connections
        eliminationEdges.push({
          id: `tie-${index}`,
          source: match.player1Id,
          target: match.player2Id,
          type: 'default',
          animated: false,
          style: {
            stroke: '#ca8a04',
            strokeWidth: 2,
            strokeDasharray: '4,4',
          },
          label: (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-2 py-1 text-xs font-semibold shadow-sm">
              <div className="flex items-center gap-1">
                <span>{match.player1Choice === 'rock' ? '🪨' : match.player1Choice === 'paper' ? '📄' : '✂️'}</span>
                <span className="text-gray-400">vs</span>
                <span>{match.player2Choice === 'rock' ? '🪨' : match.player2Choice === 'paper' ? '📄' : '✂️'}</span>
              </div>
              <div className="text-center text-yellow-600 text-xs">
                Tie
              </div>
            </div>
          ),
          labelStyle: {
            fill: 'transparent',
          },
          labelBgStyle: {
            fill: 'transparent',
          },
        });
      }
    });

    setNodes(studentNodes as any);
    setEdges(eliminationEdges as any);
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
            Tournament Elimination Tree
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Visual progression of student eliminations in tournament order
          </p>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-base font-semibold text-gray-700">
              {students.length} Students • {matches.length} Matches
            </div>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold text-sm rounded-xl hover:from-red-600 hover:to-orange-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-200 flex items-center gap-2"
            >
              🔄 Refresh Tree
            </button>
          </div>
        </div>
        
        {students.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">👥</div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No students imported yet!</div>
            <div className="text-gray-500 text-sm">Import students first to see the elimination tree</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No matches recorded yet!</div>
            <div className="text-gray-500 text-sm">Record some matches to see the elimination progression</div>
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
                Survivors (Top)
              </span>
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-gray-200 border-2 border-dashed border-gray-400 rounded opacity-70"></div>
                Eliminated (By Round)
              </span>
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-4 h-0 border-t-2 border-red-600 border-dashed"></div>
                Elimination Flow
              </span>
            </div>
            <div className="text-xs text-gray-500">
              📈 Tree shows elimination progression - survivors at top, eliminated students grouped by elimination round
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFlowChart;