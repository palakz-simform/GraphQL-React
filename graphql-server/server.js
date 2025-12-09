const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/use/ws');
const { PubSub } = require('graphql-subscriptions');
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Restrictive CORS to support credentials from the Vite dev server
const ALLOWED_ORIGIN = 'http://localhost:5173';
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
const httpServer = createServer(app);
const pubsub = new PubSub();

// JSON Server URL
const JSON_SERVER_URL = 'http://localhost:3000';

// Company Type
const CompanyType = new GraphQLObjectType({
  name: 'Company',
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios
          .get(`${JSON_SERVER_URL}/companies/${parentValue.id}/users`)
          .then(res => res.data);
      }
    }
  })
});

// User Type
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    companyId: { type: GraphQLString },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        if (!parentValue.companyId) return null;
        return axios
          .get(`${JSON_SERVER_URL}/companies/${parentValue.companyId}`)
          .then(res => res.data);
      }
    }
  })
});

// Root Query
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`${JSON_SERVER_URL}/users/${args.id}`)
          .then(res => res.data);
      }
    },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios
          .get(`${JSON_SERVER_URL}/users`)
          .then(res => res.data);
      }
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`${JSON_SERVER_URL}/companies/${args.id}`)
          .then(res => res.data);
      }
    },
    companies: {
      type: new GraphQLList(CompanyType),
      resolve(parentValue, args) {
        return axios
          .get(`${JSON_SERVER_URL}/companies`)
          .then(res => res.data);
      }
    }
  }
});

// Mutations
const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, { firstName, age, companyId }) {
        return axios
          .post(`${JSON_SERVER_URL}/users`, { firstName, age, companyId })
          .then(res => res.data)
          .then(newUser => {
            pubsub.publish('USER_ADDED', { userAdded: newUser });
            return newUser;
          });
      }
    },
    deleteUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve(parentValue, { id }) {
        return axios
          .delete(`${JSON_SERVER_URL}/users/${id}`)
          .then(res => res.data);
      }
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString }
      },
      resolve(parentValue, args) {
        return axios
          .patch(`${JSON_SERVER_URL}/users/${args.id}`, args)
          .then(res => res.data);
      }
    },
    addCompany: {
      type: CompanyType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        description: { type: GraphQLString }
      },
      resolve(parentValue, { name, description }) {
        return axios
          .post(`${JSON_SERVER_URL}/companies`, { name, description })
          .then(res => res.data);
      }
    }
  }
});

// Subscriptions
const RootSubscription = new GraphQLObjectType({
  name: 'Subscription',
  fields: {
    userAdded: {
      type: UserType,
      subscribe: () => pubsub.asyncIterator('USER_ADDED'),
      resolve: (payload) => payload.userAdded
    }
  }
});

const schema = new GraphQLSchema({
  query: RootQuery,
  mutation,
  subscription: RootSubscription
});

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    graphiql: true
  })
);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql'
});

useServer({ schema }, wsServer);

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`GraphQL server running on http://localhost:${PORT}/graphql`);
  console.log(`GraphQL WS server running on ws://localhost:${PORT}/graphql`);
});
