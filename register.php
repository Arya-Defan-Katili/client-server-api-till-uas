<?php
// Hubungkan aplikasi ke database sebelum memproses pendaftaran.
include "connection/koneksi.php";

// Pendaftaran hanya boleh dilakukan melalui pengiriman form POST.
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: index.html");
    exit;
}

// Tampilkan pesan yang aman lalu kembali ke halaman utama.
function kembaliDenganPesan($pesan)
{
    echo "<script>alert(" . json_encode($pesan) . "); window.location.href='index.html';</script>";
    exit;
}

// Ambil semua nilai form dan rapikan spasi di awal atau akhir.
$nama = trim($_POST["nama"] ?? "");
$jenisKelamin = trim($_POST["jenis_kelamin"] ?? "");
$tanggalLahir = trim($_POST["tanggal_lahir"] ?? "");
$username = trim($_POST["username"] ?? "");
$password = trim($_POST["password"] ?? "");
$konfirmasi = trim($_POST["konfirmasi"] ?? "");
$provinsi = trim($_POST["provinsi"] ?? "");
$kabupaten = trim($_POST["kabupaten"] ?? "");
$kecamatan = trim($_POST["kecamatan"] ?? "");
$desa = trim($_POST["desa"] ?? "");

// Pastikan semua kolom yang diperlukan sudah diisi.
$dataWajib = array(
    $nama,
    $jenisKelamin,
    $tanggalLahir,
    $username,
    $password,
    $konfirmasi,
    $provinsi,
    $kabupaten,
    $kecamatan,
    $desa
);

foreach ($dataWajib as $nilai) {
    if ($nilai === "") {
        kembaliDenganPesan("Semua kolom wajib diisi.");
    }
}

// Periksa kecocokan dan panjang password.
if ($password !== $konfirmasi) {
    kembaliDenganPesan("Konfirmasi password tidak sama.");
}

if (strlen($password) < 6) {
    kembaliDenganPesan("Password harus minimal 6 karakter.");
}

// Pastikan username sesuai batas panjang kolom dan aturan pendaftaran.
$panjangUsername = function_exists("mb_strlen")
    ? mb_strlen($username, "UTF-8")
    : strlen($username);

if ($panjangUsername < 4 || $panjangUsername > 50) {
    kembaliDenganPesan("Username harus terdiri dari 4 sampai 50 karakter.");
}

// Jenis kelamin hanya boleh memakai salah satu nilai yang disediakan form.
if ($jenisKelamin !== "Laki-laki" && $jenisKelamin !== "Perempuan") {
    kembaliDenganPesan("Jenis kelamin tidak valid.");
}

// Pastikan tanggal benar-benar valid dan tidak berada di masa depan.
$tanggal = DateTime::createFromFormat("!Y-m-d", $tanggalLahir);
$kesalahanTanggal = DateTime::getLastErrors();
$tanggalValid = $tanggal !== false
    && $tanggal->format("Y-m-d") === $tanggalLahir
    && ($kesalahanTanggal === false
        || ($kesalahanTanggal["warning_count"] === 0 && $kesalahanTanggal["error_count"] === 0));

if (!$tanggalValid) {
    kembaliDenganPesan("Tanggal lahir tidak valid.");
}

if ($tanggal > new DateTime("today")) {
    kembaliDenganPesan("Tanggal lahir tidak boleh di masa depan.");
}

// Cocokkan panjang data dengan batas kolom tabel users.
$namaLength = function_exists("mb_strlen") ? mb_strlen($nama, "UTF-8") : strlen($nama);
$regionValues = array($provinsi, $kabupaten, $kecamatan, $desa);

if ($namaLength > 100) {
    kembaliDenganPesan("Nama maksimal 100 karakter.");
}

foreach ($regionValues as $wilayah) {
    $panjangWilayah = function_exists("mb_strlen")
        ? mb_strlen($wilayah, "UTF-8")
        : strlen($wilayah);
    if ($panjangWilayah > 100) {
        kembaliDenganPesan("Nama wilayah maksimal 100 karakter.");
    }
}

// Periksa username terlebih dahulu agar pengguna mendapat pesan yang jelas.
$cekUsername = mysqli_prepare($conn, "SELECT id FROM users WHERE username = ?");
if (!$cekUsername) {
    kembaliDenganPesan("Pendaftaran gagal. Silakan coba lagi.");
}

mysqli_stmt_bind_param($cekUsername, "s", $username);
if (!mysqli_stmt_execute($cekUsername)) {
    mysqli_stmt_close($cekUsername);
    kembaliDenganPesan("Pendaftaran gagal. Silakan coba lagi.");
}

mysqli_stmt_store_result($cekUsername);
$usernameDipakai = mysqli_stmt_num_rows($cekUsername) > 0;
mysqli_stmt_close($cekUsername);

if ($usernameDipakai) {
    kembaliDenganPesan("Username sudah dipakai");
}

// Simpan hash password dan data profil memakai prepared statement.
$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$query = "INSERT INTO users
    (id, username, password, nama, jenis_kelamin, tanggal_lahir, provinsi, kabupaten, kecamatan, desa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
$stmt = mysqli_prepare($conn, $query);

if (!$stmt) {
    kembaliDenganPesan("Pendaftaran gagal. Silakan coba lagi.");
}

// NULL pada kolom id membuat MySQL mengisi nomor AUTO_INCREMENT secara otomatis.
$id = null;
mysqli_stmt_bind_param(
    $stmt,
    "ssssssssss",
    $id,
    $username,
    $passwordHash,
    $nama,
    $jenisKelamin,
    $tanggalLahir,
    $provinsi,
    $kabupaten,
    $kecamatan,
    $desa
);

if (!mysqli_stmt_execute($stmt)) {
    $errorNumber = mysqli_stmt_errno($stmt);
    mysqli_stmt_close($stmt);

    if ($errorNumber === 1062) {
        kembaliDenganPesan("Username sudah dipakai");
    }

    kembaliDenganPesan("Pendaftaran gagal. Silakan coba lagi.");
}

mysqli_stmt_close($stmt);
kembaliDenganPesan("Registrasi berhasil, silakan login");
?>
