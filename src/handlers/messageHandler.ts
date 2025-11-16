import https from "https";
import { Query } from "../models/Query.ts";
import { User } from "../models/User.ts";

import type { CardModel } from "../models/Card.ts";
import type { RequestOptions } from "https";

export async function sendToBot() {
  const postOptions = {
    host: "api.telegram.org",
    path: `/bot${process.env.BOT_TOKEN}/`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  } as const;

  const queries = await Query.findAll({
    include: { model: User },
  });

  const updates = [];
  const messagePromises = [];

  for (const query of queries) {
    const cards = await query.getCards();
    const lastDate = cards.reduce(
      (acc: number, card: CardModel) => Math.max(acc, card.time.getTime()),
      0
    );

    const selectedCards = cards.filter(
      (card: CardModel) => card.time > query.lastDateCard
    );
    let hasHeader = !selectedCards.length;

    messagePromises.push(
      selectedCards.map(async (card: CardModel) => {
        if (!hasHeader) {
          hasHeader = true;
        }
        return sendMessage(query.user.chatId, card, postOptions, hasHeader);
      })
    );

    if (query.lastDateCard < lastDate) {
      updates.push(query.update({ lastDateCard: lastDate }));
    }
  }

  await Promise.all(updates);
  await Promise.all(messagePromises);
}

function sendMessage(
  chatId: string,
  card: CardModel,
  postOptions: RequestOptions,
  hasHeader: boolean
) {
  const prettyDate = card.createdAt.toISOString?.()?.split?.("T")[0];
  // .toLocaleString('ru',
  // {year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'});

  const text = hasHeader ? card.link : `<b>${prettyDate}</b>\n${card.link}`;

  const body = {
    method: "sendMessage",
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  };

  const req = https.request(postOptions, (res) => {
    console.log("making a request to telegram server");
    res
      .on("data", () => {
        console.log("got a response from telegram server");
      })
      .on("error", (err) => {
        console.log("Have an error when send Message to client -- " + err);
      })
      .on("close", () => {
        console.log("connection is closed, moving further");
        res.destroy();
      });
  });

  req.end(JSON.stringify(body));
}
