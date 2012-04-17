"""
***
"""
from django.http import HttpResponse, Http404
from songeste.mapo.models import * 
from songeste.mapo.tilenames import tileURL, tileXY
import json



def e_all(request):
	r = []
	for el in Element.objects.all():
		rel = {'type':el.etype, 'id':el.id}
		tg = []
		sel = el.source.all()
		print(sel)
		for t in sel:
			#print(dir(t.target.get()))
			tt = t
			tg.append({'id':tt.target_id,'c':tt.cardinal})
		rel['target'] = tg
		r.append(rel)

	return HttpResponse(json.dumps(r), mimetype='application/json')
	
class SrcExtractor(object):
	def image(self, el):
		return {'src' : el.image.drawing.url}
	
	def symbol(self, el):
		return {'src' : el.symbol.picture.url}
	
	def record(self, el):
		return {'src' : el.record.rec.url}
		
	def location(self, el):
		z = 16
		x,y = tileXY(float(el.location.lon), float(el.location.lat), z)
		url = tileURL(x,y,z, 'mapquest')
		return {'src' : url}
		
		
	
def e(request, elem):
	el = None
	try:
		el = Element.objects.get(pk=elem)
	except DoesNotExist:
		raise Http404
	
	r = {}
	r['type'] = el.etype
	m = getattr(SrcExtractor(), el.etype)
	r['src'] = m(el)['src']
	return HttpResponse(json.dumps(r), mimetype='application/json')
	
def rel(request, elem):
	el = None
	try:
		el = Element.objects.get(pk=elem)
	except DoesNotExist:
		raise Http404
	
	r = []
	sel = el.source.all()
	for re in sel:
		r.append({'t':re.target_id, 'c':re.cardinal})
		
	return HttpResponse(json.dumps(r), mimetype='application/json')
	
		