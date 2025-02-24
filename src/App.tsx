import { useEffect, useState, useRef } from 'react';
import { Board } from './components/Board';
import { NextPiece } from './components/NextPiece';
import { useTetris } from './hooks/useTetris';
import { useAITetris } from './hooks/useAITetris';
import { Gamepad2, Pause, Play, RotateCcw, Bot, Volume2, VolumeX, PlayCircle, StopCircle } from 'lucide-react';
import tetrisTheme from './assets/Tetris.mp3';

function App() {
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const { 
    gameState, 
    moveHorizontal, 
    moveDown, 
    rotate, 
    togglePause, 
    resetGame,
    setPaused 
  } = useTetris();
  
  const { 
    gameState: aiGameState, 
    resetGame: resetAIGame,
    setPaused: setAIPaused 
  } = useAITetris();

  // Ajout d'un état pour suivre le ralentissement
  const [isSlowdown, setIsSlowdown] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(new Audio(tetrisTheme));

  // Gestion de la pause globale
  const handleTogglePause = () => {
    togglePause();
    setAIPaused(!gameState.isPaused);
  };

  // Vérifier si le jeu est terminé
  useEffect(() => {
    if (gameState.gameOver || aiGameState.gameOver) {
      setPaused(true);
      setAIPaused(true);
      setShowGameOverModal(true);
    }
  }, [gameState.gameOver, aiGameState.gameOver]);

  // Reset les deux jeux et ferme la modale
  const handleResetBothGames = () => {
    resetGame();
    resetAIGame();
    setShowGameOverModal(false);
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
          moveHorizontal(1);
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case 'ArrowUp':
          rotate();
          break;
        case ' ':
          togglePause();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveHorizontal, moveDown, rotate, togglePause]);

  // Effet pour gérer le ralentissement tous les 200 points
  useEffect(() => {
    const checkForSlowdown = (score: number) => {
      if (score > 0 && score % 200 === 0) {
        setIsSlowdown(true);
        // Désactiver le ralentissement après 10 secondes
        setTimeout(() => {
          setIsSlowdown(false);
        }, 10000);
      }
    };

    // Vérifier les scores des deux joueurs
    checkForSlowdown(gameState.score);
    checkForSlowdown(aiGameState.score);
  }, [gameState.score, aiGameState.score]);

  // Propager l'état de ralentissement aux hooks
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('speedChange', {
      detail: { isSlowdown }
    }));
  }, [isSlowdown]);

  // Simplifier la gestion du son
  const toggleSound = () => {
    try {
      if (isMuted) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Erreur audio:', error);
    }
  };

  // Configurer l'audio une seule fois au montage
  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;

    return () => {
      audio.pause();
      audio.src = audioRef.current.src;
    };
  }, []);

  // Gérer la pause du jeu
  useEffect(() => {
    const audio = audioRef.current;
    if (gameState.isPaused || gameState.gameOver) {
      audio.pause();
      setIsMuted(true);
    }
  }, [gameState.isPaused, gameState.gameOver]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="p-8 bg-gray-800 rounded-xl shadow-2xl">
        <div className="flex gap-12">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Gamepad2 className="w-6 h-6" />
                Joueur
              </h1>
              <div className="flex gap-2">
                {/* Bouton pour le son */}
                <button
                  onClick={toggleSound}
                  className="px-3 py-1 bg-indigo-600 rounded hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  {isMuted ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span className="text-xs">Play</span>
                    </>
                  ) : (
                    <>
                      <StopCircle className="w-4 h-4" />
                      <span className="text-xs">Stop</span>
                    </>
                  )}
                </button>
                {/* Bouton pause existant */}
                <button
                  onClick={handleTogglePause}
                  className="px-3 py-1 bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                >
                  {gameState.isPaused ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Board
              board={gameState.board}
              currentPiece={gameState.currentPiece}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bot className="w-6 h-6" />
                IA
              </h1>
            </div>
            <Board
              board={aiGameState.board}
              currentPiece={aiGameState.currentPiece}
            />
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Scores</h2>
              <div className="space-y-2">
                <p className="text-lg">
                  Joueur: <span className="text-yellow-400 font-bold">{gameState.score}</span>
                </p>
                <p className="text-lg">
                  IA: <span className="text-yellow-400 font-bold">{aiGameState.score}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-700 p-3 rounded-lg">
              <div className="flex flex-col items-center">
                <h2 className="text-sm font-semibold mb-2">Prochaine (Joueur)</h2>
                <div className="bg-gray-800 p-2 rounded">
                  <NextPiece type={gameState.nextPiece} />
                </div>
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-sm font-semibold mb-2">Prochaine (IA)</h2>
                <div className="bg-gray-800 p-2 rounded">
                  <NextPiece type={aiGameState.nextPiece} />
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex items-start gap-8">
                {/* Contrôles */}
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold mb-2">Contrôles</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>← → : Déplacer</li>
                    <li>↓ : Descendre</li>
                    <li>↑ : Rotation</li>
                    <li>Espace : Pause</li>
                  </ul>
                </div>

                {/* Vitesse */}
                <div className="flex flex-col items-end">
                  <h3 className="text-lg font-semibold mb-2">Vitesse</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-green-400">
                      {isSlowdown ? '80%' : '100%'}
                    </span>
                    {isSlowdown && (
                      <span className="px-2 py-1 text-xs bg-green-500 text-black rounded-full animate-pulse">
                        Ralenti
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 max-w-3xl">
              <div className="flex gap-2">
                {/* Règle du Cadeau */}
                <div className="flex-1 p-3 bg-gray-700 rounded-lg min-w-[200px]">
                  <h3 className="text-md font-semibold mb-2">Règle Spéciale 🎁</h3>
                  <p className="text-xs text-gray-300">
                    Compléter 2 lignes d'un coup offre une pièce facile (carré ou ligne) à l'adversaire !
                  </p>
                </div>
                
                {/* Règle de la Pause */}
                <div className="flex-1 p-3 bg-gray-700 rounded-lg min-w-[200px]">
                  <h3 className="text-md font-semibold mb-2">Pause Détente 😌</h3>
                  <p className="text-xs text-gray-300">
                    Tous les 200 points, les pièces tombent 20% plus lentement pendant 10 secondes !
                  </p>
                </div>

                {/* Règle de l'Échange */}
                <div className="flex-1 p-3 bg-gray-700 rounded-lg min-w-[200px]">
                  <h3 className="text-md font-semibold mb-2">Échange Sympa 🔄</h3>
                  <p className="text-xs text-gray-300">
                    Après un Tetris (4 lignes), échangez une ligne pleine contre une ligne vide de l'adversaire !
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Game Over */}
      {showGameOverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-red-500 mb-6">Game Over!</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg">Score Joueur:</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {gameState.score}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg">Score IA:</span>
                <span className="text-2xl font-bold text-yellow-400">
                  {aiGameState.score}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-600">
                <span className="text-lg font-semibold">
                  {gameState.score > aiGameState.score 
                    ? "Victoire du Joueur! 🏆" 
                    : gameState.score < aiGameState.score 
                    ? "Victoire de l'IA! 🤖" 
                    : "Match Nul! 🤝"}
                </span>
              </div>
            </div>

            <button
              onClick={handleResetBothGames}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Nouvelle Partie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;