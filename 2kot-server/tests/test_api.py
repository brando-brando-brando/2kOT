import cv2
import numpy as np

from twokot.session import CompletedGame
from twokot.tracker import record_completed_game


def log(client, **body):
    return client.post("/api/game_result", json=body)


def test_empty_state(client):
    assert client.get("/api/health").json() == {"status": "ok"}
    assert client.get("/api/opponents").json() == []
    assert client.get("/api/games").json() == []
    stats = client.get("/api/stats").json()
    assert stats["total_games"] == 0 and stats["current_streak"] == 0
    live = client.get("/api/live").json()
    assert live["capture_state"] == "disconnected"
    assert live["session"]["phase"] == "idle"


def test_opponent_crud(client):
    created = client.post("/api/opponents", json={"name": "ItsMeJayy", "overall": 93}).json()
    assert created["total_games"] == 0 and created["last_played"] is None

    patched = client.patch(f"/api/opponents/{created['id']}", json={"build": "Scorer"}).json()
    assert (patched["build"], patched["overall"], patched["name"]) == ("Scorer", 93, "ItsMeJayy")

    assert [o["name"] for o in client.get("/api/opponents?q=jay").json()] == ["ItsMeJayy"]
    assert client.get("/api/opponents?q=zzz").json() == []

    assert client.delete(f"/api/opponents/{created['id']}").status_code == 204
    assert client.get(f"/api/opponents/{created['id']}").status_code == 404
    assert client.post("/api/opponents", json={"name": ""}).status_code == 422


def test_logging_games_updates_records_and_stats(client):
    first = log(
        client,
        opponent_name="ItsMeJayy",
        your_score=21,
        opponent_score=14,
        date="2026-10-01T20:00:00+00:00",
    )
    assert first.status_code == 201 and first.json()["outcome"] == "win"

    # Same opponent typed differently must not create a duplicate.
    log(
        client,
        opponent_name="itsmejayy",
        your_score=10,
        opponent_score=21,
        date="2026-10-02T20:00:00+00:00",
    )
    log(
        client,
        opponent_name="Trillez",
        your_score=12,
        opponent_score=21,
        date="2026-10-03T20:00:00+00:00",
    )

    opponents = client.get("/api/opponents").json()
    assert [o["name"] for o in opponents] == ["Trillez", "ItsMeJayy"]
    jayy = opponents[1]
    assert (jayy["wins"], jayy["losses"], jayy["win_rate"]) == (1, 1, 50.0)
    assert jayy["last_played"] == "2026-10-02T20:00:00+00:00"

    stats = client.get("/api/stats").json()
    assert (stats["total_games"], stats["total_wins"], stats["total_losses"]) == (3, 1, 2)
    assert stats["current_streak"] == -2

    detail = client.get(f"/api/stats/{jayy['id']}").json()
    assert len(detail["games"]) == 2
    assert len(client.get(f"/api/games?opponent_id={jayy['id']}").json()) == 2


def test_deleting_games_and_opponents_recomputes_totals(client):
    game = log(client, opponent_name="KingDre", your_score=21, opponent_score=19).json()
    assert client.delete(f"/api/games/{game['id']}").status_code == 204
    opponent = client.get("/api/opponents").json()[0]
    assert opponent["total_games"] == 0 and opponent["last_played"] is None

    log(client, opponent_id=opponent["id"], your_score=21, opponent_score=19)
    client.delete(f"/api/opponents/{opponent['id']}")
    assert client.get("/api/games").json() == []
    assert client.delete("/api/games/999").status_code == 404


def test_invalid_results_are_rejected(client):
    assert log(client, opponent_name="A1", your_score=21, opponent_score=21).status_code == 422
    assert log(client, your_score=21, opponent_score=14).status_code == 422
    assert log(client, opponent_id=42, your_score=21, opponent_score=14).status_code == 404
    assert log(client, opponent_name="A1", your_score=-1, opponent_score=14).status_code == 422
    assert (
        log(client, opponent_name="A1", your_score=2, opponent_score=1, date="soon").status_code
        == 422
    )


def test_frame_upload_and_serving(client):
    ok, png = cv2.imencode(".png", np.zeros((8, 8, 3), dtype=np.uint8))
    assert ok
    response = client.post(
        "/api/frames",
        files={"file": ("../../evil.png", png.tobytes(), "image/png")},
        data={"kind": "matchup", "label": "opponent name"},
    )
    assert response.status_code == 201
    frame = response.json()
    assert "path" not in frame and frame["kind"] == "matchup"
    image = client.get(frame["url"])
    assert image.status_code == 200 and image.content == png.tobytes()

    assert client.get("/api/live").json()["capture_state"] == "connected"
    assert client.get("/api/frames/999/image").status_code == 404

    bad = client.post("/api/frames", files={"file": ("x.png", b"nope", "image/png")})
    assert bad.status_code == 422
    wrong_kind = client.post(
        "/api/frames", files={"file": ("x.png", png.tobytes(), "image/png")}, data={"kind": "menu"}
    )
    assert wrong_kind.status_code == 422


def test_captured_game_resolves_a_misread_name_to_the_known_opponent(store):
    known = store.create_opponent("ItsMeJayy", overall=92)
    game = record_completed_game(
        store,
        CompletedGame(
            opponent_name="ltsMeJayy", your_score=21, opponent_score=14, opponent_overall=93
        ),
    )
    assert game["opponent_id"] == known["id"] and game["source"] == "capture"
    assert len(store.list_opponents()) == 1
    assert store.get_opponent(known["id"])["overall"] == 93

    record_completed_game(store, CompletedGame("BrandNewGuy", 10, 21))
    assert len(store.list_opponents()) == 2
