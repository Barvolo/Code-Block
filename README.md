
# Code Block Editor

A real-time code block editor that allows mentors to view and students to edit code blocks. Built with React for the frontend and Flask for the backend, with MongoDB and Redis used for data storage.

## Features

- Real-time code editing with syntax highlighting
- Role-based access: Mentor and Student
- Mentor can see all students' code in real-time
- Students can edit their code blocks
- Test cases to validate student solutions with visual feedback
- Persistent user sessions using local storage
- Dockerized setup for easy deployment

## Project Structure

```
.
├── Backend
│   ├── Dockerfile
│   ├── app.py
│   ├── requirements.txt
│   ├── entrypoint.sh
│   └── ...
├── frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   ├── src
│   │   ├── App.js
│   │   ├── CodeEditor.js
│   │   ├── hooks
│   │   │   └── useSocket.js
│   │   ├── index.js
│   │   ├── Lobby.js
│   │   └── ...
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Docker
- Docker Compose

## Getting Started

### Clone the Repository

```sh
git clone https://github.com/barvolo/Code-Block.git
cd Code-Block
```

### Backend Setup

Navigate to the Backend directory.

```sh
cd Backend
```

Install dependencies.

```sh
pip install -r requirements.txt
```

Run the Flask application.

```sh
python app.py
```

### Frontend Setup

Navigate to the frontend directory.

```sh
cd frontend
```

Install dependencies.

```sh
npm install
```

Start the React application.

```sh
npm start
```

### Using Docker Compose

Ensure you are in the root directory of the project.

Build and start the Docker containers.

```sh
docker-compose up --build
```

Access the frontend at [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```
NODE_OPTIONS=--openssl-legacy-provider
REACT_APP_API_URL=http://localhost:8000
MONGODB_URI=your_mongodb_connection_string_here
```

## Code Structure

### Backend (`app.py`)

- Initializes Flask, Flask-SocketIO, and sets up MongoDB and Redis for data storage
- Defines API endpoints and socket event handlers
- Handles user roles and code updates in real-time
- Implements a throttle decorator to manage the rate of incoming requests

### Frontend (`src`)

- **App.js**: Main entry point of the React application
- **CodeEditor.js**: Code editor component with real-time updates, run and test functionality, and visual feedback for test results
- **Lobby.js**: Lists available code blocks and allows users to join a session
- **useSocket.js**: Custom hook to manage socket connections and real-time data synchronization
- **CodeEditor.css**: CSS file for styling the code editor

### Socket Events

- `join`: User joins a room and is assigned a role (Mentor or Student)
- `update_code`: User updates their code block and changes are synchronized in real-time
- `leave`: User leaves a room

## API Endpoints

- `GET /code_blocks`: Retrieves a list of available code blocks

## MongoDB Collections

- **rooms**: Stores room data, including mentor and student codes

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
