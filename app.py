from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# config
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///tasks.db"
db = SQLAlchemy(app)

# database model
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    done = db.Column(db.Boolean, default=False)


# Routes
@app.route("/tasks", methods=["GET"])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{"id": t.id, "text": t.text, "done": t.done} for t in tasks])

@app.route("/tasks", methods=["POST"])
def add_task():
    data = request.get_json()
    new_task = Task(text=data["text"])
    db.session.add(new_task)
    db.session.commit()
    return jsonify({"id": new_task.id, "text": new_task.text, "done": new_task.done}), 201

@app.route("/tasks/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    
    data = request.get_json()
    
    if "text" in data:
        new_text = (data["text"].strip())

        task.text = new_text

    if "done" in data:
        task.done = bool(data["done"])
        
    db.session.commit()
    return jsonify({"message": "Task updated"})

@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"})

@app.get("/")
def ui():
    return render_template("index.html")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)