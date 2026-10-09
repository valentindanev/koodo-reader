import TextToSpeech from "./component";

jest.mock("../../assets/lib/kookit-extra-browser.min", () => ({
  ConfigService: { getReaderConfig: () => "", getAllListConfig: () => [] },
  HighlightUtil: class {},
}));
jest.mock("../../constants/dropdownList", () => ({ speedList: { option: [] } }));
jest.mock("../../utils/common", () => ({ isReadingRawPDF: (book) => book?.format === "PDF" }));
jest.mock("../../utils/reader/ttsUtil", () => ({}));
jest.mock("../../utils/request/user", () => ({}));
jest.mock("../../utils/request/reader", () => ({}));

test.each(["single", "double", "scroll"])("sentence following respects %s mode", (mode) => {
  const reader = new TextToSpeech({ readerMode: mode, currentBook: { format: "EPUB" }, htmlBook: { rendition: {} } });
  reader.nodeList = [{ text: "Sentence." }];
  reader.narrationFollow.follow = jest.fn();
  reader.followSentence(0);
  expect(reader.narrationFollow.follow).toHaveBeenCalledTimes(mode === "scroll" ? 1 : 0);
});

test("raw PDF retains its existing follow behavior", () => {
  const reader = new TextToSpeech({ readerMode: "scroll", currentBook: { format: "PDF" }, htmlBook: { rendition: {} } });
  reader.nodeList = [{ text: "Sentence." }];
  reader.narrationFollow.follow = jest.fn();
  reader.followSentence(0);
  expect(reader.narrationFollow.follow).not.toHaveBeenCalled();
});
