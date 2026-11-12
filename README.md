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
| `/dashboard` | Tổng quan, ví, hạn mức, khoá API, phiên |
| `/dashboard/models` | Danh mục model đang phát hành, giá, kiểu nhận, mức suy luận |
| `/dashboard/billing` | Nạp tiền bằng VietQR, lịch sử lệnh nạp |
| `/dashboard/keys` | Tạo/thu hồi khoá API (`fj_live_…`) |
| `/dashboard/sessions` | Các phiên đăng nhập của tài khoản |
| `/admin` | Tổng quan quản trị, nhật ký gần đây |
| `/admin/users` | Số dư, mức dùng, xác nhận lệnh nạp, đổi gói/vai trò, tạm khoá |
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
5. Tính tiền theo giá niêm yết của model và trừ vào ví, ghi sổ `wallet_ledger`. Model giá 0 bỏ qua
   bước này; model có giá trả `402 insufficient_balance` khi ví đã hết tiền.

## Ví trả trước và nạp tiền

Ví tính bằng đồng, không có cổng thanh toán. Người dùng tạo lệnh nạp ở `/dashboard/billing`, quét
VietQR để chuyển khoản, quản trị viên đối chiếu sao kê rồi bấm **Đã nhận tiền** ở `/admin/users`.

- Giá model là USD/1 triệu token; mỗi lượt quy đổi sang đồng, làm tròn lên tới đồng. Tỷ giá đổi
  bằng `FUJUE_VND_PER_USD` (mặc định `26500`).
- Mệnh giá gợi ý 50.000 / 100.000 / 200.000 / 500.000 ₫, hoặc nhập tay từ 20.000 ₫ đến 50.000.000 ₫
  (bội số 1.000 ₫). Mỗi tài khoản chỉ có một lệnh chờ; tạo lệnh mới sẽ huỷ lệnh cũ.
- Lệnh hết hạn sau 15 phút. Xác nhận cộng đúng số tiền vào ví trong cùng transaction với cập nhật
  lệnh; từ chối chỉ đổi trạng thái, không cộng tiền.
- Sổ `wallet_ledger` ghi mọi thay đổi: nạp tiền, trừ tiền theo lượt gọi, quản trị viên điều chỉnh tay.
- Thiếu cấu hình nhận tiền thì nút tạo lệnh tắt và trang báo rõ. Đặt trong `deploy/ecosystem.local.cjs`:

```js
module.exports = {
  env: {
    FUJUE_ADMIN_EMAIL: "…",
    FUJUE_ADMIN_PASSWORD: "…",
    FUJUE_BANK_BIN: "970436",              // mã BIN ngân hàng cho VietQR
    FUJUE_BANK_NAME: "Vietcombank",
    FUJUE_BANK_ACCOUNT: "0123456789",
    FUJUE_BANK_ACCOUNT_NAME: "NGUYEN PHU QUYET",
    FUJUE_VND_PER_USD: "26500",
  },
};
```

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
- Client component không được import `@/lib/db`, `@/lib/usage`, `@/lib/models`, `@/lib/wallet`
  (kéo `node:sqlite` vào bundle trình duyệt). Dùng `@/lib/format` và `@/lib/billing` cho hằng số
  và hàm định dạng thuần.
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

`npm run package` đã gỡ `data/` khỏi `.next/standalone` (Next theo dõi cả file DB mà app mở lúc
build, nên bản dựng có thể mang theo một `fujue.db` rỗng). Giải nén gói có `data/` lên máy chủ sẽ
đè mất dữ liệu thật — luôn kiểm tra `tar -tzf dist/fujue-web.tgz | grep data` trước khi chép lên.

Trên máy chủ:

```sh
cd /home/ubuntu/fujue-harness-web
pm2 stop fujue-web
cp -a data "data.bak-$(date +%Y%m%d-%H%M%S)"   # DB chạy WAL: chép cả db, -wal, -shm
tar -xzf /home/ubuntu/fujue-web.tgz -C /home/ubuntu/fujue-harness-web --exclude=./data
mv /home/ubuntu/ecosystem.config.cjs /home/ubuntu/fujue-harness-web/
pm2 start ecosystem.config.cjs && pm2 save
```

DB dùng chế độ WAL nên bản sao phải gồm cả `fujue.db-wal` và `fujue.db-shm` — chép riêng
`fujue.db` lúc app còn chạy sẽ mất giao dịch gần nhất.

Bản mới tự tạo bảng ví (`topups`, `wallet_ledger`, `usage_model_daily`) và thêm cột
`users.balance_vnd`, `usage_daily.cost_vnd` khi khởi động. Tài khoản cũ bắt đầu với số dư 0; model
miễn phí vẫn chạy, model có giá chờ quản trị viên cộng tiền ở `/admin/users`.

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
- Chi phí ở dashboard là tiền thật đã trừ khỏi ví, tính từ token nguồn báo về. Lượt gọi không có
  `usage` (nguồn không trả token) không bị trừ tiền.
