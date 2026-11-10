import { rmSync } from "node:fs";
import path from "node:path";

const file = process.env.FUJUE_DB_PATH ?? path.join(process.cwd(), "data", "fujue.db");

for (const suffix of ["", "-wal", "-shm"]) {
  try {
    rmSync(`${file}${suffix}`, { force: true });
    console.log(`đã xoá ${file}${suffix}`);
  } catch (error) {
    console.warn(`bỏ qua ${file}${suffix}:`, error instanceof Error ? error.message : error);
  }
}

console.log("Lần khởi động sau sẽ tạo lại cơ sở dữ liệu và dữ liệu mẫu.");
