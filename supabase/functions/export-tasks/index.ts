interface ExportTaskPayload {
  memberId: string;
  startDate?: string;
  endDate?: string;
}

function buildCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) {
    return "date,type1,type2,project,page,hours,content,note";
  }

  const headers = Object.keys(rows[0]);
  const serializedRows = rows.map((row) =>
    headers.map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`).join(","),
  );

  return [headers.join(","), ...serializedRows].join("\n");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const payload = (await request.json()) as ExportTaskPayload;

  return new Response(
    JSON.stringify({
      message: "Edge Function scaffold created. Wire this to Supabase service-role querying in deployment.",
      request: payload,
      previewCsv: buildCsv([]),
    }),
    {
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    },
  );
});
