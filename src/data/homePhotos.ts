import type { PolaroidPhoto } from "../components/Polaroids";

type HomePhotoSection = {
  id: string;
  photos: PolaroidPhoto[];
  desktopLayout?: "columns" | "rows";
  desktopColumns?: number;
};

export const homePhotoSectionsById = {
  encounter: {
    id: "encounter",
    desktopColumns: 2,
    photos: [
      {
        id: "a",
        src: "/slides/1_1.jpg",
        mediaWidth: 1600,
        mediaHeight: 1600,
        caption:
          "pic from flickr, spent $50 on the logo from fiverr (lots of money to me at the time)",
        origin: { x: 6, y: 4 },
        width: 42,
      },
      {
        id: "b",
        src: "/slides/1_2.PNG",
        mediaWidth: 750,
        mediaHeight: 819,
        caption:
          "self-taught objective c, built a node server, designed from scratch, AND got through app store review (not bad)",
        origin: { x: 52, y: 4 },
        width: 42,
      },
      {
        id: "c",
        src: "/slides/1_3.jpg",
        mediaWidth: 750,
        mediaHeight: 574,
        caption:
          "nikita bier has cautioned against this specific idea for its lack of instant gratification / coincidence of wants",
        origin: { x: 6, y: 52 },
        width: 42,
      },
      {
        id: "d",
        src: "/slides/1_4.png",
        mediaWidth: 874,
        mediaHeight: 749,
        caption:
          "the only photo i have of me working on this (and i'm not even in it)",
        origin: { x: 52, y: 52 },
        width: 42,
      },
    ],
  },
  snack: {
    id: "snack",
    desktopColumns: 2,
    photos: [
      {
        id: "a",
        src: "/slides/2_1.png",
        mediaWidth: 1556,
        mediaHeight: 1266,
        caption: "we had a designer help us this time",
        origin: { x: 10, y: 6 },
        width: 24,
      },
      {
        id: "b",
        src: "/slides/2_2.png",
        mediaWidth: 1292,
        mediaHeight: 1074,
        caption:
          "by recording whiteboard videos as vectors and storing diffs between frames, we could record in-browser and had file sizes 2% of an exported mp4",
        origin: { x: 24, y: 19 },
        width: 24,
      },
      {
        id: "c",
        src: "/slides/2_3.png",
        mediaWidth: 1418,
        mediaHeight: 838,
        caption:
          "we built our own custom player that leveraged vectors (you could scroll the whiteboard while watching)",
        origin: { x: 38, y: 7 },
        width: 24,
      },
      {
        id: "d",
        src: "/slides/2_5.png",
        mediaWidth: 900,
        mediaHeight: 1143,
        caption: "pitching (i was so bad at public speaking)",
        origin: { x: 52, y: 19 },
        width: 24,
      },
      {
        id: "e",
        src: "/slides/2_6.jpg",
        mediaWidth: 1320,
        mediaHeight: 1133,
        caption: "winning a pitch comp",
        origin: { x: 66, y: 8 },
        width: 24,
      },
    ],
  },
  whatsapp: {
    id: "whatsapp",
    desktopLayout: "rows",
    photos: [
      {
        id: "a",
        src: "/slides/3_1.jpg",
        mediaWidth: 1600,
        mediaHeight: 1200,
        caption: "i did a 3 month internship in 2017 before starting full-time",
        origin: { x: 11, y: 18 },
        width: 33,
      },
      {
        id: "b",
        src: "/slides/3_2.jpg",
        mediaWidth: 1600,
        mediaHeight: 1139,
        caption:
          'fun fact: facebook hq used to be sun microsystems hq, and as a reminder of how there is no such thing as "too big to fail", facebook kept the sun microsystems sign on the back of their sign',
        origin: { x: 28, y: 30 },
        width: 36,
      },
      {
        id: "c",
        src: "/slides/3_3.jpg",
        mediaWidth: 1600,
        mediaHeight: 1200,
        caption: "america-pilled",
        origin: { x: 57, y: 17 },
        width: 34,
      },
    ],
  },
  derive: {
    id: "derive",
    desktopLayout: "rows",
    photos: [
      {
        id: "a",
        src: "/slides/4_1.png",
        mediaWidth: 3446,
        mediaHeight: 1796,
        caption:
          "screenshot of the platform, i led product design / eng (this is about as complex as frontend dev gets)",
        origin: { x: 9, y: 16 },
        width: 31,
      },
      {
        id: "b",
        src: "/slides/4_2.jpeg",
        mediaWidth: 2048,
        mediaHeight: 1536,
        caption: "moving into our first office",
        origin: { x: 36, y: 24 },
        width: 31,
      },
      {
        id: "c",
        src: "/slides/4_3.jpeg",
        mediaWidth: 2048,
        mediaHeight: 1536,
        caption: "offsite with the team (now 20 people and growing)",
        origin: { x: 61, y: 12 },
        width: 31,
      },
    ],
  },
  robots: {
    id: "robots",
    desktopLayout: "columns",
    desktopColumns: 3,
    photos: [
      {
        id: "a",
        src: "/slides/5_1_poster.jpg",
        mediaWidth: 1280,
        mediaHeight: 720,
        video: {
          posterSrc: "/slides/5_1_poster.jpg",
          sources: [
            {
              src: "/slides/5_1.webm",
              type: "video/webm",
            },
            {
              src: "/slides/5_1.mp4",
              type: "video/mp4",
            },
          ],
        },
        caption: "teleoperating trossen arms at ICRA 2025",
        origin: { x: 8, y: 2 },
        width: 25,
      },
      {
        id: "e",
        src: "/slides/5_2_poster.jpg",
        mediaWidth: 320,
        mediaHeight: 563,
        video: {
          posterSrc: "/slides/5_2_poster.jpg",
          sources: [
            {
              src: "/slides/5_2.webm",
              type: "video/webm",
            },
            {
              src: "/slides/5_2.mp4",
              type: "video/mp4",
            },
          ],
        },
        caption: "built my own so-arm101 from lerobot",
        origin: { x: 36, y: 1 },
        width: 25,
      },
      {
        id: "b",
        src: "/slides/5_4.jpeg",
        mediaWidth: 1184,
        mediaHeight: 864,
        caption:
          "from my mechatronics undergrad, working with an ABB industrial arm to do some basic computer vision and pick and place (hardware is hard)",
        origin: { x: 64, y: 3 },
        width: 25,
      },
      {
        id: "d",
        src: "/slides/5_3_poster.jpg",
        mediaWidth: 720,
        mediaHeight: 1280,
        video: {
          posterSrc: "/slides/5_3_poster.jpg",
          sources: [
            {
              src: "/slides/5_3.webm",
              type: "video/webm",
            },
            {
              src: "/slides/5_3.mp4",
              type: "video/mp4",
            },
          ],
        },
        caption: "unitree boxing at ICRA 2025",
        origin: { x: 17, y: 38 },
        width: 24,
      },
      {
        id: "f",
        src: "/slides/5_5_poster.jpg",
        mediaWidth: 720,
        mediaHeight: 1280,
        video: {
          posterSrc: "/slides/5_5_poster.jpg",
          sources: [
            {
              src: "/slides/5_5.webm",
              type: "video/webm",
            },
            {
              src: "/slides/5_5.mp4",
              type: "video/mp4",
            },
          ],
        },
        caption: "this guy didn't like to be picked up",
        origin: { x: 40, y: 37 },
        width: 24,
      },
      {
        id: "g",
        src: "/slides/5_6_poster.jpg?v=2",
        mediaWidth: 720,
        mediaHeight: 1280,
        video: {
          posterSrc: "/slides/5_6_poster.jpg?v=2",
          sources: [
            {
              src: "/slides/5_6.webm?v=2",
              type: "video/webm",
            },
            {
              src: "/slides/5_6.mp4?v=2",
              type: "video/mp4",
            },
          ],
        },
        caption: "almost got run over",
        origin: { x: 63, y: 38 },
        width: 24,
      },
    ],
  },
} satisfies Record<string, HomePhotoSection>;

const homePhotoSections = Object.values(homePhotoSectionsById);

export const homePhotos: PolaroidPhoto[] = homePhotoSections.flatMap((section) =>
  section.photos.map((photo) => ({
    ...photo,
    id: `${section.id}-${photo.id}`,
  })),
);
