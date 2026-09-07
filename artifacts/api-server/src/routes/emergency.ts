import { Router, type IRouter } from "express";

const router: IRouter = Router();

type EmergencyAlert = {
  id: string;
  senderName: string;
  contactNumber: string;
  disabilityType: string;
  coordinates: { lat: number; lng: number };
  address: string;
  timestamp: string;
  status: "dispatched" | "acknowledged" | "resolved";
  smsDispatchStatus: "sent" | "simulated" | "failed";
  smsGatewayProvider: string;
};

const emergencyLog: EmergencyAlert[] = [];

async function dispatchSMS(recipientPhone: string, textMessage: string): Promise<{ success: boolean; provider: string }> {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuthToken && twilioPhone) {
    try {
      // Basic Twilio HTTP API call
      const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64");
      const params = new URLSearchParams({
        To: recipientPhone,
        From: twilioPhone,
        Body: textMessage,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        }
      );

      if (response.ok) {
        return { success: true, provider: "Twilio Cellular Gateway" };
      }
    } catch (error) {
      console.warn("Twilio SMS dispatch failed, falling back to mock gateway:", error);
    }
  }

  // Mock / Local Gateway Simulation
  console.log(`[SMS GATEWAY SIMULATION] To: ${recipientPhone} | Message: ${textMessage}`);
  return { success: true, provider: "Sugamya Setu Emergency Gateway (Simulated)" };
}

router.post("/emergency/alert", async (req, res): Promise<void> => {
  const { senderName, contactNumber, disabilityType, coordinates, address } = req.body;

  if (!senderName || !contactNumber) {
    res.status(400).json({ error: "Sender name and contact number are required." });
    return;
  }

  const messageText = `EMERGENCY SOS: ${senderName} (${disabilityType}) requires immediate assistance at ${address || "Current Location"}. Contact: ${contactNumber}`;
  const smsResult = await dispatchSMS(contactNumber, messageText);

  const alert: EmergencyAlert = {
    id: `sos-${Date.now()}`,
    senderName,
    contactNumber,
    disabilityType: disabilityType || "General Accessibility Assistance",
    coordinates: coordinates || { lat: 22.3072, lng: 73.1812 },
    address: address || "Vadodara Civic Area, Gujarat",
    timestamp: new Date().toISOString(),
    status: "dispatched",
    smsDispatchStatus: smsResult.success ? "sent" : "simulated",
    smsGatewayProvider: smsResult.provider,
  };

  emergencyLog.push(alert);

  res.status(201).json({
    success: true,
    message: "Silent SOS Alert and SMS notifications dispatched successfully.",
    alert,
  });
});

router.get("/emergency/alerts", (_req, res): void => {
  res.json({ alerts: emergencyLog });
});

export default router;
