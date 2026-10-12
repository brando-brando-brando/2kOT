import { useEffect, useMemo, useState } from 'react';
import type { Game, Opponent, Statistics } from './types';
import type { AppView, CaptureState } from './types/dashboard';
import {
  getAllGames,
  getAllOpponents,
  getStatistics,
  createOpponent,
  deleteOpponent as dbDeleteOpponent,
} from './database/db-web';
import { buildDashboardData, toOpponentSummary } from './data/dashboardData';
import { futureEnhancements, sidebarFeatures } from './data/mockData';
import { formatStreak } from './utils/format';
import { AddOpponentDialog } from './components/AddOpponentDialog';
import { AppShell } from './components/AppShell';
import { DashboardView } from './components/DashboardView';
import { GameHistoryTable } from './components/GameHistoryTable';
import { OpponentList } from './components/OpponentList';
import { OpponentQuickStats } from './components/OpponentQuickStats';
import { QuickStatsCard } from './components/QuickStatsCard';
import { Sidebar } from './components/Sidebar';
import { StatMetricCard } from './components/StatMetricCard';
import { TopBar } from './components/TopBar';
import { Card, SectionHeader } from './components/ui/Card';
import { StatusIndicator } from './components/ui/StatusIndicator';

const viewTitles: Record<AppView, { title: string; subtitle: string }> = {
  dashboard: { title: 'Opponent Tracker', subtitle: 'Live game, matchup captures and head-to-head history' },
  opponents: { title: 'Opponents', subtitle: 'Everyone you have played and your record against them' },
  stats: { title: 'Statistics', subtitle: 'Overall record and full game history' },
  settings: { title: 'Settings', subtitle: 'Capture and tracking preferences' },
};

// Capture is not wired up yet, so the UI must not claim a device is connected.
const captureState: CaptureState = 'disconnected';

function App() {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<Statistics>({
    total_games: 0,
    total_wins: 0,
    total_losses: 0,
    overall_win_rate: 0,
    current_streak: 0,
    most_frequent_opponents: [],
  });
  const [view, setView] = useState<AppView>('dashboard');
  const [showAddOpponent, setShowAddOpponent] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [opponentSearchQuery, setOpponentSearchQuery] = useState('');

  useEffect(() => {
    loadOpponents();
  }, []);

  function loadOpponents() {
    setOpponents(getAllOpponents());
    setGames(getAllGames());
    setStats(getStatistics());
  }

  const handleDeleteOpponent = (id: number) => {
    const opponent = opponents.find((o) => o.id === id);
    if (!window.confirm(`Delete ${opponent?.name ?? 'this opponent'} and their games?`)) return;
    dbDeleteOpponent(id);
    if (selectedOpponent?.id === id) {
      setSelectedOpponent(null);
    }
    loadOpponents();
  };

  const handleAddOpponent = (name: string, gamertag?: string) => {
    createOpponent(name, gamertag);
    setShowAddOpponent(false);
    loadOpponents();
  };

  const dashboard = useMemo(
    () => buildDashboardData(opponents, games, stats),
    [opponents, games, stats],
  );

  const selectedSummary = useMemo(
    () => (selectedOpponent ? toOpponentSummary(selectedOpponent, games) : null),
    [selectedOpponent, games],
  );

  const { title, subtitle } = viewTitles[view];
  const showsSampleData = dashboard.isSample && (view === 'dashboard' || view === 'stats');

  return (
    <>
      <AppShell
        sidebar={
          <Sidebar
            currentView={view}
            onViewChange={setView}
            features={sidebarFeatures}
            captureState={captureState}
          />
        }
        topBar={
          <TopBar
            title={title}
            subtitle={subtitle}
            captureState={captureState}
            showSampleBadge={showsSampleData}
            onOpenSettings={() => setView('settings')}
          />
        }
      >
        {view === 'dashboard' && (
          <DashboardView
            data={dashboard}
            enhancements={futureEnhancements}
            onViewAllGames={() => setView('stats')}
            onViewAllOpponents={() => setView('opponents')}
          />
        )}

        {view === 'opponents' && (
          <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-12">
            <OpponentList
              opponents={opponents}
              searchQuery={opponentSearchQuery}
              onSearchChange={setOpponentSearchQuery}
              onAddOpponent={() => setShowAddOpponent(true)}
              onSelectOpponent={setSelectedOpponent}
              selectedOpponentId={selectedOpponent?.id}
              onDeleteOpponent={handleDeleteOpponent}
              className="@4xl:col-span-7"
            />
            <OpponentQuickStats
              opponent={selectedSummary}
              emptyHint="Select an opponent from the list to view their stats."
              className="@4xl:col-span-5"
            />
          </div>
        )}

        {view === 'stats' && (
          <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-12">
            <QuickStatsCard stats={dashboard.stats} className="@4xl:col-span-9" />
            <Card label="Current streak" className="@4xl:col-span-3">
              <SectionHeader title="Current Streak" />
              <StatMetricCard
                label={dashboard.stats.streak < 0 ? 'Losses in a row' : 'Wins in a row'}
                value={formatStreak(dashboard.stats.streak)}
                accent={
                  dashboard.stats.streak > 0
                    ? 'success'
                    : dashboard.stats.streak < 0
                      ? 'destructive'
                      : 'neutral'
                }
                className="flex-1"
              />
            </Card>
            <GameHistoryTable games={dashboard.history} className="@4xl:col-span-12" />
          </div>
        )}

        {view === 'settings' && (
          <div className="grid max-w-3xl grid-cols-1 gap-4">
            <Card label="Capture status">
              <SectionHeader title="Capture Status" />
              <div className="panel-inset flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                <div>
                  <div className="text-sm font-medium text-foreground">Capture device</div>
                  <div className="text-xs text-foreground-secondary">
                    Capture integration has not been connected to this dashboard yet.
                  </div>
                </div>
                <StatusIndicator state={captureState} />
              </div>
            </Card>
            <Card label="Preferences">
              <SectionHeader title="Preferences" />
              <p className="text-sm text-foreground-secondary">Settings panel coming soon.</p>
            </Card>
          </div>
        )}
      </AppShell>

      {showAddOpponent && (
        <AddOpponentDialog onAdd={handleAddOpponent} onClose={() => setShowAddOpponent(false)} />
      )}
    </>
  );
}

export default App;
