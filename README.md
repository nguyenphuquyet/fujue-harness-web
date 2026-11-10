# FuJue Harness — website

Site marketing + tài khoản cho FuJue Harness: giới thiệu, danh mục model, tải về, tài liệu,
bảng giá, đăng nhập/đăng ký, bảng điều khiển và trang quản trị. App desktop đăng nhập qua
luồng thiết bị và nhận cấu hình model từ chính site này.

Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · SQLite (`node:sqlite`).

## Chạy nhanh

```sh
npm install
npm run db:reset     # xoá DB cũ; lần chạy đầu tự tạo schema + dữ liệu mẫu
npm run dev          # http://localhost:4310 (tự dựng lại client khi sửa)
```

Bản production:

```sh
npm run build
npm run start
```

`npm run db:reset` không xoá được DB khi máy chủ đang chạy — dừng tiến trình trước.

### Tài khoản mẫu

| Email | Mật khẩu | Vai trò |
| --- | --- | --- |
| `admin@fujue.dev` | `Admin@12345` | Quản trị viên |
| `linh@fujue.dev` | `Demo@12345` | Người dùng, gói Pro |
| `bao@fujue.dev` | `Demo@12345` | Người dùng bị tạm ngưng |

Mật khẩu băm bằng scrypt. Phiên đăng nhập lưu trong bảng `sessions`, cookie `fujue_session`.

Bảng trên là dữ liệu mẫu cho máy phát triển. Bản công khai chạy với `FUJUE_SEED_DEMO=0`: chỉ có tài
khoản quản trị lấy từ `FUJUE_ADMIN_EMAIL` và `FUJUE_ADMIN_PASSWORD`, không có người dùng demo.

## Trang

| Đường dẫn | Nội dung |
| --- | --- |
| `/` | Giới thiệu, tính năng, model nổi bật, CTA |
| `/models` | Danh mục model công khai (giá, ngữ cảnh, tốc độ, trạng thái) |
| `/downloads` | Bản tải cho macOS/Windows/Linux, kiểm tra SHA-256 |
| `/docs` | Cài đặt, dòng lệnh, tham chiếu API, luồng thiết bị, viết plugin |
| `/pricing` | Ba gói Miễn phí / Pro / Đội nhóm |
| `/login`, `/register` | Đăng nhập, tạo tài khoản |
| `/device` | Duyệt mã thiết bị do app desktop yêu cầu |
| `/dashboard` | Tổng quan, hạn mức, khoá API, phiên |
| `/dashboard/keys` | Tạo/thu hồi khoá API (`fj_live_…`) |
| `/dashboard/sessions` | Các phiên đăng nhập của tài khoản |
| `/admin` | Tổng quan quản trị, nhật ký gần đây |
| `/admin/users` | Đổi gói, vai trò, tạm khoá, xoá người dùng |
| `/admin/models` | Nguồn model + danh mục model |
| `/admin/logs` | Nhật ký thao tác |

## Model lấy từ API ngoài

Mỗi model đều thuộc **một nguồn**. Nguồn là API tương thích OpenAI có
`GET {base_url}/models`; site gọi kèm `Authorization: Bearer <khoá nguồn>` nếu có khai báo khoá.

Thêm nguồn ở `/admin/models` → khung **Nguồn model** → base URL (bỏ phần `/models`) và API key
(không hiện lại sau khi lưu). Bấm **Đồng bộ** để kéo danh mục:

- model mới được thêm, model đã có được cập nhật theo `(nguồn, mã model gốc)`;
- model biến mất khỏi nguồn bị gỡ khỏi danh mục;
- model gắn tay vào nguồn mà không có mã gốc thì không bị gỡ;
- chạy trong transaction: lỗi giữa đường không để bảng ở trạng thái nửa vời.

Trường đọc được từ nguồn: `id`, `name`, `owned_by`, `created`, `context_length`
(hoặc `top_provider.context_length`), `max_completion_tokens`,
`pricing.prompt` / `pricing.completion` (đơn vị USD/token của OpenRouter, đổi sang USD/1 triệu token).

Thử không cần khoá thật:

