import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import useSpreadsheetData from "../../hooks/useSpreadsheetData";
import Container from "../Container";
import Layer from "../Layer";
import Map, { MapRef } from "../Map";
import Marker from "../Marker";

const HomeContent: React.FC = () => {
  const mapRef = useRef<MapRef>(null);
  const [initialCenter] = useState(new window.google.maps.LatLng(55, 37))

  const [{ isLoading, places }, setSpreadsheetData] = useSpreadsheetData(
    () => {
      console.log("Location data is loaded")
    },
    (message: string) => {
      console.log(`Can't fetch location data ${message}`)
    }
  );

  const markers: Array<React.ReactElement<google.maps.MarkerOptions>> =
    places
      ?.map((place) => (
        <Marker
          key={place.placeId}
          position={place.location}
          label={place.names.length.toString(10)}
        />
      ))
      .flat() ?? [];

  const textAreaPlaceholder = isLoading
    ? "Loading..."
    : "Paste data from the spreadsheet here";

  useEffect(() => {
    const bounds = new google.maps.LatLngBounds();
    places?.forEach((place) => bounds.extend(place.location));
    mapRef.current?.fitBounds(bounds);
  }, [places]);

  return (
    <Container>
      <Head>
        <title>Map</title>
        <meta name="description" content="A map to display coworkers" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layer>
        <Map ref={mapRef} streetViewControl={false} mapTypeControl={false} center={initialCenter} zoom={3}>
          {markers}
        </Map>
      </Layer>
      <Layer padding direction="column">
        <textarea
          disabled={isLoading}
          onChange={(event) => setSpreadsheetData(event.target.value)}
          rows={1}
          placeholder={textAreaPlaceholder}
          value=""
        >
        </textarea>
      </Layer>
    </Container>
  );
};

export default HomeContent;
