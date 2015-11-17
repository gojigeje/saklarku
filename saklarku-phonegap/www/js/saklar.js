versi = "0.2.0";
build = "20151117";
timeout_value = 15000; // 15 detik

function cekStatus() {
  // console.log('checking: '+window.checking);
  if (window.connected && !window.checking) {
    window.checking = true;
    $.ajax({
      url: window.currentServerURL+'/?status',
      type: 'POST',
      data: {key: window.currentServerPassword},
      timeout: timeout_value,
    })
    .done(function(data) {
      // console.log(data);
      if (data.success) {
        if (!window.processing) {
          // console.log('toggle updated');
          $.each(data.gpios, function(i, v) {
            var ke = v.gpio - 1;
            var status = v.status;
            if (status=="0") {
              // console.log('gpio:'+ke+' -> false');
              $('.switch-control:eq('+ke+')').prop('checked', false);
            } else if (status == "1") {
              // console.log('gpio:'+ke+' -> true');
              $('.switch-control:eq('+ke+')').prop('checked', true);
            }

            if (typeof v.name == 'undefined') {
              var nama = 'Saklar '+v.gpio;
            } else {
              var nama = v.name;
            }
            $('#saklarname_'+v.gpio).html(nama);
            // $('#name_'+v.gpio).val(nama);
          });
        }
      } else {
        console.log("cekStatus: nosuccess");
        $('#modal-connectionlost').openModal();
        $('#setting-content').show();
        window.connected = false;
      }
      
    })
    .fail(function(x, t, m) {

      if (t==="timeout") {
        console.log("cekStatus: timeout");
        gagal('Timeout saat menghubungi server!');
        $('#saklar-content, .saklar-list, #jadwal-content, #setting-content-nama').fadeOut('fast');
      } else {
        console.log("cekStatus: error");
        $('#modal-connectionlost').openModal();
        $('#setting-content').show();
      }
      window.connected = false;
    })
    .always(function() {
      window.checking = false;
    });;

  } /*else {
      console.log("cekStatus: nocheck");
  }*/
};

function listServer(){
  // console.log('list-server');
  if (localStorage.getItem(["serverName"]) !== null) {
    // replace list
    var __list = "";
    $.each(window.serverName, function(i, v) {
      if (v == window.currentServerName) {
        __list+='<li><a href="#" onclick="changeServer(\''+v+'\')"><i class="fa fa-check-circle green-text"></i>&nbsp; '+v+'</a></li>'
      } else {
        __list+='<li><a href="#" onclick="changeServer(\''+v+'\')">'+v+'</a></li>'
      }
    });

    $('#list-server').html(__list);
  }
}

function changeServer(a) {
  // console.log('changeServer:'+a);

  window.processing = true;
  if (typeof a == 'undefined') {
    // console.log('kosong!!!');
    $('#errorDiv').hide();
    $('#saklar-content, .saklar-list, #jadwal-content, #setting-content, #setting-content-nama').fadeOut('fast', function() {
      listServer();
      $('#loading, #loadingtext').hide();
      if (window.serverName.length == 0) {
        $('#noserver').show();
        $('#selectserver').hide();
      } else {
        $('#selectserver').show();
        $('#noserver').hide();
      }
      window.connected = false;
    });  
  } else {
    $('#errorDiv, #selectserver').hide();
    $('#modal-connectionlost').closeModal();
    $('ul.tabs').tabs('select_tab', 'saklar');

    var index = window.serverName.indexOf(a);
    window.currentServerName = window.serverName[index];
    window.currentServerURL = window.serverURL[index];
    window.currentServerPassword = window.serverKey[index];

    $('#saklar-content, .saklar-list, #jadwal-content, #setting-content-nama').fadeOut('fast', function() {
      $('#saklar-list').replaceWith('<ul id="saklar-list" class="saklar-list collection with-header z-depth-1"></ul>');
      $('#jadwalharian').replaceWith('<ul id="jadwalharian" class="collapsible" data-collapsible="accordion"><li class="center-align nojadwal">tidak ada jadwal</li></ul>');
      $('#jadwalmingguan').replaceWith('<ul id="jadwalmingguan" class="collapsible" data-collapsible="accordion"><li class="center-align nojadwal">tidak ada jadwal</li></ul>');
      $('#jadwalbulanan').replaceWith('<ul id="jadwalbulanan" class="collapsible" data-collapsible="accordion"><li class="center-align nojadwal">tidak ada jadwal</li></ul>');
    });

    // clear content
    $('#loading, #loadingtext').show();
    $('#loadingtext').html('Server: '+window.currentServerName);
    $("#toggle-menu-kiri").sideNav('hide');

    localStorage.setItem("saklar_lastserver", window.currentServerName);

    listServer();
    getList();
    updateSetting();
    setTimer();
  }
}

