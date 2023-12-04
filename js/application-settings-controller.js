function ConfirmDelete() {
  var x = confirm("Are you sure you want to restore to factory defaults?");
  if (x) {
    window.localStorage.clear()
    return true;
  } else {
    return false;
  }
}

function initLocalStorage() {
  var settingsOpen = document.getElementById('jsonFile');
  settingsOpen.addEventListener('change', restoreSettingsLocal, false);
  $('#savesettings').on('click', function() {
    saveSettingsLocal();
  });
  checkSettingsLocal();
}

// FIXME
// A way to access all of the settings
// $("#settings-menu-panel input, #settings-menu-panel textarea, #settings-menu-panel select").each(function() {console.log(this.id + ": " + $(this).val())});

localParams = [
  ['sizexmax', true],
  ['sizeymax', true],
  ['sizezmax', true],
  ['startgcode', false],
  ['laseron', false],
  ['laseroff', false],
  ['endgcode', false],
  ['g0command', true],
  ['g1command', true],
  ['scommandnewline', true],
  ['scommand', true],
  ['scommandscale', true],
  ['ihsgcode', false],
  ['firmwaretype', true],
  ['machinetype', true],
  ['performanceLimit', false]
];


// Wrappers for direct access to local storage -- these will get swapped with profiles laster
function saveSetting(setting, value) {
  localStorage.setItem(setting, value);
};

function loadSetting(setting) {
  return localStorage.getItem(setting);
};


function saveSettingsLocal() {
  console.group("Saving settings to LocalStorage");
  for (i = 0; i < localParams.length; i++) {
    var localParam = localParams[i];
    var paramName = localParam[0];
    if (paramName == 'sizexmax' || paramName == 'sizeymax') {
      var newval = $('#' + paramName).val()
      var oldval = loadSetting(paramName);
      if (oldval != newval) {
        redrawGrid()
      }
    }
    if (paramName == 'scommandnewline') {
      var val = $('#' + paramName).is(":checked");
    } else if (paramName == 'performanceLimit') {
      var val = $('#' + paramName).is(":checked");
    } else {
      var val = $('#' + paramName).val(); // Read the value from form
    }
    printLog('Saving: ' + paramName + ' : ' + val, successcolor);
    saveSetting(paramName, val);
  }
  printLog('<b>Saved Settings: <br>NB:</b> Please refresh page for settings to take effect', errorcolor, "settings");
  // $("#settingsmodal").modal("hide");
  console.groupEnd();
};

function loadSettingsLocal() {
  // console.log("Loading settings from LocalStorage")
  for (i = 0; i < localParams.length; i++) {
    var localParam = localParams[i];
    var paramName = localParam[0];
    var val = loadSetting(paramName);

    if (val) {
      // console.log('Loading: ' + paramName + ' : ' + val);
      if (paramName == 'firmwaretype') {
        setBoardButton(val)
      }
      if (paramName == 'machinetype') {
        setMachineButton(val)
      }
      if (paramName == 'scommandnewline') {
        $('#' + paramName).prop('checked', parseBoolean(val));
        // console.log('#' + paramName + " is set to " + val)
      } else if (paramName == 'performanceLimit') {
        $('#' + paramName).prop('checked', parseBoolean(val));
        // console.log('#' + paramName + " is set to " + val)
      } else {
        $('#' + paramName).val(val); // Set the value to Form from Storage
      }
    } else {
      // console.log('Not in local storage: ' +  paramName);
    }
  }
  // console.groupEnd();
};

function backupSettingsLocal() {
  var json = JSON.stringify(localStorage)
  var blob = new Blob([json], {
    type: "application/json"
  });
  invokeSaveAsDialog(blob, 'settings-backup.json');
};

function checkSettingsLocal() {
  var anyissues = false;
  // printLog('<b>Checking for configuration :</b><p>', msgcolor, "settings");
  for (i = 0; i < localParams.length; i++) {
    var localParam = localParams[i];
    var paramName = localParam[0];
    var paramRequired = localParam[1];
    var val = $('#' + localParams[i]).val(); // Read the value from form

    if (!val && paramRequired) {
      // printLog('Missing required setting: ' + paramName, errorcolor, "settings");
      anyissues = true;

    } else if (!val && !paramRequired) {
      // printLog('Missing optional setting: ' + paramName, warncolor, "settings");
    } else {
      // printLog('Found setting: ' + paramName + " : " + val, msgcolor, "settings");
    }
  }


  if (anyissues) {
    // console.log(`<b>MISSING CONFIG: You need to configure your setup. </b>. Click Edit, <a href='#' onclick='Metro.dialog.open('#settingsmodal');'><kbd>Settings <i class="fa fa-cogs"></i></kbd></a> on the top menu bar, and work through all the options`, errorcolor, "settings");
    // $("#settingsmodal").modal("show");
    setTimeout(function() {
      Metro.dialog.open('#settingsmodal');
    }, 1000)
    $('#checkLocalSettingsError').show();
  } else {
    if (!localStorage.getItem('hideChangelog')) {
      getChangelog();
    }
    $('#checkLocalSettingsError').hide();
  }


};

