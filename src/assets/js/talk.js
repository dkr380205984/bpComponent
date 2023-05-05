import flvjs from 'flv.js'
var _talk_tips = {
	'-6': '车辆欠费',
	'-4': '设备没有回应，请稍后再试',
	'-3': '车辆不存在',
	'-2': '系统异常',
	'-1': '设备离线',
	'1' : '设备返回失败',
	'2' : '设备返回消息有误',
	'3' : '设备不支持',
	'13': '对讲被占用',
	'14': '广播被占用',
	'15': '上级平台正在播放',
	'16': '紧急报警正在录像',
	'17': '广播端口分配完毕',
	'20': '该通道正在回放',
	'21': '上级平台正在回放',
	'30': '809成功',
	'31': '809返回失败',
	'32': '809不支持',
	'33': '809会话结束',
	'34': '809时效口令错误',
	'35': '809不满足跨域条件',
	'44': '服务器带宽已满，请稍后再试'
};


function VideoTalk(ip, port, userId, cbs) {
	this.url = (location.protocol == 'https:' ? "wss://" : "ws://") + ip + ":" + port;
	this.userId = userId;
	cbs = cbs || {};
	
	this.audio = document.createElement('audio');
	this.audio.setAttribute('autoplay','autoplay');
	this.audio.style.display = 'none';
	document.body.appendChild(this.audio);
	
	this.socket = new Socket(this.sid = _$uuid(), this.url + "/video");
	this.socket.connect();
	var __that = this;
	this.socket.addListener('talk_open', function(data) {
		if (__that.uuid != data.uuid) return;
		if (data.ret !== 0) {
			__that.player.detachMediaElement(__that.audio);
			__that.player.unload();
			__that.player.destroy();
			__that.player = null;
			return cbs.onTalkFail && cbs.onTalkFail(__that.tmn,__that.chn,_talk_tips[''+data.ret] || '未知异常');
		}
		cbs.onTalkOk && cbs.onTalkOk(__that.tmn,__that.chn);
		
		microphone(__that.url + '/mic_data/' + __that.uuid, 
			function(result) {
				if (result) {
					__that.mic = result;
					cbs.onMicOk && cbs.onMicOk(__that.tmn, __that.chn);
				} else {
					cbs.onMicFail && cbs.onMicFail(__that.tmn, __that.chn, '找不到麦克风')
				}
	        },
	        function(error) { cbs.onMicFail && cbs.onMicFail(__that.tmn, __that.chn, error)}
	    );
	});
}

VideoTalk.prototype = {
	url: null,
	userId: null,
	
	socket: null,
	sid: null,
	
	audio: null,
	player: null,
	mic: null,
	
	tmn: null,
	chn: null,
	uuid: null,
	
	isSuport: function() {
		return flvjs.isSupported();
	},
	
	start: function(tmn, chn) {
		this.stop();
		
		var url = this.url + '/talk_open/' + [this.sid, this.userId, this.uuid = _$uuid(), '_'+(this.tmn = tmn), this.chn = chn, '1'].join('/');
        this.player = flvjs.createPlayer({type: 'flv', isLive:true, hasAudio:true, hasVideo:false, cors:true, url:url}, {enableStashBuffer:false, fixAudioTimestampGap:false});
        this.player.attachMediaElement(this.audio);
        this.player.load();
        this.player.play();
	},
	
	stop: function() {
		this.mic && (this.mic.close(), this.mic = null);
		if (this.player) {
			this.socket.send({cmd:'talk_close', uuid:this.uuid, carId:'_'+this.tmn, channel:this.chn, stream:'1'});
			this.player.detachMediaElement(this.audio);
			this.player.unload();
			this.player.destroy();
			this.player = null;
		}
	},
	
	destroy: function() {
		this.stop();
		this.socket && (this.socket.destroy(), this.socket = null);
		this.audio && document.body.removeChild(this.audio);
		this.audio = null;
	}
}

var _$uuid = function() {
    var S4 = function() {return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)};
    return S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4();
}

function microphone(ws_url, callback, fail) {
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    if (navigator.getUserMedia) {
		return navigator.getUserMedia({audio:true}, function(stream) {
			callback(onMicStream(stream, ws_url));
		}, function(error){ localhost_websocket(ws_url, callback, fail, error.message || error.name)});
	}
	localhost_websocket(ws_url, callback, null, null);
}

