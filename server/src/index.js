import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { initDb, pool } from "./db";
import { typeDefs, makeResolvers } from "./schema";

await initDb();

const server = new ApolloServer({
  typeDefs,
  resolvers: makeResolvers({ pool }),
});

const { url } = await startStandaloneServer(server, {
  listen: { port: Number(process.env.PORT || 4000) },
  context: async () => ({}),
});

console.log(`🚀 GraphQL ready at ${url}`);
