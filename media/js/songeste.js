/**
 *
 * songeste.js 
 * 
 * author: Pierre Marchand <pierremarc07@gmail.com>
 * 
 * date: 2012-04-16
 * 
 */

var canvas = undefined;
var son_img_container = undefined;
var son_gal_images = new Array();
var son_gal_images_count = 0;
var son_tools = undefined;

var AsyncImage = function(preURL, URL, container, idx, pos)
{
	this.preURL = preURL;
	this.url = URL;
	this.container = jQuery(container);
	this.index = idx;
	this.preloaded = false;
	this.loaded = false;
	this.raster = undefined;
	this.pos = pos || new paper.Point(0,0);
	return this;
}


AsyncImage.prototype.load = function()
{
	var that = this;
	console.log('Async Load: '+that.index);
	that.pre = jQuery('<img src="" />');
	that.main = jQuery('<img src="" />');
	that.container.append(that.pre);
	that.container.append(that.main);
	
	that.pre.on('load', function(){
		that.preloaded = true;
		that.container.trigger('preload_complete', [that.index]);
	});
	that.main.on('load', function(){
		that.loaded = true;
		that.container.trigger('load_complete', [that.index]);
	});
	
	that.pre.attr('src', that.preURL);
	that.main.attr('src', that.url);
	
	return that;
}

AsyncImage.prototype.drawImage = function(img)
{
	console.log('drawImage ['+this.index+'] @ '+this.pos);
	var that = this;
	if(that.raster)
	{
		that.raster.remove();
	}
	that.raster = new paper.Raster(img);
	var r = that.raster.getBounds();
	r.setCenter(that.pos);
	that.raster.setBounds(r);
// 	that.raster.fitBounds(paper.view.bounds, false);
	paper.view.draw();
}

AsyncImage.prototype.show = function()
{
	var that = this;
	if(that.loaded)
	{
		that.drawImage(that.main[0]);
	}
	else
	{
		if(that.preloaded)
		{
			that.drawImage(that.pre[0]);
			that.container.on('load_complete', function(event, idx){
				if(idx == that.index)
				{
					that.show();
				}
			});
		}
		else
		{
			that.container.on('preload_complete', function(event, idx){
				if(idx == that.index)
				{
					that.show();
				}
			});
		}
	}
	return that;
}

AsyncImage.prototype.lookup = function(idx)
{
	var ret = this;
	while(ret)
	{
		if(ret.index == idx)
			return ret;
		ret = ret.next;
	}
	return undefined;
}


function son_load_image(id)
{
	jQuery.getJSON('element/'+id+'/',function(data){
// 		jQuery('body').append('<image src="'+data.src+'" />');
		var son_asi = new AsyncImage(son_placeholder, data.src, son_img_container, id, new paper.Point(canvas.width()/2,canvas.height()/2));
		son_asi.load().show();
		son_gal_images.push_back(son_asi);
	});
}

function son_canvas_mup(e)
{
	
}

function son_canvas_mdown(e)
{
	
}

function son_canvas_mdrag(e)
{
	
}

function son_init_paper()
{
	canvas = jQuery('<canvas />');
	var w = jQuery(window);
	canvas.attr('width', w.width()+'px');
	canvas.attr('height', w.height()+'px');
// 	canvas.css({width:w.width()+'px', height:w.height()+'px'});
	
	son_img_container = jQuery('<div />');
	son_img_container.css('display', 'none');
	
	jQuery('body').append(canvas).append(son_img_container);
	
	paper.setup(canvas[0]);
	son_tools = new paper.Tool();
	son_tools.onMouseUp = son_canvas_mup;
	son_tools.onMouseDown = son_canvas_mdown;
	son_tools.onMouseDrag = son_canvas_mdrag;
}

function son_init()
{
	son_init_paper();
	jQuery.getJSON('elements/',function(data){
		var d = data;
		var c = d.length;
		for(var i=0; i < c; i++)
		{
			el = d[i];
			if(el.type == 'image' || el.type == 'symbol')
				son_load_image(el.id);
		}
	});
}

jQuery(document).ready(son_init);