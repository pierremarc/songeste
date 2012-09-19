/**
 *
 * songeste.js 
 * 
 * author: Pierre Marchand <pierremarc07@gmail.com>
 * 
 * date: 2012-04-16
 * 
 */


window.Son = window.Son || {};

Son.DEG_TO_RAD = 0.0174532925199432958
Son.CIRCLE_ANGLE_RAD = Math.PI * 2 

var dbg_pixel={'R':'http://127.0.0.1/~pierre/songeste/songeste/media/dbgpixel.png',
    'O':'http://127.0.0.1/~pierre/songeste/songeste/media/dbgpixel0.png',
    'J':'http://127.0.0.1/~pierre/songeste/songeste/media/dbgpixel1.png',
    'V':'http://127.0.0.1/~pierre/songeste/songeste/media/dbgpixel2.png',
    'B':'http://127.0.0.1/~pierre/songeste/songeste/media/dbgpixel3.png',
    'L':'http://127.0.0.1/~pierre/songeste/songeste/media/dbgpixel4.png'
}

Son.ElemCollection = function(sz)
{
        this._array = new Array();
        this._array_sz = sz;
        this._cn = 0;
}

Son.ElemCollection.prototype.push = function(elem)
{
        this._array.push(elem);
        this._cn++;
        if(this._cn == this._array_sz)
        {
            var e = jQuery.Event("collection_complete", { array_len: this._array_sz});
            jQuery(document).trigger(e);
        }
}

Son.ElemCollection.prototype.get = function(id)
{
        for(var i = 0; i < this._array.length; i++)
        {
                if(this._array[i].id === id)
                        return this._array[i];
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
                && this._array[i].valid_layout
                    && rect.intersects(this._array[i].layout_rect))
                    return true;
    }
    return false;
}

Son.ElemCollection.prototype.clear = function()
{
        this._array = new Array();
}

Son.ElemCollection.prototype.run = function(cb)
{
    for(var i = 0; i < this._array.length; i++)
    {
        cb.apply(this._array[i]);
    }
}

Son.Item = function(id, parent, relation)
{
    this.id = id;
    this.parent = parent;
    this.relation = relation;
    this.children = new Array();
    this.valid_layout = false;
    Son.RC.push(this);
    
    if(this.series == undefined)
        this.prepareSpiralSeries(.1, Math.max(jQuery(window).width() ,jQuery(window).height() ));
    
    var that = this;
        jQuery.getJSON('/element/'+id+'/',function(elem){
                that._src = elem.src;
//                 that._src_size = {width:elem.width, height:elem.height};
                that._rect = new Son.Rect(0,0,elem.width, elem.height);
                if(elem.rec)
                {
                        that._media = elem.rec;
                }
                that.layout();
                that.load();
        });
}

// in polar coordinates angle 
Son.Item.prototype.Card = {'R':90, 'O':150, 'J':210, 'V':270, 'B':330 , 'L':30}
Son.Item.prototype.CardSize = 4;

Son.Item.prototype.RelInv = {'R':'V', 'O':'B', 'J':'L', 'V':'R', 'B':'O', 'L':'J'}

Son.Item.prototype.load = function()
{
        var that = this;
        jQuery.getJSON('/relations/'+this.id+'/', function(relations)
        {
                for(var j = 0; j < relations.length; j++)
                {
                        var rel = relations[j];
                        var rdbg = Son.RC.get(rel.id);
                        if(!rdbg)
                        {
                                that.children.push(new Son.Item(rel.id, that, rel.cardinal));
                        }
                        
                }
        });
}


