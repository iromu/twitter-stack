FROM iromu/weplay-common:latest

# Create app directory
RUN mkdir -p /usr/src/app/feed
WORKDIR /usr/src/app/feed

COPY . .

# Install app dependencies
RUN yarn install
RUN yarn link weplay-common
RUN yarn

# Setup environment
ENV NODE_ENV production
ENV DISCOVERY_URL "http://discovery:3080"

# Run
CMD ["yarn", "start"]
