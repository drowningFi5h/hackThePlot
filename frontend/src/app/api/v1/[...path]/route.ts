import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const allowed = [
  /^auth\/(csrf|login|logout|me|demo)\/$/,
  /^event\/$/,
  /^challenges\/$/,
  /^challenges\/\d+\/$/,
  /^challenges\/[0-9a-f-]{36}\/submit\/$/,
  /^leaderboard\/$/,
  /^admin\/teams\/import\/$/,
  /^admin\/certificates\/$/,
  /^admin\/certificates\/[0-9a-f-]{36}\/revoke\/$/,
  /^certificates\/[A-Za-z0-9_:\-]+\/$/,
];
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const path =
    (await context.params).path
      .map((segment) => decodeURIComponent(segment))
      .join("/") + "/";
  if (!allowed.some((rule) => rule.test(path)))
    return NextResponse.json({ detail: "Not found." }, { status: 404 });
  const origin = process.env.FRONTEND_URL || "http://localhost:3000";
  if (
    !["GET", "HEAD"].includes(request.method) &&
    request.headers.get("origin") !== origin
  )
    return NextResponse.json(
      { detail: "Invalid request origin." },
      { status: 403 },
    );
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 1024 * 1024)
    return NextResponse.json({ detail: "Request too large." }, { status: 413 });
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const name of ["cookie", "x-csrftoken", "origin", "referer"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const body = ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.text();
    if (body && new TextEncoder().encode(body).length > 1024 * 1024)
      return NextResponse.json(
        { detail: "Request too large." },
        { status: 413 },
      );
    const upstream = await fetch(
      (process.env.BACKEND_URL || "http://127.0.0.1:8000") + "/api/v1/" + path,
      {
        method: request.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(25000),
      },
    );
    const response = new NextResponse(await upstream.arrayBuffer(), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store, private",
      },
    });
    for (const cookie of upstream.headers.getSetCookie())
      response.headers.append(
        "Set-Cookie",
        cookie.replace(/;\s*Domain=[^;]+/gi, ""),
      );
    if (upstream.headers.has("retry-after"))
      response.headers.set("Retry-After", upstream.headers.get("retry-after")!);
    return response;
  } catch {
    return NextResponse.json(
      {
        detail:
          "The server is waking up or temporarily unavailable. Please retry shortly.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export { proxy as GET, proxy as POST };
