export interface Student {
  id: string;
  name: string;
  createdAt: Date;
  eliminated: boolean;
  eliminatedAt?: Date;
}

export type GameChoice = 'rock' | 'paper' | 'scissors';
export type GameResult = 'win' | 'lose' | 'tie';
export type MatchResult = 'player1' | 'player2';

export interface Match {
  id: string;
  player1Id: string;
  player1Name: string;
  player1Choice?: GameChoice; // Optional for backward compatibility
  player2Id: string;
  player2Name: string;
  player2Choice?: GameChoice; // Optional for backward compatibility
  result: GameResult;
  matchResult?: MatchResult; // New field for direct winner selection
  winner?: string;
  createdAt: Date;
}