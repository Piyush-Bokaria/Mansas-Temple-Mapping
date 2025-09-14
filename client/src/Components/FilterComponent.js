import React, { useState } from "react";

const FilterComponent = ({ setTempleData, setShowRoutes }) => {
  const [selectedDeity, setSelectedDeity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const handleSubmit = async () => {
    const filters = {
      district: selectedDistrict || "All",
      deity: selectedDeity || "All",
    };
    console.log(filters);

    try {
      const response = await fetch(
        `http://localhost:5000/getTemples?deity=${encodeURIComponent(
          filters.deity
        )}&district=${encodeURIComponent(filters.district)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response from backend:", data);

      // Update the temple data in parent component
      if (setTempleData) {
        setTempleData(data);
      }

      // Show routes when filters are applied
      if (setShowRoutes) {
        setShowRoutes(true);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleReset = async () => {
    setSelectedDeity("");
    setSelectedDistrict("");

    // Reset to show all temples without routes
    try {
      const response = await fetch("http://localhost:5000/getTemples");
      const data = await response.json();

      if (setTempleData) {
        setTempleData(data);
      }

      // Hide routes when reset
      if (setShowRoutes) {
        setShowRoutes(false);
      }
    } catch (error) {
      console.error("Error fetching all temple data:", error);
    }
  };

  return (
    <div id="filter_container">
      <h3>Get the Routes: </h3>

      <div id="districts">
        <label>District: </label>
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          style={{color:"blueviolet"}}
        >
          <option className="option" value="All">All</option>
          <option className="option" value="Alluri Sitharamaraju">Alluri Sitharamaraju</option>
          <option className="option" value="Anakapalli">Anakapalli</option>
          <option className="option" value="Konaseema">Konaseema</option>
          <option className="option" value="Srikakulam">Srikakulam</option>
          <option className="option" value="Visakhapatnam">Visakhapatnam</option>
          <option className="option" value="Vizianagaram">Vizianagaram</option>
        </select>
      </div>

      <div id="deity">
        <label>Deity: </label>
        <select
          value={selectedDeity}
          style={{color:"blueviolet"}}
          onChange={(e) => setSelectedDeity(e.target.value)}
        >
          <option value="All">All</option>
          <option value="Shiva">Shiva</option>
          <option value="Vishnu">Vishnu</option>
          <option value="Ammavari">Ammavari</option>
        </select>
      </div>

      <div id="filter_buttons">
        <button onClick={handleSubmit} type="button">
          Apply Filters
        </button>
        <button onClick={handleReset} type="button">
          Reset
        </button>
      </div>
    </div>
  );
};

export default FilterComponent;
