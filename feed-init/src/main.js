import {cleanup} from 'weplay-common'
import FeedInitService from './FeedInitService'

process.title = 'feed-init'

const discoveryUrl = process.env.DISCOVERY_URL || 'http://localhost:3010'
const discoveryPort = process.env.DISCOVERY_PORT || 3050
const statusPort = process.env.STATUS_PORT || 8084

let requestFeedsEnv = process.env.REQUEST_FEEDS
let feeds
if (requestFeedsEnv) {
  feeds = JSON.parse(requestFeedsEnv)
}

const service = new FeedInitService(discoveryUrl, discoveryPort, statusPort, feeds)

cleanup(service.destroy.bind(service))
