import { ApolloServer, gql, PubSub } from "apollo-server";
import { books, authors } from "./dataset";

const pubsub = new PubSub();

const typeDefs = gql`
    # This "Book" type defines the queryable fields for every book in our data source.
    type Book {
        id: ID
        name: String
        genre: String
        author: Author
    }

    type Author {
        id: ID
        name: String
        age: Int
        books: [Book]
    }

    # Let client(playground) know the list of queries 
    type Query {
        book(id: ID): Book
        books: [Book]
        author(id: ID): Author
        authors: [Author]
    }

    type Mutation {
        addBook(name: String!, genre: String!, author: ID): Book 
    }

    type Subscription {
        bookAdded: Book
    }

`;

const BOOK_ADDED = 'BOOK_ADDED';


const resolvers = {
    Query: {
        book: (parent, args) => {
            console.log('books:-->', books);
            return books.find(({ id }) => id === args.id)
        },
        books: () => books,
        author: (parent, args) => {
            return authors.find(({ id }) => id === args.id)
        },
        authors: () => authors
    },
    Book: {
        author: (parent) => {
            return authors.find(({ id }) => parent.author === id)
        }
    },
    Author: {
        books: (parent, args) => {
            return books.filter(({ author }) => author === args.id);
        }
    },
    Mutation: {
        addBook: (parent, { name, genre, author }) => {
            const lastId = books.sort((a, b) => parseInt(b.id) - parseInt(a.id))[0].id;
            const newBook = {
                id: `${+(lastId) + 1}`,
                name,
                genre,
                author
            };

            books.push(newBook);

            pubsub.publish(BOOK_ADDED, { bookAdded: newBook });

            return newBook;
        }
    },
    Subscription: {
        bookAdded: {
            subscribe: () => pubsub.asyncIterator([BOOK_ADDED])
        }
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers
});

server.listen().then(({ url }) => {
    console.log(`Server is ready with ${url}`);
}).catch(error => {
    console.error(error);
});