# Mansas Temple Mapping & Route Optimization

## ❓ What is this

Mansas Temple Mapping is a web application for mapping temples managed by the MANSAS Trust across various districts of Andhra Pradesh. It allows users to view temple locations, optimize and display routes between them, apply filters (by deity, district), and view details of each temple interactively.

## 🛠 Project Structure

```
Mansas-Temple-Mapping/
├── client/            ← Frontend code (JS + HTML + CSS)  
├── server/            ← Backend code (APIs, DB connections)  
├── index.html         ← Entry HTML page (if applicable)  
├── .gitignore
├── LICENSE
└── README.md
```

* **client/**: Contains code for rendering map UI, handling user interactions, displaying temple points, routing, filters.
* **server/**: Contains backend logic — fetching temple data, possibly routing computations, API endpoints.
* **index.html**: Probably frontend entry point (if not using bundler).
* Other supporting files: `.gitignore`, license, etc.

## 🔧 Technologies & Tools

* **Frontend**: JavaScript, HTML, CSS, possibly using mapping libraries (Leaflet / OpenLayers)
* **Backend**: Node.js + Express (I saw a “server” folder)
* **Database**: PostgreSQL with PostGIS (for spatial support)
* **Routing / Optimization**: Either via some routing engine or custom logic
* **Data Source**: Temple shapefiles / GeoJSON or similar, road networks, district data

## 🚀 Features / What it can do

* Display temple locations on a map
* Route optimization between temples
* Filter temples based on attributes (e.g. deity, district)
* Display temple details (name, location, deity, etc.) on hover or click
* Use of custom markers / images instead of generic dots

## ⚙️ Setup Instructions

These are generic steps; adapt based on your machine.

### Prerequisites

* Node.js installed
* PostgreSQL installed with PostGIS extension
* GIS data: temple points, road network data, etc.

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/Piyush-Bokaria/Mansas-Temple-Mapping.git
   cd Mansas-Temple-Mapping
   ```

2. **Backend Setup**

   * Navigate to `server/` folder

   * Install dependencies:

     ```bash
     npm install
     ```

   * Set up your `.env` or config for DB connection (host, user, password, database)

   * Ensure PostGIS is enabled:

     ```sql
     CREATE EXTENSION postgis;
     ```

   * Load temple data and road network into PostGIS
     (via QGIS / shp2pgsql / ogr2ogr or osm2pgsql etc.)

3. **Frontend Setup**

   * Navigate to `client/` folder
   * Install dependencies (if used)
   * Serve statically or via express static files

4. **Run**

   * Start backend API server: e.g.

     ```bash
     node server/index.js
     ```
   * Open frontend (index.html or via server) in browser

5. **Testing / Using**

   * Map should load temple points
   * Try filtering / routing / hover for details

## 🧩 Ideas for Improvements

* Detect user location and show route from user → nearest temple
* Use custom icons/images for different temples / deities
* Performance optimizations (loading only visible temples, clustering etc.)
* Better UI: tooltips/popups, responsive layout

## 💼 License

This project is under **MIT License** — free to use, modify, distribute.
