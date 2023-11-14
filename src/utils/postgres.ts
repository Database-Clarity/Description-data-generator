import postgres from 'postgres'
import dotenv from 'dotenv'
import { FinalData } from '../main.js'
dotenv.config()

export const updateData = async (data: FinalData) => {
  console.log('Perks found', Object.keys(data).length)

  let { PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID } = process.env

  const sql = postgres({
    host: PGHOST,
    database: PGDATABASE,
    username: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: 'require',
    connection: {
      options: `project=${ENDPOINT_ID}`,
    },
  })

  const perksQuery = Object.values(data).map((item) => {
    const { hash, name, type, img, appearsOn, linkedWith } = item

    return {
      hash,
      item_hash: appearsOn.length === 1 && typeof appearsOn[0] === 'number' ? appearsOn[0] : null,
      name: JSON.stringify(name),
      type,
      img,
      appears_on: JSON.stringify(appearsOn),
      linked_with: linkedWith === null ? null : JSON.stringify(linkedWith),
    }
  })

  const descriptionsQuery = Object.values(data).map((item) => {
    const { hash } = item
    return { hash }
  })

  await sql`
    INSERT INTO perks
      ${sql(perksQuery)}
    ON CONFLICT (hash) DO UPDATE SET
      item_hash = EXCLUDED.item_hash,
      name = EXCLUDED.name,
      type = EXCLUDED.type,
      img = EXCLUDED.img,
      appears_on = EXCLUDED.appears_on,
      linked_with = EXCLUDED.linked_with;

    INSERT INTO descriptions
      ${sql(descriptionsQuery)}
    ON CONFLICT (hash) DO NOTHING;
    `

  await sql.end()
}

/*

CREATE TABLE descriptions (
  hash     BIGINT PRIMARY KEY,
  comments JSONB,
  en       JSONB,
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

CREATE TABLE perks (
  hash        BIGINT PRIMARY KEY,
  item_hash   BIGINT,
  name        JSONB,
  type        TEXT  NOT NULL,
  img         TEXT  NOT NULL,
	appears_on  JSONB NOT NULL,
	linked_with JSONB
);

*/
