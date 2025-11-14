#!/usr/bin/env bash

npm start 8080 &

sleep 1
echo "Waiting for server on port 8080..."
sleep 1

start_time=$(date +%s)
timeout=120

while true; do
	# Use nc with a 5-second connect timeout (-w 5)
	if nc -z -w 5 localhost 8080; then
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
