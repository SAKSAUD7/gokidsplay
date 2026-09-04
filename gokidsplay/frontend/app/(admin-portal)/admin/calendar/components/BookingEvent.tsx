import { EventProps } from 'react-big-calendar';

interface CalendarEvent {
    id: string;
    title: string;
    type: 'session' | 'party';
    customerName: string;
    participants: number;
    status: string;
}

export const BookingEvent = ({ event }: EventProps<CalendarEvent>) => {
    const isSession = event.type === 'session';

    return (
        <div className="flex items-center gap-1 text-xs">
            <span>{isSession ? '🎯' : '🎉'}</span>
            <span className="font-semibold truncate">{event.title}</span>
        </div>
    );
};
