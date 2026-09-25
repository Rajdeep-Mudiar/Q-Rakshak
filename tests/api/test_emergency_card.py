import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_emergency_card_data():
    res = client.get('/api/v1/emergency/USR-ALEX/card-data')
    assert res.status_code == 200
    data = res.json()
    assert data['status'] == 'success'
    assert 'card_data' in data
    card = data['card_data']
    assert card['user_id'] == 'USR-ALEX'
    assert 'emergency_phone' in card
    assert 'blood_group' in card

def test_emergency_qr_png():
    res = client.get('/api/v1/emergency/USR-ALEX/qr.png')
    assert res.status_code == 200
    assert res.headers['content-type'] == 'image/png'
    assert len(res.content) > 100

def test_emergency_qr_svg():
    res = client.get('/api/v1/emergency/USR-ALEX/qr.svg')
    assert res.status_code == 200
    assert 'image/svg+xml' in res.headers['content-type']
    assert b'<svg' in res.content
