const axios = require("axios");
let simsim = "";
let count_req = 0;
const spamTriggerMap = new Map();
const SPAM_WINDOW_MS = 30 * 1000;
const SPAM_LIMIT = 4;
const TEMP_BAN_MS = 10 * 60 * 1000;
function registerSpamTrigger(senderID) {
const now = Date.now();
let arr = spamTriggerMap.get(senderID) || [];
arr = arr.filter(t => now - t < SPAM_WINDOW_MS);
arr.push(now);
spamTriggerMap.set(senderID, arr);
return arr.length >= SPAM_LIMIT;
}
async function applyTempBan(api, Users, senderID, threadID, messageID) {
if (global.utils.guardAdminBan(api, senderID, threadID, messageID)) {
spamTriggerMap.delete(senderID);
return;
}
const moment = require("moment-timezone");
const dateAdded = moment.tz("Asia/Dhaka").format("HH:mm:ss L");
const data = (await Users.getData(senderID)).data || {};
data.banned = 1;
data.reason = "Spam trigger";
data.dateAdded = dateAdded;
await Users.setData(senderID, { data });
if (!global.data.userBanned) global.data.userBanned = new Map();
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
if (!global.data.userBanned.has(senderID)) return;
const d = (await Users.getData(senderID)).data || {};
d.banned = 0;
await Users.setData(senderID, { data: d });
global.data.userBanned.delete(senderID);
} catch (e) {
console.log("❌ Auto-unban error:", e.message);
}
}, TEMP_BAN_MS);
}

// Note : THIS CODE MADE BY RX @RX_ABDULLAH007 (GIVE CREDIT OTHERWISE EVERYONE
async function sendTypingIndicatorV2(sendTyping, threadID) {
try {
var wsContent = {
app_id: 2220391788200892,
payload: JSON.stringify({
label: 3, //original author - rX Abdullah
payload: JSON.stringify({
thread_key: threadID.toString(),
is_group_thread: +(threadID.toString().length >= 16),
is_typing: +sendTyping,
attribution: 0
}),
version: 5849951561777440
}),
request_id: ++count_req,
type: 4
};
await new Promise((resolve, reject) =>
mqttClient.publish('/ls_req', JSON.stringify(wsContent), {}, (err, _packet) =>
err ? reject(err) : resolve()
)
);
} catch (err) {
console.log("⚠️ Typing indicator error:", err.message);
}
}

(async () => {
try {
const res = await axios.get("https://raw.githubusercontent.com/abdullahrx07/X-api/main/MaRiA/baseApiUrl.json");
if (res.data && res.data.mari) simsim = res.data.mari;
} catch {}
})();

module.exports.config = {
name: "baby",
aliases: ["maria", "hippi"],
premium: false,
version: "1.1.0",
hasPermssion: 0,
credits: "rX",
description: "AI auto teach with Teach & List support + Typing effect",
commandCategory: "chat",
usages: "[query]",
cooldowns: 0,
prefix: false
};

