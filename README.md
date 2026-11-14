# Social Media Automation

Đồ án xây dựng hệ thống tự động tạo, duyệt và đăng bài lên Facebook Fanpage.

## Công nghệ

- Frontend: Next.js
- Backend: NestJS
- Database: MongoDB
- Workflow Automation: n8n
- AI: Ollama
- Social Publishing: Buffer API

## Cấu trúc

- frontend/: Giao diện quản trị
- backend/: REST API và xử lý nội dung
- n8n_workflow/: WF01, WF02, WF03
- infrastructure/: Cấu hình hạ tầng

## Quy trình

1. WF01: Tạo nội dung bằng AI.
2. WF02: Người dùng kiểm duyệt nội dung.
3. WF03: Gửi bài đã duyệt lên Buffer và Facebook.
4. Backend ghi nhận kết quả đăng bài.

## Trạng thái

Đã kiểm thử đăng thành công một bài Facebook qua Buffer.
Workflow đăng tự động theo lịch chưa được kiểm thử hoàn chỉnh.
