COMMAND
npm install react react-dom @vitejs/plugin-react
npm install
npm run dev


PROMPT LIST
Hello Bolt, I need you to create a JS app to build a Tetris game.

I have a problem, I don’t see the piece moving down.

I also need to see the next piece in advance in the menu bar.

It works, but I would like to keep the color of the pieces that are on the floor.

I need you to fix the rotate issue as well.

I have a problem:
When I rotate a shape, if it crashes on the floor, the next shape is bugged, and the collision/blocking is not counted like the original shape.

Alright, now I have the base of the project, I need to adapt my project to these constraints:
"Your students must code a Tetris game in HTML, CSS, and JavaScript, with two players: one human and one AI. Each player must have a grid and a scoreboard. Here are the details with fun but fair rules:"
For this, I need a second grid played by the AI, and it must place pieces in the best way to win.
I need you to adjust the scoreboard:

50 points per line
Bonus: 100 for 2 lines, 200 for 3 lines, 300 for a Tetris (4 lines).
t { useAITetris } from './hooks/useAITetris'; is not used, can you make the necessary adjustments? (@useTetris.ts)

import { useEffect } from 'react';
import { Board } from './components/Board';
import { NextPiece } from './components/NextPiece';
import { useTetris } from './hooks/useTetris';
import { useAITetris } from './hooks/useAITetris';
import { Gamepad2, Pause, Play, RotateCcw, Robot } from 'lucide-react';
There is an issue with the import: import { NextPiece } from './components/NextPiece'; It is declared as unused, but I do have the component.

Can you move the announcement for the next piece under the scoreboard, please? One for both @useAITetris.ts @useTetris.ts.

The AI grid doesn’t move after turning on the game. (@useAITetris.ts)

I would like the Play button to stop the game for everyone (including the AI).

Also, I would like a stopper when the top of the grid is reached, and a modal with the final score for both players.

I want to add a rule for the game: "Gift"
"When a player clears 2 lines at once, the opponent receives an 'easy piece' (e.g., a square or a straight line) to help them a little."
I want you to show this rule in the toolbar, please!

I want to add a rule for the game: "Sweat Break"
"Every 200 points, pieces fall 20% slower for 10 seconds for both players – a little break to breathe!"
I want you to show this rule in the toolbar, please!

Can you add a speed indicator next to the control settings?

@App.tsx - The speed logic with the second rule doesn’t work.
The reduced speed is not working.
And adjust the structure of the speed indicator div with the controls indicator div.

@App.tsx - I want to add a rule for the game: "Sweat Exchange"
"If a player makes a Tetris (4 lines), they can exchange one of their full lines with an empty line from the opponent – a mutual boost!"
I want you to show this rule in the toolbar, please!

@App.tsx - Can you place these three rules in three blocks in a flex row?

Can you fix the size of the background/div of the announcement? There is too much width.
(Not about the rules' grid, but for the next piece’s grid) @App.tsx.

@assets - I added this soundtrack for my project. How do I include it?

Can you fix it? (screen code about song logic)

The button for the song doesn’t work. (@App.tsx @assets)

@App.tsx - Once I click on the button to stop or play, I cannot click again to stop or play.

I fixed the problem without a prompt by adding:
return () => {
   audio.pause();
   audio.src = audioRef.current.src;  
};