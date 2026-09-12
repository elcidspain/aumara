import FlightLaunch from "@/components/site/FlightLaunch";
import GuestActivation from "@/components/site/GuestActivation";
import GuestHome from "@/components/site/GuestHome";

export default function Home() {
  return (
    <>
      <GuestHome />
      <GuestActivation />
      <FlightLaunch />
    </>
  );
}
