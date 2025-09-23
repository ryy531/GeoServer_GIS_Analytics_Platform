from fastapi import APIRouter, UploadFile, File
import shutil
from ultralytics import YOLO

router = APIRouter()


@router.post("/api/ai/detect_objects")
async def detect_objects_in_image(image: UploadFile = File(...)):
    file_path = f"temp_{image.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    model = YOLO("yolov8n.pt")
    results = model(file_path)
    detections = []
    for result in results:
        class_names = result.names
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            confidence = box.conf[0].item()
            class_id = int(box.cls[0].item())
            class_name = class_names[class_id]
            detection_data = {
                "class_name": class_name,
                "confidence": confidence,
                "box": [x1, y1, x2, y2],
            }
            detections.append(detection_data)

    return {
        "message": f"Successfully uploaded {image.filename} and saved to {file_path}",
        "detections": detections,
    }
