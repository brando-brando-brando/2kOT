"""Recognise NBA 2K26 screens and read the values off them.

Calibrated against a 1v1 Theater recording. Every position below is a
fraction of a 16:9 frame, so it holds at any capture resolution.

Recognition is two-speed:

  * Each screen has a *signature*: a fixed box holding known text ("YOU",
    "PLAYER MATCHUP", the scoreboard digits). Reading a known single line is
    fast, so signatures are checked on every frame.
  * Once a screen is recognised, the slower find-and-read pass runs only on
    the region that holds its values.
"""

from __future__ import annotations

import re
from difflib import SequenceMatcher
from typing import Any

import cv2
import numpy as np

from ..session import Observation, PlayerRead, ScreenKind
from . import parse
from .preprocess import Region, crop
from .reader import TextBox, TextReader

# Frames are brought to at least this width before reading. Small captures
# (e.g. 640x480) are upscaled, which also undoes any 4:3 squash of the 16:9 game.
WORK_WIDTH = 1280
LINE_HEIGHT = 48


def box(x0: float, y0: float, x1: float, y1: float) -> Region:
    return Region(x0, y0, x1 - x0, y1 - y0)


# Signatures: single lines of known text -------------------------------------

BANNER = box(0.36, 0.085, 0.64, 0.14)  # "YOU" / "OPPONENT"
TITLE = box(0.37, 0.02, 0.63, 0.075)  # "PLAYER MATCHUP"
WINNERS = box(0.20, 0.035, 0.51, 0.12)  # "WINNERS CIRCLE"
GAME_STATS = box(0.19, 0.18, 0.34, 0.235)  # "GAME STATS"
SCORE_LEFT = box(0.400, 0.895, 0.452, 0.955)
SCORE_RIGHT = box(0.532, 0.895, 0.584, 0.955)
RESULT_SCORE = box(0.40, 0.56, 0.555, 0.632)  # "22 - 18" under YOU WON / YOU LOST

# Value regions: read with the find-and-read pass ------------------------------

RESULT_TEXT = box(0.03, 0.06, 0.85, 0.72)  # "YOU WON" / "YOU LOST", animated
PLAYER_CARD = box(0.34, 0.70, 0.68, 0.88)
CARD_OVERALL = box(0.555, 0.782, 0.60, 0.828)
CARD_LEVEL = box(0.62, 0.79, 0.66, 0.83)
MATCHUP_MODE = box(0.40, 0.07, 0.60, 0.115)
MATCHUP_LEFT = box(0.17, 0.33, 0.47, 0.82)
MATCHUP_RIGHT = box(0.53, 0.33, 0.83, 0.82)
SCORE_NAME_LEFT = box(0.355, 0.842, 0.475, 0.888)
SCORE_NAME_RIGHT = box(0.525, 0.842, 0.645, 0.888)
STATS_TABLE = box(0.15, 0.24, 0.86, 0.56)

STAT_COLUMNS = ("GRD", "PTS", "REB", "AST", "STL", "BLK", "FOULS", "TO", "FGM/FGA", "3PM/3PA")
POSITIONS = ("PG", "SG", "SF", "PF", "C")


def normalize_frame(image: np.ndarray) -> np.ndarray:
    """Return the frame as 16:9, at least WORK_WIDTH wide."""
    height, width = image.shape[:2]
    target_width = max(WORK_WIDTH, width)
    target_height = round(target_width * 9 / 16)
    if (width, height) == (target_width, target_height):
        return image
    return cv2.resize(image, (target_width, target_height), interpolation=cv2.INTER_CUBIC)


