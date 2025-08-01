import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  query, 
  orderBy, 
  where,
  and,
  or,
  onSnapshot,
  Timestamp,
  QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {Student, Match, GameChoice, GameResult, MatchResult} from '../types';

export const studentsCollection = collection(db, 'students');
export const matchesCollection = collection(db, 'matches');

export const addStudent = async (name: string): Promise<string> => {
  const docRef = await addDoc(studentsCollection, {
    name,
    createdAt: Timestamp.now(),
    eliminated: false
  });
  return docRef.id;
};

export const addMultipleStudents = async (names: string[]): Promise<void> => {
  const promises = names.map(name => addStudent(name.trim()));
  await Promise.all(promises);
};

export const getStudents = async (): Promise<Student[]> => {
  const q = query(studentsCollection, orderBy('name'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    name: doc.data().name,
    createdAt: doc.data().createdAt.toDate(),
    eliminated: doc.data().eliminated || false,
    eliminatedAt: doc.data().eliminatedAt ? doc.data().eliminatedAt.toDate() : undefined
  }));
};

export const searchStudents = async (searchTerm: string): Promise<Student[]> => {
  const students = await getStudents();
  return students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const getActiveStudents = async (): Promise<Student[]> => {
  const students = await getStudents();
  return students.filter(student => !student.eliminated);
};

export const searchActiveStudents = async (searchTerm: string): Promise<Student[]> => {
  const activeStudents = await getActiveStudents();
  return activeStudents.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

export const eliminateStudent = async (studentId: string): Promise<void> => {
  const studentDoc = doc(studentsCollection, studentId);
  await updateDoc(studentDoc, {
    eliminated: true,
    eliminatedAt: Timestamp.now()
  });
};

export const reactivateStudent = async (studentId: string): Promise<void> => {
  const studentDoc = doc(studentsCollection, studentId);
  await updateDoc(studentDoc, {
    eliminated: false,
    eliminatedAt: null
  });
};

export const getTournamentWinner = async (): Promise<Student | null> => {
  const activeStudents = await getActiveStudents();
  return activeStudents.length === 1 ? activeStudents[0] : null;
};

export const getTournamentStatus = async (): Promise<{
  totalStudents: number;
  activeStudents: number;
  eliminatedStudents: number;
  winner: Student | null;
  isComplete: boolean;
}> => {
  const allStudents = await getStudents();
  const activeStudents = allStudents.filter(s => !s.eliminated);
  const eliminatedStudents = allStudents.filter(s => s.eliminated);
  const winner = activeStudents.length === 1 ? activeStudents[0] : null;
  
  return {
    totalStudents: allStudents.length,
    activeStudents: activeStudents.length,
    eliminatedStudents: eliminatedStudents.length,
    winner,
    isComplete: activeStudents.length <= 1 && allStudents.length > 1
  };
};

const determineGameResult = (player1Choice: GameChoice, player2Choice: GameChoice): { result: GameResult; winner?: string } => {
  if (player1Choice === player2Choice) {
    return { result: 'tie' };
  }
  
  const winConditions = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
  };
  
  if (winConditions[player1Choice] === player2Choice) {
    return { result: 'win', winner: 'player1' };
  } else {
    return { result: 'win', winner: 'player2' };
  }
};

export const checkExistingMatch = async (player1Id: string, player2Id: string): Promise<boolean> => {
  // Check if these two players have already played against each other
  const q = query(
    matchesCollection,
    or(
      and(where('player1Id', '==', player1Id), where('player2Id', '==', player2Id)),
      and(where('player1Id', '==', player2Id), where('player2Id', '==', player1Id))
    )
  );
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

export const addMatch = async (
  player1Id: string,
  player1Name: string,
  player1Choice: GameChoice,
  player2Id: string,
  player2Name: string,
  player2Choice: GameChoice
): Promise<string> => {
  // Check if these players have already played against each other
  const existingMatch = await checkExistingMatch(player1Id, player2Id);
  if (existingMatch) {
    throw new Error(`${player1Name} and ${player2Name} have already played against each other.`);
  }
  
  // Check if either player is already eliminated
  const students = await getStudents();
  const player1 = students.find(s => s.id === player1Id);
  const player2 = students.find(s => s.id === player2Id);
  
  if (player1?.eliminated) {
    throw new Error(`${player1Name} has already been eliminated from the tournament.`);
  }
  if (player2?.eliminated) {
    throw new Error(`${player2Name} has already been eliminated from the tournament.`);
  }
  
  const gameResult = determineGameResult(player1Choice, player2Choice);
  
  const docRef = await addDoc(matchesCollection, {
    player1Id,
    player1Name,
    player1Choice,
    player2Id,
    player2Name,
    player2Choice,
    result: gameResult.result,
    winner: gameResult.winner === 'player1' ? player1Name : gameResult.winner === 'player2' ? player2Name : undefined,
    createdAt: Timestamp.now()
  });
  
  // Eliminate the loser (but not in case of a tie)
  if (gameResult.result !== 'tie') {
    if (gameResult.winner === 'player1') {
      await eliminateStudent(player2Id);
    } else {
      await eliminateStudent(player1Id);
    }
  }
  
  return docRef.id;
};

export const addMatchWithWinner = async (
  player1Id: string,
  player1Name: string,
  player2Id: string,
  player2Name: string,
  matchResult: MatchResult
): Promise<string> => {
  // Check if these players have already played against each other
  const existingMatch = await checkExistingMatch(player1Id, player2Id);
  if (existingMatch) {
    throw new Error(`${player1Name} and ${player2Name} have already played against each other.`);
  }
  
  // Check if either player is already eliminated
  const students = await getStudents();
  const player1 = students.find(s => s.id === player1Id);
  const player2 = students.find(s => s.id === player2Id);
  
  if (player1?.eliminated) {
    throw new Error(`${player1Name} has already been eliminated from the tournament.`);
  }
  if (player2?.eliminated) {
    throw new Error(`${player2Name} has already been eliminated from the tournament.`);
  }
  
  // Determine winner and result based on matchResult
  const result: GameResult = 'win';
  const winner = matchResult === 'player1' ? player1Name : player2Name;
  
  const docRef = await addDoc(matchesCollection, {
    player1Id,
    player1Name,
    player2Id,
    player2Name,
    result,
    matchResult,
    winner,
    createdAt: Timestamp.now()
  });
  
  // Eliminate the loser
  if (matchResult === 'player1') {
    await eliminateStudent(player2Id);
  } else {
    await eliminateStudent(player1Id);
  }
  
  return docRef.id;
};

export const deleteMatch = async (matchId: string): Promise<void> => {
  // First get the match details to find who was eliminated
  const matchDoc = doc(matchesCollection, matchId);
  const matchSnapshot = await getDoc(matchDoc);
  
  if (matchSnapshot.exists()) {
    const matchData = matchSnapshot.data() as Match;
    
    // Determine who was eliminated (the loser)
    let eliminatedPlayerId: string | undefined;
    
    if (matchData.result !== 'tie' && matchData.winner) {
      // For new format matches or old format matches with winner
      if (matchData.matchResult) {
        // New format: use matchResult field
        eliminatedPlayerId = matchData.matchResult === 'player1' ? matchData.player2Id : matchData.player1Id;
      } else {
        // Old format: use winner field
        eliminatedPlayerId = matchData.winner === matchData.player1Name ? matchData.player2Id : matchData.player1Id;
      }
      
      // Reactivate the eliminated player
      if (eliminatedPlayerId) {
        await reactivateStudent(eliminatedPlayerId);
      }
    }
  }
  
  // Delete the match
  await deleteDoc(matchDoc);
};

export const getMatches = async (): Promise<Match[]> => {
  const q = query(matchesCollection, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    player1Id: doc.data().player1Id,
    player1Name: doc.data().player1Name,
    player1Choice: doc.data().player1Choice,
    player2Id: doc.data().player2Id,
    player2Name: doc.data().player2Name,
    player2Choice: doc.data().player2Choice,
    result: doc.data().result,
    winner: doc.data().winner,
    createdAt: doc.data().createdAt.toDate()
  }));
};

