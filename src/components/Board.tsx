import React from 'react';
import { COLORS } from '../constants/tetrominos';
import { TetrominoType } from '../types/tetris';
import { getRotatedShape } from '../utils/tetris';

interface BoardProps {
  board: (number | TetrominoType)[][];
  currentPiece: {
    type: TetrominoType;
    position: { x: number; y: number };
    rotation: number;
  } | null;
}

export const Board: React.FC<BoardProps> = ({ board, currentPiece }) => {
  const getCell = (x: number, y: number) => {
    // Check if there's a current piece at this position
    if (currentPiece) {
      const shape = getRotatedShape(currentPiece.type, currentPiece.rotation);
      const pieceX = x - currentPiece.position.x;
      const pieceY = y - currentPiece.position.y;

      if (
        pieceY >= 0 &&
        pieceY < shape.length &&
        pieceX >= 0 &&
        pieceX < shape[0].length &&
        shape[pieceY][pieceX] === 1
      ) {
        return COLORS[currentPiece.type];
      }
    }

    // Return the board cell color
    const cell = board[y][x];
    return cell === 0 ? '#222' : COLORS[cell as TetrominoType];
  };

  return (
    <div className="grid gap-[1px] bg-gray-700 p-1 rounded">
      {board.map((row, y) => (
        <div key={y} className="flex">
          {row.map((_, x) => (
            <div
              key={x}
              className="w-6 h-6 border border-opacity-10 border-white"
              style={{ backgroundColor: getCell(x, y) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};