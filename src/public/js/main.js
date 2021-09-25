new ClipboardJS('.btn');

var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '360',
        width: '640',
        videoId: '-tKVN2mAKRI',
        events: {
            'onReady': onPlayerReady,
        },
    });
}

var following;
if (location.search.match('follow=[A-z0-9-]+')) {
    following = location.search.match('follow=[A-z0-9-]+')[0].split('=')[1];
} else {
    $('#playList').css('max-height', '190px');
    $('#inviteLinkGroup').removeAttr('hidden');
    $('#newMediaGroup').removeAttr('hidden');
    $('.delete-media-buttons').removeAttr('hidden');
}

var playList = [
    'https://youtu.be/-tKVN2mAKRI',
];
var playListSelectedIndex = 0;

var _samplePlayListItem = $('.play-list-item').clone();
function refreshPlayList() {
    $('#playList').empty();
    for (var i = 0; i < playList.length; i++) {
        var item = _samplePlayListItem.clone();
        if (i === playListSelectedIndex) {
            item.addClass('list-group-item-secondary');
        }
        item.children('div').children('span').text(playList[i]);
        item.removeAttr('hidden');
        $('#playList').append(item);
    }
}
refreshPlayList();

$('#addNewMedia').click(function () {
    var url = $('#newMediaUrl').val();
    if (url.match('youtube.com/watch\\?v=[A-z0-9-]+')) {
        playList[0] = 'https://youtu.be/' + url.split('watch?v=')[1];
    }
    if (url.match('youtu.be/[A-z0-9-]+')) {
        playList[0] = 'https://youtu.be/' + url.split('youtu.be/')[1];
    }
    $('#newMediaUrl').val('');
    refreshPlayList();

    player.loadVideoById(playList[0].split('youtu.be/')[1]);
});

var socket = io();

socket.on('connect', function () {
    $('#inviteLink').val(location.origin + '?follow=' + socket.id);
    $('#copyInviteLinkButton').removeAttr('disabled');
});


function onPlayerReady(event) {
    if (following) {
        var toloranceLevel = 0;

        function sync() {
            var startTime = Date.now();
            socket.emit('sync', following, function (room) {
                if (player.getVideoData().video_id != room.media) {
                    player.loadVideoById(room.media);
                }
                if (player.getPlaybackRate() != room.speed) {
                    player.setPlaybackRate(room.speed);
                }

                if (room.state == YT.PlayerState.PLAYING) {
                    var offset = (Date.now() - startTime) / 2000;
                    var timeDelta = player.getCurrentTime() - (room.progress + offset);
                    if (Math.abs(timeDelta) > 0.05 * (toloranceLevel + 1)) {
                        toloranceLevel = 0;
                        player.seekTo(room.progress + offset + 0.18);   // 0.18 is a hardcoded offset
                        console.log('seek!');
                    } else {
                        toloranceLevel++;
                        if (toloranceLevel > 19) {
                            toloranceLevel = 19;
                        }
                    }
                }
                if (player.getPlayerState() != room.state) {
                    if (room.state == YT.PlayerState.PLAYING) {
                        player.playVideo();
                    }
                    if (room.state == YT.PlayerState.PAUSED) {
                        player.pauseVideo();
                    }
                }
                console.log('progress:', room.progress, 'offset:', offset, 'timeDelta:', timeDelta);

                setTimeout(function () { sync(); }, 1000);
            });
        }
        sync();
    } else {
        socket.emit('host');

        socket.on('update', function (callback) {
            const room = {
                media: player.getVideoData().video_id,
                state: player.getPlayerState(),
                speed: player.getPlaybackRate(),
                progress: player.getCurrentTime(),
            };
            callback(room);
        });
    }
}
