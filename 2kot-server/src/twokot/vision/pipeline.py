"""Frame -> Observation.

This is the seam where screen reading plugs in. Everything around it (storage,
opponent matching, session tracking, the API) is already built and tested; the
two pieces below need real captured frames before they can be written
honestly:

  * `classify_screen`: which screen a frame shows (matchup, in game, end game).
  * `REGIONS`: where on each screen the name, rating and score sit.

Until then `analyze_frame` raises `NotCalibratedError` rather than guessing.
"""

from __future__ import annotations

from typing import Protocol

import numpy as np

from ..session import Observation, ScreenKind
from . import parse
from .preprocess import Region, crop, prepare_for_ocr


class NotCalibratedError(RuntimeError):
    """Screen reading has not been calibrated against real captures yet."""


class TextReader(Protocol):
    """Any OCR engine: takes a prepared image, returns the text it sees."""

    def read(self, image: np.ndarray) -> str: ...


# Text regions per screen, as fractions of the frame. Deliberately empty: the
# coordinates must be measured from real captures, not invented.
REGIONS: dict[ScreenKind, dict[str, Region]] = {
    ScreenKind.MATCHUP: {},
    ScreenKind.IN_GAME: {},
    ScreenKind.END_GAME: {},
}


def classify_screen(image: np.ndarray) -> ScreenKind:
    raise NotCalibratedError(
        "Screen classification needs labelled sample frames. Import a capture-tool export"
        " with `python -m twokot.dataset import <file.json>` first."
    )


def read_region(image: np.ndarray, region: Region, reader: TextReader) -> str:
    return reader.read(prepare_for_ocr(crop(image, region)))


def analyze_frame(
    image: np.ndarray, reader: TextReader, frame_id: int | None = None
) -> Observation:
    kind = classify_screen(image)
    regions = REGIONS.get(kind, {})
    if kind != ScreenKind.OTHER and not regions:
        raise NotCalibratedError(f"No text regions calibrated for the {kind.value} screen")

    text = {name: read_region(image, region, reader) for name, region in regions.items()}

    if kind == ScreenKind.MATCHUP:
        return Observation(
            kind=kind,
            opponent_name=parse.clean_name(text.get("opponent_name", "")),
            opponent_overall=parse.parse_overall(text.get("opponent_overall", "")),
            opponent_build=parse.clean_name(text.get("opponent_build", "")),
            frame_id=frame_id,
        )
    if kind == ScreenKind.IN_GAME:
        return Observation(
            kind=kind,
            quarter=parse.parse_quarter(text.get("quarter", "")),
            clock=parse.parse_clock(text.get("clock", "")),
            frame_id=frame_id,
        )
    if kind == ScreenKind.END_GAME:
        score = parse.parse_score(text.get("score", ""))
        return Observation(
            kind=kind,
            your_score=score[0] if score else None,
            opponent_score=score[1] if score else None,
            frame_id=frame_id,
        )
    return Observation(kind=ScreenKind.OTHER, frame_id=frame_id)
