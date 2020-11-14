PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Config(
    id INTEGER PRIMARY KEY ASC,
    name TEXT,
    value TEXT
);

CREATE TABLE IF NOT EXISTS Speedlogs(
    id INTEGER PRIMARY KEY ASC,
    download_bits REAL,
    upload_bits REAL,
    logtime INTEGER
);

CREATE TABLE IF NOT EXISTS Pinglogs(
    id INTEGER PRIMARY KEY ASC,
    packet_count INTEGER,
    packet_loss REAL,
    latency REAL,
    logtime INTEGER
);