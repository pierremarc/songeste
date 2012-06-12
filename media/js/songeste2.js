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
        this.prepareSpiralSeries(1, Math.min(jQuery(window).width() / 2,jQuery(window).height() / 2));
    
    var that = this;
        jQuery.getJSON('element/'+id+'/',function(elem){
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
Son.Item.prototype.Card = {'N':90, 'E':180, 'S':270, 'W':0}

Son.Item.prototype.RelInv = {'N':'S', 'E':'W', 'S':'N', 'W':'E'}

Son.Item.prototype.load = function()
{
        var that = this;
        jQuery.getJSON('relations/'+this.id+'/', function(relations)
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
    
    var cardn = this.Card.length ;
    var istep = 360 / (2 * cardn);
    for(var c in this.Card)
    {
        Son.Item.prototype.series[c] = new Array();
        
        var val = this.Card[c];
        var min = (val - istep) * Son.DEG_TO_RAD;
        var max = (val + istep) * Son.DEG_TO_RAD;
        
        var r = 0; // radial
        var t = 0; // angular
        var x = 0;
        var y = 0;
        while(r < r_limit)
        {
            if(t < min || t > max)
            {
                var adv = min - t;
                t = min;
                r += adv * t_factor;
            }
            t += 1;
            r += t_factor;
            if(t > 400)
                t -= 400;
            x = Math.floor(r * Math.cos(t));
            y = Math.floor(r * Math.sin(t));
            Son.Item.prototype.series[c].push([x,y]);
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

Son.Item.prototype.rootify = function()
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
}


Son.Item.prototype.layout = function(with_children)
{
//     this.valid_layout = false;
//     console.log('Layout : '+ this.id);
    if(this.parent)
    {
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
        
        console.log('Level = '+this.level()+'; Scale = ' + scale
            +'\n\t ow = '+this.parent.layout_rect.width()+' ; sw = '+trect.width()
            +'\n\t oh = '+this.parent.layout_rect.height()+' ; sh = '+trect.height());
        
        // then we run through our directed slice of spiral to find a position
        var origx = trect.left();
        var origy = trect.top();
        for(var si = 0; si < this.series[this.relation].length; si++)
        {
//             console.log('TRECT : '+trect.left()+' '+trect.top());
            if(!Son.RC.intersects(trect, this.id))
            {
                break;
            }
            
            trect.move(
                origx + this.series[this.relation][si][0],
                origy + this.series[this.relation][si][1]
            );
        }
        this.layout_rect = trect;
    }
    else
    {
        // center on the page
        var w = jQuery(window);
        var wh = w.height();
        var ww = w.width();
        var x = (ww / 2) - (this._rect.width()/2);
        var y = (wh / 2) - (this._rect.height()/2);
        
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
            that.rootify();
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
                ready: function(){Son.player_ready = true;}
        });
}


function son_start(id)
{
        if(id == undefined)
        {
                jQuery.getJSON('elements/',function(data){
                        var d = data;
                        var c = d.length;
                        Son.RC = new Son.ElemCollection(c);
                        var ridx = Math.floor((Math.random()*c));
                        window.Son.RootElement = new Son.Item(d[ridx].id);
                        
                });
        }
        else
        {
                if(window.Son.RootElement._media_playing)
                {
                        window.Son.RootElement.media_pause();
                }
                window.Son.RootElement = new Son.Element(id, 1);
        }
}

function son_init()
{
        son_init_jplayer();
        son_start();
        
        $(document).bind('collection_complete', function(e)
        {
           window.Son.RootElement.show();
        });
}

jQuery(document).ready(son_init);