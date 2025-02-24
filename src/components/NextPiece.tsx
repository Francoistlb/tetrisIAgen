import React from 'react';
import { COLORS, TETROMINO_SHAPES } from '../constants/tetrominos';
import { TetrominoType } from '../types/tetris';

interface NextPieceProps {
  type: TetrominoType;
}

export const NextPiece: React.FC<NextPieceProps> = ({ type }) => {
  const shape = TETROMINO_SHAPES[type];

  return (
    <div className="grid gap-[1px] bg-gray-700 p-1 rounded">
      {shape.map((row, y) => (
        <div key={y} className="flex">
          {row.map((cell, x) => (
            <div
              key={x}
              className="w-4 h-4 border border-opacity-10 border-white"
              style={{
                backgroundColor: cell ? COLORS[type] : '#222',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};