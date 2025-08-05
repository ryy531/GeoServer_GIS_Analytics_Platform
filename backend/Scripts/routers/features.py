from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
import geopandas as gpd
from ..database import engine

router = APIRouter()
education_table_name = "education_facilities_points"


class NearbySearchRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float


@router.post("/api/find_nearby_facilities")
async def find_nearby_facilities(request: NearbySearchRequest):
    SQL_QUERY_EDUCATION_POINTS = f"""SELECT name,amenity,geom FROM public.{education_table_name} WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :radius_in_meters);"""
    insert_params = {
        "lon": request.longitude,
        "lat": request.latitude,
        "radius_in_meters": request.radius_km * 1000,
    }
    try:
        gdf = gpd.read_postgis(
            sql=text(SQL_QUERY_EDUCATION_POINTS),
            con=engine,
            params=insert_params,
            geom_col="geom",
        )
        if gdf.empty:
            return {"message": "No facilities found in the specified area."}
        else:
            return gdf.__geo_interface__
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )
