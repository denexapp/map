import { useCallback, useEffect, useState } from "react";
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

type Row = { name: string; address: string };

interface GetDataResponse {
  values: Array<Row>;
}

const getDataResponseDecoder: JsonDecoder.Decoder<GetDataResponse> =
  JsonDecoder.object<GetDataResponse>(
    {
      values: JsonDecoder.array(
        JsonDecoder.object(
          {
            address: JsonDecoder.string,
            name: JsonDecoder.string,
          },

          "Row"
        ),
        "values"
      ),
    },
    "GetDataResponse"
  );

const getSheetId = (data: string): string | null => {
  let url: URL;
  try {
    url = new URL(data);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.hostname !== "docs.google.com") return null;
  if (url.port !== "443" && url.port !== "") return null;
  const parts = url.pathname.split("/");
  if (parts.length < 4) return null;
  if (parts[0] !== "") return null;
  if (parts[1] !== "spreadsheets") return null;
  if (parts[2] !== "d") return null;
  return parts[3];
};

const useSpreadsheetData = (
  onSuccess: () => void,
  onUseSavedLink: () => void,
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
      const { name, address } = row;

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
      let tries = 5;
      while (tries > 0) {
        try {
          response = await getGeocoder().geocode({ address });
          await sleep(500);
          break;
        } catch {
          tries -= 1;
        }
      }
      if (tries === 0) {
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
    async (data) => {
      setIsLoading(true);

      let rows: Array<Row>;

      const sheetId = getSheetId(data);

      if (sheetId === null) {
        setIsLoading(false);
        onError(": incorrect sheet link");
        return;
      }

      try {
        const response = await fetch("/api/get_data", {
          method: "POST",
          body: sheetId,
        });
        const getDataResponse = await response.json();
        rows = (await getDataResponseDecoder.decodeToPromise(getDataResponse))
          .values;
      } catch {
        setIsLoading(false);
        onError(": failed to get or parse data from the server");
        return;
      }

      getLocations(rows, onError)
        .then((places) => {
          localStorage.setItem("savedSheetUrl", data);
          setPlaces(places);
          onSuccess();
        })
        .finally(() => setIsLoading(false));
    },
    [onError]
  );

  useEffect(() => {
    try {
      getGeocoder();
    } catch (error) {
      return;
    }
    const savedSheetUrl = localStorage.getItem("savedSheetUrl");
    if (savedSheetUrl === null) return;
    onUseSavedLink();
    setSpreadsheetData(savedSheetUrl);
  }, [getGeocoder]);

  return [spreadSheetData, setSpreadsheetData];
};

export default useSpreadsheetData;
