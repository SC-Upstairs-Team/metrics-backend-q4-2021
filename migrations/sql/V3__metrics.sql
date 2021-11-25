CREATE TABLE metrics_data (
  pod_id varchar NOT NULl,
  service_type varchar NOT NULL,
  ts int NOT NULL,
  http_status JSON NOT NULL,
  avg_latency INT NOT NULL,
  percentile_99 INT NOT NULL,
  min_latency INT NOT NULL,
  max_latency INT NOT NULL,
  PRIMARY KEY (pod_id, ts, service_type)
);
