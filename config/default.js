module.exports = {
  server: {
    port: process.env.PORT || 3500
  },
  db: {
    host: 'localhost',
    name: 'metrics-backend',
    port: 5432,
    user: 'metrics-backend',
    pass: 'metrics-backend',
    pool: {
      min: 0,
      max: 10
    }
  },
  jwt: {
    signingKey: 'defaultsigningkeydefaultsia',
    expiration: '20m',
    audience: 'metrics-backend',
    subject: 'metrics-backend',
    issuer: 'metrics-backend'
  },
  data: {
    url: "https://sc-upstairs-data-generator.herokuapp.com/"
  }
};
