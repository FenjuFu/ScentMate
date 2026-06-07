// Cloudflare Worker: Firebase Auth REST proxy
//
// Why this exists:
//   Firebase Auth's REST endpoints (identitytoolkit.googleapis.com and
//   securetoken.googleapis.com) are not reliably reachable from mainland
//   China mobile networks. We host this Worker on a Cloudflare *.workers.dev
//   subdomain (or a custom domain) and rewrite the apiHost on the client
//   side so the Firebase JS SDK talks to us instead of Google directly.
//
// Routing:
//   /v1/token*          -> securetoken.googleapis.com   (ID token refresh)
//   anything else       -> identitytoolkit.googleapis.com  (signup, login, reset, etc.)
//
// Deploy:
//   1. npm i -g wrangler && wrangler login
//   2. wrangler init --from-dash  (or create a new Worker manually)
//   3. Replace src/index.js with this file's contents
//   4. wrangler deploy
//   5. Copy the *.workers.dev hostname into js/firebase-config.js (AUTH_PROXY_HOST)
//
// Notes:
//   - Google OAuth popup login is NOT covered here (it uses authDomain ->
//     Firebase Hosting and a redirect back to accounts.google.com, which
//     can't be reverse-proxied this way). Email/password and the REST flows
//     it depends on (verification email send, password reset, token refresh)
//     will all work.
//   - Firestore is a separate problem (uses gRPC/WebChannel, different host).

const UPSTREAM_IDENTITYTOOLKIT = 'identitytoolkit.googleapis.com';
const UPSTREAM_SECURETOKEN = 'securetoken.googleapis.com';

const HOP_BY_HOP_HEADERS = new Set([
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailer', 'transfer-encoding', 'upgrade', 'host',
    'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'cf-worker',
    'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip'
]);

function pickUpstream(pathname) {
    if (pathname.startsWith('/v1/token')) return UPSTREAM_SECURETOKEN;
    return UPSTREAM_IDENTITYTOOLKIT;
}

function buildCorsHeaders(request, extra) {
    const headers = new Headers(extra || {});
    const origin = request.headers.get('origin') || '*';
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
    headers.set('access-control-allow-credentials', 'true');
    headers.set('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS');
    headers.set('access-control-allow-headers',
        request.headers.get('access-control-request-headers') || 'Content-Type, Authorization, X-Client-Version, X-Firebase-Locale, X-Firebase-Gmpid, X-Firebase-AppCheck');
    headers.set('access-control-max-age', '86400');
    return headers;
}

export default {
    async fetch(request) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: buildCorsHeaders(request) });
        }

        const url = new URL(request.url);
        const upstreamHost = pickUpstream(url.pathname);
        const upstreamUrl = `https://${upstreamHost}${url.pathname}${url.search}`;

        const forwardHeaders = new Headers();
        for (const [key, value] of request.headers) {
            if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
                forwardHeaders.set(key, value);
            }
        }
        forwardHeaders.set('host', upstreamHost);

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

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            statusText: upstreamResponse.statusText,
            headers: responseHeaders
        });
    }
};
