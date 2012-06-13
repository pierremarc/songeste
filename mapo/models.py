from django.db import models

class Element(models.Model):
	class Meta:
		db_table = u'elements'
		
	etype = models.CharField(max_length=32, blank=False, choices=[['symbol','Symbol'],['location','Location'],['image','Image'],['record','Record']])
	relation = models.ManyToManyField("self", symmetrical=False, through='Relation')
	rec = models.FileField(upload_to='records')
	
	def __unicode__(self):
		if self.etype == 'symbol':
			return self.symbol.picture.name
		elif self.etype == 'image':
			return self.image.drawing.name
		elif self.etype == 'location':
			return 'lat:%f ; lon:%f'%(float(self.location.lat), float(self.location.lon))
	
	def save(self):
		impl = None
		try:
			impl = self.location
		except Location.DoesNotExist:
			pass
			
		try:
			impl = self.symbol
		except Symbol.DoesNotExist:
			pass
				
		try:
			impl = self.image
		except Image.DoesNotExist:
			pass
					
						
		if impl:
			self.etype = impl.tname
			
		super(Element, self).save()
		if impl:
			if not impl.element_id:
				impl.element_id = self.id
			impl.save()
		
	
class Image(models.Model):
	tname = 'image'
	height=models.PositiveIntegerField()
	width=models.PositiveIntegerField()
	drawing = models.ImageField(upload_to='drawings', height_field='height', width_field='width', )
	element = models.OneToOneField(Element)
	
class Symbol(models.Model):
	tname = 'symbol'
	picture = models.ImageField(upload_to='symbols')
	element = models.OneToOneField(Element)
	
class Location(models.Model):
	tname = 'location'
	lat = models.FloatField()
	lon = models.FloatField()
	name = models.CharField(max_length=128)
	element = models.OneToOneField(Element)
	
#class Record(models.Model):
	#tname = 'record'
	#rec = models.FileField(upload_to='records')
	#element = models.OneToOneField(Element)
	

	
	
REL_CARD_NAMES = [['R','Rouge'],['O','Orange']['J','Jaune'],['V','Vert'],['B','Bleu'],['L','Lilas']]
REL_CARD = ['R', 'O', 'J', 'V', 'B', 'L']

class Relation(models.Model):
	source = models.ForeignKey(Element, related_name='source')
	target = models.ForeignKey(Element, related_name='target')
	cardinal = models.CharField(max_length=32, blank=False, choices=REL_CARD_NAMES)
	
	def reverse(self):
		scidx = REL_CARD.index(self.cardinal)
		rev = len(REL_CARD) / 2
		rc = REL_CARD[scidx - rev]
		return Relation.objects.create(source=self.target, target=self.source, cardinal=rc)
		
		
class Collection(models.Model):
	name = models.CharField(max_length=128, blank=False)
	clist = models.CharField(max_length=256)