/**
 * - Build image từ docker file
 * docker build . -t tên image (vì dockerfile đang nằm trong thư mục root)
 * => docker build . -t img_be_phone
 *
 * - Login:
 * docker login -u toanphangl1997
 *
 * - chạy container
 * docker run -d -p --name ten_container ten_image
 * docker run -d -p 3307:4000 --name cons-tempi_be img-tempi_be
 *
 * - Lấy đia chỉ IP của 1 container
 * docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' id_name_container
 *
 * - Lấy danh sách image hiện có
 * docker image list
 *
 * - Xóa image
 * docker image remove
 *
 * - Container stop
 * docker container stop id or name container
 *
 * - Xóa container
 * docker container remove id or name container
 *
 * - Chạy docker compose:
 * docker compose up -d
 *
 * - Dừng docker compose:
 * docker compose down
 */
