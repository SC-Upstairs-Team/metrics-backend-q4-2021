import { ensureConn } from "./common";
import axios from "axios";
import config from "config";
axios.defaults.baseURL = "http://localhost:4000" || config.get("data.url");

export class MetricsDao {

  constructor(database) {
    this.database = database;
    this.insertIntoDB = this.insertIntoDB.bind(this);
    this.getFromDataGen = this.getFromDataGen.bind(this);
    this.convertRawData = this.convertRawData.bind(this);
  }

  // Creates path based on paramters, will get the data from the path and return as a promise object
  async getFromDataGen({ serviceType, tsStart, tsEnd, forceRefresh }) {
    const path = `/metrics/${serviceType}?from=${tsStart}&to=${tsEnd}`;
    const rawData = await axios.get(path);
    return rawData;
  }

  // Converts/gathers all approriate data from the original JSON object to insert into the database
  async convertRawData(rawData, opts) {
    const conn = ensureConn(this.database, opts);

    var tempData = [];
    for (let [ts, tsObject] of Object.entries(rawData)) {
      for (let [pod, podObject] of Object.entries(tsObject)) {
        console.log(`${pod}: ${podObject}`)
        tempData.push(podObject.meta.pod)
        tempData.push(podObject.meta.service)
        tempData.push(podObject.ts)
        tempData.push(podObject.http.status)
        const latencyArray = podObject.http.latency

        console.log(latencyArray);
        latencyArray.sort(function (a, b) { return a - b })
        console.log(latencyArray);

        let sum = 0;
        for (let parse of latencyArray) {
          sum += parse;
        }
        let avg = Math.round(sum / latencyArray.length)

        let min = latencyArray[0];
        let max = latencyArray[latencyArray.length - 1];
        let percentile99 = (array => {
          console.log(array);
          var p = ((array.length) - 1) * 0.99;
          var b = Math.floor(p);
          var remainder = p - b;
          if (array[b + 1] !== undefined) {
            return Math.round(array[b] + remainder * (array[b + 1] - array[b]));
          } else {
            return Math.round(array[b]);
          };
        })(latencyArray);
        tempData.push(avg)
        tempData.push(percentile99)
        tempData.push(min)
        tempData.push(max)
        console.log(tempData);
        tempData = [];
        // const { rows } = await conn.query(`
        //   INSERT INTO metrics_data(
        //     pod_id, 
        //     service_type, 
        //     ts, 
        //     http_status, 
        //     avg_latency, 
        //     percentile_99, 
        //     min_latency, 
        //     max_latency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        //   [poID, podObject.meta.service, podObject.ts, podObject.http.status, avg, percentile99, min, max]);
        // if (rows.length === 0) {
        //   return;
        // }
        // return rows[0];
      }

    }
    return tempData;
  }

  async insertIntoDB() {
    const { data } = await this.getFromDataGen({
      serviceType: "cart",
      tsStart: 0,
      tsEnd: 20000
    })
    const refinedData = this.convertRawData(data);
    return data;
  }


  // *For testing purposes* Will insert a single row of dummy data into the metrics database
  // async inputDummyData(opts) {
  //   const conn = ensureConn(this.database, opts);
  //   const { rows } = await conn.query(`
  //     INSERT INTO metrics_data(pod_id, service_type, ts, http_status, avg_latency, percentile_99, min_latency, max_latency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
  //     ["users-ed01a459", "users", 20000, { 200: 56, 401: 6, 403: 6, 404: 6, 499: 3 }, 200, 150, 50, 250]);
  //   if (rows.length === 0) {
  //     return;
  //   }
  //   return rows[0];
  // }

  // *For testing purposes* Will allow the front end to view all of the data within the metrics database and return one row
  // async viewDummyData(opts) {
  //   const conn = ensureConn(this.database, opts);
  //   const { rows } = await conn.query(`
  //     SELECT * 
  //     FROM metrics_data
  //     `);
  //   return rows;
  // }
}