Son.Item.prototype.prepareSpiralSeries = function(t_factor, r_limit)
{
    Son.Item.prototype.series = new Object();
    
    var cardn = this.CardSize ;
    var istep = 360 / (2 * cardn);
    for(var c in this.Card)
    {
        Son.Item.prototype.series[c] = new Array();
        
        var val = this.Card[c];
        var min = (val - istep) * Son.DEG_TO_RAD;
        var max = (val + istep) * Son.DEG_TO_RAD;
        
        if(min < 0)
        {
            min = Son.CIRCLE_ANGLE_RAD + min;
        }
        
        
        var r = 0; // radial
        var t = 0; // angular
        var x = 0;
        var y = 0;
        while(r < r_limit)
        {
//             if(t < min && t > max)
//             {
//                 var adv = min - t;
//                 t = min;
//                 r += adv * t_factor;
//             }
            t += Son.DEG_TO_RAD;
            r += t_factor;
            if(t > Son.CIRCLE_ANGLE_RAD)
                t = 0;
            if(min < max)
            {
                if(t > min && t <= max)
                {
                    x = Math.floor(r * Math.cos(t));
                    y = Math.floor(r * Math.sin(t));
                    Son.Item.prototype.series[c].push([x,y]);
                }
            }
            else
            {
                 if(t < max || t > min)
                {
                    x = Math.floor(r * Math.cos(t));
                    y = Math.floor(r * Math.sin(t));
                    Son.Item.prototype.series[c].push([x,y]);
                }
            }
        }
        
    }
}


Son.Item.prototype.level = function()
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

Son.Item.prototype.removeChild = function(id)
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

Son.Item.prototype.rootify = function(trigger)
{
    Son.RC.run(function(){this.valid_layout = false});
    
    var np = this;
    var rp = this.parent;
    while(rp != undefined)
    {
        var nextparent = rp.parent;
        rp.removeChild(np.id);
        rp.parent = np;
        np.children.push(rp);
        rp.relation = this.RelInv[np.relation];
       
        np = rp;
        rp = nextparent;
        
    }
    
    this.parent = undefined;
    Son.RootElement = this;
    this.layout(true);
    this.show();
    if(trigger)
    {
        var e = jQuery.Event("item_root", {item:this});
        jQuery(document).trigger(e);
    }
}


Son.Item.prototype.layout = function(with_children)
{
    var w = jQuery(window);
    var wh = w.height();
    var ww = w.width();
    var winrect = new Son.Rect(0,0,ww,wh);
    console.log('L '+this.id);
    if(this.parent)
    {
//         return;
        if(!this.parent.valid_layout)
        {
            console.log('Invalid parent layout '+this.id);
            var that = this;
            window.setTimeout(function(){that.layout(with_children);}, 500);
            return;
        }
        var scale = 1/(this.level());
        
        // we start with parent position
        var trect = new Son.Rect(
            this.parent.layout_rect.left(),this.parent.layout_rect.top(),
            this._rect.width(), this._rect.height()
        );
        trect.scale(scale, trect.center());
//         jQuery('body').append('<div style="width:'+trect.width()+'px;height:'+trect.height()+'px;position:absolute;z-index:100;top:'
//                 +trect.top()+'px;left:'+trect.left()+'px;border:1px solid #999"> ' +this._src.split('/').pop()+ ' </div>');
// 
//         
        
//         console.log('Level = '+this.level()+'; Scale = ' + scale
//             +'\n\t ow = '+this.parent.layout_rect.width()+' ; sw = '+trect.width()
//             +'\n\t oh = '+this.parent.layout_rect.height()+' ; sh = '+trect.height());
        
        // then we run through our directed slice of spiral to find a position
        var origx = trect.left();
        var origy = trect.top();
//         console.log(this._src+' / '+this.relation+' / '+this.parent._src);
        
//             jQuery('body').append('<img src="'+dbg_pixel[this.relation]
//             +'" style="width:2px;height:2px;position:absolute;z-index:1000;top:'+trect.top()+'px;left:'+trect.left()+'px" />');
        for(var si = 0; si < this.series[this.relation].length; si++)
        {
//                 jQuery('body').append('<img src="'+dbg_pixel[this.relation]
//             +'" style="width:2px;height:2px;position:absolute;z-index:1000;top:'+trect.top()+'px;left:'+trect.left()+'px" />');
           
            if(!winrect.includes(trect))
            {
                if(trect.left() < winrect.left())
                    trect._x += winrect.left() - trect.left();
                else if(trect.right() > winrect.right())
                    trect._x -= trect.right() - winrect.right();
                
                if(trect.top() < winrect.top())
                    trect._y += winrect.top() - trect.top();
                else if(trect.bottom() > winrect.bottom())
                    trect._y -= trect.bottom() - winrect.bottom();
                
                break;
            }
           if(!Son.RC.intersects(trect, this.id) )
            {
                break;
            }
           
            
            trect.move(
                origx + this.series[this.relation][si][0],
                origy + this.series[this.relation][si][1]
            );
            
        }
        
        this.layout_rect = new Son.Rect(trect);
    }
    else
    {
        // center on the page
        
        var x = (ww / 2) - (this._rect.width()/2);
        var y = (wh / 2) - (this._rect.height()/2);
        
//         for(var rel in this.Card)
//         {
//             for(var si = 0; si < this.series[rel].length; si++)
//             {
//                 jQuery('body').append('<img src="'+dbg_pixel[rel]
//             +'" style="width:2px;height:2px;position:absolute;z-index:1000;top:'
//             +(y + this.series[rel][si][0])+'px;left:'+(x + this.series[rel][si][1])+'px" />');
//             }
//         }
        
        this.layout_rect = new Son.Rect( x,y, this._rect.width(),this._rect.height() );
        
        if(this._media && !this._media_playing)
        {
                this.media_play();
        }
    }
//     console.log('END layout :' +this.id);
    this.valid_layout = true;
    if(with_children == true)
    {
        for(var i = 0; i <this.children.length; i++)
        {
            this.children[i].layout(true);
        }
    }
}


