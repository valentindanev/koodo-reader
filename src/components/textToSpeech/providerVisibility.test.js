import React, { act } from "react";
import { createRoot } from "react-dom/client";
import TextToSpeech from "./component";
import { ConfigService } from "../../assets/lib/kookit-extra-browser.min";
import TTSUtil from "../../utils/reader/ttsUtil";
import { parseHiddenProviders, visibleVoices, availableVoice } from "../../utils/reader/voiceProviders";

jest.mock("../../assets/lib/kookit-extra-browser.min", () => {
  const values = {};
  return {
    ConfigService: {
      getReaderConfig: (key) => values[key] || "",
      setReaderConfig: (key, value) => { values[key] = value; },
      getAllListConfig: () => [],
      reset: () => Object.keys(values).forEach((key) => delete values[key]),
    },
    HighlightUtil: class {},
  };
});
jest.mock("../../constants/dropdownList", () => ({ speedList: { option: [] } }));
jest.mock("../../utils/common", () => ({
  getAllVoices: (plugins) => plugins.flatMap((plugin) => plugin.voiceList || []),
  langToName: (lang) => lang,
  isReadingRawPDF: (book) => book?.format === "PDF",
}));
jest.mock("../../utils/reader/ttsUtil", () => ({
  getVoiceList: (plugins) => plugins.flatMap((plugin) => plugin.voiceList || []),
  stopAudio: jest.fn(() => Promise.resolve()),
}));
jest.mock("../../utils/request/user", () => ({ fetchUserInfo: jest.fn() }));
jest.mock("../../utils/request/reader", () => ({ getSplitSentence: jest.fn() }));
jest.mock("react-device-detect", () => ({ isElectron: true }));
jest.mock("react-i18next", () => ({ Trans: ({ children }) => children }));
jest.mock("react-hot-toast", () => ({ __esModule: true, default: Object.assign(jest.fn(), { error: jest.fn() }) }));

const localKey = "kokoro-fastapi-voice-plugin";
const officialKey = "official-ai-voice-plugin";
const local = { name: "Bella", displayName: "Local Bella", locale: "en-US", plugin: localKey };
const official = { name: "Bella", displayName: "Official Bella", locale: "en-US", plugin: officialKey };
const plugins = [
  { key: localKey, type: "voice", displayName: "Kokoro FastAPI", voiceList: [local] },
  { key: officialKey, type: "voice", displayName: "Official", voiceList: [official] },
];
let container, root, component;
const mount = async () => {
  root = createRoot(container);
  await act(async () => {
    root.render(<TextToSpeech ref={(value) => { component = value; }}
      plugins={plugins} currentBook={{ key: "book" }} t={(text) => text}
      isReading={true} isAuthed={false} />);
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
  // Effects start after render commits, so wait for the system voice discovery interval.
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
};
const checkbox = (label) => Array.from(container.querySelectorAll("label"))
  .find((element) => element.textContent.includes(label)).querySelector("input");
const toggle = async (label) => {
  await act(async () => { checkbox(label).click(); });
};
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  ConfigService.reset();
  jest.clearAllMocks();
  window.speechSynthesis = {
    cancel: jest.fn(),
    getVoices: () => [{ name: "System voice", lang: "en-US" }],
  };
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container.remove();
});
test("local-only provider menu persists across remount and can restore official voices", async () => {
  ConfigService.setReaderConfig("voiceName", official.name);
  ConfigService.setReaderConfig("voiceEngine", officialKey);
  await mount();
  await toggle("System voices");
  await toggle("Koodo official voices");
  const options = Array.from(container.querySelector("#text-speech-voice").options)
    .filter((option) => option.value).map((option) => option.value);
  expect(options).toEqual(["Bella#" + localKey]);
  expect(ConfigService.getReaderConfig("voiceEngine")).toBe(localKey);
  await act(async () => component.setState({ multiRoleEnabled: true }));
  expect(Array.from(container.querySelector("#multi-role-voice-type").options)
    .filter((option) => option.value).map((option) => option.value)).toEqual(["custom"]);
  expect(checkbox("Koodo official voices").checked).toBe(false);
  await act(async () => root.unmount());
  await mount();
  expect(checkbox("Koodo official voices").checked).toBe(false);
  expect(container.querySelector("#text-speech-voice").value).toBe("Bella#" + localKey);
  await toggle("Koodo official voices");
  expect(container.querySelector("#text-speech-voice").options.length).toBe(3);
  expect(ConfigService.getReaderConfig("voiceEngine")).toBe(localKey);
});
test("hiding every provider clears selection and keeps the recovery menu accessible", async () => {
  await mount();
  await toggle("System voices");
  await toggle("Koodo official voices");
  await toggle("Local Kokoro");
  expect(ConfigService.getReaderConfig("voiceName")).toBe("");
  expect(ConfigService.getReaderConfig("voiceEngine")).toBe("");
  expect(container.querySelector('[role="status"]').textContent).toContain("Enable an integration");
  expect(container.querySelectorAll(".tts-provider-option")).toHaveLength(3);
  await toggle("Local Kokoro");
  expect(ConfigService.getReaderConfig("voiceEngine")).toBe(localKey);
});
test("hiding a provider stops active playback and clears hidden multi-role selections", async () => {
  ConfigService.setReaderConfig("multiRoleMaleVoice", official.name);
  ConfigService.setReaderConfig("multiRoleMaleEngine", officialKey);
  await mount();
  await act(async () => component.setState({ isAudioOn: true }));
  await toggle("Koodo official voices");
  expect(TTSUtil.stopAudio).toHaveBeenCalled();
  expect(component.state.isAudioOn).toBe(false);
  expect(ConfigService.getReaderConfig("multiRoleMaleEngine")).toBe("");
});
test("provider identity distinguishes same-named voices and never chooses a paid fallback", () => {
  expect(availableVoice([local, official], "Bella", officialKey, "en-US")).toBe(official);
  expect(availableVoice([official], "Missing", localKey, "en-US")).toBeUndefined();
  expect(visibleVoices([local, official], [officialKey])).toEqual([local]);
  expect(parseHiddenProviders('{broken')).toEqual([]);
  expect(parseHiddenProviders('["system",7,"system"]')).toEqual(["system"]);
});

test("sentence follow runs only in continuous text mode, preserving both paginated modes", () => {
  for (const mode of ["single", "double", "scroll"]) {
    const reader = new TextToSpeech({ readerMode: mode, currentBook: { format: "EPUB" }, htmlBook: { rendition: {} } });
    reader.nodeList = [{ text: "Sentence." }];
    reader.activeNarrationRange = {};
    reader.narrationFollow.followRange = jest.fn();
    reader.followSentence(0);
    expect(reader.narrationFollow.followRange).toHaveBeenCalledTimes(mode === "scroll" ? 1 : 0);
  }
});
