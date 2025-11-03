from ultralytics import YOLO
import os


def main():
    print("--- 1. Defining File Paths ---")
    run_folder_path = os.path.join("runs", "detect", "farmland_detection_run_local2")
    model_path = os.path.join(run_folder_path, "weights", "best.pt")
    test_image_name = "testImage.jpg"
    image_path = os.path.join("AIDataSet", "test", "images", test_image_name)
    print(f"Model path: {model_path}")
    print(f"Image path: {image_path}")

    print(f"\n--- 2. Loading custom model from: {model_path} ---")
    try:
        model = YOLO(model_path)
    except FileNotFoundError:
        print(f"Error: Model file not found at {model_path}")
        print("Please check: Did the 'train_model.py' script finish running?")
        return
    except Exception as e:
        print(f"An error occurred while loading the model: {e}")
        return
    print("Custom model loaded successfully.")
    print(f"\n--- 3. Running prediction on: {image_path} ---")
    results = model(image_path)
    print("\n--- 4. Saving annotated image... ---")
    annotated_results = model(
        image_path,
        save=True,
        project=run_folder_path,
        name="prediction_results",
    )

    print(f"\nPrediction complete!")
    print(
        f"Annotated image saved in: {os.path.join(run_folder_path, 'prediction_results')}"
    )


if __name__ == "__main__":
    main()
