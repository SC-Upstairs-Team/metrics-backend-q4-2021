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
    this.initialiseData = this.initialiseData.bind(this);
    this.viewAllData = this.viewAllData.bind(this);
    this.deleteRows = this.deleteRows.bind(this);
  }

  routes(svc) {

    svc.route({
      method: "*",
      path: "/metrics/test",
      handler: this.initialiseData,
      options: {
        auth: false
      }
    })
  }

  async initialiseData(req, h) {
    try {
      req = await this.metricsDao.initialiseData(0, 2592000);
    } catch (err) {
      console.log(err);
      throw err;
    }
    return req;
  }

  async viewAllData(req, h) {
    try {
      req = await this.metricsDao.viewData();
    } catch (err) {
      console.log(err);
      throw err;
    }
    return req;
  }

  async deleteRows(req, h) {
    try {
      req = await this.metricsDao.deleteTableRows("metrics_data");
    } catch (err) {
      console.log(err);
      throw err;
    }
    return req;
  }
}
