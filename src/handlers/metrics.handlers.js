/**
 * Metrics routes and handlers
 */

import { time } from "console";
import { start } from "repl";
import { parse } from "uuid";

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
    const startTime = 1620100800 * 1000
    const hours = 24;
    const msInHour = 60 * 60 * 1000;
    const promises = [];

    for (let hour = 0; hour < hours; hour++) {
      try {
        promises.push(
          this.metricsDao.initialiseDatabase(startTime + (hour * msInHour), startTime + ((hour + 1) * msInHour))
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
    let { service, sliderValue, timeFrame } = req.query

    sliderValue = parseInt(sliderValue)
    timeFrame = parseInt(timeFrame)
    const windowFactor = 6 * timeFrame

    try {
      req = await this.metricsDao.getMinDBTime();
    } catch (err) {
      console.log(err);
      throw err;
    }
    const minTimeStamp = req[0].min_time_stamp

    const timeStamps = (() => {
      let startingTS = -1
      let endingTS = -1

      if (timeFrame === 1) {
        startingTS = minTimeStamp + (sliderValue * 3600) + 20
        endingTS = startingTS + 3600
      } else if (timeFrame === 6) {
        startingTS = minTimeStamp + (6 * sliderValue * 3600) + 20
        endingTS = startingTS + (6 * 3600)
      } else if (timeFrame === 12) {
        startingTS = minTimeStamp + (12 * sliderValue * 3600) + 20
        endingTS = startingTS + (12 * 3600)
      } else {
        startingTS = minTimeStamp
        endingTS = minTimeStamp + (3600 * 24)
      }
      return [startingTS, endingTS]
    })(minTimeStamp, timeFrame);

    try {
      req = await this.metricsDao.queryDatabase(timeStamps[0], timeStamps[1], service, windowFactor);
    } catch (err) {
      console.log(err);
      throw err;
    }
    return req;
  }
}
