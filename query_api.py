import requests
import json

API_URL = "https://natomanga-graphql-api.onrender.com/graphql"

query = """
{
  getManga(id: "solo-leveling") {
    title
  }
}
"""

headers = {
    "Content-Type": "application/json"
}

response = requests.post(API_URL, json={"query": query}, headers=headers)

if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2))  # Print response for debugging
else:
    print(f"Error {response.status_code}: {response.text}")
