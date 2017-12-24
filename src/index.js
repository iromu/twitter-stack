import {cleanup, Discovery, LoggerFactory} from 'weplay-common'
import {FeedService} from 'twitter-feed'
import {FeedInitService} from 'feed-init'
import {LogstashClient} from 'logstashclient'

process.title = 'twitter-stack'

const logger = LoggerFactory.get('twitter-stack', 'twitter-stack')
let requestFeedsEnv = process.env.REQUEST_FEEDS
let feeds
if (requestFeedsEnv) {
  feeds = JSON.parse(requestFeedsEnv)
}else{
  feeds = ["#GeoData", "#HappyNewYear"]
}
logger.info('Twitter Environment', {
  consumer_key: process.env.CONSUMER_KEY && true,
  consumer_secret: process.env.CONSUMER_SECRET && true,
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET && true,
  feeds: process.env.REQUEST_FEEDS
})

let serviceCleanup = []

const discoveryPort = process.env.DISCOVERY_PORT || 8010
const statusPort = process.env.STATUS_PORT || 8080

const options = {name: 'discovery', port: discoveryPort, statusPort: statusPort}
const discovery = new Discovery().server(options)
serviceCleanup.push(discovery.destroy.bind(discovery))

const discoveryUrl = process.env.DISCOVERY_URL || 'http://localhost:8010'
const feedPort = process.env.FEED_PORT || 8004
const statusFeedPort = process.env.FEED_STATUS_PORT || 8003

const logPort = process.env.LOG_PORT || 8007
const statusLogPort = process.env.STATUS_PORT || 8085
const log = new LogstashClient(discoveryUrl, logPort, statusLogPort)
serviceCleanup.push(log.destroy.bind(log))

const feed1 = new FeedService(discoveryUrl, feedPort, statusFeedPort)
serviceCleanup.push(feed1.destroy.bind(feed1))

const feed2 = new FeedService(discoveryUrl, feedPort + 20, statusFeedPort + 20)
serviceCleanup.push(feed2.destroy.bind(feed2))

const feedInit = new FeedInitService(discoveryUrl, feedPort + 30, statusFeedPort + 30, feeds)
serviceCleanup.push(feedInit.destroy.bind(feedInit))

cleanup(() => {
  serviceCleanup.forEach((clean) => {
    clean()
  })
  serviceCleanup = []
})



