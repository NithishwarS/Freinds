import { ApolloClient, InMemoryCache, ApolloProvider, gql, useQuery } from '@apollo/client';
import { withApollo } from '../lib/apollo';

const query = gql`query city{
    city(limit:1){
    name
    }
}`


const MyApp = (props) => {
    const { Component, pageProps } = props
const {data} = useQuery(query,{})

    console.log({data});
    
    return (
        <Component {...pageProps} />
    )
}

export default withApollo({ ssr: true })(MyApp)