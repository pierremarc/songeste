"""
***
"""
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from songeste.mapo.models import * 
import json
from PIL import Image as PImage


def element(request):
	ret = {}
	etype = request.POST['t']
	t = Element()
	
	if 'record' in request.FILES:
		t.rec = request.FILES['record']
	
	t.etype = etype
	if etype != 'location':
		if request.FILES[etype]:
			f = request.FILES[etype]
			impl = None
			ff = None
			if etype == 'image':
				impl = Image()
				ff = impl.drawing
			if etype == 'symbol':
				impl = Symbol()
				ff = impl.picture
			#if etype == 'record':
				#impl = Record()
				#ff = impl.rec
			
			
			t.save()
			impl.element_id = t.id
			ff.save(f.name, f)
			impl.save()
	else:
		l = Location()
		l.lon = request.POST['lon']
		l.lat = request.POST['lat']
		t.location = l
		t.save()
		
	if etype == 'image':
		im = PImage.open(t.image.drawing.path)
		im.thumbnail((300,300), PImage.ANTIALIAS)
		im.save(t.image.drawing.path)
				
			
	return HttpResponse(json.dumps(ret), mimetype='application/json')
	
	
def relation(request):
	a = request.POST['a']
	t = request.POST['t']
	s = request.POST['s']
	c = None
	error = 'Unknown'
	if 'c' in request.POST:
		c = request.POST['c']
	if a == 'new':
		try:
			r = Relation.objects.create(target=Element.objects.get(pk=t), source=Element.objects.get(pk=s), cardinal=c)
			r.save()
			r.reverse().save()
			return HttpResponse(json.dumps({'success':'OK'}), mimetype='application/json')
		except Exception as e:
			error = '%s'%e 
	elif a == 'del':
		try:
			source = Element.objects.get(pk=s)
			rels = source.source.filter(target=t)
			for  r in rels:
				r.delete()
			source.save()
			return HttpResponse(json.dumps({'success':'OK'}), mimetype='application/json')
		except Exception as e:
			error = '%s'%e 
		
	return HttpResponse(json.dumps({'error':error}), mimetype='application/json')
	
@csrf_exempt
def handle(request, name):
	#print('NEW.HANDLE: %s'%(name,))
	if name == 'element':
		if request.POST:
			element(request)
		#form = []
		#form.append({'enc':'multipart/form-data','t':'image', 'i':[('file','image')]})
		#form.append({'enc':'multipart/form-data','t':'symbol', 'i':[('file','symbol')]})
		#form.append({'enc':'multipart/form-data','t':'record', 'i':[('file','record')]})
		#form.append({'enc':'multipart/form-data','t':'location', 'i':[('text','lon'),('text','lat')]})
		#return render_to_response("new.html", {'form':form}, context_instance = RequestContext(request))
		elems = Element.objects.all()
		return render_to_response("newrel.html", {'elems':elems, 'cards':REL_CARD_NAMES}, context_instance = RequestContext(request))
	elif name == 'relation':
		if request.POST:
			if 'a' in request.POST:
				if request.POST['a'] == 'res':
					element(request)
				else:
					return relation(request)
		elems = Element.objects.all()
		return render_to_response("newrel.html", {'elems':elems, 'cards':REL_CARD_NAMES}, context_instance = RequestContext(request))
	else:
		raise Http404
	
	
	
	
	