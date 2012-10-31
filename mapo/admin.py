from django.contrib import admin
from mapo.models import *


class ImageRelInline(admin.TabularInline):
    model = Image
    extra = 0

class ElementAdmin(admin.ModelAdmin):
    model = Element
    inlines = [ImageRelInline]

admin.site.register(Element, ElementAdmin)