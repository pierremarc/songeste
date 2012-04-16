"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from mapo.models import *

import random

class RelTest(TestCase):
	def simple(self):
		"""
		Test
		"""
		t = Element()
		t.location = Location()
		t.location.lat = random.random()
		t.location.lon = random.random()
		t.location.name = 'a name'
		t.save()
		print('Element(%d) has Location(%d)'%(t.id,t.location.id,))
        
	def rel(self):
		t = Element()
		t.location = Location()
		t.location.lat = random.random()
		t.location.lon = random.random()
		t.location.name = 'a name'
		t.save()
		t2 = Element()
		t2.location = Location()
		t2.location.lat = random.random()
		t2.location.lon = random.random()
		t2.location.name = 'another name'
		t2.save()
		
		r = Relation.objects.create(source=t, target=t2, cardinal='N')
		r.save()
		
		print('Source(%d) = %s => Target(%d)'%(r.source.id, r.cardinal ,r.target.id,))
		rr = r.reverse()
		print('Source(%d) = %s => Target(%d)'%(rr.source.id, rr.cardinal ,rr.target.id,))
	    
        
        
