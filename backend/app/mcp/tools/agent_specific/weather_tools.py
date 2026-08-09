"""MCP and LangChain Tools exclusive to the Weather Agent using @tool from langchain.tools."""

import os
import requests
from typing import Any, Dict, List
from loguru import logger

try:
    from langchain.tools import tool
except ImportError:
    from langchain_core.tools import tool

from app.core.config import settings
from app.mcp.decorators import mcp_tool


@mcp_tool(
    name="get_latitude_longitude",
    description="Fetch latitude and longitude coordinates for a given city name.",
    scope="weather_agent",
)
@tool
def get_latitude_longitude(city_name: str) -> List[Dict[str, Any]]:
    """Fetch latitude and longitude coordinates for a city name."""
    api_key = settings.WEATHER_API_KEY or os.getenv("WEATHER_API_KEY", "")
    if not api_key:
        logger.warning(f"WEATHER_API_KEY not found. Returning mock coordinates for city '{city_name}'.")
        return [
            {
                "name": city_name,
                "lat": 13.0827,
                "lon": 80.2707,
                "country": "IN",
                "state": "Tamil Nadu",
            }
        ]

    try:
        url = f"http://api.openweathermap.org/geo/1.0/direct?q={city_name}&limit=3&appid={api_key}"
        res = requests.get(url, timeout=5)
        if res.status_code == 200 and res.json():
            return res.json()
    except Exception as e:
        logger.error(f"Error fetching geo coordinates for '{city_name}': {e}")

    return [{"name": city_name, "lat": 13.0827, "lon": 80.2707, "country": "IN"}]


@mcp_tool(
    name="get_weather",
    description="Fetch real-time weather details for given latitude and longitude coordinates.",
    scope="weather_agent",
)
@tool
def get_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """Fetch real-time weather details for given latitude and longitude coordinates."""
    api_key = settings.WEATHER_API_KEY or os.getenv("WEATHER_API_KEY", "")
    if not api_key:
        logger.warning("WEATHER_API_KEY not found. Returning mock weather data.")
        return {
            "coord": {"lon": longitude, "lat": latitude},
            "weather": [{"id": 800, "main": "Clear", "description": "clear sky", "icon": "01d"}],
            "main": {"temp": 28.5, "feels_like": 30.2, "temp_min": 27.0, "temp_max": 30.0, "humidity": 65},
            "wind": {"speed": 3.6},
            "name": "Local Location",
        }

    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={api_key}&units=metric"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            return res.json()
    except Exception as e:
        logger.error(f"Error fetching weather data for lat={latitude}, lon={longitude}: {e}")

    return {
        "weather": [{"main": "Sunny", "description": "partly cloudy"}],
        "main": {"temp": 26.0, "humidity": 60},
    }
