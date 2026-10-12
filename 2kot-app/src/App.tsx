import { useCallback, useEffect, useMemo, useState } from 'react';
import { ServerOff, X } from 'lucide-react';
import type { Game, Opponent, Statistics } from './types';
import type { AppView, CaptureState, LiveState } from './types/dashboard';
import { api, type NewGameResult } from './api/client';
import { buildDashboardData, toOpponentSummary } from './data/dashboardData';
import { futureEnhancements, sidebarFeatures } from './data/mockData';
import { formatStreak } from './utils/format';
import { AddOpponentDialog } from './components/AddOpponentDialog';
import { AppShell } from './components/AppShell';
import { DashboardView } from './components/DashboardView';
import { GameHistoryTable } from './components/GameHistoryTable';
import { LogGameDialog } from './components/LogGameDialog';
import { OpponentList } from './components/OpponentList';
import { OpponentQuickStats } from './components/OpponentQuickStats';
import { QuickStatsCard } from './components/QuickStatsCard';
import { Sidebar } from './components/Sidebar';
import { StatMetricCard } from './components/StatMetricCard';
import { TopBar } from './components/TopBar';
import { Card, EmptyState, SectionHeader } from './components/ui/Card';
import { StatusIndicator } from './components/ui/StatusIndicator';

const viewTitles: Record<AppView, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Live game, matchup captures and head-to-head history' },
  opponents: { title: 'Opponents', subtitle: 'Everyone you have played and your record against them' },
  stats: { title: 'Statistics', subtitle: 'Overall record and full game history' },
  settings: { title: 'Settings', subtitle: 'Capture and tracking preferences' },
};

const emptyStats: Statistics = {
  total_games: 0,
  total_wins: 0,
  total_losses: 0,
  overall_win_rate: 0,
  current_streak: 0,
  most_frequent_opponents: [],
};

// How often to pick up games recorded outside this window (e.g. by capture).
const REFRESH_MS = 5000;

type Connection = 'loading' | 'online' | 'offline';

function messageOf(cause: unknown) {
  return cause instanceof Error ? cause.message : 'Something went wrong';
}

