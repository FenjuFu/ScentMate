import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, initializeFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================
// 把下面替换成你 Firebase 项目「网页应用」的配置
// 获取路径：Firebase 控制台 → 项目设置 → 你的应用 → SDK 配置
// 注意：这些值不是机密，本就设计为放在前端；安全性由
//   1) Firebase 身份验证  2) Firestore 安全规则  共同保障。
// 需要在控制台开启：Authentication → 登录方式 → 邮箱/密码 + Google；
// 并在 Authentication → Settings → 授权域名 里加入 localhost 与你的线上域名。
// ============================================================
export const firebaseConfig = {
    apiKey: "AIzaSyCv0vvQrmcjvOiRiR21C5huiueXDQ0ZMkQ",
    authDomain: "scent-mate.firebaseapp.com",
    projectId: "scent-mate",
    storageBucket: "scent-mate.firebasestorage.app",
    messagingSenderId: "510320556140",
    appId: "1:510320556140:web:1eb82f9050258b26984049"
};

export const isFirebaseConfigured =
    !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("YOUR_");

// Cloudflare Worker reverse proxy for Firebase Auth REST endpoints.
// Leave empty to talk to Google directly; set to your worker host
// (e.g. "scent-auth-proxy.example.workers.dev", no protocol, no trailing slash)
// to route auth calls through it — needed for mainland China networks where
// identitytoolkit.googleapis.com is unreliable. Covers email/password,
// password reset, email verification, and ID token refresh. Google sign-in
// popup is not affected by this and still requires direct googleapis access.
export const AUTH_PROXY_HOST = "purple-wildflower-9c94scent-auth-proxyscent-auth-proxy.fufenjupku.workers.dev";

// Cloudflare Worker reverse proxy for Firestore (firestore.googleapis.com).
// Leave empty to talk to Google directly; set to your worker host (no protocol,
// no trailing slash) to route Firestore reads/writes through it — needed for
// mainland China networks. When set, Firestore is initialized with
// experimentalForceLongPolling so the transport survives the proxy.
export const FIRESTORE_PROXY_HOST = "scent-firestore-proxy.fufenjupku.workers.dev";

let auth = null;
let db = null;

if (isFirebaseConfigured) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    if (AUTH_PROXY_HOST) {
        auth.config.apiHost = AUTH_PROXY_HOST;
        auth.config.tokenApiHost = AUTH_PROXY_HOST;
        auth.config.apiScheme = "https";
    }
    if (FIRESTORE_PROXY_HOST) {
        db = initializeFirestore(app, {
            host: FIRESTORE_PROXY_HOST,
            ssl: true,
            experimentalForceLongPolling: true
        });
    } else {
        db = getFirestore(app);
    }
} else {
    console.warn("[ScentMate] Firebase 未配置：登录与云同步已禁用，香水数据暂用本地存储。请在 js/firebase-config.js 填入配置。");
}

export { auth, db };
