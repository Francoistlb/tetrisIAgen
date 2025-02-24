import { useState, useCallback, useEffect } from 'react';
import { TetrominoType, GameState, Position } from '../types/tetris';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINO_SHAPES, TICK_SPEED_MS } from '../constants/tetrominos';
import { getRotatedShape } from '../utils/tetris';
import { findFullLine, findEmptyLine } from '../utils/boardUtils';

// Réutilisation des fonctions utilitaires
const createEmptyBoard = () => 
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));

const getRandomTetromino = (): TetrominoType => {
  const pieces: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  return pieces[Math.floor(Math.random() * pieces.length)];
};

const checkCollision = (
  board: (number | TetrominoType)[][],
  piece: TetrominoType,
  position: Position,
  rotation: number
): boolean => {
  const shape = getRotatedShape(piece, rotation);
  
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardX = position.x + x;
        const boardY = position.y + y;

        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY >= BOARD_HEIGHT ||
          (boardY >= 0 && board[boardY][boardX] !== 0)
        ) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// Fonction pour évaluer la meilleure position pour une pièce
const evaluatePosition = (board: (number | TetrominoType)[][], piece: TetrominoType, position: Position, rotation: number): number => {
  let score = 0;
  const shape = getRotatedShape(piece, rotation);
  
  // Préférer les positions plus basses
  score += position.y * 2;
  
  // Vérifier les trous créés
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardY = position.y + y;
        const boardX = position.x + x;
        
        // Pénaliser les trous
        if (boardY < BOARD_HEIGHT - 1 && board[boardY + 1][boardX] === 0) {
          score -= 4;
        }
        
        // Bonus pour les pièces connectées
        if (boardX > 0 && board[boardY][boardX - 1] !== 0) score += 1;
        if (boardX < BOARD_WIDTH - 1 && board[boardY][boardX + 1] !== 0) score += 1;
      }
    }
  }
  
  return score;
};

