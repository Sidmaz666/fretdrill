#!/bin/bash
cd /home/z/my-project
export PORT=3000
export HOSTNAME=0.0.0.0
while true; do
  node .next/standalone/server.js
  echo "[$(date)] Server exited, restarting in 3s..." >> /home/z/my-project/server-restart.log
  sleep 3
done
