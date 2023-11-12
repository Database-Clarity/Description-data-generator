import pg from 'pg'
import dotenv from 'dotenv'
import { FinalData } from '../main.js'
import { timeTracker } from './timeTracker.js'

const { Client } = pg
dotenv.config()

export const updateData = async (data: FinalData) => {
  timeTracker.start()

  const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env

  const client = new Client({
    user: PGUSER,
    host: PGHOST,
    database: PGDATABASE,
    password: PGPASSWORD,
    port: 5432,
    ssl: {
      rejectUnauthorized: false,
    },
  })
  await client.connect()

  console.log('Perks found', Object.keys(data).length)

  const descriptionObject = JSON.stringify({
    '2000-01-01 12:00:00.000': {
      user: 'Description generator',
      description: {},
      active: false,
      ready: false,
    },
  })

  const query = `
    INSERT INTO perks (hash, item_hash, type, img, appears_on, linked_with)
    VALUES ${Object.values(data)
      .map((item) => {
        const { hash, type, img, appearsOn, linkedWith } = item

        const item_hash = appearsOn.length === 1 && typeof appearsOn[0] === 'number' ? appearsOn[0] : null
        const appears_on = JSON.stringify(appearsOn)
        const linked_with = linkedWith === null ? null : JSON.stringify(linkedWith)

        return `('${hash}', ${item_hash}, '${type}', '${img}', '${appears_on}', '${linked_with}')`
      })
      .join(',\n')}
    ON CONFLICT (hash) DO UPDATE SET
      item_hash = EXCLUDED.item_hash,
      type = EXCLUDED.type,
      img = EXCLUDED.img,
      appears_on = EXCLUDED.appears_on,
      linked_with = EXCLUDED.linked_with;

    INSERT INTO descriptions (hash, en)
    VALUES ${Object.values(data)
      .map((item) => {
        const { hash } = item
        return `('${hash}', '${descriptionObject}')`
      })
      .join(',\n')}
    ON CONFLICT (hash) DO NOTHING;
  `
  await client.query(query)

  await client.end()
  timeTracker.stop()
  console.log(timeTracker.getElapsedTime())
}

/*

CREATE TABLE descriptions (
  hash     BIGINT PRIMARY KEY,
  comments JSONB,
  en       JSONB NOT NULL,
  de       JSONB,
  es       JSONB,
  "es-mx"  JSONB,
  fr       JSONB,
  it       JSONB,
  ja       JSONB,
  ko       JSONB,
  pl       JSONB,
  "pt-br"  JSONB,
  ru       JSONB,
  "zh-chs" JSONB,
  "zh-cht" JSONB
);

CREATE TABLE perks_test (
  hash        BIGINT PRIMARY KEY,
  item_hash   BIGINT,
  type        TEXT  NOT NULL,
  img         TEXT  NOT NULL,
	appears_on  JSONB NOT NULL,
	linked_with JSONB
);

*/
