#!/bin/bash
# ----------------------------------------------------------------------------------
# @name    : gpio.sh
# @version : 0.1
# @date    : 2015/11/05 06:04 WIB
#
# ABOUT
# ----------------------------------------------------------------------------------
# Script untuk mengontrol GPIO / lampu led pada router Huawei HG553
#
# LICENSE
# ----------------------------------------------------------------------------------
#  The MIT License (MIT)
#  Copyright (c) 2013 Ghozy Arif Fajri <gojigeje@gmail.com>
#

# sesuaikan urutan gpio
GPIO1="/sys/devices/platform/leds-gpio.0/leds/HW553:blue:hspa/brightness"
GPIO2="/sys/devices/platform/leds-gpio.0/leds/HW553:red:hspa/brightness"
GPIO3="/sys/devices/platform/leds-gpio.0/leds/HW553:red:wifi/brightness"
GPIO4="/sys/devices/platform/leds-gpio.0/leds/HW553:red:power/brightness"
GPIO5="/sys/devices/platform/leds-gpio.0/leds/HW553:red:lan/brightness"
GPIO6="/sys/devices/platform/leds-gpio.0/leds/HW553:blue:lan/brightness"
GPIO7="/sys/devices/platform/leds-gpio.0/leds/HW553:blue:adsl/brightness"
GPIO8="/sys/devices/platform/leds-gpio.0/leds/HW553:red:adsl/brightness"

GPIOS=( "$GPIO1" "$GPIO2" "$GPIO3" "$GPIO4" "$GPIO5" "$GPIO6" "$GPIO7" "$GPIO8" ) # jadikan array

