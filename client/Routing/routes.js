import React, { Component } from "react";
import { createStackNavigator } from "react-navigation";

import LandingPage from "../Screens/LandingPage";
import ChatRoom from "../Screens/ChatRoom";

const RootStack = createStackNavigator(
  {
    LandingPage: {
      screen: LandingPage,
      navigationOptions: ({ navigation }) => ({
        header: null
      })
    },
    ChatRoom: {
      screen: ChatRoom,
      navigationOptions: ({ navigation }) => ({
        header: null
      })
    }
  },
  {
    initialRouteName: 'LandingPage'
  }
);

export default class AppRoutes extends Component {
  render() {
    return <RootStack />;
  }
}
