import { ensureConn } from "./common";
import axios from "axios";
import config from "config";
axios.defaults.baseURL = "http://localhost:4000" || config.get("data.url");

export class MetricsDao {

  constructor(database) {
    this.database = database;
    this.insertIntoDB = this.insertIntoDB.bind(this);
    this.generateData = this.generateData.bind(this);
    this.initialiseDatabase = this.initialiseDatabase.bind(this);
    this.getAllDatabaseData = this.getAllDatabaseData.bind(this);
    this.deleteTableRows = this.deleteTableRows.bind(this);
  }

  // Creates path based on paramters, will get the data from the path
  async generateData({ serviceType, tsStart, tsEnd }) {
    const path = `/metrics/${serviceType}?from=${tsStart}&to=${tsEnd}`;
    const { data: response } = await axios.get(path);
    return response;
  }

  // Converts/gathers all approriate data from the original JSON object to insert into the database
  async insertIntoDB(rawData, opts) {
    const conn = ensureConn(this.database, opts);

    const pgprom = require('pg-promise')({
      capSQL: true
    });
    const colSet = new pgprom.helpers.ColumnSet(['pod_id', 'service_type', 'ts', 'avg_latency', 'percentile_99', 'min_latency', 'max_latency', 'status_200', 'status_400', 'status_401', 'status_403', 'status_404', 'status_499', 'status_500', 'status_502'], { table: 'metrics_data' })

    const results = [];
    let tsArray = []

    for (const ts in rawData) {
      const tsObject = rawData[ts];

      for (const pod in tsObject) {
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
          let p = ((array.length) - 1) * 0.99;
          let b = Math.floor(p);
          if (array[b + 1] !== undefined) {
            return Math.round(array[array.length - 1]);
          } else {
            return Math.round(array[b]);
          };
        })(latencyArray);

        const statusArray = podObject.http.status
        let stat_200, stat_400, stat_401, stat_403, stat_404, stat_499, stat_500, stat_502;
        stat_200 = stat_400 = stat_401 = stat_403 = stat_404 = stat_499 = stat_500 = stat_502 = 0;

        // Flatten the http status object to insert into the database
        for (let [key, value] of Object.entries(statusArray)) {
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
        let tempArray = {
          'pod_id': podObject.meta.pod,
          'service_type': podObject.meta.service,
          'ts': podObject.ts,
          'avg_latency': avg,
          'percentile_99': percentile99,
          'min_latency': min,
          'max_latency': max,
          'status_200': stat_200,
          'status_400': stat_400,
          'status_401': stat_401,
          'status_403': stat_403,
          'status_404': stat_404,
          'status_499': stat_499,
          'status_500': stat_500,
          'status_502': stat_502
        }
        tsArray.push(tempArray)
      }
      const insertQuery = pgprom.helpers.insert(tsArray, colSet) + " RETURNING *"
      const { rows } = await conn.query(insertQuery)

      // If there are no rows return an empty array
      if (rows.length === 0) {
        return [];
      }
      tsArray = [];
      results.push(rows);
    }
    return results;
  }

  // Initliase the database with 24 hours worth of data for all services
  async initialiseDatabase(tsStart, tsEnd, opts) {
    const services = ["authorization", "users", "cart", "products", "suggestions", "billing"]
    const all_data = [];
    for (let i = 0; i < services.length; i++) {
      const service_data = await this.generateData({
        serviceType: services[i],
        tsStart: tsStart,
        tsEnd: tsEnd
      });
      await this.insertIntoDB(service_data, opts);
    }
    return all_data;
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
  async getAllDatabaseData(opts) {
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
      ORDER BY service_type, ts
      `);
    console.log("!!! VIEWING DATA !!!");
    return rows;
  }

  /**
   * Query the database for a specifc time frame for a specific service
   * @param tsStart {int} 
   * @param tsEnd {int} 
   * @param service {string} the service type that is selected
   * @param windowFactor {int} factor of 6 to consense the number of rows to 61
   * @param opts {ServiceCallOpts?} options for this service function call
   * @return {Account} found account
   */
  async queryDatabase(tsStart, tsEnd, service, windowFactor, opts) {
    const conn = ensureConn(this.database, opts);
    const { rows } = await conn.query(`
      SELECT 
        min(ts) as ts_point, 
        ROUND(AVG(average_latency)) AS avg_lat,
        MAX(average_per99) AS avg_per99,
        MIN(minimum_lat) AS min_lat,
        MAX(maximum_lat) AS max_lat
      FROM (
        SELECT 
          ts,
          AVG(avg_latency) as average_latency,
          MAX(percentile_99) as average_per99,
          MIN(min_latency) as minimum_lat,
          MAX(max_latency) as maximum_lat,
          ROW_NUMBER() OVER (ORDER BY ts) AS n
        FROM metrics_data
        WHERE (ts BETWEEN ${tsStart} AND ${tsEnd}) AND service_type = '${service}'
        GROUP BY ts
      ) x(ts, average_latency, average_per99, minimum_lat, maximum_lat, n)
      GROUP BY n/${windowFactor}
      ORDER BY n/${windowFactor}
        ;`);
    console.log(`!!! QUERY DATA for ${service} between ${tsStart} and ${tsEnd} !!!`);
    return rows;
  }
}