HARI=( "Minggu" "Senin" "Selasa" "Rabu" "Kamis" "Jumat" "Sabtu" )
sleeptime="1"
jumlahgpio=${#GPIOS[@]}
mode="$1"
DIR="$( cd "$( dirname "$0" )" && pwd )"
cd "$DIR"
scriptName=$(basename "$0")
configFile="${scriptName%.*}_status.cfg"
nameFile="${scriptName%.*}_name.cfg"
scriptPath="$DIR/$scriptName"

if [[ "$mode" == "toggle" || "$mode" == "single" ]]; then
  if [[ -z "$2" ]]; then
    echo '{ "success": false, "message": "Parameter tidak lengkap!" }'
    exit
  fi
  # maksimal gpio
  if [[ $2 -gt $jumlahgpio ]]; then
    echo "{ \"success\": false, \"message\": \"Maksimal $jumlahgpio GPIO!\" }"
    exit
  fi
fi

# functions
usage() {
  echo ""
  echo "  +-------------------------------------------------+"
  echo "  |  Huawei HG553 GPIO Control Script by @gojigeje  |"
  echo "  +-------------------------------------------------+"
  echo ""
  echo "  Cara Pakai:"
  echo "    ./$scriptName  [mode] [target] [status]"
  echo ""
  echo "  Mode:"
  echo "    toggle, single, group, allon, allof, list, status, startup"
  echo ""
  echo "  Contoh:"
  echo "    ./$scriptName  toggle 1        toggle GPIO ke 1 (ON/OFF)"
  echo "    ./$scriptName  single 2 0      set GPIO 2 dengan posisi 0"
  echo "    ./$scriptName  group 123 101   set GPIO 1=1, GPIO 2=0, dan GPIO 3=1"
  echo "    ./$scriptName  allon           set semua posisi GPIO dengan 1 / ON"
  echo "    ./$scriptName  alloff          set semua posisi GPIO dengan 0 / OFF"
  echo ""
  echo "    ./$scriptName  list            tampilkan daftar GPIO yang tersedia"
  echo "    ./$scriptName  list-jadwal     tampilkan jadwal GPIO di crontab"
  echo "    ./$scriptName  status          tampilkan status masing-masing GPIO"
  echo ""
  echo "    ./$scriptName  startup         mengembalikan posisi GPIO saat startup"
  echo "                               ke posisi terakhir"
  echo ""
  echo "  Script akan memberikan output dengan sintaks JSON"
  echo ""
}

saklar() {
  # set target
  target="GPIO$1"
  if [[ "$2" == "1" ]]; then
    kondisi="ON"
  else
    kondisi="OFF"
  fi
  echo "$2" > ${!target} #gojilog
  nm="NAME$1"
  if [[ "$3" != "quiet" ]]; then
    echo "{ \"success\": true, \"target\": \"$1\", \"status\": \"$2\", \"message\": \"${!nm} $kondisi\" }"
  fi
}

group() {
  list_target="$1"
  list_status="$2"
  lt=${#list_target}
  ls=${#list_status}
  # pastikan length list_target == list_status
  if [[ $lt != $ls ]]; then
    echo "{ \"success\": false, \"message\": \"jumlah target dan status tidak sama! $1[$lt]:$2[$ls]\" }"
    exit
  fi
  if [[ ! -z "$3" ]]; then
    sleeptime="$3"
  fi
  output="{ \"success\": true, \"type\": \"group\", \"groups\": ["; # awal json
  for (( i=0; i<${#list_target}; i++ )); do # http://stackoverflow.com/a/10552175
    # pastikan nomor target tidak melampaui jumlah gpio
    if [[ ${list_target:$i:1} -gt $jumlahgpio ]]; then
      output="$output { \"success\": false, \"target\": \"${list_target:$i:1}\", \"status\": \"${list_status:$i:1}\", \"message\": \"invalid target\" },"
    else
      out=$(saklar "${list_target:$i:1}" "${list_status:$i:1}")
      output="$output $out,"
      sleep $sleeptime
    fi
  done
  output=$(echo "$output" | sed 's/,$//g')
  output="$output ]}" # akhir json
  echo "$output"
}

updatecfg() {
  > $configFile
  num=1
  for i in "${GPIOS[@]}"
  do
    st=$(cat $i)
    echo "STATUS$num=$st" >> $configFile
    let num++;
  done
}

list_jadwal() {
  cronFile="/etc/crontabs/root"

  # cek ada entry?
  entry=$(cat $cronFile | grep "$scriptPath" | wc -l)
  if [[ $entry == "0" ]]; then
    echo "belum ada entri"
  fi

  grep "$scriptPath" "$cronFile" > "$scriptName.tmp"
  > "$scriptName.tmp.h"
  > "$scriptName.tmp.m"
  > "$scriptName.tmp.b"

  k=1
  while read line; do

    l1=$(echo "$line" | cut -d " " -f1)
    l2=$(echo "$line" | cut -d " " -f2)
    l3=$(echo "$line" | cut -d " " -f3)
    l4=$(echo "$line" | cut -d " " -f4)
    l5=$(echo "$line" | cut -d " " -f5)

    judul=$(echo "$line" | cut -d "#" -f2 | sed 's/^ //g')
    pathslashed=$(echo "$scriptPath" | sed 's/\//\\\//g')
    detail=$(echo "$line" | sed "s/^.* "$pathslashed"//g" | cut -d "#" -f1)

    if [[ "$l1" != "*" && "$l2" != "*" && "$l3" == "*" && "$l4" == "*" && "$l5" == "*"  ]]; then
      teks="jam $l2:$l1"
      echo -n "{\"judul\": \"$judul\",\"command\": \"$line\",\"detail\": \"$detail\",\"ringkasan\": \"$teks\"}," >> "$scriptName.tmp.h"
    fi

    if [[ "$l1" != "*" && "$l2" != "*" && "$l3" == "*" && "$l4" == "*" && "$l5" != "*"  ]]; then
      teks="${HARI[$l5]} jam $l2:$l1"
      echo -n "{\"judul\": \"$judul\",\"command\": \"$line\",\"detail\": \"$detail\",\"ringkasan\": \"$teks\"}," >> "$scriptName.tmp.m"
    fi

    if [[ "$l1" != "*" && "$l2" != "*" && "$l3" != "*" && "$l4" == "*" && "$l5" == "*"  ]]; then
      teks="tgl $l3, jam $l2:$l1"
      echo -n "{\"judul\": \"$judul\",\"command\": \"$line\",\"detail\": \"$detail\",\"ringkasan\": \"$teks\"}," >> "$scriptName.tmp.b"
    fi

    ((k++))
  done < "$scriptName.tmp"

  echo -n '{"success": true,"type": "list-jadwal",'
  echo -n '"harian": ['
  harian=$(cat "$scriptName.tmp.h" | sed 's/,$//g')
  echo -n "$harian"
  echo -n '],"mingguan": ['
  mingguan=$(cat "$scriptName.tmp.m" | sed 's/,$//g')
  echo -n "$mingguan"
  echo -n '],"bulanan": ['
  bulanan=$(cat "$scriptName.tmp.b" | sed 's/,$//g')
  echo -n "$bulanan"
  echo "]}"

  # cleanup
  rm "$scriptName.tmp" "$scriptName.tmp.h" "$scriptName.tmp.m" "$scriptName.tmp.b"
}

update_nama() {
  > $nameFile
  output="{ \"success\": true, \"type\": \"update-nama\", \"gpios\": ["; # awal json
  num=1
  for i in "${GPIOS[@]}"
  do
    nm=$(echo "$1" | cut -d ";" -f $num)
    if [[ "$nm" == "" ]]; then
      nm="GPIO-$num"
      output="$output {\"gpio\": \"$num\", \"name\": \"$nm\"},"
    else
      output="$output {\"gpio\": \"$num\", \"name\": \"$nm\"},"
    fi
    echo "NAME$num=\"$nm\"" >> $nameFile
    let num++;
  done
  output=$(echo "$output" | sed 's/,$//g')
  output="$output ]}" # akhir json
  echo "$output"
}

# ===========================================================================================================

# cek file config
if [[ -f $configFile ]]; then
  # load
  . $configFile
else
  # buat, isi dengan status sekarang
  updatecfg  
fi

# hapus config lama
if [[ -f "${scriptName%.*}.cfg" ]]; then
  rm "${scriptName%.*}.cfg"
fi

# cek file nama
if [[ -f $nameFile ]]; then
  # load
  . $nameFile
else
  # buat, isi dengan nama default
  num=1
  for i in "${GPIOS[@]}"
  do
    echo "NAME$num=\"GPIO $num\"" >> $nameFile
    let num++;
  done 
  # lalu load
  . $nameFile
fi

case "$mode" in

  "toggle" )
    # set target
    target="GPIO$2"
    # read status
    status=$(cat ${!target})
    if [[ "$status" == "0" ]]; then
      saklar "$2" 1
    else
      saklar "$2" 0
    fi
  ;;

  "single" )
    # param 3 harus ada
    if [[ -z "$3" ]]; then
      echo '{ "success": false, "message": "parameter tidak lengkap!" }'
      exit
    else
      saklar "$2" "$3"
    fi
  ;;

  "group" )    
    # param 3 harus ada
    if [[ -z "$3" ]]; then
      echo '{ "success": false, "message": "parameter tidak lengkap!" }'
      exit
    else
      group "$2" "$3" "$4"
    fi
  ;;

  "allon" )
    output="{ \"success\": true, \"type\": \"allon\", \"messages\": ["; # awal json
    num=1
    for i in "${GPIOS[@]}"
    do
      st=$(cat $i)
      if [[ "$st" == "1" ]]; then
        output="$output {\"target\": \"$num\", \"status\": \"1\", \"message\": \"Saklar $num sudah ON\"},"
      else
        saklar $num 1 quiet
        output="$output {\"target\": \"$num\", \"status\": \"1\", \"message\": \"Saklar $num ON\"},"
        sleep "$sleeptime"
      fi
      let num++;
    done
    output=$(echo "$output" | sed 's/,$//g')
    output="$output ]}" # akhir json
    echo "$output"
  ;;

  "alloff" )
    output="{ \"success\": true, \"type\": \"alloff\", \"messages\": ["; # awal json
    num=1
    for i in "${GPIOS[@]}"
    do
      st=$(cat $i)
      if [[ "$st" == "0" ]]; then
        output="$output {\"target\": \"$num\", \"status\": \"0\", \"message\": \"Saklar $num sudah OFF\"},"
      else
        saklar $num 0 quiet
        output="$output {\"target\": \"$num\", \"status\": \"0\", \"message\": \"Saklar $num OFF\"},"
        sleep "$sleeptime"
      fi
      let num++;
    done
    output=$(echo "$output" | sed 's/,$//g')
    output="$output ]}" # akhir json
    echo "$output"
  ;;

  "list" )
    output="{ \"success\": true, \"type\": \"list\", \"total\": $jumlahgpio, \"gpios\": ["; # awal json
    num=1
    for i in "${GPIOS[@]}"
    do
      nm="NAME$num"
      id=$(($num - 1))
      output="$output {\"gpio\": \"$num\", \"path\": \"$i\", \"name\": \"${!nm}\"},"
      let num++;
    done
    output=$(echo "$output" | sed 's/,$//g')
    output="$output ]}" # akhir json
    echo "$output"
  ;;

  "status" )
    output="{ \"success\": true, \"type\": \"status\", \"gpios\": ["; # awal json
    num=1
    for i in "${GPIOS[@]}"
    do
      st=$(cat $i)
      nm="NAME$num"
      id=$(($num - 1))
      output="$output {\"gpio\": \"$num\", \"path\": \"$i\", \"name\": \"${!nm}\", \"status\": \"$st\"},"
      let num++;
    done
    output=$(echo "$output" | sed 's/,$//g')
    output="$output ]}" # akhir json
    echo "$output"
  ;;  

  "startup")
    on=$(cat $configFile | grep "=1" | wc -l)
    if [[ $on -gt 0 ]]; then
      echo "Mengembalikan posisi GPIO:"
      num=1
      for i in "${GPIOS[@]}"
      do
        st="STATUS$num"
        if [[ ${!st} != "0" ]]; then
          saklar $num ${!st} quiet
          echo " GPIO$num : ${!st}"
          sleep "$sleeptime"
        else
          echo " GPIO$num : ${!st}"
        fi
        let num++;
      done
    else
      echo "Semua GPIO dalam posisi OFF"
    fi
  ;;

  "help")
    usage
  ;;

  "list-jadwal")
    list_jadwal
  ;;

  "update-nama")
    update_nama "$2"
  ;;

  *)
    echo "{ \"success\": false, \"message\": \"request tidak lengkap atau salah, gunakan parameter 'help' untuk bantuan\" }"
    exit
  ;;

esac

# update config file
updatecfg
