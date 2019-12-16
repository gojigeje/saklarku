<?php 
  
  $password="yourpassword";        // password untuk login ke server saklarku
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
  elseif(isset($_GET['addjadwal'])){
    $cron=$_POST['cron'];
    $cron=str_replace('gpio','/www/gpio/'.$scriptlocation,$cron);
    //read
    $roots="/etc/crontabs/root";
    copy($roots, $roots.'.bak');// backup first
    $rootfiles=fopen($roots,'r');
    $rootContent=fread($rootfiles,filesize($roots));
    fclose($rootContent);
    //write
    $file = fopen($roots, "w");        
    fwrite($file, $rootContent."\n".$cron);
    fclose($file);
    echo '{ "success": true, "message": "writes" }'; 
  }
  elseif(isset($_GET['deljadwal'])){//hapus jadwal
    $cron=$_POST['param'];
    $roots="/etc/crontabs/root";
    copy($roots, $roots.'.bak');// backup first
    remove_line($roots,$cron); //method delete
    echo '{ "success": true, "message": "Deleted '.$cron.'" }'; 
  }

  else {
    echo '{ "success": false, "message": "request tidak lengkap atau salah" }'; 
  }

  function remove_line($file, $remove) {
    $lines = file($file, FILE_IGNORE_NEW_LINES);
    foreach($lines as $key => $line) {
        if(stripos($line,$remove)) unset($lines[$key]);
    }
    $data = implode(PHP_EOL, $lines);
    file_put_contents($file, $data);
}
?>