function getList() {
  // ambil list saklar
  $.ajax({
    url: window.currentServerURL+'/?status',
    type: 'POST',
    data: {key: window.currentServerPassword},
    timeout: timeout_value,
  })
  .done(function(data) {
    // console.log(data);
    if (data.success) {
      var __list = '<ul id="saklar-list" class="saklar-list collection with-header z-depth-1">'
                +'<li id="list_servername" class="collection-header indigo darken-1"><h4><i class="fa fa-sitemap"></i>&nbsp; '+window.currentServerName+'</h4></li>';
      var __listcheck = '<div id="gpiolist"><p>Pilih Saklar:</p><p>';
      var __names = '';
      $.each(data.gpios, function(i, v) {
        if (typeof v.name == 'undefined') {
          var nama = 'Saklar '+v.gpio;
        } else {
          var nama = v.name;
        }
        __list+='<li class="collection-item">'
          +'  <div>'
          +'    <span id="saklarname_'+v.gpio+'">'+nama+'</span>'
          +'    <a href="#!" class="secondary-content">'
          +'      <div class="switch">'
          +'        <label>'
          +'          <input type="checkbox" class="switch-control" value="'+v.gpio+'">'
          +'          <span class="lever"></span>'
          +'        </label>'
          +'      </div>'
          +'    </a>'
          +'  </div>'
          +'</li>';
        __listcheck+='<input type="checkbox" class="filled-in" id="pilih-'+v.gpio+'" name="gpiolist-cb" value="'+v.gpio+'"/>'
                  +'<label for="pilih-'+v.gpio+'">'+v.gpio+'</label>';
        __names+='<div class="input-field">'
        +'  <input placeholder="SAKLAR '+v.gpio+'" type="text" id="name_'+v.gpio+'" name="names[]" value="'+nama+'">'
        +'  <label class="active" for="name_1">Saklar '+v.gpio+'</label>'
        +'</div>';
      });
      __list+='</ul>';
      __listcheck+='</p></div>';
      
      window.connected = true;

      $('#errorDiv, #selectserver').hide();

      $('#saklar-list').replaceWith(__list);
      $('#names').html(__names);
      $('#gpiolist').replaceWith(__listcheck);
      $('#saklar-content, .saklar-list, #jadwal-content, #setting-content, #setting-content-nama').fadeIn('fast');

      // ambil list jadwal
      $('#loadingtext').html('Mengambil jadwal..');

      getJadwal();
      
    } else {
      gagal(data.message);
    }
  })
  .fail(function(x, t, m) {
    if (t==="timeout") {
      gagal('Timeout saat menghubungi server!');
    } else {
      gagal();
    }
    console.log("error: listSaklar");
  })
  .always(function(){
    $('#hapus_namaserver').html(window.currentServerName);
    $('#btn_hapusserver').attr('value', window.currentServerName);
  });
}

