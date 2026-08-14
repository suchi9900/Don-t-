const axios = require("axios");

let simsim = "";
let count_req = 0;

const spamTriggerMap = new Map();

const SPAM_WINDOW_MS = 30 * 1000;
const SPAM_LIMIT = 4;
const TEMP_BAN_MS = 10 * 60 * 1000;

/* =========================
   SAFE EVENT DATA
========================= */

function getSenderID(event) {
  return (
    event?.senderID ||
    event?.senderId ||
    event?.author ||
    event?.userID ||
    null
  );
}

function getThreadID(event) {
  return event?.threadID || event?.threadId || null;
}

function getMessageID(event) {
  return event?.messageID || event?.messageId || null;
}

async function getName(Users, senderID) {
  if (!senderID) return "User";

  try {
    const result = await Users.getNameUser(senderID);
    return result || "User";
  } catch (e) {
    return "User";
  }
}

/* =========================
   SPAM
========================= */

function registerSpamTrigger(senderID) {
  if (!senderID) return false;

  const now = Date.now();

  let arr =
    spamTriggerMap.get(senderID) || [];

  arr = arr.filter(
    t => now - t < SPAM_WINDOW_MS
  );

  arr.push(now);

  spamTriggerMap.set(
    senderID,
    arr
  );

  return arr.length >= SPAM_LIMIT;
}

async function applyTempBan(
  api,
  Users,
  senderID,
  threadID,
  messageID
) {
  if (!senderID) return;

  try {

    if (
      global.utils &&
      typeof global.utils.guardAdminBan === "function" &&
      global.utils.guardAdminBan(
        api,
        senderID,
        threadID,
        messageID
      )
    ) {
      spamTriggerMap.delete(senderID);
      return;
    }

  } catch (e) {}

  try {

    const moment =
      require("moment-timezone");

    const dateAdded =
      moment
        .tz("Asia/Dhaka")
        .format("HH:mm:ss L");

    const result =
      await Users.getData(senderID);

    const data =
      result?.data || {};

    data.banned = 1;
    data.reason = "Spam trigger";
    data.dateAdded = dateAdded;

    await Users.setData(
      senderID,
      { data }
    );

    if (!global.data.userBanned) {
      global.data.userBanned =
        new Map();
    }

    global.data.userBanned.set(
      senderID,
      {
        reason: data.reason,
        dateAdded
      }
    );

    spamTriggerMap.delete(senderID);

    await api.sendMessage(
      "❌ 𝗬𝗼𝘂 𝗵𝗮𝘃𝗲 𝗯𝗲𝗲𝗻 𝗯𝗮𝗻𝗻𝗲𝗱 𝗳𝗼𝗿 𝟭𝟬 𝗺𝗶𝗻𝘂𝘁𝗲𝘀.",
      threadID,
      messageID
    );

    setTimeout(
      async () => {

        try {

          if (
            !global.data.userBanned ||
            !global.data.userBanned.has(
              senderID
            )
          ) return;

          const d =
            (await Users.getData(senderID))
              ?.data || {};

          d.banned = 0;

          await Users.setData(
            senderID,
            { data: d }
          );

          global.data.userBanned.delete(
            senderID
          );

        } catch (e) {

          console.log(
            "❌ Auto-unban:",
            e.message
          );

        }

      },
      TEMP_BAN_MS
    );

  } catch (e) {

    console.log(
      "❌ Ban error:",
      e.message
    );

  }
}

/* =========================
   TYPING
========================= */

async function typing(ms = 1500) {
  return new Promise(
    resolve => setTimeout(
      resolve,
      ms
    )
  );
}

/* =========================
   LOAD API
========================= */

(async () => {

  try {

    const res =
      await axios.get(
        "https://raw.githubusercontent.com/abdullahrx07/X-api/main/MaRiA/baseApiUrl.json"
      );

    if (
      res.data &&
      res.data.mari
    ) {

      simsim =
        res.data.mari;

      console.log(
        "✅ Baby API loaded"
      );

    }

  } catch (e) {

    console.log(
      "❌ Baby API load failed:",
      e.message
    );

  }

})();

/* =========================
   CONFIG
========================= */

module.exports.config = {

  name: "baby",

  aliases: [
    "maria",
    "hippi"
  ],

  premium: false,

  version: "1.2.0",

  hasPermssion: 0,

  credits: "rX / Fixed",

  description:
    "AI Baby",

  commandCategory:
    "chat",

  usages:
    "[query]",

  cooldowns: 0,

  prefix: false

};

/* =========================
   HANDLE REPLY STORAGE
========================= */

