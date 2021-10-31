/**
 * Common service tests
 *
 * @group unit
 * @group unit/services/common
 */

import {IDatabase, ITx} from "../db";
import {ensureConn} from "./common";

describe("common", () => {
  describe("ensureConn()", () => {
    it("returns the transaction connection ref if provided", () => {
      const db: IDatabase = {
        pool: {
          query: jest.fn(),
          connect: jest.fn()
        },
        tx: jest.fn()
      };
      const tx: ITx = {
        conn: {
          query: jest.fn()
        },
        commit: jest.fn(),
        rollback: jest.fn()
      };
      const conn = ensureConn(db, {
        tx,
      });

      expect(conn).toBe(tx.conn);
    });

    it("returns a non-transaction ref otherwise", () => {
      const db: IDatabase = {
        pool: {
          query: jest.fn(),
          connect: jest.fn()
        },
        tx: jest.fn()
      };
      const conn = ensureConn(db);

      expect(conn).toBe(db.pool);
    });
  })
})
