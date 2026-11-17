<?php
session_start();                              // aktifkan sesi (buat "ingat" user yang sudah login)
include "connection/koneksi.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {  // kalau dibuka langsung, bukan lewat form
    header("Location: index.html");
    exit;
}

$username = trim($_POST["username"] ?? "");   // trim = buang spasi di awal/akhir
$password = $_POST["password"] ?? "";

// Ambil user berdasarkan username SAJA. Password dicek di PHP, bukan di SQL.
$stmt = mysqli_prepare($conn, "SELECT id, username, password FROM users WHERE username = ?");
mysqli_stmt_bind_param($stmt, "s", $username);   // "s" = 1 parameter bertipe string
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$user   = mysqli_fetch_assoc($result);           // 1 baris data user, atau false kalau tidak ada

$valid = false;

if ($user) {
    $tersimpan = $user["password"];
    $sudahHash = password_get_info($tersimpan)["algo"] !== null;  // true kalau isinya sudah hash

    if ($sudahHash) {
        $valid = password_verify($password, $tersimpan);          // cocokkan password dengan hash
    } elseif (hash_equals($tersimpan, $password)) {
        // User lama: password masih teks biasa. Kalau cocok, ubah jadi hash.
        $valid = true;
        $hashBaru = password_hash($password, PASSWORD_DEFAULT);
        $upd = mysqli_prepare($conn, "UPDATE users SET password = ? WHERE id = ?");
        mysqli_stmt_bind_param($upd, "si", $hashBaru, $user["id"]);  // "si" = string, integer
        mysqli_stmt_execute($upd);
    }
}

if ($valid) {
    session_regenerate_id(true);                  // ganti ID sesi biar aman
    $_SESSION["user_id"]  = $user["id"];          // simpan tanda "sudah login"
    $_SESSION["username"] = $user["username"];
    header("Location: beranda/dashboard.php");
    exit;
} else {
    echo "<script>alert('Username atau password salah!'); window.location.href='index.html';</script>";
}
?>