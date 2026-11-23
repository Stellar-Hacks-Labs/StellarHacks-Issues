# Public API Integration Examples

Practical code examples for querying the StellarHacks Public Read-Only API.

---

## 1. cURL

### List Hackathons
```bash
curl -i "https://stellarhacks.org/api/v1/hackathons?page=1&per_page=10"
```

### Get Hackathon Details
```bash
curl -i "https://stellarhacks.org/api/v1/hackathons/stellar-wave-11"
```

### Get Hackathon Projects
```bash
curl -i "https://stellarhacks.org/api/v1/hackathons/stellar-wave-11/projects"
```

### Get Hackathon Results
```bash
curl -i "https://stellarhacks.org/api/v1/hackathons/soroban-build-2026/results"
```

### Get Cryptographic Proof
```bash
curl -i "https://stellarhacks.org/api/v1/hackathons/stellar-wave-11/proof"
```

### Fetch OpenAPI Document
```bash
curl -s "https://stellarhacks.org/api/v1/openapi.json" | jq .
```

---

## 2. JavaScript / TypeScript (Fetch)

```typescript
const BASE_URL = 'https://stellarhacks.org/api/v1';

async function fetchHackathon(slug: string) {
  const response = await fetch(`${BASE_URL}/hackathons/${slug}`, {
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limited. Try again in ${retryAfter} seconds.`);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  const hackathon = await response.json();
  console.log(`Hackathon: ${hackathon.name} (Phase: ${hackathon.phase})`);
  return hackathon;
}
```

---

## 3. Python (requests)

```python
import requests

BASE_URL = "https://stellarhacks.org/api/v1"

def get_public_projects(slug: str):
    url = f"{BASE_URL}/hackathons/{slug}/projects"
    response = requests.get(url, params={"page": 1, "per_page": 20})
    
    if response.status_code == 429:
        retry_after = response.headers.get("Retry-After", 60)
        raise Exception(f"Rate limited. Retry after {retry_after}s")
        
    response.raise_for_status()
    data = response.json()
    
    print(f"Total projects: {data['pagination']['total']}")
    for project in data['data']:
        print(f"- {project['title']} by {project['teamName']}")
    return data

if __name__ == "__main__":
    get_public_projects("stellar-wave-11")
```
