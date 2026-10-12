import { Search, Plus } from 'lucide-react';
import { cn } from '../utils/cn';
import type { Opponent } from '../types';

interface OpponentListProps {
  opponents: Opponent[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddOpponent: () => void;
  onSelectOpponent: (opponent: Opponent) => void;
  selectedOpponentId?: number;
  onDeleteOpponent: (id: number) => void;
}

export function OpponentList({
  opponents,
  searchQuery,
  onSearchChange,
  onAddOpponent,
  onSelectOpponent,
  selectedOpponentId,
  onDeleteOpponent,
}: OpponentListProps) {
  const filteredOpponents = opponents.filter(
    (opponent) =>
      opponent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opponent.gamertag && opponent.gamertag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Opponents</h2>
        <button
          onClick={onAddOpponent}
          className="flex items-center gap-2 px-3 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary opacity-50" />
        <input
          type="text"
          placeholder="Search opponents..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-secondary opacity-50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
        />
      </div>

      {/* List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredOpponents.length === 0 ? (
          <div className="text-center py-8 text-foreground-secondary opacity-50 text-sm">
            No opponents found
          </div>
        ) : (
          filteredOpponents.map((opponent) => {
            const winRate = opponent.win_rate.toFixed(0);
            const isWinning = opponent.win_rate >= 50;
            const isSelected = selectedOpponentId === opponent.id;

            return (
              <div
                key={opponent.id}
                onClick={() => onSelectOpponent(opponent)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group",
                  isSelected
                    ? "bg-primary/20 border border-primary/30"
                    : "bg-background-secondary/30 hover:bg-background-secondary border border-transparent"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                  isSelected ? "bg-primary text-background" : "bg-background-secondary border-2 border-border text-foreground-secondary group-hover:border-primary/50"
                )}>
                  {opponent.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-medium truncate",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {opponent.name}
                  </div>
                  <div className="text-xs text-foreground-secondary">
                    {opponent.wins}-{opponent.losses} ({winRate}%)
                  </div>
                </div>

                {/* Win Rate Badge */}
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold",
                  isWinning
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive"
                )}>
                  {winRate}%
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
