from fastapi.testclient import TestClient

from app.main import MAX_INPUT_LEN, app

client = TestClient(app)


def test_health():
    assert client.get("/api/health").json() == {"status": "ok"}


def test_to_morse_endpoint():
    r = client.post("/api/to-morse", json={"text": "sos!"})
    assert r.status_code == 200
    assert r.json() == {"result": "... --- ... -.-.--", "invalid": []}


def test_to_english_endpoint():
    r = client.post("/api/to-english", json={"text": "... --- ... / ?"})
    assert r.status_code == 200
    assert r.json() == {"result": "SOS ?", "invalid": ["?"]}


def test_missing_field_is_422():
    assert client.post("/api/to-morse", json={}).status_code == 422


def test_too_long_is_422():
    r = client.post("/api/to-morse", json={"text": "a" * (MAX_INPUT_LEN + 1)})
    assert r.status_code == 422


def test_root_is_api_info_not_frontend():
    r = client.get("/")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/json")
    assert r.json()["docs"] == "/docs"


def test_frontend_files_not_served():
    assert client.get("/index.html").status_code == 404
