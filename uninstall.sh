#!/bin/bash

# Get the full path of the script
SCRIPT_PATH=$(realpath "$0")
SCRIPT_DIR="$(dirname "$SCRIPT_PATH")"

# Alert the user about the deletion
echo "Are you sure you want to remove data related to Electron?"
echo "Are you sure you want to proceed? (yes/no)"

# Read user input
read -r confirmation

# Check if the user confirmed the deletion
if [[ "$confirmation" != "yes" ]]; then
    echo "Deletion canceled."
    exit 0
fi

echo "Removing data associated with Electron"

# Delete the electron folder in ~/.config
DATA_DIR="$HOME/.config/electron"
if [[ -d $DATA_DIR ]]; then
    echo "Deleting electron configuration files"
    rm -rf "$DATA_DIR"
fi

# Echo that uninstallation is complete before script self-deletes
echo "Electron is uninstalled."

# Delete the script itself after it finishes
(
    sleep 1
    rm -- "$SCRIPT_PATH"
) &