import {
  Children,
  cloneElement,
  ComponentPropsWithRef,
  forwardRef,
  isValidElement,
  PropsWithRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useDeepCompareEffectForMaps } from "./utils";
import styles from "./styles.module.css";

export interface MapProps extends google.maps.MapOptions {
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
  children?:
    | React.ReactElement<google.maps.MarkerOptions>[]
    | React.ReactElement<google.maps.MarkerOptions>;
}

export interface MapRef {
  fitBounds: google.maps.Map["fitBounds"];
}

const Map = forwardRef<MapRef, MapProps>(
  ({ onClick, onIdle, children, ...options }, mapRef) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map>();

    useImperativeHandle(
      mapRef,
      () => ({
        fitBounds: (...args) => map?.fitBounds(...args),
      }),
      [map]
    );

    useEffect(() => {
      if (divRef.current && !map) {
        setMap(new window.google.maps.Map(divRef.current, {}));
      }
    }, [divRef, map]);

    useDeepCompareEffectForMaps(() => {
      if (map) {
        map.setOptions(options);
      }
    }, [map, options]);

    return (
      <>
        <div ref={divRef} className={styles.map} />
        {Children.map(children, (child) => {
          if (isValidElement(child)) {
            // set the map prop on the child component
            return cloneElement(child, { map });
          }
        })}
      </>
    );
  }
);

Map.displayName = "Map";

export default Map;
