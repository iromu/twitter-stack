import {EventBus, LoggerFactory} from 'weplay-common'
import memwatch from 'memwatch-next'
import Logstash from 'logstash-client'
import {join} from 'path'
import fs from 'fs'

const uuid = require('uuid/v1')()

var logStream = fs.createWriteStream( join(process.cwd(), 'tweets.txt'), {'flags': 'a'})
const logger = LoggerFactory.get('twitter-logstash-client', uuid)

if (process.env.MEMWATCH) {
  memwatch.on('stats', (stats) => {
    logger.debug('LogstashClient stats', stats)
  })
  memwatch.on('leak', (info) => {
    logger.error('LogstashClient leak', info)
  })
}

const logstashUri = process.env.LOGSTASH_URI || 'localhost:5000'

const pieces = logstashUri.split(':')
const host = pieces[0]
const port = pieces[1] || 5000

class LogstashClient {
  constructor(discoveryUrl, discoveryPort, statusPort, logstashDisabled) {
    this.uuid = require('uuid/v1')()
    const listeners = {
      'data': (socket, data) => {
        logStream.write(JSON.stringify(data) + '\n');
        if(!logstashDisabled)
          this.logstash.send(data)
        else
          logger.info(data)
      }
    }
    logger.info('LogstashClient connecting to ', logstashUri)
    if (!logstashDisabled) {
      this.logstash = new Logstash({
        type: 'tcp', // udp, tcp, memory
        host,
        port,
        maxQueueSize: 100 // 1000
      })
    }

    this.bus = new EventBus({
      url: discoveryUrl,
      port: discoveryPort,
      statusPort: statusPort,
      name: 'log',
      id: this.uuid,
      serverListeners: listeners,
      clientListeners: [
        {
          name: 'feed',
          event: 'connect',
          handler: () => {
            logger.info('LogstashClient connected to feed. Do nothing')
          }
        }]
    }, () => {
      logger.info('LogstashClient connected to discovery server', {
        discoveryUrl,
        uuid: this.uuid
      })
    })
  }

  destroy() {
    this.bus.destroy()
    logStream.end()
  }
}

export default LogstashClient
