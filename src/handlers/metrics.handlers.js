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
    this.initialiseDB = this.initialiseDB.bind(this);
    this.getAllData = this.getAllData.bind(this);
    this.deleteRows = this.deleteRows.bind(this);
    this.queryDB = this.queryDB.bind(this);
  }

  routes(svc) {

    svc.route({
      method: "*",
      path: "/metrics/querydb",
      handler: this.queryDB,
      options: {
        auth: false
      }
    })

    // Testing route
    svc.route({
      method: "*",
      path: "/metrics/init",
      handler: this.initialiseDB,
      options: {
        auth: false
      }
    })
    svc.route({
      method: "*",
      path: "/metrics/getdata",
      handler: this.getAllData,
      options: {
        auth: false
      }
    })
    svc.route({
      method: "*",
      path: "/metrics/delete",
      handler: this.deleteRows,
      options: {
        auth: false
      }
    })
  }

  // Initialise datbase wiith one months worth of data
  async initialiseDB(req, h) {
    const hours = 24;
    const msInHour = 60 * 60 * 1000;
    const promises = [];

    for (let hour = 0; hour < hours; hour++) {
      try {
        promises.push(
          this.metricsDao.initialiseDatabase(hour * msInHour, (hour + 1) * msInHour)
          );
      } catch (err) {
        console.log(err);
        throw err;
      }
    }

    await Promise.all(promises);
    return promises
  }

  async getAllData(req, h) {
    try {
      req = await this.metricsDao.getAllDatabaseData();
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

  async queryDB(req, h) {
    const service = "cart"
    const tsStart = 10000 // Add 10 seconds to give a round number of rows (i.e. 360 instead of 361 rows returned)
    const tsEnd = 3600000
    const windowFactor = 6
    try {
      req = await this.metricsDao.queryDatabase(tsStart, tsEnd, service, windowFactor);
    } catch (err) {
      console.log(err);
      throw err;
    }
    return req;
  }
}
