import {cleanup} from 'weplay-common'
import LogstashClient from './LogstashClient'

process.title = 'twitter-logstash-client'

const discoveryUrl = process.env.DISCOVERY_URL || 'http://localhost:3010'
const discoveryPort = process.env.DISCOVERY_PORT || 3070
const statusPort = process.env.STATUS_PORT || 8085

const service = new LogstashClient(discoveryUrl, discoveryPort, statusPort)

cleanup(service.destroy.bind(service))
