#!/usr/bin/env bash

cd ./discovery
npm update
npm build

cd ../twitter-feed/
npm update
npm build

cd ../feed-init/
npm update
npm build

cd ../logstashclient/
npm update
npm build


cd ..
npm update
npm build
