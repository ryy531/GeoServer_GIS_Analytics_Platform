import torch
from ultralytics import YOLO
import os


def main():
    """
    Main function to run the training process.
    """
    print("--- 1. Checking PyTorch Environment ---")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"PyTorch is using: {device.upper()}")
    if device == "cuda":
        print(f"Detected GPU: {torch.cuda.get_device_name(0)}")

    print("\n--- 2. Loading YOLOv8 Base Model (PyTorch architecture) ---")
    model = YOLO("yolov8n.pt")
    model.to(device)

    print("YOLOv8n (nano) model loaded successfully.")

    # --- 3. Define Data Path ---

    data_path = os.path.join("AIDataSet", "data.yaml")

    print(f"\n--- 3. Using dataset configuration: {data_path} ---")
    print("\n--- 4. Starting PyTorch Fine-Tuning ---")
    results = model.train(
        data=data_path,
        epochs=50,
        imgsz=640,
        device=device,
        name="farmland_detection_run_local",
    )
    print("\n--- 5. Training Complete! ---")
    print(f"Training results saved to: {results.save_dir}")
    print("You can find your 'best.pt' model file in that directory!")


if __name__ == "__main__":
    main()
