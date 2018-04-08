'use stirct'

import '@br/lib/zepto.min';
/*
*预加载图片函数
* images 加载图片的数组或对象
* callback 全部图片加载完毕后的回调函数
* timeout 加载超时的时长
*/

function LoadImg(){
	this.init.apply(this,arguments);
}
$.extend(LoadImg.prototype,{
	init:function(images,callback,timeout){
		this.callback = callback;
		this.timeout = timeout;
		this.count = 0;
		this.success = true;
		this.timeout = 0;
		this.istimeout = false;
		this.id = 0;
		this.for(images);
	},
	for:function(images){
		var self = this;
		for(var key in images){
			if(!images.hasOwnProperty(key)){ //过滤原型上的属性
				continue;
			}
			var item = images[key];
			if(typeof(item) === 'string'){
				item =  images[key] = {
					src:item
				};
			}
			//如果格式不满足期望 进行下一次循环
			if(!item || !item.src){
				continue;
			}
			self.timeout++;
			item.id = '__img_'+key + self.getId();
			//设置图片元素的img对象
			item.img = window[item.id] = new Image();
			self.doload(item);
		}
	},
	getId:function(){
		return ++this.id
	},
	doload:function(item){
		console.log(item)
		var self = this;
		item.status = 'loading';
		var img = item.img;
		img.onload =function(){
			self.success = self.success & true;
			item.status = 'loaded';
			done()
		}
		img.onerror =function(){
			self.success = false;
			item.status = 'error';
			done()
		}
		function done(){
			img.onload = img.onerror = 'null';
			try{
				delete window[item.id];
			}catch(e){
				console.log(e)
			}
			if(!--this.count){
				self.callback(success)
			}
		}
	}
})


module.exports = LoadImg;