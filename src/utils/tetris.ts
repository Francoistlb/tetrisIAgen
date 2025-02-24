import { TetrominoType } from '../types/tetris';
import { TETROMINO_SHAPES } from '../constants/tetrominos';

export const rotateMatrix = (matrix: number[][]): number[][] => {
  const N = matrix.length;
  const M = matrix[0].length;
  const rotated = Array(M).fill(0).map(() => Array(N).fill(0));
  
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < M; x++) {
      rotated[x][N - 1 - y] = matrix[y][x];
    }
  }
  
  return rotated;
};

export const getRotatedShape = (piece: TetrominoType, rotation: number): number[][] => {
  let shape = [...TETROMINO_SHAPES[piece]].map(row => [...row]);
  const rotations = ((rotation % 360) / 90);
  
  for (let i = 0; i < rotations; i++) {
    shape = rotateMatrix(shape);
  }
  
  return shape;
};