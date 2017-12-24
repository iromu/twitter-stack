import {cleanup, LoggerFactory} from 'weplay-common'
import FeedService from './FeedService'

process.title = 'twitter-feed'

const discoveryUrl = process.env.DISCOVERY_URL || 'http://localhost:3010'
const discoveryPort = process.env.DISCOVERY_PORT || 3040
const statusPort = process.env.STATUS_PORT || 8083

const uuid = require('uuid/v1')()
const logger = LoggerFactory.get('feed-service-main', uuid)

logger.info('Twitter Environment', {
  consumer_key: process.env.CONSUMER_KEY && true,
  consumer_secret: process.env.CONSUMER_SECRET && true,
  access_token: process.env.ACCESS_TOKEN && true,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET && true
})

const service = new FeedService(discoveryUrl, discoveryPort, statusPort)

cleanup(service.destroy.bind(service))
