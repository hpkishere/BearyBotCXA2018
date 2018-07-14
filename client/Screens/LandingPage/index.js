import React, { Component } from "react";
import { Text, View, Image, TouchableOpacity } from "react-native";

import styles from "./styles";

export default class LandingPage extends Component {
  render() {
    return (
      <View style={styles.rootContainer}>
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require('../../Assets/logo.png')}
          />
          <Text style={styles.title}>Beary</Text>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => this.props.navigation.navigate("ChatRoom")}
          >
            <Text style={styles.buttonText}>Start Chatting!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}
