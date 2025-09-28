import React from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { colors } from '@/lib/theme';
import * as ExpoSplash from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete?: () => void;
}

export default function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current; // controls overall opacity during fade-out
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current; // start slightly smaller
  const logoFade = React.useRef(new Animated.Value(1)).current; // keep logo visible until fade-out

  React.useEffect(() => {
    let mounted = true;


    // Ensure native splash is hidden so our custom splash is visible
    ExpoSplash.hideAsync().catch(() => {});

    // Expand the logo slowly, then hold, then fade out the whole view
    const expand = Animated.timing(scaleAnim, {
      toValue: 1.08,
      duration: 1500, // Shorter expansion
      useNativeDriver: true,
    });

    const hold = Animated.delay(1000); // Shorter hold time

    const fadeOut = Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500, // Shorter fade out
      useNativeDriver: true,
    });

    Animated.sequence([expand, hold, fadeOut]).start(() => {
      if (!mounted) return;
      onAnimationComplete?.();
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoFade,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // White background
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: {
    width: width,
    height: 160,
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: colors.lightBlue,
    fontWeight: '500',
    textAlign: 'center',
  },
});
