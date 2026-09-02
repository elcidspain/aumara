export const SITE_URL = "https://www.aumara.me";

export const BEDS24 = {
  propertyId: "324882",
  chaletRoomId: "674465",
  superiorRoomId: "674466",
} as const;

export function beds24Url(opts?: {
  roomId?: string;
  checkin?: string;
  checkout?: string;
}): string {
  const params = new URLSearchParams({ propid: BEDS24.propertyId });
  if (opts?.roomId) params.set("roomid", opts.roomId);
  if (opts?.checkin) params.set("checkin", opts.checkin);
  if (opts?.checkout) params.set("checkout", opts.checkout);
  return `https://beds24.com/booking2.php?${params.toString()}`;
}

export const BOOK_DIRECT = beds24Url();
export const BOOK_CHALET = beds24Url({ roomId: BEDS24.chaletRoomId });
export const BOOK_SUPERIOR = beds24Url({ roomId: BEDS24.superiorRoomId });

export type WalkNode = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  video: string;
  poster: string;
  label: string;
};

export const WALK_NODES: WalkNode[] = [
  {
    id: "01",
    title: "Central viewpoint",
    subtitle: "Green house, ochre houses and the valley.",
    description:
      "This opening point establishes the centre of the site before the route turns west.",
    video: "/media/nodes/node-01.mp4",
    poster: "/media/stills/path-green-ochre.jpg",
    label: "Central view",
  },
  {
    id: "02",
    title: "West approach",
    subtitle: "Turning along the path toward the red house.",
    description:
      "The route leaves the central view and moves west between the planted terraces.",
    video: "/media/nodes/node-02.mp4",
    poster: "/media/stills/pines-domes.jpg",
    label: "West approach",
  },
  {
    id: "03",
    title: "Red house",
    subtitle: "The western house and its entrance path.",
    description:
      "A close real view of the red house, the first unmistakable western landmark in the recording.",
    video: "/media/nodes/node-03.mp4",
    poster: "/media/stills/ochre-path.jpg",
    label: "Red house",
  },
  {
    id: "04",
    title: "Return past the green house",
    subtitle: "Back toward the central route.",
    description:
      "The camera returns east past the green house and reconnects with the main site path.",
    video: "/media/nodes/node-04.mp4",
    poster: "/media/stills/green-house.jpg",
    label: "Green house",
  },
  {
    id: "05",
    title: "The descent",
    subtitle: "The path drops between the houses.",
    description:
      "This point explains the slope, changing levels and the relationship between the upper and lower houses.",
    video: "/media/nodes/node-05.mp4",
    poster: "/media/stills/colored-houses.jpg",
    label: "Descent",
  },
  {
    id: "06",
    title: "Upper path",
    subtitle: "Moving through the higher branch of the site.",
    description:
      "Trees, planting and house entrances frame the upper section of the route.",
    video: "/media/nodes/node-06.mp4",
    poster: "/media/stills/domes-up.jpg",
    label: "Upper path",
  },
  {
    id: "07",
    title: "Lower route",
    subtitle: "The lower section and private entrances.",
    description:
      "The route continues through the lower level, closer to the valley-facing edge.",
    video: "/media/nodes/node-07.mp4",
    poster: "/media/stills/inside-valley.jpg",
    label: "Lower route",
  },
  {
    id: "08",
    title: "Western return",
    subtitle: "The ochre house and the road below.",
    description:
      "The final point reconnects the western houses with the visible valley road and site entrance.",
    video: "/media/nodes/node-08.mp4",
    poster: "/media/stills/ochre-valley.jpg",
    label: "Return west",
  },
];

export const NODE_POSITIONS = [
  "n1",
  "n2",
  "n3",
  "n4",
  "n5",
  "n6",
  "n7",
  "n8",
] as const;
