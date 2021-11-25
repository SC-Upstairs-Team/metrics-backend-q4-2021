CREATE TABLE metrics_data (
  podId varchar NOT NULL,
  ts int NOT NULL,
  service_type varchar NOT NULL,
  http_status JSON,
  average_latency int,
  min_latency int,
  max_latency int,
  percentile_99 int,
  PRIMARY KEY (podId, ts, service_type)
);