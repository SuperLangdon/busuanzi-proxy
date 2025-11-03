export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // Extract callback function name from query params (for JSONP support)
        const callback = url.searchParams.get("callback") || url.searchParams.get("jsonpCallback");

        // Determine response format: default to "json", use "jsonp" if callback is provided
        const format = url.searchParams.get("format") || (callback ? "jsonp" : "json");

        // Priority: query parameter 'site' > Referer header
        // Use query parameter to specify site, or fall back to Referer header from browser
        const referer = url.searchParams.get("site") || request.headers.get("Referer");

        // Return error if neither site parameter nor Referer header is provided
        if (!referer) {
            return new Response(JSON.stringify({ error: "Missing site parameter or Referer header" }), {
                status: 400,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        // Prepare JSONP callback name
        const callbackParam = callback || "BusuanziCallback";

        // Build target URL for Busuanzi API
        const target = `https://busuanzi.ibruce.info/busuanzi?jsonpCallback=${callbackParam}`;

        try {
            // Forward request to Busuanzi API with the Referer header
            const resp = await fetch(target, {
                headers: {
                    "Referer": referer,
                    "User-Agent": request.headers.get("User-Agent") || "Mozilla/5.0 (compatible; BusuanziProxy/1.0)",
                },
            });

            if (!resp.ok) {
                throw new Error(`Busuanzi API returned status ${resp.status}`);
            }

            const text = await resp.text();

            // Parse JSONP response: extract JSON data from callback wrapper
            // Example: BusuanziCallback_xxx({"site_uv":123,...}) => {"site_uv":123,...}
            const match = text.match(/\((\{.*?\})\)/);
            if (!match) {
                throw new Error("Invalid response from Busuanzi");
            }

            const data = JSON.parse(match[1]);

            // Return JSONP format if callback is specified
            if (format === "jsonp" && callback) {
                const body = `${callback}(${JSON.stringify(data)});`;
                return new Response(body, {
                    headers: {
                        "Content-Type": "application/javascript; charset=utf-8",
                        "Cache-Control": "public, max-age=60",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            } else {
                // Return plain JSON format
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Cache-Control": "public, max-age=60",
                        "Access-Control-Allow-Origin": "*",
                    },
                });
            }
        } catch (err) {
            // Handle errors and return error response
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }
    },
};
