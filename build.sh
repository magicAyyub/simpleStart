#!/bin/bash

echo
echo "==========================================="
echo "         Building the Project..."
echo "==========================================="
echo

# Step 1: Create a virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo -e "\e[31mFailed to create virtual environment!\e[0m"
    exit 1
fi
echo "Done!"
echo

# Step 2: Activate the virtual environment
echo "Activating the virtual environment..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo -e "\e[31mFailed to activate virtual environment!\e[0m"
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
    echo -e "\e[31mFailed to install dependencies!\e[0m"
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
    echo -e "\e[31mDocker failed to start!\e[0m"
    exit 1
fi
echo "Docker containers started!"
echo

echo "Setup is complete."
