require('@br/lib/zepto.min');
var Toast = require('@br/common/toast/');
var Promise = require('@br/lib/promise');

var SHARE_URL = window.location.href;
var CONFIG_API = 'https://wechat.xiaqiu.cn/wechatshare/weChat/signature.do';
var TOAST_TIME = 2000;

function WXShare() {
    this.init.apply(this, arguments);
}

$.extend(WXShare.prototype, {
    init: function (config) {
        this.VERSION = '0.0.1';
        if (config.api) {
            CONFIG_API = config.api;
        }
        if (window.wx) {
            this.getToken(); //页面分享
            this.events();
        } else {
            console.log('非微信环境');
        }
    },

    events: function () {
        var self = this;
        wx.error(function (res) {
            //alert(JSON.stringify(res));
        });

    },

    getToken: function () {
        var self = this;
        $.ajax({
            url: CONFIG_API,
            data: {
                url: SHARE_URL
            },
            type: 'get',
            dataType: 'jsonp',
            success: function (data) {
                if (data.code == 0) {
                    self.wxConfig(data);
                } else {
                    //new Toast('位置错误:' + data.code, TOAST_TIME);
                }
            },
            error: function () {
                console.log('error');
            }
        });
    },

    wxConfig: function (data) {
        wx.config({
            debug: false,
            appId: data.appid,
            timestamp: Number(data.timestamp),
            nonceStr: data.noncestr,
            signature: data.signature,
            jsApiList: [
                'onMenuShareTimeline',
                'onMenuShareAppMessage'
            ]
        });
    },

    bindShare: function (config) {
        var p = new Promise();
        var _data = {
            link: SHARE_URL, // 分享链接
            title: config.title, // 分享标题
            desc: config.desc, // 分享描述
            imgUrl: config.imgUrl, // 分享图标
            success: function (res) {
                p.resolve(res);
                // new Toast('分享成功', TOAST_TIME);
            },
            cancel: function (res) {
                p.reject(res);
                // new Toast('取消了分享', TOAST_TIME);
            }
        };
        wx.ready(function () {
            wx.onMenuShareTimeline(_data);
            wx.onMenuShareAppMessage(_data);
        });
        return p;
    }
});

module.exports = WXShare;