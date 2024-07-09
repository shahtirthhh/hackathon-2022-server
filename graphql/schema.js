exports.typeDefs = `

  type Query {
    getPapers:[String]!
  }
  type Mutation {
    helloAgain(name:String):String
  }
`;