export const getStudentMatches = async (studentId: string): Promise<Match[]> => {
  const q1 = query(matchesCollection, where('player1Id', '==', studentId), orderBy('createdAt', 'desc'));
  const q2 = query(matchesCollection, where('player2Id', '==', studentId), orderBy('createdAt', 'desc'));
  
  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  const matches1 = snapshot1.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    player1Id: doc.data().player1Id,
    player1Name: doc.data().player1Name,
    player1Choice: doc.data().player1Choice,
    player2Id: doc.data().player2Id,
    player2Name: doc.data().player2Name,
    player2Choice: doc.data().player2Choice,
    result: doc.data().result,
    winner: doc.data().winner,
    createdAt: doc.data().createdAt.toDate()
  }));
  
  const matches2 = snapshot2.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    player1Id: doc.data().player1Id,
    player1Name: doc.data().player1Name,
    player1Choice: doc.data().player1Choice,
    player2Id: doc.data().player2Id,
    player2Name: doc.data().player2Name,
    player2Choice: doc.data().player2Choice,
    result: doc.data().result,
    winner: doc.data().winner,
    createdAt: doc.data().createdAt.toDate()
  }));
  
  return [...matches1, ...matches2].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

export const getStudentMatchCount = async (studentId: string): Promise<number> => {
  const q1 = query(matchesCollection, where('player1Id', '==', studentId));
  const q2 = query(matchesCollection, where('player2Id', '==', studentId));
  
  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
  
  return snapshot1.docs.length + snapshot2.docs.length;
};

export const getStudentsWithMatchCounts = async (): Promise<(Student & { matchCount: number })[]> => {
  const students = await getActiveStudents();
  const studentsWithCounts = await Promise.all(
    students.map(async (student) => ({
      ...student,
      matchCount: await getStudentMatchCount(student.id)
    }))
  );
  return studentsWithCounts;
};

export const subscribeToStudentsWithMatchCounts = (
  callback: (students: (Student & { matchCount: number })[]) => void
) => {
  // Listen to students collection changes
  const studentsUnsubscribe = onSnapshot(
    query(studentsCollection, orderBy('name')),
    async () => {
      try {
        const studentsWithCounts = await getStudentsWithMatchCounts();
        callback(studentsWithCounts);
      } catch (error) {
        console.error('Error in students subscription:', error);
      }
    }
  );

  // Listen to matches collection changes
  const matchesUnsubscribe = onSnapshot(
    query(matchesCollection, orderBy('createdAt', 'desc')),
    async () => {
      try {
        const studentsWithCounts = await getStudentsWithMatchCounts();
        callback(studentsWithCounts);
      } catch (error) {
        console.error('Error in matches subscription:', error);
      }
    }
  );

  // Return combined unsubscribe function
  return () => {
    studentsUnsubscribe();
    matchesUnsubscribe();
  };
};
