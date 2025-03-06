CREATE TABLE phones (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    storage INT NOT NULL,
    ram INT NOT NULL,
    battery INT NOT NULL,
    os VARCHAR(50) NOT NULL
);

INSERT INTO phones (brand, model, price, storage, ram, battery, os) VALUES
('Apple', 'iPhone 13', 799.99, 128, 4, 3240, 'iOS'),
('Apple', 'iPhone 14', 899.99, 128, 6, 3279, 'iOS'),
('Samsung', 'Galaxy S23', 849.99, 256, 8, 3900, 'Android'),
('Samsung', 'Galaxy S22', 749.99, 128, 8, 3700, 'Android'),
('Xiaomi', 'Redmi Note 12', 299.99, 128, 6, 5000, 'Android'),
('Xiaomi', 'Mi 11', 499.99, 256, 8, 4600, 'Android'),
('Google', 'Pixel 7', 599.99, 128, 8, 4355, 'Android'),
('Google', 'Pixel 6a', 449.99, 128, 6, 4410, 'Android'),
('OnePlus', 'OnePlus 11', 699.99, 256, 12, 5000, 'Android'),
('Oppo', 'Find X5', 799.99, 256, 8, 4800, 'Android');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'user')) NOT NULL
);

INSERT INTO users (username, password, role) VALUES
('admin1', 'admin123', 'admin'),
('admin2', 'admin456', 'admin'),
('user1', 'user123', 'user'),
('user2', 'user456', 'user'),
('user3', 'user789', 'user');

-- bảng product
-- (id,name,price,des)
-- insert product,update product,delete product ( admin )

-- user chỉ được quyền xem bảng,tạo đơn hàng

-- table hóa đơn
-- (id,name user,sdt,price,dịa chỉ)

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    phone VARCHAR(15) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
