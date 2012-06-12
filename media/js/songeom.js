/**
 *
 * songeom.js 
 * 
 * author: Pierre Marchand <pierremarc07@gmail.com>
 * 
 * date: 2012-04-16
 * 
 */

window.Son = window.Son || {};




Son.Matrix = function()
{
    var padding = -1;
    this.m = 
    [[padding],
     [padding, 1,0,0],
     [padding, 0,1,0],
     [padding, 0,0,1]]
}

Son.Matrix.prototype.mul = function(o)
{
    var product = new Son.Matrix();
    for (var x = 1; x<4; ++x)
    {
        for (var y = 1; y<4; ++y)
        {
                var sum = 0;
                for (var z = 1; z<4; ++z)
                        sum += this.m[x][z] * o.m[z][y];
                product.m[x][y] = sum;
        }
    }
    this.m = product.m;
    return this;
}

Son.Transform = function()
{
    this.m = new Son.Matrix(); 
}

Son.Transform.prototype.translate = function(tx,ty)
{
    var transMat = new Son.Matrix();
    transMat.m[3][1] = tx;
    transMat.m[3][2] = ty;
    this.m.mul(transMat);
    return this;
}

Son.Transform.prototype.scale = function(sx, sy, origin)
{
    var scaleMat = new Son.Matrix();
    if(origin != undefined)
    {
        var tr1 = new Son.Matrix();
        tr1.m[3][1] = -origin.x;
        tr1.m[3][2] = -origin.y;
        scaleMat.mul(tr1);

        var tr2 = new Son.Matrix();
        tr2.m[1][1] = sx;
        tr2.m[2][2] = sy;
        scaleMat.mul(tr2);

        var tr3 = new Son.Matrix();
        tr3.m[3][1] = origin.x;
        tr3.m[3][2] = origin.y;
        scaleMat.mul(tr3);
    }
    else
    {
        scaleMat.m[1][1] = sx;
        scaleMat.m[2][2] = sy;
    }
    this.m.mul(scaleMat);
    return this;
}

Son.Transform.prototype.mapPoint = function(p)
{
    var rx = p.x * this.m.m[1][1] + p.y * this.m.m[2][1] + this.m.m[3][1];
    var ry = p.x * this.m.m[1][2] + p.y * this.m.m[2][2] + this.m.m[3][2];

    p.x = rx;
    p.y = ry;
}

Son.Transform.prototype.mapRect = function(r)
{
    var tl = r.topleft();
    var br = r.bottomright();
    this.mapPoint(tl);
    this.mapPoint(br);
    r._x = tl.x;
    r._y = tl.y;
    r._width = br.x - tl.x;
    r._height = br.y - tl.y;
}

Son.Point = function(x, y)
{
        if(x instanceof Son.Point)
        {
                this.x = x.x;
                this.y = x.y;
        }
        else
        {
                this.x = x;
                this.y = y;
        }
}

Son.Point.prototype.scale = function(sx, sy)
{
        var gsy = sx;
        if(sy != undefined)
                gsy = sy;
        this.x = this.x * sx;
        this.y = this.y * gsy;
        return this;
}

Son.Point.prototype.toString = function()
{
        return " [ " +this.x + " ; " +this.y + " ] ";
}


Son.Rect = function(left, top, width, height)
{
        if(left instanceof Son.Rect)
        {
                this._x = left._x;
                this._y = left._y;
                this._width = left._width;
                this._height = left._height;
        }
        else
        {
                this._x = left;
                this._y = top;
                this._width = width;
                this._height = height;
        }
}

Son.Rect.prototype.top = function()
{return this._y;}
Son.Rect.prototype.left = function()
{return this._x;}
Son.Rect.prototype.width = function()
{return this._width;}
Son.Rect.prototype.height = function()
{return this._height;}
Son.Rect.prototype.right = function()
{return this._x + this._width;}
Son.Rect.prototype.bottom = function()
{return this._y + this._height;}
Son.Rect.prototype.center = function()
{return (new Son.Point(this._x + (this._width / 2), this._y + (this._height / 2)));}
Son.Rect.prototype.topleft = function()
{return (new Son.Point(this._x , this._y ));}
Son.Rect.prototype.topright = function()
{return (new Son.Point(this._x + this._width , this._y ));}
Son.Rect.prototype.bottomleft = function()
{return (new Son.Point(this._x , this._y + this._height ));}
Son.Rect.prototype.bottomright = function()
{return (new Son.Point(this._x + this._width, this._y + this._height));}
Son.Rect.prototype.translate = function(dx, dy)
{this._x += dx; this._y += dy;}
Son.Rect.prototype.move = function(x, y)
{this._x = x; this._y = y;}

Son.Rect.prototype.intersects = function(r) 
{
        return (this.left() <= r.right() &&
        r.left() <= this.right() &&
        this.top() <= r.bottom() &&
        r.top() <= this.bottom());
}

Son.Rect.prototype.scale = function(s, o)
{
    var t = new Son.Transform();
    t.scale(s,s, o);
    t.mapRect(this);
    return this;
}

