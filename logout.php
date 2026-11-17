<?php
session_start();
$_SESSION = [];       // kosongkan data sesi
session_destroy();    // hapus sesinya
header("Location: index.html");
exit;
?>