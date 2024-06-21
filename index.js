const socket = require("socket.io-client");
const { Ableton } = require("ableton-js");
require("dotenv").config();

// imports
const templateSocketEmit = require("./templateSocketEmit");

// global vars
const ableton = new Ableton({ logger: console });
const song = ableton.song;

let isPlaying;

const defaultTempo = 60;
let diffTempo;

// socket init
const server = socket(process.env.API_URL);
server.on("connect", () => {
  console.log("[ServerIO] Connected.");
});

// ableton init
const initAbleton = async () => {
  await ableton.start();

  song.addListener("is_playing", (status) => (isPlaying = status));

  initTimers();
};

// animation data
const initTracksOutputData = async () => {
  const drumsTracks = await song
    .get("tracks")
    .then((tracks) =>
      tracks.filter((track) => track.raw.name.includes("Drums"))
    );

  drumsTracks.forEach((track) =>
    track.addListener("output_meter_left", (outputData) => {
      isPlaying &&
        server.emit(
          "abletonToDisplay",
          templateSocketEmit("audioData", { outputData })
        );
    })
  );
};

// timer data
const initTimers = async () => {
  let tracksEndTime;

  song.addListener("tracks", async () => {
    tracksEndTime = await initTimersBody();
  });

  song.addListener("current_song_time", async (time) => {
    tracksEndTime = await initTimersBody();
    initSendTimerData(time, tracksEndTime);
  });
};

const initTimersBody = async () => {
  let tracks = await song.get("tracks");
  let currentTempo = await song.get("tempo");
  diffTempo = currentTempo / defaultTempo;

  return await calcTracksEndTime(tracks);
};

// find and calc start-end times
const calcTracksEndTime = async (tracks) => {
  let tracksEndTime = [];

  for (const track of tracks) {
    const trackName = await track.get("name");

    if (trackName.toLowerCase().includes("timer")) {
      const clipSlots = await track.get("clip_slots");

      const isClipGrouped = await clipSlots[0].get("is_group_slot");

      if (!isClipGrouped) {
        const arrangementClips = await track.get("arrangement_clips");
        const { start_time, end_time } = arrangementClips[0]?.raw;

        tracksEndTime.push({
          startTime: start_time > 0 ? Math.floor(start_time) / diffTempo : 0,
          endTime: Math.floor(end_time) / diffTempo,
        });
      }
    }
  }

  tracksEndTime = Array.from(
    new Set(tracksEndTime.map((obj) => JSON.stringify(obj)))
  ).map((str) => JSON.parse(str));

  return tracksEndTime;
};

// sender formatted percentage and timer
const initSendTimerData = async (time, tracksEndTime) => {
  let currentTime = time / diffTempo;
  let tracksTimer = tracksEndTime.map((trackTime) => ({
    percentage: Math.floor(
      ((currentTime - trackTime.startTime) /
        (trackTime.endTime - trackTime.startTime)) *
        100
    ),
    timer: Math.floor(trackTime.endTime - currentTime),
  }));

  server.emit(
    "abletonToTimer",
    templateSocketEmit("timerData", { tracksTimer }, "abletonToTimer")
  );
};

// startup
initAbleton();