function getJadwal() {
  $.ajax({
    url: window.currentServerURL+'/?listjadwal',
    type: 'POST',
    data: {key: window.currentServerPassword},
  })
  .done(function(data) {
    // console.log(data);

    if (data.success) {

      // harian
      __harian='  <ul id="jadwalharian" class="collapsible" data-collapsible="accordion">'
      if (data.harian.length != 0) {
        $.each(data.harian, function(i, v) {
          __harian+='<li>'
          __harian+='<div class="collapsible-header"><i class="fa fa-clock-o"></i>'+v.judul
          __harian+='<div class="secondary-content grey-text darken-2-text">'+v.ringkasan+'</div>'
          __harian+='</div>'
          __harian+='<div class="collapsible-body grey lighten-4"><i class="fa fa-terminal"></i>'+v.detail+'</div>'
          __harian+='</li>'
        });
        __harian+='  </ul>'
      } else {
        __harian='    <li class="center-align nojadwal">tidak ada jadwal</li>'
      }

      // mingguan
      __mingguan='  <ul id="jadwalmingguan" class="collapsible" data-collapsible="accordion">'
      if (data.mingguan.length != 0) {
        $.each(data.mingguan, function(i, v) {
          __mingguan+='<li>'
          __mingguan+='<div class="collapsible-header"><i class="fa fa-clock-o"></i>'+v.judul
          __mingguan+='<div class="secondary-content grey-text darken-2-text">'+v.ringkasan+'</div>'
          __mingguan+='</div>'
          __mingguan+='<div class="collapsible-body grey lighten-4"><i class="fa fa-terminal"></i>'+v.detail+'</div>'
          __mingguan+='</li>'
        });
        __mingguan+='  </ul>'
      } else {
        __mingguan='    <li class="center-align nojadwal">tidak ada jadwal</li>'
      }

      // bulanan
      __bulanan='  <ul id="jadwalbulanan" class="collapsible" data-collapsible="accordion">'
      if (data.bulanan.length != 0) {
        $.each(data.bulanan, function(i, v) {
          __bulanan+='<li>'
          __bulanan+='<div class="collapsible-header"><i class="fa fa-clock-o"></i>'+v.judul
          __bulanan+='<div class="secondary-content grey-text darken-2-text">'+v.ringkasan+'</div>'
          __bulanan+='</div>'
          __bulanan+='<div class="collapsible-body grey lighten-4"><i class="fa fa-terminal"></i>'+v.detail+'</div>'
          __bulanan+='</li>'
        });
        __bulanan+='  </ul>'
      } else {
        __bulanan='    <li class="center-align nojadwal">tidak ada jadwal</li>'
      }

      $('#jadwalharian').replaceWith(__harian);
      $('#jadwalmingguan').replaceWith(__mingguan);
      $('#jadwalbulanan').replaceWith(__bulanan);

      $('.list-body').hide();

      $('.collapsible').collapsible();

    }

    window.connected = true;
    window.processing = false;
    cekStatus();
    setTimer();
    $('#loadingtext, #loading').hide();
    console.log('saklarku-app siap!');
  })
  .fail(function() {
    $('#loadingtext, #loading').hide();
    console.log("error: listJadwal");
  });
}

function updateSetting() {
  $('#setting_servername').val(window.currentServerName);
  $('#setting_servername_old').val(window.currentServerName);
  $('#setting_serverurl').val(window.currentServerURL);
  $('#setting_serverpass').val(window.currentServerPassword);
}

function setTimer() {
  clearInterval(window.timer);
  window.timer = setInterval(function() {
    if (!window.processing) {
      if (window.connected) {
        // console.log('cek status');
        cekStatus();
      } else {
        console.log('cek status: ndak konek');
      }
    } else {
      console.log('cek status: lagi proses');
    }
  }, 5000);
}

function gagal(a) {
  __html = '<div class="card red col s12">'
  __html+='  <div class="card-content white-text">'
  __html+='    <span class="card-title white-text">Gagal!</span>'
  __html+='    <p>Gagal menyambungkan ke server <b>'+window.currentServerName+'</b>, pastikan server online dan bisa diakses oleh device. Periksa juga URL dan password servernya.</p>'
  __html+='    <br><p>ServerURL: '+window.currentServerURL+'</p>'
  if (a != undefined) {
  __html+='    <p>error: <b>'+a+'</b></p>'
  }
  __html+='  </div>'
  __html+='</div>';
  $('#errorDiv').show().html(__html);
  $('#loadingtext').hide();
  $('#loading').hide();

  window.connected = false;
  $('#setting-content').show();
};

