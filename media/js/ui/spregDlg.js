
// Author: xunli at asu.edu
define(['jquery', './utils', './cartoProxy', './mapManager', 'list'], function($, Utils, CartoProxy, MapManager, List) {

var SpregDlg = (function($){
  var instance;

  function init() {
    // singleton

    // private methods/vars

    var prev_obj;

    function PopupDiv(anchor, divToPop, text) {
      var pos=$(anchor).offset(),
          h=$(anchor).height(),
          w=$(anchor).width();
      if (w == 0) w = 40;
      if ( text != undefined ) {
        $(divToPop).html(text);
      }
      $(divToPop).css({ left: pos.left + w , top: pos.top - h });
      $(divToPop).show(function() {
        setTimeout(function(){ $(divToPop).fadeOut('slow');}, 2000);
      });
    };

    // kernel weights itesm
    $('#spreg-spn-pow-idst, #spreg-spn-dist-knn').spinner();
    $('#spreg-dist-slider').slider({
      min: 0, max: 100,
      slide: function( event, ui ) { $('#spreg-txt-dist-thr').val(ui.value); }
    });

    $( "#tabs" ).tabs();
    $( "#spreg-result-tabs" ).tabs();

    $( "#btn_open_model" ).button({icons: {primary: "ui-icon-locked"},text: true})
    .click(function() {
      $('#dlg-open-model').dialog('open');
    });
    $( "#btn_save_model" ).button({icons: {primary: "ui-icon-disk"}})
    .click(function() {
      $('#dlg-save-model').dialog('open');
    });

    $( "#btn_reset_model" ).button({icons: {primary: "ui-icon-)circle-close"}})
    .click(function() { restSpreg(); });

    $( "#btn_preference" ).button({icons:{primary: "ui-icon-gear",}})
    .click(function(){ $('#dialog-preference').dialog('open');});

    $( "#btn_result" ).button({icons: {primary: "ui-icon-document",}})
    .click(function(){
      $('#dialog-spreg-result').dialog('open').draggable('disable');
    }).hide();

    // save spreg result to datasource
    $('#btn-save-predy').click(function() {
      var count=0,
          param;
      $('#txt-spreg-predy').children("table").each(function(i,tbl) {
        var content = $(tbl).html().replace(/\<th\>|\<\/th\>|\<tbody\>|\<\/tbody\>|\<tr\>|\<\/tr\>|\<\/td\>/g,"").replace(/\<td\>/g,",");
        if (param == undefined)
          param = {};
        param["predy" + i] = content;
        count = i;
      });
      if (param) {
        param["n"] = count+1;
        param["layer_uuid"] = layer_uuid;
        param["csrfmiddlewaretoken"] = csrftoken;
        $(this).attr("disabled", "disabled");
        $(html_load_img).insertAfter("#btn-save-predy");
        $.post("../save_spreg_result/", param, function() {
        }).done( function(result) {
          console.log(result);
        }).always( function() {
          $("#btn-save-predy").next().remove();
          $(html_check_img).insertAfter("#btn-save-predy");
        });
      }
    });

    // save spreg result to csv
    $('#btn-export-predy').on('click', function(event) {
      Utils.exportTableToCSV.apply(this, [$('#txt-spreg-predy>table'),'export.csv']);
    });

    // reset Spreg dialog
    function resetSpreg() {
      $.each($('#x_box li, #y_box li, #ye_box li, #inst_box li, #r_box li'), function(i, v) { $(v).dblclick();});
      $('input[name="model_type"][value="0"]').prop('checked', true)
      $('input[name="method"]').prop('disabled', true)
      $('input[name="method"][value="0"]').prop('checked', true).prop('disabled', false);
      $('input:checkbox[name=stderror]').each(function(i,obj){
        $(obj).prop('checked', false);
      });
    }

    var prev_obj; // for mobile devices
    $('#y_catalog h2, #x_catalog h2').click(function(){
      if (prev_obj) {
        prev_obj.css("border", "");
      }
      prev_obj = $(this).next();
      prev_obj.css("border", "2px solid red");
    });
    $('#ul-x-variables').selectable().click( function(evt) {
      if ( prev_obj == undefined || !$(evt.target).parent().is("li") ) return;
      var txt_var = evt.target.innerText;
      var box = prev_obj.children().first();
      box.find( ".placeholder" ).remove();
      // customized behavior for different dropbox
      var box_id = box.closest("div").attr("id");
      var n_items = box.children().length;
      if ( n_items > 0) {
        if (box_id === 'y_box'||box_id==='r_box')
          return;
      }
      // drop gragged item
      $( "<li></li>" ).text(txt_var).appendTo(box).dblclick(function(){
        $(this).remove();
        $(evt.target).parent().show();
      });
      $(evt.target).parent().hide();
    });

    // init Spreg dialg: tabs
    $("#y_catalog").accordion({heightStyle : "content"});
    $("#x_catalog").accordion({heightStyle : "content"});
    $("#w_catalog_model").accordion({active : 1});
    $("#tabs-kernel-weights").tabs();
    $("#vars ul li").draggable({ helper: "clone"});
    $(".drop_box ol li").dblclick(function() {});
    $(".drop_box ol").droppable({
      activeClass: "ui-state-default",
      hoverClass: "ui-state-hover",
      accept: ":not(div)",
      drop: function(event, ui) {
        $(this).find(".placeholder").remove();
        // customized behavior for different dropbox
        var box_id = $(this).closest("div").attr("id");
        var n_items = $(this).children().length;
        if ( n_items > 0) {
          if (box_id === 'y_box'||box_id==='r_box')
            return;
        }
        // drop gragged item
        $("<li></li>").text( ui.draggable.text() ).appendTo( this )
        .dblclick(function(){
          $(this).remove();
          ui.draggable.show();
        });
        ui.draggable.hide();
      }
    }).sortable({
      items: "li:not(.placeholder)",
      sort: function() {
        // gets added unintentionally by droppable interacting with sortable
        // using connectWithSortable fixes this, but doesn't allow you to customize active/hoverClass options
        $( this ).removeClass( "ui-state-default" );
      }
    });
    $('#ui-accordion-y_catalog-header-1').click(function() {
      $('#gmm').prop('disabled', false);
      $('#gmm').prop('checked', true);
      $('#ols').prop('checked', false);
      $('#ols').prop('disabled', true);
    });
    $('#ui-accordion-y_catalog-header-1').click(function() {
      $('#gmm').prop('disabled', false);
      $('#gmm').prop('checked', true);
      $('#ols').prop('checked', false);
      $('#ols').prop('disabled', true);
    });
    // model type
    $('input:radio[name=model_type]').click( function() {
      var model_type = $(this).val();
      if ( model_type == 0 ) {
        $("input[name='method'], input[name='stderror']").prop('disabled', false);
        $('#ml, #gmm, #het').prop('disabled', true);
        $('#ols').prop('checked', true);
        $("input[name='stderror']").prop('checked', false);
      } else if ( model_type == 1 ) {
        $("input[name='method'], input[name='stderror']").prop('disabled', false);
        $('#ols, #het').prop('disabled', true);
        $('#gmm').prop('checked', true);
        $("input[name='stderror']").prop('checked', false);
      } else if ( model_type == 2 ) {
        $("input[name='method'], input[name='stderror']").prop('disabled', false);
        $('#ols, #white, #hac').prop('disabled', true);
        $('#gmm').prop('checked', true);
        $("input[name='stderror']").prop('checked', false);
      } else if ( model_type == 3 ) {
        $("input[name='method'], input[name='stderror']").prop('disabled', false);
        $('#ols, #ml, #white, #hac').prop('disabled', true);
        $('#gmm').prop('checked', true);
        $("input[name='stderror']").prop('checked', false);
      }
    });
    $('input:radio[name=model_type]:first').click();

    $( "#dialog-preference" ).dialog({
      height: 400,
      width: 580,
      autoOpen: false,
      modal: true,
      dialogClass: "dialogWithDropShadow",
      buttons: {
        "Restore Defaults": function() {
          $( this ).dialog( "close" );
        },
        "Restore System Defaults": function() {
          $( this ).dialog( "close" );
        },
        Cancel: function() {
          $( this ).dialog( "close" );
        },
        "Save": function() {
          console.log($("#form-pref").serialize());
          $.ajax({
          url: "../save_spreg_p/",
            type: "post",
            data: $("#form-pref").serialize(),
            success: function( data ) {}
          });
        },
      }
    });

    $( "#dialog-spreg-result" ).dialog({
      height: 500,
      width: 800,
      autoOpen: false,
      modal: true,
      dialogClass: "dialogWithDropShadow",
      buttons: {
        "Publish to CartoDB": function() {
          var x = $.GetTextsFromObjs($('#x_box li')),
              y = $.GetTextsFromObjs($('#y_box li')),
              title = "Spatial Regression ("+y+":~"+x+")";
          require(['ui/cartoProxy','ui/mapManager', 'ui/basemap'], function(CartoProxy, MapManager, Basemap) {
            var mapManager = MapManager.getInstance(),
                n_maps = mapManager.GetNumMaps(),
                basemap =  Basemap.getInstance(),
                viz_confs = [];

            for (var i=0; i<n_maps; i++) {
              var mapcanvas = mapManager.GetMapCanvas(i),
                  map = mapcanvas.map,
                  fields = [];

              for (var fld in map.fields)
                fields.push(fld);

              viz_confs.push({
                'map_name' : map.name,
                'map_type' : mapcanvas.shpType,
                'fields' : fields,
                'legend_name' : map.name,
                'legend_field' : mapcanvas.field,
                'legend_txts' : mapcanvas.legend_txts,
                'bins' : mapcanvas.bins,
                'colors' : mapcanvas.colors,
                'stroke_clr' : mapcanvas.STROKE_CLR,
                'fill_clr' : mapcanvas.FILL_CLR,
                'stroke_width' : mapcanvas.STROKE_WIDTH,
                'alpha' : mapcanvas.ALPHA,
              });
            }

            var uid = CartoProxy.GetUID(),
                key = CartoProxy.GetKey();

            $.get("../carto_create_viz/", {
              'carto_uid' : uid,
              'carto_key' : key,
              'title' : title,
              'bounds[]' : basemap.GetBounds(),
              'center[]' : basemap.GetCenter(),
              'zoom' : basemap.GetZoom(),
              'tile_idx' : basemap.GetTileIdx(),
              'viz_confs' : JSON.stringify(viz_confs),
              'viz_type' : 1,
            }).done(function(data){
              console.log(data);
              var viz_name = data.vizname,
                  file_name = viz_name+".txt",
                  txt = $('#txt-spreg-summary').text();
              var formData = new FormData();
              formData.append('csrfmiddlewaretoken', csrftoken);
              formData.append('txt', txt);
              formData.append('file_name', file_name);

              var xhr = new XMLHttpRequest();
              xhr.open("POST", "../publish_spreg_cartodb/");
              xhr.responseType = 'text';
              xhr.onload = function(evt) {
                var data = JSON.parse(xhr.response),
                    user_id = data.user_id;

                var w = window.open(
                  '../../static/cartoviz.html?uid=' + user_id +'&vizname=' + viz_name+'&'+Utils.guid(),
                  "_blank",
                  "width=900, height=700, scrollbars=yes"
                );
              };
              xhr.send(formData);
            });

          });

        },
        Cancel: function() {$( this ).dialog( "close" );},
      }
    });

    var options = { valueNames: ['name'] };
    var varList = new List('vars', options);

    var model_w_el = '#model-weights-plugin',
        kernel_w_el = '#tabs-kernel-weights';

    $( "#dialog-regression" ).dialog({
      dialogClass: "dialogWithDropShadow",
      width: 900,
      height: 600,
      autoOpen: false,
      modal: false,
      open: function(event, ui) {
        $('#tabs-dlg-weights').appendTo(model_w_el);
      },
    });

    function toggleWeightsDiv(el, disable){
      if (disable === undefined || disable === false) {
        $(el).css('opacity', 1);
      } else {
        $(el).css('opacity', 0.2);
      }
    }

    toggleWeightsDiv(model_w_el, true);
    toggleWeightsDiv(kernel_w_el, true);

    var sel_kernel_w_el = $('input:checkbox[name=spreg-check-kernel-w]');
    var sel_model_w_el = $('input:checkbox[name=spreg-check-model-w]');

    sel_model_w_el.click(function(){
      var that = $(this);
      if ($(that).is(':checked')) {
        toggleWeightsDiv(model_w_el);
      } else {
        toggleWeightsDiv(model_w_el, true);
      }
    });
    sel_kernel_w_el.click(function(){
      var that = $(this);
      if ($(that).is(':checked')) {
        toggleWeightsDiv(kernel_w_el);
      } else {
        toggleWeightsDiv(kernel_w_el, true);
      }
    });

    $('#btn-save-predy').button();
    $('#btn-export-predy').button();

    $( "#dlg-save-model" ).dialog({
      dialogClass: "dialogWithDropShadow",
      width: 400,
      height: 200,
      autoOpen: false,
      modal: true,
      buttons: {
        "Save": function() {
          if (gViz && gViz.GetUUID()) {
            var layer_uuid = gViz.GetUUID(),
                //w_list = $.GetValsFromObjs($('#sel-model-w-files :selected')),
                //wk_list = $.GetValsFromObjs($('#sel-kernel-w-files :selected')),
                model_type = $('input:radio[name=model_type]:checked').val(),
                method = $('input:radio[name=method]:checked').val(),
                name = $('#model_name').val(),
                x = $.GetTextsFromObjs($('#x_box li')),
                y = $.GetTextsFromObjs($('#y_box li')),
                ye = $.GetTextsFromObjs($('#ye_box li')),
                h = $.GetTextsFromObjs($('#inst_box li')),
                r = $.GetTextsFromObjs($('#r_box li'));
            //var t = $.GetTextsFromObjs($('#t_box li'));
            var t = [],
                error = [0,0,0];
            $('input:checkbox[name=stderror]').each(function(i,obj){
              if (obj.checked) {
                error[i] = 1;
              }
            });
            params = {
              'uuid': uuid,
              'name': name,
              'w': w_list,
              'wk': wk_list,
              'type': model_type,
              'method': method,
              'error': error,
              'x': x, 'y': y, 'ye': ye, "h": h, "r": r, "t": t
            };
            console.log(params);
            $.post("../save_spreg_model/", params, function() {
            }).done(function(data) {
              console.log(data);
              loadModelNames();
              Utils.ShowMsgBox("","Save model done.");
            });
          }
          $(this).dialog("close");
        },
        Cancel: function() {$( this ).dialog( "close" );},
      }
    });

    $("#dlg-open-model").dialog({
      dialogClass: "dialogWithDropShadow",
      width: 400,
      height: 200,
      autoOpen: false,
      modal: true,
      buttons: {
        "Open": function() {
          var layer_uuid = gViz.GetUUID();
          if (layer_uuid) {
            var model_name = $('#open_spreg_model').val();
            if (model_name) {
              $.get("../load_spreg_model/", {
                'uuid':uuid,'name':model_name
              }, function(){})
              .done(function(data) {
                console.log(data);
                if (data["success"] != 1) {
                  console.log("load spreg model failed.");
                  return;
                }
                resetSpreg();
                $('input[name="model_type"][value='+data['type']+']').prop('checked', true);
                $('input[name="method"][value='+data['method']+']').prop('checked', true);
                var error = data['stderror'];
                $('input:checkbox[name=stderror]').each(function(i,obj){
                  if (error[i] == 1) {
                    $(obj).prop('checked', true);
                  }
                });
                var load_vars = function( vars, box ) {
                  $.each( vars, function(i, v) {
                    if ( v && v.length > 0 ) {
                      if (i == 0) {
                        box.find( ".placeholder" ).remove();
                      }
                      var item = $('#ul-x-variables p').filter(function(i, p){
                        return $(p).text() == v;
                      }).parent().hide();
                      var ctn = box.closest("div").children().first();
                      $( "<li></li>" ).text(v).appendTo(ctn).dblclick(function(){
                        $(this).remove();
                        item.show();
                      });
                    }
                  });
                };
                load_vars( data['y'], $('#y_box') );
                load_vars( data['x'], $('#x_box') );
                load_vars( data['ye'], $('#ye_box') );
                load_vars( data['h'], $('#inst_box') );
                load_vars( data['r'], $('#r_box') );
                //load_vars( data['t'], $('#t_box') );
              });
            }
          }
          $(this).dialog("close");
        },
        Cancel: function() {$( this ).dialog( "close" );},
      },
    });

    function GetKernelWeightsConf() {
      var active = $('#tabs-kernel-weights').tabs("option","active"),
          param = {};
      if (active === 0) {
        var dist_value = "",
            dist_metric = $('#spreg-sel-dist-metr').val(),
            dist_method =$('input:radio[name=spreg-rdo-dist]:checked').attr("id");
        if ( dist_method == 0 ) {
          dist_value = $('#spreg-spn-dist-knn').val();
        } else if ( dist_method == 1 ) {
          dist_value = $('#spreg-txt-dist-thr').val();
        } else if ( dist_method == 2 ) {
          dist_value = $('#spreg-txt-dist-thr').val();
          param['pow_idist'] = parseInt($('#spreg-spn-pow-idst').val());
        }
        param['dist_metric'] = dist_metric;
        param['dist_method'] = dist_method;
        param['dist_value'] = parseFloat(dist_value);
      } else if (active === 1) {
        param['kernel_type'] = $("#spreg-sel-kel-type").val();
        param['kernel_nn'] = parseInt($("#spreg-txt-kel-nn").val());
      }
      param['w_type'] = active +1;
      return param;
    }

    $( "#btn_run" ).button({icons: {primary: "ui-icon-circle-triangle-e",}})
    .click(function() {
      //var w_list = $.GetValsFromObjs($('#sel-model-w-files :selected'));
      //var wk_list = $.GetValsFromObjs($('#sel-kernel-w-files :selected'));
      var model_type = $('input:radio[name=model_type]:checked').val();
      var method = $('input:radio[name=method]:checked').val();
      // y, x, w,
      var x = $.GetTextsFromObjs($('#x_box li'));
      var y = $.GetTextsFromObjs($('#y_box li'))[0];
      var ye = $.GetTextsFromObjs($('#ye_box li'));
      var h = $.GetTextsFromObjs($('#inst_box li'));
      var r = $.GetTextsFromObjs($('#r_box li'));
      //var t = $.GetTextsFromObjs($('#t_box li'));
      var t = [];
      // check error flag
      var error = [0,0,0];
      var conti = true;
      $('input:checkbox[name=stderror]').each(function(i,obj){
        if (obj.checked){
          error[i] = 1;
          if (i==1 && w_list.length==0) {
            Utils.ShowMsgBox("","Please configure a model weights.");
            conti = false;
            return;
          }
          if (i==1 && wk_list.length==0) {
            Utils.ShowMsgBox("","Please configure kernel weights.");
            conti = false;
            return;
          }
        }
      });
      if (conti==false)
        return;
      // run model
      $('#dlg-run').dialog("open").html('<img src="img/loading.gif"/><br/>Loading ...');
      $('#dlg-run').siblings('.ui-dialog-titlebar').hide();
      var map = MapManager.getInstance().GetMap();
      require(['ui/weightsDlg'], function(WeightsDlg) {
        var w_conf = WeightsDlg.getInstance().GetWeightsConfigure();
        w_conf['layer_uuid'] = map.uuid;
        w_conf['csrfmiddlewaretoken'] = csrftoken;
        $.post('../create_weights/', w_conf).done(function(data) {
            console.log(data);
            var wuuid = data['wuuid'];
            var kernel_w_conf = GetKernelWeightsConf();
            var params = {
              'layer_uuid' : map.uuid,
              'carto_uid': CartoProxy.GetUID(),
              'carto_key': CartoProxy.GetKey(),
              'carto_table_name': map.name,
              'is_w' : sel_model_w_el.is(':checked'),
              'is_wk' : sel_kernel_w_el.is(':checked'),
              'wuuid': wuuid,
              'wk': JSON.stringify(kernel_w_conf),
              'type': model_type,
              'method': method,
              'error': error,
              'x': x, 'y': y, 'ye': ye, "h": h, "r": r, "t": t,
              'csrfmiddlewaretoken': csrftoken,
            };
            $.post("../spatial_regression_carto/", params, function() {
              $('#btn_result').hide();
            }).done(function(data) {
              $('#dlg-run').dialog("close");
              try {
                data = JSON.parse(data);
                if (data['success']==1) {
                  $('#btn_result').show();
                  if (data['report']) {
                    var predy = "",
                        summary = "",
                        cnt= 0;
                    $.each(data['report'], function(id, result) {
                      cnt+=1;
                    });
                    cnt = cnt.toString();
                    $.each(data['report'], function(id, result) {
                      var idx = parseInt(id) + 1;
                      summary += "Report " + idx + "/" + cnt +
                        "\n\n"+result['summary'] + "\n\n";
                      predy += "<b>Report " + idx + "/" + cnt +"</b><br/><br/>";
                      predy += "<table border=1 width=100% id='predy" + id +
                        "'><tr><th>Predicted Values</th><th>Residuals</th></tr>";
                      var n = result['predy'][0].length;
                      for ( var i=0; i< n; i++ ) {
                        predy += "<tr><td>" + result['predy'][0][i] + "</td><td>" +
                          result['residuals'][0][i] + "</td></tr>";
                      }
                      predy += "</table><br/><br/>";
                    });
                    $('#txt-spreg-predy').html(predy);
                    $('#txt-spreg-summary').text(summary);
                  }
                  PopupDiv('#btn_result','#divPop','Click this button to see result.');
                }
              } catch (e) {
                console.log(e);
              }
            })
            .fail(function(data){
              $('#dlg-run').dialog("close");
              Utils.ShowMsgBox("Erro","Spatial regression failed.");
            }); // end spatial_regression_carto
          }); // end create_weights
        }); // end require weightsdlg
      });
    return {
      // public methods/vars
      UpdateFields : function(fields) {
        // clean up all box first
        $.each(['#y_box','#y_box','#y_box','#y_box'], function(i, box) {
          if ( !$(box).find(".placeholder")) {
            $(box).find('li').remove().end();
          }
        });
        $('#ul-x-variables').find('li').remove().end();
        // re-fill box with new fields
        for (var field in fields) {
          var typ = fields[field].toLowerCase();
          if (typ === "integer" || typ === "real") {
            var item = $('#ul-x-variables').append('<li><p class="name">'+field+'</p></li>');
          }
        }
        $( "#vars ul li" ).draggable({ helper: "clone" });
        new List('vars', {valueNames:['name']});
      },
    };
  };

  return {
    getInstance : function() {

      if (!instance) {
        instance = init();
      }

      return instance;
    },
  };

})($, Utils);

return SpregDlg;
});
