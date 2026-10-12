import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  topBar: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, topBar, children }: AppShellProps) {
  return (
    <div className="app-bg flex h-full">
      {sidebar}
      <div className="flex min-w-0 flex-1 flex-col">
        {topBar}
        {/* Container queries let the dashboard reflow on the space left beside the sidebar */}
        <main className="@container min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] p-4 @4xl:p-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