```sh
npm run mock:upstream          # http://localhost:4399/v1/models, khoá sk-test
# /admin/models → Thêm nguồn: Base URL http://localhost:4399/v1, API key sk-test
```

Mỗi model trong hộp thoại sửa cũng chọn được nguồn và mã model gốc. Model đang là **mặc định**
được ghim bằng nút hình ghim trong bảng.

## Cấu hình model cho harness

App không chép tay danh sách model. Sau khi đăng nhập thiết bị, app gọi:

```sh
curl https://harness.nguyenphuquyet.online/api/v1/harness/config \
  -H "Authorization: Bearer $FUJUE_KEY"
```

```json
{
  "object": "harness.config",
  "version": 1,
  "api": { "base_url": "https://harness.nguyenphuquyet.online/api/v1", "auth": "Authorization: Bearer <khoá API của bạn>" },
  "account": { "email": "linh@fujue.dev", "name": "…", "plan": "pro" },
  "default_model": "deepseek-v4",
  "models": [
    {
      "id": "deepseek-v4",
      "object": "model",
      "owned_by": "DeepSeek",
      "context_window": 262144,
      "max_output_tokens": 32768,
      "pricing": { "input_per_million_usd": 0.28, "output_per_million_usd": 1.12 },
      "status": "stable",
      "default": true,
      "source": {
        "provider": "DeepSeek",
        "base_url": "https://api.deepseek.com/v1",
        "upstream_id": "deepseek-v4"
      }
    }
  ]
}
```

- `default_model` là model được ghim trong `/admin/models`; bỏ ghim thì rơi về model nổi bật đầu tiên.
- `api.base_url` mặc định là `<origin>/api/v1`, tức cổng model của chính site; đổi bằng `FUJUE_GATEWAY_URL`.
- `source.base_url` + `source.upstream_id` cho biết cổng model chuyển tiếp tới API nào với mã model nào.
- `GET /api/v1/models` trả cùng dữ liệu nhưng không cần khoá — dùng cho bảng chọn model trước khi đăng nhập.

## Cổng model

Harness chỉ cầm khoá `fj_live_…` của người dùng, không bao giờ cầm khoá của nguồn. Mọi lời gọi
model đi qua cổng của site:

```
POST /api/v1/chat/completions     (OpenAI chat completions, có stream)
Authorization: Bearer fj_live_…
```

1. Xác thực khoá; khoá thu hồi hoặc tài khoản bị tạm ngưng bị từ chối như các endpoint khác.
2. Chặn khi số token đã dùng trong tháng chạm hạn mức gói: Miễn phí 500.000, Pro 20 triệu,
   Đội nhóm 100 triệu (khớp trang bảng giá).
3. Đổi slug model sang mã model bên nguồn rồi chuyển tiếp sang `base_url` của nguồn kèm khoá
   của nguồn; model chưa gắn nguồn hoặc nguồn đang tắt trả lỗi rõ ràng.
4. Trả nguyên luồng về cho harness, đồng thời cộng dồn lượt gọi và token vào `usage_daily`
   (SSE lấy từ `usage` của chunk cuối, nên bật `stream_options.include_usage`).

## Khoá API

- Định dạng `fj_live_<base64url>`, chỉ hiện đúng một lần khi tạo; DB giữ SHA-256.
- Giới hạn khoá đang hoạt động: Miễn phí 2, Pro 10, Đội nhóm 50.
- Thu hồi là đặt `revoked_at`; khoá đã thu hồi và tài khoản bị tạm ngưng đều bị từ chối ở
  `/api/v1/harness/config`.

## Luồng đăng nhập thiết bị

```
POST /api/v1/device/start    → { device_code, user_code, expires_in }
POST /api/v1/device/approve  → duyệt mã (cần phiên web)
POST /api/v1/device/token    → { api_key, user } khi mã đã duyệt, 428 khi còn chờ
```

Trang `/device?code=…` điền sẵn mã và giữ mã qua bước đăng nhập. Mã hết hạn sau 10 phút; mỗi
lần cấp khoá ghi một dòng nhật ký.

## CLI

```sh
npm run fujue -- login [--label "MacBook của Linh"]   # mở trình duyệt, lưu khoá
npm run fujue -- status
npm run fujue -- models      # bảng model + giá + nguồn, dấu * là model mặc định
npm run fujue -- config      # API base, model mặc định, danh mục (--json để xuất JSON)
npm run fujue -- logout
```

