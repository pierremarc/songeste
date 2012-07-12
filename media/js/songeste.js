/**
 *
 * songeste.js 
 * 
 * author: Pierre Marchand <pierremarc07@gmail.com>
 * 
 * date: 2012-04-16
 * 
 */

window.Son = {};

Son.Canvas = undefined;

Son.ElemCollection = function()
{
	this._array = new Array();
	this._index = new Array();
}

Son.ElemCollection.prototype.push = function(elem)
{
	this._array.push(elem);
	this._index.push({id:elem.id, idx:this._array.length - 1});
	var e = jQuery.Event("elem_added", { array_len: this._array.length, elem_id:elem.id });
	jQuery(document).trigger(e);
}

Son.ElemCollection.prototype.get = function(id)
{
	for(var i = 0; i < this._index.length; i++)
	{
		if(this._index[i].id === id)
			return this._array[this._index[i].idx];
	}
	return null;
}

Son.ElemCollection.prototype.getData = function()
{
	return this._array;
}

Son.ElemCollection.prototype.intersects = function(rect, self)
{
	for(var i = 0; i < this._array.length; i++)
	{
		if(this._array[i].id != self
			&& rect.intersects(this._array[i]._raster.bounds))
			return true;
	}
	return false;
}

Son.ElemCollection.prototype.clear = function()
{
	this._array = new Array();
	this._index = new Array();
}

Son.RC = new Son.ElemCollection();

Son.Element = function(id, level, parent, relation)
{
	console.log('Element: '+id);
	this.id = id;
	this.parent = (parent != undefined) ? parent : null;
	this.relation = (parent != undefined) ? relation : null;
	this.children = new Array();

	this._src = null;
	this._type = 'none';
	this._media = null;
	
	this._loaded = false;
	this._media_playing = false;
	
	var that = this;
	jQuery.getJSON('element/'+id+'/',function(elem){
		that._src = elem.src;
		that._type = elem.type;
		if(elem.rec)
		{
			that._media = elem.rec;
		}
		that._load0();
	});
}

Son.Element.prototype.level = function()
{
	var ret = 1;
	var p = this.parent;
	while(p)
	{
		ret +=1;
		p = p.parent;
	}
	return ret;
}

Son.Element.prototype.removeChildren = function(id)
{
	var cidx = -1;
	var ret = null;
	for(var i = 0; i < this.children.length; i++)
	{
		if(this.children[i].id == id)
		{
			cidx = i;
			ret = this.children[i];
			break;
		}
	}
	if(cidx >= 0)
	{
		this.children.splice(cidx,1);
	}
	return ret;
}


Son.Element.prototype._load0 = function()
{
// 	if(this._type != 'record')
// 	{
		var that = this;
		this.img = jQuery('#cont_img_' + this.id);
		if(this.img.length == 0)
		{
			this.img = jQuery('<img id="cont_img_'+ this.id +'" src="" />');
			Son.ImgContainer.append(this.img);
			this.img.on('load', function(e){
				that._load1();
			});
			this.img.attr('src', this._src);
		}
		else
		{
			that._load1();
		}
// 	}
// 	else
// 	{
// 		this.img = Son.MediaPlayerImg;
// 		this._load1();
// 	}
}

Son.Element.prototype._load1 = function()
{
	this._raster = new paper.Raster(this.img[0]);
	this._loaded = true;
	Son.RC.push(this);
	var that = this;
	if(this._type == 'record')
	{
		this._raster.attach('click', function(){
			if(that._media_playing)
				that.media_pause();
			else
				that.media_play();
		})
		
	}
	else
	{
		this._raster.attach('click', function(){
			if(that.level() > 1)
			{
				son_start(that.id);
			}
		})
	}
	jQuery.getJSON('relations/'+this.id+'/',function(relations){
		for(var j = 0; j < relations.length; j++)
		{
			var rel = relations[j];
			var rdbg = Son.RC.get(rel.id);
			if(!rdbg)
			{
				console.log('Relation('+that.id+'): '+rel.id+'('+rel.cardinal+')')
				that.children.push(new Son.Element(rel.id, that.level + 1, that, rel.cardinal));
			}
			
		}
	});
}

