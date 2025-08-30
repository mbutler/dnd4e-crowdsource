#!/bin/bash

# DND4E Crowdsource Authentication Setup Script
# This script helps manage users for HTTP Basic Authentication

HTPASSWD_FILE=".htpasswd"
SERVER_PATH="/var/www/iws.mx/4e_crowdsource"

echo "🔐 DND4E Crowdsource Authentication Setup"
echo "=========================================="

# Function to create initial user
create_initial_user() {
    echo "Creating initial user..."
    htpasswd -c $HTPASSWD_FILE $1
    if [ $? -eq 0 ]; then
        echo "✅ User '$1' created successfully!"
    else
        echo "❌ Failed to create user '$1'"
        exit 1
    fi
}

# Function to add additional user
add_user() {
    echo "Adding user '$1'..."
    htpasswd $HTPASSWD_FILE $1
    if [ $? -eq 0 ]; then
        echo "✅ User '$1' added successfully!"
    else
        echo "❌ Failed to add user '$1'"
        exit 1
    fi
}

# Function to list users
list_users() {
    echo "Current users:"
    if [ -f "$HTPASSWD_FILE" ]; then
        cut -d: -f1 $HTPASSWD_FILE
    else
        echo "No users found. Run setup first."
    fi
}

# Function to remove user
remove_user() {
    echo "Removing user '$1'..."
    if [ -f "$HTPASSWD_FILE" ]; then
        # Create temporary file without the user
        grep -v "^$1:" $HTPASSWD_FILE > ${HTPASSWD_FILE}.tmp
        mv ${HTPASSWD_FILE}.tmp $HTPASSWD_FILE
        echo "✅ User '$1' removed successfully!"
    else
        echo "❌ No users file found"
    fi
}

# Function to deploy to server
deploy_to_server() {
    echo "Deploying authentication to server..."
    if [ -f "$HTPASSWD_FILE" ]; then
        scp $HTPASSWD_FILE user@your-server:$SERVER_PATH/
        scp .htaccess user@your-server:$SERVER_PATH/
        echo "✅ Authentication deployed to server!"
    else
        echo "❌ No .htpasswd file found. Create users first."
    fi
}

# Main menu
case "$1" in
    "init")
        if [ -z "$2" ]; then
            echo "Usage: $0 init <username>"
            exit 1
        fi
        create_initial_user $2
        ;;
    "add")
        if [ -z "$2" ]; then
            echo "Usage: $0 add <username>"
            exit 1
        fi
        add_user $2
        ;;
    "list")
        list_users
        ;;
    "remove")
        if [ -z "$2" ]; then
            echo "Usage: $0 remove <username>"
            exit 1
        fi
        remove_user $2
        ;;
    "deploy")
        deploy_to_server
        ;;
    *)
        echo "Usage: $0 {init|add|list|remove|deploy} [username]"
        echo ""
        echo "Commands:"
        echo "  init <username>    - Create first user (creates .htpasswd file)"
        echo "  add <username>     - Add additional user"
        echo "  list               - List all current users"
        echo "  remove <username>  - Remove a user"
        echo "  deploy             - Deploy to server"
        echo ""
        echo "Examples:"
        echo "  $0 init admin      - Create first user 'admin'"
        echo "  $0 add user1       - Add user 'user1'"
        echo "  $0 list            - Show all users"
        echo "  $0 remove user1    - Remove user 'user1'"
        echo "  $0 deploy          - Upload to server"
        ;;
esac
