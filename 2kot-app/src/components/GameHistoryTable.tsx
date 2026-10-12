import { cn } from '../utils/cn';

interface GameHistoryItem {
  id: number;
  date: string;
  opponent: string;
  result: 'win' | 'loss';
  yourScore: number;
  opponentScore: number;
  gameMode: string;
  record: string;
}

interface GameHistoryTableProps {
  games?: GameHistoryItem[];
}

const mockGames: GameHistoryItem[] = [
  {
    id: 1,
    date: 'Oct 11, 2026',
    opponent: 'KingJames23',
    result: 'win',
    yourScore: 102,
    opponentScore: 98,
    gameMode: 'Quick Match',
    record: '12-3',
  },
  {
    id: 2,
    date: 'Oct 10, 2026',
    opponent: 'StephCurry30',
    result: 'loss',
    yourScore: 95,
    opponentScore: 108,
    gameMode: 'Ranked',
    record: '3-5',
  },
  {
    id: 3,
    date: 'Oct 9, 2026',
    opponent: 'KD_35',
    result: 'win',
    yourScore: 115,
    opponentScore: 110,
    gameMode: 'Quick Match',
    record: '15-7',
  },
  {
    id: 4,
    date: 'Oct 8, 2026',
    opponent: 'Giannis_34',
    result: 'win',
    yourScore: 105,
    opponentScore: 100,
    gameMode: 'Ranked',
    record: '2-1',
  },
  {
    id: 5,
    date: 'Oct 7, 2026',
    opponent: 'Luka_77',
    result: 'loss',
    yourScore: 99,
    opponentScore: 112,
    gameMode: 'Quick Match',
    record: '5-8',
  },
];

export function GameHistoryTable({ games = mockGames }: GameHistoryTableProps) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Game History</h2>
        <button className="text-sm text-primary hover:text-primary-hover font-medium transition-colors">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-foreground-secondary uppercase tracking-wider">
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Opponent</th>
              <th className="pb-3 font-semibold">Result</th>
              <th className="pb-3 font-semibold">Score</th>
              <th className="pb-3 font-semibold">Mode</th>
              <th className="pb-3 font-semibold">Record</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {games.map((game, index) => (
              <tr
                key={game.id}
                className={cn(
                  "border-t border-border-muted transition-colors hover:bg-card/50",
                  index % 2 === 0 && "bg-background-secondary/30"
                )}
              >
                <td className="py-3 text-foreground">{game.date}</td>
                <td className="py-3 text-foreground font-medium">{game.opponent}</td>
                <td className="py-3">
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-semibold uppercase",
                      game.result === 'win'
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive"
                    )}
                  >
                    {game.result}
                  </span>
                </td>
                <td className="py-3 text-foreground">
                  {game.yourScore} - {game.opponentScore}
                </td>
                <td className="py-3 text-foreground-secondary">{game.gameMode}</td>
                <td className="py-3 text-foreground-secondary">{game.record}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
