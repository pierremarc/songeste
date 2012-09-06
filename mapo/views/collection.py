"""
***
"""
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response, redirect
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from songeste.mapo.models import * 
import json

def view(request, composition):
	try:
		c = Collection.objects.get(pk=composition)
	except Collection.DoesNotExist:
		return Http404()
		
	param = {'home':True, 'comp':c.clist.split(',')}
	#return HttpResponse(json.dumps(param))
	return render_to_response("home.html", param, context_instance = RequestContext(request))
	

def c_all(request):
	r = []
	for el in Collection.objects.all():
		r.append(el)
	return render_to_response("comp_list.html", {'compositions':r}, context_instance = RequestContext(request))
	
	
@csrf_exempt
def save(request):
	if request.POST and 'n' in request.POST and 'c' in request.POST:
		col = Collection()
		col.name = request.POST['n']
		col.clist = request.POST['c']
		col.save()
		url = '/'.join(['','composition','%d'%col.id])
		return HttpResponse(json.dumps({'url':url}));
		

	