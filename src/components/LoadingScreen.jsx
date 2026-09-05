import React from 'react';
import { View, Text } from 'react-native';
import LottieView from 'lottie-react-native';

export default function LoadingScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      

      <LottieView
        source={require('../../assets/Animations/LoadingAnimation.json')}
        autoPlay
        loop
        style={{
          width: 300,
          height: 300,
        }}
      />
    </View>
  );
}