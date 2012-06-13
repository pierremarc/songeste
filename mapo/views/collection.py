"""
***
"""
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response redirect
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from songeste.mapo.models import * 
import songest.mapo.views.home as mapo_home
import json


def c_all(request):
	r = []
	for el in Collection.objects.all():
		r.append(el.name)
	return render_to_response("comp_list.html", {'compositions':r}, context_instance = RequestContext(request))
	
	
@csrf_exempt
def save(request):
	if 'n' in request.POST and 'c' in request.POST:
		col = Collection()
		col.name = request.POST['n']
		col.clist = request.POST['c']
		col.save()
		redirect(col)
		

	