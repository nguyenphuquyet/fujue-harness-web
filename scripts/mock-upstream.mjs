#!/usr/bin/env node
/**
 * API model giả để thử tính năng đồng bộ mà không cần khoá thật.
 * Trả về danh sách theo chuẩn OpenAI, kèm vài trường mở rộng của OpenRouter.
 *
 *   node scripts/mock-upstream.mjs [--port 4399] [--token sk-test]
 *
 * Rồi trong /admin/models thêm nguồn với Base URL http://localhost:4399/v1.
 */
const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const port = Number(readArg("port", "4399"));
const token = readArg("token", "");

const MODELS = [
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    owned_by: "openai",
    created: 1715367049,
    context_length: 128000,
    max_completion_tokens: 16384,
    pricing: { prompt: "0.0000025", completion: "0.00001" },
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude Sonnet 4",
    owned_by: "anthropic",
    created: 1748736000,
    top_provider: { context_length: 200000 },
    pricing: { prompt: "0.000003", completion: "0.000015" },
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    owned_by: "meta-llama",
    created: 1722470400,
  },
];

const server = (await import("node:http")).createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);

  if (token && request.headers.authorization !== `Bearer ${token}`) {
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: { message: "Sai khoá API." } }));
    return;
  }

  if (request.method === "GET" && url.pathname.endsWith("/models")) {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ object: "list", data: MODELS }));
    return;
  }

  response.writeHead(404, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ error: { message: "Không có endpoint này." } }));
});

server.listen(port, () => {
  console.log(`mock upstream: http://localhost:${port}/v1/models (${MODELS.length} model)`);
  if (token) console.log(`cần header Authorization: Bearer ${token}`);
});
