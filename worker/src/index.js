const TOKEN = 's701wolho5si:sQYP0UfqQD-R6C626bOJtQ';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const doorayUrl = 'https://api.dooray.com' + path;

    try {
      const resp = await fetch(doorayUrl, {
        headers: {
          'Authorization': `dooray-api ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      });
      const body = await resp.text();
      return new Response(body, {
        status: resp.status,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }
  },
};
