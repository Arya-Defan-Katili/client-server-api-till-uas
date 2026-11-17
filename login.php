<?php
include "connection/koneksi.php";

$username = $_POST["username"] ?? "";
$password = $_POST["password"] ?? "";

$stmt = mysqli_prepare($conn, "SELECT id FROM users WHERE username = ? AND password = ?");
mysqli_stmt_bind_param($stmt, "ss", $username, $password);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if (mysqli_fetch_assoc($result)) {
    header("Location: beranda/dashboard.html");
    exit;
} else {
    echo "<script>alert('Username atau password salah!'); window.location.href='index.html';</script>";
}
?>