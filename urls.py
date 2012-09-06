from django.conf.urls.defaults import patterns, include, url

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^elements/$', 'mapo.views.element.e_all'),
    url(r'^new/(?P<name>\w+)/', 'mapo.views.new.handle'),
    url(r'^element/(?P<elem>\d+)/$', 'mapo.views.element.e'),
    url(r'^relations/(?P<elem>\d+)/$', 'mapo.views.element.rel'),
    url(r'^compose/$', 'mapo.views.collection.save'),
    url(r'^compositions/$', 'mapo.views.collection.c_all'),
    url(r'^composition/(?P<composition>\d+)/$', 'mapo.views.collection.view'),
    url(r'^$/?', 'mapo.views.home.handle'),
    

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    url(r'^admin/', include(admin.site.urls)),
)
