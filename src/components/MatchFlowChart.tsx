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
      generateFlowChart(allMatches, allStudents);
    } catch (err) {
      setError('Error loading data: ' + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const generateFlowChart = useCallback((matchData: Match[], studentData: Student[]) => {
    if (studentData.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Create nodes for each student
    const studentNodes: Node[] = studentData.map((student, index) => {
      // Calculate student's win/loss record
      const studentMatches = matchData.filter(
        match => match.player1Id === student.id || match.player2Id === student.id
      );
      
      const wins = studentMatches.filter(match => match.winner === student.name).length;
      const losses = studentMatches.filter(match => match.winner && match.winner !== student.name).length;
      const ties = studentMatches.filter(match => match.result === 'tie').length;
      
      const isEliminated = student.eliminated;
      
      // Arrange nodes in a circular pattern
      const angle = (index / studentData.length) * 2 * Math.PI;
      const radius = Math.max(200, studentData.length * 30);
      const x = Math.cos(angle) * radius + 400;
      const y = Math.sin(angle) * radius + 300;

      return {
        id: student.id,
        type: 'default',
        position: { x, y },
        data: {
          label: (
            <div className="text-center">
              <div className={`font-bold text-sm mb-1 ${
                isEliminated ? 'text-gray-500 line-through' : 'text-gray-800'
              }`}>
                {student.name}
                {isEliminated && ' ❌'}
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
              {isEliminated && (
                <div className="text-xs text-red-500 font-semibold mt-1">
                  ELIMINATED
                </div>
              )}
            </div>
          ),
        },
        style: {
          background: isEliminated 
            ? '#f3f4f6' 
            : wins > losses 
            ? '#dcfce7' 
            : losses > wins 
            ? '#fef2f2' 
            : '#fef3c7',
          border: isEliminated 
            ? '2px dashed #9ca3af' 
            : wins > losses 
            ? '2px solid #16a34a' 
            : losses > wins 
            ? '2px solid #dc2626' 
            : '2px solid #ca8a04',
          borderRadius: '12px',
          padding: '8px 12px',
          minWidth: '120px',
          opacity: isEliminated ? 0.6 : 1,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });

    // Create edges for each match
    const matchEdges: Edge[] = matchData.map((match, index) => {
      const isPlayer1Winner = match.winner === match.player1Name;
      const isTie = match.result === 'tie';
      
      return {
        id: `match-${index}`,
        source: match.player1Id,
        target: match.player2Id,
        type: 'default',
        animated: true,
        style: {
          stroke: isTie ? '#ca8a04' : isPlayer1Winner ? '#16a34a' : '#dc2626',
          strokeWidth: 3,
        },
        label: (
          <div className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold shadow-sm">
            <div className="flex items-center gap-1">
              <span>{match.player1Choice === 'rock' ? '🪨' : match.player1Choice === 'paper' ? '📄' : '✂️'}</span>
              <span className="text-gray-400">vs</span>
              <span>{match.player2Choice === 'rock' ? '🪨' : match.player2Choice === 'paper' ? '📄' : '✂️'}</span>
            </div>
            <div className={`text-center ${isTie ? 'text-yellow-600' : isPlayer1Winner ? 'text-green-600' : 'text-red-600'}`}>
              {isTie ? 'Tie' : match.winner}
            </div>
          </div>
        ),
        labelStyle: {
          fill: 'transparent',
        },
        labelBgStyle: {
          fill: 'transparent',
        },
      };
    });

    setNodes(studentNodes as any);
    setEdges(matchEdges as any);
  }, [setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-xl p-6">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
            <div className="text-lg font-semibold text-gray-600">Loading match graph...</div>
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
          <div className="text-3xl sm:text-4xl mb-2">📊</div>
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">
            Match Flow Chart
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Visual network of all student matches and outcomes
          </p>
          
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-base font-semibold text-gray-700">
              {students.length} Students • {matches.length} Matches
            </div>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-blue-200 flex items-center gap-2"
            >
              🔄 Refresh Graph
            </button>
          </div>
        </div>
        
        {students.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">👥</div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No students imported yet!</div>
            <div className="text-gray-500 text-sm">Import students first to see the match graph</div>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🎯</div>
            <div className="text-lg font-semibold text-gray-600 mb-1">No matches recorded yet!</div>
            <div className="text-gray-500 text-sm">Record some matches to see the connections</div>
          </div>
        ) : (
          <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
            <div style={{ width: '100%', height: '600px' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                fitViewOptions={{
                  padding: 0.2,
                  includeHiddenNodes: false,
                }}
                minZoom={0.1}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
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
            <div className="text-sm text-gray-600">
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-green-200 border border-green-500 rounded"></div>
                More Wins
              </span>
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-red-200 border border-red-500 rounded"></div>
                More Losses
              </span>
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-yellow-200 border border-yellow-500 rounded"></div>
                Equal Record
              </span>
              <span className="inline-flex items-center gap-1 mx-2">
                <div className="w-3 h-3 bg-gray-200 border-2 border-dashed border-gray-400 rounded opacity-60"></div>
                Eliminated
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchFlowChart;
