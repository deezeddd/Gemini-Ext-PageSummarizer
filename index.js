const summarizeBtn = document.getElementById("summarizeBtn");
const summaryDiv = document.getElementById("summary");
const loaderDiv = document.getElementById("loader");
const promptUrl =
  "https://script.googleusercontent.com/macros/echo?user_content_key=HtYHqIBOsCBibPPbJnYcfXGMcLxXYZIDs1IOatDUaX39NDNLjU5GXb9eiH6Y0p4u_kyOz_MGJep9nwspqW1CJAxfQ2mPVPWZm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnPB9v6rBXtIuBenO6xJ85zvn4WoHPs9PFybwZEppd4OlTJS5XnEPE9mRHbpHN7T3HeIFTBRWHFAzDBFb-NhS64WW6DXOMK33Zw&lib=MyxPzM7VGBACWk4L571PLpM4p6xlHnJ7v";

document.getElementById("summarizeBtn").addEventListener("click", async () => {
  // 1. Get Current Tab's URL
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.indexOf("http") == -1) {
    console.log("Not a valid URL");
    return;
  }
  let currentUrl = tab.url;

  // 2.0 Fetch prompt from PromptDocs (google) -> make a google script of docs to customize your prompt anytime else no problem! 
  let promptFetch = await fetch(promptUrl); 
  let promptFromDocs = await promptFetch.json();

  // 2. Fetch Page Content
  let response = await fetch(currentUrl);
  
  let promptTemplate =
    promptFromDocs.data ??
    `You are a helpful assistant. Summarize the page contents based on the provided HTML, don't mention about the content related to HTML 
  just mention your findings for a simple human, also don't included anything related to programming unless the content states, keep your mood according to the content.`;
  let prompt = promptTemplate + `Here's the URL of current page for more help : ${currentUrl}. Here's the generated transcript (if any):` + await getYTTranscript(currentUrl);
  let pageContent = prompt + (await response.text());
  console.log(pageContent);

  // 3. Enter your Gemini API Key
  let apiKey = "APIHERE!!";

  // 4. Call Gemini API
  let summary = await getSummaryFromGemini(apiKey, pageContent);

  console.log("Working on it");
  // 5. Display Summary
  document.getElementById("summary").innerText = summary;
});

//Gemini - Process
async function getSummaryFromGemini(apiKey, text) {
console.log(text);
  let apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  let response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contents: { parts: { text } } }),
  });

  let data = await response.json();
  let ans = data.candidates[0].content.parts[0].text;
  return ans;
}

async function getYTTranscript(ytUrl) {
  if (ytUrl.indexOf("youtube") == -1 && ytUrl.indexOf("youtu.be") == -1) {
    return "";
  } // only for YT video to save time

  let yt = await fetch("https://tactiq-apps-prod.tactiq.io/transcript", {
    headers: {
      accept: "*/*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      "content-type": "application/json",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium";v="129", "Not=A?Brand";v="8"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
    },
    referrer: "https://tactiq.io/",
    referrerPolicy: "strict-origin-when-cross-origin",
    body: `{"videoUrl":"${ytUrl}","langCode":"en"}`,
    method: "POST",
    mode: "cors",
    credentials: "omit",
  });
  data = await yt.json();
  let transcript = "";
  data.captions.forEach((e) => {
    transcript += e.text + " ";
  });
  console.log(transcript);
  return transcript;
}
