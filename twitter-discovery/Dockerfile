FROM iromu/weplay-common:latest

# Create app directory
RUN mkdir -p /usr/src/app/discovery
WORKDIR /usr/src/app/discovery

COPY . .

# Install app dependencies
RUN yarn install
RUN yarn link weplay-common
RUN yarn

# Setup environment
ENV NODE_ENV production
ENV DISCOVERY_PORT 3080
ENV STATUS_PORT 8080

# Run
CMD [ "yarn", "start" ]
