from twokot.session import Observation, Phase, ScreenKind, SessionTracker


def feed(tracker, obs, times=3):
    results = [tracker.observe(obs) for _ in range(times)]
    return [r for r in results if r is not None]


MATCHUP = Observation(
    ScreenKind.MATCHUP, opponent_name="ItsMeJayy", opponent_overall=93, frame_id=1
)
IN_GAME = Observation(ScreenKind.IN_GAME, quarter=2, clock="03:42")
END = Observation(ScreenKind.END_GAME, your_score=21, opponent_score=14, frame_id=9)
OTHER = Observation(ScreenKind.OTHER)


def test_full_game_produces_one_result():
    tracker = SessionTracker()
    assert feed(tracker, MATCHUP) == []
    assert tracker.state.phase == Phase.MATCHUP
    assert tracker.state.opponent_name == "ItsMeJayy"

    assert feed(tracker, IN_GAME) == []
    assert tracker.state.phase == Phase.IN_PROGRESS
    assert (tracker.state.quarter, tracker.state.clock) == (2, "03:42")

    games = feed(tracker, END, times=6)
    assert len(games) == 1, "lingering on the end screen must not record the game twice"
    game = games[0]
    assert (game.opponent_name, game.your_score, game.opponent_score) == ("ItsMeJayy", 21, 14)
    assert (game.start_frame_id, game.end_frame_id) == (1, 9)
    assert tracker.state.phase == Phase.ENDED

    feed(tracker, OTHER)
    assert tracker.state.phase == Phase.IDLE


def test_single_misread_frame_is_ignored():
    tracker = SessionTracker()
    feed(tracker, MATCHUP)
    feed(tracker, IN_GAME)
    assert tracker.observe(END) is None
    assert tracker.observe(IN_GAME) is None
    assert tracker.state.phase == Phase.IN_PROGRESS


def test_clock_updates_during_play():
    tracker = SessionTracker()
    feed(tracker, MATCHUP)
    feed(tracker, IN_GAME)
    tracker.observe(Observation(ScreenKind.IN_GAME, quarter=3, clock="01:10"))
    assert (tracker.state.quarter, tracker.state.clock) == (3, "01:10")


def test_end_screen_without_a_readable_score_waits():
    tracker = SessionTracker()
    feed(tracker, MATCHUP)
    feed(tracker, IN_GAME)
    assert feed(tracker, Observation(ScreenKind.END_GAME)) == []
    assert tracker.state.phase == Phase.IN_PROGRESS
    assert len(feed(tracker, END, times=1)) == 1


def test_end_screen_with_no_known_opponent_records_nothing():
    tracker = SessionTracker()
    assert feed(tracker, END) == []
    assert tracker.state.phase == Phase.IDLE


def test_later_matchup_frames_fill_in_missing_details():
    tracker = SessionTracker()
    feed(tracker, Observation(ScreenKind.MATCHUP, opponent_name="ItsMeJayy"))
    tracker.observe(Observation(ScreenKind.MATCHUP, opponent_overall=93, opponent_build="Scorer"))
    assert tracker.state.opponent_name == "ItsMeJayy"
    assert (tracker.state.opponent_overall, tracker.state.opponent_build) == (93, "Scorer")


def test_next_game_starts_straight_from_the_end_screen():
    tracker = SessionTracker()
    feed(tracker, MATCHUP)
    feed(tracker, END)
    feed(tracker, Observation(ScreenKind.MATCHUP, opponent_name="Trillez"))
    assert tracker.state.phase == Phase.MATCHUP
    assert tracker.state.opponent_name == "Trillez"
    assert tracker.state.opponent_overall is None
