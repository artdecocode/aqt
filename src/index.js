import { request as https } from 'https'
import { request as http  } from 'http'
import { debuglog } from 'util'
import erotic from 'erotic'
import { parse } from 'url'
import { version } from '../package.json'
import { getData, exec } from './lib'

const LOG = debuglog('aqt')

/**
 * Request a web page and return information including `headers`, `statusCode`, `statusMessage` along with the `body` (which is also parsed if JSON received).
 * @param {string} address The URL such as http://example.com/api.
 * @param {Config} [config] Configuration for requests.
 * @param {Object} config.data Optional data to send to the server with the request.
 * @param {'form'|'json'} [config.data="'json'"] How to send data: `json` to serialise JSON data and `form` for url-encoded transmission with `json` mode by default. Default `'json'`.
 * @param {Object.<string, string>} [config.headers] Headers to use for the request.
 * @param {string} [config.headers="POST"] What HTTP method to use to send data. Default `POST`.
 * @param {boolean} [config.binary=false] Whether to return a buffer instead of a string. Default `false`.
 * @param {boolean} [config.justHeaders=false] Whether to stop the request after response headers were received, without waiting for the data. Default `false`.
 */
const aqt = async (address, config = {}) => {
  const {
    data: d,
    type = 'json',
    headers: outgoingHeaders = {
      'User-Agent': `Mozilla/5.0 (Node.js) aqt/${version}`,
    },
    binary = false,
    method = 'POST',
    justHeaders = false,
  } = config
  const er = erotic(true)

  const { hostname, protocol, port, path } = parse(address)
  const isHttps = protocol === 'https:'
  const request = isHttps ? https : http

  const options = {
    hostname,
    port,
    path,
    headers: outgoingHeaders,
  }

  let data
  if (d) {
    const _d = getData(type, d)
      ; ({ data } = _d)
    const { contentType } = _d

    options.method = method
    options.headers['Content-Type'] = contentType
    options.headers['Content-Length'] = Buffer.byteLength(data)
  }

  const {
    body, headers, byteLength, statusCode, statusMessage, rawLength,
    parsedBody,
  } = await exec(request, options, {
    data,
    justHeaders,
    binary,
    er,
  })

  LOG('%s %s B%s', address, byteLength, `${byteLength != rawLength ? ` (raw ${rawLength} B)` : ''}`)

  return {
    body: parsedBody ? parsedBody : body,
    headers,
    statusCode,
    statusMessage,
  }
}

export default aqt

/* documentary types/index.xml */
/**
 * @typedef {Object} Config Configuration for requests.
 * @prop {Object} data Optional data to send to the server with the request.
 * @prop {'form'|'json'} [data="'json'"] How to send data: `json` to serialise JSON data and `form` for url-encoded transmission with `json` mode by default. Default `'json'`.
 * @prop {Object.<string, string>} [headers] Headers to use for the request.
 * @prop {string} [headers="POST"] What HTTP method to use to send data. Default `POST`.
 * @prop {boolean} [binary=false] Whether to return a buffer instead of a string. Default `false`.
 * @prop {boolean} [justHeaders=false] Whether to stop the request after response headers were received, without waiting for the data. Default `false`.
 */