function saveReply(
  event,
  messageID
) {

  try {

    if (
      !global.client ||
      !Array.isArray(
        global.client.handleReply
      )
    ) return;

    const senderID =
      getSenderID(event);

    if (!senderID) return;

    global.client.handleReply.push({

      name:
        module.exports.config.name,

      messageID:

        messageID,

      author:

        senderID,

      type:

        "simsimi"

    });

  } catch (e) {

    console.log(
      "❌ Save reply error:",
      e.message
    );

  }

}

/* =========================
   COMMAND
========================= */

module.exports.run =
async function ({
  api,
  event,
  args,
  Users
}) {

  const senderID =
    getSenderID(event);

  const threadID =
    getThreadID(event);

  const messageID =
    getMessageID(event);

  if (!threadID) return;

  if (!senderID) {

    return api.sendMessage(
      "⚠️ Sender ID পাওয়া যায়নি।",
      threadID,
      messageID
    );

  }

  const senderName =
    await getName(
      Users,
      senderID
    );

  const query =
    Array.isArray(args)
      ? args.join(" ").trim()
      : "";

  try {

    if (!simsim) {

      return api.sendMessage(
        "⏳ Baby AI loading...",
        threadID,
        messageID
      );

    }

    /* AUTOTEACH */

    if (
      args[0]?.toLowerCase() ===
      "autoteach"
    ) {

      const mode =
        args[1]?.toLowerCase();

      if (
        !["on", "off"].includes(mode)
      ) {

        return api.sendMessage(
          "✅ Use: baby autoteach on/off",
          threadID,
          messageID
        );

      }

      const status =
        mode === "on";

      await axios.post(
        `${simsim}/setting`,
        {
          autoTeach: status
        }
      );

      return api.sendMessage(
        `✅ Auto teach is now ${
          status
            ? "ON 🟢"
            : "OFF 🔴"
        }`,
        threadID,
        messageID
      );

    }

    /* LIST */

    if (
      args[0]?.toLowerCase() ===
      "list"
    ) {

      const res =
        await axios.get(
          `${simsim}/list`
        );

      return api.sendMessage(

`╭─╼🌟 𝐁𝐚𝐛𝐲 𝐀𝐈 𝐒𝐭𝐚𝐭𝐮𝐬
├ 📝 𝐓𝐞𝐚𝐜𝐡𝐞𝐝 𝐐𝐮𝐞𝐬𝐭𝐢𝐨𝐧𝐬: ${res.data.totalQuestions || 0}
├ 📦 𝐒𝐭𝐨𝐫𝐞𝐝 𝐑𝐞𝐩𝐥𝐢𝐞𝐬: ${res.data.totalReplies || 0}
╰─╼👤 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: 𝐫𝐗 𝐀𝐛𝐝𝐮𝐥𝐥𝐚𝐡`,

        threadID,
        messageID
      );

    }

    /* MSG */

    if (
      args[0]?.toLowerCase() ===
      "msg"
    ) {

      const trigger =
        args
          .slice(1)
          .join(" ")
          .trim();

      if (!trigger) {

        return api.sendMessage(
          "❌ | Use: baby msg [trigger]",
          threadID,
          messageID
        );

      }

      const res =
        await axios.get(
          `${simsim}/simsimi-list?ask=${encodeURIComponent(
            trigger
          )}`
        );

      if (
        !res.data?.replies?.length
      ) {

        return api.sendMessage(
          "❌ No replies found.",
          threadID,
          messageID
        );

      }

      const formatted =
        res.data.replies
          .map(
            (rep, i) =>
              `➤ ${i + 1}. ${rep}`
          )
          .join("\n");

      return api.sendMessage(

`📌 𝗧𝗿𝗶𝗴𝗴𝗲𝗿: ${trigger.toUpperCase()}
📋 𝗧𝗼𝘁𝗮𝗹: ${res.data.total}
━━━━━━━━━━━━━━
${formatted}`,

        threadID,
        messageID
      );

    }

    /* TEACH */

    if (
      args[0]?.toLowerCase() ===
      "teach"
    ) {

      const raw =
        args
          .slice(1)
          .join(" ")
          .trim();

      const parts =
        raw.split(" - ");

      if (parts.length < 2) {

        return api.sendMessage(
          "❌ | Use: teach [Question] - [Reply]",
          threadID,
          messageID
        );

      }

      const ask =
        parts[0].trim();

      const ans =
        parts.slice(1)
          .join(" - ")
          .trim();

      const res =
        await axios.get(
          `${simsim}/teach?ask=${encodeURIComponent(
            ask
          )}&ans=${encodeURIComponent(
            ans
          )}&senderID=${encodeURIComponent(
            String(senderID)
          )}&senderName=${encodeURIComponent(
            senderName
          )}`
        );

      return api.sendMessage(
        `✅ ${res.data?.message || "Taught successfully."}`,
        threadID,
        messageID
      );

    }

    /* EDIT */

    if (
      args[0]?.toLowerCase() ===
      "edit"
    ) {

      const raw =
        args
          .slice(1)
          .join(" ")
          .trim();

      const parts =
        raw.split(" - ");

      if (parts.length < 3) {

        return api.sendMessage(
          "❌ | Use: edit [Question] - [OldReply] - [NewReply]",
          threadID,
          messageID
        );

      }

      const ask =
        parts[0].trim();

      const oldR =
        parts[1].trim();

      const newR =
        parts.slice(2)
          .join(" - ")
          .trim();

      const res =
        await axios.get(
          `${simsim}/edit?ask=${encodeURIComponent(
            ask
          )}&old=${encodeURIComponent(
            oldR
          )}&new=${encodeURIComponent(
            newR
          )}`
        );

      return api.sendMessage(
        res.data?.message ||
        "✅ Edited.",
        threadID,
        messageID
      );

    }

    /* REMOVE */

    if (
      ["remove", "rm"].includes(
        args[0]?.toLowerCase()
      )
    ) {

      const raw =
        args
          .slice(1)
          .join(" ")
          .trim();

      const parts =
        raw.split(" - ");

      if (parts.length < 2) {

        return api.sendMessage(
          "❌ | Use: remove [Question] - [Reply]",
          threadID,
          messageID
        );

      }

      const ask =
        parts[0].trim();

      const ans =
        parts.slice(1)
          .join(" - ")
          .trim();

      const res =
        await axios.get(
          `${simsim}/delete?ask=${encodeURIComponent(
            ask
          )}&ans=${encodeURIComponent(
            ans
          )}`
        );

      return api.sendMessage(
        res.data?.message ||
        "✅ Removed.",
        threadID,
        messageID
      );

    }

    /* EMPTY */

    if (!query) {

      const replies = [
        "Hey baby 💖",
        "Yes, I'm here 😘",
        "হ্যাঁ বলো 😌"
      ];

      return api.sendMessage(
        replies[
          Math.floor(
            Math.random() *
            replies.length
          )
        ],
        threadID,
        messageID
      );

    }

    /* AI */

    await typing(1200);

    const res =
      await axios.get(
        `${simsim}/simsimi?text=${encodeURIComponent(
          query
        )}&senderName=${encodeURIComponent(
          senderName
        )}`
      );

    const response =
      res.data?.response ||
      "আমি বুঝতে পারিনি 😅";

    return api.sendMessage(

      response,

      threadID,

      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          saveReply(
            event,
            info.messageID
          );

        }

      },

      messageID

    );

  } catch (e) {

    console.log(
      "❌ Baby error:",
      e.message
    );

    return api.sendMessage(
      `❌ Error: ${e.message}`,
      threadID,
      messageID
    );

  }

};

