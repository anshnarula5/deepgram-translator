import "./App.css";
import {  Container, Form, Row } from "react-bootstrap";
import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [languages, setLanguages] = useState([]);
  const [selectedLanguageKey, setLanguageKey] = useState("");

  // configuring mic

  let mediaRecorder = null;
  const allowAudio = async () => {
    try {
      const mediaStream = await window.navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mediaRecorder = new MediaRecorder(mediaStream, { audio: true });
      return mediaRecorder;
    } catch (e) {
      console.log(e);
    }
  };
 
  const handleSpeak = async () => {
    if (mediaRecorder) {
      const socket = new WebSocket("wss://api.deepgram.com/v1/listen", [
        "token",
        "0b6a8377dfa1e87b54a0abd7aa867b5d3a11c310",
      ]);
      socket.onopen = () => {
        console.log("Started");
        mediaRecorder.addEventListener("dataavailable", async (e) => {
          if (e.data.size > 0 && socket.readyState == 1) {
            socket.send(e.data);
          }
        });
        mediaRecorder.start(500);
      };
      socket.onmessage = (message) => {
        const recieved = JSON.parse(message.data);
        const transcript = recieved.channel.alternatives[0].transcript;
        if (transcript && recieved.is_final) {
          console.log(transcript);
          setText(transcript);
        }
      };
      socket.onclose = () => {
        console.log("Closed");
      };
    }
  };

  const audioHandler = async () => {
    mediaRecorder = await allowAudio();
    await handleSpeak();
  };

  // translate text

  const translate = async () => {
    let data = {
      q: text,
      source: "en",
      target: selectedLanguageKey,
    };
    axios.post(`https://libretranslate.de/translate`, data).then((response) => {
      setTranslatedText(response.data.translatedText);
    });
  };
  useEffect(() => {
    axios.get(`https://libretranslate.de/languages`).then((response) => {
      setLanguages(response.data);
    });
  }, []);

  useEffect(() => {
    translate();
  }, [text, selectedLanguageKey]);

  useEffect(() => {
    audioHandler();
  }, []);

  const languageKeyHandler = (selectedLanguage) => {
    setLanguageKey(selectedLanguage.target.value);
  };

  return (
    <>
      <div className="App">
        <h1 className="text-center mt-5">Deepgram Translator</h1>
        <Container classname="container">
          <Row className="row">
            <p>{!text ? <p className="text-muted">Make sure your mic is on</p> : text}</p>
          </Row>
          <Row className="row">
            <p>{!selectedLanguageKey && <p className="text-muted">Select a langouage first</p> }
              {selectedLanguageKey && translatedText ? (
                translatedText
              ) : !translatedText && text ? (
                <p className="text-muted">...Translating</p>
              ) : (
                <p className="text-muted">Say something to translate</p>
              )}
            </p>
          </Row>
          <Form.Select onChange={languageKeyHandler} className="mt-5">
            <option>Please Select Language..</option>
            {languages.map((language) => {
              return <option value={language.code}>{language.name}</option>;
            })}
          </Form.Select>
        </Container>
      </div>
    </>
  );
}

export default App;
