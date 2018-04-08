/**
 * 链接处理工具
 * @author dezhao
 */
'use strict';

function Index() {
    this.init.apply(this, arguments);
}

Index.prototype = {
    isApp: window.BrBridge && window.BrBridge.env.isApp,
    init: function (url) {
        this.url = url ? url : window.location.href;
        this.host = this.strip();
        return this
    },

    /*
     * 获取当前页面URL地址传递的参数
     * 返回结果：{a:1, b:2, c:3}
     * */
    query: function (url) {
        var _url = url ? url : this.url;
        if (_url.indexOf('?') != -1) {
            var qsobj = {};
            var thisqs = _url.split('?')[1];
            if (thisqs) {
                thisqs = thisqs.replace(/#/g, '');
                var pairs = thisqs.split('&');
                for (var i = 0; i < pairs.length; i++) {
                    var pair = pairs[i].split('=');
                    qsobj[pair[0]] = pair[1];
                }
            }
            return qsobj;
        } else {
            return null;
        }
    },

    /*
     * 返回链接?号前的部分
     * */
    strip: function () {
        if (this.url.indexOf('?') != -1) {
            return this.url.split('?')[0];
        } else {
            return this.url;
        }
    },

    /*
     * 获取对于key的值
     * 例如: http://www.100credit.com/index.html?a=1&b=2&c=3
     * url.get(a); //返回结果: 1
     * */
    get: function (key) {
        var qsobj = this.query(this.url);
        if (qsobj) {
            return qsobj[key] || null;
        } else {
            return null;
        }
    },

    go: function (url, type, isRefresh) {
        var args = arguments;
        var data = {}, url, type, isRefresh;
        if (typeof args[0] != 'string') {
            data = args[0];
            type = data.type;
            isRefresh = data.isRefresh == true ? data.isRefresh : false;
            url = BrSPM ? this.formatUrlBySPM(data.url) : data.url;
        } else {
            url = BrSPM ? this.formatUrlBySPM(args[0]) : args[0];
            type = args[1] || 'openWindow';
            isRefresh = args[2] && args[2] == true ? args[2] : false;
        }

        if (this.isApp) {
            window.BrBridge.call('Common', type, {
                url: url,
                refresh: isRefresh
            }, function () {
                //alert('openWindow:' + url);
            }, function () {

            });
        } else {
            window.location.href = url;
        }
    },

    //关闭当前界面, rootindow下会退出程序
    closeWindow: function () {
        if (this.isApp) {
            window.BrBridge.call('Common', 'closeWindow', {}, function (data) {
                console.log('closeWindow');
            }, function (error) {
                console.log(error);
            });
        } else {
            window.history.back();
        }
    },

    //格式化链接为埋点链接
    formatUrlBySPM: function (url) {
        var BrSPM = window.BrSPM || BrSPM;
        if (BrSPM || url.indexOf('spm=') == -1) {
            var str = url.indexOf('?') != -1 ? '&' : '?';
            return url + str + 'spm=' + BrSPM.SPM_ID + '.0.0';
        } else {
            return url;
        }
    }
};

module.exports = Index;