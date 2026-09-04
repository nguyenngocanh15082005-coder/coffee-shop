const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

// =========================
// CẤU HÌNH EJS
// =========================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// =========================
// MIDDLEWARE
// =========================
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use(
    session({
        secret: process.env.SESSION_SECRET || "coffee-shop-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 // 1 ngày
        }
    })
);

// Biến dùng chung trong tất cả file EJS
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.cart = req.session.cart || [];

    res.locals.cartCount = (req.session.cart || []).reduce(
        (total, item) => total + item.quantity,
        0
    );

    next();
});

// =========================
// DỮ LIỆU SẢN PHẨM TẠM THỜI
// Sau này có thể chuyển sang MySQL
// =========================
const products = {
    1: {
        id: 1,
        name: "Arabica Cầu Đất",
        price: 185000,
        image: "/images/cafe1.jpg",
        roast: "Rang vừa",
        weight: "250g",
        description: "Hương thơm nhẹ, vị chua thanh, hậu vị ngọt."
    },

    2: {
        id: 2,
        name: "Robusta Buôn Ma Thuột",
        price: 145000,
        image: "/images/cafe2.jpg",
        roast: "Rang đậm",
        weight: "250g",
        description: "Vị đậm mạnh, caffeine cao, phù hợp pha cà phê sữa."
    },

    3: {
        id: 3,
        name: "Blend Espresso",
        price: 165000,
        image: "/images/cafe3.jpg",
        roast: "Rang vừa đậm",
        weight: "250g",
        description: "Kết hợp Arabica và Robusta, phù hợp pha Espresso."
    },

    4: {
        id: 4,
        name: "Arabica Đà Lạt",
        price: 195000,
        image: "/images/cafe4.jpg",
        roast: "Rang sáng",
        weight: "250g",
        description: "Hương hoa và trái cây, vị chua thanh đặc trưng."
    }
};

// =========================
// TÀI KHOẢN TẠM THỜI
// Sau này chuyển sang MySQL
// =========================
const users = [];

// =========================
// DỮ LIỆU BLOG
// =========================
const blogs = {
    1: {
        id: 1,
        title: "Câu chuyện Highlands Coffee",
        image: "/images/blog-highlands.jpg",
        excerpt:
            "Hành trình phát triển thương hiệu cà phê Việt với phong cách hiện đại.",
        content: `
Highlands Coffee được biết đến là một trong những thương hiệu cà phê quen thuộc tại Việt Nam.

Thương hiệu tập trung vào việc kết hợp văn hóa cà phê Việt với không gian hiện đại, dễ tiếp cận với nhiều nhóm khách hàng.

Các dòng sản phẩm phổ biến gồm cà phê phin, cà phê sữa, trà và nhiều thức uống hiện đại khác.
        `
    },

    2: {
        id: 2,
        title: "Câu chuyện Trung Nguyên",
        image: "/images/blog-trungnguyen.jpg",
        excerpt:
            "Thương hiệu gắn liền với cà phê Việt và tinh thần khởi nghiệp.",
        content: `
Trung Nguyên là thương hiệu cà phê nổi tiếng của Việt Nam.

Thương hiệu phát triển nhiều dòng cà phê rang xay, cà phê hòa tan và hệ thống cửa hàng.

Một trong những sản phẩm được nhiều người biết đến là G7.
        `
    },

    3: {
        id: 3,
        title: "Câu chuyện Thái Yên",
        image: "/images/blog-thaiyen.jpg",
        excerpt:
            "Một phong cách cà phê hiện đại, chú trọng trải nghiệm hạt cà phê.",
        content: `
Thái Yên xây dựng hình ảnh thương hiệu theo phong cách hiện đại và tối giản.

Các sản phẩm tập trung nhiều vào hạt cà phê, phương pháp pha và trải nghiệm hương vị.

Phong cách trình bày sản phẩm thường nhấn mạnh nguồn gốc, độ rang và đặc tính của từng loại hạt.
        `
    }
};

// =========================
// TRANG CHỦ
// =========================
app.get("/", (req, res) => {
    res.render("index", {
        products: Object.values(products),
        blogs: Object.values(blogs)
    });
});

// =========================
// DANH SÁCH SẢN PHẨM
// =========================
app.get("/products", (req, res) => {
    res.render("products", {
        products: Object.values(products)
    });
});

// =========================
// CHI TIẾT SẢN PHẨM
// =========================
app.get("/product/:id", (req, res) => {
    const product = products[req.params.id];

    if (!product) {
        return res.status(404).send("Không tìm thấy sản phẩm.");
    }

    res.render("product-detail", {
        product
    });
});

// =========================
// GIỎ HÀNG
// =========================

