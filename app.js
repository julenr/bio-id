const https = require('https');
const fs = require('fs');
const path = require('path');
const koa = require('koa');
const convert = require('koa-convert');
const bodyParser = require('koa-bodyparser');
const router = require('koa-simple-router');
const error = require('koa-json-error');
const logger = require('koa-logger');
const koaRes = require('koa-res');
const handleError = require('koa-handle-error');
const serve = require('koa-static');
const mount = require('koa-mount');
// const WebSocket = require('ws');

// const task = require('./controller/task');
// const videoAnalisys = require('./controller/video-analisys');

// const wss = new WebSocket.Server({ port: 8080 });

const port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;
const ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

const app = new koa();

// error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err.message;
    ctx.app.emit('error', err, ctx);
  }
});

app.use(serve('./public'));
// logging
app.use(logger());
// body parsing
app.use(bodyParser({ jsonLimit: '50mb' }));
// format response as JSON
app.use(convert(koaRes()));
// configure router
app.use(
  router(_ => {
    _.get('/api/v1/dummy/dummyfile.json', async ctx => {
      ctx.body = 'hello world';
    }),
      _.get('/throwerror', async ctx => {
        throw new Error('Aghh! An error!');
      });
  })
);

// wss.on('connection', ws => {
//   console.log('WS Connected on port: 8080');
//   ws.on('message', function incoming(message) {
//     console.log('received: %s', message);
//   });
// });

var config = {
  domain: 'openshiftapps.com',
  http: {
    port: 8080,
  },
  https: {
    port: 443,
  },
};

try {
  const httpsServer = https.createServer(config.https.options, app.callback());
  httpsServer.listen(config.https.port, function(err) {
    if (!!err) {
      console.error('HTTPS server FAIL: ', err, err && err.stack);
    } else {
      console.log(
        `HTTPS server OK: http://${config.domain}:${config.https.port}`
      );
    }
  });
} catch (ex) {
  console.error('Failed to start HTTPS server\n', ex, ex && ex.stack);
}

// app.listen(port, () => {
//   console.log('API listening on port 8080');
// });
