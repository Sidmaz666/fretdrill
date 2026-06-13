#!/bin/bash
cd /home/z/my-project
while true; do
  rm -f .next/dev/lock
  NODE_ENV=production bun .next/standalone/server.js 2>&1
  sleep 2
done
