# File: backend/Scripts/routers/dashboard.py

from fastapi import APIRouter, Path
from pydantic import BaseModel
from sqlalchemy import text

import math
from ..database import engine

router = APIRouter()


@router.get(
    "/api/provinces",
    summary="Get List of All Provinces",
    description="Retrieves a sorted list of all unique province names available in the database.",
)
def get_provinces():
    SQL_SENTENCE = text(
        "SELECT DISTINCT name FROM admin_county_polygon ORDER BY name ASC;"
    )
    conn = engine.connect()
    try:
        result = conn.execute(SQL_SENTENCE).all()
        provinces = [row[0] for row in result]
    finally:
        conn.close()
    return provinces


@router.get(
    "/api/province_bounds/{province_name}",
    summary="Get Bounding Box for a Province",
    description="Takes a province name and returns its geographical bounding box as a nested list of coordinates [[min_lat, min_lon], [max_lat, max_lon]], suitable for use with Leaflet's fitBounds function.",
)
def get_province_bounds(
    province_name: str = Path(
        ...,  # '...' means the parameter is required
        description="The exact name of the province to query.",
        examples=["Punjab"],
    )
):
    """
    Fetches the bounding box for a given province.
    - **province_name**: The name of the province.
    """
    SQL_SENTENCE = text(
        "SELECT ST_Extent(geom) FROM admin_county_polygon WHERE name = :p_name"
    )
    conn = engine.connect()
    try:
        result = conn.execute(SQL_SENTENCE, {"p_name": province_name})
        box_string = result.scalar_one_or_none()
        if not box_string:
            return None  # Or raise HTTPException(status_code=404, detail="Province not found")

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


@router.get(
    "/api/facility_stats/{province_name}",
    summary="Get Facility Statistics for a Province",
    description="Calculates the total count of educational facilities within a specific province and also returns the total count of facilities nationwide for comparison.",
)
def get_facility_stats(
    province_name: str = Path(
        ...,
        description="The name of the province for which to calculate statistics.",
        examples=["Sindh"],
    )
):
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


@router.get(
    "/api/population_pyramid/{province_name}",
    summary="Get Population Pyramid Data",
    description="Retrieves population data aggregated by age groups and gender for a specified province. Use 'Nationwide' as province_name to get data for the entire country.",
)
def get_population_pyramid_data(
    province_name: str = Path(
        ...,
        description="The name of the province or the string 'Nationwide'.",
        examples=["Nationwide"],
    )
):
    """
    Calculates population distribution by age and gender for a specific province or nationwide.
    If 'Nationwide' is passed as province_name, it calculates for the whole country.
    """
    params = {}
    where_clause = ""
    if province_name != "Nationwide":
        where_clause = "WHERE province_name = :p_name"
        params["p_name"] = province_name

    age_groups = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80]
    sum_clauses = []
    for gender_prefix in ["f", "m"]:
        for age in age_groups:
            column_name = f'"{gender_prefix}_{age}"'
            alias = f"{gender_prefix}_{age}"
            sum_clauses.append(f"SUM({column_name}) as {alias}")

    select_sums = ", ".join(sum_clauses)
    sql_query = text(f"SELECT {select_sums} FROM pak_unadj_constrained {where_clause}")

    with engine.connect() as conn:
        result = conn.execute(sql_query, params).first()
        if not result:
            return {}  # Return empty if no data
        result_dict = dict(result._mapping)
        for key, value in result_dict.items():
            result_dict[key] = int(value) if value is not None else 0
        return result_dict
