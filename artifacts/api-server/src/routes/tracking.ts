import { Router, type IRouter } from "express";

const router: IRouter = Router();

type LocationUpdate = {
  userId: string;
  latitude: number;
  longitude: number;
  addressName: string;
  timestamp: string;
};

let latestLocation: LocationUpdate = {
  userId: "user-default",
  latitude: 22.3072,
  longitude: 73.1812,
  addressName: "SSG Hospital Lobby Area, Vadodara",
  timestamp: new Date().toISOString(),
};

const listeners: Array<(loc: LocationUpdate) => void> = [];

router.post("/tracking/update", (req, res): void => {
  const { userId, latitude, longitude, addressName } = req.body;

  if (latitude === undefined || longitude === undefined) {
    res.status(400).json({ error: "Latitude and longitude are required." });
    return;
  }

  latestLocation = {
    userId: userId || "user-default",
    latitude,
    longitude,
    addressName: addressName || `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    timestamp: new Date().toISOString(),
  };

  listeners.forEach((listener) => listener(latestLocation));

  res.json({ success: true, location: latestLocation });
});

router.get("/tracking/current", (_req, res): void => {
  res.json({ location: latestLocation });
});

router.get("/tracking/stream", (req, res): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(`data: ${JSON.stringify(latestLocation)}\n\n`);

  const onUpdate = (loc: LocationUpdate) => {
    res.write(`data: ${JSON.stringify(loc)}\n\n`);
  };

  listeners.push(onUpdate);

  req.on("close", () => {
    const idx = listeners.indexOf(onUpdate);
    if (idx !== -1) listeners.splice(idx, 1);
  });
});

export default router;
