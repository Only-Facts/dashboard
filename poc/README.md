# Proof of concept

This folder contains the early proof of concept required by the project brief: one configurable widget fetches real data from an external API and displays it.

The widget accepts a city name, resolves it with the Open-Meteo geocoding API, then fetches the current temperature from the Open-Meteo forecast API.

Run a tiny static server from the repository root:

```bash
python3 -m http.server 9000 --directory poc
```

Then open http://localhost:9000 and try different cities.

The production application keeps the same idea but moves provider access to the backend, where host allow-listing, timeouts, response limits and server-side configuration validation can be enforced.