def _line(
    frame: np.ndarray, region: Region, reader: TextReader, height: int = LINE_HEIGHT
) -> tuple[str, float]:
    piece = crop(frame, region)
    scale = height / piece.shape[0]
    piece = cv2.resize(piece, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    return reader.read_line(piece)


def _boxes(
    frame: np.ndarray, region: Region, reader: TextReader, scale: float = 2.0
) -> list[TextBox]:
    piece = crop(frame, region)
    piece = cv2.resize(piece, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    return reader.read_boxes(piece)


def _letters(text: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", text.upper())


def _resembles(text: str, target: str, threshold: float = 0.72) -> bool:
    got = _letters(text)
    if not got:
        return False
    return target in got or SequenceMatcher(None, got, target).ratio() >= threshold


def _score(text: str, confidence: float) -> int | None:
    digits = re.sub(r"\s", "", text).translate(parse.DIGIT_FIXES)
    if confidence < 0.5 or not re.fullmatch(r"\d{1,3}", digits):
        return None
    return int(digits)


# Classification --------------------------------------------------------------


def classify(frame: np.ndarray, reader: TextReader) -> ScreenKind:
    """Which screen a normalised frame shows, from its signatures alone."""
    banner, banner_conf = _line(frame, BANNER, reader)
    if banner_conf >= 0.5:
        if _letters(banner) in ("YOU", "Y0U"):
            return ScreenKind.MY_PLAYER
        if _resembles(banner, "OPPONENT"):
            return ScreenKind.OPPONENT_PLAYER

    if _resembles(_line(frame, TITLE, reader)[0], "PLAYERMATCHUP"):
        return ScreenKind.MATCHUP

    if _resembles(_line(frame, GAME_STATS, reader)[0], "GAMESTATS"):
        return ScreenKind.GAME_STATS

    if _resembles(_line(frame, WINNERS, reader)[0], "WINNERSCIRCLE"):
        return ScreenKind.WINNERS_CIRCLE

    left = _score(*_line(frame, SCORE_LEFT, reader))
    right = _score(*_line(frame, SCORE_RIGHT, reader))
    if left is not None and right is not None:
        return ScreenKind.IN_GAME

    if _looks_like_result(frame, reader):
        return ScreenKind.GAME_RESULT

    return ScreenKind.OTHER


def _result_outcome(boxes: list[TextBox]) -> str | None:
    for item in boxes:
        text = _letters(item.text)
        if "YOU" not in text and "Y0U" not in text:
            continue
        if "WON" in text or "WIN" in text:
            return "win"
        if "LOST" in text or "LOSE" in text or "L0ST" in text:
            return "loss"
    return None


def _looks_like_result(frame: np.ndarray, reader: TextReader) -> bool:
    """The result banner is large, animated lettering with no fixed box, so it
    needs the slower pass. A cheap colour test keeps that off ordinary frames:
    the banner fills the middle of the screen with bright, near-white letters
    on a dark, strongly tinted backdrop."""
    middle = crop(frame, box(0.2, 0.2, 0.8, 0.62))
    small = cv2.resize(middle, (96, 40), interpolation=cv2.INTER_AREA)
    hsv = cv2.cvtColor(small, cv2.COLOR_BGR2HSV)
    bright_letters = np.mean((hsv[..., 2] > 200) & (hsv[..., 1] < 70))
    tinted_backdrop = np.mean((hsv[..., 1] > 120) & (hsv[..., 2] > 40))
    if not (0.04 < bright_letters < 0.45 and tinted_backdrop > 0.25):
        return False
    return _result_outcome(_boxes(frame, RESULT_TEXT, reader, scale=0.75)) is not None


# Extraction ------------------------------------------------------------------


def _clean_build(text: str) -> str | None:
    """'o2-WayBucket Chaser' -> '2-Way Bucket Chaser'."""
    text = re.sub(r"^[^0-9A-Za-z]*[oO@©®]?(?=\d)", "", text.strip())
    text = re.sub(r"[·•.]", "-", text)
    text = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", text)
    text = re.sub(r"\s+", " ", text).strip(" -|")
    if len(text) < 5 or not re.search(r"[A-Za-z]{3}", text):
        return None
    return text.title() if text.isupper() else text


def _clean_gamertag(text: str) -> str | None:
    # Platform icons in front of the name are often read as a stray character.
    name = parse.clean_name(text)
    if not name or " " in name or len(name) < 3:
        return None
    return name


def read_player_card(frame: np.ndarray, reader: TextReader) -> PlayerRead:
    """Name, rating, level and build from a YOU / OPPONENT load screen card."""
    name = build = None
    for item in _boxes(frame, PLAYER_CARD, reader):
        if item.confidence < 0.5:
            continue
        if 0.52 <= item.cy <= 0.80 and item.cx < 0.62 and re.search(r"[A-Za-z]{3}", item.text):
            # The gamertag sits beside a platform icon OCR may glue to its front.
            candidate = _clean_gamertag(item.text)
            if candidate and (name is None or len(candidate) > len(name)):
                name = candidate
        elif item.cy > 0.80:
            build = _clean_build(item.text) or build

    # Small digits: read larger. Unclear readings are dropped, not guessed.
    overall = _number(*_line(frame, CARD_OVERALL, reader, height=64), low=40, high=99)
    level = _number(*_line(frame, CARD_LEVEL, reader, height=64), low=1, high=99)
    return PlayerRead(name=name, overall=overall, level=level, build=build)


def _number(text: str, confidence: float, low: int, high: int) -> int | None:
    """A whole-box number; anything but clean digits is treated as unreadable."""
    if confidence < 0.5 or not re.fullmatch(r"\d{1,2}", text.strip()):
        return None
    value = int(text)
    return value if low <= value <= high else None


def _read_matchup_side(frame: np.ndarray, region: Region, reader: TextReader) -> PlayerRead:
    name = build = position = None
    overall = None
    for item in _boxes(frame, region, reader, scale=1.5):
        if item.confidence < 0.5:
            continue
        text = item.text
        if item.cy < 0.14 and re.search(r"[O0]VR", text, re.IGNORECASE):
            overall = parse.parse_overall(text)
            found = re.search(r"\b(PG|SG|SF|PF|C)\b", re.sub(r"[|I1l]", " ", text[5:]))
            position = found.group(1) if found else None
        elif 0.68 <= item.cy <= 0.84:
            name = _clean_gamertag(text) or name
        elif item.cy > 0.84:
            build = _clean_build(text) or build
    return PlayerRead(name=name, overall=overall, build=build, position=position)


def _clean_mode(text: str, confidence: float) -> str | None:
    letters = re.sub(r"[^A-Za-z ]", "", text).strip()
    if confidence < 0.6 or len(letters) < 4:
        return None
    # Single-line reading drops spaces: "CityGames" -> "City Games".
    return re.sub(r"(?<=[a-z])(?=[A-Z])", " ", letters).title()


def _scoreboard_name(text: str, confidence: float) -> str | None:
    if confidence < 0.5 or not re.search(r"[A-Za-z]{3}", text):
        return None
    return parse.clean_name(text)


def _stat_value(text: str) -> int | str:
    cleaned = text.replace(" ", "")
    return int(cleaned) if cleaned.isdigit() else cleaned


def read_stats_table(frame: np.ndarray, reader: TextReader) -> dict[str, Any]:
    """The GAME STATS table: per-side TOTAL rows keyed by column name."""
    items = [b for b in _boxes(frame, STATS_TABLE, reader) if b.confidence >= 0.5]

    def is_header(item: TextBox, column: str) -> bool:
        return _letters(item.text) == _letters(column)

    totals = sorted((b for b in items if _letters(b.text) == "TOTAL"), key=lambda b: b.cy)
    result: dict[str, Any] = {}
    for side, total in zip(("you", "opponent"), totals, strict=False):
        # Each side's table has its own header row just above its rows.
        headers = {}
        for column in STAT_COLUMNS:
            candidates = [b for b in items if is_header(b, column) and b.cy < total.cy]
            if candidates:
                headers[column] = max(candidates, key=lambda b: b.cy).cx
        row = {}
        for item in items:
            if item is total or abs(item.cy - total.cy) > 0.03 or not headers:
                continue
            column = min(headers, key=lambda c: abs(headers[c] - item.cx))
            if abs(headers[column] - item.cx) < 0.035:
                row[column] = _stat_value(item.text)
        result[side] = row
    return result


def _points(row: dict[str, Any] | None) -> int | None:
    value = (row or {}).get("PTS")
    return value if isinstance(value, int) and 0 <= value <= 300 else None


def extract(frame: np.ndarray, kind: ScreenKind, reader: TextReader) -> Observation:
    """Read the values a recognised screen carries."""
    if kind in (ScreenKind.MY_PLAYER, ScreenKind.OPPONENT_PLAYER):
        return Observation(kind=kind, player=read_player_card(frame, reader))

    if kind == ScreenKind.MATCHUP:
        return Observation(
            kind=kind,
            left=_read_matchup_side(frame, MATCHUP_LEFT, reader),
            right=_read_matchup_side(frame, MATCHUP_RIGHT, reader),
            mode=_clean_mode(*_line(frame, MATCHUP_MODE, reader)),
        )

    if kind == ScreenKind.IN_GAME:
        return Observation(
            kind=kind,
            left_score=_score(*_line(frame, SCORE_LEFT, reader)),
            right_score=_score(*_line(frame, SCORE_RIGHT, reader)),
            left_name=_scoreboard_name(*_line(frame, SCORE_NAME_LEFT, reader)),
            right_name=_scoreboard_name(*_line(frame, SCORE_NAME_RIGHT, reader)),
        )

    if kind == ScreenKind.GAME_RESULT:
        outcome = _result_outcome(_boxes(frame, RESULT_TEXT, reader, scale=0.75))
        score_text, score_conf = _line(frame, RESULT_SCORE, reader)
        pair = parse.parse_score(score_text) if score_conf >= 0.7 else None
        return Observation(kind=kind, outcome=outcome, score_pair=pair)

    if kind == ScreenKind.GAME_STATS:
        stats = read_stats_table(frame, reader)
        return Observation(
            kind=kind,
            your_points=_points(stats.get("you")),
            opponent_points=_points(stats.get("opponent")),
            stats=stats or None,
        )

    return Observation(kind=kind)
