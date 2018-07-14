import React, { Component } from "react";
import {
  Keyboard,
  TouchableHighlight,
  View,
  KeyboardAvoidingView
} from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import { getApi, postApi } from "../../Services/api.service";
import determineISOCode from "../../Helper/determineISOCode";
import devConfig from "../../Config/development.json";
import thirdLanguageData from "../../data/thirdLanguage.json";
import logo from "../../Assets/logo.png";

import AWS from "aws-sdk/dist/aws-sdk-react-native";

AWS.config.region = devConfig.AWS_REGION;
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: devConfig.AWS_POOL
});

let lexRunTime = new AWS.LexRuntime();
let lexUserId = "BearyBot" + Date.now();

export default class ChatRoom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      name: "",
      language: "Malay",
      learning: false,
      learningCategory: "",
      conversation: false,
      conversationIndex: null
    };
  }

  componentWillMount() {
    this.setState({
      messages: [
        {
          _id: Math.round(Math.random() * 1000000),
          text: "Hello! What can I do for you today!",
          createdAt: new Date(),
          user: {
            _id: 2,
            name: "Beary",
            avatar: logo
          }
        }
      ]
    });
  }

  onSend(messages = []) {
    const { learning, conversation } = this.state;
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, messages)
    }));

    const messageSent = messages[0].text;
    if (
      messageSent
        .toLowerCase()
        .replace(" ", "")
        .startsWith("whatis")
    ) {
      this.translateSendToBackEnd(messageSent);
    } else if (
      messageSent
        .toLowerCase()
        .replace(" ", "")
        .startsWith("end")
    ) {
      this.setState({ learning: false, conversation: false });
      this.sendToLex(messageSent);
    } else {
      if (!learning && !conversation) {
        this.sendToLex(messageSent);
      } else if (learning) {
        this.sendLearning(messageSent);
      } else {
        this.sendConversation(messageSent);
      }
    }
  }

  translateSendToBackEnd(message) {
    const language = determineISOCode(this.state.language);
    const toBeTranslated = message.slice(9, message.length - 1); // HARD CODED, TEMPORARY!!

    postApi("/translate", {
      toBeTranslated,
      language
    })
      .then(res => {
        this.showBackendResponse(res);
      })
      .catch(err => {
      });
  }

  sendToLex(message) {
    let params = {
      botAlias: "$LATEST",
      botName: "BearyBot",
      inputText: message,
      userId: lexUserId
    };
    lexRunTime.postText(params, (err, data) => {
      if (err) {
        // TODO SHOW ERROR ON MESSAGES
      }
      if (data) {
        this.showResponse(data);
      }
    });
  }

  showBackendResponse(response) {
    this.setState(previousState => ({
      messages: GiftedChat.append(previousState.messages, {
        _id: Math.round(Math.random() * 1000000),
        text: `The translation in ${this.state.language} is "${
          response.data.translation
        }"`,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "Beary",
          avatar: logo
        }
      })
    }));
  }

  showResponse(lexResponse) {
    if (
      lexResponse.intentName === "Introduction" &&
      lexResponse.dialogState === "Fulfilled"
    ) {
      this.setState({
        name: lexResponse.slots.name,
        language: lexResponse.slots.language
      });
    } else if (
      lexResponse.intentName === "ChangeLanguage" &&
      lexResponse.dialogState === "Fulfilled"
    ) {
      this.setState({
        language: lexResponse.slots.language
      });
    } else if (
      lexResponse.intentName === "Learning" &&
      lexResponse.dialogState === "Fulfilled"
    ) {
      this.setState({
        learning: true,
        learningCategory: lexResponse.slots.category
      });
      setTimeout(async () => {
        await this.initiateLearning();
        await this.sendLearning();
      }, 1000);
    } else if (
      lexResponse.intentName === "Conversation" &&
      lexResponse.dialogState === "Fulfilled"
    ) {
      this.setState({
        conversation: true
      });
    } else if (
      lexResponse.intentName === "Third" &&
      lexResponse.dialogState === "Fulfilled"
    ) {
      const thirdLanguage = lexResponse.slots.thirdLanguage.toUpperCase();
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, {
          _id: Math.round(Math.random() * 1000000),
          text: thirdLanguageData[`${thirdLanguage}`],
          createdAt: new Date(),
          user: {
            _id: 2,
            name: "Beary",
            avatar: logo
          }
        })
      }));
    }

    let lexMessage = lexResponse.message;
    if (lexMessage.charAt(0) === '{') {
      lexMessage = JSON.parse(lexMessage)
      lexMessage["messages"].forEach(msg => {
        this.setState(previousState => ({
          messages: GiftedChat.append(previousState.messages, {
            _id: Math.round(Math.random() * 1000000),
            text: msg["value"],
            createdAt: new Date(),
            user: {
              _id: 2,
              name: "Beary",
              avatar: logo
            }
          })
        }));
      });
    } else {
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, {
          _id: Math.round(Math.random() * 1000000),
          text: lexMessage,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: "Beary",
            avatar: logo
          }
        })
      }));
    }
  }

  async initiateLearning() {
    const language = determineISOCode(this.state.language);
    const res = await getApi(
      `/categories/${this.state.learningCategory}/${language}`
    );
    const data = res.data;
    data.forEach(phrase => {
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, {
          _id: Math.round(Math.random() * 1000000),
          text: `${phrase[0]} - ${phrase[1]}`,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: "Beary",
            avatar: logo
          }
        })
      }));
    });
  }

  async sendLearning(answer) {
    const { learningCategory, conversationIndex } = this.state;
    const language = determineISOCode(this.state.language);
    const res = await postApi(`/learning/answer`, {
      language,
      category: learningCategory,
      answeredIndex: conversationIndex,
      answer
    });
    res.data.messages.forEach(message => {
      this.setState(previousState => ({
        conversationIndex: res.data.newIndex,
        messages: GiftedChat.append(previousState.messages, {
          _id: Math.round(Math.random() * 1000000),
          text: message,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: "Beary",
            avatar: logo
          }
        })
      }));
    });
  }

  async sendConversation(message) {
    const language = determineISOCode(this.state.language);
    postApi("/conversation", {
      language,
      message
    }).then(res => {
      const reply = res.data.translatedReply;
      this.setState(previousState => ({
        conversationIndex: res.data.newIndex,
        messages: GiftedChat.append(previousState.messages, {
          _id: Math.round(Math.random() * 1000000),
          text: reply,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: "Beary",
            avatar: logo
          }
        })
      }));
    });
  }

  render() {
    return (
      <TouchableHighlight
        style={{ flex: 1 }}
        underlayColor="transparent"
        onPress={() => {
          Keyboard.dismiss();
        }}
      >
        <View style={{ flex: 1 }}>
          <GiftedChat
            messages={this.state.messages}
            onSend={messages => this.onSend(messages)}
            user={{
              _id: 1
            }}
          />
          <KeyboardAvoidingView behavior={"padding"} />
        </View>
      </TouchableHighlight>
    );
  }
}
