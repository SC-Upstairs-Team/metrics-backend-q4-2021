import qs from "qs";

/**
 * Metrics routes and handlers
 */

export class MetricHandlers {
  constructor({
    db,
    metricsDao
  }) {
    this.db = db;
    this.metricsDao = metricsDao;

    this.routes = this.routes.bind(this);
    this.testData = this.testData.bind(this);
  }

  routes(svc) {
    svc.route({
      method: "*",
      path: "/{p*}",
      handler: {
        proxy: {
          mapUri: (req) => {
            return {
              uri: `http://localhost:4000/${req.params.p}?${qs.stringify(req.query)}`
            };
          },
        }
      },
      options: {
        auth: false
      }
    });

    svc.route({
      method: "*",
      path: "/metrics/test",
      handler: this.testData,
      options: {
        auth: false
      }
    })
  }

  async testData(req, h) {
    try {
      req = await this.metricsDao.insertIntoDB();
    } catch (err) {
      console.log(err);
      throw err;
    }
    return req;
  }
}