// Thêm sản phẩm
app.post("/cart/add/:id", (req, res) => {
    const product = products[req.params.id];

    if (!product) {
        return res.status(404).send("Không tìm thấy sản phẩm.");
    }

    if (!req.session.cart) {
        req.session.cart = [];
    }

    const item = req.session.cart.find(
        (item) => item.id === product.id
    );

    if (item) {
        item.quantity++;
    } else {
        req.session.cart.push({
            ...product,
            quantity: 1
        });
    }

    res.redirect("/cart");
});

// Hiển thị giỏ hàng
app.get("/cart", (req, res) => {
    const cart = req.session.cart || [];

    const total = cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    res.render("cart", {
        cart,
        total
    });
});

// Tăng số lượng
app.post("/cart/increase/:id", (req, res) => {
    const cart = req.session.cart || [];

    const item = cart.find(
        (item) => item.id === Number(req.params.id)
    );

    if (item) {
        item.quantity++;
    }

    res.redirect("/cart");
});

// Giảm số lượng
app.post("/cart/decrease/:id", (req, res) => {
    let cart = req.session.cart || [];

    const item = cart.find(
        (item) => item.id === Number(req.params.id)
    );

    if (item) {
        item.quantity--;

        if (item.quantity <= 0) {
            cart = cart.filter(
                (item) => item.id !== Number(req.params.id)
            );
        }
    }

    req.session.cart = cart;

    res.redirect("/cart");
});

// Xóa sản phẩm
app.post("/cart/remove/:id", (req, res) => {
    const cart = req.session.cart || [];

    req.session.cart = cart.filter(
        (item) => item.id !== Number(req.params.id)
    );

    res.redirect("/cart");
});

// Xóa toàn bộ giỏ hàng
app.post("/cart/clear", (req, res) => {
    req.session.cart = [];
    res.redirect("/cart");
});

// =========================
// BLOG / CÂU CHUYỆN
// =========================

// Danh sách blog
app.get("/blog", (req, res) => {
    res.render("blog", {
        blogs: Object.values(blogs)
    });
});

// Chi tiết blog
app.get("/blog/:id", (req, res) => {
    const blog = blogs[req.params.id];

    if (!blog) {
        return res.status(404).send("Không tìm thấy bài viết.");
    }

    res.render("blog-detail", {
        blog
    });
});

// =========================
// ĐĂNG KÝ
// =========================
app.get("/register", (req, res) => {
    res.render("register", {
        error: null
    });
});

app.post("/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            confirmPassword
        } = req.body;

        if (!name || !email || !password || !confirmPassword) {
            return res.render("register", {
                error: "Vui lòng nhập đầy đủ thông tin."
            });
        }

        if (password.length < 6) {
            return res.render("register", {
                error: "Mật khẩu phải có ít nhất 6 ký tự."
            });
        }

        if (password !== confirmPassword) {
            return res.render("register", {
                error: "Mật khẩu xác nhận không khớp."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = users.find(
            (user) => user.email === normalizedEmail
        );

        if (existingUser) {
            return res.render("register", {
                error: "Email này đã được đăng ký."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: users.length + 1,
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        };

        users.push(newUser);

        res.redirect("/login");
    } catch (error) {
        console.error("Lỗi đăng ký:", error);

        res.status(500).send("Có lỗi xảy ra khi đăng ký.");
    }
});

// =========================
// ĐĂNG NHẬP
// =========================
app.get("/login", (req, res) => {
    res.render("login", {
        error: null
    });
});

app.post("/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.render("login", {
                error: "Vui lòng nhập email và mật khẩu."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = users.find(
            (user) => user.email === normalizedEmail
        );

        if (!user) {
            return res.render("login", {
                error: "Email hoặc mật khẩu không đúng."
            });
        }

        const passwordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordCorrect) {
            return res.render("login", {
                error: "Email hoặc mật khẩu không đúng."
            });
        }

        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email
        };

        res.redirect("/");
    } catch (error) {
        console.error("Lỗi đăng nhập:", error);

        res.status(500).send("Có lỗi xảy ra khi đăng nhập.");
    }
});

// =========================
// ĐĂNG XUẤT
// =========================
app.get("/logout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error("Lỗi đăng xuất:", error);
            return res.redirect("/");
        }

        res.clearCookie("connect.sid");
        res.redirect("/");
    });
});

// =========================
// LIÊN HỆ
// =========================
app.get("/contact", (req, res) => {
    res.render("contact");
});

// =========================
// TRANG 404
// =========================
app.use((req, res) => {
    res.status(404).send("404 - Không tìm thấy trang.");
});

// =========================
// KHỞI ĐỘNG SERVER
// LUÔN ĐỂ CUỐI FILE
// =========================
app.listen(PORT, () => {
    console.log(`Website đang chạy tại http://localhost:${PORT}`);
});