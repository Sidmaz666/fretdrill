#!/bin/bash
cd /home/z/my-project
export PORT=3000
export HOSTNAME=0.0.0.0
while true; do
  node .next/standalone/server.js
  echo "Server crashed, restarting in 2s..."
  sleep 2
done
