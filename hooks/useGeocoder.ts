import { useContext, useEffect, useState } from "react";

const useGetGeocoder = (): (() => google.maps.Geocoder) => {
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  useEffect(() => {
    setGeocoder( new window.google.maps.Geocoder())
  }, [])

  const getGeocoder = () => {
    if (geocoder === null) {
      throw new Error("useGeocoder is called outside of GeocoderWrapper");
    }

    return geocoder;
  };

  return getGeocoder;
};

export default useGetGeocoder;