Son.Element.prototype.show = function()
{
	if(this.parent)
	{
		var bbp = this.parent._raster.bounds;
		var deltaX = 0;
		var deltaY = 0;
		var iSize = this._raster.size;
		var scale = 1/(this.level() );
		var unitVer = (bbp.height/2) /*+ ((iSize.height/2)*scale)*/;
		var unitHor = (bbp.width/2) /*+ ((iSize.width/2)*scale)*/;
		if(this.relation == 'N')
			deltaY = -unitVer;
		else if(this.relation == 'E')
			deltaX =  unitHor;
		else if(this.relation == 'S')
			deltaY = unitVer;
		else if(this.relation == 'W')
			deltaX = -unitHor;
		var p = new paper.Point(bbp.center.x + deltaX, bbp.center.y + deltaY);
		var r = new paper.Rectangle(this.parent._raster.bounds);
		
		var res0 = new paper.Rectangle(0,0, this._raster.width, this._raster.height);
		res0.setCenter(p);
		var res = res0.scale(scale);
		
		console.log('SHOW('+this.id+', '+this.relation+') => '+res.center);
		while(Son.RC.intersects(res, this.id))
		{
			if(this.relation == 'N')
				res.center.y -= 2;
			else if(this.relation == 'E')
				res.center.x += 2;
			else if(this.relation == 'S')
				res.center.y += 2;
			else if(this.relation == 'W')
				res.center.x -= 2;
// 			console.log('MOVED => '+res.center);
		}
		this._raster.setBounds(res);
	}
	else
	{
		this._raster.bounds.center = new paper.Point(Son.Canvas.width() /2, Son.Canvas.height() /2);
		if(this._media && !this._media_playing)
		{
			this.media_play();
		}
	}
	
	paper.view.draw();
	
	for(var i = 0; i <this.children.length; i++)
	{
		this.children[i].show();
	}
}


Son.Element.prototype.media_play = function()
{
	if(!Son.player_ready)
	{
		alert('Player not ready');
		return;
	}
	// check if there's another media playing, and stop it
	var elems = Son.RC.getData();
	for(var i = 0; i < elems.length; i++)
	{
		if(elems[i]._media_playing)
		{
			elems[i].media_pause();
			break; // should work
		}
	}
	var player = Son.Player;
	player.jPlayer('setMedia', { oga: this._media});
	player.jPlayer('play');
	this._media_playing = true;
// 	paper.view.attach('frame', this.media_animate);
}
Son.Element.prototype.media_pause = function()
{
	var player = Son.Player;
	player.jPlayer('pause');
	this._media_playing = false;
// 	paper.view.detach('frame', this.media_animate);
}
Son.Element.prototype.media_animate = function()
{
	var elems = Son.RC.getData();
	for(var i = 0; i < elems.length; i++)
	{
		if(elems[i]._media_playing)
		{
			elems[i]._raster.rotate(3);
			break; // should work
		}
	}
}

Son.Element.prototype.clear = function()
{
	if(this._raster)
		this._raster.remove();
	for(var i=0; i < this.children.length; i++)
	{
		this.children[i].clear();
	}
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
	window.Son.Canvas = jQuery('<canvas />');
	var w = jQuery(window);
	Son.Canvas.attr('width', w.width()+'px');
	Son.Canvas.attr('height', w.height()+'px');
	jQuery('body').append(Son.Canvas);
	
	Son.ImgContainer = jQuery('<div style="display:none"></div>');
	jQuery('body').append(Son.ImgContainer);
	
	paper.setup(Son.Canvas[0]);
// 	son_tools = new paper.Tool();
// 	son_tools.onMouseUp = son_canvas_mup;
// 	son_tools.onMouseDown = son_canvas_mdown;
// 	son_tools.onMouseDrag = son_canvas_mdrag;
}


function son_init_jplayer()
{
	window.Son.MediaPlayerImg = jQuery('<img src="'+son_placeholder+'" style="display:none" />');
	jQuery('body').append(Son.MediaPlayerImg);
	
	window.Son.Player = jQuery('<div style="width:0;height:0"></div>');
	jQuery('body').append(Son.Player);
	window.Son.player_ready = false;
	Son.Player.jPlayer({
		supplied: "oga",
		solution: "html,flash",
		swfPath: jplayerswf,
		errorAlerts: false,
		warningAlerts: false,
		ready: function(){Son.player_ready = true;},
// 		pause:function(e)
// 		{
// 			for(var i = 0; i < son_resource_array.length; i++)
// 			{
// 				if(son_resource_array[i].type == 'audio' &&  son_resource_array[i].playing)
// 				{
// 					son_resource_array[i].playing = false;
// 					paper.view.detach('frame', son_resource_array[i].animate);
// // 					break;
// 				}
// 			}
// 		}
	});
}


function son_start(id)
{
	if(id == undefined)
	{
		jQuery.getJSON('elements/',function(data){
			var d = data;
			var c = d.length;
			var ridx = Math.floor((Math.random()*c));
			window.Son.RootElement = new Son.Element(d[ridx].id, 1);
		});
	}
	else
	{
		if(window.Son.RootElement._media_playing)
		{
			window.Son.RootElement.media_pause();
		}
		Son.RC.clear();
		window.Son.RootElement.clear();
		window.Son.RootElement = new Son.Element(id, 1);
	}
}

function son_init()
{
	son_init_paper();
	son_init_jplayer();
	son_start();
	
	setInterval(function(){
		if(window.Son.RootElement)
			window.Son.RootElement.show();
	},1000);
	
	$(window).resize(function(e){
		var w = jQuery(window);
		Son.Canvas.attr('width', w.width()+'px');
		Son.Canvas.attr('height', w.height()+'px');
	});
}

jQuery(document).ready(son_init);