function localhost_websocket(ws_url, callback, fail, error) {
	var info = {mic_open:false, ws_open:false};
	info.mic = new WebSocket('ws://localhost:3316');
	info.mic.binaryType = 'arraybuffer';
	info.mic.onopen = function() {
		info.mic_open = true;
		info.ws = new WebSocket(ws_url);
		info.ws.binaryType = 'arraybuffer';
		info.ws.onopen = function() { info.ws_open = true };
		info.ws.onclose = function() { info.ws_open = false };

		callback(info);
	};
	info.mic.onmessage = function(event) { info.ws_open && info.ws.send(event.data)};
	info.mic.onerror = function() { !info.mic_open && (callback(false), error && fail && fail(error))};
	info.close = function() {
		info.ws_open = false;
		info.mic && (info.mic.close(), info.mic = null);
		info.ws && (info.ws.close(), info.ws = null);
	};
}

function onMicStream(stream, ws_url) {
	var info = {};
	info.ws = new WebSocket(ws_url);
	info.ws.binaryType = 'arraybuffer';
	info.ws.onopen = function() {
		info.ws_open = true;
		var context = new AudioContext();
		var audioInput = context.createMediaStreamSource(stream);
		info.recorder = context.createScriptProcessor(0, 1, 1);
		info.recorder.onaudioprocess = function(e) {
			var datas = e.inputBuffer.getChannelData(0);
			datas = waveResampler.resample(datas, context.sampleRate, 8000);
			datas = pcmBit32To16(datas);
			info.ws_open && info.ws.send(datas);
		}
		audioInput.connect(info.recorder);
		info.recorder.connect(context.destination);
	};
	info.ws.onclose = function() {
		info.ws_open = false;
	};
	info.close = function() {
		info.ws_open = false;
		info.recorder && info.recorder.disconnect();
		info.recorder = null;
		info.ws.close();
		info.ws = null;
	};
	return info;
}

function pcmBit32To16(bytes) {
	var offset = 0, data = new DataView(new ArrayBuffer(bytes.length * 2));
	for (var i = 0; i < bytes.length; i++, offset += 2) {
		var s = Math.max(-1, Math.min(1, bytes[i]));
		data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
	}
	return new Blob([data]);
}

function Socket(sid, url, onopen, onclose) {
	this.onopen = onopen;
	this.onclose = onclose;
	this.sid = sid;

    this.url = url;
    this.ws = null;
    
    this.opened = false;
    this.stopped = false;
    
    this.listeners = {};
}

Socket.prototype = {
	connect: function() {
		this.stopped = false;
		this.ws = new WebSocket(this.url);
		this.ws.onopen = this._onopen.bind(this);
		this.ws.onmessage = this._onmessage.bind(this);
		this.ws.onclose = this._onclose.bind(this);
	},
	
	close: function() {
		this.stopped = true;
		this.opened = false;
		this.listeners = {};
		if (this.ws && this.ws.readyState === 1) this.ws.close();
	},
	
	destroy: function() {
		this.close();
		this.ws = null;
		this.onopen = null;
		this.onclose = null;
		this.listeners = null;
	},

	send: function(msg) {
		if (!this.opened || !this.ws || this.ws.readyState != 1) return false;
		this.ws.send((typeof msg === "string") ? msg : JSON.stringify(msg));
		return true;
	},
	
	addListener: function(cmd, callback) {
		this.listeners[cmd] = this.listeners[cmd] || [];
		this.listeners[cmd].push(callback);
	},

	removeListener: function(cmd, callback) {
		var cbs = this.listeners[cmd];
		if (!cbs) return;
		var index = cbs.indexOf(callback);
		if (index == -1) return;
		cbs.splice(index, 1);
		if (cbs.length) return;
		delete this.listeners[cmd];
	},
	
	_onopen: function() {
		if (this.stopped) return this.ws.close();
		this.opened = true;
		this.time = new Date().getTime();
		this._keepalive();
		this.onopen && this.onopen();
	},
	
	_onmessage: function(event) {
		this.time = new Date().getTime();
		event = JSON.parse(event.data);
		var cbs = this.listeners[event.cmd];
		if (cbs) {
			for (var i=0; i<cbs.length; i++) {
				try{cbs[i](event)}catch(error){console.log(error)}
			}
		}
	},
	
	_onclose: function() {
		if (this.opened) {
			this.onclose && this.onclose();
			this.opened = false;
		}
		if (this.keepaliveTimer) {
			clearTimeout(this.keepaliveTimer);
			this.keepaliveTimer = false;
		}
		!this.stopped && this.connect();
	},

	_keepalive: function() {
		if (!this.opened) return;
		if (new Date().getTime() - this.time > 60*1000) {
			console.log("socket超时断开");
			return this.ws && this.ws.close();
		}
		this.send('{"cmd":"keep_alive","sid":"'+this.sid+'"}');
		this.keepaliveTimer = setTimeout(this._keepalive.bind(this), 10000);
	},
}

export default VideoTalk
