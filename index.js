const { typeDefs } = require("./graphql/schema.js");
const { resolvers } = require("./graphql/resolvers");
const sequelize = require("./database");

require("dotenv/config");
const jwt = require("jsonwebtoken");

const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");

const AADHAR_ROUTES = require("./rest/routes/aadhar_routes");
const CITIZEN_ROUTES = require("./rest/routes/citizen_routes");
const CLERK_ROUTES = require("./rest/routes/clerk_routes");
const app = express();

const CORS_CONFIG = {
  origin: "*", // allow requests from this origin
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], // allow these methods
  allowedHeaders: ["Content-Type", "Authorization"], // allow these headers
};
app.use(cors(CORS_CONFIG));
app.options("*", cors(CORS_CONFIG));

app.use(express.json());

// Serve static files
app.use("/aadhar-data", express.static(path.join(__dirname, "aadhar-data")));
app.use("/certificates", express.static(path.join(__dirname, "certificates")));
app.use("/forms-data", express.static(path.join(__dirname, "forms-data")));
app.use("/templates", express.static(path.join(__dirname, "templates")));
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
    await sequelize.authenticate();
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