function restoreSettingsLocal(evt) {
  // console.log('Inside Restore');
  var input, file, fr;

  console.log('event ', evt)
  file = evt.target.files[0];
  fr = new FileReader();
  fr.onload = loadSettings;
  fr.readAsText(file);
};

function loadSettings(e) {
  lines = e.target ? e.target.result : e;
  var o = JSON.parse(lines);
  for (var property in o) {
    if (o.hasOwnProperty(property)) {
      saveSetting(property, o[property]);
    } else {
      // I'm not sure this can happen... I want to log this if it does!
      // console.log("Found a property " + property + " which does not belong to itself.");
    }
  }
  loadSettingsLocal();
};

window.parseBoolean = function(string) {
  var bool;
  bool = (function() {
    switch (false) {
      case string.toLowerCase() !== 'true':
        return true;
      case string.toLowerCase() !== 'false':
        return false;
    }
  })();
  if (typeof bool === "boolean") {
    return bool;
  }
  return void 0;
};


// Settings Dialog

function selectBoard(type) {
  console.log("Loading Firmware Template")
  if (type == "grbl") {
    template = `<img src="images/brd/` + type + `.png"/>  Generic GRBL`
    var tplscommand = `S`;
    var tplsscale = `1000`;
    var tplsnewline = false;
    var tplrapidcommand = `G0`;
    var tplmovecommand = `G1`;

  } else if (type == "xpro") {
    template = `<img src="images/brd/` + type + `.png"/>  Spark Concepts xPro`
    var tplscommand = `S`;
    var tplsscale = `1000`;
    var tplsnewline = false;
    var tplrapidcommand = `G0`;
    var tplmovecommand = `G1`;

  } else if (type == "blackbox") {
    template = `<img src="images/brd/` + type + `.png"/>  Spark Concepts xPro`
    var tplscommand = `S`;
    var tplsscale = `1000`;
    var tplsnewline = false;
    var tplrapidcommand = `G0`;
    var tplmovecommand = `G1`;

  } else if (type == "smoothie") {
    template = `<img src="images/brd/` + type + `.png"/>  Smoothieboard`
    var tplscommand = `S`;
    var tplsscale = `1`;
    var tplsnewline = false;
    var tplrapidcommand = `G0`;
    var tplmovecommand = `G1`;

  } else {
    template = `<img src="images/brd/grbl.png"/>Select Controller`
  }
  $('#g0command').val(tplrapidcommand);
  $('#g1command').val(tplmovecommand);
  $('#scommandnewline').prop('checked', tplsnewline);
  $('#scommand').val(tplscommand);
  $('#scommandscale').val(tplsscale);
  $("#firmwaretype").val(type)

  setBoardButton(type)

  controller = type;
};

function setBoardButton(type) {
  if (type == "grbl") {
    template = `<img src="images/brd/` + type + `.png"/>  Generic GRBL`
  } else if (type == "xpro") {
    template = `<img src="images/brd/` + type + `.png"/>  Spark Concepts xPro`
  }  else if (type == "smoothie") {
    template = `<img src="images/brd/` + type + `.png"/>  Smoothieboard`
  } else {
    template = `<img src="images/brd/grbl.png"/>Select Controller`
  }
  $('#context_toggle').html(template);
};


var controller = ""

