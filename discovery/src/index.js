import {cleanup, Discovery, EventBus, LoggerFactory} from 'weplay-common'
import memwatch from 'memwatch-next'

const uuid = require('uuid/v1')()
const logger = LoggerFactory.get('twitter-discovery', uuid)

process.title = 'twitter-discovery'

if (process.env.MEMWATCH) {
  memwatch.on('stats', (stats) => {
    logger.debug('discovery stats', stats)
  })
  memwatch.on('leak', (info) => {
    logger.error('discovery leak', info)
  })
}
const discoveryPort = process.env.DISCOVERY_PORT || 3010
const statusPort = process.env.STATUS_PORT || 8088

const options = {name: 'discovery', port: discoveryPort, statusPort}
const discovery = new Discovery().server(options)

let serviceCleanup = []
serviceCleanup.push(discovery.destroy.bind(discovery))


cleanup(() => {
  serviceCleanup.forEach((clean) => {
    clean()
  })
  serviceCleanup = []
})
