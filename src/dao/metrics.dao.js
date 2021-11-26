import { ensureConn } from "./common";
import { DBError, DBErrorCode } from "../db";

export class MetricsDao {

  constructor(database) {
    this.database = database;
    this.inputDummyData = this.inputDummyData.bind(this);
  }

  async inputDummyData(opts) {
    console.log("I AM IN THE FUNCTION")
    const conn = ensureConn(this.database, opts);
    const { rows } = await conn.query(`
      INSERT INTO metrics_data(pod_id, service_type, ts, http_status, avg_latency, percentile_99, min_latency, max_latency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      ["users-ed01a939", "users", 10000, { "200": 56, "401": 2, "403": 7, "404": 5, "499": 1 }, 250, 200, 100, 300]);
    if (rows.length === 0) {
      return;
    }
    console.log(rows[0]);
    return rows[0];
  }

  async viewDummyData(opts) {
    console.log("I AM VIEWING")
    const conn = ensureConn(this.database, opts);
    const { rows } = await conn.query(`
      SELECT * 
      FROM metrics_data
      `);
    console.log(rows);
    return rows[0];
  }
}