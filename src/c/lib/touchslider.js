require('@br/lib/zepto.min');
function Slider() { //定义一个slider方法
    this.init.apply(this, arguments);
}
Slider.prototype = {
    init: function (opt) {
        this._el = opt.el;
        this._sonEvent = opt.son_el;
        this._bottom = opt.bottom;
        this._height = $(window).height();
        this._index = 0;
        this.currClassName = opt.currClassName || 'curr';
        this._callback = opt.callback;
        this.initStyle(); //初始样式 用translate做排序
        this.initEvent();
    },

    initStyle: function (n) {
        n = n ? n : 0;
        var self = this;
        this._item = this._el.find(this._sonEvent); //每一页
        this._item.each(function (i, item) {
            //var i = index != 0 ? index - 1 : index;
            if (n != i) {
                $(item).css({
                    "-webkit-transform": "translate3d(0," + ((n > i) ? -1 * self._height : self._height) + "px,0)",
                    "-webkit-transition": "none"
                });
            } else if (n == i) {
                $(item).addClass(self.currClassName);
                $(item).css({
                    "-webkit-transform": "translate3d(0,0,0)",
                    "-webkit-transition": "none"
                });
            } else{
                $(item).css({
                    "-webkit-transform": "translate3d(0," + i * self._height + "px,0)",
                    "-webkit-transition": "none"
                });
            }
        });
    },

    initEvent: function () {
        var that = this;

        window.addEventListener('resize', function () {
            var _index = that._el.find('.'+that.currClassName).index();
            that._height = $(window).height();
            that.initStyle(_index-1);
        }, false);

        this._item.on("touchstart", function (e) {
            e.preventDefault();
            this._startY = e.touches[0].screenY;
        });

        this._item.on("touchmove", function (e) {
            e.preventDefault();
            this._offsetY = e.touches[0].screenY - this._startY;//移动的距离
            var h = that._height;
            if (navigator.userAgent.indexOf('UCBrowser') > -1) {
                return false;
            };

            if (that._index == 0) {
                if (this._offsetY < 0) {
                    that._bottom.fadeOut(150);
                } else {
                    return false;
                }
                ;
            } else if (that._index == (that._item.length - 1)) {
                if (this._offsetY > 0) {
                    that._bottom.fadeOut(150);
                } else {
                    return false;
                }
                ;
            } else {
                that._bottom.fadeOut(150);
            }
            ;
        });
        this._item.on("touchend", function (e) {
            e.preventDefault();
            var offsetY = this._offsetY;
            if (offsetY < -44) {
                that._start("+1", e.type)
            } else if (offsetY > 44) {
                that._start("-1", e.type);
            }
            ;
            if (navigator.userAgent.indexOf('UCBrowser') > -1) {
                return false;
            }
            ;
            if (that._index == 0 || that._index == (that._item.length - 1)) {
                setTimeout(function () {
                    that._bottom.show()
                }, 500);
            } else {
                setTimeout(function () {
                    that._bottom.show(150)
                }, 500);
            }
            ;
        });
    },

    _start: function (num, type) {
        var nowIndex = 0,
            index = this._index,
            item = this._item,
            h = this._height,
            len = item.length;
        if (typeof (num) == "number") {
            nowIndex = num;
        } else if (typeof (num) == "string") {
            nowIndex = index + num * 1;
        }
        if (nowIndex < 0) {
            nowIndex = 0;
        } else if (nowIndex > len - 1) {
            nowIndex = len - 1;
        }

        this._setStyleByItem(item, nowIndex);
        this._index = nowIndex;
        this._callback && this._callback(nowIndex);
    },


    _setStyleByItem: function (item, index) {
        var h = this._height;
        $(item[index]) && $(item[index]).addClass(this.currClassName).siblings().removeClass(this.currClassName);
        if (navigator.userAgent.indexOf('UCBrowser') > -1) { //适配uc浏览器 uc transition出bug
            $(item[index]) && $(item[index]).css({
                "-webkit-transform": "translate3d(0,0,0)"
            });
            $(item[index + 1]) && $(item[index + 1]).css({
                "-webkit-transform": "translate3d(0," + h + "px,0)"
            });
            $(item[index - 1]) && $(item[index - 1]).css({
                "-webkit-transform": "translate3d(0," + (-h) + "px,0)"
            });
        } else {
            $(item[index]) && $(item[index]).css({
                "-webkit-transition": "-webkit-transform .6s",
                "-webkit-transform": "translate3d(0,0,0)"
            });
            $(item[index + 1]) && $(item[index + 1]).css({
                "-webkit-transition": "-webkit-transform .6s",
                "-webkit-transform": "translate3d(0," + h + "px,0)"
            });
            $(item[index - 1]) && $(item[index - 1]).css({
                "-webkit-transition": "-webkit-transform .6s",
                "-webkit-transform": "translate3d(0," + (-h) + "px,0)"
            });
        }
    }
}

module.exports = Slider;

