from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

import math
from ..database import engine

router = APIRouter()


@router.get("/api/provinces")
def get_provinces():
    SQL_SENTENCE = text(
        "SELECT DISTINCT name FROM admin_county_polygon ORDER BY name ASC;"
    )
    conn = engine.connect()
    try:
        result = conn.execute(SQL_SENTENCE).all()
        provinces = []
        for row in result:
            provinces = [row[0] for row in result]
    finally:
        conn.close()
    return provinces


@router.get("/api/province_bounds/{province_name}")
def get_province_bounds(province_name: str):
    SQL_SENTENCE = text(
        "SELECT ST_Extent(geom) FROM admin_county_polygon WHERE name = :p_name"
    )
    conn = engine.connect()
    try:
        result = conn.execute(SQL_SENTENCE, {"p_name": province_name})
        box_string = result.scalar_one_or_none()
        print(f"Database returned BBOX string for {province_name}: {box_string}")
        coords_part = box_string.replace("BOX(", "").replace(")", "")
        coords_part = coords_part.replace(",", " ")
        coords_list = coords_part.split(" ")
        min_lon = float(coords_list[0])
        min_lat = float(coords_list[1])
        max_lon = float(coords_list[2])
        max_lat = float(coords_list[3])

        leaflet_bounds = [
            [min_lat, min_lon],
            [max_lat, max_lon],
        ]
    finally:
        conn.close()
    return leaflet_bounds


# File: backend/Scripts/routers/dashboard.py

# ... (在文件顶部确保你导入了 text 和 engine) ...


@router.get("/api/facility_stats/{province_name}")
def get_facility_stats(province_name: str):
    """
    Calculates the count of facilities in a specific province and the total count nationwide.
    """
    # Query for the count within the specified province
    province_count_sql = text(
        "SELECT count(*) FROM education_facilities_points WHERE province_name = :p_name"
    )
    # Query for the total count nationwide
    total_count_sql = text("SELECT count(*) FROM education_facilities_points")

    conn = engine.connect()
    try:
        # Execute first query
        province_result = conn.execute(province_count_sql, {"p_name": province_name})
        province_count = province_result.scalar_one_or_none() or 0

        # Execute second query
        total_result = conn.execute(total_count_sql)
        total_count = total_result.scalar_one_or_none() or 0
    finally:
        conn.close()

    return {
        "province_name": province_name,
        "province_count": province_count,
        "total_count": total_count,
    }
