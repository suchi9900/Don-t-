const axios = require("axios");

let simsim = "";
let count_req = 0;

const spamTriggerMap = new Map();

const SPAM_WINDOW_MS = 30 * 1000;
const SPAM_LIMIT = 4;
const TEMP_BAN_MS = 10 * 60 * 1000;

/* =========================
   SAFE EVENT FUNCTIONS
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

async function getSenderName(Users, senderID) {
  if (!senderID) return "User";

  try {
    const name = await Users.getNameUser(senderID);
    return name || "User";
  } catch (e) {
    return "User";
  }
}

/* =========================
   SPAM SYSTEM
========================= */

function registerSpamTrigger(senderID) {
  if (!senderID) return false;

  const now = Date.now();

  let arr = spamTriggerMap.get(senderID) || [];

  arr = arr.filter(time => now - time < SPAM_WINDOW_MS);

  arr.push(now);

  spamTriggerMap.set(senderID, arr);

  return arr.length >= SPAM_LIMIT;
}

async function applyTempBan(api, Users, senderID, threadID, messageID) {
  if (!senderID) return;

  try {
    if (
      global.utils &&
      typeof global.utils.guardAdminBan === "function" &&
      global.utils.guardAdminBan(api, senderID, threadID, messageID)
    ) {
      spamTriggerMap.delete(senderID);
      return;
    }
  } catch (e) {}

  try {
    const moment = require("moment-timezone");

    const dateAdded = moment
      .tz("Asia/Dhaka")
      .format("HH:mm:ss L");

    const userData = await Users.getData(senderID);

    const data = userData?.data || {};

    data.banned = 1;
    data.reason = "Spam trigger";
    data.dateAdded = dateAdded;

    await Users.setData(senderID, {
      data
    });

    if (!global.data.userBanned) {
      global.data.userBanned = new Map();
    }

    global.data.userBanned.set(senderID, {
      reason: data.reason,
      dateAdded
    });

    spamTriggerMap.delete(senderID);

    await api.sendMessage(
      "❌ 𝗬𝗼𝘂 𝗵𝗮𝘃𝗲 𝗯𝗲𝗲𝗻 𝗯𝗮𝗻𝗻𝗲𝗱 𝗳𝗼𝗿 𝟭𝟬 𝗺𝗶𝗻𝘂𝘁𝗲𝘀. 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿.",
      threadID,
      messageID
    );

    setTimeout(async () => {
      try {
        if (
          !global.data.userBanned ||
          !global.data.userBanned.has(senderID)
        ) {
          return;
        }

        const result = await Users.getData(senderID);

        const d = result?.data || {};

        d.banned = 0;

        await Users.setData(senderID, {
          data: d
        });

        global.data.userBanned.delete(senderID);

      } catch (e) {
        console.log(
          "❌ Auto-unban error:",
          e.message
        );
      }
    }, TEMP_BAN_MS);

  } catch (e) {
    console.log(
      "❌ Temp-ban error:",
      e.message
    );
  }
}

/* =========================
   SAFE TYPING
========================= */

async function sendTypingIndicatorV2(api, threadID, status) {
  try {
    /*
      অনেক Mirai fork-এ mqttClient থাকে না।
      তাই এখানে typing error না দিয়ে simply skip করা হচ্ছে।
    */

    if (
      global.client &&
      typeof global.client.sendTyping === "function"
    ) {
      await global.client.sendTyping(
        api,
        threadID,
        status
      );
    }

  } catch (e) {
    console.log(
      "⚠️ Typing indicator skipped:",
      e.message
    );
  }
}

