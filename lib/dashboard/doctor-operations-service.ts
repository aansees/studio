export type PatientScheduleData = {
  bookedAppointments: Array<{
    appointmentId: string
    doctorName: string
    startsAt: Date | string | null
    status: string
  }>
}
