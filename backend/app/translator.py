"""Pure Morse code translation logic (no web framework dependencies)."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# Letters are separated by one space, words by " / " in generated Morse.
LETTER_SEP = " "
WORD_SEP = " / "

ENG_TO_MORSE: dict[str, str] = {
    # alphabet
    "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.",
    "G": "--.", "H": "....", "I": "..", "J": ".---", "K": "-.-", "L": ".-..",
    "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.",
    "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
    "Y": "-.--", "Z": "--..",
    # digits
    "0": "-----", "1": ".----", "2": "..---", "3": "...--", "4": "....-",
    "5": ".....", "6": "-....", "7": "--...", "8": "---..", "9": "----.",
    # punctuation
    ".": ".-.-.-", ",": "--..--", "?": "..--..", "'": ".----.", "/": "-..-.",
    "(": "-.--.", ")": "-.--.-", ":": "---...", "=": "-...-", "+": ".-.-.",
    "-": "-....-", '"': ".-..-.", "@": ".--.-.", "_": "..--.-", ";": "-.-.-.",
    # non-ITU, but widely used
    "$": "...-..-", "&": ".-...", "!": "-.-.--",
}

MORSE_TO_ENG: dict[str, str] = {v: k for k, v in ENG_TO_MORSE.items()}

UNKNOWN = "?"


@dataclass
class Translation:
    result: str
    invalid: list[str] = field(default_factory=list)


def to_morse(text: str) -> Translation:
    """Translate English text to Morse code.

    Unsupported characters become "?" and are reported (in order) in `invalid`.
    """
    invalid: list[str] = []
    words_out: list[str] = []
    for word in text.upper().split():
        codes: list[str] = []
        for ch in word:
            code = ENG_TO_MORSE.get(ch)
            if code is None:
                invalid.append(ch)
                code = UNKNOWN
            codes.append(code)
        words_out.append(LETTER_SEP.join(codes))
    return Translation(WORD_SEP.join(words_out), invalid)


def _split_words(morse: str) -> list[str]:
    """Split Morse into words on " / " or on 2+ spaces.

    A standalone "/" token is a word separator. Morse codes consist only of
    dots and dashes, so this never clashes with a real letter code.
    """
    tokens = re.split(r"(\s+)", morse.strip())
    words: list[list[str]] = [[]]
    for tok in tokens:
        if not tok:
            continue
        if tok.isspace():
            if len(tok) >= 2 and words[-1]:
                words.append([])
        elif tok == "/":
            if words[-1]:
                words.append([])
        else:
            words[-1].append(tok)
    return [" ".join(w) for w in words if w]


def to_english(morse: str) -> Translation:
    """Translate Morse code to English.

    Letters are separated by a space; words by " / " or two or more spaces.
    Unknown codes become "?" and are reported (in order) in `invalid`.
    """
    invalid: list[str] = []
    words_out: list[str] = []
    for word in _split_words(morse):
        letters: list[str] = []
        for code in word.split():
            ch = MORSE_TO_ENG.get(code)
            if ch is None:
                invalid.append(code)
                ch = UNKNOWN
            letters.append(ch)
        words_out.append("".join(letters))
    return Translation(" ".join(words_out), invalid)
