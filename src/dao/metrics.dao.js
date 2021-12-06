import { ensureConn } from "./common";
import axios from "axios";
import config from "config";
import { statSync } from "fs";
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

  // Creates path based on paramters, will get the data from the path
  async getFromDataGen({ serviceType, tsStart, tsEnd }) {
    const path = `/metrics/${serviceType}?from=${tsStart}&to=${tsEnd}`;
    const { data: response } = await axios.get(path);
    return response;
  }

  // Converts/gathers all approriate data from the original JSON object to insert into the database
  async insertIntoDB(rawData, opts) {
    const conn = ensureConn(this.database, opts);
    const results = [];

    for (var ts in rawData) {
      const tsObject = rawData[ts];
      for (var pod in tsObject) {
        const podObject = tsObject[pod];

        // Get latency array from pod object and sort to find min, max, and 99th percentile
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

        const statusArray = podObject.http.status
        var stat_200, stat_400, stat_401, stat_403, stat_404, stat_499, stat_500, stat_502;
        stat_200 = stat_400 = stat_401 = stat_403 = stat_404 = stat_499 = stat_500 = stat_502 = 0;

        for (var [key, value] of Object.entries(statusArray)) {
          switch (key) {
            case '200':
              stat_200 = value;
              break;
            case '400':
              stat_400 = value;
              break;
            case '401':
              stat_401 = value;
              break;
            case '403':
              stat_403 = value;
              break;
            case '404':
              stat_404 = value;
              break;
            case '499':
              stat_499 = value;
              break;
            case '500':
              stat_500 = value;
              break;
            case '502':
              stat_502 = value;
              break;
          }
          
        }
        // Run query to insert each pod objects "converted data" into the database
        const { rows }  = await conn.query(`
          INSERT INTO metrics_data(
            pod_id, 
            service_type, 
            ts, 
            avg_latency, 
            percentile_99, 
            min_latency, 
            max_latency,
            status_200,
            status_400,
            status_401,
            status_403,
            status_404,
            status_499,
            status_500,
            status_502) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
          [podObject.meta.pod, podObject.meta.service, podObject.ts, avg, percentile99, min, max, stat_200, stat_400, stat_401, stat_403, stat_404, stat_499, stat_500, stat_502]);
        console.log(podObject.meta.pod, podObject.meta.service, podObject.ts, avg, percentile99, min, max);
        console.log("INSERT SUCCESSFUL! " + podObject.ts)

        // If there are no rows return an empty array
        if (rows.length === 0) {
          return [];
        }
        results.push(...rows);
      }
    }
    return results;
  }

  async initialiseData(tsStart, tsEnd, opts) {
    const data = await this.getFromDataGen({
      serviceType: "cart",
      tsStart: tsStart,
      tsEnd: tsEnd
    });

    await this.insertIntoDB(data, opts);
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
        ROUND(AVG(max_latency)) as avg_max,
        SUM(status_200) as status_200,
        SUM(status_400) as status_400,
        SUM(status_401) as status_401,
        SUM(status_403) as status_403,
        SUM(status_404) as status_404,
        SUM(status_499) as status_499,
        SUM(status_500) as status_500,
        SUM(status_502) as status_502
      FROM metrics_data
      GROUP BY ts, service_type
      ORDER BY ts
      `);
    console.log("!!! VIEWING DATA !!!");
    return rows;
  }
}