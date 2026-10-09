import React from "react";
import { SpeechDialogProps, SpeechDialogState } from "./interface";
import "./speechDialog.css";
import TextToSpeech from "../../textToSpeech";

class SpeechDialog extends React.Component<
  SpeechDialogProps,
  SpeechDialogState
> {
  constructor(props: SpeechDialogProps) {
    super(props);
    this.state = {
      isShowExportAll: false,
    };
  }
  componentDidMount(): void {
    this.props.handleFetchPlugins();
  }
  render() {
    return (
      <>
        <div
          className="sort-dialog-container"
          onMouseEnter={() => {
            this.props.handleSpeechDialog(true);
          }}
          style={{
            left: "auto",
            top: "auto",
            bottom: "60px",
            width: "300px",
            height: "auto",
            maxHeight: "calc(100vh - 80px)",
            overflowY: "auto",
            right: this.props.isSettingLocked || this.props.isDockedRight ? 370 : 65,
          }}
        >
          <div className="speech-dialog-header">
            <span className="speech-dialog-title"></span>
            <span
              className="icon-close speech-dialog-close"
              onClick={() => {
                this.props.handleSpeechDialog(false);
              }}
            ></span>
          </div>
          {this.props.plugins && <TextToSpeech />}
        </div>
      </>
    );
  }
}

export default SpeechDialog;
