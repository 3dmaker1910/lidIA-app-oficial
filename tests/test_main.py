import pytest
from fastapi.testclient import TestClient
import sys
sys.path.insert(0, 'backend')
from main import app, PAYMENT_AMOUNT, ACCESS_DURATION_HOURS, _access_store, _make_access_token
from datetime import datetime, timedelta

client = TestClient(app)


def test_root():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"


def test_config_returns_correct_amount():
    r = client.get("/config")
    assert r.status_code == 200
    data = r.json()
    assert data["payment_amount"] == 2.00
    assert data["access_duration_hours"] == 12


def test_payment_amount_is_2_soles():
    assert PAYMENT_AMOUNT == 2.00


def test_access_duration_is_12_hours():
    assert ACCESS_DURATION_HOURS == 12


def test_characters_list():
    r = client.get("/characters")
    assert r.status_code == 200
    chars = r.json()["characters"]
    assert len(chars) == 3
    for c in chars:
        assert c["price"] == 2.00


def test_get_character_lidia():
    r = client.get("/characters/lidia")
    assert r.status_code == 200
    data = r.json()
    assert data["id"] == "lidia"
    assert data["price"] == 2.00


def test_get_character_not_found():
    r = client.get("/characters/unknown")
    assert r.status_code == 404


def test_payment_initiate_requires_name():
    r = client.post("/payment/initiate", json={
        "character_id": "lidia",
        "user_name": "",
        "user_phone": "987654321",
    })
    assert r.status_code == 422


def test_payment_initiate_requires_phone():
    r = client.post("/payment/initiate", json={
        "character_id": "lidia",
        "user_name": "Ana Garcia",
        "user_phone": "",
    })
    assert r.status_code == 422


def test_payment_initiate_success():
    r = client.post("/payment/initiate", json={
        "character_id": "lidia",
        "user_name": "Ana Garcia",
        "user_phone": "987654321",
    })
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert data["amount"] == 2.00
    assert data["access_duration_hours"] == 12
    assert data["yape_number"] == "986083251"
    assert "payment_code" in data


def test_payment_verify_grants_access_token():
    _access_store.clear()
    init_r = client.post("/payment/initiate", json={
        "character_id": "lidia",
        "user_name": "Test User",
        "user_phone": "912345678",
    })
    code = init_r.json()["payment_code"]
    verify_r = client.post("/payment/verify", json={
        "payment_code": code,
        "character_id": "lidia",
    })
    assert verify_r.status_code == 200
    data = verify_r.json()
    assert data["success"] is True
    assert data["status"] == "approved"
    assert "access_token" in data
    assert "expires_at" in data
    assert data["access_duration_hours"] == 12


def test_access_validate_active():
    _access_store.clear()
    init_r = client.post("/payment/initiate", json={
        "character_id": "lidia",
        "user_name": "Test",
        "user_phone": "999111222",
    })
    code = init_r.json()["payment_code"]
    verify_r = client.post("/payment/verify", json={"payment_code": code, "character_id": "lidia"})
    token = verify_r.json()["access_token"]
    val_r = client.post("/access/validate", json={"access_token": token})
    assert val_r.status_code == 200
    assert val_r.json()["active"] is True


def test_access_validate_expired():
    _access_store.clear()
    init_r = client.post("/payment/initiate", json={
        "character_id": "lidia",
        "user_name": "Expired",
        "user_phone": "000000001",
    })
    code = init_r.json()["payment_code"]
    client.post("/payment/verify", json={"payment_code": code, "character_id": "lidia"})
    _access_store[code]["expires_at"] = (datetime.utcnow() - timedelta(hours=1)).isoformat()
    token = _make_access_token(code)
    val_r = client.post("/access/validate", json={"access_token": token})
    assert val_r.status_code == 200
    result = val_r.json()
    assert result["active"] is False
    assert result["reason"] == "expired"


def test_payment_status_pending():
    _access_store.clear()
    init_r = client.post("/payment/initiate", json={
        "character_id": "lidia",
        "user_name": "Pending User",
        "user_phone": "911222333",
    })
    code = init_r.json()["payment_code"]
    status_r = client.get(f"/payment/status/{code}")
    assert status_r.status_code == 200
    assert status_r.json()["status"] == "pending"


def test_payment_status_approved():
    _access_store.clear()
    init_r = client.post("/payment/initiate", json={
        "character_id": "lidia",
        "user_name": "Approved User",
        "user_phone": "922333444",
    })
    code = init_r.json()["payment_code"]
    client.post("/payment/verify", json={"payment_code": code, "character_id": "lidia"})
    status_r = client.get(f"/payment/status/{code}")
    assert status_r.status_code == 200
    data = status_r.json()
    assert data["status"] == "approved"
    assert data["access_active"] is True


def test_payment_status_expired_after_12h():
    _access_store.clear()
    init_r = client.post("/payment/initiate", json={
        "character_id": "lidia",
        "user_name": "Old User",
        "user_phone": "933444555",
    })
    code = init_r.json()["payment_code"]
    client.post("/payment/verify", json={"payment_code": code, "character_id": "lidia"})
    _access_store[code]["expires_at"] = (datetime.utcnow() - timedelta(hours=13)).isoformat()
    status_r = client.get(f"/payment/status/{code}")
    data = status_r.json()
    assert data["status"] == "expired"
    assert data["access_active"] is False