module.exports.run = async function ({ api, event, args, Users }) {
const uid = event.senderID;
const senderName = await Users.getNameUser(uid);
const query = args.join(" ").toLowerCase();

try {
if (!simsim) return api.sendMessage("❌ API not loaded yet.", event.threadID, event.messageID);

if (args[0] === "autoteach") {
const mode = args[1];
if (!["on", "off"].includes(mode))
return api.sendMessage("✅ Use: baby autoteach on/off", event.threadID, event.messageID);

const status = mode === "on";
await axios.post(${simsim}/setting, { autoTeach: status });
return api.sendMessage(✅ Auto teach is now ${status ? "ON 🟢" : "OFF 🔴"}, event.threadID, event.messageID);
}

if (args[0] === "list") {
const res = await axios.get(${simsim}/list);
return api.sendMessage(
╭─╼🌟 𝐁𝐚𝐛𝐲 𝐀𝐈 𝐒𝐭𝐚𝐭𝐮𝐬\n├ 📝 𝐓𝐞𝐚𝐜𝐡𝐞𝐝 𝐐𝐮𝐞𝐬𝐭𝐢𝐨𝐧𝐬: ${res.data.totalQuestions}\n├ 📦 𝐒𝐭𝐨𝐫𝐞𝐝 𝐑𝐞𝐩𝐥𝐢𝐞𝐬: ${res.data.totalReplies}\n╰─╼👤 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: 𝐫𝐗 𝐀𝐛𝐝𝐮𝐥𝐥𝐚𝐡,
event.threadID,
event.messageID
);
}

if (args[0] === "msg") {
const trigger = args.slice(1).join(" ").trim();
if (!trigger) return api.sendMessage("❌ | Use: !baby msg [trigger]", event.threadID, event.messageID);

const res = await axios.get(${simsim}/simsimi-list?ask=${encodeURIComponent(trigger)});
if (!res.data.replies || res.data.replies.length === 0)
return api.sendMessage("❌ No replies found.", event.threadID, event.messageID);

const formatted = res.data.replies.map((rep, i) => ➤ ${i + 1}. ${rep}).join("\n");
const msg = 📌 𝗧𝗿𝗶𝗴𝗴𝗲𝗿: ${trigger.toUpperCase()}\n📋 𝗧𝗼𝘁𝗮𝗹: ${res.data.total}\n━━━━━━━━━━━━━━\n${formatted};
return api.sendMessage(msg, event.threadID, event.messageID);
}

if (args[0] === "teach") {
const parts = query.replace("teach ", "").split(" - ");
if (parts.length < 2)
return api.sendMessage("❌ | Use: teach [Question] - [Reply]", event.threadID, event.messageID);

const [ask, ans] = parts;
const res = await axios.get(${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderID=${uid}&senderName=${encodeURIComponent(senderName)});
return api.sendMessage(✅ ${res.data.message}, event.threadID, event.messageID);
}

if (args[0] === "edit") {
const parts = query.replace("edit ", "").split(" - ");
if (parts.length < 3)
return api.sendMessage("❌ | Use: edit [Question] - [OldReply] - [NewReply]", event.threadID, event.messageID);

const [ask, oldR, newR] = parts;
const res = await axios.get(${simsim}/edit?ask=${encodeURIComponent(ask)}&old=${encodeURIComponent(oldR)}&new=${encodeURIComponent(newR)});
return api.sendMessage(res.data.message, event.threadID, event.messageID);
}

if (["remove", "rm"].includes(args[0])) {
const parts = query.replace(/^(remove|rm)\s*/, "").split(" - ");
if (parts.length < 2)
return api.sendMessage("❌ | Use: remove [Question] - [Reply]", event.threadID, event.messageID);

const [ask, ans] = parts;
const res = await axios.get(${simsim}/delete?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)});
return api.sendMessage(res.data.message, event.threadID, event.messageID);
}

if (!query) {
const texts = ["Hey baby 💖", "Yes, I'm here 😘"];
const reply = texts[Math.floor(Math.random() * texts.length)];
return api.sendMessage(reply, event.threadID);
}

await sendTypingIndicatorV2(true, event.threadID);
await new Promise(r => setTimeout(r, 2000));
await sendTypingIndicatorV2(false, event.threadID);

const res = await axios.get(${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)});
return api.sendMessage(res.data.response, event.threadID, (err, info) => {
if (!err) {
global.client.handleReply.push({
name: module.exports.config.name,
messageID: info.messageID,
author: event.senderID,
type: "simsimi"
});
}
}, event.messageID);

} catch (e) {
return api.sendMessage(❌ Error: ${e.message}, event.threadID, event.messageID);
}
};

module.exports.handleReply = async function ({ api, event, Users }) {
const senderName = await Users.getNameUser(event.senderID);
const text = event.body?.toLowerCase();
if (!text || !simsim) return;

try {
await sendTypingIndicatorV2(true, event.threadID);
await new Promise(r => setTimeout(r, 2000));
await sendTypingIndicatorV2(false, event.threadID);

const res = await axios.get(${simsim}/simsimi?text=${encodeURIComponent(text)}&senderName=${encodeURIComponent(senderName)});
return api.sendMessage(res.data.response, event.threadID, (err, info) => {
if (!err) {
global.client.handleReply.push({
name: module.exports.config.name,
messageID: info.messageID,
author: event.senderID,
type: "simsimi"
});
}
}, event.messageID);
} catch (e) {
return api.sendMessage(❌ Error: ${e.message}, event.threadID, event.messageID);
}
};

