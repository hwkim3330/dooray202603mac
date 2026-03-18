import HTML from './page.html';

const DOORAY_TOKEN = 's701wolho5si:sQYP0UfqQD-R6C626bOJtQ';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(HTML, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' },
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (url.pathname.startsWith('/api/')) {
      const doorayPath = url.pathname.slice(4) + url.search;
      try {
        const resp = await fetch('https://api.dooray.com' + doorayPath, {
          headers: {
            'Authorization': `dooray-api ${DOORAY_TOKEN}`,
            'Accept': 'application/json',
          },
        });
        return new Response(await resp.text(), {
          status: resp.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
