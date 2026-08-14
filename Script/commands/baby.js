const axios = require("axios");

let simsim = "";

/* =========================
   SPAM SETTINGS
========================= */

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
    event?.userID ||
    event?.userId ||
    event?.author ||
    event?.messageReply?.senderID ||
    event?.messageReply?.senderId ||
    null
  );
}

function getThreadID(event) {
  return (
    event?.threadID ||
    event?.threadId ||
    null
  );
}

function getMessageID(event) {
  return (
    event?.messageID ||
    event?.messageId ||
    null
  );
}


/* =========================
   SAFE USER NAME
========================= */

async function getSenderName(Users, event) {

  const senderID = getSenderID(event);

  if (!senderID) {
    return "User";
  }

  try {

    if (
      Users &&
      typeof Users.getNameUser === "function"
    ) {

      const name =
        await Users.getNameUser(senderID);

      return name || "User";
    }

  } catch (e) {

    console.log(
      "⚠️ getNameUser skipped:",
      e.message
    );

  }

  return (
    event?.senderName ||
    event?.sender?.name ||
    "User"
  );
}


/* =========================
   SPAM REGISTER
========================= */

function registerSpamTrigger(senderID) {

  if (!senderID) {
    return false;
  }

  const now = Date.now();

  let arr =
    spamTriggerMap.get(senderID) || [];

  arr = arr.filter(
    time =>
      now - time < SPAM_WINDOW_MS
  );

  arr.push(now);

  spamTriggerMap.set(
    senderID,
    arr
  );

  return arr.length >= SPAM_LIMIT;
}


/* =========================
   TEMP BAN
========================= */

async function applyTempBan(
  api,
  Users,
  senderID,
  threadID,
  messageID
) {

  if (!senderID) {
    return;
  }

  try {

    if (
      global.utils &&
      typeof global.utils.guardAdminBan ===
        "function"
    ) {

      if (
        global.utils.guardAdminBan(
          api,
          senderID,
          threadID,
          messageID
        )
      ) {

        spamTriggerMap.delete(
          senderID
        );

        return;
      }
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
      {
        data
      }
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

    spamTriggerMap.delete(
      senderID
    );

    await api.sendMessage(
      "❌ 𝗬𝗼𝘂 𝗵𝗮𝘃𝗲 𝗯𝗲𝗲𝗻 𝗯𝗮𝗻𝗻𝗲𝗱 𝗳𝗼𝗿 𝟭𝟬 𝗺𝗶𝗻𝘂𝘁𝗲𝘀. 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗮𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿.",
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
          ) {
            return;
          }

          const result =
            await Users.getData(
              senderID
            );

          const d =
            result?.data || {};

          d.banned = 0;

          await Users.setData(
            senderID,
            {
              data: d
            }
          );

          global.data.userBanned.delete(
            senderID
          );

        } catch (e) {

          console.log(
            "❌ Auto-unban error:",
            e.message
          );

        }

      },
      TEMP_BAN_MS
    );

  } catch (e) {

    console.log(
      "❌ Temp-ban error:",
      e.message
    );

  }
}


/* =========================
   DELAY
========================= */

function delay(ms) {

  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );

}


/* =========================
   LOAD API
========================= */

