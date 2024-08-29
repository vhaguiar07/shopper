CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) REFERENCES customers(code) ON DELETE CASCADE,
    measure_datetime TIMESTAMP NOT NULL,
    measure_type VARCHAR(10) CHECK (measure_type IN ('WATER', 'GAS')),
    measure_value INTEGER NOT NULL,
    measure_uuid UUID NOT NULL DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    UNIQUE (customer_code, measure_type, measure_datetime)
);