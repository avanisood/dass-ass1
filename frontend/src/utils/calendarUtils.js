/**
 * Utility functions for Calendar Integration
 */

/**
 * Format date for ICS file (YYYYMMDDTHHMMSSZ)
 */
const formatDateForIcs = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

/**
 * Generate an ICS file content for an event
 */
export const generateIcsFile = (event) => {
    const { name, description, eventStartDate, eventEndDate } = event;

    const start = formatDateForIcs(eventStartDate);
    const end = formatDateForIcs(eventEndDate || eventStartDate); // fallback to start if no end

    // Clean description of HTML or newlines
    const cleanDescription = (description || '')
        .replace(/\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Felicity Event Management//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${name}
DTSTART:${start}
DTEND:${end}
DESCRIPTION:${cleanDescription}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return icsContent;
};

/**
 * Trigger download of ICS file
 */
export const downloadIcsFile = (event) => {
    const content = generateIcsFile(event);
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHMMSSZ)
 */
const formatDateForGoogle = (dateString) => {
    return formatDateForIcs(dateString);
};

/**
 * Generate Google Calendar Add Event URL
 */
export const getGoogleCalendarUrl = (event) => {
    const { name, description, eventStartDate, eventEndDate } = event;
    const start = formatDateForGoogle(eventStartDate);
    const end = formatDateForGoogle(eventEndDate || eventStartDate);

    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', name);
    url.searchParams.append('dates', `${start}/${end}`);
    url.searchParams.append('details', description || '');

    return url.toString();
};

/**
 * Generate Microsoft Outlook / Office 365 Add Event URL
 */
export const getOutlookCalendarUrl = (event) => {
    const { name, description, eventStartDate, eventEndDate } = event;

    const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
    url.searchParams.append('path', '/calendar/action/compose');
    url.searchParams.append('rru', 'addevent');
    url.searchParams.append('subject', name);
    url.searchParams.append('body', description || '');
    url.searchParams.append('startdt', new Date(eventStartDate).toISOString());
    url.searchParams.append('enddt', new Date(eventEndDate || eventStartDate).toISOString());

    return url.toString();
};