async function safeDelay(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

/* =========================
   API LOAD
========================= */

(async () => {
  try {

    const res = await axios.get(
      "https://raw.githubusercontent.com/abdullahrx07/X-api/main/MaRiA/baseApiUrl.json"
    );

    if (res.data && res.data.mari) {
      simsim = res.data.mari;
      console.log("✅ Baby API loaded");
    }

  } catch (e) {

    console.log(
      "❌ Baby API load error:",
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

  version: "2.0.0",

  hasPermssion: 0,

  credits: "rX / Fixed",

  description:
    "Baby AI with Teach, AutoTeach and Reply support",

  commandCategory: "chat",

  usages: "[query]",

  cooldowns: 0,

  prefix: false
};

/* =========================
   SEND REPLY HANDLER
========================= */

function pushHandleReply(
  event,
  messageID
) {

  try {

    const senderID =
      getSenderID(event);

    if (
      !global.client ||
      !Array.isArray(global.client.handleReply)
    ) {
      return;
    }

    global.client.handleReply.push({

      name:
        module.exports.config.name,

      messageID,

      author:
        senderID,

      type:
        "simsimi"

    });

  } catch (e) {

    console.log(
      "⚠️ handleReply error:",
      e.message
    );

  }
}

/* =========================
   MAIN COMMAND
========================= */

module.exports.run = async function ({
  api,
  event,
  args,
  Users
}) {

  const threadID =
    getThreadID(event);

  const messageID =
    getMessageID(event);

  const uid =
    getSenderID(event);

  if (!threadID) {
    return;
  }

  if (!uid) {

    return api.sendMessage(
      "⚠️ Sender information পাওয়া যায়নি। আবার মেসেজ দিন।",
      threadID,
      messageID
    );

  }

  const senderName =
    await getSenderName(
      Users,
      uid
    );

  const query =
    Array.isArray(args)
      ? args.join(" ").trim().toLowerCase()
      : "";

  try {

    if (!simsim) {

      return api.sendMessage(
        "⏳ Baby AI এখনও লোড হচ্ছে। একটু পরে আবার চেষ্টা করো।",
        threadID,
        messageID
      );

    }

    /* =========================
       AUTOTEACH
    ========================= */

    if (
      args[0] &&
      args[0].toLowerCase() ===
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

      const res =
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

    /* =========================
       LIST
    ========================= */

    if (
      args[0] &&
      args[0].toLowerCase() ===
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

    /* =========================
       MSG
    ========================= */

    if (
      args[0] &&
      args[0].toLowerCase() ===
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
        !res.data ||
        !res.data.replies ||
        !res.data.replies.length
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

      const msg =

`📌 𝗧𝗿𝗶𝗴𝗴𝗲𝗿: ${trigger.toUpperCase()}
📋 𝗧𝗼𝘁𝗮𝗹: ${res.data.total || res.data.replies.length}
━━━━━━━━━━━━━━
${formatted}`;

      return api.sendMessage(
        msg,
        threadID,
        messageID
      );

    }

    /* =========================
       TEACH
    ========================= */

    if (
      args[0] &&
      args[0].toLowerCase() ===
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
        parts.shift().trim();

      const ans =
        parts.join(" - ").trim();

      if (!ask || !ans) {

        return api.sendMessage(
          "❌ Question এবং Reply দুটোই দিতে হবে।",
          threadID,
          messageID
        );

      }

      const res =
        await axios.get(
          `${simsim}/teach?ask=${encodeURIComponent(
            ask
          )}&ans=${encodeURIComponent(
            ans
          )}&senderID=${encodeURIComponent(
            uid
          )}&senderName=${encodeURIComponent(
            senderName
          )}`
        );

      return api.sendMessage(
        `✅ ${
          res.data?.message ||
          "Successfully taught."
        }`,
        threadID,
        messageID
      );

    }

    /* =========================
       EDIT
    ========================= */

    if (
      args[0] &&
      args[0].toLowerCase() ===
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
        "✅ Edited successfully.",
        threadID,
        messageID
      );

    }

    /* =========================
       REMOVE
    ========================= */

    if (
      args[0] &&
      ["remove", "rm"].includes(
        args[0].toLowerCase()
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
        "✅ Removed successfully.",
        threadID,
        messageID
      );

    }

    /* =========================
       EMPTY MESSAGE
    ========================= */

    if (!query) {

      const texts = [

        "Hey baby 💖",

        "Yes, I'm here 😊",

        "হ্যাঁ বলো 😌",

        "কী হয়েছে? বলো 😊"

      ];

      const reply =
        texts[
          Math.floor(
            Math.random() *
            texts.length
          )
        ];

      return api.sendMessage(
        reply,
        threadID,
        messageID
      );

    }

    /* =========================
       AI RESPONSE
    ========================= */

    await sendTypingIndicatorV2(
      api,
      threadID,
      true
    );

    await safeDelay(1500);

    await sendTypingIndicatorV2(
      api,
      threadID,
      false
    );

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

          pushHandleReply(
            event,
            info.messageID
          );

        }

      },
      messageID
    );

  } catch (e) {

    console.log(
      "❌ Baby command error:",
      e
    );

    return api.sendMessage(
      `❌ Error: ${
        e.message || "Unknown error"
      }`,
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

  const threadID =
    getThreadID(event);

  const messageID =
    getMessageID(event);

  const uid =
    getSenderID(event);

  if (!threadID || !uid) {
    return;
  }

  const text =
    event?.body
      ?.toString()
      .trim()
      .toLowerCase();

  if (!text || !simsim) {
    return;
  }

  try {

    const senderName =
      await getSenderName(
        Users,
        uid
      );

    await sendTypingIndicatorV2(
      api,
      threadID,
      true
    );

    await safeDelay(1500);

    await sendTypingIndicatorV2(
      api,
      threadID,
      false
    );

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

          pushHandleReply(
            event,
            info.messageID
          );

        }

      },

      messageID

    );

  } catch (e) {

    console.log(
      "❌ Baby handleReply error:",
      e.message
    );

    return api.sendMessage(
      `❌ Error: ${
        e.message || "Unknown error"
      }`,
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

  if (!text || !simsim) {
    return;
  }

  const threadID =
    getThreadID(event);

  const messageID =
    getMessageID(event);

  const senderID =
    getSenderID(event);

  if (!threadID || !senderID) {
    return;
  }

  const senderName =
    await getSenderName(
      Users,
      senderID
    );

  /* =========================
     TRIGGERS
  ========================= */

  const triggers = [

    "বাবু",
    "bby",
    "বট",
    "bot",
    "rahat",
    "রাহাদ",
    "baby",
    "maria",
    "মারিয়া"

  ];

  /* =========================
     SPAM CHECK
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

  }

  /* =========================
     TRIGGER REPLIES
  ========================= */

  if (
    triggers.includes(text)
  ) {

    const replies = [

      "আমাকে না ডেকে সজীবের ইনবক্সে যাও 😌",

      "হ্যাঁ বলো 😒 কী করতে পারি?",

      "বার বার ডাকলে কিন্তু মাথা গরম হয়ে যায় 😑",

      "বলো, শুনছি 😊",

      "কী হয়েছে এতো ডাকো কেন? 😒",

      "এই যে আমি আছি 😌",

      "এতো ডাকাডাকি করো কেন? 😅",

      "বলো কী বলবে 🤭",

      "হুম বলো, শুনছি তো 😌",

      "আজকে মন ভালো নেই, আস্তে করে বলো 😪",

      "এই প্রথম বট দেখছো নাকি? 😂",

      "হুদাই ডাকাডাকি করো কেন? 🙂",

      "আমাকে ডাকলে চকলেট দিতে হবে 😒🍫",

      "বলো কী করতে পারি তোমার জন্য 😊",

      "তোমার কথা শুনছি, বলো 😌",

      "আচ্ছা বলো, কী দরকার? 😐",

      "আমি তো এখানেই আছি 😎",

      "সজীব বসের পক্ষ থেকে শুভেচ্ছা 😌",

      "আসসালামু আলাইকুম 🌸",

      "ওয়ালাইকুম আসসালাম 🌺",

      "হুম জানাও কী হয়েছে 🙂",

      "দূরে যেও না, কথা বলো 😄",

      "কী ব্যাপার? আমাকে ডাকলে কেন? 🤔",

      "হা বলো 😒 কী করতে পারি?",

      "আমি শুনছি, বলো 😌",

      "আবার বট বলে চলে যেও না কিন্তু 😒",

      "ঠিক আছে, বলো তোমার কথা 😊",

      "হুম, আমি আছি এখানে 🤗",

      "তোমার সুন্দর কথাটা শুনতে চাই 😌",

      "আজকে এত ডাকাডাকি কেন? 😂",

      "বলো, সবার সামনে বলবে নাকি? 🤭",

      "কী খবর তোমার? 😊",

      "ভালো আছো তো? 🌸",

      "আচ্ছা বলো, কী নিয়ে কথা বলবে?",

      "আমি কিন্তু সব শুনছি 😎",

      "হুমম... বলো 😌",

      "এই যে, হাজির! 🙋",

      "কী হলো? 😐",

      "আবার ডাকছো? 😂",

      "বলো বাবু, কী হয়েছে? 😊",

      "আমাকে ডেকেছো? 🤔",

      "হুম বলো, শুনছি ❤️",

      "কী সাহায্য লাগবে বলো 🙂",

      "চুপচাপ ডাকলে তো হবে না, কথা বলো 😑",

      "বলো না, এত ভাব কেন? 😄",

      "আমি প্রস্তুত, বলো 😎",

      "হ্যাঁ, তোমার মেসেজ পেয়েছি 😌",

      "ঠিক আছে, শুরু করো 😄"

    ];

    const reply =
      replies[
        Math.floor(
          Math.random() *
          replies.length
        )
      ];

    await sendTypingIndicatorV2(
      api,
      threadID,
      true
    );

    await safeDelay(1200);

    await sendTypingIndicatorV2(
      api,
      threadID,
      false
    );

    return api.sendMessage(

      reply,

      threadID,

      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          pushHandleReply(
            event,
            info.messageID
          );

        }

      }

    );

  }

  /* =========================
     PREFIX STYLE
     baby hello
     bby hello
  ========================= */

  const matchPrefix =
    /^(baby|bby|xan|bbz|mari|মারিয়া)\s+/i;

  if (
    matchPrefix.test(text)
  ) {

    const query =
      text
        .replace(
          matchPrefix,
          ""
        )
        .trim();

    if (!query) {
      return;
    }

    try {

      await sendTypingIndicatorV2(
        api,
        threadID,
        true
      );

      await safeDelay(1200);

      await sendTypingIndicatorV2(
        api,
        threadID,
        false
      );

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

            pushHandleReply(
              event,
              info.messageID
            );

          }

        },

        messageID

      );

    } catch (e) {

      console.log(
        "❌ Prefix AI error:",
        e.message
      );

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
      ) {
        return;
      }

      const ask =
        event?.messageReply?.b
