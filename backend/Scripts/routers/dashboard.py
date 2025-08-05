from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

import math
from ..database import engine

router = APIRouter()

@router.get("/api/provinces")
def get_provinces():