import { ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";

const BY_CODE: Record<string, string> = {
  "E5.1": "Cửa hàng chưa được phép bán (chưa duyệt hoặc đang bị khóa).",
  "E5.2": "Sản phẩm đã có biến thể cùng loại bánh, nhân, số trứng và khối lượng.",
  "E5.4": "Bạn không có quyền sửa mục này.",
  "E5.5": "Không tìm thấy dữ liệu, có thể đã bị xóa.",
  "E5.6": "Chỉ phân bổ hàng cho gian đang có hợp đồng thuê hiệu lực.",
  "E5.7": "Phải giữ lại ít nhất một ảnh.",
  "E5.8": "Giá sỉ phải thấp hơn giá gốc và giảm dần khi số lượng tăng; số lượng tối thiểu từ 2 và không trùng.",
  "E9.4": "Không tìm thấy hộp, có thể đã bị xóa.",
};

export function catalogError(error: unknown, fallback: string) {
  if (error instanceof ApiError && BY_CODE[error.code]) return BY_CODE[error.code];
  if (error instanceof ApiError && error.status === 400 && /at least one item/i.test(error.message)) return "Cần ít nhất một biến thể trước khi mở bán.";
  return errorMessage(error, fallback);
}
