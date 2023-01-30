const express = require('express');
const next = require('next');
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3500;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const cookieParser = require('cookie-parser');
const compression = require('compression');
const logger = require('morgan');
const url = require('url');

const getDataFromCookie = req => {
  const { accessToken } = req.params;
  if (accessToken) return { accessToken };

  if (req.cookies) return { accessToken: req.cookies.snappyModJwt };
  return {};
};

const authenticated = (req, res, next) => {
  const { accessToken } = getDataFromCookie(req);

  if (req.params.accessToken) {
    req.accessToken = req.params.accessToken;
    res.cookie('snappyModJwt', req.accessToken, { sameSite: 'Lax' });
    return res.redirect('/tracking');
  }

  if (accessToken) {
    req.accessToken = accessToken;
    if (req.route.path === '/') return res.redirect('/tracking');
    return next();
  }

  if (req.route.path !== '/') return res.redirect(url.format({ pathname: '/', query: { path: req.originalUrl } }));

  return next();
};

const customRender = (req, res) => {
  const pathname = req.route.path;

  const realPath = pathname.replace(/(\/:businessId)/, '');
  const query = { ...req.query, ...req.params, accessToken: req.accessToken };
  return app.render(req, res, realPath, query);
};

app
  .prepare()
  .then(() => {
    const server = express();
    const morganMode = dev ? 'dev' : 'common';

    server.use(cookieParser());
    server.use(compression());
    !dev && server.use(logger(morganMode));

    server.get(/^\/.*\.(png|svg|css|ttf|jpg|ico|woff2)$/, (_, res, next) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      next();
    });

    server.get('/', authenticated, customRender);

    server.get('*', (req, res) => {
      return handle(req, res);
    });

    if (dev) process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

    server.listen(port, err => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch(ex => {
    console.error(ex.stack);
    process.exit(1);
  });