function selectToolhead() {
  // console.log('selecttool')
  var toolArr = $("#toolheadSelect").val()
  if (toolArr) {
    $('#startgcode').val("")
    $('#endgcode').val("")
    var startcode = "G54; Work Coordinates\nG21; mm-mode\nG90; Absolute Positioning\n";
    var endcode = "";
    for (i = 0; i < toolArr.length; i++) {
      var type = toolArr[i]
      if (type == 'spindleonoff') {
        // console.log('Add Spindle')
        startcode += "M3 S" + $('#scommandscale').val() + "; Spindle On\n"
        endcode += "M5 S0; Spindle Off\n"
      }

      if (type == 'plasma') {
        $("#ihsgcode").val("; Machine does not support touch-off")
      }

      if (type == 'plasmaihs') {
        $("#ihsgcode").val("G38.2 Z-30 F100; Probe\nG10 L20 Z0; Set Z Zero\n")
      }




      if (type == 'laserm3') {
        // console.log('Add Laser Constant')
        startcode += "M3; Constant Power Laser On\n"
        endcode += "M5; Laser Off\n"
      }
      if (type == 'laserm4') {
        // console.log('Add Laser Dynamic')
        startcode += "M4; Dynamic Power Laser On\n"
        endcode += "M5; Laser Off\n"
      }
      if (type == 'misting') {
        // console.log('Add Misting')
        startcode += "M8; Coolant On\n"
        endcode += "M9; Coolant Off\n"
      }
      if (type == 'plotter') {
        // console.log('Add Plotter')
        startcode += "; Plotter Mode Active\n"
        endcode += "; Plotter Mode Complete\n"
      }
    }
    $('#startgcode').val(startcode)
    $('#endgcode').val(endcode)
  } else {
    $('#startgcode').val("")
    $('#endgcode').val("")
  }
}

function selectMachine(type) {
  console.log("Loading Machine Template")
  if (type == "sphinx55") {
    var xaxis = 333
    var yaxis = 325
    var zaxis = 85
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "sphinx1050") {
    var xaxis = 833
    var yaxis = 325
    var zaxis = 85
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "workbee1050") {
    var xaxis = 335
    var yaxis = 760
    var zaxis = 122
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "workbee1010") {
    var xaxis = 824
    var yaxis = 780
    var zaxis = 122
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "workbee1510") {
    var xaxis = 824
    var yaxis = 1280
    var zaxis = 122
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "acro55") {
    var xaxis = 300
    var yaxis = 300
    var zaxis = 0
    $('#toolheadSelect').data('select').val('laserm4')
  } else if (type == "acro510") {
    var xaxis = 800
    var yaxis = 300
    var zaxis = 0
    $('#toolheadSelect').data('select').val('laserm4')
  } else if (type == "acro1010") {
    var xaxis = 800
    var yaxis = 800
    var zaxis = 0
    $('#toolheadSelect').data('select').val('laserm4')
  } else if (type == "acro1510") {
    var xaxis = 1300
    var yaxis = 800
    var zaxis = 0
    $('#toolheadSelect').data('select').val('laserm4')
  } else if (type == "acro1515") {
    var xaxis = 1300
    var yaxis = 1300
    var zaxis = 0
    $('#toolheadSelect').data('select').val('laserm4')
  } else if (type == "acro55pen") {
    var xaxis = 300
    var yaxis = 300
    var zaxis = 0
    $('#toolheadSelect').data('select').val('plotter')
  } else if (type == "acro510pen") {
    var xaxis = 800
    var yaxis = 300
    var zaxis = 0
    $('#toolheadSelect').data('select').val('plotter')
  } else if (type == "acro1010pen") {
    var xaxis = 800
    var yaxis = 800
    var zaxis = 0
    $('#toolheadSelect').data('select').val('plotter')
  } else if (type == "acro1510pen") {
    var xaxis = 1300
    var yaxis = 800
    var zaxis = 0
    $('#toolheadSelect').data('select').val('plotter')
  } else if (type == "acro1515pen") {
    var xaxis = 1300
    var yaxis = 1300
    var zaxis = 0
    $('#toolheadSelect').data('select').val('laserm4')
  } else if (type == "minimill") {
    var xaxis = 120
    var yaxis = 195
    var zaxis = 80
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "cbeam") {
    var xaxis = 350
    var yaxis = 280
    var zaxis = 32
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "cbeamxl") {
    var xaxis = 750
    var yaxis = 330
    var zaxis = 51
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "leadmachine1515") {
    var xaxis = 1170
    var yaxis = 1250
    var zaxis = 90
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "leadmachine1010") {
    var xaxis = 730
    var yaxis = 810
    var zaxis = 90
    $('#toolheadSelect').data('select').val('spindleonoff')
  } else if (type == "leadmachine1010laser") {
    var xaxis = 730
    var yaxis = 810
    var zaxis = 90
    $('#toolheadSelect').data('select').val('laserm4')
  }
  $("#machinetype").val(type)
  $("#sizexmax").val(xaxis)
  $("#sizeymax").val(yaxis)
  $("#sizezmax").val(zaxis)
  selectToolhead();
};


