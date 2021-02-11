var timeout = 1000;
var timer = '';

$(function() {
  var gId = '';
  var cId = '';

  // Create Game
  $('#createGame').click(function() {
    $('#message').empty();
    $.ajax('create' + '/' + $('#cName_inp').val(),
      {
        type: 'get',
      }
    )
    .done(function(data) {
      $('#cName_inp').prop('readonly', true);
      $('#gId_inp').prop('readonly', true);
      $('#joinGame').prop('disabled', true);
      $('#createGame').prop('disabled', true);
      $('#gId').text(data);
      $('#cId').text(data);
      $('#cName').text($('#cName_inp').val());
      $('#gStatus').text('waiting');
      gId = data;
      cId = data;
      $('#sec1').show();
      timer = setTimeout(status_check(gId, cId), timeout)
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

  // Join Game
  $('#joinGame').click(function() {
    $('#message').empty();
    $.ajax($('#gId_inp').val() + '/join/' + $('#cName_inp').val(),
      {
        type: 'get',
      }
    )
    .done(function(data) {
      $('#cName_inp').prop('readonly', true);
      $('#gId_inp').prop('readonly', true);
      $('#joinGame').prop('disabled', true);
      $('#createGame').prop('disabled', true);
      _tmp = data.split(' ,');
      $('#cId').text(_tmp[0]);
      $('#cName').text(_tmp[1]);
      $('#gStatus').text(_tmp[2]);
      gId = $('#gId_inp').val();
      cId = _tmp[0];
      timer = setTimeout(status_check(gId, cId), timeout)
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

  // Start Game
  $('#startGame').click(function() {
    $('#message').empty();
    $.ajax(gId + '/start',
      {
        type: 'get',
      }
    )
    .done(function(data) {
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

  // election
  $('#election').click(function() {
    $('#message').empty();
    $.ajax(gId + '/choice/' + $('#candidatelist').val(),
      {
        type: 'get',
      }
    )
    .done(function(data) {
      if(data == 'ok'){
        $('#election').attr('disabled', true);
      }else{
        $('#message').text("エラーが発生しました");
      }
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

  // expedition
  $('#expedition').click(function() {
    $('#message').empty();
    $.ajax(gId + '/expedition',
      {
        type: 'get',
      }
    )
    .done(function(data) {
      $('#expedition').attr('disabled', true);
      if(data == 'retry'){
        $('#sec3').css('display', 'none');
      }
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

  // approval
  $('#approval').click(function() {
    $('#message').empty();
    $.ajax(gId + '/vote/0',
      {
        type: 'get',
      }
    )
    .done(function(data) {
      $('#approval').attr('disabled', true);
      $('#reject').attr('disabled', true);
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

  // reject
  $('#reject').click(function() {
    $('#message').empty();
    $.ajax(gId + '/vote/1',
      {
        type: 'get',
      }
    )
    .done(function(data) {
      $('#approval').attr('disabled', true);
      $('#reject').attr('disabled', true);
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

  // successed
  $('#successed').click(function() {
    $('#message').empty();
    $.ajax(gId + '/vote/0',
      {
        type: 'get',
      }
    )
    .done(function(data) {
      $('#successed').attr('disabled', true);
      $('#failed').attr('disabled', true);
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

  // failed
  $('#failed').click(function() {
    $('#message').empty();
    $.ajax(gId + '/vote/1',
      {
        type: 'get',
      }
    )
    .done(function(data) {
      $('#successed').attr('disabled', true);
      $('#failed').attr('disabled', true);
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

  // result
  $('#result').click(function() {
    $('#message').empty();
    $.ajax(gId + '/successedorfailed',
      {
        type: 'get',
      }
    )
    .done(function(data) {
      $('#result').attr('disabled', true);
      $('#sec3').css('display', 'none');
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
  });

});

var status_check = function(gId, cId){
  setTimeout(function(){
    $('#message').empty();
    // all status
    $.getJSON(gId + '/status',
      {
        type: 'get',
      }
    )
    .done(function(data) {
      console.log(data)
      $('#gStatus').text(data.status);
      playerPos = 0;
      // Applying List
      $('#applyingList').empty();
      for(var pIdx in data.players){
        // console.log(data.players[pIdx])
        $('#applyingList').append(data.players[pIdx].nickname + '(' + data.players[pIdx].playerid + ')' + ',');
        if(cId == data.players[pIdx].playerid){
          playerPos = pIdx;
        }
      }

      switch(data.status){
        case 'waiting':
          break;
        case 'started':
          $("#stage").text("<Choose>");
          $('#evils').empty();
          $('#approval').attr('disabled', false);
          $('#reject').attr('disabled', false);
          $('#successed').attr('disabled', false);
          $('#failed').attr('disabled', false);
          $('#sec4').css('display', 'none');
          $('#sec5').css('display', 'none');
          $('#election').attr('disabled', false);
          $('#expedition').attr('disabled', false);
          $('#result').attr('disabled', false);

          switch(data.players[playerPos].role){
            case 0:
              $('#role').text('merlin');
              $('#sec6').show();
              break;
            case 1:
              $('#role').text('assasin');
              $('#sec6').show();
              break;
            case 2:
              $('#role').text('servants of Arthur');
              break;
            case 3:
              $('#role').text('servants of Mordred');
              $('#sec6').show();
              break;
          }
          $('#evils').text('Servants of Mordred members:');
          for(var mIdx in data.mordreds){
            $('#evils').append('<br/>' + data.mordreds[mIdx].nickname);
          }

          if(jQuery.trim($('#candidatelist').text()) == ''){
            for(var pIdx in data.players){
              $('#candidatelist').append('<option value="'+data.players[pIdx].playerid+'">'+data.players[pIdx].nickname+'</option>');
            }
          }

          $('#sec2').show();

          if(data.routelist[data.routeidx].playerid == cId){
            $('#sec3').show();
          }

          iii = 0
          for(var limit of data.gameboard){
            $('#turn' + iii + '_label').text('Quest ' + (iii+1) + '(' + limit + ')');
            iii++;
          }

          // $('#turn' + 1).text('●');
          if(data.results.length > 0){
            for(var rIdx in data.results){
              if(data.results[rIdx] == 'successed'){
                $('#turn' + rIdx).text('●Successed');
                $('#turn' + rIdx).css("color","blue");
              }else{
                $('#turn' + rIdx).text('●Failed');
                $('#turn' + rIdx).css("color","red");
              }
            }
          }else{
            for(var rIdx; rIdx < 5; rIdx++){
              $('#turn' + rIdx).empty();
            }
          }

          break;

        case 'candidate':
          $("#stage").text("<Choose> -> <Election>");
          $('#candidatelists').empty();
          for(var cIdx in data.selectedcandidates){
            $('#candidatelists').append(data.selectedcandidates[cIdx].nickname + '<br/>');
          }

          $('#sec4').show();
          break;

        case 'expedition':
          $("#stage").text("<Election> -> <Expedition> -> <Expedition>");
          for(var cIdx in data.selectedcandidates){
            if(cId == data.selectedcandidates[cIdx].playerid){
              $('#sec5').show();
            }
            if(data.players[playerPos].role % 2 == 0){
              $('#failed').attr('disabled', true);
            }
          }
          break;
        case 'end':
          for(var rIdx in data.results){
            if(data.results[rIdx] == 'successed'){
              $('#turn' + rIdx).text('●Successed');
              $('#turn' + rIdx).css("color","blue");
            }else{
              $('#turn' + rIdx).text('●Failed');
              $('#turn' + rIdx).css("color","red");
            }
          }
          $('#sec6').show();
          break;
      }
    })
    .fail(function() {
      $('#message').text('エラーが発生しました');
    });
    timer = setTimeout(status_check(gId, cId), timeout)
  }, timeout);
}
