import {EventBus, LoggerFactory} from 'weplay-common'
import memwatch from 'memwatch-next'
import SearchTask from './SearchTask'

const uuid = require('uuid/v1')()
const logger = LoggerFactory.get('feed-service', uuid)
const CHECK_INTERVAL = 5000

if (process.env.MEMWATCH) {
  memwatch.on('stats', (stats) => {
    logger.debug('FeedService stats', stats)
  })
  memwatch.on('leak', (info) => {
    logger.error('FeedService leak', info)
  })
}

class FeedService {
  constructor(discoveryUrl, discoveryPort, statusPort) {
    this.uuid = require('uuid/v1')()
    this.activeSearchs = [] // array of SearchTask instances

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = undefined
    }

    this.checkInterval = setInterval(() => {
      this.gc()
    }, CHECK_INTERVAL)

    this.bus = new EventBus({
      url: discoveryUrl,
      port: discoveryPort,
      statusPort:statusPort,
      name: 'feed',
      id: this.uuid,
      serverListeners: {
        'streamJoinRequested': this.streamJoinRequested.bind(this)
      }
    }, () => {
      logger.info('FeedService connected to discovery server', {
        discoveryUrl,
        uuid: this.uuid
      })
    })
    this.query = process.env.QUERY
    this.track = process.env.TRACK

    if (this.query || this.track) {
      this.addSearchTask(this.query, this.track)
    }
  }

  gc() {
    let i = 1
    let t = this.activeSearchs.length
    this.activeSearchs.forEach((s) => {
      logger.info('Active search ' + (i++) + '/' + t, s.info())
    })
  }

  streamJoinRequested(socket, request) {
    logger.info('streamJoinRequested', {
      socket: socket.id,
      request: JSON.stringify(request)
    })
    let q = request.trim()
    let t = q.split(' ').join(',')
    this.addSearchTask(q, t)
    socket.join({q})
    socket.join({track: t})
  }

  addSearchTask(q, t) {
    console.log('activeSearchs size ' + this.activeSearchs.length)

    let searchTasks = this.activeSearchs.filter((it) => {
      console.log('filter.q ' + it.query + ' vs ' + q)
      console.log('filter.t ' + it.track + ' vs ' + t)
      return it.query === q && it.track === t
    })
    let searchTask = searchTasks[0]
    console.log('searchTasks size ' + searchTasks.length)

    if (searchTask && searchTask.query) {
      console.log('found ' + searchTask.query)
    }
    if (searchTask === undefined) {
      searchTask = new SearchTask(q, t)
      searchTask.on('tweet', (channel, tweet) => {
        this.wrapTwit(channel, tweet)
      })
      this.activeSearchs.push(searchTask)
    }
  }

  wrapTwit(q, tweet) {
    const w = {}
    const created = new Date(tweet.created_at).toISOString()

    // if (tweet.geo || tweet.coordinates || tweet.place) {
    //   logger.debug('geo', tweet.user.geo_enabled, tweet.geo, tweet.coordinates, tweet.place)
    // }

    if (!tweet.coordinates) {
      if (tweet.geo) {
        tweet.coordinates = tweet.geo
      }
    }
    /*if(!tweet.coordinates){
      if(tweet.place && tweet.place.bounding_box){
        tweet.coordinates = tweet.place.bounding_box
      }
    }*/

    // This field only surfaces when the Tweet is a quote Tweet.
    // This attribute contains the Tweet object of the original Tweet that was quoted.
    delete tweet.quoted_status

    // Contains native media (shared with the Tweet user-interface as opposed via a link to elsewhere)
    delete tweet.extended_entities
    delete tweet.extended_tweet
    delete tweet.retweeted_status

    w['query'] = q
    w['timestamp'] = created
    w['message'] = tweet
    this.bus.stream(q, 'tweet', w)
  }

  destroy() {
    this.bus.destroy()
    this.activeSearchs.forEach((s) => s.destroy)
  }
}

export default FeedService

