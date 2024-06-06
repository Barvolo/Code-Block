from flask import Flask, jsonify, request
from flask_socketio import SocketIO, join_room, leave_room, emit
from flask_cors import CORS
from pymongo import MongoClient
import redis
import logging
import struct

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'verysecret'

# Set up logging for debugging
logging.basicConfig(level=logging.DEBUG)

# Initialize MongoDB
mongo_client = MongoClient('mongodb://localhost:27017/')
db = mongo_client['code_platform']  

# Initialize Redis
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Enable Cross-Origin Resource Sharing (CORS)
CORS(app)

# Initialize Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

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

    # Fetch room data from Redis
    room_data = redis_client.hgetall(f"room:{room}")

    if not room_data:
        # Initialize room data if not present
        room_data = {
            'room': room,
            'mentor': None,
            'students': {},
            'order': []
        }
    else:
        room_data['students'] = eval(room_data.get('students', '{}'))
        room_data['order'] = eval(room_data.get('order', '[]'))

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
        code_with_template = code_templates.get(room, '').replace('{{code}}', '')
        room_data['students'][user_id] = code_with_template
    else:
        code_with_template = room_data['students'][user_id]

    # Update the room data in Redis
    redis_client.hmset(f"room:{room}", {
        'mentor': room_data['mentor'],
        'students': str(room_data['students']),
        'order': str(room_data['order'])
    })

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
    packet = data['packet']
    user_id = data.get('user_id')

    logging.debug(f"User {user_id} is updating code in room {room}")

    # Read the packet size
    size = struct.unpack('>H', packet[:2])[0]  # Big Endian
    code = packet[2:2+size].decode('utf-8')

    # Fetch room data from Redis
    room_data = redis_client.hgetall(f"room:{room}")
    if room_data:
        room_data['students'] = eval(room_data.get('students', '{}'))
        room_data['order'] = eval(room_data.get('order', '[]'))

        room_data['students'][user_id] = code

        # Update the room data in Redis
        redis_client.hmset(f"room:{room}", {
            'students': str(room_data['students']),
            'order': str(room_data['order'])
        })
        logging.debug(f"Room data updated: {room_data}")

        # Determine the student's display name
        if user_id in room_data['order']:
            student_name = f'Student {room_data["order"].index(user_id) + 1}'
        else:
            student_name = 'Mentor'

        # Notify all users in the room of the code update
        emit('code_updated', {'user_id': user_id, 'student_name': student_name, 'code': code}, room=room)

    # Save the code update to MongoDB for persistence
    db.code_updates.update_one({'room': room, 'user_id': user_id}, {'$set': {'code': code}}, upsert=True)

@socketio.on('leave')
def on_leave(data):
    """
    Event handler for when a user leaves a room.
    """
    room = data['room']
    user_id = data.get('user_id')
    logging.debug(f"User {user_id} is leaving room {room}")

    # Fetch room data from Redis
    room_data = redis_client.hgetall(f"room:{room}")
    if room_data:
        room_data['students'] = eval(room_data.get('students', '{}'))
        room_data['order'] = eval(room_data.get('order', '[]'))

        if user_id in room_data['students']:
            del room_data['students'][user_id]
            if user_id in room_data['order']:
                room_data['order'].remove(user_id)

        # Update the room data in Redis
        redis_client.hmset(f"room:{room}", {
            'students': str(room_data['students']),
            'order': str(room_data['order'])
        })
        logging.debug(f"Room data updated: {room_data}")

    leave_room(room)

    # Notify all users in the room that the user has left
    emit('left', {'user_id': user_id}, room=room)

if __name__ == '__main__':
    # Run the Flask app with SocketIO support
    socketio.run(app, host='0.0.0.0', port=8000, debug=True)
