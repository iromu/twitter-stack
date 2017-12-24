#!/usr/bin/env bash

cd "$(dirname "$0")"

unset ${!DOCKER_*}

declare -a arr=("discovery" "twitter-feed" "feed-init" "logstashclient")

for i in "${arr[@]}"
do
  docker build --no-cache -t iromu/$i:latest ../$i
done
