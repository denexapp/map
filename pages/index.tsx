import { Status, Wrapper } from "@googlemaps/react-wrapper";
import type { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import Map from "../components/Map";
import Marker from "../components/Marker";
import styles from "../styles/Home.module.css";

const render = (status: Status) => {
  return <span>{status}</span>;
};

const Home: NextPage = () => {
  const [clicks, setClicks] = useState<google.maps.LatLng[]>([]);
  const [zoom, setZoom] = useState(3); // initial zoom
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({
    lat: 0,
    lng: 0,
  });

  const onClick = (e: google.maps.MapMouseEvent) => {
    setClicks([...clicks, e.latLng!]);
  };

  const onIdle = (m: google.maps.Map) => {
    console.log("onIdle");
    setZoom(m.getZoom()!);
    setCenter(m.getCenter()!.toJSON());
  };

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (googleMapsApiKey === undefined) {
    throw new Error('Google Maps api key is not defined')
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Map</title>
        <meta name="description" content="A map to display coworkers" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Wrapper apiKey={googleMapsApiKey} render={render}>
        <Map center={center} zoom={zoom} onIdle={onIdle} onClick={onClick}>
          {clicks.map((latLng, i) => (
            <Marker key={i} position={latLng} />
          ))}
        </Map>
      </Wrapper>
    </div>
  );
};

export default Home;
