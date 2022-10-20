import { Textarea, Toast } from "@skbkontur/react-ui";
import Head from "next/head";
import { useEffect, useRef } from "react";
import useSpreadsheetData from "../../hooks/useSpreadsheetData";
import Container from "../Container";
import Layer from "../Layer";
import Map, { MapRef } from "../Map";
import Marker from "../Marker";

const HomeContent: React.FC = () => {
  const mapRef = useRef<MapRef>(null);

  const [{ isLoading, places }, setSpreadsheetData] = useSpreadsheetData(
    () => {
      Toast.push("Location data is loaded");
    },
    () => {
      Toast.push("Can't fetch location data");
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
        <Map ref={mapRef} streetViewControl={false} mapTypeControl={false}>
          {markers}
        </Map>
      </Layer>
      <Layer padding direction="column">
        <Textarea
          disabled={isLoading}
          onValueChange={(value) => setSpreadsheetData(value)}
          rows={1}
          resize="none"
          placeholder={textAreaPlaceholder}
          value=""
        />
      </Layer>
    </Container>
  );
};

export default HomeContent;