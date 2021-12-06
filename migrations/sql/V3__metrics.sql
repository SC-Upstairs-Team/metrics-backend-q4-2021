CREATE TABLE metrics_data (
  pod_id varchar NOT NULL,
  service_type varchar NOT NULL,
  ts int NOT NULL,
  avg_latency INT NOT NULL,
  percentile_99 INT NOT NULL,
  min_latency INT NOT NULL,
  max_latency INT NOT NULL,
  status_200 INT,
  status_400 INT,
  status_401 INT,
  status_403 INT,
  status_404 INT,
  status_499 INT,
  status_500 INT,
  status_502 INT,
  PRIMARY KEY (pod_id, ts, service_type)
);
