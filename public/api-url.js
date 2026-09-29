const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);

export const isLocalPreview = localHosts.has(window.location.hostname)
    && window.location.protocol === "http:"
    && window.location.port !== "5000";

const apiOrigin = isLocalPreview ? "http://127.0.0.1:5000" : "";

export function apiUrl(url) {
    if (typeof url !== "string" || !url.startsWith("/api/")) {
        throw new TypeError("API URLs must be absolute paths under /api.");
    }

    return `${apiOrigin}${url}`;
}
