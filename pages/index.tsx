import { Wrapper } from "@googlemaps/react-wrapper";
import type { NextPage } from "next";
import Head from "next/head";
import Container from "../components/Container";
import HomeContent from "../components/HomeContent";

const Home: NextPage = () => {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (googleMapsApiKey === undefined) {
    throw new Error("Google Maps api key is not defined");
  }

  return (
    <Container>
      <Head>
        <title>Map</title>
        <meta name="description" content="A map to display coworkers" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Wrapper apiKey={googleMapsApiKey}>
        <HomeContent />
      </Wrapper>
    </Container>
  );
};

export default Home;