$(document).ready(function(){

  $('.version').html(versi);
  $('#buildver').html(build);

  // gobal variables
  window.processing = true;
  window.connected = false;
  window.checking = false;

  $("#toggle-menu-kiri").sideNav({
    closeOnClick: true 
  });
  $('.modal-trigger').leanModal();

  // jika pertama kali run
  if (localStorage.getItem("saklar_firstrun") != "false") {
    console.log("pertama run!");

    // bersihkan localstorage dulu
    localStorage.clear();
    localStorage.setItem("saklar_firstrun", "false");

    // prepare localstorage
    window.serverName = new Array();
    localStorage["serverName"] = JSON.stringify(serverName);
    window.serverURL = new Array();
    localStorage["serverURL"] = JSON.stringify(serverURL);
    window.serverKey = new Array();
    localStorage["serverKey"] = JSON.stringify(serverKey);

    $('#noserver').fadeIn('400', function() {
      $('#loading').hide();
    });
    $('#loadingtext').hide();

  } else {

    // cek jumlah server
    if (localStorage.getItem(["serverName"]) !== null) {
      window.serverName = JSON.parse(localStorage["serverName"]);
      window.serverURL = JSON.parse(localStorage["serverURL"]);
      window.serverKey = JSON.parse(localStorage["serverKey"]);
    } else {
      window.serverName = new Array();
      localStorage["serverName"] = JSON.stringify(serverName);
      window.serverURL = new Array();
      localStorage["serverURL"] = JSON.stringify(serverURL);
      window.serverKey = new Array();
      localStorage["serverKey"] = JSON.stringify(serverKey);
    }

    if (window.serverName.length == 0) {
      console.log('server-empty');
      $('#noserver').fadeIn('400', function() {
        $('#loading').hide();
      });
      $('#loadingtext').hide();
    } else {

      if (localStorage.getItem("saklar_lastserver") == "undefined") {
        // console.log('undefined!!!');
        changeServer();
      } else if (localStorage.getItem("saklar_lastserver") == "deleted") {
        // console.log('deleted!!!');
        changeServer();
      } else {
        
        console.log("server-get-last:", localStorage.getItem("saklar_lastserver"));
        
        var index = window.serverName.indexOf(localStorage.getItem("saklar_lastserver"));
        window.currentServerName = window.serverName[index];
        window.currentServerURL = window.serverURL[index];
        window.currentServerPassword = window.serverKey[index];

        $('#loadingtext').html('Server: '+window.currentServerName);

        listServer();
        getList();
        updateSetting();

        console.log(window.currentServerName+' siap!');

      }

    }

  }

  console.log("ready");
});

