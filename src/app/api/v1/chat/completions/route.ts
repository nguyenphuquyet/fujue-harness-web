import { NextResponse } from "next/server";
import { readJson, str } from "@/lib/http";
import { authenticateKey } from "@/lib/keys";
import {
  MONTHLY_TOKEN_QUOTA,
  monthlyTokens,
  quotaMessage,
  recordUsage,
  resolveGatewayRoute,
  splitUsage,
} from "@/lib/gateway";
import { walletBalance } from "@/lib/wallet";

export const dynamic = "force-dynamic";
/** Stream model trả lời có thể chạy lâu hơn một request thường. */
export const maxDuration = 300;

/**
 * Lỗi theo đúng khuôn `{ error: { message, type, code } }` của OpenAI để harness
 * hiển thị nguyên văn thay vì nuốt mất lý do.
 */
function apiError(status: number, message: string, code: string): NextResponse {
  const type =
    status === 401
      ? "authentication_error"
      : status === 402
        ? "insufficient_quota"
        : status >= 500
          ? "api_error"
          : "invalid_request_error";
  return NextResponse.json({ error: { message, type, code } }, { status });
}

/** Header cần giữ lại từ phản hồi nguồn; phần còn lại do Next tự tính lại. */
function passthroughHeaders(upstream: Response): Headers {
  const headers = new Headers({ "cache-control": "no-store" });
  const contentType = upstream.headers.get("content-type");
  headers.set("content-type", contentType ?? "application/json");
  for (const name of ["x-request-id", "openai-processing-ms", "retry-after"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

/**
 * Đọc `usage` từ luồng SSE khi nguồn trả về `stream_options.include_usage`.
 * Dòng có thể bị cắt giữa hai chunk nên phần đuôi được giữ lại tới chunk sau.
 */
function usageMeter(onUsage: (tokensIn: number, tokensOut: number) => void): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  let pending = "";

  const scan = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const data = trimmed.slice(5).trim();
    if (data === "" || data === "[DONE]") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      // Dòng SSE dở dang hoặc không phải JSON: bỏ qua, chỉ mất số token của chunk đó.
      return;
    }
    if (!parsed || typeof parsed !== "object") return;
    const usage = (parsed as { usage?: unknown }).usage;
    if (!usage) return;
    const split = splitUsage(usage);
    if (split.tokensIn > 0 || split.tokensOut > 0) onUsage(split.tokensIn, split.tokensOut);
  };

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);
      pending += decoder.decode(chunk, { stream: true });
      const lines = pending.split("\n");
      pending = lines.pop() ?? "";
      for (const line of lines) scan(line);
    },
    flush() {
      pending += decoder.decode();
      scan(pending);
    },
  });
}

/**
 * Cổng model tương thích OpenAI cho harness. Xác thực khoá `fj_live_…`, kiểm tra
 * hạn mức token của gói, rồi chuyển tiếp lời gọi sang nguồn model của chính model
 * được yêu cầu — harness không bao giờ cầm khoá của nguồn.
 *
 * Mọi model trong danh mục đều đã gắn nguồn, nên `model` ở đây là slug của site;
 * cổng này đổi slug sang mã model bên nguồn trước khi gửi đi.
 */
export async function POST(request: Request): Promise<Response> {
  const raw = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (raw.trim() === "") {
    return apiError(401, "Thiếu khoá API. Gửi header Authorization: Bearer fj_live_…", "missing_api_key");
  }

  const owner = authenticateKey(raw);
  if (!owner) {
    return apiError(
      401,
      "Khoá API không hợp lệ, đã thu hồi hoặc tài khoản đang bị tạm ngưng.",
      "invalid_api_key",
    );
  }

  const body = await readJson(request);
  const model = str(body.model).trim();
  if (model === "") {
    return apiError(400, "Thiếu trường model trong yêu cầu.", "model_required");
  }

  const quota = MONTHLY_TOKEN_QUOTA[owner.plan] ?? MONTHLY_TOKEN_QUOTA.free;
  const used = monthlyTokens(owner.userId);
  if (used >= quota) {
    return apiError(429, quotaMessage(owner.plan, used), "quota_exceeded");
  }

  const route = resolveGatewayRoute(model);
  if ("status" in route) {
    return apiError(route.status, route.message, route.code);
  }

  // Model có giá chỉ gọi được khi ví còn tiền; model miễn phí bỏ qua bước này.
  if (!route.free && walletBalance(owner.userId) <= 0) {
    return apiError(
      402,
      "Số dư ví đã hết. Nạp thêm tại trang Nạp tiền để tiếp tục gọi model này.",
      "insufficient_balance",
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${route.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: request.headers.get("accept") ?? "application/json",
        ...(route.apiKey ? { authorization: `Bearer ${route.apiKey}` } : {}),
      },
      body: JSON.stringify({ ...body, model: route.upstreamId }),
      signal: request.signal,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[fujue-gateway] không gọi được nguồn", route.provider, detail);
    return apiError(502, `Không gọi được nguồn ${route.provider}. Thử lại sau.`, "upstream_unreachable");
  }

  const headers = passthroughHeaders(upstream);
  if (upstream.body === null) {
    return apiError(502, `Nguồn ${route.provider} trả về phản hồi rỗng.`, "upstream_empty");
  }

  const streaming = (headers.get("content-type") ?? "").includes("text/event-stream");
  if (!upstream.ok) {
    return new Response(upstream.body, { status: upstream.status, headers });
  }

  // Lượt gọi chỉ được tính khi nguồn thực sự nhận việc; lời gọi hỏng không làm
  // giảm hạn mức hay trừ tiền của người dùng.
  recordUsage(owner.userId, route, { requests: 1 });

  if (!streaming) {
    const text = await upstream.text();
    let tokensIn = 0;
    let tokensOut = 0;
    try {
      const payload = JSON.parse(text) as { usage?: unknown };
      ({ tokensIn, tokensOut } = splitUsage(payload.usage));
    } catch {
      // Phản hồi không phải JSON: vẫn trả nguyên văn, chỉ không ghi được token.
    }
    if (tokensIn > 0 || tokensOut > 0) recordUsage(owner.userId, route, { tokensIn, tokensOut });
    return new Response(text, { status: upstream.status, headers });
  }

  return new Response(
    upstream.body.pipeThrough(
      usageMeter((tokensIn, tokensOut) => recordUsage(owner.userId, route, { tokensIn, tokensOut })),
    ),
    { status: upstream.status, headers },
  );
}
