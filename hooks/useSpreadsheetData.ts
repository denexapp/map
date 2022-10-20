import { useCallback, useState } from "react";
import { JsonDecoder } from "ts.data.json";
import { sleep } from "../utils/sleep";
import useGetGeocoder from "./useGeocoder";

export interface SpreadSheetData {
  isLoading: boolean;
  places: Array<Place> | null;
}

export type SetSpreadsheetData = (data: string) => void;

interface Place {
  placeId: string;
  location: google.maps.LatLng;
  formattedAddress: string;
  names: Array<string>;
}

type Row = [name: string, address: string];

type SpreadsheetRow = [name: string, country: string, city: string];

const spreasheetRowDecoder: JsonDecoder.Decoder<SpreadsheetRow> =
  JsonDecoder.tuple(
    [JsonDecoder.string, JsonDecoder.string, JsonDecoder.string],
    "Row"
  );

const useSpreadsheetData = (
  onSuccess: () => void,
  onError: (message: string) => void
): [SpreadSheetData, SetSpreadsheetData] => {
  const [places, setPlaces] = useState<Array<Place> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const getGeocoder = useGetGeocoder();

  const spreadSheetData: SpreadSheetData = {
    isLoading,
    places,
  };

  const getLocations = async (
    rows: Array<Row>,
    onError: (message: string) => void
  ): Promise<Array<Place>> => {
    const uniqueAddressesWithNames = new Map<string, Array<string>>();

    rows.forEach((row) => {
      const [name, address] = row;

      const names = uniqueAddressesWithNames.get(address);

      if (names === undefined) {
        uniqueAddressesWithNames.set(address, [name]);
      } else {
        uniqueAddressesWithNames.set(address, [...names, name]);
      }
    });

    const places = new Map<string, Place>();

    for (const uniqueAddressWithNames of uniqueAddressesWithNames) {
      const [address, names] = uniqueAddressWithNames;
      let response: google.maps.GeocoderResponse;
      try {
        response = await getGeocoder().geocode({ address });
        await sleep(500);
      } catch {
        onError(`: ${address}`);
        throw new Error();
      }
      const placeId = response.results[0].place_id;
      const formattedAddress = response.results[0].formatted_address;
      const { location } = response.results[0].geometry;
      const place = places.get(placeId);

      if (place === undefined) {
        places.set(placeId, { placeId, location, formattedAddress, names });
      } else {
        places.set(placeId, {
          placeId,
          location,
          formattedAddress,
          names: [...place.names, ...names],
        });
      }
    }

    return [...places.values()];
  };

  const setSpreadsheetData: SetSpreadsheetData = useCallback(
    (data) => {
      const unvalidatedRows = data
        .trim()
        .split("\n")
        .map((row) => row.split("\t").map((rowPart) => rowPart.trim()));

      const rows: Array<Row> = [];

      for (const unvalidatedRow of unvalidatedRows) {
        const spreadsheetRow = spreasheetRowDecoder.decode(unvalidatedRow);

        if (!spreadsheetRow.isOk()) {
          onError(`: ${unvalidatedRow}`);
          return;
        }

        const [name, country, city] = spreadsheetRow.value;

        const row: Row = [name, `${country} ${city}`];

        rows.push(row);
      }

      setIsLoading(true);
      getLocations(rows, onError)
        .then((places) => {
          setPlaces(places);
          onSuccess();
        })
        .finally(() => setIsLoading(false));
    },
    [onError]
  );

  return [spreadSheetData, setSpreadsheetData];
};

export default useSpreadsheetData;