$(window).load(function() {

  $(document).on('click', '.switch-control', function(event) {

    event.preventDefault();
    event.stopPropagation();
    var even = event;
    var slide = $(this);

    if (!window.processing) {
      window.processing = true;
      var t = $(this).val();
      $('#loading').show();

      $.ajax({
        url: window.currentServerURL+'/?toggle',
        type: 'POST',
        data: {key: window.currentServerPassword, target: t},
      })
      .done(function(data) {
        // console.log(data);
        
        if (data.success) {

          if (slide.prop('checked')) {
            // console.log("nge-off");
            slide.prop('checked', false);
          } else {
            // console.log("nge-on");
            slide.prop('checked', true);
          }

          $('#allon, #alloff').attr('checked', false);
          window.processing = false;
          window.connected = true;
          $('#loading').hide();
          Materialize.toast(data.message, 2000);
        } else {
          window.processing = false;
          $('#loading').hide();
          Materialize.toast('[GAGAL] '+data.message, 2000);
        }
        
      })
      .fail(function() {
        console.log("error: toggle");
        $('#modal-connectionlost').openModal();
        $('#setting-content').show();
        window.connected = false;
        window.processing = false;
        $('#loading').hide();
      });

    } else { 
      console.log('lagi proses'); 
      event.preventDefault();
      event.stopPropagation();
    }

  });

  $('#allon').click(function(e) {

    if (!window.processing) {
      window.processing = true;
      $('#loading').show();
      $.ajax({
        url: window.currentServerURL+'/?allon',
        type: 'POST',
        data: {key: window.currentServerPassword},
      })
      .done(function(data) {
        // console.log(data);

        if (data.success) {
          $('.switch-control').prop('checked', true);
          window.processing = false;
          window.connected = true;
          $('#loading').hide();
          Materialize.toast('Semua GPIO ON', 2000);
        } else {
          window.processing = false;
          $('#loading').hide();
          Materialize.toast('[GAGAL] '+data.message, 2000);
        }

      })
      .fail(function() {
        console.log("error: allOn");
        $('#modal-connectionlost').openModal();
        $('#setting-content').show();
        window.connected = false;
        window.processing = false;
        $('#loading').hide();
      });

    } else { console.log('lagi proses'); }

  });

  $('#alloff').click(function(e) {
    
    if (!window.processing) {
      window.processing = true;
      $('#loading').show();

      $.ajax({
        url: window.currentServerURL+'/?alloff',
        type: 'POST',
        data: {key: window.currentServerPassword},
      })
      .done(function(data) {
        // console.log(data);

        if (data.success) {
          $('.switch-control').prop('checked', false);
          window.processing = false;
          window.connected = true;
          $('#loading').hide();
          Materialize.toast('Semua GPIO OFF', 2000);
        } else {
          window.processing = false;
          $('#loading').hide();
          Materialize.toast('[GAGAL] '+data.message, 2000);
        }
        
      })
      .fail(function() {
        console.log("error: allOff");
        $('#modal-connectionlost').openModal();
        $('#setting-content').show();
        window.connected = false;
        window.processing = false;
        $('#loading').hide();
      });

    } else { console.log('lagi proses'); }
    
  });

  $('#btn_addserver').click(function() {
    var servername = $('#servername').val();
    var serverurl = $('#serverurl').val();
    var serverpass = $('#serverpass').val();

    if(serverurl.substr(-1) === '/') {
      serverurl = serverurl.substr(0, serverurl.length - 1);
    }

    // cek server sama?
    if (window.serverName.indexOf(servername) > -1) {
      // console.log('ada');
      $('#server-name-error').html('<br>Sudah ada! Gunakan nama lain!');
      
    } else {
      // console.log('ga ada');
      $('#server-name-error, #server-add-error').html('');
      
      // coba auth
      $.ajax({
        url: serverurl+'/?auth',
        type: 'POST',
        data: {key: serverpass},
        timeout: timeout_value,
      })
      .done(function(data) {
        if (data.success) {
          // sukses auth

          // tambahkan
          window.serverName.push(servername);
          window.serverURL.push(serverurl);
          window.serverKey.push(serverpass);
          localStorage["serverName"] = JSON.stringify(serverName);
          localStorage["serverURL"] = JSON.stringify(serverURL);
          localStorage["serverKey"] = JSON.stringify(serverKey);

          window.currentServerName = servername;
          window.currentServerURL = serverurl;
          window.currentServerPassword = serverpass;

          $('#servername').val('');
          $('#serverurl').val('');
          $('#serverpass').val('');

          $('#noserver').hide();
          $('#loadingtext').html('Server: '+window.currentServerName);
          $('#loading, #loadingtext').show();
          $('#modal-tambah-server').closeModal();

          localStorage.setItem("saklar_lastserver", window.currentServerName);

          listServer();
          getList();
          updateSetting();
          setTimer();

          $('ul.tabs').tabs('select_tab', 'saklar');
        } else {
          // gagal
          console.log('gagal!');
          var msg = '<br>'+data.message;
          $('#server-add-error').html('Gagal menambahkan server!'+msg);
        }
      })
      .fail(function() {
        // gagal
        console.log('fail!');
        $('#server-add-error').html('Gagal menambahkan server!');
      });
      
    }

  });
  
  $('.btn_groupcmd').click(function() {
    var st = $(this).val();
    var gstatus = "";
    var gtarget = "";
    $('input[name="gpiolist-cb"]:checked').each(function() {
      gtarget+=this.value;
      gstatus+=st;
    });

    if (!window.processing) {
      window.processing = true;
      $('#loading').show();
      $.ajax({
        url: window.currentServerURL+'/?group',
        type: 'POST',
        data: {key: window.currentServerPassword, target:gtarget, status:gstatus},
      })
      .done(function(data) {
        // console.log(data);

        if (data.success) {
          window.processing = false;
          window.connected = true;
          $('#loading').hide();

          $.each(data.groups, function(i, v) {
            var ke = v.target - 1;
            if (st=="0") {
              // console.log('gpio:'+ke+' -> false');
              $('.switch-control:eq('+ke+')').prop('checked', false);
            } else {
              // console.log('gpio:'+ke+' -> true');
              $('.switch-control:eq('+ke+')').prop('checked', true);
            }
          });

          Materialize.toast('GPIO '+gtarget+' > '+gstatus, 2000);
        } else {
          window.processing = false;
          $('#loading').hide();
          Materialize.toast('[GAGAL] '+data.message, 2000);
        }
        
      })
      .fail(function() {
        console.log("error: groupcmd");
        $('#modal-connectionlost').openModal();
        $('#setting-content').show();
        window.connected = false;
        window.processing = false;
        $('#loading').hide();
      });

    } else { console.log('lagi proses'); }

  });

  $('#btn_setting_save').click(function(event) {
    var oname = $('#setting_servername_old').val();
    var sname = $('#setting_servername').val();
    var surl = $('#setting_serverurl').val();
    var spass = $('#setting_serverpass').val();

    // get index
    var index = window.serverName.indexOf(window.currentServerName);
    
    // replace local array
    window.serverName[index] = sname;
    window.serverURL[index] = surl;
    window.serverKey[index] = spass;

    // simpan localstorage
    localStorage["serverName"] = JSON.stringify(window.serverName);
    localStorage["serverURL"] = JSON.stringify(window.serverURL);
    localStorage["serverKey"] = JSON.stringify(window.serverKey);
    localStorage.setItem("saklar_lastserver", sname);
    
    window.currentServerName = sname;
    window.currentServerURL = surl;
    window.currentServerPassword = spass;

    $('#saved').fadeIn(400, function() {
      $(this).delay(1000).fadeOut(400);
      $('#list_servername').html('<h4><i class="fa fa-sitemap"></i>&nbsp; '+sname+'</h4>');
      $('#hapus_namaserver').html(sname);
      $('#btn_hapusserver').attr('value', sname);
    });

    listServer();
  });
  
  $('#btn_name_save').click(function(event) {
    var name = '';
    $("input[name='names[]']").each(function() {
      name += $(this).val().replace(/;/g,"") + ';';
    });
    name = name.replace(/;$/, "").replace(/\"/g, "").replace(/\'/g, "");
    // console.log(name);

    if (!window.processing) {
      $('#loading').show();
      window.processing = true;

      $.ajax({
        url: window.currentServerURL+'/?updatenama',
        type: 'POST',
        data: {key: window.currentServerPassword, nama: name},
        timeout: timeout_value,
      })
      .done(function(data) {
        
        if (data.success) {
          $.each(data.gpios, function(i, v) {
            // console.log('#saklarname_'+v.gpio+': '+v.name);
            $('#saklarname_'+v.gpio).html(v.name);
          });

          $('#saved_name').fadeIn(400, function() {
            $(this).delay(1000).fadeOut(400);
          });
        } else {
          if (data.message == "request tidak lengkap atau salah") {
            $('#message-header').html('Update Script Server!');
            $('#message-content').html('Tidak bisa menyimpan nama saklar.<br>Update script server dengan versi terbaru di github!');
            $('#modal-message').openModal();
            console.log('oldversion!');
          }
        }

      })
      .always(function(){
        $('#loading').hide();
        window.processing = false;
      });

    } else { console.log('lagi proses'); }
    
  });

  $('#btn_hapusserver').click(function(event) {
    // get index
    var index = window.serverName.indexOf($(this).attr('value'));

    // hapus index 
    window.serverName.splice(index, 1);
    window.serverURL.splice(index, 1);
    window.serverKey.splice(index, 1);

    // simpan localstorage
    localStorage["serverName"] = JSON.stringify(window.serverName);
    localStorage["serverURL"] = JSON.stringify(window.serverURL);
    localStorage["serverKey"] = JSON.stringify(window.serverKey);
    localStorage.setItem("saklar_lastserver", "deleted");

    $('#modal-hapus-server').closeModal();
    changeServer();
  });

  $('#btn_reload').click(function() {
    $('#modal-connectionlost').closeModal();
    changeServer(window.currentServerName);
  });

  $('#serverurl').focus(function(event) {
    if ($(this).val() == "") {
      $(this).val("http://");
    };
  });

  console.log( "window loaded" );
});