$(document).ready(function() {
  var modal = `
  <!-- Settings Modal -->

  <div class="dialog dark" data-overlay-click-close="true" data-role="dialog" id="settingsmodal" data-width="730" data-to-top="true">
    <div class="dialog-title">Application Settings</div>
    <div class="dialog-content" style="max-height: calc(100vh - 200px);overflow-y: auto; overflow-x: hidden;">
        <form>

        <div id="checkLocalSettingsError">
          <center><h6>Welcome to CNC Enhancement</h6> Please configure the application below</center>
        </div>

          <ul class="step-list">

            <li>
              <h6 class="fg-grayBlue">Customise Defaults<br><small>From your machine and controller choice above we have prepopulated the settings below.  If you have any custom requirements, please customise the settings below</small></h6>
              <hr class="bg-grayBlue">
              <div>

                <div class="row mb-2">
                    <label class="cell-sm-6">X-Axis Length</label>
                    <div class="cell-sm-6">
                      <input type="number" data-role="input" data-clear-button="false" class="form-control " id="sizexmax" value="200" data-append="mm" step="any">
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="cell-sm-6">Y-Axis Length</label>
                    <div class="cell-sm-6">
                      <input type="number" data-role="input" data-clear-button="false" class="form-control " id="sizeymax" value="200" data-append="mm" step="any">
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="cell-sm-6">Z-Axis Length</label>
                    <div class="cell-sm-6">
                      <input type="number" data-role="input" data-clear-button="false" class="form-control " id="sizezmax" value="100" data-append="mm" step="any">
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="cell-sm-6">Spindle Command</label>
                    <div class="cell-sm-6">
                        <input type="text" data-role="input" data-clear-button="false" class="form-control form-control-sm" id="scommand" value="S" >
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="cell-sm-6">Power/Speed Scale</label>
                    <div class="cell-sm-6">
                      <input type="number" data-role="input" data-clear-button="false" class="form-control form-control-sm" id="scommandscale" value="1" data-prepend="0 to" step="any">
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="cell-sm-6">Power/Speed on new-line</label>
                    <div class="cell-sm-6">
                          <input data-role="checkbox" type="checkbox" id="scommandnewline" value="option1">
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="cell-sm-6">Rapid Move Command</label>
                    <div class="cell-sm-6">
                        <input type="text" data-role="input" data-clear-button="false" class="form-control form-control-sm" id="g0command" value="G0" >
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="cell-sm-6">Linear Move Command</label>
                    <div class="cell-sm-6">
                        <input type="text" data-role="input" data-clear-button="false" class="form-control form-control-sm" id="g1command" value="G1" >
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="cell-sm-6">Start G-Code</label>
                    <div class="cell-sm-6">
                      <textarea id="startgcode" data-role="textarea" data-auto-size="true" data-clear-button="false" placeholder="For example M4 G28 G90 M80 - supports multi line commands"></textarea>
                    </div>
                </div>

                <div class="row mb-2">
                    <label class="cell-sm-6">End G-Code</label>
                    <div class="cell-sm-6">
                      <textarea id="endgcode" data-role="textarea" data-auto-size="true" data-clear-button="false" placeholder="For example M5 M81 G28 - supports multi line commands"></textarea>
                    </div>
                </div>

              </div>
            </li>

          </form>

    </div>
    <div class="dialog-actions">
      <button id="backup" class="button secondary outline btn-file" data-tooltip="tooltip" data-placement="bottom" title="Take a backup" onclick="backupSettingsLocal()">
        <i class="fa fa-download fa-fw"></i> Backup Settings
      </button>
      <span id="restore" href="#" class="button secondary outline btn-file" data-tooltip="tooltip" data-placement="bottom" title="Open a backup settings file">
        <i class="fa fa-upload  fa-fw"></i> Restore from file <input id="jsonFile" type="file" accept=".json" />
      </span>
      <button class="button alert outline btn-file" data-tooltip="tooltip" data-placement="bottom" title="Reset all settings to default" onclick="ConfirmDelete()">
        <i class="fa fa-exclamation-triangle fa-fw"></i> Factory Reset
      </button>
      <button class="button secondary outline js-dialog-close">Cancel</button>
      <button id="savesettings" type="button" class="button js-dialog-close success">Save</button>
    </div>
  </div>
  <!-- #settingsmodal -->
  `
  $("body").append(modal);
  selectToolhead();
});