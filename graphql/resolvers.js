exports.resolvers = {
  Query: {
    // hello: (_, args, req) => {
  },
  Mutation: {
    helloAgain: (_, args, req) => {
      return `Hello ${args.name}`;
    },
  },
};
