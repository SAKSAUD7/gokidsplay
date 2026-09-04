"""
Global Search API View.

Provides unified search endpoint for admin portal.
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .search_service import GlobalSearchService
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def global_search(request):
    """
    Global search across all admin modules.
    
    GET /api/v1/admin/search?q={query}
    
    Query params:
        - q: Search query (minimum 2 characters)
    
    Returns:
        {
            "results": [
                {
                    "type": "booking | user | payment | voucher | waiver | campaign | message",
                    "title": "Primary display text",
                    "subtitle": "Secondary context text",
                    "route": "/admin/path/to/resource"
                }
            ],
            "count": 10
        }
    
    Permissions:
        - Requires authentication
        - Results filtered by user role (RBAC)
    """
    try:
        # Get search query
        query = request.query_params.get('q', '').strip()
        
        # Validate query length
        if len(query) < 2:
            return Response({
                'results': [],
                'count': 0,
                'message': 'Query must be at least 2 characters'
            })
        
        # Execute search
        search_service = GlobalSearchService(request.user, query)
        results = search_service.search_all()
        
        logger.info(f"Global search by {request.user.username}: '{query}' - {len(results)} results")
        
        return Response({
            'results': results,
            'count': len(results)
        })
        
    except Exception as e:
        logger.error(f"Global search error: {str(e)}", exc_info=True)
        return Response(
            {
                'error': 'Search failed. Please try again.',
                'results': [],
                'count': 0
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
