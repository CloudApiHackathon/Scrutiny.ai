import { MEETING_ID_REGEX } from "@/contexts/AppProvider";
import { API_KEY, CALL_TYPE } from "@/contexts/MeetProvider";
import { Card, CardHeader, CardBody } from "@nextui-org/card";
import { ErrorFromResponse, StreamVideoClient, User } from "@stream-io/video-react-sdk";
import clsx from "clsx";
import { useRouter } from "next/navigation";

interface Meeting {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

const MeetingCard = ({
  meeting,
  className,
}: {
  meeting: Meeting;
  className?: string;
}) => {
  const router = useRouter();

  const meetingCardBackground = () => {
    switch (meeting.status) {
      case "END":
        return "bg-red-100";
      case "LIVE":
        return "bg-green-100";
      case "IDLE":
        return "bg-yellow-100";
      default:
        return "bg-blue-100";
    }
  };

  const GUEST_USER: User = { id: "guest", type: "guest" };
  
  const handleCodeJoin = async (id: string) => {
    if (!MEETING_ID_REGEX.test(id)) return;
    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: GUEST_USER,
    });
    const call = client.call(CALL_TYPE, id);
    try {
      const response = await call.get();
      if (response.call)
          router.push(`/${id}`);
    } catch (e) {
      if (e instanceof ErrorFromResponse && e.status === 404) {
        console.error("Meeting not found");
      }
    }
  };

  return (
    <Card
      className={clsx(
        "shadow-lg rounded-xl p-6 text-gray-700 transition-all duration-300 ease-in-out transform hover:scale-103 bg-white shadow-lg rounded-xl p-4 text-gray-700 shadow-blue-gray-900/5 hidden sm:block  hover:shadow-xl",
        className,
        meetingCardBackground()
      )}
      isHoverable
      isPressable
      onClick={() => handleCodeJoin(meeting.id)}
    >
      <CardHeader className="border-b border-gray-200 pb-4 mb-2 flex items-center justify-between">
        <h4 className="text-lg font-bold text-gray-800">{meeting.title}</h4>
        <span
          className={clsx(
            "relative text-xs font-medium px-2 py-1 rounded-full flex items-center",
            meeting.status === "active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-500"
          )}
        >
          {meeting.status === "LIVE" && (
            <span className="relative mr-1 flex items-center">
              <span className="absolute inline-block w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
            </span>
          )}
          {meeting.status}
        </span>
      </CardHeader>
      <CardBody className="space-y-2">
        <p className="text-gray-600">{meeting.description}</p>
        <p className="text-gray-500 text-sm">
          Date:{" "}
          {new Date(meeting.created_at).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: "UTC", // Adjust if needed
          })}
        </p>
      </CardBody>
    </Card>
  );
};

export default MeetingCard;
