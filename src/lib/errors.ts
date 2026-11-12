/**
 * Lỗi nghiệp vụ mang sẵn mã HTTP để `guard()` trả đúng cho client. Tách riêng
 * khỏi `http.ts` để các module dữ liệu dùng được mà không kéo theo NextResponse.
 */
export class ApiError extends Error {
  status: number;
  field?: string;

  constructor(status: number, message: string, field?: string) {
    super(message);
    this.status = status;
    this.field = field;
  }
}
