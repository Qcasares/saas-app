import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL || "http://localhost:8787";

async function proxyRequest(request: NextRequest, path: string) {
  const url = new URL(request.url);
  const workerUrl = `${WORKER_URL}${path}${url.search}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Forward authorization header if present
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }
  
  try {
    const response = await fetch(workerUrl, {
      method: request.method,
      headers,
      body: request.method !== "GET" && request.method !== "HEAD" 
        ? await request.text() 
        : undefined,
    });
    
    const data = await response.json().catch(() => null);
    
    return NextResponse.json(data || {}, { status: response.status });
  } catch (error) {
    console.error(`API proxy error for ${path}:`, error);
    return NextResponse.json(
      { error: "Failed to proxy request" },
      { status: 500 }
    );
  }
}

// Social accounts
export async function GET(request: NextRequest) {
  return proxyRequest(request, "/social/accounts");
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();
  if (id && id !== "accounts") {
    return proxyRequest(request, `/social/accounts/${id}`);
  }
  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
