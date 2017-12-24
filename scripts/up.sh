#!/usr/bin/env bash

cd "$(dirname "$0")"

unset ${!DOCKER_*}

docker-compose -f ../docker-compose.yml up --build
