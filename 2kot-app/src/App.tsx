import { useState, useEffect } from 'react';
import { Plus, Search, X, Flame, TrendingUp } from 'lucide-react';
import { cn } from './utils/cn';
import type { Opponent, Statistics } from './types';
import {
  getAllOpponents,
  getStatistics,
  createOpponent,
  deleteOpponent as dbDeleteOpponent,
} from './database/db-web';
import { Sidebar } from './components/Sidebar';
import { StatMetricCard } from './components/StatMetricCard';
import { CurrentGameCard } from './components/CurrentGameCard';
import { OpponentQuickStats } from './components/OpponentQuickStats';
import { MatchupCard } from './components/MatchupCard';
import { EndGameResultCard } from './components/EndGameResultCard';
import { GameHistoryTable } from './components/GameHistoryTable';
import { RecentOpponentsList } from './components/RecentOpponentsList';
import { MatchupPreviewCard } from './components/MatchupPreviewCard';
import { FutureEnhancementsCard } from './components/FutureEnhancementsCard';
import { OpponentList } from './components/OpponentList';

function App() {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [stats, setStats] = useState<Statistics>({
    total_games: 0,
    total_wins: 0,
    total_losses: 0,
    overall_win_rate: 0,
    current_streak: 0,
    most_frequent_opponents: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'stats' | 'settings'>('list');
  const [showAddOpponent, setShowAddOpponent] = useState(false);
  const [newOpponentName, setNewOpponentName] = useState('');
  const [newOpponentGamertag, setNewOpponentGamertag] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [opponentSearchQuery, setOpponentSearchQuery] = useState('');

  useEffect(() => {
    loadOpponents();
  }, []);

  function loadOpponents() {
    const loadedOpponents = getAllOpponents();
    const loadedStats = getStatistics();
    setOpponents(loadedOpponents);
    setStats(loadedStats);
  }

  const filteredOpponents = opponents.filter(
    (opponent) =>
      opponent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opponent.gamertag && opponent.gamertag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteOpponent = (id: number) => {
    dbDeleteOpponent(id);
    if (selectedOpponent?.id === id) {
      setSelectedOpponent(null);
    }
    loadOpponents();
  };

  const handleAddOpponent = () => {
    if (newOpponentName.trim()) {
      createOpponent(newOpponentName.trim(), newOpponentGamertag.trim() || undefined);
      setNewOpponentName('');
      setNewOpponentGamertag('');
      setShowAddOpponent(false);
      loadOpponents();
    }
  };

  const streakText = stats.current_streak > 0
    ? `${stats.current_streak}W`
    : stats.current_streak < 0
    ? `${Math.abs(stats.current_streak)}L`
    : '-';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar currentView={view} onViewChange={setView} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {view === 'list' && (
            <div className="p-8">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
                <p className="text-foreground-secondary">Track your NBA 2K26 opponents and gameplay analytics</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <StatMetricCard
                  label="Total Games"
                  value={stats.total_games}
                  accent="cyan"
                />
                <StatMetricCard
                  label="Wins"
                  value={stats.total_wins}
                  accent="success"
                />
                <StatMetricCard
                  label="Losses"
                  value={stats.total_losses}
                  accent="destructive"
                />
                <StatMetricCard
                  label="Win Rate"
                  value={`${stats.overall_win_rate.toFixed(0)}%`}
                  accent="magenta"
                />
              </div>

              {/* Current Streak Banner */}
              {stats.current_streak !== 0 && (
                <div className={cn(
                  "mb-8 glass rounded-2xl p-6 flex items-center gap-4",
                  stats.current_streak > 0 ? "glow-success" : "glow-destructive"
                )}>
                  <div className={cn(
                    "p-3 rounded-xl",
                    stats.current_streak > 0 ? "bg-success/20" : "bg-destructive/20"
                  )}>
                    {stats.current_streak > 0 ? (
                      <Flame className="w-6 h-6 text-success" />
                    ) : (
                      <TrendingUp className="w-6 h-6 text-destructive rotate-180" />
                    )}
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{streakText}</div>
                    <div className="text-sm text-foreground-secondary">Current Streak</div>
                  </div>
                </div>
              )}

              {/* Dashboard Grid */}
              <div className="grid grid-cols-12 gap-6">
                {/* Left Column - Game Cards */}
                <div className="col-span-3 space-y-6">
                  <CurrentGameCard />
                  <MatchupCard />
                  <EndGameResultCard />
                </div>

                {/* Middle Column - Opponent List & History */}
                <div className="col-span-4 space-y-6">
                  <OpponentList
                    opponents={opponents}
                    searchQuery={opponentSearchQuery}
                    onSearchChange={setOpponentSearchQuery}
                    onAddOpponent={() => setShowAddOpponent(true)}
                    onSelectOpponent={setSelectedOpponent}
                    selectedOpponentId={selectedOpponent?.id}
                    onDeleteOpponent={handleDeleteOpponent}
                  />
                  <GameHistoryTable />
                </div>

                {/* Right Column - Stats & Preview */}
                <div className="col-span-5 space-y-6">
                  {selectedOpponent ? (
                    <OpponentQuickStats opponent={selectedOpponent} />
                  ) : (
                    <div className="glass rounded-2xl p-6 text-center">
                      <div className="text-foreground-secondary mb-2">Select an opponent</div>
                      <div className="text-sm text-foreground-secondary opacity-60">
                        Click on an opponent from the list to view their stats
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-6">
                    <RecentOpponentsList opponents={opponents} />
                    <MatchupPreviewCard />
                  </div>
                  <FutureEnhancementsCard />
                </div>
              </div>
            </div>
          )}

          {view === 'stats' && (
            <div className="p-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Statistics</h1>
              <p className="text-foreground-secondary mb-8">Detailed analytics and performance metrics</p>
              <div className="glass rounded-2xl p-8">
                <p className="text-foreground-secondary opacity-70">Detailed statistics dashboard coming soon...</p>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="p-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
              <p className="text-foreground-secondary mb-8">Configure your tracking preferences</p>
              <div className="glass rounded-2xl p-8">
                <p className="text-foreground-secondary opacity-70">Settings panel coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Opponent Modal */}
      {showAddOpponent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add Opponent</h3>
              <button
                onClick={() => setShowAddOpponent(false)}
                className="p-2 hover:bg-background-secondary rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-foreground-secondary" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">Name *</label>
                <input
                  type="text"
                  value={newOpponentName}
                  onChange={(e) => setNewOpponentName(e.target.value)}
                  placeholder="Opponent name"
                  className="w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-2">Gamertag (optional)</label>
                <input
                  type="text"
                  value={newOpponentGamertag}
                  onChange={(e) => setNewOpponentGamertag(e.target.value)}
                  placeholder="Gamertag"
                  className="w-full px-4 py-3 bg-background-secondary border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => setShowAddOpponent(false)}
                  className="px-6 py-3 bg-background-secondary text-foreground rounded-xl hover:bg-border transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOpponent}
                  disabled={!newOpponentName.trim()}
                  className="px-6 py-3 bg-primary text-background rounded-xl hover:bg-primary-hover transition-all font-medium disabled:opacity-50 glow-cyan"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
