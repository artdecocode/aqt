import { equal, ok, throws } from '@zoroaster/assert'
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
  async 'times out'({ start }) {
    let to
    const url = await start({
      async test(ctx, next) {
        await new Promise(r => {
          to = setTimeout(r, 1000)
        })
        ctx.body = 'ok'
        await next()
      },
    })
    await throws({
      async fn() {
        await aqt(url, {
          timeout: 500,
        })
      },
    })
    clearTimeout(to)
  },
  async 'returns empty json body'({ start }) {
    const url = await start({
      async test(ctx, next) {
        ctx.type = 'application/json'
        ctx.body = ''
        await next()
      },
    })
    const { body } = await aqt(url)
    ok(!body)
  },
  async 'does not throw when type is not given'({ start }) {
    const url = await start({
      test(ctx) {
        ctx.status = 304
      },
    })
    const { body } = await aqt(url)
    ok(!body)
  },
  async 'sets the method without body (no data)'({ start }) {
    const url = await start({
      test(ctx) {
        if (ctx.path == '/' && ctx.method == 'DELETE')
          ctx.body = 'ok'
      },
    })
    const { body } = await aqt(url, {
      method: 'DELETE',
    })
    equal(body, 'ok')
  },
  async 'does not update content-type'({ start }) {
    const url = await start({
      test(ctx) {
        ctx.body = ctx.request.headers['content-type']
          + ' '+ ctx.request.headers['content-length']
      },
    })
    const { body } = await aqt(url, {
      data: 'hello world',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=TEST',
        'Content-Length': 100,
      },
    })
    equal(body, 'multipart/form-data; boundary=TEST 100')
  },
  async 'works with just headers and json'({ start }) {
    const url = await start({
      test(ctx) {
        ctx.body = { ok: '123' }
      },
    })
    const { body, statusCode } = await aqt(url, {
      justHeaders: true,
    })
    equal(body, undefined)
    equal(statusCode, 200)
  },
}

export default T