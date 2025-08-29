# Scripts/database.py
import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

# 这会加载 .env 文件中的变量（如果在本地开发）
load_dotenv()

# 从环境变量中读取数据库连接字符串
# 如果找不到，就使用一个默认的本地地址作为备用
DATABASE_CONNECTION_STRING = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:960531wdxxm@localhost:5432/geoserver_practice",
)

engine = create_engine(DATABASE_CONNECTION_STRING)