function App() {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<Statistics>(emptyStats);
  const [live, setLive] = useState<LiveState | null>(null);
  const [connection, setConnection] = useState<Connection>('loading');
  const [notice, setNotice] = useState<string | null>(null);
  const [view, setView] = useState<AppView>('dashboard');
  const [showAddOpponent, setShowAddOpponent] = useState(false);
  const [showLogGame, setShowLogGame] = useState(false);
  const [selectedOpponentId, setSelectedOpponentId] = useState<number | null>(null);
  const [opponentSearchQuery, setOpponentSearchQuery] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [nextOpponents, nextGames, nextStats, nextLive] = await Promise.all([
        api.listOpponents(),
        api.listGames(),
        api.getStatistics(),
        api.getLive(),
      ]);
      setOpponents(nextOpponents);
      setGames(nextGames);
      setStats(nextStats);
      setLive(nextLive);
      setConnection('online');
    } catch {
      setConnection('offline');
    }
  }, []);

  useEffect(() => {
    // Initial load plus polling; state is only set after the request settles.
    const initial = window.setTimeout(refresh, 0);
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [refresh]);

  const handleDeleteOpponent = async (id: number) => {
    const opponent = opponents.find((o) => o.id === id);
    if (!window.confirm(`Delete ${opponent?.name ?? 'this opponent'} and their games?`)) return;
    try {
      await api.deleteOpponent(id);
      if (selectedOpponentId === id) setSelectedOpponentId(null);
    } catch (cause) {
      setNotice(messageOf(cause));
    }
    await refresh();
  };

  const handleAddOpponent = async (name: string, gamertag?: string) => {
    setShowAddOpponent(false);
    try {
      const created = await api.createOpponent({ name, gamertag });
      setSelectedOpponentId(created.id);
    } catch (cause) {
      setNotice(messageOf(cause));
    }
    await refresh();
  };

  const handleLogGame = async (result: NewGameResult) => {
    // Errors propagate to the dialog, which stays open and shows them.
    await api.logGame(result);
    setShowLogGame(false);
    await refresh();
  };

  const handleDeleteGame = async (id: number) => {
    if (!window.confirm('Delete this game? Records and stats will be recalculated.')) return;
    try {
      await api.deleteGame(id);
    } catch (cause) {
      setNotice(messageOf(cause));
    }
    await refresh();
  };

  const dashboard = useMemo(
    () => buildDashboardData(opponents, games, stats, live),
    [opponents, games, stats, live],
  );

  const selectedOpponent = opponents.find((o) => o.id === selectedOpponentId) ?? null;
  const selectedSummary = useMemo(
    () => (selectedOpponent ? toOpponentSummary(selectedOpponent, games) : null),
    [selectedOpponent, games],
  );

  // Only claim a capture connection while the server reports frames arriving.
  const captureState: CaptureState = live?.capture_state ?? 'disconnected';
  const online = connection === 'online';
  const { title, subtitle } = viewTitles[view];
  const showsSampleData = online && dashboard.isSample && (view === 'dashboard' || view === 'stats');

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
            onLogGame={online ? () => setShowLogGame(true) : undefined}
          />
        }
      >
        {notice && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between gap-3 rounded-inset border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-foreground"
          >
            {notice}
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
              className="rounded p-1 text-foreground-secondary hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {connection === 'loading' && view !== 'settings' && (
          <EmptyState title="Loading…" className="py-24" />
        )}

        {connection === 'offline' && view !== 'settings' && (
          <Card label="Tracker service offline" className="mx-auto max-w-xl items-center py-10 text-center">
            <ServerOff className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-base font-semibold text-foreground">Tracker service is offline</h2>
            <p className="mt-1 max-w-sm text-sm text-foreground-secondary">
              Your opponents and games are stored by the local 2KOT server. Start it and this page
              will reconnect on its own.
            </p>
            <code className="panel-inset mt-4 px-3 py-2 text-xs text-primary">
              cd 2kot-server &amp;&amp; uv run python -m twokot
            </code>
          </Card>
        )}

        {online && view === 'dashboard' && (
          <DashboardView
            data={dashboard}
            enhancements={futureEnhancements}
            onViewAllGames={() => setView('stats')}
            onViewAllOpponents={() => setView('opponents')}
          />
        )}

        {online && view === 'opponents' && (
          <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-12">
            <OpponentList
              opponents={opponents}
              searchQuery={opponentSearchQuery}
              onSearchChange={setOpponentSearchQuery}
              onAddOpponent={() => setShowAddOpponent(true)}
              onSelectOpponent={(opponent) => setSelectedOpponentId(opponent.id)}
              selectedOpponentId={selectedOpponentId ?? undefined}
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

        {online && view === 'stats' && (
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
            <GameHistoryTable
              games={dashboard.history}
              // Sample rows are not real games, so there is nothing to delete.
              onDeleteGame={dashboard.isSample ? undefined : handleDeleteGame}
              className="@4xl:col-span-12"
            />
          </div>
        )}

        {view === 'settings' && (
          <div className="grid max-w-3xl grid-cols-1 gap-4">
            <Card label="Service status">
              <SectionHeader title="Status" />
              <div className="space-y-2">
                <div className="panel-inset flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Tracker service</div>
                    <div className="text-xs text-foreground-secondary">
                      Stores opponents, games and captured frames on this computer.
                    </div>
                  </div>
                  <StatusIndicator
                    state={online ? 'connected' : connection === 'loading' ? 'processing' : 'disconnected'}
                    label={online ? 'Running' : connection === 'loading' ? 'Connecting' : 'Offline'}
                  />
                </div>
                <div className="panel-inset flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">Capture</div>
                    <div className="text-xs text-foreground-secondary">
                      Shows as connected only while frames are arriving from the capture tool.
                    </div>
                  </div>
                  <StatusIndicator state={captureState} />
                </div>
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

      {showLogGame && (
        <LogGameDialog
          opponentNames={opponents.map((o) => o.name)}
          defaultOpponent={view === 'opponents' ? selectedOpponent?.name : undefined}
          onSubmit={handleLogGame}
          onClose={() => setShowLogGame(false)}
        />
      )}
    </>
  );
}

export default App;
