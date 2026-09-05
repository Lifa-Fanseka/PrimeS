import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useIsFocused } from '@react-navigation/native';

/**
 * Real video playback, used anywhere a highlight video needs to
 * actually play (not just show a static thumbnail).
 *
 * Automatically pauses when its screen loses focus (navigating away,
 * switching tabs) — otherwise the player keeps running in the
 * background since React Navigation often keeps prior screens mounted,
 * and audio would keep playing after leaving the page.
 */
export default function VideoPlayer({ uri, autoPlay = true, style }) {
  const isFocused = useIsFocused();

  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    if (autoPlay) {
      player.play();
    }
  });

  useEffect(() => {
    if (!isFocused) {
      player.pause();
    }
  }, [isFocused, player]);

  return (
    <VideoView
      style={[styles.video, style]}
      player={player}
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture
      nativeControls
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
  },
});