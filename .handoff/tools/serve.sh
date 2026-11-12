#!/bin/bash
# static server for public/
cd /Users/flipiris/website
pkill -f "http.server 4010" 2>/dev/null
nohup python3 -m http.server 4010 --bind 127.0.0.1 --directory public >/tmp/http4010.log 2>&1 &
sleep 1; curl -sI http://127.0.0.1:4010/ | head -1
