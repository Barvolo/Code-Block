#!/bin/bash

# Build frontend
echo "Building frontend..."
cd frontend && nixpacks build ./
cd ..

# Build backend
echo "Building backend..."
cd backend && nixpacks build ./
cd ..

