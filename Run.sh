#!/bin/bash

echo "Running Backend..."
python Backend/run &
BACKEND_PID=$!

echo "Running Frontend..."
npm --prefix frontend start



