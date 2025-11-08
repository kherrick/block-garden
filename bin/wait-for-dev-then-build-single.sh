#!/usr/bin/env bash

npm start 8080 &

echo "Waiting for server on port 8080..."

start_time=$(date +%s)
timeout=120

while true; do
	# Use nc with a 1-second connect timeout (-w 1)
	if nc -z -w 1 localhost 8080; then
		break
	fi

	current_time=$(date +%s)
	elapsed=$((current_time - start_time))

	if [[ $elapsed -gt $timeout ]]; then
		echo "Timeout after ${timeout} seconds waiting for server."
		exit 1
	fi

	sleep 1
	echo "Still waiting..."
done

echo "Server is up! Running build..."
npm run build single
