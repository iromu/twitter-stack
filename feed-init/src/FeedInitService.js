import {EventBus, LoggerFactory} from 'weplay-common'
import memwatch from 'memwatch-next'

const uuid = require('uuid/v1')()
const logger = LoggerFactory.get('feed-init-service', uuid)

if (process.env.MEMWATCH) {
  memwatch.on('stats', (stats) => {
    logger.debug('FeedInitService stats', stats)
  })
  memwatch.on('leak', (info) => {
    logger.error('FeedInitService leak', info)
  })
}

class FeedInitService {
  constructor(discoveryUrl, discoveryPort, statusPort, feeds) {
    this.uuid = require('uuid/v1')()
    this.feeds = feeds
    this.bus = new EventBus({
      url: discoveryUrl,
      port: discoveryPort,
      statusPort: statusPort,
      name: 'feed-init',
      id: this.uuid,
      clientListeners: [
        {
          name: 'feed',
          event: 'registered',
          handler: () => {
            logger.info('registered feed')
            this.scheduleLoad()
          }
        },{
          name: 'feed',
          event: 'connect',
          handler: () => {
            logger.info('connected to feed')
            this.scheduleLoad()
          }
        },
        {
          name: 'feed',
          event: 'disconnect',
          handler: () => {
            logger.info('disconnect from feed')
            this.scheduleLoad()
          }
        }
      ]
    }, () => {
      logger.info('FeedInitService connected to discovery server', {
        discoveryUrl,
        uuid: this.uuid
      })
      this.scheduleLoad()
    })

  }
  scheduleLoad(){
    if(!this.timeout){
      this.timeout =  setTimeout(()=>{
        clearTimeout(this.timeout)
        this.load()
      }, 5000)
    }
  }

  load() {
    this.feeds && this.feeds.forEach && this.feeds.forEach((feed) => {
      setTimeout(() => {
        this.bus.streamJoin('feed', feed, 'tweet', (tweet) => {
          this.bus.emit('log', 'data', tweet)
        })
      }, 1000)
    })
  }

  destroy() {
    this.bus.destroy()
  }
}

export default FeedInitService

