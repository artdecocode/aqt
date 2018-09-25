import { equal, ok } from 'zoroaster/assert'
import aqt from '../../src'
import IdioContext from '../context/idio'

/** @type {Object.<string, (h: IdioContext)>} */
const T = {
  context: IdioContext,
  async 'requests data from server'({ start }) {
    const url = await start({
      async test(ctx, next) {
        ctx.body = 'ok'
        await next()
      },
    })
    const { body, statusCode, statusMessage } = await aqt(url)
    equal(body, 'ok')
    equal(statusCode, 200)
    equal(statusMessage, 'OK')
  },
  async 'requests compressed data from server'({ start }) {
    let res
    const url = await start({
      /** @type {import('koa').Middleware} */
      async test(ctx, next) {
        res = ctx.acceptsEncodings('gzip')
        await next()
      },
      compress: {
        use: true,
      },
      static: {
        root: 'test/fixture',
        use: true,
      },
    })
    const {
      body,
      statusCode,
      statusMessage,
    } = await aqt(`${url}/chapter1.txt`)
    ok(/Just then a heavy cloud passed across the face of the moon/.test(body))
    equal(statusCode, 200)
    equal(statusMessage, 'OK')
    equal(res, 'gzip')
  },
  async 'requests uncompressed data from server'({ start }) {
    let res
    const url = await start({
      /** @type {import('koa').Middleware} */
      async test(ctx, next) {
        res = ctx.acceptsEncodings('gzip')
        await next()
      },
      compress: {
        use: true,
      },
      static: {
        root: 'test/fixture',
        use: true,
      },
    })
    const {
      body,
      statusCode,
      statusMessage,
    } = await aqt(`${url}/chapter1.txt`, {
      compress: false,
    })
    ok(/Just then a heavy cloud passed across the face of the moon/.test(body))
    equal(statusCode, 200)
    equal(statusMessage, 'OK')
    ok(!res)
  },
}

export default T