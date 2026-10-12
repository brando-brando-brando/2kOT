"""Game session tracking.

Turns a stream of per-frame screen observations into game lifecycle events:

    idle -> matchup -> in_progress -> ended -> idle

A screen type must be seen on several consecutive frames before it is acted
on, so a single misclassified frame cannot start or finish a game. The tracker
is independent of how observations are produced, so it works the same for the
vision pipeline and for tests.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ScreenKind(str, Enum):
    MATCHUP = "matchup"
    IN_GAME = "in_game"
    END_GAME = "end_game"
    OTHER = "other"


class Phase(str, Enum):
    IDLE = "idle"
    MATCHUP = "matchup"
    IN_PROGRESS = "in_progress"
    ENDED = "ended"


@dataclass(frozen=True)
class Observation:
    """What one captured frame was recognised as."""

    kind: ScreenKind
    opponent_name: str | None = None
    opponent_overall: int | None = None
    opponent_build: str | None = None
    your_score: int | None = None
    opponent_score: int | None = None
    quarter: int | None = None
    clock: str | None = None
    frame_id: int | None = None


@dataclass(frozen=True)
class CompletedGame:
    opponent_name: str
    your_score: int
    opponent_score: int
    opponent_overall: int | None = None
    opponent_build: str | None = None
    start_frame_id: int | None = None
    end_frame_id: int | None = None


@dataclass
class SessionState:
    phase: Phase = Phase.IDLE
    opponent_name: str | None = None
    opponent_overall: int | None = None
    opponent_build: str | None = None
    quarter: int | None = None
    clock: str | None = None
    start_frame_id: int | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "phase": self.phase.value,
            "opponent_name": self.opponent_name,
            "opponent_overall": self.opponent_overall,
            "opponent_build": self.opponent_build,
            "quarter": self.quarter,
            "clock": self.clock,
            "start_frame_url": (
                f"/api/frames/{self.start_frame_id}/image"
                if self.start_frame_id is not None
                else None
            ),
        }


@dataclass
class SessionTracker:
    """Feed observations in capture order; completed games come back out."""

    # Consecutive frames of one screen type needed before acting on it.
    confirm_frames: int = 3
    state: SessionState = field(default_factory=SessionState)
    _streak_kind: ScreenKind | None = None
    _streak: int = 0

    def observe(self, obs: Observation) -> CompletedGame | None:
        if obs.kind == self._streak_kind:
            self._streak += 1
        else:
            self._streak_kind = obs.kind
            self._streak = 1
        confirmed = self._streak >= self.confirm_frames

        # Keep the freshest details even before the screen type is confirmed.
        if obs.kind == ScreenKind.MATCHUP:
            self._absorb_matchup(obs)
        elif obs.kind == ScreenKind.IN_GAME and self.state.phase == Phase.IN_PROGRESS:
            self.state.quarter = obs.quarter or self.state.quarter
            self.state.clock = obs.clock or self.state.clock

        if not confirmed:
            return None

        phase = self.state.phase
        if obs.kind == ScreenKind.MATCHUP and phase in (Phase.IDLE, Phase.ENDED):
            self._start_matchup(obs)
        elif obs.kind == ScreenKind.IN_GAME and phase == Phase.MATCHUP:
            self.state.phase = Phase.IN_PROGRESS
            self.state.quarter = obs.quarter
            self.state.clock = obs.clock
        elif obs.kind == ScreenKind.END_GAME and phase in (Phase.MATCHUP, Phase.IN_PROGRESS):
            return self._finish(obs)
        elif obs.kind == ScreenKind.OTHER and phase == Phase.ENDED:
            # Back at menus after a finished game.
            self.state = SessionState()
        return None

    def reset(self) -> None:
        self.state = SessionState()
        self._streak_kind = None
        self._streak = 0

    def _absorb_matchup(self, obs: Observation) -> None:
        # Later matchup frames often read more cleanly than the first one.
        if self.state.phase == Phase.MATCHUP:
            self.state.opponent_name = obs.opponent_name or self.state.opponent_name
            self.state.opponent_overall = obs.opponent_overall or self.state.opponent_overall
            self.state.opponent_build = obs.opponent_build or self.state.opponent_build

    def _start_matchup(self, obs: Observation) -> None:
        self.state = SessionState(
            phase=Phase.MATCHUP,
            opponent_name=obs.opponent_name,
            opponent_overall=obs.opponent_overall,
            opponent_build=obs.opponent_build,
            start_frame_id=obs.frame_id,
        )

    def _finish(self, obs: Observation) -> CompletedGame | None:
        state = self.state
        complete = (
            state.opponent_name is not None
            and obs.your_score is not None
            and obs.opponent_score is not None
            and obs.your_score != obs.opponent_score
        )
        if not complete:
            # Not enough to record a result yet; keep waiting on this screen.
            return None

        game = CompletedGame(
            opponent_name=state.opponent_name,
            your_score=obs.your_score,
            opponent_score=obs.opponent_score,
            opponent_overall=state.opponent_overall,
            opponent_build=state.opponent_build,
            start_frame_id=state.start_frame_id,
            end_frame_id=obs.frame_id,
        )
        self.state = SessionState(
            phase=Phase.ENDED,
            opponent_name=state.opponent_name,
            opponent_overall=state.opponent_overall,
            opponent_build=state.opponent_build,
        )
        return game
