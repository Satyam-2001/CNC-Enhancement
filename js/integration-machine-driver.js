var DriverCheckinterval;
var alreadyDetected = false;
var availableDriverVersion = 'v0.0.0'
var installedDriver = 'not detected'

function checkIfDriverIsInstalled() {
  // if (!alreadyDetected) {
  var url = "https://github.com/satyam-2001"
  $.ajax({
    url: url,
    type: 'GET',
    async: true,
    cache: false,
    timeout: 1000,
    error: function() {
      noDriver()
    },
    success: function(msg) {
      if (!alreadyDetected) {
        var instance = JSON.parse(msg)
        var host = instance.ipaddress.split(':')[0];
        var menuitem = `<a class="dropdown-item" href="#" onclick="sendGcodeToOmd('` + instance.ipaddress + `')">` + instance.application + ` v` + instance.version + ` (` + host + `)</a>`;
        // console.log(menuitem);
        // hasDriver(instance.version)
      }
    }
  });
  // };
};

$(document).ready(function() {

  // Check if Driver is running
  var DriverCheckinterval = setInterval(function() {
    checkIfDriverIsInstalled();
  }, 1000);

});

function hasDriver(version) {
  installedDriver = version
  if (versionCompare(availableDriverVersion, "v" + version) == 1) {
    //
  } else {
    $("#noDriverDetected").hide();
  }
  if (availableDriverVersion == "v" + version) {
    $("#noDriverDetected").hide();
  }
  $("#DriverDetected").show();
  alreadyDetected = true;
  $('#installDriversOnSettingspage').hide();
}

function noDriver() {
  alreadyDetected = false;
  installedDriver = 'not detected'
  $("#DriverDetected").hide();
  $("#noDriverDetected").show();
  // $('#installDriversOnSettingspage').show();
}

function oldDriver(version, availVersion) {
  alreadyDetected = true;
  installedDriver = version
  $("#DriverDetected").hide();
  $("#noDriverDetected").show();
  $('#installDriversOnSettingspage').show();
  $('#installDriverHelp').hide();
}
// Loop to check if we can use Machine Integration
setInterval(function() {
  if (objectsInScene.length < 1) {
    $('#validDocuments').html("<i class='fas fa-times fa-fw fg-red'></i>2. No Documents yet")
  } else {
    $('#validDocuments').html("<i class='fas fa-check fa-fw fg-green'></i>2. Valid Documents")
  }
  if (toolpathsInScene.length < 1) {
    $('#validToolpaths').html("<i class='fas fa-times fa-fw fg-red'></i>3. No Toolpaths yet")
  } else {
    $('#validToolpaths').html("<i class='fas fa-check fa-fw fg-green'></i>3. Valid Toolpaths")
  }
}, 1000);


function JSClock() {
  var time = new Date();
  var hour = time.getHours();
  var minute = time.getMinutes();
  var second = time.getSeconds();
  var temp = '' + hour
  if (hour == 0)
    temp = '12';
  temp += ((minute < 10) ? 'h0' : 'h') + minute;
  temp += ((second < 10) ? 'm0' : 'm') + second + 's';
  // temp += (hour >= 12) ? ' P.M.' : ' A.M.';
  return temp;
}

function activateDriver() {
  var url = "https://github.com/satyam-2001"
  $.ajax({
    type: 'GET',
    url: url,
    processData: false,
    contentType: false
  }).done(function(data) {
    console.log(data);
    // var message = data
    // Metro.toast.create(message, null, 4000);
  });
}

function sendGcodeToMyMachine() {
  var textToWrite = prepgcodefile();
  if (textToWrite.split('\n').length < 10) {
    var message = `No GCODE yet! Please setup some toolpaths, and Generate GCODE before you can use this function`
    Metro.toast.create(message, null, 4000, 'bg-red');
  } else {
    var blob = new Blob([textToWrite], {
      type: "text/plain"
    });
    var url = "https://github.com/satyam-2001"
    var fd = new FormData();
    // fd.append('fname', 'file.gcode');
    var time = new Date();
    var string = "obcam-" + time.yyyymmdd() + "-" + JSClock() + ".gcode"
    console.log(string)

    fd.append('data', blob, string);
    $.ajax({
      type: 'POST',
      url: url,
      data: fd,
      processData: false,
      contentType: false
    }).done(function(data) {
      // console.log(data);
      var message = `GCODE Successfully sent from CNC Enhancement`
      Metro.toast.create(message, null, 4000);
    });
  };
}

function versionCompare(v1, v2, options) {
  var lexicographical = options && options.lexicographical,
    zeroExtend = options && options.zeroExtend,
    v1parts = v1.split('.'),
    v2parts = v2.split('.');

  function isValidPart(x) {
    return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
  }

  if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
    return NaN;
  }

  if (zeroExtend) {
    while (v1parts.length < v2parts.length) v1parts.push("0");
    while (v2parts.length < v1parts.length) v2parts.push("0");
  }

  if (!lexicographical) {
    v1parts = v1parts.map(Number);
    v2parts = v2parts.map(Number);
  }

  for (var i = 0; i < v1parts.length; ++i) {
    if (v2parts.length == i) {
      return 1;
    }

    if (v1parts[i] == v2parts[i]) {
      continue;
    } else if (v1parts[i] > v2parts[i]) {
      return 1;
    } else {
      return -1;
    }
  }

  if (v1parts.length != v2parts.length) {
    return -1;
  }

  return 0;
}