Son.Item.prototype.show = function()
{
//     console.log('Show : '+this.id);
     if(!this.valid_layout)
    {
//         console.log('Invalid layout '+this.id);
        var that = this;
        window.setTimeout(function(){that.show();}, 500);
        return;
    }
    
    if(!this._elem)
    {
        var b = jQuery('body');
        
        var w = jQuery(window);
        var wh = w.height();
        var ww = w.width();
        var x = (ww / 2) - (this._rect.width()/2);
        var y = (wh / 2) - (this._rect.height()/2);
        
        var id = this.id;
        var w = this._rect.width();
        var h = this._rect.height();
        
        this._elem = jQuery('<img class="son-item" id="id_'+id+'" />');
        this._elem.css({
            position: 'absolute',
            left: x+'px',
            top: y+'px',
            width: w+'px',
            height: h+'px'
        });
        b.append(this._elem);
        var that = this;
        this._elem.on('load', function(e){that.show();});
        this._elem.attr('src',this._src);
        this._elem.on('click', function()
        {
            that.rootify(true);
		$(document).off($.jPlayer.event.ended);
        });
    }
    else
    {
        this._elem.animate({
            top:this.layout_rect.top(),
            left:this.layout_rect.left(),
            width:this.layout_rect.width(),
            height:this.layout_rect.height()
        },
            1600
        );
//         this._elem.css({
//             top:this.layout_rect.top(),
//             left:this.layout_rect.left(),
//             width:this.layout_rect.width(),
//             height:this.layout_rect.height()
//         });
    }
    
      
    for(var i = 0; i <this.children.length; i++)
    {
            this.children[i].show();
    }
}


Son.Item.prototype.media_play = function()
{
    console.log('media_play '+this.id);
        if(!Son.player_ready)
        {
                console.log('Player not ready');
                var that = this;
                window.setTimeout(function(){that.media_play();}, 500);
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
}

Son.Item.prototype.media_pause = function()
{
        var player = Son.Player;
        player.jPlayer('pause');
        this._media_playing = false;
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
                cssSelectorAncestor:'',
                cssSelector:{
                play: "#player-play",
                pause: "#player-pause"
                }
        });
}


