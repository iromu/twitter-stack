//import fps from 'fps'
import Twit from 'twit'
import EventEmitter from 'events'
import {LoggerFactory} from 'weplay-common'

import querystring from 'querystring'

const uuid = require('uuid/v1')()
const logger = LoggerFactory.get('feed-service', uuid)

class SearchTask extends EventEmitter {
  constructor(query, track) {
    super()
    this.count = 0
    this.emitted = 0
    this.query = query
    this.track = track
    this.T = new Twit({
      consumer_key: process.env.CONSUMER_KEY,
      consumer_secret: process.env.CONSUMER_SECRET,
      access_token: process.env.ACCESS_TOKEN,
      access_token_secret: process.env.ACCESS_TOKEN_SECRET,
      timeout_ms: 60 * 1000  // optional HTTP request timeout to apply to all requests.
    })

    // this.ticker = fps({every: 100})
    // this.ticker.on('data', r => logger.info('SearchTask fps %s q: %s t: %s', Math.floor(r), JSON.stringify(this.query), JSON.stringify(this.track)))

    try {
      this.stream(this.query, this.track)
      this.search(this.query, this.track)
    } catch (e) {
      logger.error('error on search')
    }
  }

  stream(q, t) {
    // Stream subscription
    const stream = this.T.stream('statuses/filter', {track: t})
    stream.on('tweet', tweet => {
      this.emitTwit({track: t}, tweet)
    })
    stream.on('end', logger.error)
    stream.on('limit', logger.error)
    stream.on('warning', logger.info)
  }

  search(q, t) {
    this.T.get('application/rate_limit_status', {resources: ['search']}, (err, data) => {
      if (err) logger.error(err)
      logger.debug('rate_limit_status data ', data)
      if (data.errors) {
        logger.error('Suspending search')
        setTimeout(() => this.search(q, t), 300000)
      } else {
        this.remaining = data.resources.search['/search/tweets'].remaining
        this.reset = data.resources.search['/search/tweets'].reset
        return this.searchSafe(q, t)
      }
    })
  }

  searchSafe(q, t) {
    this.T.get('search/tweets', {
      q,
      count: 100
    }, (err, data, response) => {
      if (err) {
        logger.error(err)
      } else {
        data.statuses.forEach(tweet => this.emitTwit({q}, tweet))
        logger.debug('search', q)
        if (data.search_metadata.next_results) {
          setTimeout(() => {
            this.searchNextTweets(this.query, data.search_metadata)
          }, 2000)
        }
      }
    })
  }

  searchNextTweets(q, search_metadata) {
    if (this.remaining > 0) {
      return this.searchNextTweetsSafe(q, search_metadata)
    } else {
      this.T.get('application/rate_limit_status', {resources: ['search']}, (err, data, response) => {
        if (err) logger.error(err)
        logger.debug('rate_limit_status', data)
        this.remaining = data.resources.search['/search/tweets'].remaining
        this.reset = data.resources.search['/search/tweets'].reset
        if (this.remaining > 0) {
          return this.searchNextTweetsSafe(q, search_metadata)
        } else {
          console.error('Scheduling search', Date.now() - this.reset)
          setTimeout(() => {
            this.searchNextTweets(q, search_metadata)
          }, Date.now() - this.reset)
        }
      })
    }
  }

  searchNextTweetsSafe(q, search_metadata) {
    this.count++
    let next_max_id = querystring.parse(search_metadata.next_results)['?max_id']
    if (next_max_id) {
      this.T.get('search/tweets', {
        q,
        max_id: next_max_id,
        count: 100
      }, (err, data, response) => {
        if (err) logger.error(err)
        if (data.statuses) {
          data.statuses.forEach(tweet => this.emitTwit({q}, tweet))
        }
        logger.debug('searchNextTweets', this.count, next_max_id, q)
        if (data.search_metadata && data.search_metadata.next_results) {
          this.last_max_id = next_max_id
          this.searchNextTweets(q, data.search_metadata)
        }
      })
    }
  }

  info() {
    return {
      last_max_id: this.last_max_id,
      query: this.query,
      track: this.track,
      count: this.count,
      lastTwit: this.lastTwit,
      emitted: this.emitted,
      remaining: this.remaining
    }
  }

  emitTwit(q, tweet) {
    this.emitted++
    this.remaining--
    // this.ticker && this.ticker.tick()
    this.lastTwit = Date.now()
    this.emit('tweet', q, tweet)
  }

  destroy() {
    this.T.destroy()
  }
}

export default SearchTask

