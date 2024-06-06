#!/bin/bash

# Start Redis server
redis-server &

# Start Flask application
python app.py

