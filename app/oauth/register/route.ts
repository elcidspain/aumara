import { registerAgentClient } from "@/lib/agentOAuth";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const registration = registerAgentClient(body ?? {});
    return Response.json(registration, { status: 201, headers });
  } catch (error) {
    return Response.json({
      error: "invalid_client_metadata",
      error_description: error instanceof Error ? error.message : "Invalid client metadata",
    }, { status: 400, headers });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
