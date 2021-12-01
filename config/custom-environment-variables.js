module.exports = {
  server: {
    port: 'SERVER_PORT'
  },
  db: {
    host: 'PG_HOST',
    name: 'PG_NAME',
    port: 'PG_PORT',
    user: 'PG_USER',
    pass: 'PG_PASS',
    pool: {
      min: 'PG_POOL_MIN',
      max: 'PG_POOL_MAX'
    }
  },
  jwt: {
    signingKey: 'JWT_SIGNING_KEY',
    expiration: 'JWT_EXPIRATION',
    audience: 'JWT_AUDIENCE',
    subject: 'JWT_SUBJECT',
    issuer: 'JWT_ISSUER'
  },
  data: {
    url: "DATA_URL"
  }
};
