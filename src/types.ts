export interface Student {
  id: string;
  name: string;
  createdAt: Date;
  eliminated: boolean;
  eliminatedAt?: Date;
}

export type GameChoice = 'rock' | 'paper' | 'scissors';
export type GameResult = 'win' | 'lose' | 'tie';

export interface Match {
  id: string;
  player1Id: string;
  player1Name: string;
  player1Choice: GameChoice;
  player2Id: string;
  player2Name: string;
  player2Choice: GameChoice;
  result: GameResult;
  winner?: string;
  createdAt: Date;
}