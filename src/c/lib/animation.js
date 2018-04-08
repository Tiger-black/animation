'use stirct'

import '@br/lib/zepto.min';
import loadImg from '@br/lib/loadImg';


var STATE_INITIAL = 0;	//初始状态
var STATE_START = 1;	//开始状态
var STATE_STOP = 2;		//结束状态
var IMG =['http://img.shuqucdn.com/group1/M00/00/03/wKgX2Vl-mlKAV1E9AACx_yF-P5M392.png','http://img.shuqucdn.com/group1/M00/00/03/wKgX2VmMDG-ADYO2AAFEl0f1rDs806.png','http://img.shuqucdn.com/group1/M00/00/03/wKgX2FlcUTuAFfuhABHyPzsHJog514.png']

function Animation(){
	this.init.apply(this,arguments);
}
$.extend(Animation.prototype,{
	init:function(){
		this.taskQueue = [];
		this.index = 0;
		this.state = STATE_INITIAL;
		this.loadImg(IMG);
	},
	loadImg:function(imgList){
		new loadImg(imgList,function(){
			alert(1)
		},6000)
	}
})


new Animation();