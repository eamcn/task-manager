import pytest
from app import create_app, db
from app.models import Task

@pytest.fixture()
def app():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
    })
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture()
def client(app):
    return app.test_client()

def test_get_tasks_empty(client):
    res = client.get("/tasks")
    assert res.status_code == 200
    assert res.get_json() == []

def test_create_task(client, app):
    res = client.post("/tasks", json={"text": "write tests"})
    assert res.status_code == 201
    data = res.get_json()
    assert data["text"] == "write tests"
    assert data["done"] is False

    # verify it’s in the DB
    with app.app_context():
        assert Task.query.count() == 1

def test_update_text(client):
    # create
    created = client.post("/tasks", json={"text": "old"}).get_json()
    tid = created["id"]

    # update
    res = client.patch(f"/tasks/{tid}", json={"text": "new"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["text"] == "new"

def test_toggle_done(client):
    tid = client.post("/tasks", json={"text": "toggle me"}).get_json()["id"]

    # mark done
    res1 = client.patch(f"/tasks/{tid}", json={"done": True})
    assert res1.status_code == 200
    assert res1.get_json()["done"] is True

    # undo
    res2 = client.patch(f"/tasks/{tid}", json={"done": False})
    assert res2.status_code == 200
    assert res2.get_json()["done"] is False

def test_delete_task(client, app):
    tid = client.post("/tasks", json={"text": "delete me"}).get_json()["id"]
    res = client.delete(f"/tasks/{tid}")
    assert res.status_code == 204

    # confirm gone
    res2 = client.get("/tasks")
    ids = [t["id"] for t in res2.get_json()]
    assert tid not in ids

def test_validation_rejects_empty_text_on_create(client):
    res = client.post("/tasks", json={"text": "   "})
    assert res.status_code == 400
    assert "text is required" in res.get_json()["error"]

def test_validation_rejects_empty_text_on_update(client):
    tid = client.post("/tasks", json={"text": "keep"}).get_json()["id"]
    res = client.patch(f"/tasks/{tid}", json={"text": "   "})
    assert res.status_code == 400
