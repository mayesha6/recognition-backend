import { NextFunction, Request, Response } from "express";
import { User } from "../user/user.model";


export const sesWebhookController = async (req:Request, res:Response, next:NextFunction) => {
  try {
    // Handle subscription confirmation
    if (req.body.Type === "SubscriptionConfirmation") {
      await fetch(req.body.SubscribeURL);
      return res.status(200).send("Confirmed");
    }

    const message = JSON.parse(req.body.Message);
    const type = message.notificationType;

    // BOUNCE
    if (type === "Bounce") {
      const email =
        message.bounce.bouncedRecipients[0].emailAddress;

      await User.updateOne(
        { email },
        { $set: { emailStatus: "bounced" } }
      );
    }

    // COMPLAINT
    if (type === "Complaint") {
      const email =
        message.complaint.complainedRecipients[0].emailAddress;

      await User.updateOne(
        { email },
        { $set: { emailStatus: "complaint" } }
      );
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
};