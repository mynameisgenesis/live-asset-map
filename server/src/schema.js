export const typeDefs = `#graphql
  type Asset {
    id: ID!
    name: String!
    latitude: Float!
    longitude: Float!
    createdAt: String!
  }

  input CreateAssetInput {
    name: String!
    latitude: Float!
    longitude: Float!
  }
    
  type Query {
    assets: [Asset!]!
  }
  
  type Mutation {
    createAsset(input: CreateAssetInput!): Asset!
  }
`;

export function makeResolvers({ pool }) {
  return {
    Query: {
      assets: async () => {
        const { rows } = await pool.query(
          `SELECT id, name, latitude, longitude, created_at FROM assets ORDER BY created_at DESC`,
        );
        return rows.map((row) => ({
          id: String(row.id),
          name: row.name,
          latitude: row.latitude,
          longitude: row.longitude,
          createdAt: row.created_at.toISOString(),
        }));
      },
    },
    Mutation: {
      createAsset: async (_, { input }) => {
        const { name, latitude, longitude } = input;
        const { rows } = await pool.query(
          `INSERT INTO assets (name, latitude, longitude) VALUES ($1, $2, $3) RETURNING id, name, latitude, longitude, created_at`,
          [name, latitude, longitude],
        );
        const row = rows[0];
        return {
          id: String(row.id),
          name: row.name,
          latitude: row.latitude,
          longitude: row.longitude,
          createdAt: row.created_at.toISOString(),
        };
      },
    },
  };
}
