import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  doc,
  query, 
  orderBy, 
  where,
  and,
  or,
  Timestamp,
  QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {Student, Match, GameChoice, GameResult} from '../types';

export const studentsCollection = collection(db, 'students');
export const matchesCollection = collection(db, 'matches');

export const addStudent = async (name: string): Promise<string> => {
  const docRef = await addDoc(studentsCollection, {
    name,
    createdAt: Timestamp.now()
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
    createdAt: doc.data().createdAt.toDate()
  }));
};

export const searchStudents = async (searchTerm: string): Promise<Student[]> => {
  const students = await getStudents();
  return students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
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
  
  return docRef.id;
};

export const deleteMatch = async (matchId: string): Promise<void> => {
  const matchDoc = doc(matchesCollection, matchId);
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
