#!/usr/bin/env bash
set -ex

HERE=$(dirname "$0")
NETWORK=hint_nw
CONTAINER=hint_db

"$HERE"/run-dependencies.sh

# From now on, if the user presses Ctrl+C we should teardown gracefully
trap on_interrupt INT
function on_interrupt() {
  docker stop $CONTAINER
  docker network rm $NETWORK
}

# Wait for Ctrl+C
echo "Ready to use. Press Ctrl+C to teardown."
sleep infinity
