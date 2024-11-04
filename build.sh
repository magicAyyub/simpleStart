#!/bin/bash

echo
echo "==========================================="
echo "         Building the Project..."
echo "==========================================="
echo

# Define color variables
RED=$(tput setaf 1)
RESET=$(tput sgr0)

# Step 1: Create a virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "${RED}Failed to create virtual environment!${RESET}"
    exit 1
fi
echo "Done!"
echo

# Step 2: Activate the virtual environment
echo "Activating the virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "${RED}Failed to activate virtual environment!${RESET}"
    exit 1
fi
echo "Done!"
echo

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip
echo "Done!"
echo

# Step 3: Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "${RED}Failed to install dependencies!${RESET}"
    exit 1
fi
echo "Dependencies installed successfully!"
echo

# Step 4: Stop Docker containers
echo "Stopping Docker containers..."
docker-compose down
echo

# Step 5: Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "${RED}Docker failed to start!${RESET}"
    exit 1
fi
echo "Docker containers started!"
echo

echo "Setup is complete."
