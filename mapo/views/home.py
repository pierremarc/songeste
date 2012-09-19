"""
***
"""
from django.http import HttpResponse, Http404
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from songeste.mapo.models import * 
from django.conf import settings
import json


def handle(request):
    param = {'home':True}
    if 'c' in request.GET:
        comp = request.GET['c'].split(',')
        param['comp'] = comp
    else:
        try:
            param['comp'] = [settings.DEFAULT_COMP]
        except Exception:
            pass
    return render_to_response("home.html", param, context_instance = RequestContext(request))