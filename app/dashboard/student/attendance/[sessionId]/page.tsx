import AttendanceSessionDetail from "@/components/dashboard/attendance-session-detail";

type StudentAttendanceSessionPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function StudentAttendanceSessionPage({
  params,
}: StudentAttendanceSessionPageProps) {
  const resolvedParams = await params;
  return (
    <AttendanceSessionDetail
      params={resolvedParams}
      basePath="/dashboard/student/attendance"
      allowedRole="STUDENT"
    />
  );
}
