import https from "https";
import { Query } from "../models/Query.ts";
import { User } from "../models/User.ts";

import { Card, type CardModel } from "../models/Card.ts";
import type { RequestOptions } from "https";
import { type HasManyGetAssociationsMixinOptions, Op } from "sequelize";

export async function sendToBot(fromDate?: Date) {
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

  const updateQueryLastDatePromises = [];
  const messagePromises = [];

  for (const query of queries) {
    const lastDateCards = await Card.max<Date, CardModel>("time", {
      where: { queryId: query.id },
    });

    const lastDateQuery = query.lastDateCard;

    const lastDate = fromDate ?? lastDateQuery ?? new Date();

    const options: HasManyGetAssociationsMixinOptions = {
      where: { time: { [Op.gt]: lastDate } },
    };

    const cards = await query.getCards(options);

    let hasHeader = !cards.length;

    messagePromises.push(
      cards.map(async (card: CardModel) => {
        if (!hasHeader) {
          hasHeader = true;
        }
        return sendMessage(query.user.chatId, card, postOptions, hasHeader);
      })
    );

    if (query.lastDateCard < lastDateCards) {
      updateQueryLastDatePromises.push(
        query.update({ lastDateCard: lastDateCards })
      );
    }
  }

  await Promise.all(updateQueryLastDatePromises);
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
