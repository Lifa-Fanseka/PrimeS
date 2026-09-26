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
 *
 * Also accepts an externally-controlled `isActive` prop, for contexts
 * like a vertically-swipeable feed where many VideoPlayer instances
 * can be mounted on the same screen at once (List virtualization keeps
 * neighbors mounted for smooth scrolling) — the screen itself never
 * loses focus while swiping between them, so `useIsFocused` alone
 * can't tell which one should actually be playing. The parent screen
 * sets `isActive={true}` only on whichever item is currently centered.
 * Defaults to true so every existing usage elsewhere in the app is
 * unaffected — this only matters when a parent explicitly passes it.
 */
export default function VideoPlayer({ uri, autoPlay = true, isActive = true, nativeControls = true, style }) {
  const isFocused = useIsFocused();

  const player = useVideoPlayer(uri, (player) => {
    player.loop = false;
    if (autoPlay && isActive) {
      player.play();
    }
  });

  useEffect(() => {
    if (!isFocused || !isActive) {
      player.pause();
    } else if (isActive && autoPlay) {
      player.play();
    }
  }, [isFocused, isActive, autoPlay, player]);

  return (
    <VideoView
      style={[styles.video, style]}
      player={player}
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture
      nativeControls={nativeControls}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
  },
});