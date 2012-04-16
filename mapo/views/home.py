"""
***
"""
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from songeste.mapo.models import * 
import json


def handle(request):
	return render_to_response("home.html", {'home':True}, context_instance = RequestContext(request))