import React, { useEffect, useRef, useState, useCallback } from "react";
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

// Deity-specific temple markers
const shivaIcon = L.divIcon({
  className: "shiva-marker",
  html: '<div style="background: linear-gradient(135deg, #FF6B35, #F7931E); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 6px rgba(255,107,53,0.4);">🔱</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const vishnuIcon = L.divIcon({
  className: "vishnu-marker",
  html: '<div style="background: linear-gradient(135deg, #4A90E2, #357ABD); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 6px rgba(74,144,226,0.4);">🐚</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const ammavariIcon = L.divIcon({
  className: "ammavari-marker",
  html: '<div style="background: linear-gradient(135deg, #E91E63, #C2185B); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 6px rgba(233,30,99,0.4);">🌺</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const defaultTempleIcon = L.divIcon({
  className: "default-temple-marker",
  html: '<div style="background: linear-gradient(135deg, #9C27B0, #7B1FA2); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 6px rgba(156,39,176,0.4);">ॐ</div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const startIcon = L.divIcon({
  className: "start-marker",
  html: '<div style="background-color: #28a745; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">START</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const endIcon = L.divIcon({
  className: "end-marker",
  html: '<div style="background-color: #dc3545; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">END</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const MapComponent = ({ templeData = [], showRoutes = false }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routingControlRef = useRef(null);
  const startEndMarkersRef = useRef([]);
  const routingIntegratedRef = useRef(false);
  const routingSidebarRef = useRef(null);
  const [currentRoute, setCurrentRoute] = useState({
    type: null,
    instructions: "",
    details: null,
    active: false,
  });
  const [sidebarPosition, setSidebarPosition] = useState({ x: 0, y: 0 });
  const [sidebarSize, setSidebarSize] = useState({ width: 300, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Temples sidebar state
  const [templesSidebarPosition, setTemplesSidebarPosition] = useState({
    x: 0,
    y: 0,
  });
  const [templesSidebarSize, setTemplesSidebarSize] = useState({
    width: 320,
    height: 500,
  });
  const [templesIsDragging, setTemplesIsDragging] = useState(false);
  const [templesIsResizing, setTemplesIsResizing] = useState(false);
  const templesRoutingSidebarRef = useRef(null);
  
  // TSP functionality state
  const [tspMode, setTspMode] = useState(false);
  const [selectedTemples, setSelectedTemples] = useState([]);
  const [tspStartPoint, setTspStartPoint] = useState(null);
  const [tspEndPoint, setTspEndPoint] = useState(null);
  const [isUpdatingTspSelection, setIsUpdatingTspSelection] = useState(false);
  const [isTspCalculating, setIsTspCalculating] = useState(false);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);

  // Cleanup function to handle component unmount
  useEffect(() => {
    return () => {
      // Cleanup routing control on unmount
      if (routingControlRef.current) {
        try {
          if (mapRef.current && mapRef.current._container) {
            mapRef.current.removeControl(routingControlRef.current);
          }
        } catch (error) {
          console.warn("Error cleaning up routing control on unmount:", error);
        } finally {
          routingControlRef.current = null;
        }
      }
    };
  }, []);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const newIsMobile = width <= 768;
      const newIsTablet = width > 768 && width <= 1024;
      
      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);

      // Adjust sidebar sizes based on screen size
      if (newIsMobile) {
        setSidebarSize({ 
          width: Math.min(350, width - 20), 
          height: Math.min(400, window.innerHeight * 0.6) 
        });
        setTemplesSidebarSize({ 
          width: Math.min(350, width - 20), 
          height: Math.min(500, window.innerHeight * 0.5) 
        });
        
        // Reset positions for mobile
        setSidebarPosition({ x: 0, y: 0 });
        setTemplesSidebarPosition({ x: 0, y: 0 });
      } else if (newIsTablet) {
        setSidebarSize({ 
          width: Math.min(400, width * 0.4), 
          height: Math.min(500, window.innerHeight * 0.7) 
        });
        setTemplesSidebarSize({ 
          width: Math.min(380, width * 0.35), 
          height: Math.min(600, window.innerHeight * 0.6) 
        });
      } else {
        // Desktop - use default or current sizes
        setSidebarSize(prev => ({ 
          width: Math.max(300, Math.min(600, prev.width)), 
          height: Math.max(200, Math.min(window.innerHeight * 0.8, prev.height)) 
        }));
        setTemplesSidebarSize(prev => ({ 
          width: Math.max(320, Math.min(500, prev.width)), 
          height: Math.max(200, Math.min(window.innerHeight * 0.7, prev.height)) 
        }));
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to determine marker icon based on deity
  const getTempleIcon = useCallback((temple) => {
    const deityName = (temple.god_name || "").toLowerCase();

    // Check for Shiva-related deities
    if (
      deityName.includes("shiva") ||
      deityName.includes("siva") ||
      deityName.includes("mahadeva") ||
      deityName.includes("rudra") ||
      deityName.includes("nataraja") ||
      deityName.includes("lingam") ||
      deityName.includes("linga") ||
      deityName.includes("mallikarjuna") ||
      deityName.includes("bhairava")
    ) {
      return shivaIcon;
    }

    // Check for Vishnu-related deities
    if (
      deityName.includes("vishnu") ||
      deityName.includes("venkateswara") ||
      deityName.includes("venkateshwara") ||
      deityName.includes("balaji") ||
      deityName.includes("narayana") ||
      deityName.includes("rama") ||
      deityName.includes("krishna") ||
      deityName.includes("govinda") ||
      deityName.includes("jagannath") ||
      deityName.includes("perumal") ||
      deityName.includes("tirupati")
    ) {
      return vishnuIcon;
    }

    // Check for Ammavari/Devi-related deities
    if (
      deityName.includes("ammavari") ||
      deityName.includes("amma") ||
      deityName.includes("devi") ||
      deityName.includes("durga") ||
      deityName.includes("lakshmi") ||
      deityName.includes("saraswati") ||
      deityName.includes("parvati") ||
      deityName.includes("kali") ||
      deityName.includes("chamundi") ||
      deityName.includes("mariamman") ||
      deityName.includes("yellamma") ||
      deityName.includes("goddess")
    ) {
      return ammavariIcon;
    }

    // Default temple icon for other deities
    return defaultTempleIcon;
  }, []);

  // Clear all routes function
  const clearAllRoutes = useCallback(() => {
    try {
      // Clear regular route with better error handling
      if (routingControlRef.current && mapRef.current && mapRef.current._container) {
        try {
          // Only remove if the routing control is properly initialized and attached
          if (routingControlRef.current._map && 
              routingControlRef.current._map === mapRef.current &&
              (!routingControlRef.current._pendingRequest || routingControlRef.current._pendingRequest.readyState === 4)) {
            // Control is fully initialized and not in the middle of a request
            if (mapRef.current.hasControl && mapRef.current.hasControl(routingControlRef.current)) {
              mapRef.current.removeControl(routingControlRef.current);
            } else if (routingControlRef.current._container) {
              mapRef.current.removeControl(routingControlRef.current);
            }
          } else {
            // Control exists but not properly attached/initialized or has pending request, just null it
            console.log("Routing control not ready for removal, nulling reference");
          }
        } catch (error) {
          console.warn("Error removing routing control in clearAllRoutes:", error);
        } finally {
          routingControlRef.current = null;
        }
      } else if (routingControlRef.current) {
        // If map is not available but routing control exists, just null it
        routingControlRef.current = null;
      }

      // Clear start/end markers
      startEndMarkersRef.current.forEach((marker) => {
        try {
          if (mapRef.current && marker && mapRef.current.hasLayer(marker)) {
            mapRef.current.removeLayer(marker);
          }
        } catch (error) {
          console.warn("Error removing marker:", error);
        }
      });
      startEndMarkersRef.current = [];

      // Reset integration flag
      routingIntegratedRef.current = false;

      setCurrentRoute({
        type: null,
        instructions: "",
        details: null,
        active: false,
      });
    } catch (error) {
      console.error("Error clearing routes:", error);
    }
  }, []);

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
        try {
          // Clear routing control before removing map
          if (routingControlRef.current && mapRef.current) {
            try {
              mapRef.current.removeControl(routingControlRef.current);
            } catch (error) {
              console.warn("Error removing routing control:", error);
            }
            routingControlRef.current = null;
          }

          // Clear all markers before removing map
          markersRef.current.forEach((marker) => {
            try {
              if (mapRef.current && marker && mapRef.current.hasLayer(marker)) {
                mapRef.current.removeLayer(marker);
              }
            } catch (error) {
              console.warn("Error removing temple marker during cleanup:", error);
            }
          });
          markersRef.current = [];

          startEndMarkersRef.current.forEach((marker) => {
            try {
              if (mapRef.current && marker && mapRef.current.hasLayer(marker)) {
                mapRef.current.removeLayer(marker);
              }
            } catch (error) {
              console.warn("Error removing start/end marker during cleanup:", error);
            }
          });
          startEndMarkersRef.current = [];

          // Remove map instance
          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
          }
        } catch (error) {
          console.error("Error during map cleanup:", error);
          // Force null the map reference even if cleanup fails
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear all markers
    markersRef.current.forEach((marker) => {
      try {
        if (mapRef.current && marker && mapRef.current.hasLayer(marker)) {
          mapRef.current.removeLayer(marker);
        }
      } catch (error) {
        console.warn("Error removing temple marker:", error);
      }
    });
    markersRef.current = [];

    // Clear all routes and reset state
    // Don't clear routes if we're just updating TSP temple selection
    if (!isUpdatingTspSelection) {
      clearAllRoutes();
    }

    if (templeData && templeData.length > 0) {
      templeData.forEach((temple) => {
        if (
          temple.latitude &&
          temple.longitude &&
          !isNaN(parseFloat(temple.latitude)) &&
          !isNaN(parseFloat(temple.longitude))
        ) {
          // TSP mode filtering: only show selected temples on map if any are selected
          const shouldShowOnMap = !tspMode || 
                                 selectedTemples.length === 0 || 
                                 selectedTemples.includes(temple) || 
                                 temple === tspStartPoint || 
                                 temple === tspEndPoint;
          
          if (!shouldShowOnMap) {
            return; // Skip this temple marker
          }
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

          const deityName = (temple.god_name || "").toLowerCase();
          let markerIcon = getTempleIcon(temple);

          const marker = L.marker([lat, lng], { icon: markerIcon })
            .bindPopup(popupContent, {
              maxWidth: 250,
              className: `temple-popup ${
                deityName.includes("shiva") || deityName.includes("siva")
                  ? "shiva-popup"
                  : deityName.includes("vishnu") ||
                    deityName.includes("venkateswara")
                  ? "vishnu-popup"
                  : deityName.includes("ammavari") || deityName.includes("devi")
                  ? "ammavari-popup"
                  : "default-popup"
              }`,
            })
            .addTo(mapRef.current);

          markersRef.current.push(marker);
        }
      });

      // Handle the existing showRoutes functionality
      // Don't show normal routes if custom temples are selected (TSP mode is active)
      if (showRoutes && markersRef.current.length > 1 && selectedTemples.length === 0) {
        // Clear any existing routes before creating new one
        clearAllRoutes();

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

        if (mapRef.current && mapRef.current._container) {
          try {
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
          show: false,
          collapsible: false,
        })
          .on("routesfound", function (e) {
            const routes = e.routes;
            const summary = routes[0].summary;
            const distance = (summary.totalDistance / 1000).toFixed(2);
            const time = Math.round(summary.totalTime / 60);

            // Extract detailed routing instructions
            const routeInstructions = routes[0].instructions || [];
            const detailedInstructions = routeInstructions.map(
              (instruction, index) => {
                const direction =
                  instruction.text || instruction.instruction || "Continue";
                const roadName = instruction.road || "";
                const distanceM = instruction.distance || 0;
                const distanceKm = (distanceM / 1000).toFixed(2);
                const timeS = instruction.time || 0;
                const timeMin = Math.round(timeS / 60);

                return {
                  step: index + 1,
                  direction: direction,
                  road: roadName,
                  distance: distanceKm,
                  time: timeMin,
                  type: instruction.type || "straight",
                };
              }
            );

            // Create full route details with all temples
            const fullRoute = validTemples.map((temple, index) => ({
              order: index + 1,
              name: temple.name || "Temple",
              district: temple.dtname || "N/A",
              deity: temple.god_name || "N/A",
            }));

            setCurrentRoute({
              type: "regular",
              instructions: `Route: ${distance} km | ${time} min | ${validTemples.length} temples`,
              details: {
                temples: fullRoute,
                distance: distance,
                time: time,
                totalTemples: validTemples.length,
                routingInstructions: detailedInstructions,
              },
              active: true,
            });
          })
          .addTo(mapRef.current);
          } catch (error) {
            console.error("Error creating regular routing control:", error);
            setCurrentRoute({
              type: null,
              instructions: "Error creating route",
              details: null,
              active: false,
            });
          }
        }

        // Integrate routing instructions into our unified sidebar with safety checks
        setTimeout(() => {
          if (routingIntegratedRef.current) return;

          const routingContainer = document.querySelector(
            ".leaflet-routing-container"
          );
          const integratedContainer = document.getElementById(
            "integrated-routing-instructions"
          );

          if (routingContainer && integratedContainer) {
            integratedContainer.innerHTML = "";
            routingContainer.style.display = "none";

            const routingAlternatives = routingContainer.querySelector(
              ".leaflet-routing-alternatives-container"
            );
            if (routingAlternatives) {
              const clonedContent = routingAlternatives.cloneNode(true);
              integratedContainer.appendChild(clonedContent);

              clonedContent.style.padding = "0";
              clonedContent.style.margin = "0";
              clonedContent.style.border = "none";
              clonedContent.style.background = "transparent";

              routingIntegratedRef.current = true;
            }
          }
        }, 200);
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
  }, [templeData, showRoutes, getTempleIcon, clearAllRoutes, tspMode, selectedTemples, tspStartPoint, tspEndPoint, isUpdatingTspSelection]);

  // Dragging and Resizing functionality for routing sidebar
  useEffect(() => {
    const sidebar = routingSidebarRef.current;
    if (!sidebar) return;

    let dragStartX = 0;
    let dragStartY = 0;
    let initialX = 0;
    let initialY = 0;
    let initialWidth = 0;
    let initialHeight = 0;

    const handleMouseDown = (e) => {
      if (
        e.target.closest(".close-routing-btn") ||
        e.target.closest(".routing-content") ||
        isMobile // Disable dragging on mobile
      )
        return;

      setIsDragging(true);
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialX = sidebarPosition.x;
      initialY = sidebarPosition.y;

      sidebar.classList.add("dragging");
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        const newX = Math.max(
          0,
          Math.min(window.innerWidth - sidebarSize.width, initialX + deltaX)
        );
        const newY = Math.max(
          0,
          Math.min(window.innerHeight - sidebarSize.height, initialY + deltaY)
        );

        setSidebarPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        const newWidth = Math.max(250, Math.min(600, initialWidth + deltaX));
        const newHeight = Math.max(200, Math.min(800, initialHeight + deltaY));

        setSidebarSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        sidebar.classList.remove("dragging");
      }
      if (isResizing) {
        setIsResizing(false);
        sidebar.classList.remove("resizing");
      }
    };

    const handleResizeMouseDown = (e) => {
      if (isMobile) return; // Disable resizing on mobile
      setIsResizing(true);
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialWidth = sidebarSize.width;
      initialHeight = sidebarSize.height;

      sidebar.classList.add("resizing");
      e.preventDefault();
      e.stopPropagation();
    };

    const header = sidebar.querySelector(".routing-header");
    const resizeHandle = sidebar.querySelector(".resize-handle");

    if (header) {
      header.addEventListener("mousedown", handleMouseDown);
    }

    if (resizeHandle) {
      resizeHandle.addEventListener("mousedown", handleResizeMouseDown);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (header) {
        header.removeEventListener("mousedown", handleMouseDown);
      }
      if (resizeHandle) {
        resizeHandle.removeEventListener("mousedown", handleResizeMouseDown);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, sidebarPosition, sidebarSize, isMobile]);

  // Dragging and Resizing functionality for temples sidebar
  useEffect(() => {
    const sidebar = templesRoutingSidebarRef.current;
    if (!sidebar) return;

    let dragStartX = 0;
    let dragStartY = 0;
    let initialX = 0;
    let initialY = 0;
    let initialWidth = 0;
    let initialHeight = 0;

    const handleMouseDown = (e) => {
      if (
        e.target.closest(".close-routing-btn") ||
        e.target.closest(".routing-content") ||
        isMobile // Disable dragging on mobile
      )
        return;

      setTemplesIsDragging(true);
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialX = templesSidebarPosition.x;
      initialY = templesSidebarPosition.y;

      sidebar.classList.add("dragging");
      e.preventDefault();
    };

    const handleMouseMove = (e) => {
      if (templesIsDragging) {
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        const newX = Math.max(
          0,
          Math.min(
            window.innerWidth - templesSidebarSize.width,
            initialX + deltaX
          )
        );
        const newY = Math.max(
          0,
          Math.min(
            window.innerHeight - templesSidebarSize.height,
            initialY + deltaY
          )
        );

        setTemplesSidebarPosition({ x: newX, y: newY });
      } else if (templesIsResizing) {
        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        const newWidth = Math.max(250, Math.min(600, initialWidth + deltaX));
        const newHeight = Math.max(200, Math.min(800, initialHeight + deltaY));

        setTemplesSidebarSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      if (templesIsDragging) {
        setTemplesIsDragging(false);
        sidebar.classList.remove("dragging");
      }
      if (templesIsResizing) {
        setTemplesIsResizing(false);
        sidebar.classList.remove("resizing");
      }
    };

    const handleResizeMouseDown = (e) => {
      if (isMobile) return; // Disable resizing on mobile
      setTemplesIsResizing(true);
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      initialWidth = templesSidebarSize.width;
      initialHeight = templesSidebarSize.height;

      sidebar.classList.add("resizing");
      e.preventDefault();
      e.stopPropagation();
    };

    const header = sidebar.querySelector(".routing-header");
    const resizeHandle = sidebar.querySelector(".resize-handle");

    if (header) {
      header.addEventListener("mousedown", handleMouseDown);
    }

    if (resizeHandle) {
      resizeHandle.addEventListener("mousedown", handleResizeMouseDown);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (header) {
        header.removeEventListener("mousedown", handleMouseDown);
      }
      if (resizeHandle) {
        resizeHandle.removeEventListener("mousedown", handleResizeMouseDown);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    templesIsDragging,
    templesIsResizing,
    templesSidebarPosition,
    templesSidebarSize,
    isMobile,
  ]);

  // TSP Algorithm Functions
  const calculateDistance = (temple1, temple2) => {
    const lat1 = parseFloat(temple1.latitude);
    const lng1 = parseFloat(temple1.longitude);
    const lat2 = parseFloat(temple2.latitude);
    const lng2 = parseFloat(temple2.longitude);
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const solveTSP = (temples, startPoint, endPoint) => {
    if (temples.length === 0) return [];
    if (temples.length === 1) return temples;
    
    // Simple nearest neighbor heuristic for TSP
    const visited = new Set();
    const route = [];
    let current = startPoint || temples[0];
    
    if (startPoint) {
      route.push(startPoint);
      visited.add(startPoint);
    }
    
    while (visited.size < temples.length + (startPoint ? 1 : 0) + (endPoint ? 1 : 0)) {
      let nearest = null;
      let minDistance = Infinity;
      
      temples.forEach(temple => {
        if (!visited.has(temple)) {
          const distance = calculateDistance(current, temple);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = temple;
          }
        }
      });
      
      if (nearest) {
        route.push(nearest);
        visited.add(nearest);
        current = nearest;
      } else {
        break;
      }
    }
    
    if (endPoint && !visited.has(endPoint)) {
      route.push(endPoint);
    }
    
    return route;
  };

  const handleTempleSelection = (temple) => {
    if (!tspMode) return;
    
    setIsUpdatingTspSelection(true);
    
    if (selectedTemples.includes(temple)) {
      setSelectedTemples(selectedTemples.filter(t => t !== temple));
    } else {
      setSelectedTemples([...selectedTemples, temple]);
    }
    
    // Reset the flag after a short delay to allow state updates
    setTimeout(() => {
      setIsUpdatingTspSelection(false);
    }, 100);
  };

  const calculateTSPRoute = () => {
    if (selectedTemples.length < 2) {
      alert("Please select at least 2 temples for TSP routing");
      return;
    }
    
    // Check if map is still valid
    if (!mapRef.current || !mapRef.current._container) {
      console.warn("Map is not available for TSP routing");
      return;
    }
    
    // Prevent overlapping calculations
    if (isTspCalculating) {
      console.log("TSP calculation already in progress, skipping...");
      return;
    }
    
    setIsTspCalculating(true);
    
    // Small delay to ensure any pending routing requests are completed
    setTimeout(() => {
      performTSPCalculation();
    }, 150);
  };
  
  const performTSPCalculation = () => {
    // Double-check temple count (in case it changed during the delay)
    if (selectedTemples.length < 2) {
      console.log("Not enough temples selected for TSP routing");
      setIsTspCalculating(false);
      return;
    }
    
    const optimizedRoute = solveTSP(selectedTemples, tspStartPoint, tspEndPoint);
    
    // Validate optimized route
    if (!optimizedRoute || optimizedRoute.length < 2) {
      console.log("Optimized route has insufficient temples");
      setIsTspCalculating(false);
      return;
    }
    
    // Clear existing routes with proper error handling
    if (routingControlRef.current && mapRef.current && mapRef.current._container) {
      try {
        // Only remove if the routing control is properly initialized and attached
        if (routingControlRef.current._map && 
            routingControlRef.current._map === mapRef.current &&
            (!routingControlRef.current._pendingRequest || routingControlRef.current._pendingRequest.readyState === 4)) {
          // Control is fully initialized and not in the middle of a request
          if (mapRef.current.hasControl && mapRef.current.hasControl(routingControlRef.current)) {
            mapRef.current.removeControl(routingControlRef.current);
          } else if (routingControlRef.current._container) {
            mapRef.current.removeControl(routingControlRef.current);
          }
        } else {
          // Control exists but not properly attached/initialized or has pending request, just null it
          console.log("Routing control not ready for removal in TSP, nulling reference");
        }
      } catch (error) {
        console.warn("Error removing existing routing control in TSP:", error);
      } finally {
        routingControlRef.current = null;
      }
    } else if (routingControlRef.current) {
      // If map is not available but routing control exists, just null it
      routingControlRef.current = null;
    }
    
    // Clear start/end markers
    startEndMarkersRef.current.forEach(marker => {
      try {
        if (mapRef.current && marker && mapRef.current.hasLayer(marker)) {
          mapRef.current.removeLayer(marker);
        }
      } catch (error) {
        console.warn("Error removing start/end marker:", error);
      }
    });
    startEndMarkersRef.current = [];
    
    // Create route with optimized order
    const latlngs = optimizedRoute.map(temple => [
      parseFloat(temple.latitude),
      parseFloat(temple.longitude)
    ]);
    
    if (latlngs.length > 1 && mapRef.current && mapRef.current._container) {
      try {
        routingControlRef.current = L.Routing.control({
          waypoints: latlngs.map(latlng => L.latLng(latlng[0], latlng[1])),
          routeWhileDragging: false,
          addWaypoints: false,
          createMarker: () => null,
          lineOptions: {
            styles: [{ color: '#FF6B35', weight: 4, opacity: 0.8 }]
          }
        })
      .on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        const distance = (summary.totalDistance / 1000).toFixed(2);
        const time = Math.round(summary.totalTime / 60);
        
        // Extract detailed routing instructions
        const routeInstructions = routes[0].instructions || [];
        const detailedInstructions = routeInstructions.map(
          (instruction, index) => {
            const direction =
              instruction.text || instruction.instruction || "Continue";
            const roadName = instruction.road || "";
            const distanceM = instruction.distance || 0;
            const distanceKm = (distanceM / 1000).toFixed(2);
            const timeS = instruction.time || 0;
            const timeMin = Math.round(timeS / 60);

            return {
              step: index + 1,
              direction: direction,
              road: roadName,
              distance: distanceKm,
              time: timeMin,
              type: instruction.type || "straight",
            };
          }
        );
        
        setCurrentRoute({
          type: "tsp",
          instructions: `TSP Route: ${distance} km | ${time} min | ${optimizedRoute.length} temples`,
          details: {
            temples: optimizedRoute.map((temple, index) => ({
              order: index + 1,
              name: temple.name || "Temple",
              district: temple.dtname || "N/A",
              deity: temple.god_name || "N/A",
            })),
            distance: distance,
            time: time,
            totalTemples: optimizedRoute.length,
            routingInstructions: detailedInstructions,
          },
          active: true,
        });
      })
      .addTo(mapRef.current);
      
      // Reset calculation flag on success
      setIsTspCalculating(false);
      } catch (error) {
        console.error("Error creating TSP routing control:", error);
        setCurrentRoute({
          type: null,
          instructions: "Error creating route",
          details: null,
          active: false,
        });
        
        // Reset calculation flag on error
        setIsTspCalculating(false);
      }
      
      // Add start and end markers
      if (tspStartPoint || optimizedRoute.length > 0) {
        const startTemple = tspStartPoint || optimizedRoute[0];
        const startMarker = L.marker([parseFloat(startTemple.latitude), parseFloat(startTemple.longitude)], {
          icon: startIcon,
        }).bindPopup(`<strong>TSP Start: ${startTemple.name}</strong>`).addTo(mapRef.current);
        startEndMarkersRef.current.push(startMarker);
      }
      
      if (tspEndPoint || optimizedRoute.length > 1) {
        const endTemple = tspEndPoint || optimizedRoute[optimizedRoute.length - 1];
        const endMarker = L.marker([parseFloat(endTemple.latitude), parseFloat(endTemple.longitude)], {
          icon: endIcon,
        }).bindPopup(`<strong>TSP End: ${endTemple.name}</strong>`).addTo(mapRef.current);
        startEndMarkersRef.current.push(endMarker);
      }
    } else {
      // If route creation was skipped, reset the flag
      setIsTspCalculating(false);
    }
  };

  const clearTSP = () => {
    setTspMode(false);
    setSelectedTemples([]);
    setTspStartPoint(null);
    setTspEndPoint(null);
    
    // Clear routes using existing routing state
    if (routingControlRef.current && mapRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }
    
    startEndMarkersRef.current.forEach(marker => {
      try {
        if (mapRef.current && marker && mapRef.current.hasLayer(marker)) {
          mapRef.current.removeLayer(marker);
        }
      } catch (error) {
        console.warn("Error removing TSP marker:", error);
      }
    });
    startEndMarkersRef.current = [];
    
    setCurrentRoute({
      type: null,
      instructions: "",
      details: null,
      active: false,
    });
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Temples List Sidebar - Same style as route sidebar */}
      {templeData && templeData.length > 0 && (
        <div
          ref={templesRoutingSidebarRef}
          className={`unified-routing-sidebar ${
            templesIsDragging ? "dragging" : ""
          } ${templesIsResizing ? "resizing" : ""}`}
          style={{
            position: "fixed",
            left:
              templesSidebarPosition.x === 0
                ? "10px"
                : `${templesSidebarPosition.x}px`,
            top:
              templesSidebarPosition.y !== 0
                ? `${templesSidebarPosition.y}px`
                : "50%",
            transform:
              templesSidebarPosition.y === 0 ? "translateY(-50%)" : "none",
            width: `${templesSidebarSize.width}px`,
            height: `${templesSidebarSize.height}px`,
            zIndex: 1000,
          }}
        >
          <div className="routing-header" style={{ cursor: "move" }}>
            <span>
              🏛️ Temples (
              {
                templeData.filter(
                  (temple) =>
                    temple.latitude &&
                    temple.longitude &&
                    !isNaN(parseFloat(temple.latitude)) &&
                    !isNaN(parseFloat(temple.longitude))
                ).length
              }
              )
            </span>
            <button
              className="close-routing-btn"
              onClick={() => {
                setTemplesSidebarPosition({ x: 0, y: 0 });
                setTemplesSidebarSize({ width: 320, height: 500 });
              }}
            >
              ✕
            </button>
          </div>

          <div className="routing-content">
            <div className="temples-section">
              <h4 style={{color:"blueviolet"}}>Available Temples</h4>
              
              {/* TSP Controls */}
              <div className="tsp-controls" style={{ 
                marginBottom: "15px", 
                padding: "10px", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "6px",
                border: "1px solid #e9ecef"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <button
                    onClick={() => {
                      if (tspMode) {
                        clearTSP();
                      } else {
                        // Clear any existing regular route before enabling TSP mode
                        clearAllRoutes();
                        setTspMode(true);
                        setSelectedTemples([]);
                      }
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: tspMode ? "#dc3545" : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}
                  >
                    {tspMode ? "Exit TSP" : "TSP Mode"}
                  </button>
                  
                  {tspMode && (
                    <span style={{ fontSize: "11px", color: "#6c757d" }}>
                      {selectedTemples.length === 0 
                        ? "Click temples to select for TSP" 
                        : `${selectedTemples.length} selected (others hidden on map)`}
                    </span>
                  )}
                </div>
                
                {tspMode && (
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    <button
                      onClick={calculateTSPRoute}
                      disabled={selectedTemples.length < 2}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: selectedTemples.length >= 2 ? "#28a745" : "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: selectedTemples.length >= 2 ? "pointer" : "not-allowed",
                        fontSize: "11px"
                      }}
                    >
                      Calculate Route
                    </button>
                    
                    <button
                      onClick={() => {
                        setTspStartPoint(selectedTemples.length > 0 ? selectedTemples[0] : null);
                      }}
                      disabled={selectedTemples.length === 0}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: tspStartPoint ? "#17a2b8" : "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: selectedTemples.length > 0 ? "pointer" : "not-allowed",
                        fontSize: "11px"
                      }}
                    >
                      Set Start
                    </button>
                    
                    <button
                      onClick={() => {
                        setTspEndPoint(selectedTemples.length > 0 ? selectedTemples[selectedTemples.length - 1] : null);
                      }}
                      disabled={selectedTemples.length === 0}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: tspEndPoint ? "#fd7e14" : "#6c757d",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: selectedTemples.length > 0 ? "pointer" : "not-allowed",
                        fontSize: "11px"
                      }}
                    >
                      Set End
                    </button>
                  </div>
                )}
                
                {tspStartPoint && (
                  <div style={{ fontSize: "10px", color: "#17a2b8", marginTop: "4px" }}>
                    Start: {tspStartPoint.name}
                  </div>
                )}
                
                {tspEndPoint && (
                  <div style={{ fontSize: "10px", color: "#fd7e14", marginTop: "2px" }}>
                    End: {tspEndPoint.name}
                  </div>
                )}
              </div>
              
              <div className="temple-list">
                {templeData.map((temple, index) => {
                  if (
                    !temple.latitude ||
                    !temple.longitude ||
                    isNaN(parseFloat(temple.latitude)) ||
                    isNaN(parseFloat(temple.longitude))
                  ) {
                    return null;
                  }

                  const deityName = (temple.god_name || "").toLowerCase();
                  let templeType = "default";
                  let typeIcon = "🔱";
                  let typeColor = "#9C27B0";
                  const deityCat = temple.god_categy;

                  if (
                    deityName.includes("shiva") ||
                    deityName.includes("siva") ||
                    deityName.includes("mahadeva") ||
                    deityName.includes("rudra") ||
                    deityName.includes("nataraja") ||
                    deityName.includes("lingam") ||
                    deityName.includes("linga") ||
                    deityName.includes("mallikarjuna") ||
                    deityName.includes("bhairava") || 
                    deityName.includes("MALLIKARJUNA") || 
                    deityCat === 'shiva'
                  ) {
                    templeType = "shiva";
                    typeIcon = "🔱";
                    typeColor = "#FF6B35";
                  } else if (
                    deityName.includes("vishnu") ||
                    deityName.includes("venkateswara") ||
                    deityName.includes("venkateshwara") ||
                    deityName.includes("balaji") ||
                    deityName.includes("narayana") ||
                    deityName.includes("rama") ||
                    deityName.includes("krishna") ||
                    deityName.includes("govinda") ||
                    deityName.includes("jagannath") ||
                    deityName.includes("perumal") ||
                    deityName.includes("tirupati")
                  ) {
                    templeType = "vishnu";
                    typeIcon = "🐚⊍";
                    typeColor = "#4A90E2";
                  } else if (
                    deityName.includes("ammavari") ||
                    deityName.includes("amma") ||
                    deityName.includes("devi") ||
                    deityName.includes("durga") ||
                    deityName.includes("lakshmi") ||
                    deityName.includes("saraswati") ||
                    deityName.includes("parvati") ||
                    deityName.includes("kali") ||
                    deityName.includes("chamundi") ||
                    deityName.includes("mariamman") ||
                    deityName.includes("yellamma") ||
                    deityName.includes("goddess")
                  ) {
                    templeType = "ammavari";
                    typeIcon = "🌺";
                    typeColor = "#E91E63";
                  }

                  const isSelected = selectedTemples.includes(temple);
                  const isStartPoint = tspStartPoint === temple;
                  const isEndPoint = tspEndPoint === temple;

                  return (
                    <div
                      key={index}
                      className="temple-item"
                      onClick={() => {
                        if (tspMode) {
                          handleTempleSelection(temple);
                        } else {
                          // Center map on temple when clicked
                          if (mapRef.current) {
                            const lat = parseFloat(temple.latitude);
                            const lng = parseFloat(temple.longitude);
                            mapRef.current.setView([lat, lng], 15);

                            // Find and open the temple's popup
                            markersRef.current.forEach((marker) => {
                              const markerLatLng = marker.getLatLng();
                              if (
                                Math.abs(markerLatLng.lat - lat) < 0.0001 &&
                                Math.abs(markerLatLng.lng - lng) < 0.0001
                              ) {
                                marker.openPopup();
                              }
                            });
                          }
                        }
                      }}
                      style={{ 
                        cursor: "pointer",
                        backgroundColor: tspMode && isSelected ? "#e3f2fd" : "transparent",
                        border: tspMode && isSelected ? "2px solid #2196f3" : "none",
                        borderRadius: tspMode && isSelected ? "4px" : "0",
                        position: "relative"
                      }}
                    >
                      <span
                        className="temple-order"
                        style={{ backgroundColor: typeColor }}
                      >
                        {typeIcon}
                      </span>
                      <div className="temple-info">
                        <strong>{temple.name || "Temple"}</strong>
                        <div className="temple-meta">
                          <span>📍 {temple.dtname || "N/A"}</span>
                          <span>{typeIcon} {temple.god_name || "N/A"}</span>
                        </div>
                        {temple.placepageu && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#888",
                              marginTop: "4px",
                              fontStyle: "italic",
                            }}
                          >
                            {temple.placepageu.length > 80
                              ? `${temple.placepageu.substring(0, 80)}...`
                              : temple.placepageu}
                          </div>
                        )}
                        
                        {/* TSP Indicators */}
                        {tspMode && (
                          <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                            {isSelected && (
                              <span style={{ 
                                fontSize: "10px", 
                                backgroundColor: "#2196f3", 
                                color: "white", 
                                padding: "2px 6px", 
                                borderRadius: "10px" 
                              }}>
                                Selected
                              </span>
                            )}
                            {isStartPoint && (
                              <span style={{ 
                                fontSize: "10px", 
                                backgroundColor: "#28a745", 
                                color: "white", 
                                padding: "2px 6px", 
                                borderRadius: "10px" 
                              }}>
                                START
                              </span>
                            )}
                            {isEndPoint && (
                              <span style={{ 
                                fontSize: "10px", 
                                backgroundColor: "#dc3545", 
                                color: "white", 
                                padding: "2px 6px", 
                                borderRadius: "10px" 
                              }}>
                                END
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resize Handle */}
          <div className="resize-handle" title="Drag to resize"></div>
        </div>
      )}

      {/* Main Map Container */}
      <div style={{ flex: 1, position: "relative" }}>
        <div id="map"></div>

        {/* Temple Legend */}
        <div className="temple-legend">
          <div className="legend-header">Temple Types</div>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-marker shiva">🔱</span>
              <span className="legend-text">God Shiva Temples</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker vishnu">🐚</span>
              <span className="legend-text">God Vishnu Temples</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker ammavari">🌺</span>
              <span className="legend-text">Goddess Ammavari Temples</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker default">🕉️</span>
              <span className="legend-text">Other Deity Temples</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Routing Sidebar */}
      {(showRoutes || currentRoute.active) && (
        <div
          ref={routingSidebarRef}
          className={`unified-routing-sidebar ${isDragging ? "dragging" : ""} ${
            isResizing ? "resizing" : ""
          }`}
          style={{
            position: "fixed",
            right: sidebarPosition.x === 0 ? "10px" : "auto",
            left: sidebarPosition.x !== 0 ? `${sidebarPosition.x}px` : "auto",
            top: sidebarPosition.y !== 0 ? `${sidebarPosition.y}px` : "50%",
            transform: sidebarPosition.y === 0 ? "translateY(-50%)" : "none",
            width: `${sidebarSize.width}px`,
            height: `${sidebarSize.height}px`,
            zIndex: 1000,
          }}
        >
          <div className="routing-header" style={{ cursor: "move" }}>
            <span>🗺️ Route Details</span>
            <button
              className="close-routing-btn"
              onClick={() => {
                clearAllRoutes();
                setSidebarPosition({ x: 0, y: 0 });
                setSidebarSize({ width: 300, height: 400 });
              }}
            >
              ✕
            </button>
          </div>

          <div className="routing-content">
            {currentRoute.active && currentRoute.type === "regular" && (
              <div className="standard-route-section">
                <h4>Temple Route</h4>
                <div className="route-info-details">
                  <strong>Route:</strong> {currentRoute.instructions}
                </div>

                {/* Route Summary */}
                {currentRoute.details && (
                  <div className="route-summary-section">
                    <h5>Route Summary</h5>
                    <div className="route-stats">
                      <span>📏 {currentRoute.details.distance} km</span>
                      <span>⏱️ {currentRoute.details.time} min</span>
                      <span>
                        🏛️ {currentRoute.details.totalTemples} temples
                      </span>
                    </div>

                    {/* Detailed Routing Instructions */}
                    {currentRoute.details.routingInstructions &&
                      currentRoute.details.routingInstructions.length > 0 && (
                        <div className="routing-instructions">
                          <h6>Turn-by-Turn Directions:</h6>
                          <div className="instructions-list">
                            {currentRoute.details.routingInstructions.map(
                              (instruction, index) => (
                                <div key={index} className="instruction-item">
                                  <div className="instruction-step">
                                    <span className="step-number">
                                      {instruction.step}
                                    </span>
                                    <div className="instruction-content">
                                      <div className="instruction-text">
                                        <strong>{instruction.direction}</strong>
                                        {instruction.road && (
                                          <span className="road-name">
                                            {" "}
                                            on {instruction.road}
                                          </span>
                                        )}
                                      </div>
                                      <div className="instruction-meta">
                                        {parseFloat(instruction.distance) >
                                          0 && (
                                          <span className="distance">
                                            📏 {instruction.distance} km
                                          </span>
                                        )}
                                        {instruction.time > 0 && (
                                          <span className="time">
                                            ⏱️ {instruction.time} min
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Integrated Leaflet Routing Instructions */}
                <div id="integrated-routing-instructions">
                  {/* This will be populated by the routing control */}
                </div>
              </div>
            )}

            {currentRoute.active && currentRoute.type === "tsp" && (
              <div className="tsp-route-section">
                <h4>🎯 TSP Optimized Route</h4>
                <div className="route-info-details">
                  <strong>Route:</strong> {currentRoute.instructions}
                </div>

                {/* TSP Route Summary */}
                {currentRoute.details && (
                  <div className="route-summary-section">
                    <h5>Route Summary</h5>
                    <div className="route-stats">
                      <span>📏 {currentRoute.details.distance} km</span>
                      <span>⏱️ {currentRoute.details.time} min</span>
                      <span>
                        🏛️ {currentRoute.details.totalTemples} temples
                      </span>
                    </div>

                    {/* Detailed Routing Instructions */}
                    {currentRoute.details.routingInstructions &&
                      currentRoute.details.routingInstructions.length > 0 && (
                        <div className="routing-instructions">
                          <h6>🗺️ Turn-by-Turn Directions:</h6>
                          <div className="instructions-list">
                            {currentRoute.details.routingInstructions.map(
                              (instruction, index) => (
                                <div key={index} className="instruction-item">
                                  <div className="instruction-step">
                                    <span className="step-number">
                                      {instruction.step}
                                    </span>
                                    <div className="instruction-content">
                                      <div className="instruction-text">
                                        <strong>{instruction.direction}</strong>
                                        {instruction.road && (
                                          <span className="road-name">
                                            {" "}
                                            on {instruction.road}
                                          </span>
                                        )}
                                      </div>
                                      <div className="instruction-meta">
                                        {parseFloat(instruction.distance) >
                                          0 && (
                                          <span className="distance">
                                            📏 {instruction.distance} km
                                          </span>
                                        )}
                                        {instruction.time > 0 && (
                                          <span className="time">
                                            ⏱️ {instruction.time} min
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {/* Temple Visit Order */}
                    <div className="temple-order-section">
                      <h6>🏛️ Temple Visit Order:</h6>
                      <div className="temple-order-list">
                        {currentRoute.details.temples.map((temple, index) => (
                          <div key={index} className="temple-order-item">
                            <div className="temple-order-number">
                              {temple.order}
                            </div>
                            <div className="temple-order-info">
                              <div className="temple-name">
                                <strong>{temple.name}</strong>
                              </div>
                              <div className="temple-meta">
                                <span className="temple-district">
                                  📍 {temple.district}
                                </span>
                                <span className="temple-deity">
                                  🙏 {temple.deity}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* TSP Algorithm Info */}
                    <div className="tsp-info-section">
                      <h6>ℹ️ Route Optimization:</h6>
                      <div className="tsp-info-content">
                        <p>This route has been optimized using the Traveling Salesman Problem (TSP) algorithm to minimize travel distance between selected temples.</p>
                        <div className="tsp-stats">
                          <span>🎯 Algorithm: Nearest Neighbor Heuristic</span>
                          <span>⚡ Optimization: Distance Minimized</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div className="resize-handle" title="Drag to resize"></div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