export const useAITetris = () => {
  const [gameState, setGameState] = useState<GameState>({
    board: createEmptyBoard(),
    currentPiece: null,
    nextPiece: getRandomTetromino(),
    score: 0,
    level: 1,
    gameOver: false,
    isPaused: false,
  });

  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const calculateScore = (completedLines: number) => {
    switch (completedLines) {
      case 1:
        return 50;
      case 2:
        return 100;
      case 3:
        return 200;
      case 4:
        return 300;
      default:
        return 0;
    }
  };

  const exchangeLine = useCallback((fullLineIndex: number) => {
    window.dispatchEvent(new CustomEvent('exchangeLines', {
      detail: { from: 'ai', lineIndex: fullLineIndex }
    }));
  }, []);

  const lockPiece = useCallback(() => {
    if (!gameState.currentPiece) return;

    const newBoard = [...gameState.board.map(row => [...row])];
    const shape = getRotatedShape(gameState.currentPiece.type, gameState.currentPiece.rotation);
    
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardY = gameState.currentPiece!.position.y + y;
          const boardX = gameState.currentPiece!.position.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = gameState.currentPiece!.type;
          }
        }
      });
    });

    let completedLines = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        completedLines++;
      }
    }

    // Gérer l'échange de lignes après un Tetris
    if (completedLines === 4) {
      const fullLineIndex = findFullLine(newBoard);
      if (fullLineIndex !== -1) {
        exchangeLine(fullLineIndex);
      }
    }

    if (completedLines === 2) {
      window.dispatchEvent(new CustomEvent('giftPiece', {
        detail: { from: 'ai' }
      }));
    }

    const points = calculateScore(completedLines) * gameState.level;

    setGameState(prev => ({
      ...prev,
      board: newBoard,
      currentPiece: null,
      score: prev.score + points,
      level: Math.floor(prev.score / 1000) + 1,
    }));
  }, [gameState, exchangeLine]);

  const findBestMove = useCallback(() => {
    if (!gameState.currentPiece) return null;

    let bestScore = -Infinity;
    let bestPosition = { x: 0, y: 0 };
    let bestRotation = 0;

    // Essayer toutes les rotations possibles
    for (let rotation = 0; rotation < 360; rotation += 90) {
      // Essayer toutes les positions horizontales possibles
      for (let x = -2; x < BOARD_WIDTH + 2; x++) {
        let y = 0;
        // Descendre la pièce jusqu'à ce qu'elle touche quelque chose
        while (!checkCollision(gameState.board, gameState.currentPiece.type, { x, y: y + 1 }, rotation)) {
          y++;
        }

        const score = evaluatePosition(gameState.board, gameState.currentPiece.type, { x, y }, rotation);
        if (score > bestScore) {
          bestScore = score;
          bestPosition = { x, y };
          bestRotation = rotation;
        }
      }
    }

    return { position: bestPosition, rotation: bestRotation };
  }, [gameState]);

  const spawnPiece = useCallback(() => {
    const type = gameState.nextPiece;
    const position: Position = { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 };
    
    if (checkCollision(gameState.board, type, position, 0)) {
      setGameState(prev => ({ ...prev, gameOver: true }));
      return;
    }

    setGameState(prev => ({
      ...prev,
      currentPiece: { type, position, rotation: 0 },
      nextPiece: getRandomTetromino(),
    }));
  }, [gameState.nextPiece, gameState.board]);

  const resetGame = useCallback(() => {
    setGameState({
      board: createEmptyBoard(),
      currentPiece: null,
      nextPiece: getRandomTetromino(),
      score: 0,
      level: 1,
      gameOver: false,
      isPaused: false,
    });
  }, []);

  // Écouter les changements de vitesse
  useEffect(() => {
    const handleSpeedChange = (event: CustomEvent) => {
      setSpeedMultiplier(event.detail.isSlowdown ? 1.25 : 1);
    };

    window.addEventListener('speedChange', handleSpeedChange as EventListener);
    return () => window.removeEventListener('speedChange', handleSpeedChange as EventListener);
  }, []);

  // Modifier l'intervalle de mouvement de l'IA
  useEffect(() => {
    if (!gameState.currentPiece && !gameState.gameOver) {
      spawnPiece();
      return;
    }

    if (gameState.gameOver || gameState.isPaused || !gameState.currentPiece) return;

    const moveTowardsBestPosition = () => {
      const bestMove = findBestMove();
      if (!bestMove || !gameState.currentPiece) return;

      // Mettre à jour la rotation si nécessaire
      if (gameState.currentPiece.rotation !== bestMove.rotation) {
        setGameState(prev => ({
          ...prev,
          currentPiece: {
            ...prev.currentPiece!,
            rotation: bestMove.rotation,
          }
        }));
        return;
      }

      // Déplacer horizontalement vers la meilleure position
      if (gameState.currentPiece.position.x < bestMove.position.x) {
        setGameState(prev => ({
          ...prev,
          currentPiece: {
            ...prev.currentPiece!,
            position: {
              ...prev.currentPiece!.position,
              x: prev.currentPiece!.position.x + 1,
            }
          }
        }));
        return;
      } else if (gameState.currentPiece.position.x > bestMove.position.x) {
        setGameState(prev => ({
          ...prev,
          currentPiece: {
            ...prev.currentPiece!,
            position: {
              ...prev.currentPiece!.position,
              x: prev.currentPiece!.position.x - 1,
            }
          }
        }));
        return;
      }

      // Si on est à la bonne position horizontale, descendre rapidement
      setGameState(prev => ({
        ...prev,
        currentPiece: {
          ...prev.currentPiece!,
          position: {
            ...prev.currentPiece!.position,
            y: prev.currentPiece!.position.y + 1,
          }
        }
      }));

      // Vérifier si on doit verrouiller la pièce
      const nextPosition = {
        x: gameState.currentPiece.position.x,
        y: gameState.currentPiece.position.y + 1,
      };

      if (checkCollision(gameState.board, gameState.currentPiece.type, nextPosition, gameState.currentPiece.rotation)) {
        lockPiece();
      }
    };

    const interval = setInterval(moveTowardsBestPosition, 
      TICK_SPEED_MS * speedMultiplier / (gameState.level * 2));

    return () => clearInterval(interval);
  }, [gameState, spawnPiece, findBestMove, lockPiece, speedMultiplier]);

  const setPaused = useCallback((value: boolean) => {
    setGameState(prev => ({
      ...prev,
      isPaused: value
    }));
  }, []);

  // Ajouter la même logique pour les pièces faciles
  const giveEasyPiece = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      nextPiece: Math.random() < 0.5 ? 'O' : 'I'
    }));
  }, []);

  // Ajouter un effet pour écouter les événements de cadeau
  useEffect(() => {
    const handleGiftPiece = (event: CustomEvent) => {
      if (event.detail.from === 'human') {
        giveEasyPiece();
      }
    };

    window.addEventListener('giftPiece', handleGiftPiece as EventListener);
    return () => window.removeEventListener('giftPiece', handleGiftPiece as EventListener);
  }, [giveEasyPiece]);

  // Ajouter un effet pour écouter les échanges de lignes
  useEffect(() => {
    const handleExchange = (event: CustomEvent) => {
      if (event.detail.from === 'human') {
        setGameState(prev => {
          const newBoard = [...prev.board.map(row => [...row])];
          const emptyLineIndex = findEmptyLine(newBoard);
          if (emptyLineIndex !== -1) {
            // Échanger les lignes
            const tempLine = [...newBoard[emptyLineIndex]];
            newBoard[emptyLineIndex] = [...newBoard[event.detail.lineIndex]];
            newBoard[event.detail.lineIndex] = tempLine;
          }
          return { ...prev, board: newBoard };
        });
      }
    };

    window.addEventListener('exchangeLines', handleExchange as EventListener);
    return () => window.removeEventListener('exchangeLines', handleExchange as EventListener);
  }, []);

  return {
    gameState,
    resetGame,
    setPaused,
  };
}; 