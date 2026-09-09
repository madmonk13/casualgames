#!/bin/bash
# Local test server for the casual games.
# Double-click this file to start it (a Terminal window opens). Press Ctrl+C there to stop.
# Then open:  http://localhost:8000/bowling/
cd "$(dirname "$0")"
echo "Serving: $(pwd)"
echo "Open:    http://localhost:8000/bowling/"
echo "Stop:    Ctrl+C"
echo
python3 -m http.server 8000
