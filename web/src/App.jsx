import React, { useEffect, useMemo, useRef } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";

import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

const ASSETS = gql`
  query Assets {
    assets {
      id
      name
      lat
      lon
    }
  }
`;

const CREATE_ASSET = gql`
  mutation CreateAsset($input: CreateAssetInput!) {
    createAsset(input: $input) {
      id
      name
      lat
      lon
    }
  }
`;

export default function App() {
  const mapDivRef = useRef(null);
  const layerRef = useRef(null);
  const viewRef = useRef(null);

  const { data, loading, error, refetch } = useQuery(ASSETS, {
    fetchPolicy: "network-only",
  });

  const [createAsset, { loading: creating }] = useMutation(CREATE_ASSET);

  // Create ArcGIS map once
  useEffect(() => {
    if (!mapDivRef.current) return;

    const graphicsLayer = new GraphicsLayer();
    layerRef.current = graphicsLayer;

    const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [graphicsLayer],
    });

    const view = new MapView({
      container: mapDivRef.current,
      map,
      center: [-115.1398, 36.1699], // Las Vegas-ish
      zoom: 11,
    });

    viewRef.current = view;

    return () => {
      view?.destroy();
      viewRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Render assets onto map whenever data changes
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.removeAll();

    const assets = data?.assets ?? [];
    for (const a of assets) {
      const g = new Graphic({
        geometry: {
          type: "point",
          longitude: a.lon,
          latitude: a.lat,
        },
        attributes: {
          id: a.id,
          name: a.name,
        },
        popupTemplate: {
          title: "{name}",
          content: "Asset ID: {id}",
        },
      });

      layer.add(g);
    }
  }, [data]);

  async function addRandomAsset() {
    // Drop a point near the current view center
    const view = viewRef.current;
    const center = view?.center;
    const baseLon = center ? center.longitude : -115.1398;
    const baseLat = center ? center.latitude : 36.1699;

    const jitter = () => (Math.random() - 0.5) * 0.05; // ~a few miles

    await createAsset({
      variables: {
        input: {
          name: `Asset ${Math.floor(Math.random() * 1000)}`,
          lat: baseLat + jitter(),
          lon: baseLon + jitter(),
        },
      },
    });

    await refetch();
  }

  return (
    <div
      style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100vh" }}
    >
      <header
        style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}
      >
        <strong>ArcGIS + GraphQL Live Asset Map</strong>
        <button onClick={addRandomAsset} disabled={creating}>
          {creating ? "Adding..." : "Add random asset"}
        </button>
        <button onClick={() => refetch()} disabled={loading}>
          Refresh
        </button>
        {error && <span style={{ color: "crimson" }}>{error.message}</span>}
      </header>

      <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
