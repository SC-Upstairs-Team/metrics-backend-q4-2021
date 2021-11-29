import { ensureConn } from "./common";
import axios from "axios";
axios.defaults.baseURL = "http://localhost:4000";

export class MetricsDao {

  constructor(database) {
    this.database = database;
    this.insertIntoDB = this.insertIntoDB.bind(this);
    this.getFromDataGen = this.getFromDataGen.bind(this);
  }

  async getFromDataGen({serviceType, tsStart, tsEnd, forceRefresh}) {
    const path = `/metrics/${serviceType}?from=${tsStart}&to=${tsEnd}`;
    const rawData = await axios.get(path);
    return rawData;
  }

  async convertRawData() {
    /* TODO: Theo */
  }

  async insertIntoDB() {
    const {data} = await this.getFromDataGen({
      serviceType: "cart",
      tsStart: 0,
      tsEnd: 10000
    })
    return data;
  }

  // async inputDummyData(opts) {
  //   const conn = ensureConn(this.database, opts);
  //   const { rows } = await conn.query(`
  //     INSERT INTO metrics_data(pod_id, service_type, ts, http_status, avg_latency, percentile_99, min_latency, max_latency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
  //     ["users-ed01a939", "users", 10000, { "200": 56, "401": 2, "403": 7, "404": 5, "499": 1 }, 250, 200, 100, 300]);
  //   if (rows.length === 0) {
  //     return;
  //   }
  //   return rows[0];
  // }

  // async viewDummyData(opts) {
  //   const conn = ensureConn(this.database, opts);
  //   const { rows } = await conn.query(`
  //     SELECT * 
  //     FROM metrics_data
  //     `);
  //   return rows[0];
  // }
}