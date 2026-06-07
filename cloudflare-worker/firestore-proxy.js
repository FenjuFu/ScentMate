// Cloudflare Worker: Firestore reverse proxy
//
// Why this exists:
//   Firestore (firestore.googleapis.com) is blocked / unreliable from mainland
//   China. This Worker reverse-proxies the REST + long-polling Listen channel
//   so the browser SDK can read/write through Cloudflare's edge instead of
//   talking to Google directly.
//
// Required client-side configuration:
//   Firestore must be initialized with experimentalForceLongPolling: true.
//   The default WebChannel transport uses streaming GETs that do not survive
//   most reverse proxies cleanly. Long polling is plain request/response and
//   passes through this Worker without issue. See js/firebase-config.js.
//
// Deploy:
//   1. dash.cloudflare.com -> Workers & Pages -> Create -> Worker
//   2. Name it e.g. scent-firestore-proxy, deploy the hello-world placeholder
//   3. Edit code -> paste this file's contents -> Deploy
//   4. Copy the *.workers.dev hostname into FIRESTORE_PROXY_HOST in
//      js/firebase-config.js
//
// Notes:
//   - Free tier: 100k requests/day. Listen long-poll reopens roughly every
//     ~30s per active listener, so ~2.8k req/day per active tab. Watch usage.
//   - Listener writes/reads carry the Firebase ID token in Authorization,
//     which we forward as-is. Firestore security rules still apply.

const UPSTREAM_HOST = 'firestore.googleapis.com';

const HOP_BY_HOP_HEADERS = new Set([
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailer', 'transfer-encoding', 'upgrade', 'host',
    'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'cf-worker',
    'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip'
]);

function buildCorsHeaders(request, extra) {
    const headers = new Headers(extra || {});
    const origin = request.headers.get('origin') || '*';
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
    headers.set('access-control-allow-credentials', 'true');
    headers.set('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    headers.set('access-control-allow-headers',
        request.headers.get('access-control-request-headers') ||
        'Authorization, Content-Type, X-Goog-Api-Client, X-Firebase-Gmpid, X-Firebase-AppCheck, X-Client-Version, X-Goog-Request-Params');
    headers.set('access-control-expose-headers', 'Content-Length, Content-Type, Date, Server');
    headers.set('access-control-max-age', '86400');
    return headers;
}

export default {
    async fetch(request) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: buildCorsHeaders(request) });
        }

        const url = new URL(request.url);
        const upstreamUrl = `https://${UPSTREAM_HOST}${url.pathname}${url.search}`;

        const forwardHeaders = new Headers();
        for (const [key, value] of request.headers) {
            if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
                forwardHeaders.set(key, value);
            }
        }
        forwardHeaders.set('host', UPSTREAM_HOST);

        let upstreamResponse;
        try {
            upstreamResponse = await fetch(upstreamUrl, {
                method: request.method,
                headers: forwardHeaders,
                body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
                redirect: 'follow'
            });
        } catch (err) {
            return new Response(
                JSON.stringify({ error: { code: 502, message: `upstream_fetch_failed: ${err.message}` } }),
                { status: 502, headers: buildCorsHeaders(request, { 'content-type': 'application/json' }) }
            );
        }

        const responseHeaders = buildCorsHeaders(request);
        for (const [key, value] of upstreamResponse.headers) {
            const lower = key.toLowerCase();
            if (HOP_BY_HOP_HEADERS.has(lower)) continue;
            if (lower === 'content-encoding' || lower === 'content-length') continue;
            if (lower.startsWith('access-control-')) continue;
            responseHeaders.set(key, value);
        }

        // Stream the body through as-is — supports long-poll Listen channel chunks.
        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: responseHeaders
        });
    }
};