`FUJUE_WEB_URL` đổi máy chủ (mặc định `http://localhost:4310`), `FUJUE_CONFIG` đổi nơi lưu khoá
(mặc định `~/.fujue/harness-web.json`, quyền 600).

## Phát triển

- Giao diện chỉ có **một bảng màu sáng**: token ở `src/app/globals.css` (`:root` + `@theme inline`).
  Màu dùng trong utility phải khai báo ở namespace `--color-*`. Thẻ terminal ở trang chủ giữ nền
  tối bằng phạm vi `.terminal-card`.
- Client component không được import `@/lib/db`, `@/lib/usage`, `@/lib/models` (kéo `node:sqlite`
  vào bundle trình duyệt). Dùng `@/lib/format` cho hàm định dạng thuần.
- `npm run typecheck`, `npm run check:layout` (tràn ngang + ảnh chụp ở 375/768/1280px),
  `npm run shots` (chụp toàn bộ trang).
- `scripts/shot.mjs --url /admin/models --login admin@fujue.dev:Admin@12345 --click "text=Thêm model"`
  để chụp một hộp thoại.

## Triển khai

Máy chủ không cần Node toolchain: `output: "standalone"` sinh ra `.next/standalone` (server +
`node_modules` cần thiết), `npm run package` chép file tĩnh vào đó, rồi chỉ việc chép thư mục lên.

```sh
npm run build && npm run package
tar -czf dist/fujue-web.tgz -C .next/standalone .
scp dist/fujue-web.tgz deploy/ecosystem.config.cjs ubuntu@<vps>:/home/ubuntu/
```

Trên máy chủ:

```sh
mkdir -p /home/ubuntu/fujue-harness-web/data
tar -xzf /home/ubuntu/fujue-web.tgz -C /home/ubuntu/fujue-harness-web
mv /home/ubuntu/ecosystem.config.cjs /home/ubuntu/fujue-harness-web/
cd /home/ubuntu/fujue-harness-web && pm2 start ecosystem.config.cjs && pm2 save
```

`deploy/ecosystem.config.cjs` đặt `PORT=3145`, `HOSTNAME=0.0.0.0`, đường dẫn SQLite và các biến
môi trường chung, nên sửa file này khi đổi miền. Tài khoản quản trị đầu tiên và mọi giá trị riêng
của máy chủ nằm trong `deploy/ecosystem.local.cjs` cùng thư mục — file này bị `.gitignore` chặn:

```js
module.exports = { env: { FUJUE_ADMIN_EMAIL: "…", FUJUE_ADMIN_PASSWORD: "…" } };
```

Bản đang chạy: `https://harness.nguyenphuquyet.online` → Nginx Proxy Manager → `172.17.0.1:3145`
(pm2 `fujue-web`), dữ liệu ở `/home/ubuntu/fujue-harness-web/data/fujue.db`. `FUJUE_SEED_DEMO=0` giữ
máy chủ công khai không có hai tài khoản demo. Máy chủ chạy Node 22 nên `node:sqlite` in cảnh báo
"experimental" lúc khởi động — vô hại.

Muốn xoá dữ liệu để tạo lại từ đầu: `pm2 stop fujue-web`, xoá `data/fujue.db`, `pm2 start fujue-web`.

## Ghi chú

- Nút tải bản cài chưa trỏ tới file phát hành thật.
- Đăng nhập Google và Quên mật khẩu là giao diện, chưa nối nhà cung cấp.
- Nguồn tạo lúc khởi tạo trỏ tới `FUJUE_SEED_PROVIDER_URL` (mặc định `https://api.deepseek.com/v1`)
  và chưa có khoá — dán khoá của nguồn ở `/admin/models` hoặc đồng bộ một nguồn khác rồi ghim model
  mặc định. Cổng model chuyển tiếp sang nguồn đó, nên đừng trỏ nguồn về chính site.
- Chi phí hiển thị ở dashboard là ước tính theo giá tham chiếu, chưa đối chiếu hoá đơn của nguồn.
