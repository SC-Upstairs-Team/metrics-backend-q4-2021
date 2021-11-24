import qs from "qs";

/**
 * Metrics routes and handlers
 */

export class MetricHandlers {
  constructor() {

    this.routes = this.routes.bind(this);
  }

  routes(svc) {
    svc.route({
      method: "*",
      path: "/{p*}",
      handler: {
        proxy: {
          mapUri: (req) => {
            return {
              uri:  `http://localhost:4000/${req.params.p}?${qs.stringify(req.query)}`
            };
          },
        }
      },
      options: {
        auth: false
      }
    });
  }
}
