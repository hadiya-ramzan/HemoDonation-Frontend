import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* FIX DEFAULT ICON ISSUE */
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


// 🔥 AUTO FIT ALL DONORS ON MAP (MAIN FIX)
function FitMapToDonors({ donors }) {
  const map = useMap();

  useEffect(() => {
    const validDonors = donors.filter(
      (d) => d.latitude && d.longitude
    );

    if (validDonors.length === 0) return;

    const bounds = validDonors.map((d) => [
      Number(d.latitude),
      Number(d.longitude),
    ]);

    map.fitBounds(bounds, { padding: [50, 50] });
  }, [donors, map]);

  return null;
}


// 🔥 FOCUS ON SELECTED DONOR
function FocusSelectedDonor({ selectedDonor }) {
  const map = useMap();

  useEffect(() => {
    if (
      selectedDonor?.latitude &&
      selectedDonor?.longitude
    ) {
      map.flyTo(
        [
          Number(selectedDonor.latitude),
          Number(selectedDonor.longitude),
        ],
        14
      );
    }
  }, [selectedDonor, map]);

  return null;
}


function DonorMap({ donors = [], center, selectedDonor }) {
  const donorsWithLocation = donors.filter(
    (d) => d.latitude && d.longitude
  );

  if (!center) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.07] p-2">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "360px", width: "100%" }}
      >
        {/* MAP LAYER */}
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 🔥 AUTO FIT ALL DONORS */}
        <FitMapToDonors donors={donorsWithLocation} />

        {/* 🔥 FOCUS SELECTED DONOR */}
        <FocusSelectedDonor selectedDonor={selectedDonor} />

        {/* MARKERS */}
        {donorsWithLocation.map((donor) => (
          <Marker
            key={donor.id}
            position={[
              Number(donor.latitude),
              Number(donor.longitude),
            ]}
          >
            <Popup>
              <div>
                <b>{donor.full_name}</b>
                <br />
                {donor.blood_group}
                <br />
                {donor.city}
                <br />
                📞 {donor.phone || "Not available"}
                <br />
                Score: {donor.matching_score}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default DonorMap;