(async () => {

  try {

    const res =
      await axios.get(
        "https://raw.githubusercontent.com/abdullahrx07/X-api/main/MaRiA/baseApiUrl.json",
        {
          timeout: 15000
        }
      );

    if (
      res.data &&
      res.data.mari
    ) {

      simsim =
        res.data.mari;

      console.log(
        "✅ Baby API loaded:",
        simsim
      );

    }

  } catch (e) {

    console.log(
      "❌ Baby API loading error:",
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
    "Baby AI with Teach, Reply and AutoTeach",

  commandCategory: "chat",

  usages: "[query]",

  cooldowns: 0,

  prefix: false

};


/* =========================
   SAVE HANDLE REPLY
========================= */

function saveHandleReply(
  event,
  messageID
) {

  try {

    if (
      !global.client ||
      !Array.isArray(
        global.client.handleReply
      )
    ) {
      return;
    }

    const author =
      getSenderID(event);

    global.client.handleReply.push({

      name:
        module.exports.config.name,

      messageID:
        messageID,

      author:
        author || "unknown",

      type:
        "simsimi"

    });

  } catch (e) {

    console.log(
      "⚠️ handleReply save error:",
      e.message
    );

  }

}


/* =========================
   API AI REPLY
========================= */

async function getAIReply(
  text,
  senderName,
  senderID
) {

  if (!simsim) {

    throw new Error(
      "API not loaded yet"
    );

  }

  /*
    senderID এখানে ইচ্ছা করেই পাঠানো হচ্ছে।
    তোমার error:
    "senderID is required"
    এটার জন্য এটা গুরুত্বপূর্ণ।
  */

  const url =
    `${simsim}/simsimi` +
    `?text=${encodeURIComponent(text)}` +
    `&senderName=${encodeURIComponent(senderName)}` +
    `&senderID=${encodeURIComponent(
      String(senderID || "unknown")
    )}`;

  const res =
    await axios.get(
      url,
      {
        timeout: 30000
      }
    );

  return (
    res.data?.response ||
    "আমি বুঝতে পারিনি 😅"
  );

}


/* =========================
   MAIN COMMAND
========================= */

module.exports.run =
async function ({
  api,
  event,
  args,
  Users
}) {

  const threadID =
    getThreadID(event);

  const messageID =
    getMessageID(event);

  const senderID =
    getSenderID(event);

  if (!threadID) {
    return;
  }

  if (!senderID) {

    return api.sendMessage(
      "⚠️ Sender information পাওয়া যায়নি।",
      threadID,
      messageID
    );

  }

  const senderName =
    await getSenderName(
      Users,
      event
    );

  const query =
    Array.isArray(args)
      ? args.join(" ").trim()
      : "";


  try {

    if (!simsim) {

      return api.sendMessage(
        "⏳ Baby AI এখনও loading হচ্ছে। একটু পরে আবার চেষ্টা করো।",
        threadID,
        messageID
      );

    }


    /* =========================
       AUTOTEACH
    ========================= */

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
          autoTeach:
            status
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
      args[0]?.toLowerCase() ===
      "list"
    ) {

      const res =
        await axios.get(
          `${simsim}/list`,
          {
            timeout: 30000
          }
        );

      return api.sendMessage(

`╭─╼🌟 𝐁𝐚𝐛𝐲 𝐀𝐈 𝐒𝐭𝐚𝐭𝐮𝐬
├ 📝 𝐓𝐞𝐚𝐜𝐡𝐞𝐝 𝐐𝐮𝐞𝐬𝐭𝐢𝐨𝐧𝐬: ${res.data?.totalQuestions || 0}
├ 📦 𝐒𝐭𝐨𝐫𝐞𝐝 𝐑𝐞𝐩𝐥𝐢𝐞𝐬: ${res.data?.totalReplies || 0}
╰─╼👤 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: 𝐫𝐗 𝐀𝐛𝐝𝐮𝐥𝐥𝐚𝐡`,

        threadID,
        messageID
      );

    }


    /* =========================
       MSG
    ========================= */

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
          )}`,
          {
            timeout: 30000
          }
        );

      if (
        !res.data?.replies ||
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

      return api.sendMessage(

`📌 𝗧𝗿𝗶𝗴𝗴𝗲𝗿: ${trigger.toUpperCase()}
📋 𝗧𝗼𝘁𝗮𝗹: ${res.data.total || res.data.replies.length}
━━━━━━━━━━━━━━
${formatted}`,

        threadID,
        messageID
      );

    }


    /* =========================
       TEACH
    ========================= */

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
        parts
          .slice(1)
          .join(" - ")
          .trim();

      const res =
        await axios.get(
          `${simsim}/teach` +
          `?ask=${encodeURIComponent(ask)}` +
          `&ans=${encodeURIComponent(ans)}` +
          `&senderID=${encodeURIComponent(String(senderID))}` +
          `&senderName=${encodeURIComponent(senderName)}`,
          {
            timeout: 30000
          }
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
        parts
          .slice(2)
          .join(" - ")
          .trim();

      const res =
        await axios.get(
          `${simsim}/edit` +
          `?ask=${encodeURIComponent(ask)}` +
          `&old=${encodeURIComponent(oldR)}` +
          `&new=${encodeURIComponent(newR)}`,
          {
            timeout: 30000
          }
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
        parts
          .slice(1)
          .join(" - ")
          .trim();

      const res =
        await axios.get(
          `${simsim}/delete` +
          `?ask=${encodeURIComponent(ask)}` +
          `&ans=${encodeURIComponent(ans)}`,
          {
            timeout: 30000
          }
        );

      return api.sendMessage(
        res.data?.message ||
        "✅ Removed successfully.",
        threadID,
        messageID
      );

    }


    /* =========================
       EMPTY
    ========================= */

    if (!query) {

      const texts = [
        "Hey baby 💖",
        "Yes, I'm here 😘",
        "হ্যাঁ বলো 😌",
        "বলো, শুনছি 😊"
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
       AI
    ========================= */

    await delay(1500);

    const response =
      await getAIReply(
        query,
        senderName,
        senderID
      );

    return api.sendMessage(

      response,

      threadID,

      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          saveHandleReply(
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

  try {

    const threadID =
      getThreadID(event);

    const messageID =
      getMessageID(event);

    /*
      সবচেয়ে গুরুত্বপূর্ণ অংশ:

      Reply event-এ senderID না থাকলেও
      messageReply-এর senderID বা অন্য
      available field থেকে নেওয়া হবে।
    */

    const senderID =
      getSenderID(event);

    if (!threadID) {
      return;
    }

    const text =
      event?.body
        ?.toString()
        .trim()
        .toLowerCase();

    if (!text) {
      return;
    }

    if (!simsim) {

      return api.sendMessage(
        "⏳ Baby API এখনও loading হচ্ছে।",
        threadID,
        messageID
      );

    }

    /*
      এখানে আর সরাসরি
      Users.getNameUser(event.senderID)
      করা হচ্ছে না।
    */

    let senderName = "User";

    try {

      if (
        event?.senderName
      ) {

        senderName =
          event.senderName;

      } else if (
        event?.sender?.name
      ) {

        senderName =
          event.sender.name;

      } else if (
        senderID &&
        Users &&
        typeof Users.getNameUser ===
          "function"
      ) {

        senderName =
          await Users.getNameUser(
            senderID
          );

      }

    } catch (e) {

      senderName = "User";

    }


    /* =========================
       AI REPLY
    ========================= */

    await delay(1500);

    const response =
      await getAIReply(
        text,
        senderName,
        senderID || "unknown"
      );

    return api.sendMessage(

      response,

      threadID,

      (err, info) => {

        if (
          !err &&
          info?.messageID
        ) {

          saveHandleReply(
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

    const threadID =
      getThreadID(event);

    const messageID =
      getMessageID(event);

    if (threadID) {

      return api.sendMessage(
        `❌ Error: ${e.message}`,
        threadID,
        messageID
      );

    }

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

  try {

    const text =
      event?.body
        ?.toString()
        .trim()
        .toLowerCase();

    if (!text) {
      return;
    }

    if (!simsim) {
      return;
    }

    const threadID =
      getThreadID(event);

    const messageID =
      getMessageID(event);

    const senderID =
      getSenderID(event);

    if (
      !threadID ||
      !senderID
    ) {
      return;
    }

    const senderName =
      await getSenderName(
        Users,
        event
      );


    /* =========================
       TRIGGERS
    ========================= */

    const triggers = [

      "baby",
      "bby",
      "বেবী",
      "বেবি",
      "বাবু",
      "বট",
      "bot",
      "rahat",
      "রাহাদ",
      "maria",
      "মারিয়া"

    ];


    /* =========================
       TRIGGER RESPONSE
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

        "আরে Bolo, কী হয়েছে? 😚",

        "বলো, শুনছি আমি 😌",

        "কী হয়েছে এতো ডাকো কেন? 😒",

        "হুম বলো কী বলবে 😏",

        "এই যে আমি আছি 😌",

        "এতো ডাকো কেন? 🤔",

        "বলো কী করতে পারি তোমার জন্য 😊",

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

        "আবার ডাকলে কিন্তু আসতেই হবে 😅",

        "বলো জানু 🌚",

        "হা বলো 😒 কী করতে পারি?",

        "আজকে এত ডাকাডাকি কেন? 😂",

        "আমি তো এখানেই আছি 😎",

        "কী হলো? বলো তো 🙂",

        "হুমম... শুনছি 😌",

        "এই যে, হাজির! 🙋",

        "বলো না, কী হয়েছে? 😊",

        "তোমার মেসেজ পেয়েছি 😌",

        "ঠিক আছে, শুরু করো 😄"

      ];

      const reply =
        replies[
          Math.floor(
            Math.random() *
            replies.length
          )
        ];

      await delay(800);

      return api.sendMessage(

        reply,

        threadID,

        (err, info) => {

          if (
            !err &&
            info?.messageID
          ) {

            saveHandleReply(
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

    const matchPrefix =
      /^(baby|bby|xan|bbz|mari|মারিয়া|বেবী|বেবি)\s+/i;

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

        await delay(1500);

        const response =
          await getAIReply(
            query,
            senderName,
            senderID
          );

        ret
