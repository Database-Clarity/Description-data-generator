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
    // debug: true,
  })

  const perksQuery = Object.values(data).map((item) => {
    const { hash, name, type, img, appearsOn, linkedWith } = item

    return {
      hash,
      itemHash: appearsOn.length === 1 && typeof appearsOn[0] === 'number' ? appearsOn[0] : null,
      name: name,
      type,
      icon: img,
      appearsOn,
      linkedWith,
    }
  })

  await sql`
    INSERT INTO "perks"
      ${sql(perksQuery)}
    ON CONFLICT (hash) DO UPDATE SET
      "itemHash" = EXCLUDED."itemHash",
      "name" = EXCLUDED."name",
      "type" = EXCLUDED."type",
      "icon" = EXCLUDED."icon",
      "appearsOn" = EXCLUDED."appearsOn",
      "linkedWith" = EXCLUDED."linkedWith";
  `

  await sql.end()
}

/*

CREATE TABLE perks (
  hash        BIGINT PRIMARY KEY,
  itemHash    BIGINT,
  name        JSONB,
  type        TEXT  NOT NULL,
  icon        TEXT  NOT NULL,
	appearsOn   JSONB NOT NULL,
	linkedWith  JSONB
);

*/
