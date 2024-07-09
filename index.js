const { typeDefs } = require("./graphql/schema.js");
const { resolvers } = require("./graphql/resolvers");
const sequelize = require("./database");

require("dotenv/config");
const jwt = require("jsonwebtoken");
const mailer = require("./utils/mailer");

const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const http = require("http");
const express = require("express");
const cors = require("cors");

const AADHAR_ROUTES = require("./rest/routes/aadhar_routes");
const CITIZEN_ROUTES = require("./rest/routes/citizen_routes");
const CLERK_ROUTES = require("./rest/routes/clerk_routes");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/aadhar", AADHAR_ROUTES);
app.use("/citizen", CITIZEN_ROUTES);
app.use("/clerk", CLERK_ROUTES);

const httpServer = http.createServer(app);

const startApolloServer = async (app, httpServer) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: ({ req }) => {
      const authHeader = req.headers.authorization || "";
      if (!authHeader) {
        return { isAuth: false };
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        return { isAuth: false };
      }
      try {
        const decoded = jwt.verify(
          token,
          process.env.TOKEN_GENERATION_SECRET_KEY
        );
        decoded.isAuth = true;
        return decoded;
      } catch (error) {
        return { isAuth: false };
      }
    },
  });
  await server.start();
  server.applyMiddleware({ app });
};
startApolloServer(app, httpServer);

const connect_to_db = async () => {
  try {
    // await sequelize.authenticate();
    await sequelize.sync();

    httpServer.listen(process.env.PORT);
    console.clear();
    console.log(`
  \n\n\n\t\t____________________________________________________\n
        \t\t\t🔗 Database connected\n
        \t\t\tServer listening at port ${process.env.PORT}
    `);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};
connect_to_db();
