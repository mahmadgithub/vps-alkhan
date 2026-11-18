import { useEffect, useRef } from 'react';
import { View } from 'react-native';

type Props = {
  lat: number;
  lng: number;
  onMapMoved: (lat: number, lng: number) => void;
};

export function GoogleMapView({ lat, lng, onMapMoved }: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MAP_MOVED') {
        const { lat: mLat, lng: mLng } = event.data;
        if (typeof mLat === 'number' && typeof mLng === 'number') {
          onMapMoved(mLat, mLng);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onMapMoved]);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'SET_CENTER', lat, lng }, '*');
    }
  }, [lat, lng]);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #f4f3f0; }
        .leaflet-control-attribution { display: none !important; }
        .center-pin-container {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -100%);
          z-index: 1000; pointer-events: none;
          display: flex; flex-direction: column; align-items: center;
        }
        .pin-shadow {
          width: 14px; height: 6px; background: rgba(0,0,0,0.3);
          border-radius: 50%; margin-top: -4px; filter: blur(2px);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="center-pin-container">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="#EA4335" stroke="#B31412" stroke-width="0.8">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <div class="pin-shadow"></div>
      </div>
      <script>
        var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${lat}, ${lng}], 16);
        
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(map);

        map.on('moveend', function() {
          var c = map.getCenter();
          if (window.parent) {
            window.parent.postMessage({ type: 'MAP_MOVED', lat: c.lat, lng: c.lng }, '*');
          }
        });

        window.addEventListener('message', function(event) {
          if (event.data && event.data.type === 'SET_CENTER') {
            map.setView([event.data.lat, event.data.lng], 16);
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        srcDoc={mapHtml}
        width="100%"
        height="100%"
        style={{ border: 0, width: '100%', height: '100%', borderRadius: 12 }}
        title="Google Map Picker"
      />
    </View>
  );
}
