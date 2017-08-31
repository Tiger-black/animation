require('./index.less');
var tpl = require('./index.ejs');

function Index() {
    this.init.apply(this, arguments);
}

Index.prototype = {
    init: function (config) {
        //传入渲染的包裹层
        this.el = config.el;
        //渲染
        this.render()
    },

    render: function () {
        var _html = tpl({
            title: 'Hello World'
        });
        this.el[0].innerHTML = _html
    }
};

module.exports = Index;