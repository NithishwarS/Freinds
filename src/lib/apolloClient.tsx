import {
    ApolloClient,
    InMemoryCache,
    HttpLink,
    split,
    NormalizedCacheObject,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";
import { setContext } from "@apollo/client/link/context";
// import { refreshToken } from "./auth";
import { onError } from "@apollo/client/link/error";
import get from "lodash/get";
import Router from "next/router";
// import util from "./utils";

// const { application_error } = util;

const isBrowser = typeof window !== "undefined";
const wsLink = isBrowser
    ? new GraphQLWsLink(
        createClient({
            url: process.env.NEXT_PUBLIC_HTTP_CORE,
            lazy: true,
            connectionParams: async () => {
                // await refreshToken(false);
                const token = await localStorage.getItem("token");
                if (token) {
                    return {
                        headers: {
                            authorization: token ? `Bearer ${token}` : "",
                        },
                    };
                }
            },
        })
    )
    : null;

const changeSubscriptionToken = (token: any) => {
    let authToken = get(
        wsLink,
        "subscriptionClient.connectionParams.authToken",
        null
    );
    let subscriptionClient = get(wsLink, "subscriptionClient", null);
    if (authToken === token) {
        authToken = token;
        subscriptionClient.close();
        subscriptionClient.connect();
    }
};

const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_HTTP_CORE,
    credentials: "same-origin", // Additional fetch() options like `credentials` or `headers`
});

const authLink = setContext(async (_, { headers }) => {
    const role = get(headers, "x-hasura-role", null);
    if (role === "anonymous") {
        return {
            headers: {
                ...headers,
                "x-hasura-admin-secret": "freightolog@123",
                "hasura-client-name": "desk",
            },
        };
    } else {
        // await refreshToken(false);
        // const tokenWithRole = localStorage.getItem("tokenWithRole");
        // const validateToken = JSON.parse(tokenWithRole)
        // const token = validateToken?.token
        // const defaultRole = validateToken?.role
        return {
            headers: {
                ...headers,
                // "x-hasura-role": `${defaultRole}`,
                "hasura-client-name": "desk",
                // Authorization: `Bearer ${token}`,
                "x-hasura-admin-secret": "freightolog@123"
            },
        };
    }
});

const concatedHttpLink = authLink.concat(httpLink);

const link = isBrowser
    ? split(
        ({ query }) => {
            const definition = getMainDefinition(query);
            return (
                definition.kind === "OperationDefinition" &&
                definition.operation === "subscription"
            );
        },
        wsLink,
        concatedHttpLink
    )
    : concatedHttpLink;

const errorLink = onError(({ graphQLErrors, networkError }) => {
    const networkErrorMessage =
        networkError && networkError.message ? networkError.message : null;
    const graphqlErrorMessage =
        graphQLErrors && graphQLErrors.length > 0 && graphQLErrors[0].message
            ? graphQLErrors[0].message
            : null;
    // if (
    //     (networkError &&
    //         networkErrorMessage.includes(application_error.JWT_TOKEN_EXPIRE_ERROR)
    //         ) ||
    //     (graphQLErrors &&
    //         graphqlErrorMessage.includes(application_error.JWT_TOKEN_EXPIRE_ERROR)
    //         )
    // ) {
    //     refreshToken(false);
    // }
});

const createApolloClient = (initialState: NormalizedCacheObject, ctx: any) => {
    // The `ctx` (NextPageContext) will only be present on the server.
    // use it to extract auth headers (ctx.req) or similar.
    return new ApolloClient({
        ssrMode: Boolean(ctx),
        link: errorLink.concat(link),
        cache: new InMemoryCache().restore(initialState),
    });
};

const makeApolloClient = () => {
    const httpLink = new HttpLink({
        uri: process.env.NEXT_PUBLIC_HTTP_CORE,
        credentials: "same-origin", // Additional fetch() options like `credentials` or `headers`
    });
    const authLink = setContext(async (_, { headers }) => {
        const role = get(headers, "x-hasura-role", null);
        if (role === "anonymous") {
            return {
                headers: {
                    ...headers,
                    "hasura-client-name": "desk",
                },
            };
        } else {
            // await refreshToken(false);
            const token = localStorage.getItem("token");
            return {
                headers: {
                    ...headers,
                    // "x-hasura-role": "customer",
                    "x-hasura-admin-secret": "freightolog@123",
                    "hasura-client-name": "desk",
                    // Authorization: `Bearer ${token}`,
                },
            };
        }
    });

    const concatedHttpLink = authLink.concat(httpLink);

    const link = isBrowser
        ? split(
            ({ query }) => {
                const definition = getMainDefinition(query);
                return (
                    definition.kind === "OperationDefinition" &&
                    definition.operation === "subscription"
                );
            },
            wsLink,
            concatedHttpLink
        )
        : concatedHttpLink;

    const errorLink = onError(({ graphQLErrors, networkError }) => {
        const networkErrorMessage =
            networkError && networkError.message ? networkError.message : null;
        const graphqlErrorMessage =
            graphQLErrors && graphQLErrors.length > 0 && graphQLErrors[0].message
                ? graphQLErrors[0].message
                : null;
        // if (
        //     (networkError &&
        //         networkErrorMessage.includes(
        //             application_error.JWT_TOKEN_EXPIRE_ERROR
        //         )) ||
        //     (graphQLErrors &&
        //         graphqlErrorMessage.includes(application_error.JWT_TOKEN_EXPIRE_ERROR))
        // ) {
        //     refreshToken(false);
        // }
        // if (
        //     (networkError &&
        //         networkErrorMessage.includes(application_error.JWT_ISSUED_AT_FUTURE)) ||
        //     (graphQLErrors &&
        //         graphqlErrorMessage.includes(application_error.JWT_ISSUED_AT_FUTURE))
        // ) {
        //     setTimeout(() => Router.reload(), 10000);
        // }
    });

    const cache = new InMemoryCache();
    // instantiate apollo client with apollo link instance and cache instance
    const client = new ApolloClient({
        link: errorLink.concat(link),
        cache,
    });
    return client;
};

export { changeSubscriptionToken, createApolloClient, makeApolloClient };
