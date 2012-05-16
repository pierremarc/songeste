"""
***
"""
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from songeste.mapo.models import * 
import json



def element(request):
	ret = {}
	etype = request.POST['t']
	t = Element()
	
	if request.FILES['record']:
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
				
			
	return HttpResponse(json.dumps(ret), mimetype='application/json')
	
	
def relation(request):
	t = request.POST['t']
	s = request.POST['s']
	c = request.POST['c']
	r = Relation.objects.create(target=Element.objects.get(pk=t), source=Element.objects.get(pk=s), cardinal=c)
	r.save()
	r.reverse().save()
	return HttpResponse(json.dumps({'success':'OK'}), mimetype='application/json')
	
@csrf_exempt
def handle(request, name):
	#print('NEW.HANDLE: %s'%(name,))
	if name == 'element':
		if request.POST:
			return element(request)
		form = []
		form.append({'enc':'multipart/form-data','t':'image', 'i':[('file','image')]})
		form.append({'enc':'multipart/form-data','t':'symbol', 'i':[('file','symbol')]})
		#form.append({'enc':'multipart/form-data','t':'record', 'i':[('file','record')]})
		form.append({'enc':'multipart/form-data','t':'location', 'i':[('text','lon'),('text','lat')]})
		return render_to_response("new.html", {'form':form}, context_instance = RequestContext(request))
	elif name == 'relation':
		if request.POST:
			return relation(request)
		elems = Element.objects.all()
		return render_to_response("newrel.html", {'elems':elems}, context_instance = RequestContext(request))
	else:
		raise Http404
	
	
	
	
	