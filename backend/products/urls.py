from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'packages', views.PackageViewSet, basename='package')
router.register(r'campaigns', views.CampaignViewSet, basename='campaign')

urlpatterns = [
    path('', include(router.urls)),
]
