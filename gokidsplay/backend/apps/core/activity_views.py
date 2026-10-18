"""Admin → Activity Logs API (records made by apps/core/activity.py)."""
from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import AdminActivity
from .permissions import IsManagerOrAdmin


def _row(a: AdminActivity) -> dict:
    return {
        'id': a.id,
        'createdAt': a.created_at.isoformat(),
        'admin': {'name': a.user_name or a.user_email or 'Unknown', 'email': a.user_email},
        'action': a.action,
        'entity': a.entity,
        'entityId': a.entity_id,
        'summary': a.summary,
        'method': a.method,
        'path': a.path,
        'ipAddress': a.ip_address,
        'userAgent': a.user_agent,
        'details': a.details,
    }


@api_view(['GET'])
@permission_classes([IsManagerOrAdmin])
def activity_logs(request):
    """
    GET /api/v1/core/activity-logs/?search=&action=&entity=&user=&from=YYYY-MM-DD&to=YYYY-MM-DD&limit=200
    search matches the admin, what was changed, the record (e.g. GP105377) and the fields sent.
    """
    qs = AdminActivity.objects.all()
    p = request.query_params
    if p.get('search'):
        s = p['search'].strip()
        qs = qs.filter(Q(user_email__icontains=s) | Q(user_name__icontains=s) | Q(entity__icontains=s)
                       | Q(entity_id__icontains=s) | Q(summary__icontains=s) | Q(path__icontains=s)
                       | Q(details__icontains=s) | Q(ip_address__icontains=s))
    if p.get('action'):
        qs = qs.filter(action=p['action'])
    if p.get('entity'):
        qs = qs.filter(entity=p['entity'])
    if p.get('user'):
        qs = qs.filter(user_email__iexact=p['user'])
    if p.get('from'):
        qs = qs.filter(created_at__date__gte=p['from'])
    if p.get('to'):
        qs = qs.filter(created_at__date__lte=p['to'])
    try:
        limit = min(1000, max(1, int(p.get('limit') or 200)))
    except ValueError:
        limit = 200
    return Response({'count': qs.count(), 'results': [_row(a) for a in qs[:limit]]})


@api_view(['GET'])
@permission_classes([IsManagerOrAdmin])
def activity_stats(request):
    today = timezone.localdate()
    qs = AdminActivity.objects.all()
    return Response({
        'totalLogs': qs.count(),
        'logsToday': qs.filter(created_at__date=today).count(),
        'last7Days': qs.filter(created_at__gte=timezone.now() - timedelta(days=7)).count(),
        'failedLogins7Days': qs.filter(action='LOGIN_FAILED', created_at__gte=timezone.now() - timedelta(days=7)).count(),
        'actionsByType': list(qs.values('action').annotate(_count=Count('id')).order_by('-_count')),
        'entities': list(qs.values_list('entity', flat=True).distinct().order_by('entity')[:100]),
    })
