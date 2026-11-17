<?php
session_start();

if (!isset($_SESSION["user_id"])) {          // belum login?
    header("Location: ../index.html");       // ../ = naik satu folder
    exit;
}

header("Cache-Control: no-store, no-cache, must-revalidate"); // biar tombol Back tidak nampilin halaman ini setelah logout

$username = htmlspecialchars($_SESSION["username"], ENT_QUOTES, "UTF-8"); // cegah XSS
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Genshin Impact</title>
    <link rel="stylesheet" href="../style.css">
</head>
<body>

<nav>
    <div class="logo">
        <img src="../logo-genshin-impact-42374.png" alt="Genshin Impact" />
    </div>
    <ul>
        <li><a href="../index.html">Home</a></li>
        <li><a class="logout-link" href="../logout.php">Logout</a></li>
    </ul>
</nav>

<main class="dashboard">
    <section class="welcome-card">
        <h1>Selamat datang, <?= $username ?>!</h1>
        <p>Login berhasil. Halaman ini hanya bisa dibuka kalau kamu sudah login.</p>
    </section>
</main>

</body>
</html>