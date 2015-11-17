<?php 
  
  $password="openwrtindonesia";        // password untuk login ke server saklarku
  $scriptlocation="script/gpio.sh";    // lokasi server, relatif ke file index.php ini

  header('Cache-Control: no-cache, must-revalidate');
  header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  header("Access-Control-Allow-Origin: *");
  header('Content-Type: application/json');

  if (!isset($_POST['key'])) {
    die('{ "success": false, "message": "unauthorized!" }');
  } elseif ($_POST['key'] != $password) {
    die('{ "success": false, "message": "password salah!" }');
  }

  if (isset($_GET['auth'])) {
    if ($_POST[key] != $password) {
      echo '{ "success": false, "message": "password salah!" }';
    } else {
      echo '{ "success": true, "message": "sukses login!" }';
    }
  }

  elseif (isset($_GET['toggle'])) {
    $target = $_POST['target'];
    $output = exec("bash $scriptlocation toggle $target");
    echo "$output";
  }

  elseif (isset($_GET['single'])) {
    $target = $_POST['target'];
    $status = $_POST['status'];
    $output = exec("bash $scriptlocation single '$target' '$status'");
    echo "$output";
  }

  elseif (isset($_GET['group'])) {
    $target = $_POST['target'];
    $status = $_POST['status'];
    $output = exec("bash $scriptlocation group '$target' '$status'");
    echo "$output";
  }

  elseif (isset($_GET['allon'])) {
    $output = exec("bash $scriptlocation allon");
    echo "$output";
  }

  elseif (isset($_GET['alloff'])) {
    $output = exec("bash $scriptlocation alloff");
    echo "$output";
  }

  elseif (isset($_GET['list'])) {
    $output = exec("bash $scriptlocation list");
    echo "$output";
  }

  elseif (isset($_GET['status'])) {
    $output = exec("bash $scriptlocation status");
    echo "$output";
  }

  elseif (isset($_GET['listjadwal'])) {
    $output = exec("bash $scriptlocation list-jadwal");
    echo "$output";
  }

  elseif (isset($_GET['updatenama'])) {
    $nama = $_POST['nama'];
    $output = exec("bash $scriptlocation update-nama '$nama'");
    echo "$output";
  }

  else {
    echo '{ "success": false, "message": "request tidak lengkap atau salah" }'; 
  }
  
?>
