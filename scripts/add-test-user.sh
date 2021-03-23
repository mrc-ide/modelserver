#!/usr/bin/env bash

NETWORK=hint_nw
HERE=$(realpath "$(dirname $0)")
TEST_CONFIG=$HERE/../src/app/static/scripts/test.properties

image=mrcide/hint-user-cli:master
docker pull $image
docker run --network=hint_nw \
		-v $TEST_CONFIG:/etc/hint/config.properties \
		$image \
		add-user test.user@example.com password