function son_share_composition_widget(e)
{
	var widget = jQuery('<div id="share_widget" class="widget"><h4>Composition name</h4></div>');
	var close = jQuery('<div id="share_close_widget"> close </div>');
	var input = jQuery('<input id="share_input_name" type="text" />');
	var submit = jQuery('<div id="share_submit_button">record</div>');
	
	close.on('click', function(){widget.remove();});
	
	jQuery('body').append(widget);
	widget.append(close);
	widget.append(input);
	widget.append(submit);
	submit.on('click', function(e){
		var name = input.val();
		var comp_a = [];
		for(var i = 0; i < Son.composition_array.length; i++)
		{
			comp_a.push(Son.composition_array[i].id);
		}
		var comp = comp_a.join(',');
		jQuery.post('/compose/', { n:name, c:comp }, function(data){
			widget.append('<div class="composition-link">Link to your composition: <a href="'+data.url+'">'+input.val()+'</a></div>');
			submit.remove();
		}, 'json');
	});
}

function son_update_composition(e)
{
    var item = e.item;
    if(!item.valid_layout)
    {
        window.setTimeout(function(){son_update_composition(e);}, 500);
        return;
    }
    if(Son.composition_box == undefined)
    {
        Son.composition_box = jQuery('<div id="composition-box" />');
	Son.composition_list_box = jQuery('<div id="composition-list-box" />');
	Son.composition_share_box = jQuery('<div id="composition-share-box" />');
	Son.composition_share = jQuery('<div id="composition-share">share</div>');
	
	Son.composition_box.append(Son.composition_list_box);
	Son.composition_share_box.append(Son.composition_share);
	Son.composition_box.append(Son.composition_share_box);
        jQuery('body').append(Son.composition_box);
        Son.composition_array = new Array();
	
	Son.composition_share.on('click',  son_share_composition_widget);
    }
    for(var i = 0; i < Son.composition_array.length; i++)
    {
	if(Son.composition_array[i].id === item.id)
		return;
    }
    Son.composition_array.push(item);
    var ielem = jQuery('<div class="composition-item" id="composition-item-'+Son.composition_array.length+'"></div>');
    var ih = 32;
    var iw = item._rect.width() * ih / item._rect.height();
    var iimg = jQuery('<img src="'+item._src+'" width="'+iw+'" height="'+ih+'" />');
    ielem.on('click', function(){
        item.rootify(false);
        $(document).off($.jPlayer.event.ended);
    });
    ielem.append(iimg);
    Son.composition_list_box.append(ielem);
}


function son_start(id)
{    
    jQuery.getJSON('/elements/',function(data){
            var d = data;
            var c = d.length;
            Son.RC = new Son.ElemCollection(c);
            var ridx = id ;
            if(id == undefined)
                ridx = d[Math.floor((Math.random()*c))].id;
            window.Son.RootElement = new Son.Item(ridx);
	    
	    window.Son.RootElement.show();
            son_update_composition({item:window.Son.RootElement});
    });
}


function son_init()
{
        son_init_jplayer();
	
// 	  $(document).bind('collection_complete', function(e)
//         {
//            window.Son.RootElement.show();
//            son_update_composition({item:window.Son.RootElement});
//             
//         });
// 	  
        if(window.son_composition == undefined)
            son_start();
        else
        {
            var id = son_composition.shift();
            $(document).on($.jPlayer.event.ended, function(e){
                if(son_composition.length > 0)
                {
                    var n = son_composition.shift();
                    var ne = Son.RC.get(n);
                    ne.rootify(true);
                }
            });
            son_start(id);
        }
        
      
        
        $(document).bind('item_root', son_update_composition);
}

jQuery(document).ready(son_init);