/* =========================
   HANDLE REPLY
========================= */

module.exports.handleReply =
async function ({
  api,
  event,
  Users
}) {

  const senderID =
    getSenderID(event);

  const threadID =
    getThreadID(event);

  const messageID =
    getMessageID(event);

  if (
    !senderID ||
    !threadID
  ) return;

  const text =
    event?.body
      ?.toString()
      .trim();

  if (!text || !simsim) return;

  try {

    const senderName =
      await getName(
        Users,
        senderID
      );

    await typing(1200);

    const res =
      await axios.get(
        `${simsim}/simsimi?text=${encodeURIComponent(
          text
        )}&senderName=${encodeURIComponent(
          senderName
        )}`
      );

    const response =
      res.data?.response ||
      "আমি বুঝতে পারিনি 😅";

    return api.sendMessage(

      response,

      threadID,

      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          saveReply(
            event,
            info.messageID
          );

        }

      },

      messageID

    );

  } catch (e) {

    console.log(
      "❌ handleReply:",
      e.message
    );

    return api.sendMessage(
      `❌ Error: ${e.message}`,
      threadID,
      messageID
    );

  }

};

/* =========================
   HANDLE EVENT
========================= */

module.exports.handleEvent =
async function ({
  api,
  event,
  Users
}) {

  const text =
    event?.body
      ?.toString()
      .trim()
      .toLowerCase();

  if (!text || !simsim)
    return;

  const senderID =
    getSenderID(event);

  const threadID =
    getThreadID(event);

  const messageID =
    getMessageID(event);

  if (
    !senderID ||
    !threadID
  ) return;

  const senderName =
    await getName(
      Users,
      senderID
    );

  /* =========================
     BABY TRIGGERS
  ========================= */

  const triggers = [
    "baby",
    "বেবী",
    "বেবি",
    "bby",
    "বাবু",
    "বট",
    "bot",
    "rahat",
    "রাহাদ",
    "maria",
    "মারিয়া"
  ];

  /* =========================
     TRIGGER REPLY
  ========================= */

  if (
    triggers.includes(text)
  ) {

    if (
      registerSpamTrigger(
        senderID
      )
    ) {

      await applyTempBan(
        api,
        Users,
        senderID,
        threadID,
        messageID
      );

      return;

    }

    const replies = [

      "হ্যাঁ বলো 😒, তোমার জন্য কি করতে পারি?",

      "কী হয়েছে এতো ডাকো কেন 😒",

      "বলো, শুনছি আমি 😏",

      "হুম বলো কী বলবে 😌",

      "আরে Bolo, কী হয়েছে? 😚",

      "এই যে আমি আছি 😌",

      "এতো ডাকো কেন? 🤔",

      "হ্যাঁ জানাও কী দরকার 😊",

      "বলো কী করতে পারি তোমার জন্য",

      "আমি শুনছি, বলো 😌",

      "আবার বট বলে চলে যেও না 😒",

      "হুদাই ডাকাডাকি করো কেন 🙂",

      "কী ব্যাপার? আমাকে ডাকলে কেন? 🤔",

      "হুম, বলো 😌",

      "আচ্ছা বলো, কী হয়েছে?",

      "এই যে Baby হাজির 😎",

      "হ্যাঁ, আমি এখানে আছি ❤️",

      "কী খবর তোমার? 😊",

      "বলো, তোমার কথা শুনছি 🤗",

      "আমাকে ডাকছিলে? 😒",

      "হুম বলো, কী দরকার?",

      "ঠিক আছে, বলো 😊",

      "কী হয়েছে? শান্ত হয়ে বলো 😌",

      "আবার ডাকলে কিন্তু আসতেই হবে 😅"

    ];

    const reply =
      replies[
        Math.floor(
          Math.random() *
          replies.length
        )
      ];

    await typing(800);

    return api.sendMessage(

      reply,

      threadID,

      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          saveReply(
            event,
            info.messageID
          );

        }

      }

    );

  }

  /* =========================
     BABY + MESSAGE
  ========================= */

  const prefix =
    /^(baby|bby|bbz|xan|mari|মারিয়া|বেবী|বেবি)\s+/i;

  if (
    prefix.test(text)
  ) {

    const query =
      text
        .replace(prefix, "")
        .trim();

    if (!query)
      return;

    try {

      await typing(1000);

      const res =
        await axios.get(
          `${simsim}/simsimi?text=${encodeURIComponent(
            query
          )}&senderName=${encodeURIComponent(
            senderName
          )}`
        );

      const response =
        res.data?.response ||
        "আমি বুঝতে পারিনি 😅";

      return api.sendMessage(

        response,

        threadID,

        (err, info) => {

          if (
            !err &&
            info?.messageID
          ) {

            saveReply(
              event,
              info.messageID
            );

          }

        },

        messageID

      );

    } catch (e) {

      return api.sendMessage(
        `❌ Error: ${e.message}`,
        threadID,
        messageID
      );

    }

  }

  /* =========================
     AUTO TEACH
  ========================= */

  if (
    event?.type ===
    "message_reply"
  ) {

    try {

      const setting =
        await axios.get(
          `${simsim}/setting`
        );

      if (
        !setting.data?.autoTeach
      ) return;

      const ask =
        event
          ?.messageReply
          ?.body
          ?.toString()
          .trim();

      const ans =
        event
          ?.body
          ?.toString()
          .trim();

      if (
        !ask ||
        !ans ||
        ask.toLowerCase() ===
        ans.toLowerCase()
      ) return;

      setTimeout(
        async () => {

          try {

            await axios.get(
              `${simsim}/teach?ask=${encodeURIComponent(
                ask
              )}&ans=${encodeURIComponent(
                ans
              )}&senderID=${encodeURIComponent(
                String(senderID)
              )}&senderName=${encodeURIComponent(
                senderName
              )}`
            );

            console.log(
              "✅ Auto-taught:",
              ask,
              "→",
              ans
            );

          } catch (err) {

            console.log(
              "❌ Auto-teach:",
              err.message
            );

          }

        },
        300
      );

    } catch (e) {

      console.log(
        "❌ Auto-teach setting:",
        e.message
      );

    }

  }

};