module.exports.handleEvent = async function ({ api, event, Users }) {
const text = event.body?.toLowerCase().trim();
if (!text || !simsim) return;

const senderName = await Users.getNameUser(event.senderID);
const triggers = ["বাবু", "bby", "বট", "bot", "Rahat", "রাহাদ"];

if (triggers.includes(text)) {
if (registerSpamTrigger(event.senderID)) {
await applyTempBan(api, Users, event.senderID, event.threadID, event.messageID);
return;
}
}

if (triggers.includes(text)) {
const replies = ["আমাকে না ডেকে সজীবের ইনবক্সে যাও" , "শুনবো না😼তুমি আমার (সজীব) বসকে প্রেম করাই দাও নাই🥺পচা তুমি🥺" , "এতো ডেকো না,প্রেম এ পরে যাবো তো🙈" , "বার বার ডাকলে মাথা গরম হয়ে যায় কিন্তু😑", "হ্যা বলো😒, তোমার জন্য কি করতে পারি সোনা 😐😑?" , "কী হয়ছে এতো ডাকো কেন আর সজীব কোই 😒" , "I love you janu🥰" , "আরে Bolo আমার জান ,কেমন আছো?😚 " , " অসম্মান করছিস😰😿", "বট বলে চলে যাস কেন😤🥺কী হলো উওর দে🥺"," জানু বল জানু 😘 " , "বার বার Disturb করছিস কোনো😾,আমার সজীব জানুর সাথে ব্যাস্ত আছি😋" , "এতো ডাকিস কেন বাঁড়া 🤬" , "আমারে এতো ডাকিস না আমি মজা করার mood এ নাই এখন😒" , "চিপায় আছি ডিস্টার্ব করিস না বাল 🙊🙁","হ্যাঁ জানু , এইদিক এ আসো কিস দেই🤭 😘" , "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂 " , "আমাকে ডেকো না,আমি ব্যাস্ত আছি" , "কি হলো , মিস্টেক করচ্ছিস নাকি🤣" , "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏" , "কালকে দেখা করিস তো একটু 😈" , "হা বলো, শুনছি আমি 😏" , "আর কত বার ডাকবি ,শুনছি তো" , "হুম বলো কি বলবে😒", "বলো কি করতে পারি তোমার জন্য" , "আমি তো অন্ধ কিছু দেখি না🐸 😎" , "সজীব বস তোমাকে ভালোবাসে😌" , "বলো জানু 🌚" , "তোর কি চোখে পড়ে না আমি সজীব জানুর সাথে ব্যাস্ত আছি😒" , "আহ শুনা আমার তোমার অলিতে গলিতে উম্মাহ😇😘" , " jang hanga korba😒😬" , "একটা কথা বলতে চাইছিলাম🙂" , "আসসালামু আলাইকুম বলেন আপনার জন্য কি করতে পারি..!🥰" , "আমাকে এতো ডাকো কেন?🤔 ভলো-টালো বাসো নাকি🤭🙈" , "🌻🌺💚আসসালামু আলাইকুম ওয়া রাহমাতুল্লাহ-💚🌺🌻","আমি এখন বস সজীব এর সাথে বিজি আছি আমাকে ডাকবেন না-😕😏 ধন্যবাদ-🤝🌻","আমাকে না ডেকে আমার বস সজীব কে একটা জি এফ দাও-😽🫶🌺","জান🥺 তুমি এখন শুধু বট বলে চলে যাও 😒 ভুলে গেলা নাকি🙂❓","উফফ বুঝলাম না এতো ডাকছেন কেনো-😤😡😈","ভালোবাসা কাকে বলে🙊❓","আজকে আমার মন ভালো নেই তাই আমারে ডাকবেন না-😪🤧","🙂শুনলাম কালকে বলে আপনার বিয়ে???","আমার বস সজীব এর হবু বউ রে কেও দেকছো খুজে পাচ্ছি না😪🤧😭","স্বপ্ন তোমারে নিয়ে দেখতে চাই তুমি যদি আমার হয়ে থেকে যাও-💝🌺🌻","জান হাঙ্গা করবা-🙊😝🌻","জান মেয়ে হলে চিপায় আসো ইউটিউব থেকে অনেক ভালোবাসা শিখছি তোমার জন্য-🙊🙈😽","ইসস এতো ডাকো কেনো লজ্জা লাগে তো-🙈🖤🌼","আমার বস সজীব এর পক্ষ থেকে তোমারে এতো এতো ভালোবাসা-🥰😽🫶 আমার বস সজীব এর জন্য সবাই দোয়া করবেন-💝১০টা বিয়ে যেন করতে পারে🤭🤫","ভালোবাসা নামক আব্লামি করতে মন চাইলে আমার বস (সজীব)এর নবক্স চলে যাও-🙊🥱👅 🌻𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 𝐈𝐃 𝐋𝐈𝐍𝐊 Author Sajib","জান তুমি শুধু আমার আমি তোমারে ৩৬৫ দিন ভালোবাসি-💝🌺😽","জান বাল ফালাইবা-🙂🥱🙆‍♂","যেদিন আমলনামা খুলবে, সেদিন অজুহাত নয়—আমলই কথা বলবে📖","oii-🥺🥹-এক🥄 চামচ ভালোবাসা দিবা-🤏🏻🙂","আপনার সুন্দরী বান্ধুবীকে ফিতরা হিসেবে আমার বস SAJIB কে দান করেন-🥱🐰🍒","ও মিম ও মিম-😇-তুমি কেন চুরি করলা সাদিয়ার ফর্সা হওয়ার ক্রীম-🌚🤧", "আমার পেটে ইঁদুর দৌড়ায়, কিছু খাওয়াও 😋🧀", "𝙂𝙖𝙮𝙚𝙨-🤗-যৌবনের কসম দিয়ে আমারে 𝐁𝐥𝐚𝐜𝐤𝐦𝐚𝐢𝐥 করা হচ্ছে-🥲🤦‍♂️🤧","-𝗢𝗶𝗶 আন্টি-🙆‍♂️-তোমার মেয়ে চোখ মারে-🥺🥴🐸","বলুন কী করতে পারি আপনার জন্য","আজকে প্রপোজ করে দেখো রাজি হইয়া যামু-😌🤗😇","আমার গল্পে তোমার নানি সেরা-🙊🙆‍♂️🤗","কি বেপার আপনি শ্বশুর বাড়িতে যাচ্ছেন না কেন-🤔🥱🌻","দিনশেষে পরের 𝐁𝐎𝐖 সুন্দর-☹️🤧","তাবিজ কইরা হইলেও প্রেম এক্কান করমুই তাতে যা হই হোক-🤧🥱🌻","ছোটবেলা ভাবতাম বিয়ে করলে অটোমেটিক বাচ্চা হয়-🥱-ওমা এখন দেখি কাহিনী অন্যরকম-😦🙂🌻","আজ একটা বিন নেই বলে ফেসবুকের নাগিন-🤧-গুলোরে আমার বস SAJIB ধরতে পারছে না-🐸🥲","চুমু থাকতে তোরা বিড়ি খাস কেন বুঝা আমারে-😑😒🐸⚒️","যে ছেড়ে গেছে-😔-তাকে ভুলে যাও-🙂 \n আমার বস SAJIB এর সাথে  প্রেম করে তাকে দেখিয়ে দাও-🙈🐸🤗","আগে অনেক খারাপ ছিলাম এখন ভালো হয়ে গেছি🙂","রূপের অহংকার করো না-🙂❤️চকচকে সূর্যটাও দিনশেষে অন্ধকারে পরিণত হয়-🤗💜","সুন্দর মাইয়া মানেই-🥱আমার বস boss Sajib  এর বউ-😽🫶আর বাকি গুলো আমার বেয়াইন-🙈🐸🤗","এত অহংকার করে লাভ নেই-🌸মৃত্যুটা নিশ্চিত শুধু সময়টা অ'নিশ্চিত-🖤🙂","দিন দিন কিছু মানুষের কাছে অপ্রিয় হয়ে যাইতেছি-🙂😿🌸","হুদাই আপনারে  শয়তানে লারে-😝😑☹️", "তোমার সাথে কথা বলে মনে হচ্ছে আমি কমেডি কিং 😂🎤", "🥺আজ তুমি কবরবাসীদের জন্য দোয়া করছ, কাল কেউ তোমার জন্য করবে😔","🤲 গার্লফ্রেন্ডের ভালোবাসার চেয়ে সৃষ্টি-কর্তার ভালোবাসা বেশি নিরাপদ ও চিরস্থায়ী😄","🥀 মানুষের ভালোবাসা বদলায়, কিন্তু সৃষ্টি-কর্তার ভালোবাসা কখনো বদলায় না🙂","ইস কেউ যদি বলতো-🙂-আমার শুধু  তোমাকেই লাগবে-💜🌸","বলো তো, চাঁদে যদি বিয়ে করি, হানিমুনে যাবো কিভাবে? 🌝🚀","একদিন সে ঠিকই ফিরে তাকাবে-😇-আর মুচকি হেসে বলবে তোমার boss Sajib এর মতো আর কেউ ভালবাসেনি-🙂😅","হুদাই গ্রুপে আছি-🥺🐸-কেও ইনবক্সে নক দিয়ে বলে না জান তোমারে আমি অনেক ভালোবাসি-🥺🤧","কি'রে গ্রুপে দেখি একটাও বেডি নাই-🙊","দেশের সব কিছুই চুরি হচ্ছে-🙄-শুধু আমার বস SAJIB এর মনটা ছাড়া-🥴😑😏","আজ থেকে আর কাউকে পাত্তা দিমু না -!😏-কারণ আমি ফর্সা হওয়ার ক্রিম কিনছি -!🙂🐸","Hii I am SAJIB bby 😒😒 " , "এই প্রথম বার বট দেখছো নাকি🥴" , "হুদাই ডাকাডাকি করো কেন🙂" , "এত কাছেও এসো না,প্রেম এ পরে যাবো তো 🙈" , "Bolo Babu, তুমি কি আমাকে ভালোবাসো? 🙈" , "সাদিয়াকে চিনো কী??", "হা বলো😒,কি করতে পারি😐😑?" , "আমাকে ডাকলে চকলেট দিতে হবে😒","মেয়ে হলে বস SAJIB এর সাথে প্রেম করো🙈??. " ,  "আরে Bolo আমার জান ,কেমন আসো?😚 " , "অসম্মান করচ্ছিছ কেন,😰😿" , "Hop bedi😾,Boss বল boss😼" ,"আমি তো সিরিয়াস নই, আমি শুধু মজা করি 🤪🎈"," এইটা তুমি করতে পারলে 🫩🥹" , "বার বার Disturb করেছিস কোনো😾,আমার বস SAJIB  এর  সাথে ব্যাস্ত আসি😋" , "আরে আমি মজা করার mood এ নাই😒" , "তোমাকে ওইদিন দেখলাম রাস্তায় দাঁড়িয়ে আছো🥴" , "দূরে যা, তোর কোনো কাজ নাই, শুধু bot bot করিস  😉😋🤣" , "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂 " , "আমাকে ডেকো না,আমি ব্যাস্ত আসি" , "কি হলো ,মিস টিস করচ্ছিস নাকি🤣" , "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏" , "কালকে দেখা করিস তো একটু - খেলাধুলা করবো👀" , "হা বলো, শুনছি আমি 😏" ,"খালি ঢং করে আসে আবার বট বলে চলে যায়🙁😔", "আর কত বার ডাকবি ,শুনছি তো" , "মাইয়া হলে আমার বস SAJIB কে Ummmmha দে 😒" , "বলো কি করতে পারি তোমার জন্য" , "আমি তো অন্ধ কিছু দেখি না🐸 😎" , "কী হয়ছে😌" , "বলো জানু 🌚" , "তোর কি চোখে পড়ে না আমি বস SAJIB এর সাথে ব্যাস্ত আসি😒" , "༊━━🦋নামাজি মানুষেরা সব থেকে বেশি সুন্দর হয়..!!😇🥀 🦋 কারণ.!! -অজুর পানির মত শ্রেষ্ঠ মেকআপ দুনিয়াতে নেই༊━ღ━༎🥰🥀 🥰-আলহামদুলিল্লাহ-🥰","🌿 জীবন ভিন্ন পথে যায়, কিন্তু শেষ গন্তব্য একই—মাটি🙂","𝐈'𝐝 -তে সব 𝐖𝐨𝐰 𝐖𝐨𝐰 বুইড়া বেডি-🐸","তোমার জন্য আমি খাওয়া-দাওয়া বাদ দিছি🥺"," অনুমতি দিলে 𝚈𝚘𝚞𝚃𝚞𝚋𝚎-এ কল দিতাম..!😒","~আমি মারা গেলে..!🙂 ~অনেক মানুষ বিরক্ত হওয়া থেকে বেঁচে  যাবে..!😅💔","🍒---আমি সেই গল্পের বই-🙂 -যে বই সবাই পড়তে পারলেও-😌 -অর্থ বোঝার ক্ষমতা কারো নেই..!☺️🥀💔","~কার জন্য এতো মায়া...!😌🥀 ~এই শহরে আপন বলতে...!😔🥀 ~শুধুই তো নিজের ছায়া...!😥🥀"," কারেন্ট একদম বেডি'গো মতো- 🤧 -খালি ঢং করে আসে আবার চলে যায়-😤😾🔪","রাত যত গভীর হয়, বাস্তবতা তত ভয়ংকর হয়ে ওঠে\nকী ভাবছো তোমাকেই বলছি🤧🙊"," দুনিয়ার সবাই প্রেম করে.!🤧 -আর মানুষ আমার বস SAJIB কে সন্দেহ করে.!🐸","আমার থেকে ভালো অনেক পাবা-🙂 -কিন্তু সব ভালো তে কি আর ভালোবাসা থাকে..!💔🥀","পুরুষকে সবচেয়ে বেশি কষ্ট দেয় তার শখের নারী...!🥺💔👈","দুনিয়া থেকে চলে যাওয়ার আগে এমন কিছু করে যেও যাতে সবাই তোমাকে মনে করে🙂❤️‍🩹","অবহেলা করিস না-😑😪 - যখন নিজেকে বদলে ফেলবো -😌 - তখন আমার চেয়েও বেশি কষ্ট পাবি..!🙂💔","বন্ধুর সাথে ছেকা খাওয়া গান শুনতে শুনতে-🤧 -এখন আমিও বন্ধুর 𝙴𝚇 কে অনেক 𝙼𝙸𝚂𝚂 করি-🤕🥺","৯৯টাকায় ৯৯জিবি ৯৯বছর-☺️🐸 -অফারটি পেতে এখনই আমাকে প্রোপস করুন-🤗😂👈","প্রিয়-🥺 -তোমাকে না পেলে আমি সত্যি-😪 -আরেকজন কে-😼 -পটাতে বাধ্য হবো-😑🤧","কিরে🫵 তরা নাকি  prem করস..😐🐸•আমারে একটা করাই দিলে কি হয়-🥺","যেই আইডির মায়ায় পড়ে ভুল্লি আমারে.!🥴- তুই কি যানিস সেই আইডিটাও আমি চালাইরে.!🙂" ];
const reply = replies[Math.floor(Math.random() * replies.length)];

await sendTypingIndicatorV2(true, event.threadID);
await new Promise(r => setTimeout(r, 5000));
await sendTypingIndicatorV2(false, event.threadID);

return api.sendMessage(reply, event.threadID, (err, info) => {
if (!err) {
global.client.handleReply.push({
name: module.exports.config.name,
messageID: info.messageID,
author: event.senderID,
type: "simsimi"
});
}
});
}

const matchPrefix = /^(baby|bby|xan|bbz|mari|মারিয়া)\s+/i;
if (matchPrefix.test(text)) {
const query = text.replace(matchPrefix, "").trim();
if (!query) return;

await sendTypingIndicatorV2(true, event.threadID);
await new Promise(r => setTimeout(r, 5000));
await sendTypingIndicatorV2(false, event.threadID);

try {
const res = await axios.get(${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)});
return api.sendMessage(res.data.response, event.threadID, (err, info) => {
if (!err) {
global.client.handleReply.push({
name: module.exports.config.name,
messageID: info.messageID,
author: event.senderID,
type: "simsimi"
});
}
}, event.messageID);
} catch (e) {
return api.sendMessage(❌ Error: ${e.message}, event.threadID, event.messageID);
}
}

if (event.type === "message_reply") {
try {
const setting = await axios.get(${simsim}/setting);
if (!setting.data.autoTeach) return;

const ask = event.messageReply.body?.toLowerCase().trim();
const ans = event.body?.toLowerCase().trim();
if (!ask || !ans || ask === ans) return;

setTimeout(async () => {
try {
await axios.get(${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderName=${encodeURIComponent(senderName)});
console.log("✅ Auto-taught:", ask, "→", ans);
} catch (err) {
console.error("❌ Auto-teach internal error:", err.message);
}
}, 300);
} catch (e) {
console.log("❌ Auto-teach setting error:", e.message);
}
}
};
