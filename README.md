
# Code Block Editor

A real-time code block editor that allows mentors to view and students to edit code blocks. Built with React for the frontend and Flask for the backend, with MongoDB as the database.

## Features

- Real-time code editing with syntax highlighting
- Role-based access: Mentor and Student
- Mentor can see all students' code
- Students can edit their code blocks
- Test cases to validate student solutions
- Persistent user sessions

## Project Structure

```plaintext
.
├── Backend
│   ├── Dockerfile
│   ├── app.py
│   ├── requirements.txt
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

```bash
git clone https://github.com/Barvolo/Code-Block.git
cd Code-Block
```

### Backend Setup

1. Navigate to the `Backend` directory.

    ```bash
    cd Backend
    ```

2. Install dependencies.

    ```bash
    pip install -r requirements.txt
    ```

3. Run the Flask application.

    ```bash
    python app.py
    ```

### Frontend Setup

1. Navigate to the `frontend` directory.

    ```bash
    cd frontend
    ```

2. Install dependencies.

    ```bash
    npm install
    ```

3. Start the React application.

    ```bash
    npm start
    ```

### Using Docker Compose

1. Ensure you are in the root directory of the project.

2. Build and start the Docker containers.

    ```bash
    docker-compose up --build
    ```

3. Access the frontend at `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```plaintext
MONGO_URI=mongodb://mongo:27017/codeblocks?authSource=admin&connectTimeoutMS=30000&serverSelectionTimeoutMS=30000
REACT_APP_API_URL=http://localhost:8000
```

## Code Structure

### Backend (`app.py`)

- Initializes Flask, Flask-SocketIO, and MongoDB connection
- Defines API endpoints and socket event handlers
- Handles user roles and code updates in real-time

### Frontend (`src`)

- `Lobby.js`: Lists available code blocks
- `CodeEditor.js`: Code editor component with real-time updates
- `useSocket.js`: Custom hook to manage socket connections

### MongoDB Collections

- `rooms`: Stores room data, including mentor and student codes

## API Endpoints

- `GET /code_blocks`: Retrieves a list of available code blocks

## Socket Events

- `join`: User joins a room and is assigned a role
- `update_code`: User updates their code block
- `leave`: User leaves a room

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
