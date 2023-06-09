(function() {
   //==================== Init =============================
    const GITHUB_PAGE = "TBA"
    const VERSION = "1.5";
    const ID_PREFIX = "animate-plugin";
    const GITHUB_ID = "T"
    console.log('%s Version: %s', ID_PREFIX, VERSION);

    /* HELPER FUNCTIONS */
    // gif.worker.js 0.2.0 - https://github.com/jnordberg/gif.js
    const gifWorkerScript = `(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){var NeuQuant=require("./TypedNeuQuant.js");var LZWEncoder=require("./LZWEncoder.js");function ByteArray(){this.page=-1;this.pages=[];this.newPage()}ByteArray.pageSize=4096;ByteArray.charMap={};for(var i=0;i<256;i++)ByteArray.charMap[i]=String.fromCharCode(i);ByteArray.prototype.newPage=function(){this.pages[++this.page]=new Uint8Array(ByteArray.pageSize);this.cursor=0};ByteArray.prototype.getData=function(){var rv="";for(var p=0;p<this.pages.length;p++){for(var i=0;i<ByteArray.pageSize;i++){rv+=ByteArray.charMap[this.pages[p][i]]}}return rv};ByteArray.prototype.writeByte=function(val){if(this.cursor>=ByteArray.pageSize)this.newPage();this.pages[this.page][this.cursor++]=val};ByteArray.prototype.writeUTFBytes=function(string){for(var l=string.length,i=0;i<l;i++)this.writeByte(string.charCodeAt(i))};ByteArray.prototype.writeBytes=function(array,offset,length){for(var l=length||array.length,i=offset||0;i<l;i++)this.writeByte(array[i])};function GIFEncoder(width,height){this.width=~~width;this.height=~~height;this.transparent=null;this.transIndex=0;this.repeat=-1;this.delay=0;this.image=null;this.pixels=null;this.indexedPixels=null;this.colorDepth=null;this.colorTab=null;this.neuQuant=null;this.usedEntry=new Array;this.palSize=7;this.dispose=-1;this.firstFrame=true;this.sample=10;this.dither=false;this.globalPalette=false;this.out=new ByteArray}GIFEncoder.prototype.setDelay=function(milliseconds){this.delay=Math.round(milliseconds/10)};GIFEncoder.prototype.setFrameRate=function(fps){this.delay=Math.round(100/fps)};GIFEncoder.prototype.setDispose=function(disposalCode){if(disposalCode>=0)this.dispose=disposalCode};GIFEncoder.prototype.setRepeat=function(repeat){this.repeat=repeat};GIFEncoder.prototype.setTransparent=function(color){this.transparent=color};GIFEncoder.prototype.addFrame=function(imageData){this.image=imageData;this.colorTab=this.globalPalette&&this.globalPalette.slice?this.globalPalette:null;this.getImagePixels();this.analyzePixels();if(this.globalPalette===true)this.globalPalette=this.colorTab;if(this.firstFrame){this.writeLSD();this.writePalette();if(this.repeat>=0){this.writeNetscapeExt()}}this.writeGraphicCtrlExt();this.writeImageDesc();if(!this.firstFrame&&!this.globalPalette)this.writePalette();this.writePixels();this.firstFrame=false};GIFEncoder.prototype.finish=function(){this.out.writeByte(59)};GIFEncoder.prototype.setQuality=function(quality){if(quality<1)quality=1;this.sample=quality};GIFEncoder.prototype.setDither=function(dither){if(dither===true)dither="FloydSteinberg";this.dither=dither};GIFEncoder.prototype.setGlobalPalette=function(palette){this.globalPalette=palette};GIFEncoder.prototype.getGlobalPalette=function(){return this.globalPalette&&this.globalPalette.slice&&this.globalPalette.slice(0)||this.globalPalette};GIFEncoder.prototype.writeHeader=function(){this.out.writeUTFBytes("GIF89a")};GIFEncoder.prototype.analyzePixels=function(){if(!this.colorTab){this.neuQuant=new NeuQuant(this.pixels,this.sample);this.neuQuant.buildColormap();this.colorTab=this.neuQuant.getColormap()}if(this.dither){this.ditherPixels(this.dither.replace("-serpentine",""),this.dither.match(/-serpentine/)!==null)}else{this.indexPixels()}this.pixels=null;this.colorDepth=8;this.palSize=7;if(this.transparent!==null){this.transIndex=this.findClosest(this.transparent,true)}};GIFEncoder.prototype.indexPixels=function(imgq){var nPix=this.pixels.length/3;this.indexedPixels=new Uint8Array(nPix);var k=0;for(var j=0;j<nPix;j++){var index=this.findClosestRGB(this.pixels[k++]&255,this.pixels[k++]&255,this.pixels[k++]&255);this.usedEntry[index]=true;this.indexedPixels[j]=index}};GIFEncoder.prototype.ditherPixels=function(kernel,serpentine){var kernels={FalseFloydSteinberg:[[3/8,1,0],[3/8,0,1],[2/8,1,1]],FloydSteinberg:[[7/16,1,0],[3/16,-1,1],[5/16,0,1],[1/16,1,1]],Stucki:[[8/42,1,0],[4/42,2,0],[2/42,-2,1],[4/42,-1,1],[8/42,0,1],[4/42,1,1],[2/42,2,1],[1/42,-2,2],[2/42,-1,2],[4/42,0,2],[2/42,1,2],[1/42,2,2]],Atkinson:[[1/8,1,0],[1/8,2,0],[1/8,-1,1],[1/8,0,1],[1/8,1,1],[1/8,0,2]]};if(!kernel||!kernels[kernel]){throw"Unknown dithering kernel: "+kernel}var ds=kernels[kernel];var index=0,height=this.height,width=this.width,data=this.pixels;var direction=serpentine?-1:1;this.indexedPixels=new Uint8Array(this.pixels.length/3);for(var y=0;y<height;y++){if(serpentine)direction=direction*-1;for(var x=direction==1?0:width-1,xend=direction==1?width:0;x!==xend;x+=direction){index=y*width+x;var idx=index*3;var r1=data[idx];var g1=data[idx+1];var b1=data[idx+2];idx=this.findClosestRGB(r1,g1,b1);this.usedEntry[idx]=true;this.indexedPixels[index]=idx;idx*=3;var r2=this.colorTab[idx];var g2=this.colorTab[idx+1];var b2=this.colorTab[idx+2];var er=r1-r2;var eg=g1-g2;var eb=b1-b2;for(var i=direction==1?0:ds.length-1,end=direction==1?ds.length:0;i!==end;i+=direction){var x1=ds[i][1];var y1=ds[i][2];if(x1+x>=0&&x1+x<width&&y1+y>=0&&y1+y<height){var d=ds[i][0];idx=index+x1+y1*width;idx*=3;data[idx]=Math.max(0,Math.min(255,data[idx]+er*d));data[idx+1]=Math.max(0,Math.min(255,data[idx+1]+eg*d));data[idx+2]=Math.max(0,Math.min(255,data[idx+2]+eb*d))}}}}};GIFEncoder.prototype.findClosest=function(c,used){return this.findClosestRGB((c&16711680)>>16,(c&65280)>>8,c&255,used)};GIFEncoder.prototype.findClosestRGB=function(r,g,b,used){if(this.colorTab===null)return-1;if(this.neuQuant&&!used){return this.neuQuant.lookupRGB(r,g,b)}var c=b|g<<8|r<<16;var minpos=0;var dmin=256*256*256;var len=this.colorTab.length;for(var i=0,index=0;i<len;index++){var dr=r-(this.colorTab[i++]&255);var dg=g-(this.colorTab[i++]&255);var db=b-(this.colorTab[i++]&255);var d=dr*dr+dg*dg+db*db;if((!used||this.usedEntry[index])&&d<dmin){dmin=d;minpos=index}}return minpos};GIFEncoder.prototype.getImagePixels=function(){var w=this.width;var h=this.height;this.pixels=new Uint8Array(w*h*3);var data=this.image;var srcPos=0;var count=0;for(var i=0;i<h;i++){for(var j=0;j<w;j++){this.pixels[count++]=data[srcPos++];this.pixels[count++]=data[srcPos++];this.pixels[count++]=data[srcPos++];srcPos++}}};GIFEncoder.prototype.writeGraphicCtrlExt=function(){this.out.writeByte(33);this.out.writeByte(249);this.out.writeByte(4);var transp,disp;if(this.transparent===null){transp=0;disp=0}else{transp=1;disp=2}if(this.dispose>=0){disp=dispose&7}disp<<=2;this.out.writeByte(0|disp|0|transp);this.writeShort(this.delay);this.out.writeByte(this.transIndex);this.out.writeByte(0)};GIFEncoder.prototype.writeImageDesc=function(){this.out.writeByte(44);this.writeShort(0);this.writeShort(0);this.writeShort(this.width);this.writeShort(this.height);if(this.firstFrame||this.globalPalette){this.out.writeByte(0)}else{this.out.writeByte(128|0|0|0|this.palSize)}};GIFEncoder.prototype.writeLSD=function(){this.writeShort(this.width);this.writeShort(this.height);this.out.writeByte(128|112|0|this.palSize);this.out.writeByte(0);this.out.writeByte(0)};GIFEncoder.prototype.writeNetscapeExt=function(){this.out.writeByte(33);this.out.writeByte(255);this.out.writeByte(11);this.out.writeUTFBytes("NETSCAPE2.0");this.out.writeByte(3);this.out.writeByte(1);this.writeShort(this.repeat);this.out.writeByte(0)};GIFEncoder.prototype.writePalette=function(){this.out.writeBytes(this.colorTab);var n=3*256-this.colorTab.length;for(var i=0;i<n;i++)this.out.writeByte(0)};GIFEncoder.prototype.writeShort=function(pValue){this.out.writeByte(pValue&255);this.out.writeByte(pValue>>8&255)};GIFEncoder.prototype.writePixels=function(){var enc=new LZWEncoder(this.width,this.height,this.indexedPixels,this.colorDepth);enc.encode(this.out)};GIFEncoder.prototype.stream=function(){return this.out};module.exports=GIFEncoder},{"./LZWEncoder.js":2,"./TypedNeuQuant.js":3}],2:[function(require,module,exports){var EOF=-1;var BITS=12;var HSIZE=5003;var masks=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535];function LZWEncoder(width,height,pixels,colorDepth){var initCodeSize=Math.max(2,colorDepth);var accum=new Uint8Array(256);var htab=new Int32Array(HSIZE);var codetab=new Int32Array(HSIZE);var cur_accum,cur_bits=0;var a_count;var free_ent=0;var maxcode;var clear_flg=false;var g_init_bits,ClearCode,EOFCode;function char_out(c,outs){accum[a_count++]=c;if(a_count>=254)flush_char(outs)}function cl_block(outs){cl_hash(HSIZE);free_ent=ClearCode+2;clear_flg=true;output(ClearCode,outs)}function cl_hash(hsize){for(var i=0;i<hsize;++i)htab[i]=-1}function compress(init_bits,outs){var fcode,c,i,ent,disp,hsize_reg,hshift;g_init_bits=init_bits;clear_flg=false;n_bits=g_init_bits;maxcode=MAXCODE(n_bits);ClearCode=1<<init_bits-1;EOFCode=ClearCode+1;free_ent=ClearCode+2;a_count=0;ent=nextPixel();hshift=0;for(fcode=HSIZE;fcode<65536;fcode*=2)++hshift;hshift=8-hshift;hsize_reg=HSIZE;cl_hash(hsize_reg);output(ClearCode,outs);outer_loop:while((c=nextPixel())!=EOF){fcode=(c<<BITS)+ent;i=c<<hshift^ent;if(htab[i]===fcode){ent=codetab[i];continue}else if(htab[i]>=0){disp=hsize_reg-i;if(i===0)disp=1;do{if((i-=disp)<0)i+=hsize_reg;if(htab[i]===fcode){ent=codetab[i];continue outer_loop}}while(htab[i]>=0)}output(ent,outs);ent=c;if(free_ent<1<<BITS){codetab[i]=free_ent++;htab[i]=fcode}else{cl_block(outs)}}output(ent,outs);output(EOFCode,outs)}function encode(outs){outs.writeByte(initCodeSize);remaining=width*height;curPixel=0;compress(initCodeSize+1,outs);outs.writeByte(0)}function flush_char(outs){if(a_count>0){outs.writeByte(a_count);outs.writeBytes(accum,0,a_count);a_count=0}}function MAXCODE(n_bits){return(1<<n_bits)-1}function nextPixel(){if(remaining===0)return EOF;--remaining;var pix=pixels[curPixel++];return pix&255}function output(code,outs){cur_accum&=masks[cur_bits];if(cur_bits>0)cur_accum|=code<<cur_bits;else cur_accum=code;cur_bits+=n_bits;while(cur_bits>=8){char_out(cur_accum&255,outs);cur_accum>>=8;cur_bits-=8}if(free_ent>maxcode||clear_flg){if(clear_flg){maxcode=MAXCODE(n_bits=g_init_bits);clear_flg=false}else{++n_bits;if(n_bits==BITS)maxcode=1<<BITS;else maxcode=MAXCODE(n_bits)}}if(code==EOFCode){while(cur_bits>0){char_out(cur_accum&255,outs);cur_accum>>=8;cur_bits-=8}flush_char(outs)}}this.encode=encode}module.exports=LZWEncoder},{}],3:[function(require,module,exports){var ncycles=100;var netsize=256;var maxnetpos=netsize-1;var netbiasshift=4;var intbiasshift=16;var intbias=1<<intbiasshift;var gammashift=10;var gamma=1<<gammashift;var betashift=10;var beta=intbias>>betashift;var betagamma=intbias<<gammashift-betashift;var initrad=netsize>>3;var radiusbiasshift=6;var radiusbias=1<<radiusbiasshift;var initradius=initrad*radiusbias;var radiusdec=30;var alphabiasshift=10;var initalpha=1<<alphabiasshift;var alphadec;var radbiasshift=8;var radbias=1<<radbiasshift;var alpharadbshift=alphabiasshift+radbiasshift;var alpharadbias=1<<alpharadbshift;var prime1=499;var prime2=491;var prime3=487;var prime4=503;var minpicturebytes=3*prime4;function NeuQuant(pixels,samplefac){var network;var netindex;var bias;var freq;var radpower;function init(){network=[];netindex=new Int32Array(256);bias=new Int32Array(netsize);freq=new Int32Array(netsize);radpower=new Int32Array(netsize>>3);var i,v;for(i=0;i<netsize;i++){v=(i<<netbiasshift+8)/netsize;network[i]=new Float64Array([v,v,v,0]);freq[i]=intbias/netsize;bias[i]=0}}function unbiasnet(){for(var i=0;i<netsize;i++){network[i][0]>>=netbiasshift;network[i][1]>>=netbiasshift;network[i][2]>>=netbiasshift;network[i][3]=i}}function altersingle(alpha,i,b,g,r){network[i][0]-=alpha*(network[i][0]-b)/initalpha;network[i][1]-=alpha*(network[i][1]-g)/initalpha;network[i][2]-=alpha*(network[i][2]-r)/initalpha}function alterneigh(radius,i,b,g,r){var lo=Math.abs(i-radius);var hi=Math.min(i+radius,netsize);var j=i+1;var k=i-1;var m=1;var p,a;while(j<hi||k>lo){a=radpower[m++];if(j<hi){p=network[j++];p[0]-=a*(p[0]-b)/alpharadbias;p[1]-=a*(p[1]-g)/alpharadbias;p[2]-=a*(p[2]-r)/alpharadbias}if(k>lo){p=network[k--];p[0]-=a*(p[0]-b)/alpharadbias;p[1]-=a*(p[1]-g)/alpharadbias;p[2]-=a*(p[2]-r)/alpharadbias}}}function contest(b,g,r){var bestd=~(1<<31);var bestbiasd=bestd;var bestpos=-1;var bestbiaspos=bestpos;var i,n,dist,biasdist,betafreq;for(i=0;i<netsize;i++){n=network[i];dist=Math.abs(n[0]-b)+Math.abs(n[1]-g)+Math.abs(n[2]-r);if(dist<bestd){bestd=dist;bestpos=i}biasdist=dist-(bias[i]>>intbiasshift-netbiasshift);if(biasdist<bestbiasd){bestbiasd=biasdist;bestbiaspos=i}betafreq=freq[i]>>betashift;freq[i]-=betafreq;bias[i]+=betafreq<<gammashift}freq[bestpos]+=beta;bias[bestpos]-=betagamma;return bestbiaspos}function inxbuild(){var i,j,p,q,smallpos,smallval,previouscol=0,startpos=0;for(i=0;i<netsize;i++){p=network[i];smallpos=i;smallval=p[1];for(j=i+1;j<netsize;j++){q=network[j];if(q[1]<smallval){smallpos=j;smallval=q[1]}}q=network[smallpos];if(i!=smallpos){j=q[0];q[0]=p[0];p[0]=j;j=q[1];q[1]=p[1];p[1]=j;j=q[2];q[2]=p[2];p[2]=j;j=q[3];q[3]=p[3];p[3]=j}if(smallval!=previouscol){netindex[previouscol]=startpos+i>>1;for(j=previouscol+1;j<smallval;j++)netindex[j]=i;previouscol=smallval;startpos=i}}netindex[previouscol]=startpos+maxnetpos>>1;for(j=previouscol+1;j<256;j++)netindex[j]=maxnetpos}function inxsearch(b,g,r){var a,p,dist;var bestd=1e3;var best=-1;var i=netindex[g];var j=i-1;while(i<netsize||j>=0){if(i<netsize){p=network[i];dist=p[1]-g;if(dist>=bestd)i=netsize;else{i++;if(dist<0)dist=-dist;a=p[0]-b;if(a<0)a=-a;dist+=a;if(dist<bestd){a=p[2]-r;if(a<0)a=-a;dist+=a;if(dist<bestd){bestd=dist;best=p[3]}}}}if(j>=0){p=network[j];dist=g-p[1];if(dist>=bestd)j=-1;else{j--;if(dist<0)dist=-dist;a=p[0]-b;if(a<0)a=-a;dist+=a;if(dist<bestd){a=p[2]-r;if(a<0)a=-a;dist+=a;if(dist<bestd){bestd=dist;best=p[3]}}}}}return best}function learn(){var i;var lengthcount=pixels.length;var alphadec=30+(samplefac-1)/3;var samplepixels=lengthcount/(3*samplefac);var delta=~~(samplepixels/ncycles);var alpha=initalpha;var radius=initradius;var rad=radius>>radiusbiasshift;if(rad<=1)rad=0;for(i=0;i<rad;i++)radpower[i]=alpha*((rad*rad-i*i)*radbias/(rad*rad));var step;if(lengthcount<minpicturebytes){samplefac=1;step=3}else if(lengthcount%prime1!==0){step=3*prime1}else if(lengthcount%prime2!==0){step=3*prime2}else if(lengthcount%prime3!==0){step=3*prime3}else{step=3*prime4}var b,g,r,j;var pix=0;i=0;while(i<samplepixels){b=(pixels[pix]&255)<<netbiasshift;g=(pixels[pix+1]&255)<<netbiasshift;r=(pixels[pix+2]&255)<<netbiasshift;j=contest(b,g,r);altersingle(alpha,j,b,g,r);if(rad!==0)alterneigh(rad,j,b,g,r);pix+=step;if(pix>=lengthcount)pix-=lengthcount;i++;if(delta===0)delta=1;if(i%delta===0){alpha-=alpha/alphadec;radius-=radius/radiusdec;rad=radius>>radiusbiasshift;if(rad<=1)rad=0;for(j=0;j<rad;j++)radpower[j]=alpha*((rad*rad-j*j)*radbias/(rad*rad))}}}function buildColormap(){init();learn();unbiasnet();inxbuild()}this.buildColormap=buildColormap;function getColormap(){var map=[];var index=[];for(var i=0;i<netsize;i++)index[network[i][3]]=i;var k=0;for(var l=0;l<netsize;l++){var j=index[l];map[k++]=network[j][0];map[k++]=network[j][1];map[k++]=network[j][2]}return map}this.getColormap=getColormap;this.lookupRGB=inxsearch}module.exports=NeuQuant},{}],4:[function(require,module,exports){var GIFEncoder,renderFrame;GIFEncoder=require("./GIFEncoder.js");renderFrame=function(frame){var encoder,page,stream,transfer;encoder=new GIFEncoder(frame.width,frame.height);if(frame.index===0){encoder.writeHeader()}else{encoder.firstFrame=false}encoder.setTransparent(frame.transparent);encoder.setRepeat(frame.repeat);encoder.setDelay(frame.delay);encoder.setQuality(frame.quality);encoder.setDither(frame.dither);encoder.setGlobalPalette(frame.globalPalette);encoder.addFrame(frame.data);if(frame.last){encoder.finish()}if(frame.globalPalette===true){frame.globalPalette=encoder.getGlobalPalette()}stream=encoder.stream();frame.data=stream.pages;frame.cursor=stream.cursor;frame.pageSize=stream.constructor.pageSize;if(frame.canTransfer){transfer=function(){var i,len,ref,results;ref=frame.data;results=[];for(i=0,len=ref.length;i<len;i++){page=ref[i];results.push(page.buffer)}return results}();return self.postMessage(frame,transfer)}else{return self.postMessage(frame)}};self.onmessage=function(event){return renderFrame(event.data)}},{"./GIFEncoder.js":1}]},{},[4]);`;
    
    // gif.js 0.2.0 - https://github.com/jnordberg/gif.js
    (function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.GIFa=f()}})(function(){var define,module,exports;return function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}({1:[function(require,module,exports){function EventEmitter(){this._events=this._events||{};this._maxListeners=this._maxListeners||undefined}module.exports=EventEmitter;EventEmitter.EventEmitter=EventEmitter;EventEmitter.prototype._events=undefined;EventEmitter.prototype._maxListeners=undefined;EventEmitter.defaultMaxListeners=10;EventEmitter.prototype.setMaxListeners=function(n){if(!isNumber(n)||n<0||isNaN(n))throw TypeError("n must be a positive number");this._maxListeners=n;return this};EventEmitter.prototype.emit=function(type){var er,handler,len,args,i,listeners;if(!this._events)this._events={};if(type==="error"){if(!this._events.error||isObject(this._events.error)&&!this._events.error.length){er=arguments[1];if(er instanceof Error){throw er}else{var err=new Error('Uncaught, unspecified "error" event. ('+er+")");err.context=er;throw err}}}handler=this._events[type];if(isUndefined(handler))return false;if(isFunction(handler)){switch(arguments.length){case 1:handler.call(this);break;case 2:handler.call(this,arguments[1]);break;case 3:handler.call(this,arguments[1],arguments[2]);break;default:args=Array.prototype.slice.call(arguments,1);handler.apply(this,args)}}else if(isObject(handler)){args=Array.prototype.slice.call(arguments,1);listeners=handler.slice();len=listeners.length;for(i=0;i<len;i++)listeners[i].apply(this,args)}return true};EventEmitter.prototype.addListener=function(type,listener){var m;if(!isFunction(listener))throw TypeError("listener must be a function");if(!this._events)this._events={};if(this._events.newListener)this.emit("newListener",type,isFunction(listener.listener)?listener.listener:listener);if(!this._events[type])this._events[type]=listener;else if(isObject(this._events[type]))this._events[type].push(listener);else this._events[type]=[this._events[type],listener];if(isObject(this._events[type])&&!this._events[type].warned){if(!isUndefined(this._maxListeners)){m=this._maxListeners}else{m=EventEmitter.defaultMaxListeners}if(m&&m>0&&this._events[type].length>m){this._events[type].warned=true;console.error("(node) warning: possible EventEmitter memory "+"leak detected. %d listeners added. "+"Use emitter.setMaxListeners() to increase limit.",this._events[type].length);if(typeof console.trace==="function"){console.trace()}}}return this};EventEmitter.prototype.on=EventEmitter.prototype.addListener;EventEmitter.prototype.once=function(type,listener){if(!isFunction(listener))throw TypeError("listener must be a function");var fired=false;function g(){this.removeListener(type,g);if(!fired){fired=true;listener.apply(this,arguments)}}g.listener=listener;this.on(type,g);return this};EventEmitter.prototype.removeListener=function(type,listener){var list,position,length,i;if(!isFunction(listener))throw TypeError("listener must be a function");if(!this._events||!this._events[type])return this;list=this._events[type];length=list.length;position=-1;if(list===listener||isFunction(list.listener)&&list.listener===listener){delete this._events[type];if(this._events.removeListener)this.emit("removeListener",type,listener)}else if(isObject(list)){for(i=length;i-- >0;){if(list[i]===listener||list[i].listener&&list[i].listener===listener){position=i;break}}if(position<0)return this;if(list.length===1){list.length=0;delete this._events[type]}else{list.splice(position,1)}if(this._events.removeListener)this.emit("removeListener",type,listener)}return this};EventEmitter.prototype.removeAllListeners=function(type){var key,listeners;if(!this._events)return this;if(!this._events.removeListener){if(arguments.length===0)this._events={};else if(this._events[type])delete this._events[type];return this}if(arguments.length===0){for(key in this._events){if(key==="removeListener")continue;this.removeAllListeners(key)}this.removeAllListeners("removeListener");this._events={};return this}listeners=this._events[type];if(isFunction(listeners)){this.removeListener(type,listeners)}else if(listeners){while(listeners.length)this.removeListener(type,listeners[listeners.length-1])}delete this._events[type];return this};EventEmitter.prototype.listeners=function(type){var ret;if(!this._events||!this._events[type])ret=[];else if(isFunction(this._events[type]))ret=[this._events[type]];else ret=this._events[type].slice();return ret};EventEmitter.prototype.listenerCount=function(type){if(this._events){var evlistener=this._events[type];if(isFunction(evlistener))return 1;else if(evlistener)return evlistener.length}return 0};EventEmitter.listenerCount=function(emitter,type){return emitter.listenerCount(type)};function isFunction(arg){return typeof arg==="function"}function isNumber(arg){return typeof arg==="number"}function isObject(arg){return typeof arg==="object"&&arg!==null}function isUndefined(arg){return arg===void 0}},{}],2:[function(require,module,exports){var UA,browser,mode,platform,ua;ua=navigator.userAgent.toLowerCase();platform=navigator.platform.toLowerCase();UA=ua.match(/(opera|ie|firefox|chrome|version)[\s\/:]([\w\d\.]+)?.*?(safari|version[\s\/:]([\w\d\.]+)|$)/)||[null,"unknown",0];mode=UA[1]==="ie"&&document.documentMode;browser={name:UA[1]==="version"?UA[3]:UA[1],version:mode||parseFloat(UA[1]==="opera"&&UA[4]?UA[4]:UA[2]),platform:{name:ua.match(/ip(?:ad|od|hone)/)?"ios":(ua.match(/(?:webos|android)/)||platform.match(/mac|win|linux/)||["other"])[0]}};browser[browser.name]=true;browser[browser.name+parseInt(browser.version,10)]=true;browser.platform[browser.platform.name]=true;module.exports=browser},{}],3:[function(require,module,exports){var EventEmitter,GIFa,browser,extend=function(child,parent){for(var key in parent){if(hasProp.call(parent,key))child[key]=parent[key]}function ctor(){this.constructor=child}ctor.prototype=parent.prototype;child.prototype=new ctor;child.__super__=parent.prototype;return child},hasProp={}.hasOwnProperty,indexOf=[].indexOf||function(item){for(var i=0,l=this.length;i<l;i++){if(i in this&&this[i]===item)return i}return-1},slice=[].slice;EventEmitter=require("events").EventEmitter;browser=require("./browser.coffee");GIFa=function(superClass){var defaults,frameDefaults;extend(GIFa,superClass);defaults={workerScript:"gif.worker.js",workers:2,repeat:0,background:"#fff",quality:10,width:null,height:null,transparent:null,debug:false,dither:false};frameDefaults={delay:500,copy:false};function GIFa(options){var base,key,value;this.running=false;this.options={};this.frames=[];this.freeWorkers=[];this.activeWorkers=[];this.setOptions(options);for(key in defaults){value=defaults[key];if((base=this.options)[key]==null){base[key]=value}}}GIFa.prototype.setOption=function(key,value){this.options[key]=value;if(this._canvas!=null&&(key==="width"||key==="height")){return this._canvas[key]=value}};GIFa.prototype.setOptions=function(options){var key,results,value;results=[];for(key in options){if(!hasProp.call(options,key))continue;value=options[key];results.push(this.setOption(key,value))}return results};GIFa.prototype.addFrame=function(image,options){var frame,key;if(options==null){options={}}frame={};frame.transparent=this.options.transparent;for(key in frameDefaults){frame[key]=options[key]||frameDefaults[key]}if(this.options.width==null){this.setOption("width",image.width)}if(this.options.height==null){this.setOption("height",image.height)}if(typeof ImageData!=="undefined"&&ImageData!==null&&image instanceof ImageData){frame.data=image.data}else if(typeof CanvasRenderingContext2D!=="undefined"&&CanvasRenderingContext2D!==null&&image instanceof CanvasRenderingContext2D||typeof WebGLRenderingContext!=="undefined"&&WebGLRenderingContext!==null&&image instanceof WebGLRenderingContext){if(options.copy){frame.data=this.getContextData(image)}else{frame.context=image}}else if(image.childNodes!=null){if(options.copy){frame.data=this.getImageData(image)}else{frame.image=image}}else{throw new Error("Invalid image")}return this.frames.push(frame)};GIFa.prototype.render=function(){var i,j,numWorkers,ref;if(this.running){throw new Error("Already running")}if(this.options.width==null||this.options.height==null){throw new Error("Width and height must be set prior to rendering")}this.running=true;this.nextFrame=0;this.finishedFrames=0;this.imageParts=function(){var j,ref,results;results=[];for(i=j=0,ref=this.frames.length;0<=ref?j<ref:j>ref;i=0<=ref?++j:--j){results.push(null)}return results}.call(this);numWorkers=this.spawnWorkers();if(this.options.globalPalette===true){this.renderNextFrame()}else{for(i=j=0,ref=numWorkers;0<=ref?j<ref:j>ref;i=0<=ref?++j:--j){this.renderNextFrame()}}this.emit("start");return this.emit("progress",0)};GIFa.prototype.abort=function(){var worker;while(true){worker=this.activeWorkers.shift();if(worker==null){break}this.log("killing active worker");worker.terminate()}this.running=false;return this.emit("abort")};GIFa.prototype.spawnWorkers=function(){var j,numWorkers,ref,results;numWorkers=Math.min(this.options.workers,this.frames.length);(function(){results=[];for(var j=ref=this.freeWorkers.length;ref<=numWorkers?j<numWorkers:j>numWorkers;ref<=numWorkers?j++:j--){results.push(j)}return results}).apply(this).forEach(function(_this){return function(i){var worker;_this.log("spawning worker "+i);worker=new Worker(_this.options.workerScript);worker.onmessage=function(event){_this.activeWorkers.splice(_this.activeWorkers.indexOf(worker),1);_this.freeWorkers.push(worker);return _this.frameFinished(event.data)};return _this.freeWorkers.push(worker)}}(this));return numWorkers};GIFa.prototype.frameFinished=function(frame){var i,j,ref;this.log("frame "+frame.index+" finished - "+this.activeWorkers.length+" active");this.finishedFrames++;this.emit("progress",this.finishedFrames/this.frames.length);this.imageParts[frame.index]=frame;if(this.options.globalPalette===true){this.options.globalPalette=frame.globalPalette;this.log("global palette analyzed");if(this.frames.length>2){for(i=j=1,ref=this.freeWorkers.length;1<=ref?j<ref:j>ref;i=1<=ref?++j:--j){this.renderNextFrame()}}}if(indexOf.call(this.imageParts,null)>=0){return this.renderNextFrame()}else{return this.finishRendering()}};GIFa.prototype.finishRendering=function(){var data,frame,i,image,j,k,l,len,len1,len2,len3,offset,page,ref,ref1,ref2;len=0;ref=this.imageParts;for(j=0,len1=ref.length;j<len1;j++){frame=ref[j];len+=(frame.data.length-1)*frame.pageSize+frame.cursor}len+=frame.pageSize-frame.cursor;this.log("rendering finished - filesize "+Math.round(len/1e3)+"kb");data=new Uint8Array(len);offset=0;ref1=this.imageParts;for(k=0,len2=ref1.length;k<len2;k++){frame=ref1[k];ref2=frame.data;for(i=l=0,len3=ref2.length;l<len3;i=++l){page=ref2[i];data.set(page,offset);if(i===frame.data.length-1){offset+=frame.cursor}else{offset+=frame.pageSize}}}image=new Blob([data],{type:"image/gif"});return this.emit("finished",image,data)};GIFa.prototype.renderNextFrame=function(){var frame,task,worker;if(this.freeWorkers.length===0){throw new Error("No free workers")}if(this.nextFrame>=this.frames.length){return}frame=this.frames[this.nextFrame++];worker=this.freeWorkers.shift();task=this.getTask(frame);this.log("starting frame "+(task.index+1)+" of "+this.frames.length);this.activeWorkers.push(worker);return worker.postMessage(task)};GIFa.prototype.getContextData=function(ctx){return ctx.getImageData(0,0,this.options.width,this.options.height).data};GIFa.prototype.getImageData=function(image){var ctx;if(this._canvas==null){this._canvas=document.createElement("canvas");this._canvas.width=this.options.width;this._canvas.height=this.options.height}ctx=this._canvas.getContext("2d");ctx.setFill=this.options.background;ctx.fillRect(0,0,this.options.width,this.options.height);ctx.drawImage(image,0,0);return this.getContextData(ctx)};GIFa.prototype.getTask=function(frame){var index,task;index=this.frames.indexOf(frame);task={index:index,last:index===this.frames.length-1,delay:frame.delay,transparent:frame.transparent,width:this.options.width,height:this.options.height,quality:this.options.quality,dither:this.options.dither,globalPalette:this.options.globalPalette,repeat:this.options.repeat,canTransfer:browser.name==="chrome"};if(frame.data!=null){task.data=frame.data}else if(frame.context!=null){task.data=this.getContextData(frame.context)}else if(frame.image!=null){task.data=this.getImageData(frame.image)}else{throw new Error("Invalid frame")}return task};GIFa.prototype.log=function(){var args;args=1<=arguments.length?slice.call(arguments,0):[];if(!this.options.debug){return}return console.log.apply(console,args)};return GIFa}(EventEmitter);module.exports=GIFa},{"./browser.coffee":2,events:1}]},{},[3])(3)});

    // libgif.js - https://github.com/MoeYc/libgif-js/blob/master/libgif.js
    eval(`var e,t;e=this,t=function(){var e=function(e){return e.reduce((function(e,t){return 2*e+t}),0)},t=function(e){for(var t=[],n=7;n>=0;n--)t.push(!!(e&1<<n));return t},n=function(e){this.data=e,this.len=this.data.length,this.pos=0,this.readByte=function(){if(this.pos>=this.data.length)throw new Error("Attempted to read past end of stream.");return e instanceof Uint8Array?e[this.pos++]:255&e.charCodeAt(this.pos++)},this.readBytes=function(e){for(var t=[],n=0;n<e;n++)t.push(this.readByte());return t},this.read=function(e){for(var t="",n=0;n<e;n++)t+=String.fromCharCode(this.readByte());return t},this.readUnsigned=function(){var e=this.readBytes(2);return(e[1]<<8)+e[0]}},r=function(n,r){r||(r={});var i=function(e){for(var t=[],r=0;r<e;r++)t.push(n.readBytes(3));return t},a=function(){var e,t;t="";do{e=n.readByte(),t+=n.read(e)}while(0!==e);return t},o=function(o){o.leftPos=n.readUnsigned(),o.topPos=n.readUnsigned(),o.width=n.readUnsigned(),o.height=n.readUnsigned();var l=t(n.readByte());o.lctFlag=l.shift(),o.interlaced=l.shift(),o.sorted=l.shift(),o.reserved=l.splice(0,2),o.lctSize=e(l.splice(0,3)),o.lctFlag&&(o.lct=i(1<<o.lctSize+1)),o.lzwMinCodeSize=n.readByte();var s=a();o.pixels=function(e,t){for(var n,r,i=0,a=function(e){for(var n=0,r=0;r<e;r++)t.charCodeAt(i>>3)&1<<(7&i)&&(n|=1<<r),i++;return n},o=[],l=1<<e,s=l+1,c=e+1,u=[],d=function(){u=[],c=e+1;for(var t=0;t<l;t++)u[t]=[t];u[l]=[],u[s]=null};;)if(r=n,(n=a(c))!==l){if(n===s)break;if(n<u.length)r!==l&&u.push(u[r].concat(u[n][0]));else{if(n!==u.length)throw new Error("Invalid LZW code.");u.push(u[r].concat(u[r][0]))}o.push.apply(o,u[n]),u.length===1<<c&&c<12&&c++}else d();return o}(o.lzwMinCodeSize,s),o.interlaced&&(o.pixels=function(e,t){for(var n=new Array(e.length),r=e.length/t,i=function(r,i){var a=e.slice(i*t,(i+1)*t);n.splice.apply(n,[r*t,t].concat(a))},a=[0,4,2,1],o=[8,8,4,2],l=0,s=0;s<4;s++)for(var c=a[s];c<r;c+=o[s])i(c,l),l++;return n}(o.pixels,o.width)),r.img&&r.img(o)},l=function(){var i={};switch(i.sentinel=n.readByte(),String.fromCharCode(i.sentinel)){case"!":i.type="ext",function(i){switch(i.label=n.readByte(),i.label){case 249:i.extType="gce",function(i){n.readByte();var a=t(n.readByte());i.reserved=a.splice(0,3),i.disposalMethod=e(a.splice(0,3)),i.userInput=a.shift(),i.transparencyGiven=a.shift(),i.delayTime=n.readUnsigned(),i.transparencyIndex=n.readByte(),i.terminator=n.readByte(),r.gce&&r.gce(i)}(i);break;case 254:i.extType="com",function(e){e.comment=a(),r.com&&r.com(e)}(i);break;case 1:i.extType="pte",function(e){n.readByte(),e.ptHeader=n.readBytes(12),e.ptData=a(),r.pte&&r.pte(e)}(i);break;case 255:i.extType="app",function(e){n.readByte(),e.identifier=n.read(8),e.authCode=n.read(3),"NETSCAPE"===e.identifier?function(e){n.readByte(),e.unknown=n.readByte(),e.iterations=n.readUnsigned(),e.terminator=n.readByte(),r.app&&r.app.NETSCAPE&&r.app.NETSCAPE(e)}(e):function(e){e.appData=a(),r.app&&r.app[e.identifier]&&r.app[e.identifier](e)}(e)}(i);break;default:i.extType="unknown",function(e){e.data=a(),r.unknown&&r.unknown(e)}(i)}}(i);break;case",":i.type="img",o(i);break;case";":i.type="eof",r.eof&&r.eof(i);break;default:throw new Error("Unknown block: 0x"+i.sentinel.toString(16))}"eof"!==i.type&&setTimeout(l,0)};!function(){var a={};if(a.sig=n.read(3),a.ver=n.read(3),"GIF"!==a.sig)throw new Error("Not a GIF file.");a.width=n.readUnsigned(),a.height=n.readUnsigned();var o=t(n.readByte());a.gctFlag=o.shift(),a.colorRes=e(o.splice(0,3)),a.sorted=o.shift(),a.gctSize=e(o.splice(0,3)),a.bgColor=n.readByte(),a.pixelAspectRatio=n.readByte(),a.gctFlag&&(a.gct=i(1<<a.gctSize+1)),r.hdr&&r.hdr(a)}(),setTimeout(l,0)};return function(e){var t,i,a={vp_l:0,vp_t:0,vp_w:null,vp_h:null,c_w:null,c_h:null};for(var o in e)a[o]=e[o];a.vp_w&&a.vp_h&&(a.is_vp=!0);var l=null,s=!1,c=null,u=null,d=null,h=null,p=null,f=null,g=null,_=!0,y=!1,w=[],v=[],m=a.gif;void 0===a.auto_play&&(a.auto_play=!m.getAttribute("rel:auto_play")||"1"==m.getAttribute("rel:auto_play"));var x,b,T,B,C=a.hasOwnProperty("on_end")?a.on_end:null,P=a.hasOwnProperty("loop_delay")?a.loop_delay:0,S=a.hasOwnProperty("loop_mode")?a.loop_mode:"auto",k=!a.hasOwnProperty("draw_while_loading")||a.draw_while_loading,A=!!k&&(!a.hasOwnProperty("show_progress_bar")||a.show_progress_bar),E=a.hasOwnProperty("progressbar_height")?a.progressbar_height:25,I=a.hasOwnProperty("progressbar_background_color")?a.progressbar_background_color:"rgba(255,255,255,0.4)",U=a.hasOwnProperty("progressbar_foreground_color")?a.progressbar_foreground_color:"rgba(255,0,22,.8)",O=function(){c=null,u=null,p=d,d=null,f=null},R=function(){try{r(t,H)}catch(e){D("parse")}},z=function(e,t){x.width=e*L(),x.height=t*L(),T.style.minWidth=e*L()+"px",B.width=e,B.height=t,B.style.width=e+"px",B.style.height=t+"px",B.getContext("2d").setTransform(1,0,0,1,0,0)},N=function(e,t,n){if(n&&A){var r,i,o,l=E;a.is_vp?y?(i=(a.vp_t+a.vp_h-l)/L(),l/=L(),r=a.vp_l/L()+e/t*(a.vp_w/L()),o=x.width/L()):(i=a.vp_t+a.vp_h-l,r=a.vp_l+e/t*a.vp_w,o=x.width):(i=(x.height-l)/(y?L():1),r=e/t*x.width/(y?L():1),o=x.width/(y?L():1),l/=y?L():1),b.fillStyle=I,b.fillRect(r,i,o-r,l),b.fillStyle=U,b.fillRect(0,i,r,l)}},D=function(e){l=e,i={width:m.width,height:m.height},w=[],b.fillStyle="black",b.fillRect(0,0,a.c_w?a.c_w:i.width,a.c_h?a.c_h:i.height),b.strokeStyle="red",b.lineWidth=3,b.moveTo(0,0),b.lineTo(a.c_w?a.c_w:i.width,a.c_h?a.c_h:i.height),b.moveTo(0,a.c_h?a.c_h:i.height),b.lineTo(a.c_w?a.c_w:i.width,0),b.stroke()},F=function(){f&&(w.push({data:f.getImageData(0,0,i.width,i.height),delay:u}),v.push({x:0,y:0}))},M=function(){var e,t,n,r=-1,i=0,o=function(e){r+=e,c()},s=(e=!1,t=function(){null!==C&&C(m),i++,!1!==S||i<0?n():(e=!1,_=!1)},n=function(){if(e=_){o(1);var i=10*w[r].delay;i||(i=100),0==(r+1+w.length)%w.length?(i+=P,setTimeout(t,i)):setTimeout(n,i)}},function(){e||setTimeout(n,0)}),c=function(){var e;(r=parseInt(r,10))>w.length-1&&(r=0),r<0&&(r=0),e=v[r],B.getContext("2d").putImageData(w[r].data,e.x,e.y),b.globalCompositeOperation="copy",b.drawImage(B,0,0)};return{init:function(){l||(a.c_w&&a.c_h||b.scale(L(),L()),a.auto_play?s():(r=0,c()))},step:s,play:function(){_=!0,s()},pause:function(){_=!1},playing:_,move_relative:o,current_frame:function(){return r},length:function(){return w.length},move_to:function(e){r=e,c()}}}(),G=function(e){N(t.pos,t.data.length,e)},j=function(){},W=function(e,t){return function(n){e(n),G(t)}},H={hdr:W((function(e){z((i=e).width,i.height)})),gce:W((function(e){F(),O(),c=e.transparencyGiven?e.transparencyIndex:null,u=e.delayTime,d=e.disposalMethod})),com:W(j),app:{NETSCAPE:W(j)},img:W((function(e){f||(f=B.getContext("2d"));var t=w.length,n=e.lctFlag?e.lct:i.gct;t>0&&(3===p?null!==h?f.putImageData(w[h].data,0,0):f.clearRect(g.leftPos,g.topPos,g.width,g.height):h=t-1,2===p&&f.clearRect(g.leftPos,g.topPos,g.width,g.height));var r=f.getImageData(e.leftPos,e.topPos,e.width,e.height);e.pixels.forEach((function(e,t){e!==c&&(r.data[4*t+0]=n[e][0],r.data[4*t+1]=n[e][1],r.data[4*t+2]=n[e][2],r.data[4*t+3]=255)})),f.putImageData(r,e.leftPos,e.topPos),y||(b.scale(L(),L()),y=!0),k&&(b.drawImage(B,0,0),k=a.auto_play),g=e}),!0),eof:function(e){F(),G(!1),a.c_w&&a.c_h||(x.width=i.width*L(),x.height=i.height*L()),M.init(),s=!1,X&&X(m)}},q=function(){var e=m.parentNode,t=document.createElement("div");x=document.createElement("canvas"),b=x.getContext("2d"),T=document.createElement("div"),B=document.createElement("canvas"),t.width=x.width=m.width,t.height=x.height=m.height,T.style.minWidth=m.width+"px",t.className="jsgif",T.className="jsgif_toolbar",t.appendChild(x),t.appendChild(T),e.insertBefore(t,m),e.removeChild(m),a.c_w&&a.c_h&&z(a.c_w,a.c_h),V=!0},L=function(){return a.max_width&&i&&i.width>a.max_width?a.max_width/i.width:1},V=!1,X=!1,Z=function(e){return!s&&(X=e||!1,s=!0,w=[],O(),h=null,p=null,f=null,g=null,!0)},J=function(){return w.reduce((function(e,t){return e+t.delay}),0)};return{play:M.play,pause:M.pause,move_relative:M.move_relative,move_to:M.move_to,get_playing:function(){return _},get_canvas:function(){return x},get_canvas_scale:function(){return L()},get_loading:function(){return s},get_auto_play:function(){return a.auto_play},get_length:function(){return M.length()},get_frames:function(){return w},get_duration:function(){return J()},get_duration_ms:function(){return 10*J()},get_current_frame:function(){return M.current_frame()},load_url:function(e,r){if(Z(r)){var i=new XMLHttpRequest;i.open("GET",e,!0),"overrideMimeType"in i?i.overrideMimeType("text/plain; charset=x-user-defined"):"responseType"in i?i.responseType="arraybuffer":i.setRequestHeader("Accept-Charset","x-user-defined"),i.onloadstart=function(){V||q()},i.onload=function(e){200!=this.status&&D("xhr - response"),"response"in this||(this.response=new VBArray(this.responseText).toArray().map(String.fromCharCode).join(""));var r=this.response;r.toString().indexOf("ArrayBuffer")>0&&(r=new Uint8Array(r)),t=new n(r),setTimeout(R,0)},i.onprogress=function(e){e.lengthComputable&&N(e.loaded,e.total,!0)},i.onerror=function(){D("xhr")},i.send()}},load:function(e){this.load_url(m.getAttribute("rel:animated_src")||m.src,e)},load_raw:function(e,r){Z(r)&&(V||q(),t=new n(e),setTimeout(R,0))},set_frame_offset:function(e,t){v[e]?(void 0!==t.x&&(v[e].x=t.x),void 0!==t.y&&(v[e].y=t.y)):v[e]=t}}}},"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?module.exports=t():e.SuperGif=t();`)

    function injectLoaderCSS() {
        const css = `
            .${ID_PREFIX}-video-label {
                display: block;
                margin-top: 8px;
            }
            
            .${ID_PREFIX}-btn-primary {
                display: block;
                margin: 8px;
                padding: 4px 16px 4px 16px;
            }
            
            .${ID_PREFIX}-file-input {
                display: none;
            }
            
            .${ID_PREFIX}-video-frame-wrapper {
                position: relative;
                width: fit-content;
                max-height: 150px;
                margin-bottom: 8px;
                display: none;
            }
            
            .${ID_PREFIX}-frame-image {
                max-width: 100%;
                max-height: 150px;
                margin-left: 8px;
            }
            
            .${ID_PREFIX}-button-flex {
                display: flex;
            }
            
            .${ID_PREFIX}-primaryButton {
                margin-left: 8px;
                flex-basis: auto;
                display: none;
            }
            
            .${ID_PREFIX}-secondaryButton.stopTask {
                margin-left: 6px;
                display: none;
            }
            
            .${ID_PREFIX}-output-format, .${ID_PREFIX}-fps, .${ID_PREFIX}-max-queue-size {
                margin: 8px 0 0 16px;
                display: none;
            }
            
            .${ID_PREFIX}-time-inputs {
                margin-bottom: 8px;
            }
            
            .${ID_PREFIX}-time-input {
                text-align: right;
            }
            
            .${ID_PREFIX}-video-element {
                display: none;
            }
            
            .${ID_PREFIX}-gif-element {
                display: block;
            }
        `;

        const styleElement = document.createElement('style');
        styleElement.appendChild(document.createTextNode(css));
        document.head.appendChild(styleElement);
    }
    injectLoaderCSS()

    let file_list = [];
    let fileRead = [];
    let reader = new FileReader()
    let file_input = document.getElementById('init_image');
    file_input.multiple = true; // enables the browse file to load multiple images

    let task_count_limit;
    const task_removal_frequency = 5000; // how often to check if we have to many images

    const editorInputs = document.getElementById("editor-inputs");
    document.getElementById('editor-inputs-init-image').insertAdjacentHTML('beforeend', `
        <label class="${ID_PREFIX}-video-label">Extract Images from Video/GIF</label>
        <button id="${ID_PREFIX}-upload-video-btn" type="button" class="${ID_PREFIX}-btn-primary"><i class="fa fa-photo-film"></i> Select a video/GIF<input type="file" id="video-file-selector" accept="video/mp4, video/webm, video/ogg, image/gif" class="${ID_PREFIX}-file-input"></button>
        <div id="${ID_PREFIX}-video-frame-wrapper" class="${ID_PREFIX}-video-frame-wrapper">
            <img id="${ID_PREFIX}-extracted-image-frame" alt="Latest Frame" class="${ID_PREFIX}-frame-image">
            <button class="${ID_PREFIX}-video-clear-btn image_clear_btn"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="${ID_PREFIX}-button-flex">
            <button id="${ID_PREFIX}-animateButton" class="${ID_PREFIX}-primaryButton primaryButton">Animate</button>
            <button id="${ID_PREFIX}-stop-extraction" class="${ID_PREFIX}-secondaryButton stopTask" disabled>Stop Extraction</button>
        </div>
        <div id="${ID_PREFIX}-output-format" class="${ID_PREFIX}-output-format">
            <div id="${ID_PREFIX}-time-inputs" class="${ID_PREFIX}-time-inputs">
                <small>Start time:</small> <input type="number" id="${ID_PREFIX}-extract-from-time" min="0" max="14400" step="0.1" value="0" size="6" class="${ID_PREFIX}-time-input">
                <small>End time:</small> <input type="number" id="${ID_PREFIX}-extract-to-time" min="0" max="14400" step="0.1" size="6" class="${ID_PREFIX}-time-input">
            </div>
            <small>Animation format: </small>
            <select id="${ID_PREFIX}-output-file-format">
                <option value="render">(Render only)</option>
                <option value="video" selected="">Video clip</option>
                <option value="gif">Animated GIF</option>
            </select>
        </div>
        <div id="${ID_PREFIX}-fps" class="${ID_PREFIX}-fps">
            <small>Frames Per Second: </small><input type="number" id="${ID_PREFIX}-extract-fps" min="0.1" max="30" step="0.1" value="5">
        </div>
        <div id="${ID_PREFIX}-max-queue-size" class="${ID_PREFIX}-max-queue-size">
            <small>Max queue size while Animating (0 = unlimited): </small><input id="${ID_PREFIX}-max_animate_queue_size" name="max_animate_queue_size" value="0" size="4" onkeypress="preventNonNumericalInput(event)">
        </div>
        <video id="${ID_PREFIX}-video-player" class="${ID_PREFIX}-video-element"></video>
        <canvas id="${ID_PREFIX}-video-canvas" class="${ID_PREFIX}-video-element"></canvas>
    `);
    const animateButton = document.getElementById(`${ID_PREFIX}-animateButton`);
    const maxQueueSize = document.getElementById(`${ID_PREFIX}-max-queue-size`);
    const animateOutputFormat = document.getElementById(`${ID_PREFIX}-output-format`);
    const animateTimeInputs = document.getElementById(`${ID_PREFIX}-time-inputs`);
    const animateOutputFileFormat = document.getElementById(`${ID_PREFIX}-output-file-format`);
    const animateFps = document.getElementById(`${ID_PREFIX}-fps`);
    const frameWrapper = document.getElementById(`${ID_PREFIX}-video-frame-wrapper`);
    const clearButton = document.querySelector(`button.${ID_PREFIX}-video-clear-btn`);
    const maxAnimateQueueSize = document.getElementById(`${ID_PREFIX}-max_animate_queue_size`)
    const fpsInput = document.getElementById(`${ID_PREFIX}-extract-fps`);
    const extractFromTime = document.getElementById(`${ID_PREFIX}-extract-from-time`);
    const extractToTime = document.getElementById(`${ID_PREFIX}-extract-to-time`);

    // save settings
    // output file format
    animateOutputFileFormat.addEventListener('change', (e) => {
        localStorage.setItem(`${ID_PREFIX}_animate_output_file_format`, animateOutputFileFormat.value)
    })    
    const storedAnimateOutputFileFormat = localStorage.getItem(`${ID_PREFIX}_animate_output_file_format`);
    if (storedAnimateOutputFileFormat) {
        animateOutputFileFormat.value = storedAnimateOutputFileFormat;
    }
    // fps
    fpsInput.addEventListener('input', (e) => {
        localStorage.setItem(`${ID_PREFIX}_video_extract_fps`, fpsInput.value)
    })
    fpsInput.value = parseFloat(localStorage.getItem(`${ID_PREFIX}_video_extract_fps`)) > 0 ? parseFloat(localStorage.getItem(`${ID_PREFIX}_video_extract_fps`)) : '5'
    // max queue size
    maxAnimateQueueSize.addEventListener('input', (e) => {
        localStorage.setItem(`${ID_PREFIX}_max_animate_queue_size`, maxAnimateQueueSize.value)
    })
    maxAnimateQueueSize.value = parseInt(localStorage.getItem(`${ID_PREFIX}_max_animate_queue_size`)) >= 0 ? localStorage.getItem(`${ID_PREFIX}_max_animate_queue_size`) : '0'

    function showLoadingScreen() {
        const loader = document.createElement('div');
        loader.className = `${ID_PREFIX}-animate-loader`;
        loader.id = `${ID_PREFIX}-animate-loader`;
        loader.style.display = 'flex';
        loader.innerHTML = '<h1>Please wait...</h1>';
    
        document.body.appendChild(loader);
    }
    
    function hideLoadingScreen() {
        const loader = document.getElementById(`${ID_PREFIX}-animate-loader`);
    
        if (loader) {
            loader.remove();
        }
    }
    
    /* Video frame extractor */
    const fileSelector = document.getElementById(`${ID_PREFIX}-upload-video-btn`);
    const stopExtractionButton = document.getElementById(`${ID_PREFIX}-stop-extraction`);
    const video = document.getElementById(`${ID_PREFIX}-video-player`);
    const canvas = document.getElementById(`${ID_PREFIX}-video-canvas`);
    const frame = document.getElementById(`${ID_PREFIX}-extracted-image-frame`);
    let extractionInProgress = false;
    let imageBatchGuids = [];
    
    fileSelector.addEventListener('click', function() {
        document.getElementById('video-file-selector').click();
    });

    extractFromTime.addEventListener('change', (e) => {
        if (parseFloat(extractFromTime.value) > parseFloat(extractToTime.value)) {
            extractToTime.value = extractFromTime.value;
        }
        updateAnimateCount()
        displayTimePosition(extractFromTime.value);
    })
    
    extractToTime.addEventListener('change', (e) => {
        if (parseFloat(extractToTime.value) < parseFloat(extractFromTime.value)) {
            extractFromTime.value = extractToTime.value;
        }
        updateAnimateCount()
        displayTimePosition(extractToTime.value);
    })

    function setTimeRange(totalDuration) {
        const duration = totalDuration.toFixed(1)
        extractFromTime.setAttribute('max', duration);
        extractToTime.setAttribute('max', duration);
        extractFromTime.value = 0;
        extractToTime.value = duration;
    }

    document.getElementById('video-file-selector').addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();

            if (fileExtension === 'gif') {
                // Code for processing GIF files
                const fileURL = URL.createObjectURL(file);
                video.src = ""
                // show gif here
                frame.src = fileURL

                colorCorrectionSetting.style.display = "none";
                animateButton.style.display = "block";
                animateTimeInputs.style.display = "none";
                animateOutputFormat.style.display = "block";
                animateFps.style.display = "block";
                frameWrapper.style.display = "block";
                maxQueueSize.style.display = "block";
                if (!testDiffusers.checked) {
                    samplerSelectionContainer.style.display = "none";
                }

                // read GIF properties
                const divElement = document.createElement('div');
                const gifImg = document.createElement('img');
                divElement.appendChild(gifImg);
                gifImg.src = fileURL;
                const rub = new SuperGif({ gif: gifImg });
                rub.load(function() {
                    const frameCount = rub.get_length();
                    const duration = rub.get_duration_ms() || Math.ceil((frameCount / 8) * 1000);
                    const imageSize = rub.get_canvas().width + 'x' + rub.get_canvas().height;
                    /*
                    console.log('Frame count:', frameCount);
                    console.log('Image size:', imageSize);
                    console.log('Duration:', duration);
                    console.log('FPS:', Math.floor(frameCount / duration * 1000));
                    */
                    animateButton.innerHTML = "Animate (" + frameCount + " images)";
                    setImageDimensions(rub.get_canvas().width, rub.get_canvas().height);
                    fpsInput.value = Math.floor(frameCount / duration * 1000);
                    
                    // display the image at 1/3 of the gif
                    rub.move_to(Math.floor(frameCount / 3));
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = rub.get_canvas().width;
                    canvas.height = rub.get_canvas().height;
                    context.drawImage(rub.get_canvas(), 0, 0);
                    initImagePreview.src = canvas.toDataURL(); // convert canvas to data URL

                    // cleanup
                    divElement.remove();
                });
            } else {
                // Code for processing video files
                const fileURL = URL.createObjectURL(file);
                video.src = fileURL;
                video.onloadedmetadata = () => {
                    if (video.videoWidth > 0 && video.videoHeight > 0) {
                        // Existing code for processing video files
                        const desiredFPS = parseFloat(fpsInput.value) ? parseFloat(fpsInput.value) : 5;
                        setTimeRange(video.duration);
                        displayTimePosition(3);
                        colorCorrectionSetting.style.display = "none";
                        animateButton.style.display = "block";
                        animateTimeInputs.style.display = "block";
                        animateOutputFormat.style.display = "block";
                        animateFps.style.display = "block";
                        frameWrapper.style.display = "block";
                        maxQueueSize.style.display = "block";
                        setImageDimensions(video.videoWidth, video.videoHeight);
                        if (!testDiffusers.checked) {
                            samplerSelectionContainer.style.display = "none";
                        }
                        updateAnimateCount();
                    } else {
                        console.error('Error: The video stream is not readable.');
                        showToast('The video stream is not readable. Please choose a different video file.', 5000, true);
                    }
                };
            }
        }
    });

    function updateAnimateCount() {
        const file = document.getElementById('video-file-selector').files[0];
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop().toLowerCase();

        if (fileExtension !== 'gif') {
            // show the user how many images will be generated
            const desiredFPS = parseFloat(fpsInput.value) ? parseFloat(fpsInput.value) : 5;
            
            animateButton.innerHTML = "Animate (" + Math.ceil((extractToTime.value - extractFromTime.value) * desiredFPS) + " images)";
        }
    }

    fpsInput.addEventListener('input', () => {
        const desiredFPS = parseFloat(fpsInput.value) ? parseFloat(fpsInput.value) : 5;

        displayTimePosition(3);
        updateAnimateCount();
    });

    function setImageDimensions(width, height) {
        // Calculate the maximum cropped dimensions
        const maxCroppedWidth = Math.floor(width / 64) * 64;
        const maxCroppedHeight = Math.floor(height / 64) * 64;

        // Calculate the x and y coordinates to center the cropped image
        const x = (maxCroppedWidth - width) / 2;
        const y = (maxCroppedHeight - height) / 2;

        // Get the options from widthField and heightField
        const widthOptions = Array.from(widthField.options).map(option => parseInt(option.value));
        const heightOptions = Array.from(heightField.options).map(option => parseInt(option.value));

        // Find the closest aspect ratio and closest to original dimensions
        let bestWidth = widthOptions[0];
        let bestHeight = heightOptions[0];
        let minDifference = Math.abs(maxCroppedWidth / maxCroppedHeight - bestWidth / bestHeight);
        let minDistance = Math.abs(maxCroppedWidth - bestWidth) + Math.abs(maxCroppedHeight - bestHeight);

        for (const width of widthOptions) {
            for (const height of heightOptions) {
                const difference = Math.abs(maxCroppedWidth / maxCroppedHeight - width / height);
                const distance = Math.abs(maxCroppedWidth - width) + Math.abs(maxCroppedHeight - height);

                if (difference < minDifference || (difference === minDifference && distance < minDistance)) {
                    minDifference = difference;
                    minDistance = distance;
                    bestWidth = width;
                    bestHeight = height;
                }
            }
        }

        // Set the width and height to the closest aspect ratio and closest to original dimensions
        widthField.value = bestWidth;
        heightField.value = bestHeight;
    }

    function debounce(func, wait) {
        let timeout;
        let lastCallTime;
    
        return function (...args) {
            const context = this;
            const now = Date.now();
    
            const later = () => {
                lastCallTime = now;
                timeout = null;
                func.apply(context, args);
            };
    
            if (!lastCallTime) {
                lastCallTime = now;
            }
    
            if (now - lastCallTime >= wait) {
                clearTimeout(timeout);
                later();
            } else {
                clearTimeout(timeout);
                timeout = setTimeout(later, wait - (now - lastCallTime));
            }
        };
    }

    function debouncedDisplayTimePosition(timeToSeek) {
        if (timeToSeek > video.duration) {
            // Seek to the end of the video and capture the last available frame
            video.currentTime = video.duration;
        } else if (timeToSeek < 0) {
            // Seek to the beginning of the video and capture the first available frame
            video.currentTime = 0;
        } else {
            video.currentTime = timeToSeek;
        }
    
        video.addEventListener('seeked', () => {
            captureFrame(video);
            initImagePreview.src = frame.src;
        }, { once: true });
    }
    const displayTimePosition = debounce(debouncedDisplayTimePosition, 200);
    
    stopExtractionButton.addEventListener('click', () => {
        extractionInProgress = false;
        animateButton.disabled = false;
        stopExtractionButton.style.display = 'none';
        stopExtractionButton.disabled = true;
    });

    function unloadVideoSource() {
        stopExtractionButton.dispatchEvent(new Event('click'));
        colorCorrectionSetting.style.display = "block";
        animateButton.style.display = "none";
        animateOutputFormat.style.display = "none";
        animateFps.style.display = "none";
        frameWrapper.style.display = "none";
        maxQueueSize.style.display = "none"
        //promptStrengthContainer.style.display = 'none'
        if (!testDiffusers.checked) {
            samplerSelectionContainer.style.display = ""
        }
        
        // Unload the video
        URL.revokeObjectURL(video.src);
        video.removeAttribute('src');
        video.load();

        // Clear the input file
        document.getElementById('video-file-selector').value = null;
    }

    clearButton.addEventListener('click', () => {
        // unload the video
        unloadVideoSource()
        
        // unload the source image
        img2imgUnload()
    });

    // close the video when closing img2img
    initImageClearBtn.addEventListener('click', () => {
        // unload the video
        unloadVideoSource()
        
        // unload the source image
        img2imgUnload()
    })

    // remove the video when selecting image(s)
    initImageSelector.addEventListener('change', () => {
        // unload the video
        unloadVideoSource()
    })

    function extractImagesFromGif(file) {
        // Code for processing GIF files
        const fileURL = URL.createObjectURL(file);
        const divElement = document.createElement('div');
        const gifImg = document.createElement('img');
        divElement.appendChild(gifImg);
        gifImg.src = fileURL;
        const rub = new SuperGif({ gif: gifImg });
        rub.load(function() {
            const frameCount = rub.get_length();
        
            // Recursive function for extracting a frame
            const extractFrame = function(i) {
                if (i >= frameCount) {
                    divElement.remove()
                    extractionInProgress = false;
                    animateButton.disabled = false;
                    stopExtractionButton.style.display = 'none';
                    stopExtractionButton.disabled = true;
                    return; // base case
                }

                rub.move_to(i);
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = rub.get_canvas().width;
                canvas.height = rub.get_canvas().height;
                context.drawImage(rub.get_canvas(), 0, 0);
        
                initImagePreview.addEventListener('load', function() {
                    const taskTemplate = getCurrentUserRequest()
        
                    // overrides
                    if (animateOutputFileFormat.value !== "render") {
                        taskTemplate.numOutputsTotal = 1
                        taskTemplate.batchCount = 1
                        taskTemplate.reqBody.num_outputs = 1
                        taskTemplate.reqBody.stream_image_progress = false
                        taskTemplate.reqBody.show_only_filtered_image = true
                    }
                    //taskTemplate.reqBody.init_image = frame.src
                    const imageGuid = generateGuid()
                    taskTemplate.reqBody.imageGuid = imageGuid
                    imageBatchGuids.push({imageGuid: imageGuid});
        
                    // create the tasks
                    const newTaskRequests = getPrompts().map((prompt) => Object.assign({}, taskTemplate, {
                        reqBody: Object.assign({ prompt: prompt }, taskTemplate.reqBody)
                    }))
                    newTaskRequests.forEach(createTask)
        
                    updateInitialText()
                    extractFrame(i + 1);
                }, { once: true });
                initImagePreview.src = canvas.toDataURL(); // convert canvas to data URL
            };
        
            extractFrame(0); // start with the first frame
        });
    }

    function extractImagesFromVideo(video, fromTime, toTime, interval) {
        if (!video || !interval) return;
        video.currentTime = fromTime;

        const timeThreshold = 0.1; // Time threshold in seconds

        const captureImage = () => {
            if (video.currentTime > toTime - timeThreshold || !extractionInProgress) {
                extractionInProgress = false;
                animateButton.disabled = false;
                stopExtractionButton.style.display = 'none';
                stopExtractionButton.disabled = true;
                return;
            }
            video.addEventListener('seeked', () => {
                captureFrame(video);
                video.currentTime += interval;
                captureImage();
            }, { once: true });
        };

        captureImage();
    }

    function captureFrame(video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frame.src = canvas.toDataURL('image/jpeg');
        if (extractionInProgress) {
            const taskTemplate = getCurrentUserRequest()

            // overrides
            if (animateOutputFileFormat.value !== "render") {
                taskTemplate.numOutputsTotal = 1
                taskTemplate.batchCount = 1
                taskTemplate.reqBody.num_outputs = 1
                taskTemplate.reqBody.stream_image_progress = false
                taskTemplate.reqBody.show_only_filtered_image = true
            }
            taskTemplate.reqBody.init_image = frame.src
            const imageGuid = generateGuid()
            taskTemplate.reqBody.imageGuid = imageGuid
            imageBatchGuids.push({imageGuid: imageGuid});

            // create the tasks
            const newTaskRequests = getPrompts().map((prompt) => Object.assign({}, taskTemplate, {
                reqBody: Object.assign({ prompt: prompt }, taskTemplate.reqBody)
            }))
            newTaskRequests.forEach(createTask)

            updateInitialText()
        }
    }

    function generateGuid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }
        return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
    }

    // observe for changes in the preview pane
    const batchImageObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes[0] !== undefined && mutation.addedNodes[0].className == 'imageTaskContainer') {
                const task = htmlTaskMap.get(mutation.addedNodes[0])
                if (task.reqBody.imageGuid !== undefined) {
                    const stopTask = mutation.addedNodes[0]?.querySelector(".stopTask");
                    if (stopTask) {
                        stopTask.style.visibility = "hidden";
                    }
                }
            } else if (mutation.target.classList.contains('img-batch')) {
                lookupImage(mutation.target);
                const stopTask = mutation.target.closest('.imageTaskContainer').querySelector(".stopTask")
                if (stopTask) {
                    stopTask.style.visibility = "visible";
                }
            }
        });
    });

    async function dataURLtoBlob(dataurl) {
        const response = await fetch(dataurl);
        return response.blob();
    }
    
    function addImageToGuidArray(guid, imageBlob, guidArray) {
        const guidObject = guidArray.find(obj => obj.imageGuid === guid);
    
        if (guidObject && guidObject.image === undefined) {
            guidObject.image = imageBlob;
        }
        return guidArray.every(obj => obj.hasOwnProperty('image'));
    }
    
    function lookupImage(target) {
        if (target !== null) {
            const img = target.querySelector('img');
            img?.addEventListener('load', async function () {
                const task0 = htmlTaskMap.get(img.closest('.imageTaskContainer'));
                const guid = task0?.reqBody?.imageGuid;
                if (guid) {
                    const imageBlob = await dataURLtoBlob(img.src);
                    if (addImageToGuidArray(guid, imageBlob, imageBatchGuids)) {
                        const renderType = animateOutputFileFormat.value;
                        if (renderType !== "render") {
                            processAnimation(imageBatchGuids, fpsInput.value, 'animation', renderType);
                        }
                    }
                }
            }, { once: true });
        }
    }
    
    async function processAnimation(imageBatchGuids, fpsInputValue, animationType, renderType) {
        try {
            await createAndSaveAnimation(imageBatchGuids, fpsInputValue, animationType, renderType);
        } catch (error) {
            console.error('Error processing animation:', error);
        }
    }
    
    batchImageObserver.observe(document.getElementById('preview'), {
        childList: true,
        subtree: true
    });

    async function createAndSaveAnimation(imageDataObjects, fps, filename, fileType) {
        if (imageDataObjects.length === 0) {
            console.error("No images to process.");
            return;
        }   
        showToast("Creating the final animation")
        
        const firstImageBitmap = await createImageBitmap(imageDataObjects[0].image);
    
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const frameDelay = Math.round(1000 / fps);
    
        canvas.width = firstImageBitmap.width;
        canvas.height = firstImageBitmap.height;
    
        async function processImage(imageBlob) {
            const imageBitmap = await createImageBitmap(imageBlob);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(imageBitmap, 0, 0);
        }
    
        if (fileType === 'gif') {
            const workerBlob = new Blob([gifWorkerScript], { type: 'application/javascript' });
            const workerBlobURL = URL.createObjectURL(workerBlob);
    
            const gifa = new GIFa({
                workers: 2,
                quality: 20,
                width: canvas.width,
                height: canvas.height,
                workerScript: workerBlobURL,
                dither: true,
            });
    
            for (const imageDataObject of imageDataObjects) {
                await processImage(imageDataObject.image);
                gifa.addFrame(ctx, { delay: frameDelay, copy: true });
            }
    
            gifa.on('finished', function (blob) {
                const url = URL.createObjectURL(blob);
    
                const tempLink = document.createElement('a');
                tempLink.href = url;
                tempLink.download = `${filename}.gif`;
                tempLink.style.display = 'none';
                document.body.appendChild(tempLink);
                tempLink.click();
    
                setTimeout(() => {
                    document.body.removeChild(tempLink);
                    URL.revokeObjectURL(url);
                }, 100);
                showToast("Final animation creation completed ")
            });
    
            gifa.render();
        } else {
            // determine the best video encoder
            function getBestSupportedCodec() {
                const codecs = [
                    'video/mp4;codecs:avc1',
                    'video/webm;codecs:vp9',
                    'video/webm;codecs:vp8',
                ];
            
                for (let i = 0; i < codecs.length; i++) {
                    if (MediaRecorder.isTypeSupported(codecs[i])) {
                        return codecs[i];
                    }
                }
            
                // Return a default codec if no supported codecs found
                return 'video/webm;codecs=vp8';
            }
            
            const recordedChunks = [];
            const mimeType = getBestSupportedCodec();
            const mediaStream = canvas.captureStream(fps);
            const mediaRecorder = new MediaRecorder(mediaStream, { mimeType, bitsPerSecond: 5000000 });
            
            mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: mimeType });
                const url = URL.createObjectURL(blob);
            
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
            
                URL.revokeObjectURL(url);
            };
            
            mediaRecorder.start();
            
            let currentFrame = 0;
            const videoStartTime = performance.now();
            const drawImages = async () => {
                if (currentFrame < imageDataObjects.length) {
                    const startTime = performance.now();
                    await processImage(imageDataObjects[currentFrame].image);
                    const processingTime = performance.now() - startTime;
            
                    currentFrame++;
            
                    // Calculate the elapsed time since the video started
                    const elapsedTime = performance.now() - videoStartTime;
                    
                    // Calculate the ideal time for the current frame
                    const idealFrameTime = currentFrame * frameDelay;
            
                    // Calculate the adjustedFrameDelay based on idealFrameTime and elapsedTime
                    const adjustedFrameDelay = Math.max(0, idealFrameTime - elapsedTime);
            
                    // Use setTimeout with the adjustedFrameDelay to control the frame rate
                    setTimeout(drawImages, adjustedFrameDelay);
                } else {
                    mediaRecorder.stop();
                    showToast("Final animation creation completed ")
                }
            };
            
            // Start the drawImages loop
            drawImages();
        }
            
        // free up the memory
        imageBatchGuids = [];
    }

    //==================== Listeners =============================
    /**
     Add all images as tasks
    **/
    let removeExtraTasksInterval
    animateButton.addEventListener('click',function(evnt){
        // start the auto task cleanup
        task_count_limit = maxAnimateQueueSize.value > '0' ? maxAnimateQueueSize.value : 0
        removeExtraTasksInterval = setInterval(removeExtraTasks, task_removal_frequency);

        if (animateFps.style.display === "none") {
            // queue the tasks
            for(let i = 0; i < fileRead.length; i++ ){
                if (typeof performance == "object" && performance.mark) {
                    performance.mark('click-makeImage')
                }
                
                if (!SD.isServerAvailable()) {
                    alert('The server is not available.')
                    return
                }
                if (!randomSeedField.checked && seedField.value == '') {
                    alert('The "Seed" field must not be empty.')
                    return
                }
                if (numInferenceStepsField.value == '') {
                    alert('The "Inference Steps" field must not be empty.')
                    return
                }
                if (numOutputsTotalField.value == '' || numOutputsTotalField.value == 0) {
                    numOutputsTotalField.value = 1
                }
                if (numOutputsParallelField.value == '' || numOutputsParallelField.value == 0) {
                    numOutputsParallelField.value = 1
                }
                if (guidanceScaleField.value == '') {
                    guidanceScaleField.value = guidanceScaleSlider.value / 10
                }
                const taskTemplate = getCurrentUserRequest()
    
                // overrides
                if (animateOutputFileFormat.value !== "render") {
                    //taskTemplate.numOutputsTotal = 1
                    //taskTemplate.batchCount = 1
                    //taskTemplate.reqBody.num_outputs = 1
                    //taskTemplate.reqBody.stream_image_progress = false
                    //taskTemplate.reqBody.show_only_filtered_image = true
                }
                taskTemplate.reqBody.init_image = fileRead[i]
    
                // create the tasks
                const newTaskRequests = getPrompts().map((prompt) => Object.assign({}, taskTemplate, {
                    reqBody: Object.assign({ prompt: prompt }, taskTemplate.reqBody)
                }))
                newTaskRequests.forEach(createTask)
                
                updateInitialText()
            }
        }
        else
        {
            // initialize the imageBatchGuids array
            imageBatchGuids = []
            
            const file = document.getElementById('video-file-selector').files[0];
            const fileName = file.name;
            const fileExtension = fileName.split('.').pop().toLowerCase();

            if (fileExtension === 'gif') {
                extractionInProgress = true;
                animateButton.disabled = true;
                stopExtractionButton.style.display = 'block';
                stopExtractionButton.disabled = false;
                extractImagesFromGif(file)
            } else {
                // extract frames from video
                const desiredFPS = parseFloat(fpsInput.value) ? parseFloat(fpsInput.value) : 5;
                const interval = 1 / desiredFPS;
                const fromTime = extractFromTime.value
                const toTime = extractToTime.value
                extractionInProgress = true;
                animateButton.disabled = true;
                stopExtractionButton.style.display = 'block';
                stopExtractionButton.disabled = false;
                extractImagesFromVideo(video, fromTime, toTime, interval);
            }
        }
    });

    file_input.addEventListener('change',function(evnt){
        file_list = [];
        fileRead = [];
        for( let i = 0; i < file_input.files.length; i++ ){
            let file = file_input.files[i];
            file_list.push(file);
            //console.log(file);
        }
        animateButton.innerHTML = "Animate (" + file_input.files.length + " images)"; // show the user how many files we loaded
        if (file_input.files.length > 1) {
            animateButton.style.display = "block";
        }
        else
        {
            animateButton.style.display = "none";
        }
        readFiles();
    })

    //==================== Functions ============================


    function readFiles() {	
       if (file_list.length > 0) { // if we still have files left
           let file = file_list.shift(); // remove first from queue and store in file		
           reader.onloadend = function (loadEvent) { // when finished reading file, call recursive readFiles function
               //console.log(loadEvent.target.result);		   
               fileRead.push(loadEvent.target.result);
               let i = fileRead.length-1;		   
               readFiles();
           }
           reader.readAsDataURL(file);
       } else {
           // finishedReadingFiles() // no more files to read
            //console.log(fileRead);	 
       }
    }


    function getVal(id){
        let obj = document.getElementById(id);
        let value = "";
        if (obj.type == "checkbox"){
            value = document.getElementById(id).checked;
        }else{
            value = document.getElementById(id).value;
        }
        //console.log(id + ':' + value);
        return value;
    }

    //Prevents the images and DOM from crashing the browser when processing a large number of images
    function removeExtraTasks(){
        if (task_count_limit <= 0) {
            return            
        }
        try{
            let number_of_tasks =  $("div.taskStatusLabel:hidden").length;
            //console.log("number of tasks:", number_of_tasks)
            while (number_of_tasks > task_count_limit) {
                //console.log("clicking:", $(".stopTask").last())
                if (processOrder.checked) {
                    // remove first image
                    const matchedElements = $('.imageTaskContainer').filter(function() {
                        return $(this).find('div.taskStatusLabel:hidden').length > 0;
                    }).find('.stopTask');
                    matchedElements?.first().trigger('click');
                }
                else {
                    // remove last image
                    const matchedElements = $('.imageTaskContainer').filter(function() {
                        return $(this).find('div.taskStatusLabel:hidden').length > 0;
                    }).find('.stopTask');
                    matchedElements?.last().trigger('click');
                }
                // update task count
                number_of_tasks =  $("div.taskStatusLabel:hidden").length;
            }
        }catch (e){
            console.log(e);
        }

        // stop the auto task cleanup when the queue is empty
        try{
            let number_of_tasks = $("div.taskStatusLabel:not(:hidden)").length;
            //console.log("number of tasks:", number_of_tasks)
            if(number_of_tasks === 0){ 
                //console.log("stopping the scheduled cleanup")
                clearInterval(removeExtraTasksInterval);
            }
        }catch (e){
            console.log(e);
        }
    }
})()
