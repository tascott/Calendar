#!/bin/sh
cd /usr/src/app/backend && node index.js &
cd /usr/src/app && npx serve -s build -l 3000
