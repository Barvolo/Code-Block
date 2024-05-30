from flask import Flask, jsonify, request
from flask_socketio import SocketIO, join_room, leave_room, emit
from flask_cors import CORS
from flask_pymongo import PyMongo
import logging
import os

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'verysecret'
app.config["MONGO_URI"] = os.getenv('MONGO_URI', "mongodb://localhost:27017/codeblocks")



mongo = PyMongo(app)


# Enable Cross-Origin Resource Sharing (CORS)
CORS(app)

# Initialize Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)
# Initialize PyMongo with SSL/TLS settings
try:
    mongo = PyMongo(app, tls=True, tlsAllowInvalidCertificates=True)
    logging.info("Successfully connected to MongoDB Atlas")
except Exception as e:
    logging.error(f"Error connecting to MongoDB Atlas: {e}")

# Templates for different code tasks
code_templates = {
    '1': 'function mergeArray(arr1, arr2) {\n{{code}}\n}',
    '2': 'function findMax(arr) {\n{{code}}\n}',
    '3': 'function palindrome(str) {\n{{code}}\n}',
    '4': 'function addToNum(num1, num2) {\n{{code}}\n}'
}

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

    room_data = mongo.db.rooms.find_one({'room': room})
    if not room_data:
        # Initialize room data if not present
        room_data = {
            'room': room,
            'mentor': None,
            'students': {},
            'order': []
        }

    # Assign roles and initialize user code if necessary
    if user_id not in room_data['students']:
        room_data['students'][user_id] = ""
        if not room_data['mentor']:
            room_data['mentor'] = user_id
        else:
            room_data['order'].append(user_id)

    role = 'Mentor' if room_data['mentor'] == user_id else 'Student'
    join_room(room)

    if role == 'Student' and not room_data['students'][user_id]:
        code_with_template = code_templates[room].replace('{{code}}', '')
        room_data['students'][user_id] = code_with_template
    else:
        code_with_template = room_data['students'][user_id]

    # Update the room data in the database
    mongo.db.rooms.update_one({'room': room}, {'$set': room_data}, upsert=True)

    # Notify the user of their role and provide the initial code
    emit('role_assigned', {'role': role, 'code': code_with_template}, room=request.sid)

    logging.debug(f"User {user_id} assigned role {role} in room {room}")

    # If the user is a mentor, provide them with all student codes
    if role == 'Mentor' and room_data['order']:
        all_student_codes = {
            f'Student {room_data["order"].index(uid) + 1}': room_data['students'][uid]
            for uid in room_data['order']
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

    room_data = mongo.db.rooms.find_one({'room': room})

    if room_data:
        room_data['students'][user_id] = code

        # Update the room data in the database
        mongo.db.rooms.update_one({'room': room}, {'$set': room_data})

        # Determine the student's display name
        if user_id in room_data['order']:
            student_name = f'Student {room_data["order"].index(user_id) + 1}'
        else:
            student_name = 'Mentor'

        # Notify all users in the room of the code update
        emit('code_updated', {'user_id': user_id, 'student_name': student_name, 'code': code}, room=room)

@socketio.on('leave')
def on_leave(data):
    """
    Event handler for when a user leaves a room.
    """
    room = data['room']
    user_id = data.get('user_id')
    logging.debug(f"User {user_id} is leaving room {room}")

    room_data = mongo.db.rooms.find_one({'room': room})

    if room_data:
        if user_id in room_data['students']:
            del room_data['students'][user_id]
            if user_id in room_data['order']:
                room_data['order'].remove(user_id)

        # Update the room data in the database
        mongo.db.rooms.update_one({'room': room}, {'$set': room_data})

    leave_room(room)

    # Notify all users in the room that the user has left
    emit('left', {'user_id': user_id}, room=room)

if __name__ == '__main__':
    # Run the Flask app with SocketIO support
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)