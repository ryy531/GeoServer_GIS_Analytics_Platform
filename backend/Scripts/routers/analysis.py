from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

import math
from ..database import engine

router = APIRouter()


class BufferRequest(BaseModel):
    latitude: float
    longitude: float
    radius_m: float


@router.post("/api/population_in_buffer")
def get_population_in_buffer(request: BufferRequest):
    """
    接收一个点和半径，计算并返回该范围内的人口总数和人口密度。
    """
    sql_query = text(
        """
        SELECT SUM("TotalPopulation")
        FROM pak_unadj_constrained
        WHERE ST_DWithin(
            geometry::geography,
            ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
            :radius_m
        );
    """
    )

    conn = engine.connect()
    total_population = None
    try:
        result = conn.execute(
            sql_query,
            {
                "lat": request.latitude,
                "lon": request.longitude,
                "radius_m": request.radius_m,
            },
        )
        total_population = result.scalar_one_or_none()
    finally:
        conn.close()

    calculated_population = int(total_population) if total_population is not None else 0

    radius_km = request.radius_m / 1000.0
    area_km2 = math.pi * (radius_km**2)

    population_density = 0
    if area_km2 > 0:
        population_density = calculated_population / area_km2

    print(
        f"in radius {request.radius_m} meter，population is: {calculated_population}, density is: {population_density:.2f} per km2"
    )

    return {
        "latitude": request.latitude,
        "longitude": request.longitude,
        "radius_m": request.radius_m,
        "total_population_in_buffer": calculated_population,
        "population_density_per_km2": population_density,
    }
