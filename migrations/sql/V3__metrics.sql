CREATE TABLE metrics_data (
  pod_id varchar NOT NULL,
  service_type varchar NOT NULL,
  ts int NOT NULL,
  avg_latency INT NOT NULL,
  percentile_99 INT NOT NULL,
  min_latency INT NOT NULL,
  max_latency INT NOT NULL,
  status_200 INT NOT NULL,
  status_400 INT NOT NULL,
  status_401 INT NOT NULL,
  status_403 INT NOT NULL,
  status_404 INT NOT NULL,
  status_499 INT NOT NULL,
  status_500 INT NOT NULL,
  status_502 INT NOT NULL
  PRIMARY KEY (pod_id, ts, service_type)
);
