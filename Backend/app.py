from flask import Flask, jsonify
from flask_socketio import SocketIO, join_room, leave_room, emit
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'verysecret'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

room_notes = {}
user_count = {}

@app.route('/code_blocks')
def get_code_blocks():
    return jsonify([
        {'id': 1, 'title': 'Async Case', 'code': 'async function fetchData() {...}'},
        {'id': 2, 'title': 'Array Manipulation', 'code': 'const arr = [1, 2, 3];...'},
        {'id': 3, 'title': 'Event Handling', 'code': 'document.getElementById("btn").addEventListener...'},
        {'id': 4, 'title': 'Conditional Rendering', 'code': 'if (isLoggedIn) {...}'}
    ])

@socketio.on('join')
def on_join(data):
    room = data['room']
    user_count[room] = user_count.get(room, 0) + 1
    join_room(room)
    user_id = user_count[room]
    emit('joined', {'user_id': user_id, 'room': room, 'notes': room_notes.get(room, [])}, room=room)

@socketio.on('leave')
def on_leave(data):
    room = data['room']
    user_id = data['user_id']
    leave_room(room)
    emit('left', {'user_id': user_id}, room=room)

@socketio.on('send_note')
def on_send_note(data):
    room = data['room']
    note = data['note']
    user = data['user']
    room_notes.setdefault(room, []).append({'note': note, 'user': user})
    emit('note_received', {'note': note, 'user': user}, room=room)

if __name__ == '__main__':
    socketio.run(app,port=5001, debug=True)
