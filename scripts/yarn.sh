#!/usr/bin/env bash

cd "$(dirname "$0")"

declare -a arr=("twitter-discovery" "twitter-feed" "feed-init" "logstashclient")

for i in "${arr[@]}"
do
  cd ../$i
  yarn upgrade
  yarn link weplay-common
  yarn
done

cd ..
yarn upgrade

for i in "${arr[@]}"
do
  yarn link $i
done
yarn
