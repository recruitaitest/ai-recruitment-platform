"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { Interview } from "@/types/interview";

interface Props {
    interviews: Interview[];
    onEventClick: (candidateId: number) => void;
}

export default function InterviewCalendar({
    interviews,
    onEventClick,
}: Props) {
    const events = interviews.map((interview) => ({
        title: `${interview.interview_type} - ${interview.candidate_name}`,
        date: interview.interview_date,
        extendedProps: {
            candidateId: interview.candidate_id,
        },
    }));

    return (
        <div className="interview-calendar">
            <FullCalendar
                plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    interactionPlugin,
                ]}
                initialView="dayGridMonth"
                headerToolbar={{
                    left: "prev,next today",
                    center: "title",
                    right:
                        "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                buttonText={{
                    month: "Month",
                    week: "Week",
                    day: "Day",
                    today: "This Month"
                }}
                datesSet={(arg) => {
                    const todayBtn = document.querySelector('.interview-calendar .fc-today-button') as HTMLButtonElement;
                    if (todayBtn) {
                        if (arg.view.type === 'dayGridMonth') {
                            todayBtn.textContent = 'This Month';
                        } else if (arg.view.type === 'timeGridWeek') {
                            todayBtn.textContent = 'This Week';
                        } else {
                            todayBtn.textContent = 'Today';
                        }
                    }
                }}
                height="auto"
                editable={true}
                selectable={true}
                events={events}
                eventClick={(info) => {
                    const candidateId =
                        info.event.extendedProps.candidateId;

                    onEventClick(candidateId);
                }}
            />
        </div>
    );
}