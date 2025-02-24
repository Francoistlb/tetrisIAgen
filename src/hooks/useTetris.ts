import { useState, useCallback, useEffect } from 'react';
import { TetrominoType, GameState, Position } from '../types/tetris';
import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINO_SHAPES, TICK_SPEED_MS } from '../constants/tetrominos';
import { getRotatedShape } from '../utils/tetris';
import { findFullLine, findEmptyLine } from '../utils/boardUtils';

const createEmptyBoard = () => 
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));

const getRandomTetromino = (): TetrominoType => {
  const pieces: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  return pieces[Math.floor(Math.random() * pieces.length)];
};

const getEasyPiece = (): TetrominoType => {
  return Math.random() < 0.5 ? 'O' : 'I';
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

export const useTetris = () => {
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

  const giveEasyPiece = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      nextPiece: getEasyPiece()
    }));
  }, []);

  const exchangeLine = useCallback((fullLineIndex: number) => {
    window.dispatchEvent(new CustomEvent('exchangeLines', {
      detail: { from: 'human', lineIndex: fullLineIndex }
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

    if (completedLines === 4) {
      const fullLineIndex = findFullLine(newBoard);
      if (fullLineIndex !== -1) {
        exchangeLine(fullLineIndex);
      }
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

  const moveDown = useCallback(() => {
    if (!gameState.currentPiece || gameState.gameOver || gameState.isPaused) return;

    const newPosition = {
      ...gameState.currentPiece.position,
      y: gameState.currentPiece.position.y + 1,
    };

    if (!checkCollision(gameState.board, gameState.currentPiece.type, newPosition, gameState.currentPiece.rotation)) {
      setGameState(prev => ({
        ...prev,
        currentPiece: {
          ...prev.currentPiece!,
          position: newPosition,
        },
      }));
    } else {
      lockPiece();
    }
  }, [gameState, lockPiece]);

  const moveHorizontal = useCallback((direction: -1 | 1) => {
    if (!gameState.currentPiece || gameState.gameOver || gameState.isPaused) return;

    const newPosition = {
      ...gameState.currentPiece.position,
      x: gameState.currentPiece.position.x + direction,
    };

    if (!checkCollision(gameState.board, gameState.currentPiece.type, newPosition, gameState.currentPiece.rotation)) {
      setGameState(prev => ({
        ...prev,
        currentPiece: {
          ...prev.currentPiece!,
          position: newPosition,
        },
      }));
    }
  }, [gameState]);

  const rotate = useCallback(() => {
    if (!gameState.currentPiece || gameState.gameOver || gameState.isPaused) return;

    const newRotation = (gameState.currentPiece.rotation + 90) % 360;

    if (!checkCollision(
      gameState.board,
      gameState.currentPiece.type,
      gameState.currentPiece.position,
      newRotation
    )) {
      setGameState(prev => ({
        ...prev,
        currentPiece: {
          ...prev.currentPiece!,
          rotation: newRotation,
        },
      }));
      return;
    }

    const kicks = [-1, 1, -2, 2];
    for (const kick of kicks) {
      const kickedPosition = {
        ...gameState.currentPiece.position,
        x: gameState.currentPiece.position.x + kick,
      };

      if (!checkCollision(
        gameState.board,
        gameState.currentPiece.type,
        kickedPosition,
        newRotation
      )) {
        setGameState(prev => ({
          ...prev,
          currentPiece: {
            ...prev.currentPiece!,
            position: kickedPosition,
            rotation: newRotation,
          },
        }));
        return;
      }
    }
  }, [gameState]);

  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

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

  const setPaused = useCallback((value: boolean) => {
    setGameState(prev => ({
      ...prev,
      isPaused: value
    }));
  }, []);

  useEffect(() => {
    if (!gameState.currentPiece && !gameState.gameOver) {
      spawnPiece();
    }
  }, [gameState.currentPiece, gameState.gameOver, spawnPiece]);

  useEffect(() => {
    const handleSpeedChange = (event: CustomEvent) => {
      setSpeedMultiplier(event.detail.isSlowdown ? 1.25 : 1);
    };

    window.addEventListener('speedChange', handleSpeedChange as EventListener);
    return () => window.removeEventListener('speedChange', handleSpeedChange as EventListener);
  }, []);

  useEffect(() => {
    if (gameState.gameOver || gameState.isPaused) return;

    const interval = setInterval(() => {
      moveDown();
    }, TICK_SPEED_MS * speedMultiplier / gameState.level);

    return () => clearInterval(interval);
  }, [gameState.gameOver, gameState.isPaused, gameState.level, moveDown, speedMultiplier]);

  useEffect(() => {
    const handleExchange = (event: CustomEvent) => {
      if (event.detail.from === 'ai') {
        setGameState(prev => {
          const newBoard = [...prev.board.map(row => [...row])];
          const emptyLineIndex = findEmptyLine(newBoard);
          if (emptyLineIndex !== -1) {
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
    moveDown,
    moveHorizontal,
    rotate,
    togglePause,
    resetGame,
    setPaused,
    giveEasyPiece,
  };
};

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