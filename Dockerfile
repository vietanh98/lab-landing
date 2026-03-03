# Sử dụng Node.js bản 20 trên nền Alpine để tối ưu dung lượng
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt công cụ build cần thiết cho 'better-sqlite3' (native module)
# SQLite yêu cầu python, make và g++ để cài đặt thành công trên Linux
RUN apk add --no-cache python3 make g++

# Copy các file định nghĩa dependencies
# Lưu ý: Bạn cần chạy 'npm install' ở máy local trước để có file package-lock.json
COPY package.json package-lock.json* ./

# Cài đặt dependencies sạch (Clean Install)
RUN npm ci

# Copy toàn bộ mã nguồn vào container
COPY . .

# Build dự án (Tạo ra thư mục /dist)
RUN npm run build

# Expose port (Dựa theo script preview của Vite thường dùng port 4173)
EXPOSE 4173

# Chạy lệnh preview với flag --host để truy cập được từ bên ngoài container
# Flag --host rất quan trọng để mapping port với Docker thành công
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]