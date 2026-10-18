from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import InvitationTemplate, BookingInvitation
from .serializers import InvitationTemplateSerializer, BookingInvitationSerializer, PublicInvitationSerializer
from apps.bookings.models import PartyBooking
from django.core.exceptions import ValidationError
from apps.bookings.permissions import IsStaffUser, IsSuperAdminOnly

class InvitationTemplateViewSet(viewsets.ModelViewSet):
    queryset = InvitationTemplate.objects.all()
    serializer_class = InvitationTemplateSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsSuperAdminOnly()]

class BookingInvitationViewSet(viewsets.ModelViewSet):
    """
    Party e-invitations. Staff manage them; the public can only view one invitation
    by its link (uuid), and the party's booker can create / update theirs by
    proving the booking's private uuid (not the guessable id).
    """
    queryset = BookingInvitation.objects.all()
    serializer_class = BookingInvitationSerializer

    def get_permissions(self):
        if self.action in ('public_view', 'create_or_update'):
            return [permissions.AllowAny()]
        return [IsStaffUser()]

    @action(detail=False, methods=['get'], url_path='public/(?P<uuid>[^/.]+)')
    def public_view(self, request, uuid=None):
        try:
            invitation = BookingInvitation.objects.get(uuid=uuid)
        except (BookingInvitation.DoesNotExist, ValueError, ValidationError):
            return Response({"error": "Invitation not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(PublicInvitationSerializer(invitation).data)

    @action(detail=False, methods=['post'], url_path='create-or-update')
    def create_or_update(self, request):
        booking_uuid = request.data.get('booking_uuid')
        if not booking_uuid:
            return Response({"error": "Booking reference required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            booking = PartyBooking.objects.get(uuid=booking_uuid)
        except (PartyBooking.DoesNotExist, ValueError, ValidationError):
            return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

        invitation, _ = BookingInvitation.objects.get_or_create(booking=booking)
        data = {k: v for k, v in request.data.items()
                if k in ('template', 'child_name', 'custom_message', 'party_date', 'party_time', 'venue')}
        serializer = BookingInvitationSerializer(invitation, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
