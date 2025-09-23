// File: frontend/src/components/GeoAIAnalyzer.jsx

import React, { useState, useRef, useEffect } from "react";
import { analyzeImageWithAI } from "../services/apiService";

// Define the color palette outside the component to prevent re-creation on re-renders.
const COLOR_PALETTE = {
  person: "yellow",
  car: "#0096FF",
  truck: "#4CBB17",
  default: "red",
};

function GeoAIAnalyzer() {
  // State to hold the user-selected image file.
  const [selectedFile, setSelectedFile] = useState(null);
  // State to store the analysis results received from the backend.
  const [aiResult, setAiResult] = useState(null);
  // State to track which detection box is currently highlighted by the user.
  const [highlightedBox, setHighlightedBox] = useState(null);
  // A ref to get direct access to the <canvas> DOM element.
  const canvasRef = useRef(null);

  // This function is triggered when the user selects a file from the input.
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Reset previous results when a new file is chosen.
      setAiResult(null);
      setHighlightedBox(null);
    }
  };

  // This function is triggered when the "Analyze Image" button is clicked.
  const handleAnalyzeClick = () => {
    if (!selectedFile) {
      alert("Please choose an image first!");
      return;
    }
    analyzeImageWithAI(selectedFile)
      .then((data) => {
        setAiResult(data);
      })
      .catch((error) => {
        console.error("Failed to analyze image:", error);
      });
  };

  // This `useEffect` hook is responsible for all canvas drawing operations.
  // It runs whenever selectedFile, aiResult, or highlightedBox changes.
  useEffect(() => {
    // We can only draw if a file has been selected.
    if (!selectedFile) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = new Image();
    image.src = URL.createObjectURL(selectedFile);

    // We must wait for the image to fully load before drawing it.
    image.onload = () => {
      // Set canvas dimensions to match the image.
      canvas.width = image.width;
      canvas.height = image.height;
      // Draw the image as the background of the canvas.
      ctx.drawImage(image, 0, 0);

      // If we have AI results, draw the detection boxes.
      if (aiResult && aiResult.detections) {
        aiResult.detections.forEach((detection) => {
          // Only draw boxes with a confidence score above 50%.
          if (detection.confidence > 0.5) {
            const [x1, y1, x2, y2] = detection.box;
            const color =
              COLOR_PALETTE[detection.class_name] || COLOR_PALETTE.default;

            // Set default styles.
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;

            // If this box is the one currently highlighted, make it stand out.
            if (highlightedBox && detection.box === highlightedBox.box) {
              ctx.strokeStyle = "white";
              ctx.lineWidth = 4;
            }

            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
          }
        });
      }
    };
  }, [selectedFile, aiResult, highlightedBox]); // Dependency array for the effect.

  return (
    // This is the vertical layout you designed.
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Controls for file selection and analysis */}
      <div className="geoai-controls">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={handleAnalyzeClick}>Analyze Image</button>
      </div>

      {/* Wrapper for the canvas to control its layout */}
      <div className="geoai-canvas-wrapper" style={{ marginTop: "15px" }}>
        <canvas ref={canvasRef} style={{ maxWidth: "100%" }}></canvas>
      </div>

      {/* The scrollable list of detected objects */}
      {aiResult && aiResult.detections && (
        <div className="geoai-results-list">
          <p>
            <strong>Detected Objects:</strong>
          </p>
          {aiResult.detections
            // We also filter the list to only show high-confidence results.
            .filter((d) => d.confidence > 0.5)
            // Use .map() to render a div for each detection.
            .map((detection, index) => (
              <div
                key={index}
                className={`geoai-result-item ${
                  highlightedBox === detection ? "highlighted" : ""
                }`}
                onClick={() => setHighlightedBox(detection)}
              >
                {`${detection.class_name} (${(
                  detection.confidence * 100
                ).toFixed(0)}%)`}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default GeoAIAnalyzer;
