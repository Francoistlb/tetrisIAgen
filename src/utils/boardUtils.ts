import { TetrominoType } from '../types/tetris';
import { BOARD_HEIGHT } from '../constants/tetrominos';

export const findFullLine = (board: (number | TetrominoType)[][]): number => {
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      return y;
    }
  }
  return -1;
};

export const findEmptyLine = (board: (number | TetrominoType)[][]): number => {
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every(cell => cell === 0)) {
      return y;
    }
  }
  return -1;
}; 