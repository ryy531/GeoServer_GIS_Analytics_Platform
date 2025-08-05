# Scripts/database.py
from sqlalchemy import create_engine

DATABASE_CONNECTION_STRING = (
    "postgresql://postgres:960531wdxxm@localhost:5432/geoserver_practice"
)
engine = create_engine(DATABASE_CONNECTION_STRING)
