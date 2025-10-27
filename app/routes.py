from flask import Blueprint, jsonify, render_template, request
from . import db
from .models import Task
from datetime import datetime

main_bp = Blueprint("main", __name__)

# UI
@main_bp.route("/")
def ui():
    return render_template("index.html")

# API ROUTES
@main_bp.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = Task.query.order_by(Task.id).all()
    return jsonify([{"id": t.id, "text": t.text, "done": t.done, "due_date": t.due_date.isoformat() if t.due_date else None} for t in tasks])

@main_bp.route("/tasks", methods=["POST"])
def add_task():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400

    # Parse optional due_date
    due_date = None
    if data.get("due_date"):
        try:
            due_date = datetime.fromisoformat(data["due_date"])
        except (ValueError, TypeError):
            pass  # Invalid date format, will be stored as None

    t = Task(text=text, due_date=due_date)
    db.session.add(t)
    db.session.commit()
    return jsonify({"id": t.id, "text": t.text, "done": t.done, "due_date": t.due_date.isoformat() if t.due_date else None}), 201

@main_bp.route("/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True) or {}

    if "text" in data:
        new_text = (data["text"] or "").strip()
        if not new_text:
            return jsonify({"error": "text cannot be empty"}), 400
        task.text = new_text

    if "done" in data:
        task.done = bool(data["done"])

    if "due_date" in data:
        if data["due_date"]:
            try:
                task.due_date = datetime.fromisoformat(data["due_date"])
            except (ValueError, TypeError):
                pass  # Invalid date format, leave unchanged
        else:
            task.due_date = None

    db.session.commit()
    return jsonify({"id": task.id, "text": task.text, "done": task.done, "due_date": task.due_date.isoformat() if task.due_date else None}), 200

@main_bp.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return "", 204
