# Sử dụng Node.js Alpine image để có một phiên bản NodeJS nhỏ
FROM node:alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /home/app

# Copy các file package.json và package-lock.json vào container
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install --timeout=300000

# Copy toàn bộ mã nguồn vào container
COPY . .

# Chạy lệnh prisma generate để tạo các Prisma client (cần thiết cho việc truy cập cơ sở dữ liệu)
RUN npx prisma generate

# Mở cổng cho ứng dụng (nếu bạn muốn expose một cổng cụ thể cho app, ví dụ: 4000)
EXPOSE 4000

# Chạy ứng dụng NestJS trong chế độ phát triển
CMD ["npm", "run", "start:dev"]
