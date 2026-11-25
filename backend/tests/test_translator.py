from app.translator import to_english, to_morse


def test_to_morse_basic():
    t = to_morse("SOS")
    assert t.result == "... --- ..."
    assert t.invalid == []


def test_to_morse_words_and_case():
    assert to_morse("hi there").result == ".... .. / - .... . .-. ."


def test_to_morse_collapses_extra_whitespace():
    assert to_morse("  a   b ").result == ".- / -..."


def test_to_morse_invalid_chars_reported_in_order():
    t = to_morse("a{b}")
    assert t.result == ".- ? -... ?"
    assert t.invalid == ["{", "}"]


def test_to_morse_apostrophe():
    assert to_morse("it's").result == ".. - .----. ..."


def test_to_english_slash_separator():
    t = to_english(".... .. / - .... . .-. .")
    assert t.result == "HI THERE"
    assert t.invalid == []


def test_to_english_double_space_separator():
    # Format used by the original app.
    assert to_english(".-  -... -.-.    ...-..-").result == "A BC $"


def test_to_english_invalid_codes():
    t = to_english(".- ...... {")
    assert t.result == "A??"
    assert t.invalid == ["......", "{"]


def test_round_trip():
    text = "HELLO, WORLD! 123 (A+B=C) @ME"
    assert to_english(to_morse(text).result).result == text


def test_empty():
    assert to_morse("").result == ""
    assert to_english("   ").result == ""
