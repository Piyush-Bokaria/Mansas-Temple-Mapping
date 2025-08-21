import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "./MapComponent.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const startIcon = L.divIcon({
  className: "start-marker",
  html: '<div style="background-color: #28a745; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">Start</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const endIcon = L.divIcon({
  className: "end-marker",
  html: '<div style="background-color: #dc3545; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">End</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const MapComponent = ({ templeData = [], showRoutes = false }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routingControlRef = useRef(null);
  const startEndMarkersRef = useRef([]);

  useEffect(() => {
    if (mapRef.current) return;

    try {
      const map = L.map("map").setView([17.5, 83], 8.2);
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => {
      if (mapRef.current.hasLayer(marker)) {
        mapRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    startEndMarkersRef.current.forEach((marker) => {
      if (mapRef.current.hasLayer(marker)) {
        mapRef.current.removeLayer(marker);
      }
    });
    startEndMarkersRef.current = [];

    if (routingControlRef.current && mapRef.current) {
      if (mapRef.current.hasLayer(routingControlRef.current)) {
        mapRef.current.removeLayer(routingControlRef.current);
      }
      routingControlRef.current = null;
    }

    if (templeData && templeData.length > 0) {
      console.log("Temple data received:", templeData);

      templeData.forEach((temple, index) => {
        console.log(`Temple ${index}:`, temple);

        if (
          temple.latitude &&
          temple.longitude &&
          !isNaN(parseFloat(temple.latitude)) &&
          !isNaN(parseFloat(temple.longitude))
        ) {
          const lat = parseFloat(temple.latitude);
          const lng = parseFloat(temple.longitude);

          const popupContent = `
            <div style="font-family: Arial, sans-serif;">
              <strong style="color: #333; font-size: 14px;">${
                temple.name || "Temple"
              }</strong><br>
              <span style="color: #666;">District: ${
                temple.dtname || "N/A"
              }</span><br>
              <span style="color: #666;">Deity: ${
                temple.god_name || "N/A"
              }</span><br>
              <span style="color: #666;">Description: ${
                temple.placepageu || "N/A"
              }</span>
            </div>
          `;

          const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: "orange",
            color: "#333",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
          })
            .bindPopup(popupContent, {
              maxWidth: 200,
              className: "temple-popup",
            })
            .on("click", function () {
              console.log("Marker clicked:", temple);
            })
            .addTo(mapRef.current);

          markersRef.current.push(marker);
        }
      });

      if (showRoutes && markersRef.current.length > 1) {
        if (routingControlRef.current) {
          mapRef.current.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        }

        const validTemples = templeData.filter(
          (temple) =>
            temple.latitude &&
            temple.longitude &&
            !isNaN(parseFloat(temple.latitude)) &&
            !isNaN(parseFloat(temple.longitude))
        );

        const latlngs = validTemples.map((temple) => [
          parseFloat(temple.latitude),
          parseFloat(temple.longitude),
        ]);

        if (latlngs.length > 0) {
          const startTemple = validTemples[0];
          const startPopupContent = `
            <div style="font-family: Arial, sans-serif; min-width: 200px;">
              <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 8px; margin: -10px -10px 10px -10px; border-radius: 4px 4px 0 0;">
                <strong style="font-size: 16px;">🚩 START POINT</strong>
              </div>
              <strong style="color: #333; font-size: 14px;">${
                startTemple.name || "Temple"
              }</strong><br>
              <span style="color: #666;">District: ${
                startTemple.dtname || "N/A"
              }</span><br>
              <span style="color: #666;">Deity: ${
                startTemple.god_name || "N/A"
              }</span><br>
              <span style="color: #666;">Description: ${
                startTemple.placepageu || "N/A"
              }</span><br>
              <div style="margin-top: 8px; padding: 4px; background: #e8f5e8; border-radius: 3px; font-size: 12px; color: #155724;">
                <strong>Route begins here</strong>
              </div>
            </div>
          `;

          const startMarker = L.marker([latlngs[0][0], latlngs[0][1]], {
            icon: startIcon,
          })
            .bindPopup(startPopupContent, {
              maxWidth: 250,
              className: "start-popup",
            })
            .addTo(mapRef.current);

          startEndMarkersRef.current.push(startMarker);
        }

        if (latlngs.length > 1) {
          const endTemple = validTemples[validTemples.length - 1];
          const endPopupContent = `
            <div style="font-family: Arial, sans-serif; min-width: 200px;">
              <div style="background: linear-gradient(135deg, #dc3545, #e74c3c); color: white; padding: 8px; margin: -10px -10px 10px -10px; border-radius: 4px 4px 0 0;">
                <strong style="font-size: 16px;">🏁 END POINT</strong>
              </div>
              <strong style="color: #333; font-size: 14px;">${
                endTemple.name || "Temple"
              }</strong><br>
              <span style="color: #666;">District: ${
                endTemple.dtname || "N/A"
              }</span><br>
              <span style="color: #666;">Deity: ${
                endTemple.god_name || "N/A"
              }</span><br>
              <span style="color: #666;">Description: ${
                endTemple.placepageu || "N/A"
              }</span><br>
              <div style="margin-top: 8px; padding: 4px; background: #f8d7da; border-radius: 3px; font-size: 12px; color: #721c24;">
                <strong>Route ends here</strong>
              </div>
            </div>
          `;

          const endMarker = L.marker(
            [latlngs[latlngs.length - 1][0], latlngs[latlngs.length - 1][1]],
            { icon: endIcon }
          )
            .bindPopup(endPopupContent, {
              maxWidth: 250,
              className: "end-popup",
            })
            .addTo(mapRef.current);

          startEndMarkersRef.current.push(endMarker);
        }

        routingControlRef.current = L.Routing.control({
          waypoints: latlngs.map(([lat, lng]) => L.latLng(lat, lng)),
          router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
          }),
          lineOptions: {
            styles: [{ color: "blue", weight: 4, opacity: 0.7 }],
          },
          createMarker: () => null,
          addWaypoints: false,
          routeWhileDragging: false,
          show: true,
          collapsible: false,
          collapseBtnClass: "leaflet-routing-collapse-btn",
        }).addTo(mapRef.current);

        setTimeout(() => {
          const routingContainer = document.querySelector(
            ".leaflet-routing-container"
          );
          if (routingContainer) {
            const header = document.createElement("div");
            header.className = "routing-header";
            header.innerHTML = `
              <span>🗺️ Route Details</span>
              <button class="routing-close-btn" title="Hide Routes">×</button>
            `;

            // Add resize handle
            const resizeHandle = document.createElement("div");
            resizeHandle.className = "resize-handle";

            routingContainer.insertBefore(header, routingContainer.firstChild);
            routingContainer.appendChild(resizeHandle);

            // Make the popup draggable
            let isDragging = false;
            let dragOffset = { x: 0, y: 0 };

            header.addEventListener("mousedown", (e) => {
              // Handle close button click
              if (e.target.classList.contains("routing-close-btn")) {
                if (routingControlRef.current && mapRef.current) {
                  mapRef.current.removeControl(routingControlRef.current);
                  routingControlRef.current = null;
                  startEndMarkersRef.current.forEach((marker) => {
                    if (mapRef.current.hasLayer(marker)) {
                      mapRef.current.removeLayer(marker);
                    }
                  });
                  startEndMarkersRef.current = [];
                }
                return;
              }

              // Start dragging
              isDragging = true;
              const rect = routingContainer.getBoundingClientRect();
              dragOffset.x = e.clientX - rect.left;
              dragOffset.y = e.clientY - rect.top;

              // Add dragging class for visual feedback
              routingContainer.classList.add("dragging");

              document.addEventListener("mousemove", handleDrag);
              document.addEventListener("mouseup", handleDragEnd);
              e.preventDefault();
            });

            const handleDrag = (e) => {
              if (!isDragging) return;

              // Calculate new position
              let newX = e.clientX - dragOffset.x;
              let newY = e.clientY - dragOffset.y;

              // Keep within viewport bounds
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              const containerWidth = routingContainer.offsetWidth;
              const containerHeight = routingContainer.offsetHeight;

              newX = Math.max(
                0,
                Math.min(newX, viewportWidth - containerWidth)
              );
              newY = Math.max(
                0,
                Math.min(newY, viewportHeight - containerHeight)
              );

              // Apply new position
              routingContainer.style.left = newX + "px";
              routingContainer.style.top = newY + "px";
              routingContainer.style.right = "auto";
              routingContainer.style.transform = "none";
            };

            const handleDragEnd = () => {
              isDragging = false;
              routingContainer.classList.remove("dragging");
              document.removeEventListener("mousemove", handleDrag);
              document.removeEventListener("mouseup", handleDragEnd);
            };

            let isResizing = false;

            resizeHandle.addEventListener("mousedown", (e) => {
              isResizing = true;
              document.addEventListener("mousemove", handleResize);
              document.addEventListener("mouseup", handleResizeEnd);
              e.preventDefault();
              e.stopPropagation();
            });

            const handleResize = (e) => {
              if (!isResizing) return;

              const rect = routingContainer.getBoundingClientRect();
              const newWidth = e.clientX - rect.left;
              const newHeight = e.clientY - rect.top;

              if (newWidth > 250 && newWidth < 600) {
                routingContainer.style.width = newWidth + "px";
              }
              if (newHeight > 150 && newHeight < 500) {
                routingContainer.style.height = newHeight + "px";
              }
            };

            const handleResizeEnd = () => {
              isResizing = false;
              document.removeEventListener("mousemove", handleResize);
              document.removeEventListener("mouseup", handleResizeEnd);
            };
          }
        }, 100);
      }

      if (markersRef.current.length > 0) {
        const allMarkers = [
          ...markersRef.current,
          ...startEndMarkersRef.current,
        ];
        const group = new L.featureGroup(allMarkers);
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [templeData, showRoutes]);

  return <div id="map"></div>;
};

export default MapComponent;
