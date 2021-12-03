import { ensureConn } from "./common";
import axios from "axios";
import config from "config";
axios.defaults.baseURL = "http://localhost:4000" || config.get("data.url");

export class MetricsDao {

  constructor(database) {
    this.database = database;
    this.insertIntoDB = this.insertIntoDB.bind(this);
    this.getFromDataGen = this.getFromDataGen.bind(this);
    this.initialiseData = this.initialiseData.bind(this);
    this.viewData = this.viewData.bind(this);
    this.deleteDatabaseRows = this.deleteTableRows.bind(this);
  }

  // Creates path based on paramters, will get the data from the path and return as a promise object
  async getFromDataGen({ serviceType, tsStart, tsEnd }) {
    const path = `/metrics/${serviceType}?from=${tsStart}&to=${tsEnd}`;
    const rawData = await axios.get(path);
    return rawData;
  }

  // Converts/gathers all approriate data from the original JSON object to insert into the database
  insertIntoDB(rawData, opts) {
    const conn = ensureConn(this.database, opts);
    for (let [ts, tsObject] of Object.entries(rawData)) {
      for (let [pod, podObject] of Object.entries(tsObject)) {
        const latencyArray = podObject.http.latency

        latencyArray.sort(function (a, b) { return a - b })

        let sum = 0;
        for (let parse of latencyArray) {
          sum += parse;
        }
        let avg = Math.round(sum / latencyArray.length)
        let min = Math.round(latencyArray[0]);
        let max = Math.round(latencyArray[latencyArray.length - 1]);

        // Calculates the 99th percentile of the latency array
        let percentile99 = (array => {
          var p = ((array.length) - 1) * 0.99;
          var b = Math.floor(p);
          if (array[b + 1] !== undefined) {
            return Math.round(array[array.length - 1]);
          } else {
            return Math.round(array[b]);
          };
        })(latencyArray);
        const rows = conn.query(`
          INSERT INTO metrics_data(
            pod_id, 
            service_type, 
            ts, 
            http_status, 
            avg_latency, 
            percentile_99, 
            min_latency, 
            max_latency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [podObject.meta.pod, podObject.meta.service, podObject.ts, podObject.http.status, avg, percentile99, min, max]);
        console.log("INSERT SUCCESSFUL! " + podObject.ts)
        if (rows.length === 0) {
          return;
        }
      }
    }
    console.log("IM AT THE FINISH");
    return 1;
  }

  async initialiseData(tsStart, tsEnd, opts) {
    const conn = ensureConn(this.database, opts);

    const { data } = await this.getFromDataGen({
      serviceType: "cart",
      tsStart: tsStart,
      tsEnd: tsEnd
    });

    this.insertIntoDB(data, opts);
    return data;
  }


  // Deletes all rows from the selected table in the database
  async deleteTableRows(tableName, opts) {
    const conn = ensureConn(this.database, opts);
    const { rows } = await conn.query(`
      DELETE FROM ${tableName}
      `);
    console.log("!!! ALL ROWS HAVE BEEN DELETED !!!")
    return rows;
  }

  // *For testing purposes* Will allow the front end to get all rows within the metrics database
  async viewData(opts) {
    const conn = ensureConn(this.database, opts);
    const { rows } = await conn.query(`
      SELECT 
        ts, 
        service_type, 
        ROUND(AVG(avg_latency)) as avg_lat, 
        ROUND(AVG(percentile_99)) as avg_per99,
        ROUND(AVG(min_latency)) as avg_min,
        ROUND(AVG(max_latency)) as avg_max
      FROM metrics_data
      GROUP BY ts, service_type
      ORDER BY ts
      `);
    console.log("!!! VIEWING DATA !!!");
    return rows;
  }
}