import {getLogger} from "./common";

/**
 * Common controller tests
 *
 * @group unit
 * @group unit/routes/common
 */
describe("Common", () => {
  describe("getLogger()", () => {
    it("should extract a logger instance from a request", () => {
      const logger = getLogger({
        // @ts-ignore
        logger: {}
      });
      expect(logger).toBeDefined();
    })
  });
});
