import Image from "next/image";
import EventCalendar from "./EventCalendar";

const EventCalendarContainer = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {

    const{date} = searchParams;
  return (
    <div className=" p-4 rounded-md EventCalendarbg">
      <EventCalendar />
      <div className="flex items-center justify-between">
        {/*<h1 className="text-xl font-bold my-4">Events</h1>
        <Image src="/moreDark.png" alt="" width={20} height={20} />*/}
      </div>
      <div className="flex flex-col gap-4">
        
      </div>
    </div>
  );
};

export default EventCalendarContainer;
