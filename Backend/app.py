from flask import Flask, jsonify, request
from flask_socketio import SocketIO, join_room, leave_room, emit
from flask_cors import CORS
import logging

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'verysecret'

# Enable Cross-Origin Resource Sharing (CORS)
CORS(app)

# Initialize Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)

# Templates for different code tasks
code_templates = {
    '1': 'async function fetchData() {\n{{code}}\n}',
    '2': 'function findMax(arr) {\n{{code}}\n}}',
    '3': 'function sortArray(arr) {\n{{code}}\n}}',
    '4': 'function renderComponent() {\n{{code}}\n}}'
}

# Dictionaries to store user codes and maintain the order of students in each room
user_codes = {room: {} for room in code_templates}
student_order = {room: [] for room in code_templates}

@app.route('/code_blocks')
def get_code_blocks():
    """
    API endpoint to get a list of available code blocks.
    Each code block has an ID and a title derived from the code template.
    """
    return jsonify([
        {'id': room_id, 'title': code_templates[room_id].replace('{{code}}', '')}
        for room_id in code_templates
    ])

@socketio.on('join')
def on_join(data):
    """
    Event handler for when a user joins a room.
    Assigns the user as a Mentor or Student based on the room state.
    """
    room = str(data['room'])
    user_id = data.get('user_id')

    logging.debug(f"User {user_id} is trying to join room {room}")

    # Initialize room data if not already present
    if room not in user_codes:
        user_codes[room] = {}
        student_order[room] = []

    # Assign roles and initialize user code if necessary
    if user_id not in user_codes[room]:
        user_codes[room][user_id] = ""
        if 'mentor' not in user_codes[room]:
            user_codes[room]['mentor'] = user_id
        else:
            student_order[room].append(user_id)

    role = 'Mentor' if user_codes[room]['mentor'] == user_id else 'Student'
    join_room(room)

    # Initialize code template for students if not already set
    if role == 'Student' and not user_codes[room][user_id]:
        code_with_template = code_templates[room].replace('{{code}}', '')
        user_codes[room][user_id] = code_with_template
    else:
        code_with_template = user_codes[room][user_id]

    # Notify the user of their role and provide the initial code
    emit('role_assigned', {'role': role, 'code': code_with_template}, room=request.sid)

    logging.debug(f"User {user_id} assigned role {role} in room {room}")

    # If the user is a mentor, provide them with all student codes
    if role == 'Mentor' and student_order[room]:
        all_student_codes = {
            f'Student {student_order[room].index(uid) + 1}': user_codes[room][uid]
            for uid in student_order[room]
        }
        emit('all_codes', all_student_codes, room=request.sid)

@socketio.on('update_code')
def on_update_code(data):
    """
    Event handler for when a user updates their code.
    """
    room = data['room']
    code = data['code']
    user_id = data.get('user_id')

    logging.debug(f"User {user_id} is updating code in room {room}")

    # Update the user's code in the room
    user_codes[room][user_id] = code
    formatted_code = code

    # Determine the student's display name
    if user_id in student_order[room]:
        student_name = f'Student {student_order[room].index(user_id) + 1}'
    else:
        student_name = 'Mentor'

    # Notify all users in the room of the code update
    emit('code_updated', {'user_id': user_id, 'student_name': student_name, 'code': formatted_code}, room=room)

@socketio.on('leave')
def on_leave(data):
    """
    Event handler for when a user leaves a room.
    """
    room = data['room']
    user_id = data.get('user_id')
    logging.debug(f"User {user_id} is leaving room {room}")

    # Remove the user from the room data
    if user_id in user_codes[room]:
        del user_codes[room][user_id]
        if user_id in student_order[room]:
            student_order[room].remove(user_id)

    leave_room(room)

    # Notify all users in the room that the user has left
    emit('left', {'user_id': user_id}, room=room)

if __name__ == '__main__':
    # Run the Flask app with SocketIO support
    socketio.run(app, port=5001, debug=True)
