"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { customAlphabet } from "nanoid";
import { useForm } from "react-hook-form";
import Image from "next/image";
import clsx from "clsx";
import { AppContext, MEETING_ID_REGEX } from "@/contexts/AppProvider";
import { API_KEY, CALL_TYPE } from "@/contexts/MeetProvider";
import Header from "@/components/Header";
import KeyboardFilled from "@/components/icons/KeyboardFilled";
import PlainButton from "@/components/PlainButton";
import TextField from "@/components/TextField";
import Videocall from "@/components/icons/Videocall";
import {
  ErrorFromResponse,
  GetCallResponse,
  StreamVideoClient,
  User,
} from "@stream-io/video-react-sdk";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Url from "@/components/icons/Url";
import Plus from "@/components/icons/Plus";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Copy from "@/components/icons/Copy";
import CalendarIcon from "@/components/icons/Calendar";

import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

// Define schema for form validation
const formSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.date(),
  participants: z.array(z.string()),
});

const GUEST_USER: User = { id: "guest", type: "guest" };

const Home = () => {
  const { setNewMeeting } = useContext(AppContext);
  const { user, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [code, setCode] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      participants: [],
    },
  });

  const router = useRouter();

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timeout);
    }
  }, [error]);

  // Generate a unique meeting ID
  const generateMeetingId = async () => {
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz", 4);
    const id = `${nanoid(3)}-${nanoid(4)}-${nanoid(3)}`;
    try {
      await createMeeting(id, "Instant meeting", "IDLE");
      return id;
    } catch (e) {
      console.error("Error generating meeting ID:", e);
    }
  };

  // Create a new meeting
  const createMeeting = async (id, title, status) => {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/meetings`,
      {
        title,
        description: title,
        status,
        nanoid: id,
        date: form.getValues("date") || "",
      },
      {
        headers: { Authorization: `Bearer ${user?.accessToken || ""}` },
      }
    );
  };

  const handleInstantMeeting = async () => {
    const id = await generateMeetingId();
    if (id) {
      setNewMeeting(true);
      router.push(`/${id}`);
    }
  };

  const handleLaterMeeting = async () => {
    const id = await generateMeetingId();
    if (id) {
      setCode(id);
      setIsOpen(true);
    }
  };

  const handleCodeJoin = async () => {
    if (!MEETING_ID_REGEX.test(code)) return;
    setCheckingCode(true);
    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: GUEST_USER,
    });
    const call = client.call(CALL_TYPE, code);
    try {
      const response = await call.get();
      if (response.call) {
        router.push(`/${code}`);
      }
    } catch (e) {
      if (e instanceof ErrorFromResponse && e.status === 404) {
        setError("Couldn't find the meeting you're trying to join.");
      }
    } finally {
      setCheckingCode(false);
    }
  };

  const onSubmit = async (data: { title: any }) => {
    try {
      await createMeeting(
        customAlphabet("abcdefghijklmnopqrstuvwxyz", 4)(),
        data.title,
        "SCHEDULED"
      );
      setIsScheduleOpen(false);
    } catch (e) {
      console.error("Error scheduling meeting:", e);
    }
  };

  return (
    <div>
      <Header />
      <main
        className={clsx(
          "flex flex-col items-center justify-center px-6",
          !isLoading ? "animate-fade-in" : "opacity-0"
        )}
      >
        {/* Main Title and Description */}
        <div className="text-center max-w-2xl p-4 pt-7">
          <h1 className="text-5xl text-black pb-2">
            Video Interviews for Developers
          </h1>
          <p className="text-gray pb-8">
            Connect with your team and interview candidates remotely
          </p>
        </div>

        {/* Meeting Controls */}
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-2">
          {user && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-12">
                    <Videocall /> New meeting
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem onClick={handleLaterMeeting}>
                    <Url /> Create meeting for later
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleInstantMeeting}>
                    <Plus /> Create instant meeting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsScheduleOpen(true)}>
                    <CalendarIcon /> Schedule meeting
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Code Join Input */}
              <div className="flex items-center gap-2 sm:ml-4">
                <TextField
                  label="Code or link"
                  name="code"
                  placeholder="Enter a code or link"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  icon={<KeyboardFilled />}
                />
                <PlainButton onClick={handleCodeJoin} disabled={!code}>
                  Join
                </PlainButton>
              </div>
            </>
          )}
        </div>

        {/* Get Link Illustration */}
        <div className="mt-8 flex flex-col items-center">
          <Image
            src="https://www.gstatic.com/meet/user_edu_get_a_link_light_90698cd7b4ca04d3005c962a3756c42d.svg"
            alt="Get a link you can share"
            width={248}
            height={248}
          />
          <h2 className="text-2xl text-black text-center">
            Get a link you can share
          </h2>
          <p className="text-gray text-center">
            Click <span className="font-bold">New meeting</span> to get a link
            you can send to people you want to meet with
          </p>
        </div>

        {/* Dialog for Invitation Link */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Your Invitation Link</DialogTitle>
              <DialogDescription>
                <p>
                  Share this link with your team to schedule a meeting later
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="p-4 bg-gray-900 text-gray-100 rounded-md font-mono text-sm">
                    {code}
                  </div>
                  <Button onClick={() => navigator.clipboard.writeText(code)}>
                    <Copy /> Copy
                  </Button>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        {/* Dialog for Scheduling a Meeting */}
        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule your meeting</DialogTitle>
              <DialogDescription>
                Fill in the details below to schedule your meeting
              </DialogDescription>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="An upcoming inteview"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This is your public display title.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Description"
                            {...field}
                            multiple
                          />
                        </FormControl>
                        <FormDescription>
                          This is your interview information.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={clsx(
                                    "w-[240px] pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <>Date</>
                                  )}
                                  <CalendarIcon className="ml-auto opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() ||
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </FormControl>
                        <FormDescription>
                          This is your interview date.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    Schedule
                  </Button>
                </form>
              </Form>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Home;
